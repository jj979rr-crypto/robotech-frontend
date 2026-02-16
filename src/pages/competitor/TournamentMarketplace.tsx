// src/pages/competitor/TournamentMarketplace.tsx

import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import Swal from 'sweetalert2';

import { tournamentService } from '../../services/tournamentService';

import type { Tournament } from '../../services/tournamentService';

import { robotService } from '../../services/robotService';

import { inscriptionService } from '../../services/inscriptionService';

// --- ICONOS SVG ---

const IconArrowLeft = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>

);

const IconMapPin = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>

);

const IconCalendar = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

);

const IconUsers = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

);

const IconRobot = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>

);

const IconCheck = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

);

const IconAlert = ({ className }: { className?: string }) => (

  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

);



interface Robot {

  id: string;

  nombre: string;

  categoria: string; // 'Combate cuerpo a cuerpo' | 'Lucha de sumos' | 'Seguidor de línea' | ...

  peso?: number;

}



// 🔹 Nombre visible de la categoría del torneo (solo para UI)

const getTournamentCategoryName = (torneo?: Tournament | null): string => {

  if (!torneo) return '';

  const catObj = (torneo as any).category;

  return catObj?.name || (torneo as any).categoria || '';

};



// 🔹 Traduce el gameType de la categoría del torneo al texto que usan los robots

//     Debe ser consistente con mapGameTypeToRobotCategory en DashboardCompetitor

const getRequiredRobotCategoryLabel = (torneo?: Tournament | null): string => {

  if (!torneo) return '';

  const gameType = (torneo as any).category?.gameType as string | undefined;

  if (!gameType) return '';



  switch (gameType) {

    case 'COMBAT':

    case 'COMBATE':

      return 'Combate cuerpo a cuerpo';

    case 'SUMO':

      return 'Lucha de sumos';

    case 'RACE':

    case 'CARRERA':

      return 'Seguidor de línea';

    default:

      // Si algún día agregas otros gameType, aquí decides si los dejas “libres”

      return '';

  }

};



