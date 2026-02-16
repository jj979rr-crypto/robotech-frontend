import api from './api';

export const locationService = {
  createLocation: async (data: FormData) => {
    // ✅ No fuerces Content-Type en FormData
    const { data: response } = await api.post('/location', data);
    return response;
  },

  getAllLocations: async () => {
    // ✅ Anti-cache para que veas el cambio de "disponible" al toque
    const { data } = await api.get('/location', { params: { t: Date.now() } });
    return data;
  },

  updateLocation: async (id: string, data: FormData) => {
    const { data: response } = await api.patch(`/location/${id}`, data);
    return response;
  },

  // ✅ NUEVO: cambio rápido de estado (JSON, no FormData)
  updateAvailability: async (id: string, disponible: boolean) => {
    const { data } = await api.patch(`/location/${id}`, { disponible });
    return data;
  },

  deleteLocation: async (id: string) => {
    await api.delete(`/location/${id}`);
  },

  getAvailability: async (id: string, startISO: string, endISO?: string) => {
    const { data } = await api.get(`/location/${id}/availability`, {
      params: { start: startISO, end: endISO },
    });
    return data;
  },
};
