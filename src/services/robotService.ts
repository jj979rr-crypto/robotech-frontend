import api from './api';

export const robotService = {
  getMyRobots: async (competitorId: string) => {
    const { data } = await api.get(`/robot/my-robots/${competitorId}`);
    return data;
  },

  createRobot: async (robotData: any) => {
    const { data } = await api.post('/robot', robotData);
    return data;
  },

  updateStatus: async (robotId: string, status: string) => {
    const { data } = await api.patch(`/robot/${robotId}`, { status });
    return data;
  },

  deleteRobot: async (robotId: string) => {
    const { data } = await api.delete(`/robot/${robotId}`);
    return data;
  },
};
