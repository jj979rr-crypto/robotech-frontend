import api from './api';

export const inscriptionService = {
  // Registrar un robot en un torneo
  inscribirRobot: async (robotId: string, tournamentId: string) => {
    const { data } = await api.post('/inscription', { robotId, tournamentId });
    return data;
  },

  // Obtener inscritos de un torneo (Para ver contra quién peleas)
  getInscritosPorTorneo: async (tournamentId: string) => {
    const { data } = await api.get(`/inscription/tournament/${tournamentId}`);
    return data;
  },
};