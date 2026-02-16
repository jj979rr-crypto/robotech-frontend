import api from './api';

// Opcional: tipitos para que sea más claro en el front
export interface Tournament {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  fechaInicio: string;
  fechaFin?: string;
  maxParticipantes?: number;
  minParticipantes?: number;
  inscripcionAbierta?: boolean;
  published?: boolean;
  estado: 'OPEN' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  location?: {
    id: string;
    nombre: string;
    direccion: string;
  };
}

export interface BracketRobotSlot {
  inscriptionId: string;
  robotName: string;
  nickname: string;
  club: string;
}

export interface BracketMatch {
  matchNumber: number;
  round: number; // 1: octavos/16, 2: cuartos, 3: semi, 4: final
  a: BracketRobotSlot | null;
  b: BracketRobotSlot | null;
}

export const tournamentService = {
  // Crear torneo (CreateTournament)
  createTournament: async (data: any) => {
    const { data: resp } = await api.post('/tournament', data);
    return resp;
  },

  // Lista completa para ADMIN (DashboardAdmin)
  getAll: async (): Promise<Tournament[]> => {
    const { data } = await api.get('/tournament');
    return data;
  },

  // Alias para compatibilidad (por si en algún lado usas este nombre)
  getAllTournaments: async (): Promise<Tournament[]> => {
    const { data } = await api.get('/tournament');
    return data;
  },

  // Lista pública (para marketplace / landing)
  getPublicTournaments: async (): Promise<Tournament[]> => {
    const { data } = await api.get('/tournament/public');
    return data;
  },

  // 🟦 Obtener un torneo por id (para el header del bracket)
  getById: async (id: string): Promise<Tournament> => {
    const { data } = await api.get(`/tournament/${id}`);
    return data;
  },

  getTournamentById: async (id: string): Promise<Tournament> => {
    const { data } = await api.get(`/tournament/${id}`);
    return data;
  },

  // Actualizar torneo (DashboardAdmin edición)
  update: async (id: string, payload: any) => {
    const { data } = await api.patch(`/tournament/${id}`, payload);
    return data;
  },

  // Eliminar torneo
  delete: async (id: string) => {
    await api.delete(`/tournament/${id}`);
    return true;
  },

  // Abrir inscripciones
  openInscription: async (id: string) => {
    const { data } = await api.patch(`/tournament/${id}/open-inscription`, {});
    return data;
  },

  closeInscription: async (id: string) => {
    const { data } = await api.patch(
      `/tournament/${id}/close-inscription`,
      {},
    );
    return data;
  },

  // 🧩 Obtener fixture / bracket generado para un torneo
  getFixture: async (id: string): Promise<BracketMatch[]> => {
    const { data } = await api.get(`/tournament/${id}/fixture`);
    return data;
  },
};
