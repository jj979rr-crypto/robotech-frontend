// src/pages/public/TournamentParticipantsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tournamentService } from '../../services/tournamentService';
import { inscriptionService } from '../../services/inscriptionService';

// --- ICONOS ---
const IconArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconRobot = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
);
const IconShield = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const IconBuilding = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="22"/><line x1="15" y1="22" x2="15" y2="22"/><line x1="12" y1="22" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M7 6h.01"/><path d="M17 6h.01"/><path d="M7 10h.01"/><path d="M17 10h.01"/><path d="M7 14h.01"/><path d="M17 14h.01"/><path d="M7 18h.01"/><path d="M17 18h.01"/></svg>
);
const IconUser = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export const TournamentParticipantsPage = () => {
  const { id } = useParams(); // ID del torneo obtenido de la URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        
        // 1. Cargar info del torneo
        // Asegúrate de haber agregado getTournamentById en tournamentService.ts
        const tourData = await tournamentService.getTournamentById(id); 
        setTournament(tourData);

        // 2. Cargar lista de inscritos
        const inscritosData = await inscriptionService.getInscritosPorTorneo(id);
        setParticipants(inscritosData || []);

      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo cargar la lista de participantes.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#3b82f6'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      
      {/* Background Grid FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* Navbar Simple */}
      <nav className="relative z-10 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <IconShield className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="text-sm font-bold text-white tracking-wide uppercase">
                Lista de <span className="text-blue-500">Despliegue</span>
                </h1>
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

      <main className="relative z-10 max-w-5xl mx-auto py-10 px-4 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="h-10 w-10 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin mb-4" />
             <p className="text-xs font-mono text-slate-500 animate-pulse">
               CARGANDO DATOS DE LA FLOTA...
             </p>
          </div>
        ) : (
          <>
            {/* Header del Torneo */}
            <header className="mb-10 pb-6 border-b border-slate-800/50">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                Torneo Oficial
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                {tournament?.nombre || 'Torneo Desconocido'}
              </h2>
              {tournament?.descripcion && (
                  <p className="mt-2 text-slate-400 text-sm max-w-2xl leading-relaxed">
                    {tournament.descripcion}
                  </p>
              )}
              
              <div className="mt-6 flex items-center gap-4 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                    <IconShield className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-300 font-bold">{participants.length}</span> Robots inscritos
                </div>
              </div>
            </header>

            {/* Grid de Robots */}
            {participants.length === 0 ? (
               <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-16 text-center">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <IconRobot className="w-8 h-8" />
                 </div>
                 <h3 className="text-white font-medium mb-1">Sin Inscritos</h3>
                 <p className="text-slate-500 text-sm">
                   Aún no hay unidades registradas en la base de datos para este evento.
                 </p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {participants.map((inscripcion: any) => {
                  const robot = inscripcion.robot || {};
                  const piloto = inscripcion.competitor || robot.competitor || {};
                  const club = piloto.club || {}; 

                  return (
                    <div 
                      key={inscripcion.id} 
                      className="group relative bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-start sm:items-center gap-5 hover:border-blue-500/40 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300"
                    >
                      {/* Avatar Robot */}
                      <div className="relative w-16 h-16 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors shrink-0 shadow-inner">
                         <IconRobot className="w-8 h-8" />
                         <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" title="Aprobado" />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Robot Name */}
                        <h4 className="text-white font-bold text-lg truncate group-hover:text-blue-200 transition-colors">
                          {robot.nombre || 'Sin Nombre'}
                        </h4>

                        {/* Piloto */}
                        <div className="flex items-center gap-2 mt-1 mb-2">
                            <IconUser className="w-3.5 h-3.5 text-slate-500" />
                            <p className="text-xs text-slate-400 truncate font-mono">
                                <span className="text-slate-300 hover:text-white transition-colors cursor-default">
                                    @{piloto.nickname || 'Anónimo'}
                                </span>
                            </p>
                        </div>
                        {/* Club Badge & Peso */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border transition-colors ${
                              club.nombre 
                                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 group-hover:border-indigo-500/40' 
                                : 'bg-slate-800 text-slate-500 border-slate-700'
                            }`}>
                              <IconBuilding className="w-3 h-3" />
                              {club.nombre || 'Agente Libre'}
                            </span>
                            
                            {robot.peso && (
                              <span className="text-[10px] text-slate-600 font-mono px-2 border-l border-slate-800">
                                {robot.peso}g
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};