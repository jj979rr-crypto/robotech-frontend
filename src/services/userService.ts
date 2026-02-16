import api from './api';

export const userService = {
  unlockStaff: async (userId: string) => {
    const { data } = await api.patch(`/users/${userId}/unlock-staff`);
    return data;
  },

  unlockCompetitor: async (userId: string) => {
    const { data } = await api.patch(`/users/${userId}/unlock-competitor`);
    return data;
  },
  createJudge: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post('/users/create-judge', credentials);
    return data;
  },
};
