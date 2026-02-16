import api from './api';
import type { CompetitorStatus } from './clubService';

export const competitorService = {
  changeStatus: async (competitorId: string, status: CompetitorStatus) => {
    const { data } = await api.patch(`/competitors/${competitorId}/status`, {
      status,
    });
    return data;
  },

  delete: async (competitorId: string) => {
    await api.delete(`/competitors/${competitorId}`);
    return true;
  },

  getRobots: async (competitorId: string) => {
    const { data } = await api.get(`/competitors/${competitorId}/robots`);
    return data; // Robot[]
  },

  // 🆕 Leer datos completos del competidor (status, club, user.lock, etc.)
  getById: async (competitorId: string) => {
    const { data } = await api.get(`/competitors/${competitorId}`);
    return data; // { status, club, user, ... }
  },
};
