// src/services/authService.ts
import api from './api';

export interface LoginResponse {
  access_token?: string;
  user?: any;
  message?: string;
  require2fa?: boolean;
  userId?: string;
  role?: string;
  staffType?: string;
}

export const authService = {
  // 1. Login Inicial
  login: async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  // 2. Verificar Código 2FA
  verify2fa: async (userId: string, code: string) => {
    const { data } = await api.post<LoginResponse>('/auth/verify-2fa', { userId, code });
    return data;
  },

  // 2.1 Reenviar código 2FA (cuando tengas el endpoint en el backend)
  resend2fa: async (userId: string) => {
    const { data } = await api.post('/auth/resend-2fa', { userId });
    return data;
  },


  // 3. Registro de Competidor
  registerCompetitor: async (data: any) => {
    const response = await api.post('/auth/register-competitor', data);
    return response.data;
  },

  // 4. Consulta RENIEC
  consultarReniec: async (dni: string) => {
    const response = await api.get(`/reniec/${dni}`);
    return response.data;
  },

  // 5. Recuperación de Contraseña
  requestPasswordReset: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },
  
  // 5.1 Verificar código (OTP) para recuperación
  verifyResetCode: async (userId: string, code: string) => {
    const { data } = await api.post('/auth/verify-reset-code', { userId, code });
    return data;
  },

  // 5.2 Cambiar contraseña usando userId (OTP flow en la misma web)
  resetPasswordOnApp: async (userId: string, newPassword: string) => {
    const { data } = await api.post('/auth/reset-password-on-app', { userId, newPassword });
    return data;
  },


  // 6. Registro de Club
  registerClubOwner: async (data: any) => {
    const response = await api.post('/auth/register-club', data);
    return response.data;
  }
};
