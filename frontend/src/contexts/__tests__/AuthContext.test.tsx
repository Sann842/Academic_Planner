    import { describe, it, expect, vi, beforeEach } from "vitest";
    import { render, screen, waitFor, act } from "@testing-library/react";
    import { AuthProvider, useAuth } from "@/contexts/AuthContext";
    import { clearTokens, setTokens } from "@/lib/api";

    // Mock authApi.login/register so tests don't make real network calls, while
    // keeping the real getTokens/setTokens/clearTokens (they're just
    // localStorage + an event dispatch, safe to exercise for real in jsdom).
    vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        authApi: {
        login: vi.fn(),
        register: vi.fn(),
        logout: () => actual.clearTokens(),
        },
    };
    });

    import { authApi } from "@/lib/api";

    // Builds a fake (unsigned - signature content doesn't matter since
    // decodeJwt never verifies it, only the backend does) JWT for testing.
    function fakeJwt(claims: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
    const payload = btoa(JSON.stringify(claims));
    return `${header}.${payload}.fakesignature`;
    }

    // Minimal consumer component to observe context values in tests.
    function Probe() {
    const { isAuthenticated, isAdmin, username, login, logout } = useAuth();
    return (
        <div>
        <span data-testid="authed">{String(isAuthenticated)}</span>
        <span data-testid="admin">{String(isAdmin)}</span>
        <span data-testid="username">{username ?? "none"}</span>
        <button onClick={() => login("someone", "pw")}>login</button>
        <button onClick={() => logout()}>logout</button>
        </div>
    );
    }

    describe("AuthContext", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("restores an authenticated staff session from a token already in localStorage", async () => {
        setTokens(
        fakeJwt({ username: "existinguser", is_staff: true }),
        "refresh-token-value"
        );

        render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
        );

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("true");
        });
        expect(screen.getByTestId("admin").textContent).toBe("true");
        expect(screen.getByTestId("username").textContent).toBe("existinguser");
    });

    it("has no session when localStorage is empty", async () => {
        render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
        );

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("false");
        });
        expect(screen.getByTestId("admin").textContent).toBe("false");
    });

    it("login sets isAdmin from the real is_staff claim, not a username guess", async () => {
        vi.mocked(authApi.login).mockResolvedValue({
        access: fakeJwt({ username: "regularuser", is_staff: false }),
        refresh: "refresh-token-value",
        });

        render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
        );

        await waitFor(() => screen.getByTestId("authed"));

        await act(async () => {
        screen.getByText("login").click();
        });

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("true");
        });
        // Regression check: this user is NOT named "admin", and is_staff is
        // false, so isAdmin must be false - the old code would have checked
        // username === "admin" instead of this real claim.
        expect(screen.getByTestId("admin").textContent).toBe("false");
        expect(screen.getByTestId("username").textContent).toBe("regularuser");
    });

    it("resets state when the session-cleared event fires mid-session (e.g. refresh token expired)", async () => {
        setTokens(
        fakeJwt({ username: "someone", is_staff: true }),
        "refresh-token-value"
        );

        render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
        );

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("true");
        });

        // Simulate what apiRequest() does internally when a refresh attempt
        // fails and the session can no longer be salvaged.
        act(() => {
        clearTokens();
        });

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("false");
        });
        expect(screen.getByTestId("admin").textContent).toBe("false");
        expect(screen.getByTestId("username").textContent).toBe("none");
    });

    it("logout resets state", async () => {
        setTokens(
        fakeJwt({ username: "someone", is_staff: true }),
        "refresh-token-value"
        );

        render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
        );

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("true");
        });

        await act(async () => {
        screen.getByText("logout").click();
        });

        await waitFor(() => {
        expect(screen.getByTestId("authed").textContent).toBe("false");
        });
    });
    });