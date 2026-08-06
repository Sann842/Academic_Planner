interface JwtPayload {
    user_id?: string;
    username?: string;
    is_staff?: boolean;
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

    /**
   * Decodes a JWT's payload without verifying its signature. This is safe
   * for reading claims the backend already signed and issued (e.g. showing
   * admin-only UI), but must never be used as a substitute for real
   * server-side permission checks - the backend re-validates the token and
   * enforces permissions independently on every request.
   */
export function decodeJwt(token: string): JwtPayload | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;
        // base64url -> base64, then pad to a multiple of 4
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}