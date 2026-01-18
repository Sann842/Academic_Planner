import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTokens, authApi } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  isAdmin: boolean; // <-- add isAdmin
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // <-- state for admin
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const { access } = getTokens();
    const storedUsername = localStorage.getItem("username");
    const storedIsAdmin = localStorage.getItem("isAdmin") === "true"; // optional persistence

    if (access && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setIsAdmin(storedIsAdmin);
    }
    setIsLoading(false);
  }, []);

  const login = async (user: string, password: string) => {
    await authApi.login(user, password);
    localStorage.setItem("username", user);

    // Determine if user is admin
    // Here we just check username === "admin"; you can replace with API call if backend provides it
    const adminStatus = user === "admin";
    localStorage.setItem("isAdmin", adminStatus.toString());
    setIsAdmin(adminStatus);

    setUsername(user);
    setIsAuthenticated(true);
  };

  const register = async (user: string, password: string) => {
    await authApi.register(user, password);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
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
