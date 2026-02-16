// src/pages/RankingPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  rankingService,
  type CompetitorRankingItem,
  type ClubRankingItem,
  type CategoryRankingItem,
  type Semester,
} from '../../services/rankingService';
import Swal from 'sweetalert2';

// --- ICONOS SVG ---
const IconTrophy = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const IconMedal = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
);
const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconFilter = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const IconArrowLeft = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

type Tab = 'competitors' | 'clubs' | 'categories';

export const RankingPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('competitors');
  const [year, setYear] = useState<number>(2025);
  const [semester, setSemester] = useState<Semester>(1);

  const [competitors, setCompetitors] = useState<CompetitorRankingItem[]>([]);
  const [clubs, setClubs] = useState<ClubRankingItem[]>([]);
  const [categories, setCategories] = useState<CategoryRankingItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async (tab: Tab, y: number, s: Semester) => {
    setLoading(true);
    try {
      if (tab === 'competitors') {
        const data = await rankingService.getCompetitorRanking(y, s);
        setCompetitors(data);
      } else if (tab === 'clubs') {
        const data = await rankingService.getClubRanking(y, s);
        setClubs(data);
      } else {
        const data = await rankingService.getCategoryRanking(y, s);
        setCategories(data);
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message;
      Swal.fire({
        title: 'Error de conexión',
        text: Array.isArray(msg) ? msg[0] : msg || 'No se pudo sincronizar el ranking.',
        icon: 'error',
        background: '#0f172a', // slate-900
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab, year, semester);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, year, semester]);

  const years = [2024, 2025, 2026];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
        
      {/* BACKGROUND GRID (Consistente con el Home) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
      </div>

      {/* NAVBAR */}
      <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xs font-black text-white">R</span>
            </div>
            <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                    Ranking <span className="text-blue-500">Oficial</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                    Sistema de Puntuación Nacional
                </p>
            </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-slate-800 border border-transparent hover:border-slate-700"
        >
          <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto py-8 px-4 sm:px-6">
        
        {/* CONTROLS BAR */}
        <section className="mb-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* TABS SWITCHER */}
                <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800/50 w-full md:w-auto overflow-x-auto">
                    {[
                        { key: 'competitors', label: 'Competidores', icon: <IconMedal className="w-4 h-4"/> },
                        { key: 'clubs', label: 'Clubes', icon: <IconUsers className="w-4 h-4"/> },
                        { key: 'categories', label: 'Categorías', icon: <IconFilter className="w-4 h-4"/> },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as Tab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center ${
                                activeTab === tab.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* FILTERS SELECTS */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Año</span>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer"
                        >
                            {years.map((y) => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Semestre</span>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(Number(e.target.value) as Semester)}
                            className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer"
                        >
                            <option value={1} className="bg-slate-900">I</option>
                            <option value={2} className="bg-slate-900">II</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
            </div>
            <p className="mt-4 text-xs font-mono text-slate-500 animate-pulse">SINCRONIZANDO DATOS...</p>
          </div>
        )}

        {/* DATA TABLES */}
        {!loading && (
            <div className="animate-fade-in-up">
                {activeTab === 'competitors' && <CompetitorTable data={competitors} />}
                {activeTab === 'clubs' && <ClubTable data={clubs} />}
                {activeTab === 'categories' && <CategoryTable data={categories} />}
            </div>
        )}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTES DE TABLAS (RE-ESTILIZADOS) ---

// Función helper para renderizar medallas en los top 3
const RankBadge = ({ index }: { index: number }) => {
    if (index === 0) return <div className="w-6 h-6 rounded bg-yellow-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-lg shadow-yellow-500/20"><IconTrophy className="w-3.5 h-3.5" /></div>;
    if (index === 1) return <div className="w-6 h-6 rounded bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs"><span className="text-[10px]">2</span></div>;
    if (index === 2) return <div className="w-6 h-6 rounded bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs"><span className="text-[10px]">3</span></div>;
    return <span className="text-slate-500 font-mono text-xs w-6 text-center inline-block">{index + 1}</span>;
}

const CompetitorTable = ({ data }: { data: CompetitorRankingItem[] }) => {
  if (!data.length) return <EmptyState message="No hay datos de competencia registrados." />;

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            <tr>
                <th className="py-4 px-6 text-left w-16">Rank</th>
                <th className="py-4 px-6 text-left">Piloto</th>
                <th className="py-4 px-6 text-left hidden sm:table-cell">Club</th>
                <th className="py-4 px-6 text-left hidden md:table-cell">Categoría</th>
                <th className="py-4 px-6 text-center text-slate-600" title="Torneos Jugados">TJ</th>
                <th className="py-4 px-6 text-center text-emerald-600/80" title="Victorias">W</th>
                <th className="py-4 px-6 text-center text-blue-500/80" title="Podios">P</th>
                <th className="py-4 px-6 text-right text-white">PTS</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
                <tr key={row.competitorId} className={`group transition-colors ${index < 3 ? 'bg-gradient-to-r from-blue-900/10 to-transparent' : 'hover:bg-slate-800/30'}`}>
                <td className="py-4 px-6">
                    <RankBadge index={index} />
                </td>
                <td className="py-3 px-6">
                    <div className="flex flex-col">
                        <span className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-slate-200'}`}>
                            {row.nickname}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{row.nombres} {row.apellidos}</span>
                    </div>
                </td>
                <td className="py-3 px-6 hidden sm:table-cell">
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300">
                        {row.clubName}
                    </span>
                </td>
                <td className="py-3 px-6 hidden md:table-cell text-slate-400 text-xs font-mono">
                    {row.categoryName || '—'}
                </td>
                <td className="py-3 px-6 text-center text-slate-500 font-mono text-xs">{row.tournamentsPlayed}</td>
                <td className="py-3 px-6 text-center text-emerald-400 font-mono text-xs opacity-60 group-hover:opacity-100">{row.wins}</td>
                <td className="py-3 px-6 text-center text-blue-400 font-mono text-xs opacity-60 group-hover:opacity-100">{row.podiums}</td>
                <td className="py-3 px-6 text-right">
                    <span className={`font-black font-mono text-lg ${index === 0 ? 'text-blue-400 text-shadow-blue' : 'text-white'}`}>
                        {row.points}
                    </span>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

const ClubTable = ({ data }: { data: ClubRankingItem[] }) => {
  if (!data.length) return <EmptyState message="No hay clubes en el ranking." />;

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            <tr>
                <th className="py-4 px-6 text-left w-16">Rank</th>
                <th className="py-4 px-6 text-left">Club / Team</th>
                <th className="py-4 px-6 text-center text-slate-600">Torneos</th>
                <th className="py-4 px-6 text-center text-emerald-600/80">Oros</th>
                <th className="py-4 px-6 text-center text-blue-500/80">Podios</th>
                <th className="py-4 px-6 text-right text-white">Total Pts</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
                <tr key={row.clubId} className={`group transition-colors ${index < 3 ? 'bg-gradient-to-r from-purple-900/10 to-transparent' : 'hover:bg-slate-800/30'}`}>
                <td className="py-4 px-6"><RankBadge index={index} /></td>
                <td className="py-3 px-6">
                    <span className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{row.clubName}</span>
                </td>
                <td className="py-3 px-6 text-center text-slate-500 font-mono text-xs">{row.tournamentsPlayed}</td>
                <td className="py-3 px-6 text-center text-emerald-400 font-mono text-xs">{row.wins}</td>
                <td className="py-3 px-6 text-center text-blue-400 font-mono text-xs">{row.podiums}</td>
                <td className="py-3 px-6 text-right font-black font-mono text-lg text-white">{row.points}</td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

const CategoryTable = ({ data }: { data: CategoryRankingItem[] }) => {
  if (!data.length) return <EmptyState message="No hay categorías activas." />;

  return (
    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            <tr>
                <th className="py-4 px-6 text-left w-16">#</th>
                <th className="py-4 px-6 text-left">Categoría</th>
                <th className="py-4 px-6 text-center">Torneos</th>
                <th className="py-4 px-6 text-center">Robots Inscritos</th>
                <th className="py-4 px-6 text-right">Puntos Repartidos</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
            {data.map((row, index) => (
                <tr key={row.categoryId} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-6 text-slate-500 font-mono text-xs">{index + 1}</td>
                <td className="py-3 px-6">
                    <span className="font-bold text-blue-400">{row.categoryName}</span>
                </td>
                <td className="py-3 px-6 text-center text-slate-400 font-mono text-xs">{row.tournamentsPlayed}</td>
                <td className="py-3 px-6 text-center text-slate-200 font-mono text-xs">{row.robotsCount}</td>
                <td className="py-3 px-6 text-right font-bold font-mono text-slate-500">{row.points}</td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
    <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">📊</span>
    </div>
    <p className="text-slate-300 font-medium">{message}</p>
    <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
      Los datos se actualizan automáticamente al finalizar cada torneo oficial.
    </p>
  </div>
);