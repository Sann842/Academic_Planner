import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTokens, authApi } from "@/lib/api";
import { decodeJwt } from "@/lib/jwt";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from the access token itself, rather than a
    // separately-stored flag that could go stale. The backend embeds
    // is_staff as a real claim (see MyTokenObtainPairSerializer), so this
    // reflects the user's actual permissions, not a guess.
    const { access } = getTokens();
    if (access) {
      const claims = decodeJwt(access);
      if (claims) {
        setIsAuthenticated(true);
        setUsername((claims.username as string) ?? null);
        setIsAdmin(Boolean(claims.is_staff));
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // AuthContext lives outside BrowserRouter (see App.tsx), so it can't
    // call useNavigate() itself to redirect on session expiry. Instead,
    // it just resets isAuthenticated here, and pages that already redirect
    // on !isAuthenticated (Events.tsx, Tasks.tsx) pick it up automatically.
    const handleSessionCleared = () => {
      setIsAuthenticated(false);
      setUsername(null);
      setIsAdmin(false);
    };
    window.addEventListener("auth:session-cleared", handleSessionCleared);
    return () =>
      window.removeEventListener("auth:session-cleared", handleSessionCleared);
  }, []);

  const login = async (user: string, password: string) => {
    const data = await authApi.login(user, password);
    const claims = decodeJwt(data.access);

    setUsername((claims?.username as string) ?? user);
    setIsAdmin(Boolean(claims?.is_staff));
    setIsAuthenticated(true);
  };

  const register = async (user: string, password: string) => {
    await authApi.register(user, password);
  };

  const logout = () => {
    authApi.logout();
    setUsername(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, username, isAdmin, login, register, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};