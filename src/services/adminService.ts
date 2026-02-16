// URL del Backend
const API_URL = 'http://localhost:3000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const adminService = {
  // --- MÓDULO 1: CLUBES ---
  getAllClubs: async () => {
    try {
      const response = await fetch(`${API_URL}/clubs`, { method: 'GET', headers: getHeaders() });
      if (!response.ok) throw new Error('Error al obtener clubes');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  updateClubStatus: async (clubId: string, status: 'approved' | 'rejected') => {
    const response = await fetch(`${API_URL}/clubs/${clubId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Error actualizando estado');
    return await response.json();
  },

  unlockUser: async (userId: string) => {
    const response = await fetch(`${API_URL}/users/${userId}/unlock-staff`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Error desbloqueando usuario');
    return await response.json();
  },

  // --- MÓDULO 2: TORNEOS (NUEVO) ---
  getAllTournaments: async () => {
    try {
      // Ajusta la ruta si tu backend usa '/tournaments'
      const response = await fetch(`${API_URL}/tournament`, { method: 'GET', headers: getHeaders() });
      if (!response.ok) return []; 
      return await response.json();
    } catch (error) {
      return [];
    }
  },

  deleteTournament: async (id: string) => {
    const response = await fetch(`${API_URL}/tournament/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Error eliminando torneo');
    return true;
  },

  // --- MÓDULO 3: SEDES (NUEVO) ---
  getAllLocations: async () => {
    try {
      // Ajusta la ruta si tu backend usa '/locations'
      const response = await fetch(`${API_URL}/location`, { method: 'GET', headers: getHeaders() });
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      return [];
    }
  },
  
  deleteLocation: async (id: string) => {
    const response = await fetch(`${API_URL}/location/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!response.ok) throw new Error('Error eliminando sede');
    return true;
  }
};