// clubService.ts
import api from './api';

export interface UserOwner {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  dni: string;
  isLocked: boolean;
}

export type ClubStatus = 'pending' | 'approved' | 'rejected';

export interface Club {
  id: string;
  nombre: string;
  direccion: string;
  descripcion?: string;
  status: ClubStatus;
  owner?: UserOwner;
}

export interface ClubTournament {
  id: string;
  nombre: string;
  fechaInicio: string;
  estado: string;
  location?: {
    nombre: string;
    direccion: string;
  };
  inscripcionesCount?: number;
}

export type CompetitorStatus = 'pending' | 'approved' | 'suspended';

export interface CompetitorUser {
  id: string;
  email: string;
  isLocked: boolean;
}

export interface Competitor {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string; 
  nickname: string;
  status?: CompetitorStatus; // opcional por si aún no lo modelas en back
  user?: CompetitorUser;
  
}

export const clubService = {
  // --- ADMIN ---
  getAll: async (): Promise<Club[]> => {
    const { data } = await api.get<Club[]>('/clubs', {
      params: { t: Date.now() },
    });
    return data;
  },

  update: async (
    id: string,
    payload: Partial<Pick<Club, 'nombre' | 'direccion' | 'descripcion'>>,
  ): Promise<Club> => {
    const { data } = await api.patch<Club>(`/clubs/${id}`, payload);
    return data;
  },

  updateStatus: async (id: string, status: ClubStatus): Promise<Club> => {
    const { data } = await api.patch<Club>(`/clubs/${id}`, { status });
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/clubs/${id}`);
    return true;
  },

  // --- DUEÑO DE CLUB ---

  // /clubs/:id/status → { status, codigoInvitacion, descripcion, direccion }
  getStatus: async (clubId: string) => {
    const { data } = await api.get<{
      status: ClubStatus;
      codigoInvitacion: string;
      descripcion?: string;
      direccion?: string;
    }>(`/clubs/${clubId}/status`);
    return data;
  },

  getCompetitors: async (clubId: string): Promise<Competitor[]> => {
    const { data } = await api.get<Competitor[]>(
      `/clubs/${clubId}/competitors`,
    );
    return data;
  },

  getTournaments: async (clubId: string): Promise<ClubTournament[]> => {
    // Ajusta la URL según tu backend real
    const response = await api.get(`/clubs/${clubId}/tournaments`);
    return response.data;
  },
};