export const TournamentMarketplace = () => {

  const navigate = useNavigate();



  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [myRobots, setMyRobots] = useState<Robot[]>([]);

  const [user, setUser] = useState<any>(null);



  const [selectedTournament, setSelectedTournament] =

    useState<Tournament | null>(null);

  const [selectedRobotId, setSelectedRobotId] = useState('');

  const [loading, setLoading] = useState(true);

  // Filtro para ocultar torneos que terminaron hace más de 7 días
  const torneosVisibles = tournaments.filter(t => {
    if (!t.fechaInicio) return true;
      
      // Calculamos fecha fin (o usamos la misma de inicio si no existe fin)
    const fechaFin = t.fechaFin ? new Date(t.fechaFin) : new Date(t.fechaInicio);
      
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);

      // Si la fecha de fin es MAYOR que hace una semana, lo mostramos.
      // Si terminó hace 8 días, esto dará falso y se ocultará.
    return fechaFin > haceUnaSemana; 
    }).sort((a, b) => {
    
      // Ordenamos por fecha de inicio descendente (más reciente primero)
    const fechaA = new Date(a.fechaInicio || 0).getTime();
    const fechaB = new Date(b.fechaInicio || 0).getTime();
      
    return fechaB - fechaA;

  });

  useEffect(() => {

    const loadData = async () => {

      const userStr = localStorage.getItem('user');

      if (!userStr) return navigate('/login');



      const userData = JSON.parse(userStr);

      setUser(userData);



      try {

        const publicTournaments = await tournamentService.getPublicTournaments();

        console.log('TORNEOS API:', publicTournaments);

        setTournaments(publicTournaments || []);



        const competitorId =

          userData.competitorProfile?.id ||

          userData.competitorId ||

          userData.id;



        if (competitorId) {

          const robotsData = await robotService.getMyRobots(competitorId);

          console.log('ROBOTS API:', robotsData);

          setMyRobots(robotsData || []);

        }

      } catch (error) {

        console.error('Error cargando datos', error);

        Swal.fire({

          title: 'Error de conexión',

          text: 'No se pudieron cargar los datos del sistema.',

          icon: 'error',

          background: '#0f172a',

          color: '#fff',

        });

      } finally {

        setLoading(false);

      }

    };


    loadData();

  }, [navigate]);



  // 🔹 Robots compatibles para el modal (según gameType del torneo)

  const robotsCompatibles = selectedTournament

    ? myRobots.filter((r) => {

        const required = getRequiredRobotCategoryLabel(selectedTournament);

        // Si el torneo no tiene gameType claro, permitimos todos y que el backend valide

        if (!required) return true;

        return r.categoria === required;

      })

    : [];



  // 🔹 Robots compatibles por tarjeta (mismo criterio)

  const getRobotsCompatiblesForTournament = (torneo: Tournament) => {

    const required = getRequiredRobotCategoryLabel(torneo);

    if (!required) {

      // Sin gameType: mostramos todos

      return myRobots;

    }

    return myRobots.filter((r) => r.categoria === required);

  };


  const handleInscripcion = async () => {

    if (!selectedTournament) return;



    if (!selectedRobotId) {

      return Swal.fire({

        title: 'Acción Requerida',

        text: 'Selecciona un robot para desplegar.',

        icon: 'warning',

        background: '#0f172a',

        color: '#fff',

        confirmButtonColor: '#3b82f6',

      });

    }



    try {

      await inscriptionService.inscribirRobot(

        selectedRobotId,

        selectedTournament.id,

      );



      Swal.fire({

        icon: 'success',

        title: '¡Despliegue Confirmado!',

        text: `Tu robot ha sido inscrito en ${selectedTournament.nombre}`,

        background: '#0f172a',

        color: '#fff',

        confirmButtonColor: '#10b981',

      });

      setSelectedTournament(null);

      setSelectedRobotId('');

    } catch (error: any) {

      const msg = error?.response?.data?.message;

      Swal.fire({

        title: 'Error de Inscripción',

        text:

          (Array.isArray(msg) ? msg[0] : msg) ||

          'No se pudo procesar la solicitud.',

        icon: 'error',

        background: '#0f172a',

        color: '#fff',

      });

    }

  };



  return (

    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">

      {/* BACKGROUND GRID */}

      <div className="fixed inset-0 z-0 pointer-events-none">

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

      </div>



      {/* NAVBAR */}

      <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-40">

        <div className="flex flex-col">

          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">

            Misiones <span className="text-blue-500">Disponibles</span>

            <span className="flex h-2 w-2 relative">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />

            </span>

          </h1>

          {user && (

            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">

              Piloto:{' '}

              <span className="text-slate-300">

                {user.competitorProfile?.nickname || user.email}

              </span>

            </span>

          )}

        </div>

        <button

          onClick={() => navigate('/perfil')}

          className="group flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-slate-800 border border-slate-800 hover:border-slate-600"

        >

          <IconArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />

          Volver al Hangar

        </button>

      </nav>



      <main className="relative z-10 max-w-5xl mx-auto py-10 px-4 sm:px-6">

        {loading ? (

          <div className="flex flex-col items-center justify-center py-20">

            <div className="h-10 w-10 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin mb-4" />

            <p className="text-xs font-mono text-slate-500 animate-pulse">

              BUSCANDO SEÑALES DE TORNEOS...

            </p>

          </div>

        ) : (

          <div className="space-y-8">

            {torneosVisibles.map((torneo) => {
              const categoriaTorneo = getTournamentCategoryName(torneo);
              const compatibles = getRobotsCompatiblesForTournament(torneo);

              // --- LÓGICA DE ESTADOS ACTUALIZADA ---
              const now = new Date();
              const fechaInicio = new Date(torneo.fechaInicio);
              
              // Asumimos que si no hay fechaFin, dura 4 horas (ajusta esto a tu realidad)
              const fechaFin = torneo.fechaFin 
                  ? new Date(torneo.fechaFin) 
                  : new Date(fechaInicio.getTime() + (4 * 60 * 60 * 1000)); 

              const hasStarted = fechaInicio <= now;
              const hasEnded = fechaFin <= now;
              
              // "En curso" significa que ya empezó pero no ha terminado
              const isRunning = hasStarted && !hasEnded;

              // Solo se puede inscribir si no ha empezado y hay cupos (y robots compatibles)
              const canInscribir = compatibles.length > 0 && !hasStarted && !hasEnded;

              return (
                <article
                  key={torneo.id}
                  className={`group backdrop-blur border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl 
                  ${
                    hasEnded 
                      ? 'bg-slate-900/40 border-slate-800 grayscale-[0.5] opacity-75 hover:opacity-100' // Estilo apagado si terminó
                      : 'bg-slate-900/60 border-slate-800 hover:border-blue-500/30 hover:shadow-blue-900/10'
                  }`}
                >
                  {/* Header */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-20">
                      <span className="inline-flex items-center text-[10px] font-bold bg-white/10 text-white px-3 py-1 rounded backdrop-blur-md border border-white/10 uppercase tracking-widest">
                        Oficial
                      </span>

                      {categoriaTorneo && (
                        <span className="inline-flex items-center text-[10px] font-bold bg-blue-500/20 text-blue-300 px-3 py-1 rounded backdrop-blur-md border border-blue-500/20 uppercase">
                          Clase: {categoriaTorneo}
                        </span>
                      )}

                      {/* ETIQUETAS DE ESTADO */}
                      {isRunning && (
                        <span className="inline-flex items-center text-[10px] font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded backdrop-blur-md border border-amber-500/20 uppercase animate-pulse">
                          En Combate
                        </span>
                      )}
                      {hasEnded && (
                        <span className="inline-flex items-center text-[10px] font-bold bg-slate-500/20 text-slate-300 px-3 py-1 rounded backdrop-blur-md border border-slate-500/20 uppercase">
                          Misión Finalizada
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                        {torneo.nombre}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
                        <span className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                          <IconMapPin className="w-3.5 h-3.5 text-blue-400" />
                          {torneo.location?.nombre || 'Ubicación Clasificada'}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                          <IconCalendar className="w-3.5 h-3.5 text-blue-400" />
                          {torneo.fechaInicio
                            ? new Date(torneo.fechaInicio).toLocaleString()
                            : 'TBA'}
                        </span>
                        {torneo.maxParticipantes && (
                          <span className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                            <IconUsers className="w-3.5 h-3.5 text-blue-400" />
                            Cupos:{' '}
                            {torneo.minParticipantes
                              ? `${torneo.minParticipantes} - ${torneo.maxParticipantes}`
                              : torneo.maxParticipantes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {torneo.descripcion && (
                      <p className="text-sm text-slate-400 mb-6 leading-relaxed border-l-2 border-slate-700 pl-4">
                        {torneo.descripcion}
                      </p>
                    )}

                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 p-2 rounded-lg ${
                            compatibles.length > 0
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <IconRobot className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Diagnóstico de Flota
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xl font-bold font-mono ${
                                compatibles.length > 0 ? 'text-white' : 'text-slate-600'
                              }`}
                            >
                              {compatibles.length}
                            </span>
                            <span className="text-xs text-slate-400">
                              Unidades aptas detectadas
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            Requisito: Categoría{' '}
                            <span className="text-blue-400">
                              {categoriaTorneo || 'N/A'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto text-right">
                        {/* Lógica de Texto de Estado (Derecha) */}
                        {hasEnded ? (
                          <div className="text-xs text-slate-500 flex items-center justify-end gap-2 font-bold uppercase">
                            <IconCheck className="w-4 h-4" /> Reporte Cerrado
                          </div>
                        ) : isRunning ? (
                          <div className="text-xs text-amber-500 flex items-center justify-end gap-2 font-bold uppercase">
                            <IconAlert className="w-4 h-4" /> Inscripciones Cerradas
                          </div>
                        ) : compatibles.length === 0 ? (
                          <div className="text-xs text-slate-500 flex flex-col items-end">
                            <span className="flex items-center gap-1">
                              Incompatible <IconAlert className="w-3 h-3" />
                            </span>
                            <span className="opacity-50 text-[10px]">
                              Requiere robot {categoriaTorneo}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-400 flex items-center justify-end gap-2 font-bold uppercase animate-pulse">
                            <IconCheck className="w-4 h-4" /> Listo para despliegue
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-slate-600 font-mono">
                        {torneo.location?.direccion && (
                          <span>COORD: {torneo.location.direccion}</span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedTournament(torneo);
                          setSelectedRobotId('');
                        }}
                        disabled={!canInscribir}
                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all
                          ${
                            canInscribir
                              ? 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/40 hover:-translate-y-0.5'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                      >
                        {/* Lógica de Texto del Botón */}
                        {hasEnded
                          ? 'Misión Finalizada'
                          : isRunning
                          ? 'Combate en Curso'
                          : compatibles.length === 0
                          ? 'Sin Unidades Aptas'
                          : 'Confirmar Despliegue'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}



            {tournaments.length === 0 && (

              <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-16 text-center">

                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">

                  <IconCalendar className="w-10 h-10 text-slate-600" />

                </div>

                <h3 className="text-xl font-bold text-white mb-2">

                  Sin Torneos Activos

                </h3>

                <p className="text-slate-500 max-w-sm mx-auto">

                  Los sensores no detectan torneos públicos programados en este

                  momento. Mantente a la espera de nuevas transmisiones.

                </p>

              </div>

            )}

          </div>

        )}

      </main>



      {/* MODAL */}

      {selectedTournament && (

        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">

          <div className="bg-slate-900 rounded-2xl shadow-2xl shadow-black border border-slate-700 max-w-md w-full p-0 overflow-hidden">

            <div className="bg-slate-950 p-6 border-b border-slate-800">

              <h3 className="text-lg font-bold text-white flex items-center gap-2">

                <IconCheck className="w-5 h-5 text-blue-500" />

                Confirmar Inscripción

              </h3>

              <p className="text-slate-400 text-xs mt-1">

                Destino:{' '}

                <span className="text-blue-400 font-mono">

                  {selectedTournament.nombre}

                </span>

              </p>

            </div>



            <div className="p-6">

              {robotsCompatibles.length > 0 ? (

                <div className="space-y-4">

                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">

                    Seleccionar Unidad de Combate (

                    {getTournamentCategoryName(selectedTournament)})

                  </label>

                  <div className="relative">

                    <select

                      value={selectedRobotId}

                      onChange={(e) => setSelectedRobotId(e.target.value)}

                      className="block w-full bg-slate-950 border border-slate-700 rounded-lg text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"

                    >

                      <option value="">-- Seleccionar Robot --</option>

                      {robotsCompatibles.map((r) => (

                        <option key={r.id} value={r.id}>

                          {r.nombre} {r.peso ? `(${r.peso} g)` : ''}

                        </option>

                      ))}

                    </select>

                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">

                      <svg

                        className="w-4 h-4"

                        fill="none"

                        stroke="currentColor"

                        viewBox="0 0 24 24"

                      >

                        <path

                          strokeLinecap="round"

                          strokeLinejoin="round"

                          strokeWidth="2"

                          d="M19 9l-7 7-7-7"

                        />

                      </svg>

                    </div>

                  </div>



                  <div className="rounded-lg p-3 border bg-red-900/20 border-red-900/50">

                    <p className="text-[11px] leading-relaxed text-red-200">

                      ⚠️ <b>Advertencia importante:</b> Si abandonas el torneo, tu <b>club será sancionado con S/ 100</b> y tú quedarás

                      <b> inhabilitado hasta por 2 torneos</b>. Además, si tus robots no cumplen el reglamento a la hora de presentarse en la arena (peso/categoría/condiciones),

                      el <b>juez puede reportarte</b> y podrías ser <b>retirado</b> del torneo.

                    </p>

                  </div>





                </div>

              ) : (

                <div className="bg-amber-900/20 border-l-4 border-amber-600 p-4 rounded-r">

                  <p className="text-amber-500 text-sm font-bold flex items-center gap-2">

                    <IconAlert className="w-4 h-4" /> No tienes robots compatibles

                  </p>

                  <p className="text-amber-400/70 text-xs mt-1">

                    Registra un robot que pertenezca a la categoría requerida del

                    torneo antes de inscribirte.

                  </p>

                </div>

              )}

            </div>



            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end gap-3">

              <button

                onClick={() => {

                  setSelectedTournament(null);

                  setSelectedRobotId('');

                }}

                className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 rounded-lg transition"

              >

                Cancelar

              </button>



              {robotsCompatibles.length > 0 && (

                <button

                  onClick={handleInscripcion}

                  disabled={!selectedRobotId}

                  className={`px-6 py-2 rounded-lg text-sm font-bold transition shadow-lg

                    ${

                      !selectedRobotId

                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'

                        : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/20'

                    }`}

                >

                  Inicializar

                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </div>

  );

};