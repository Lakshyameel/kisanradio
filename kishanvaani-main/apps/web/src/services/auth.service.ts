import api from "../lib/api";
import { User } from "../context/AuthContext";

export interface SendOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  expiresInSec: number;
  devOtp?: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
  name?: string;
  state?: string;
  district?: string;
  language?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  isNewUser?: boolean;
  user: User;
}

export const authService = {
  async sendOtp(phone: string): Promise<SendOtpResponse> {
    const res = await api.post<SendOtpResponse>("/auth/otp/send", { phone });
    return res.data;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/otp/verify", payload);
    return res.data;
  },

  async googleAuth(credential: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>("/auth/google", { credential });
    return res.data;
  },
};

export default authService;
