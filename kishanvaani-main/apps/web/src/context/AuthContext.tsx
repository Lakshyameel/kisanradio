import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "EXPERT" | "ADMIN";
  language: string;
  state?: string;
  district?: string;
  phone?: string;
  avatarUrl?: string;
}

import { SendOtpResponse, VerifyOtpPayload, AuthResponse } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role?: "USER" | "EXPERT" | "ADMIN") => Promise<void>;
  googleLogin: (credential: string) => Promise<AuthResponse>;
  sendOtp: (phone: string) => Promise<SendOtpResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<AuthResponse>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("kv_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("kv_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<{ user: User }>("/auth/me");
        setUser(res.data.user);
      } catch {
        localStorage.removeItem("kv_token");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    localStorage.setItem("kv_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const demoLogin = async (role: "USER" | "EXPERT" | "ADMIN" = "USER") => {
    const res = await api.post<{ token: string; user: User }>("/auth/demo-login", { role });
    localStorage.setItem("kv_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const googleLogin = async (credential: string) => {
    const res = await api.post<AuthResponse>("/auth/google", { credential });
    localStorage.setItem("kv_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
    const res = await api.post<SendOtpResponse>("/auth/otp/send", { phone });
    return res.data;
  };

  const verifyOtp = async (payload: VerifyOtpPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/otp/verify", payload);
    localStorage.setItem("kv_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data: any) => {
    const res = await api.post<{ token: string; user: User }>("/auth/register", data);
    localStorage.setItem("kv_token", res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("kv_token");
    setToken(null);
    setUser(null);
    // Purge service worker cache so sensitive user data does not persist on shared devices
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_API_CACHE" });
    }
    if ("caches" in window) {
      caches.delete("kishanvaani-api-v1").catch(() => {});
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await api.put<{ user: User }>("/auth/profile", data);
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        demoLogin,
        googleLogin,
        sendOtp,
        verifyOtp,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
