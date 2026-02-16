// src/services/rankingService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type Semester = 1 | 2;

// ===== TIPOS que usa el BACKEND =====
interface CompetitorRankingApiItem {
  position: number;
  competitorId: string;
  nickname: string;
  nombres: string;
  apellidos: string;
  clubId: string;
  clubNombre: string;
  totalPoints: number;
  eventsPlayed: number;
  bestScore: number;
}

interface ClubRankingApiItem {
  position: number;
  clubId: string;
  clubNombre: string;
  totalPoints: number;
  competitorsCount: number;
  inscriptionsCount: number;
}

interface CategoryRankingApiItem {
  position: number;
  categoryId: string;
  categoryName: string;
  totalPoints: number;
  competitorsCount: number;
  clubsCount: number;
}

// ===== TIPOS que usa el RankingPage (UI) =====
export interface CompetitorRankingItem {
  position: number;
  competitorId: string;
  nickname: string;
  nombres: string;
  apellidos: string;
  clubName: string;
  categoryName?: string | null;        // por ahora sin dato real
  tournamentsPlayed: number;
  wins: number;                        // 0 por ahora – los meteremos en el Paso 2
  podiums: number;                     // 0 por ahora
  points: number;
}

export interface ClubRankingItem {
  position: number;
  clubId: string;
  clubName: string;
  tournamentsPlayed: number;
  wins: number;
  podiums: number;
  points: number;
}

export interface CategoryRankingItem {
  position: number;
  categoryId: string;
  categoryName: string;
  tournamentsPlayed: number;
  robotsCount: number;
  points: number;
}

export const rankingService = {
  async getCompetitorRanking(
    year: number,
    semester: Semester,
  ): Promise<CompetitorRankingItem[]> {
    const res = await axios.get<CompetitorRankingApiItem[]>(
      `${API_URL}/ranking/competitors`,
      { params: { year, semester } },
    );

    const data = res.data || [];

    return data.map((row) => ({
      position: row.position,
      competitorId: row.competitorId,
      nickname: row.nickname,
      nombres: row.nombres,
      apellidos: row.apellidos,
      clubName: row.clubNombre,
      categoryName: null, // aún no diferenciamos por categoría
      tournamentsPlayed: row.eventsPlayed,
      wins: 0, // Paso 2: cuando tengamos matches
      podiums: 0,
      points: row.totalPoints,
    }));
  },

  async getClubRanking(
    year: number,
    semester: Semester,
  ): Promise<ClubRankingItem[]> {
    const res = await axios.get<ClubRankingApiItem[]>(
      `${API_URL}/ranking/clubs`,
      { params: { year, semester } },
    );

    const data = res.data || [];

    return data.map((row) => ({
      position: row.position,
      clubId: row.clubId,
      clubName: row.clubNombre,
      tournamentsPlayed: row.inscriptionsCount, // aprox por ahora
      wins: 0,
      podiums: 0,
      points: row.totalPoints,
    }));
  },

  async getCategoryRanking(
    year: number,
    semester: Semester,
  ): Promise<CategoryRankingItem[]> {
    const res = await axios.get<CategoryRankingApiItem[]>(
      `${API_URL}/ranking/categories`,
      { params: { year, semester } },
    );

    const data = res.data || [];

    return data.map((row) => ({
      position: row.position,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      tournamentsPlayed: row.competitorsCount, // aproximación
      robotsCount: row.competitorsCount,
      points: row.totalPoints,
    }));
  },
};
