import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { tournamentService } from '../../services/tournamentService';
import { inscriptionService } from '../../services/inscriptionService';
import { judgeService } from '../../services/judgeService';

export const DashboardJudge = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [inscriptions, setInscriptions] = useState<any[]>([]);

  // --- Helpers de modo según categoría ---
  const getCategoryName = (t: any): string => {
    // Soporta torneos antiguos (t.categoria) y nuevos (t.category.name)
    if (t?.categoria) return t.categoria;
    if (t?.category?.name) return t.category.name;
    return '';
  };

  const getCategoryMode = (
    categoria: string | undefined,
  ): 'COMBATE' | 'LINEA' => {
    const name = (categoria || '').toLowerCase();
    // Ajusta estos includes según tus nombres reales
    if (name.includes('linea') || name.includes('línea')) {
      return 'LINEA';
    }
    return 'COMBATE';
  };

  const getPointsForLineaPosition = (position: number): number => {
    if (position === 1) return 10;
    if (position === 2) return 8;
    if (position === 3) return 6;
    if (position === 4) return 4;
    if (position === 5) return 3;
    if (position === 6) return 2;
    if (position >= 7) return 1;
    return 0;
  };

  // 1. Cargar lista de torneos al iniciar
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const data = await tournamentService.getAllTournaments();
      setTournaments(data || []);
    } catch (error) {
      console.error('Error cargando torneos', error);
      Swal.fire('Error', 'No se pudieron cargar los torneos', 'error');
    }
  };

  // 2. Al seleccionar un torneo, cargamos sus robots inscritos
  const handleSelectTournament = async (tournament: any) => {
    setSelectedTournament(tournament);
    try {
      const inscritos = await inscriptionService.getInscritosPorTorneo(
        tournament.id,
      );
      setInscriptions(inscritos || []);
    } catch (error) {
      console.error('Error cargando inscritos', error);
      Swal.fire('Error', 'No se pudieron cargar los participantes', 'error');
    }
  };

  // 3. Lógica para asignar puntos según tipo de categoría
  const handleCalificar = async (
    inscriptionId: string,
    robotName: string,
  ) => {
    if (!selectedTournament) return;

    const categoria = getCategoryName(selectedTournament);
    const mode = getCategoryMode(categoria);

    // --- MODO COMBATE / SUMO / LUCHAS ---
    if (mode === 'COMBATE') {
      const { value: result } = await Swal.fire({
        title: `Resultado de ${robotName}`,
        text: 'Selecciona el resultado final en el torneo',
        input: 'select',
        inputOptions: {
          CAMPEON: '🏆 Campeón (10 pts)',
          SUBCAMPEON: '🥈 Subcampeón (7 pts)',
          SEMIFINALISTA: '🥉 Semifinalista (4 pts)',
          PARTICIPANTE: '🎖 Participante / Eliminado (2 pts)',
          SIN_PUNTOS: '❌ Sin puntos (0 pts)',
        },
        inputPlaceholder: 'Elige un resultado',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        confirmButtonColor: '#DC2626',
        cancelButtonText: 'Cancelar',
      });

      // Cancelado o sin selección
      if (!result) return;

      let score = 0;
      if (result === 'CAMPEON') score = 10;
      else if (result === 'SUBCAMPEON') score = 7;
      else if (result === 'SEMIFINALISTA') score = 4;
      else if (result === 'PARTICIPANTE') score = 2;
      else if (result === 'SIN_PUNTOS') score = 0;

      try {
        await judgeService.calificarRobot(inscriptionId, score);

        Swal.fire({
          icon: 'success',
          title: 'Resultado guardado',
          text: `El robot ${robotName} recibió ${score} puntos.`,
          timer: 1800,
          showConfirmButton: false,
        });

        const inscritos = await inscriptionService.getInscritosPorTorneo(
          selectedTournament.id,
        );
        setInscriptions(inscritos || []);
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo guardar la calificación', 'error');
      }

      return;
    }

    // --- MODO SEGUIDOR DE LÍNEA (CARRERA) ---
    const { value: positionStr } = await Swal.fire({
      title: `Posición final de ${robotName}`,
      text: 'Selecciona la posición de llegada',
      input: 'select',
      inputOptions: {
        '1': '1° lugar (10 pts)',
        '2': '2° lugar (8 pts)',
        '3': '3° lugar (6 pts)',
        '4': '4° lugar (4 pts)',
        '5': '5° lugar (3 pts)',
        '6': '6° lugar (2 pts)',
        '7': '7° lugar (1 pt)',
        '8': '8° lugar (1 pt)',
        '9': '9° lugar (1 pt)',
        '10': '10° lugar (1 pt)',
        SIN_PUNTOS: 'No terminó / descalificado (0 pts)',
      },
      inputPlaceholder: 'Selecciona la posición',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#DC2626',
      cancelButtonText: 'Cancelar',
    });

    if (!positionStr) return; // Cancelado

    let score = 0;
    let posNumber: number | null = null;

    if (positionStr === 'SIN_PUNTOS') {
      score = 0;
    } else {
      posNumber = Number(positionStr);
      score = getPointsForLineaPosition(posNumber);
    }

    try {
      await judgeService.calificarRobot(inscriptionId, score);

      Swal.fire({
        icon: 'success',
        title: 'Resultado guardado',
        text:
          posNumber !== null
            ? `El robot ${robotName} quedó en posición ${posNumber} y obtuvo ${score} puntos.`
            : `El robot ${robotName} no obtuvo puntos.`,
        timer: 2000,
        showConfirmButton: false,
      });

      const inscritos = await inscriptionService.getInscritosPorTorneo(
        selectedTournament.id,
      );
      setInscriptions(inscritos || []);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar la calificación', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR ROJO - DISTINTIVO DEL JUEZ */}
      <nav className="bg-red-900 text-white px-6 py-4 flex justify-between items-center shadow-lg border-b-4 border-red-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <h1 className="text-xl font-bold tracking-wide">
            PANEL DE <span className="text-red-200">JUEZ</span>
          </h1>
        </div>
        <button
          onClick={() => navigate('/internal')}
          className="text-xs bg-red-800 hover:bg-red-700 border border-red-600 px-4 py-2 rounded transition font-bold uppercase tracking-wider"
        >
          Cerrar Sesión
        </button>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4">
        {/* VISTA 1: SELECCIÓN DE TORNEO */}
        {!selectedTournament ? (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Torneos Disponibles
            </h2>
            <p className="text-gray-500 mb-8">
              Seleccione el torneo que desea arbitrar hoy.
            </p>

            {tournaments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-400">No hay torneos registrados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((t) => {
                  const categoria = getCategoryName(t);
                  const mode = getCategoryMode(categoria);
                  const statusLabel =
                    t.estado === 'OPEN' || t.estado === 'Abierto'
                      ? 'Abierto'
                      : t.estado;

                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTournament(t)}
                      className="bg-white group p-6 rounded-xl shadow-sm hover:shadow-xl cursor-pointer border-l-4 border-red-600 transition-all transform hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-gray-800 group-hover:text-red-700 transition-colors">
                          {t.nombre}
                        </h3>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                            statusLabel === 'Abierto'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          🏆 {categoria || 'Sin categoría'}
                          {mode === 'LINEA' && (
                            <span className="ml-2 text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Carrera
                            </span>
                          )}
                        </p>
                        <p>📍 {t.location?.nombre || 'Sin sede'}</p>
                        <p>📅 {t.fechaInicio}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <span className="text-red-600 text-sm font-bold group-hover:underline">
                          Ingresar a Mesa &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // VISTA 2: MESA DE ARBITRAJE
          <div className="animate-fade-in-up">
            <button
              onClick={() => setSelectedTournament(null)}
              className="mb-6 flex items-center text-sm text-gray-500 hover:text-red-700 font-medium transition"
            >
              ← Volver a lista de torneos
            </button>

            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              {/* HEADER DE LA TABLA */}
              <div className="bg-gradient-to-r from-red-900 to-red-800 px-8 py-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedTournament.nombre}
                  </h2>
                  <p className="text-red-200 text-sm mt-1">
                    Categoría: {getCategoryName(selectedTournament) || '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold">
                    {inscriptions.length}
                  </p>
                  <p className="text-xs text-red-300 uppercase tracking-wider">
                    Participantes
                  </p>
                </div>
              </div>

              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Robot
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Piloto & Club
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Puntos
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inscriptions.map((insc) => (
                        <tr
                          key={insc.id}
                          className="hover:bg-red-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-xl">
                                🤖
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {insc.robot.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {insc.robot.peso}kg
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {insc.robot.competitor?.nickname || 'Sin Piloto'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {insc.robot.competitor?.club?.nombre ||
                                'Sin Club'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {insc.score > 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-bold bg-green-100 text-green-800 border border-green-200">
                                {insc.score} pts
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Sin puntaje
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() =>
                                handleCalificar(insc.id, insc.robot.nombre)
                              }
                              className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg shadow-sm transition-all font-bold flex items-center gap-2 ml-auto"
                            >
                              📝 Asignar resultado
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {inscriptions.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg">
                        No hay robots inscritos en este torneo.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
