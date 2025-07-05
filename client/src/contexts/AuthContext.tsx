import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { login as apiLogin, register as apiRegister } from "../api/auth";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // FORCE authentication to TRUE for development
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  
  useEffect(() => {
    console.log("🔍 AUTH DEBUG: isAuthenticated =", isAuthenticated);
    // Also set a fake token to satisfy any localStorage checks
    localStorage.setItem("accessToken", "debug-token-123");
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    console.log("🔍 AUTH DEBUG: Login called, setting authenticated = true");
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string) => {
    console.log("🔍 AUTH DEBUG: Register called, setting authenticated = true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log("🔍 AUTH DEBUG: Logout called (BLOCKED for development)");
    // Don't actually logout in development
    // setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("🔍 AUTH DEBUG: useAuth called, returning isAuthenticated =", context.isAuthenticated);
  return context;
}