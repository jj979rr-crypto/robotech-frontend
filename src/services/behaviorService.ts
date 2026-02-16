// src/services/behaviorService.ts
import api from './api';

export type BehaviorSource = 'CLUB' | 'TOURNAMENT';

// ✅ enum real del backend
export type BehaviorCategory = 'TECHNICAL' | 'CONDUCT' | 'GAME_RULES';

export interface BehaviorEvent {
  id: string;
  source: BehaviorSource;
  category: string;
  type: string;
  severity: number;
  description: string;
  createdAt: string;

  resolvedAt?: string | null;
  resolvedBy?: { id: string; email: string } | null;

  createdBy?: { id: string; email: string };
  club?: { id: string; nombre: string } | null;
  tournament?: { id: string; nombre: string } | null;
  match?: { id: string } | null;
}

export interface CreateClubIncidentPayload {
  category: BehaviorCategory; // importante
  type: string;              // código en inglés
  severity: number;
  description: string;
}

export const behaviorService = {
  createClubIncident: async (competitorId: string, payload: CreateClubIncidentPayload) => {
    const { data } = await api.post(`/behavior/competitors/${competitorId}/club`, payload);
    return data;
  },

  listByCompetitor: async (competitorId: string): Promise<BehaviorEvent[]> => {
    const { data } = await api.get(`/behavior/competitors/${competitorId}`);
    return data;
  },

  resolveEvent: async (eventId: string) => {
    const { data } = await api.patch(`/behavior/events/${eventId}/resolve`);
    return data;
  },

};
