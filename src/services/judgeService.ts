import api from './api';

export const judgeService = {
  // Enviar la nota al backend
  calificarRobot: async (inscriptionId: string, score: number) => {
    // Enviamos PATCH a la ruta que creamos en el controlador
    const { data } = await api.patch(`/inscription/${inscriptionId}/judge`, { score });
    return data;
  }
};