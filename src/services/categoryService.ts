import api from './api';

export interface Category {
  id: number;
  name: string;
  maxWeightGrams: number;
  gameType: string;
}

export const categoryService = {
  // Obtener todas las categorías
  getAll: async () => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
};
