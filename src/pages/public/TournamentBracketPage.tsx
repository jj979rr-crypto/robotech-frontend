// src/pages/public/TournamentBracketPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tournamentService } from '../../services/tournamentService';
import api from '../../services/api'; 
import { MatchCard } from '../../components/bracket/MatchCard';

// --- ICONOS ---
const IconArrowLeft = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconTrophy = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

export const TournamentBracketPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [bracket, setBracket] = useState<any[][]>([]); // Array de Rondas

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        console.log("Cargando torneo ID:", id);
        
        // 1. Info del Torneo
        // Usamos try/catch individuales para que uno no rompa al otro
        try {
            const tourData = await tournamentService.getById(id);
            setTournament(tourData);
        } catch (e) { console.error("Error cargando info torneo", e); }

        // 2. Obtener Fixture
        const { data: fixtureData } = await api.get(`/matches/tournament/${id}`);
        console.log("Datos del Fixture recibidos:", fixtureData);

        // VALIDACIÓN DE SEGURIDAD: Solo guardamos si es un array real
        if (Array.isArray(fixtureData)) {
            setBracket(fixtureData);
        } else {
            console.error("El fixture recibido NO es un array:", fixtureData);
            setBracket([]); // Evita pantalla blanca
        }

      } catch (error) {
        console.error("Error general en BracketPage:", error);
        Swal.fire({ 
            icon: 'error', 
            title: 'Error', 
            text: 'No se pudo cargar el fixture.', 
            background: '#0f172a', 
            color: '#fff' 
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getRoundName = (roundIndex: number, totalRounds: number) => {
    if (roundIndex === totalRounds - 1) return 'GRAN FINAL';
    if (roundIndex === totalRounds - 2) return 'Semifinales';
    if (roundIndex === totalRounds - 3) return 'Cuartos de Final';
    return `Ronda ${roundIndex + 1}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans overflow-x-auto selection:bg-blue-500/30">
       {/* Background */}
       <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 min-w-max">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <IconTrophy className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
               Fixture: <span className="text-blue-500">{tournament?.nombre || 'Cargando...'}</span>
            </h1>
        </div>
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-slate-800 border border-transparent hover:border-slate-700">
          <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
        </button>
      </nav>

      {/* Bracket Area */}
      <main className="relative z-10 p-8 min-w-max">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 h-[60vh]">
            <div className="h-10 w-10 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin mb-4" />
            <p className="text-xs font-mono text-slate-500 animate-pulse">CARGANDO ENFRENTAMIENTOS...</p>
         </div>
        ) : !bracket || bracket.length === 0 ? (
            <div className="text-center text-slate-500 py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <p className="mb-2 text-2xl">🏆</p>
                <p>El fixture aún no ha sido generado o no hay suficientes participantes.</p>
                <p className="text-xs text-slate-600 mt-2">(Mínimo 2 participantes requeridos)</p>
            </div>
        ) : (
          <div className="flex gap-16 justify-start sm:justify-center pb-20 pt-10">
            {/* Renderizado de Rondas - CON VALIDACIÓN EXTRA */}
            {Array.isArray(bracket) && bracket.map((roundMatches, roundIdx) => (
              <div key={roundIdx} className="flex flex-col justify-around relative min-w-[260px]">
                {/* Título de la Ronda */}
                <h3 className="text-center text-xs font-bold uppercase tracking-widest text-blue-500/80 mb-6 absolute -top-10 w-full">
                    {getRoundName(roundIdx, bracket.length)}
                </h3>
                
                {/* Partidos */}
                {Array.isArray(roundMatches) && roundMatches.map((match: any) => (
                  <MatchCard 
                    key={match.id || Math.random()} 
                    match={match} 
                    isLastRound={roundIdx === bracket.length - 1} 
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};