import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { robotService } from '../../services/robotService';
import { competitorService } from '../../services/competitorService';
import { categoryService } from '../../services/categoryService';
import type { Category } from '../../services/categoryService';
import { behaviorService, type BehaviorEvent } from '../../services/behaviorService';
import {TYPE_LABEL_BY_CODE,AREA_LABEL_BY_TYPE,escapeHtml,} from '../../constants/incidents';


type RobotStatus = 'Activo' | 'En mantenimiento' | 'Destruido en batalla';

type RobotFormValues = {
  nombre: string;
  categoria: string;
  peso: string; // se parsea a number antes de enviar
  fotoUrl?: string;
};

type Robot = {
  id: string;
  nombre: string;
  categoria: string;
  peso: number;
  fotoUrl?: string;
  status: RobotStatus;
};


export const DashboardCompetitor = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingRobots, setLoadingRobots] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // info adicional del competidor (status, club, lock, etc.)
  const [competitorInfo, setCompetitorInfo] = useState<any>(null);
  const [loadingCompetitor, setLoadingCompetitor] = useState(false);

  // categorías dinámicas desde backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [incidents, setIncidents] = useState<BehaviorEvent[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

;
  const [loadingEvents, setLoadingEvents] = useState(false);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RobotFormValues>();

  const loadIncidents = async (competitorId: string) => {
    try {
      setLoadingIncidents(true);
      const data = await behaviorService.listByCompetitor(competitorId);
      const safe = Array.isArray(data) ? data : [];
      setIncidents(safe);
      return safe;
    } catch (e) {
      console.error('Error cargando incidencias', e);
      return [];
    } finally {
      setLoadingIncidents(false);
    }
  };

  const loadMyEvents = async (competitorId: string) => {
    try {
      setLoadingEvents(true);
      const events = await behaviorService.listByCompetitor(competitorId);
      (Array.isArray(events) ? events : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  };
  // =========================
  //  CARGA INICIAL DE USUARIO
  // =========================
  useEffect(() => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
      navigate('/internal');
      return;
    }

    const userData = JSON.parse(userStr);
    setUser(userData);

    const competitorId = userData.competitorProfile?.id;
    if (competitorId) {
      loadCompetitor(competitorId);
      loadRobots(competitorId);
      loadIncidents(competitorId);
      loadMyEvents(competitorId);

    } else {
      console.warn('Perfil de competidor no encontrado en el usuario local.');
    }

    setLoadingUser(false);
  }, [navigate]);

  // =========================
  //  CARGAR CATEGORÍAS
  // =========================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoryService.getAll();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando categorías', error);
        Swal.fire(
          'Advertencia',
          'No se pudieron cargar las categorías desde el servidor.',
          'warning',
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // =========================
  //  CARGAR COMPETIDOR (status / club / lock)
  // =========================
  const loadCompetitor = async (competitorId: string) => {
    try {
      setLoadingCompetitor(true);
      const data = await competitorService.getById(competitorId);
      setCompetitorInfo(data);
    } catch (error) {
      console.error('Error cargando info de competidor', error);
    } finally {
      setLoadingCompetitor(false);
    }
  };

  // =========================
  //  CARGAR ROBOTS DEL PILOTO
  // =========================
  const loadRobots = async (competitorId: string) => {
    try {
      setLoadingRobots(true);
      const data = await robotService.getMyRobots(competitorId);
      setRobots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando robots', error);
      Swal.fire(
        'Error',
        'No se pudieron cargar tus robots. Intenta nuevamente.',
        'error',
      );
    } finally {
      setLoadingRobots(false);
    }
  };


const handleChangeStatus = async (robotId: string, newStatus: RobotStatus) => {
  try {
    await robotService.updateStatus(robotId, newStatus);

    setRobots((prev) =>
      prev.map((r) => (r.id === robotId ? { ...r, status: newStatus } : r)),
    );

    Swal.fire({
      icon: 'success',
      title: 'Estado actualizado',
      text: `El robot ahora está "${newStatus}".`,
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error: any) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el estado del robot.',
    });
  }
};

  const handleDeleteRobot = async (robotId: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar robot',
      text: 'Esta acción no se puede deshacer. ¿Seguro que quieres eliminarlo?',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#DC2626',
    });

    if (!result.isConfirmed) return;

    try {
      await robotService.deleteRobot(robotId);

      setRobots((prev) => prev.filter((r) => r.id !== robotId));

      Swal.fire({
        icon: 'success',
        title: 'Robot eliminado',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el robot.',
      });
    }
  };

  const handleMyIncidents = async () => {
    const competitorId = user?.competitorProfile?.id;
    if (!competitorId) return;

    try {
      setLoadingEvents(true);

      const events = await behaviorService.listByCompetitor(competitorId);
      const safe = Array.isArray(events) ? events : [];

      const html =
        safe.length === 0
          ? `<p style="color:#64748b;font-size:12px;">Sin incidencias registradas.</p>`
          : safe
              .map((ev: any) => {
                const badge =
                  ev.source === 'TOURNAMENT'
                    ? `<span style="padding:2px 8px;border-radius:999px;background:#1d4ed8;color:white;font-size:11px;">TORNEO</span>`
                    : `<span style="padding:2px 8px;border-radius:999px;background:#7c3aed;color:white;font-size:11px;">CLUB</span>`;

                const isResolved = !!ev.resolvedAt;

                const areaLabel = AREA_LABEL_BY_TYPE[ev.type] || ev.category || '—';
                const typeLabel = TYPE_LABEL_BY_CODE[ev.type] || ev.type;


                return `
                  <div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin:10px 0;text-align:left;">
                    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
                      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        ${badge}
                        ${isResolved ? `<span style="padding:2px 8px;border-radius:999px;background:#16a34a;color:white;font-size:11px;">RESUELTA</span>` : ''}
                        <b style="font-size:12px;">${escapeHtml(areaLabel)} • ${escapeHtml(typeLabel)}</b>
                      </div>
                      <span style="color:#64748b;font-size:12px;">Sev: ${ev.severity}</span>
                    </div>

                    <div style="color:#0f172a;margin-top:8px;font-size:12px;">
                      ${escapeHtml(ev.description)}
                    </div>

                    <div style="color:#64748b;margin-top:8px;font-size:11px;">
                      ${new Date(ev.createdAt).toLocaleString()}
                      ${ev.source === 'TOURNAMENT' && ev.tournament?.nombre ? ` • ${escapeHtml(ev.tournament.nombre)}` : ''}
                    </div>
                  </div>
                `;
              })
              .join('');

      await Swal.fire({
        title: 'Mis incidencias',
        html,
        confirmButtonText: 'Cerrar',
        width: 750,
      });
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo cargar tu historial.', 'error');
    } finally {
      setLoadingEvents(false);
    }
  };





    // Traduce el gameType de Category al valor que espera el enum RobotCategory del backend
  const mapGameTypeToRobotCategory = (gameType: string): string => {
    switch (gameType) {
      case 'SUMO':
        // RobotCategory.SUMO
        return 'Lucha de sumos';
      case 'COMBATE':
        // RobotCategory.COMBAT
        return 'Combate cuerpo a cuerpo';
      case 'CARRERA':
        // RobotCategory.LINE_FOLLOWER (para las carreras tipo seguidor de línea)
        return 'Seguidor de línea';
      default:
        // Fallback razonable: un valor válido del enum
        return 'Competencia intelectual';
    }
  };


  const onSubmitRobot = async (data: RobotFormValues) => {
    if (!user?.competitorProfile?.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión desactualizada',
        text: 'Tus datos de perfil no se cargaron correctamente. Por favor, cierra sesión y vuelve a entrar.',
        confirmButtonText: 'Cerrar sesión y recargar',
        confirmButtonColor: '#d33',
      }).then(() => {
        localStorage.clear();
        navigate('/internal');
      });
      return;
    }

    // data.categoria trae el ID de la Category (como string)
    const categoryId = Number(data.categoria);
    const selectedCategory = categories.find((c) => c.id === categoryId);

    if (!selectedCategory) {
      Swal.fire({
        icon: 'error',
        title: 'Categoría inválida',
        text: 'Selecciona una categoría válida antes de registrar el robot.',
      });
      return;
    }

    const pesoNumber = parseFloat(data.peso);
    if (isNaN(pesoNumber) || pesoNumber <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Peso inválido',
        text: 'Ingresa un peso mayor a 0.',
      });
      return;
    }

    // VALIDACIÓN LOCAL: todo en gramos
    if (selectedCategory.maxWeightGrams > 0) {
      const pesoGramos = pesoNumber; // tu input está en gramos

      if (pesoGramos > selectedCategory.maxWeightGrams) {
        Swal.fire({
          icon: 'error',
          title: 'Peso excedido',
          text: `El peso máximo para "${selectedCategory.name}" es de ${selectedCategory.maxWeightGrams} g. Estás registrando aproximadamente ${pesoGramos.toFixed(
            0,
          )} g.`,
        });
        return;
      }
    }

    // >>> AQUÍ hacemos el puente entre Category y RobotCategory
    const categoriaEnumValue = mapGameTypeToRobotCategory(
      String(selectedCategory.gameType),
    );

    // LÍMITE : máximo 2 robots por categoría (RobotCategory)
    const alreadyInThatCategory = robots.filter((r) => r.categoria === categoriaEnumValue).length;

    if (alreadyInThatCategory >= 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite alcanzado',
        text: `Ya tienes ${alreadyInThatCategory} robots registrados en "${categoriaEnumValue}". El máximo permitido es 2.`,
      });
      return;
    }


    try {
      const payload = {
        nombre: data.nombre,
        categoria: categoriaEnumValue,        // 🔥 debe matchear RobotCategory
        peso: pesoNumber,                     // número → IsNumber ok
        fotoUrl: data.fotoUrl || undefined,
        competitorId: user.competitorProfile.id,
        // nada de categoryId, el DTO no lo define
      };

      await robotService.createRobot(payload);

      Swal.fire(
        '¡Excelente!',
        'Tu robot ha sido registrado para el combate.',
        'success',
      );
      setShowForm(false);
      reset();
      loadRobots(user.competitorProfile.id);
    } catch (error: any) {
      console.error(error);

      let msg = 'No se pudo registrar el robot.';

      const resp = error?.response?.data;
      if (resp) {
        const m = resp.message;
        if (typeof m === 'string') {
          msg = m;
        } else if (Array.isArray(m)) {
          msg = m.join(', ');
        } else if (m && typeof m === 'object') {
          msg = Object.values(m)
            .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
            .join(' | ');
        }
      } else if (error?.message) {
        msg = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#EF4444',
      });
    }
  };


  // =========================
  //  DERIVADOS (STATS / FILTRO / ESTADOS)
  // =========================
  const nickname = user?.competitorProfile?.nickname || user?.email || 'Piloto';

  const totalPeso = useMemo(
    () =>
      robots.reduce((acc, r) => acc + (typeof r.peso === 'number' ? r.peso : 0), 0),
    [robots],
  );

  const distinctCategories = useMemo(
    () => Array.from(new Set(robots.map((r) => r.categoria))),
    [robots],
  );

  const filteredRobots = useMemo(
    () =>
      filterCategory === 'all'
        ? robots
        : robots.filter((r) => r.categoria === filterCategory),
    [robots, filterCategory],
  );

  // --- Estados que vienen del backend (owner + admin) ---
  const competitorStatus: 'pending' | 'approved' | 'suspended' =
    competitorInfo?.status ?? 'pending';

  const clubStatus: 'pending' | 'approved' | 'rejected' =
    competitorInfo?.club?.status ?? 'pending';

  const clubName: string = competitorInfo?.club?.nombre ?? 'Sin club asignado';

  const isSuspended = competitorStatus === 'suspended';
  const clubApproved = clubStatus === 'approved';
  const accountLocked = competitorInfo?.user?.isLocked ?? false;

  // reglas de negocio: solo puede crear robots / ir a torneos si
  // el club está aprobado y él no está suspendido
  const canEdit = clubApproved && !isSuspended;

  // =========================
  //  RENDER
  // =========================
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
          <p className="text-gray-700 text-sm mb-4">
            No se encontró información del usuario.
          </p>
          <button
            onClick={() => navigate('/internal')}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              RC
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                Robotech
              </p>
              <p className="text-xs text-slate-700 -mt-1">
                <span className="font-semibold">Pilot</span> Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">
                Piloto
              </span>
              <span className="text-xs font-medium text-slate-800 truncate max-w-[180px]">
                {nickname}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
              {nickname.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/internal');
              }}
              className="ml-1 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <section className="mb-6 bg-white rounded-2xl px-5 sm:px-6 py-5 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Panel de piloto
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                Mis robots de combate
                {robots.length > 0 && (
                  <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                    Activo en arena
                  </span>
                )}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-lg">
                Registra y administra tus máquinas. Cada robot registrado podrá ser
                inscrito en torneos oficiales.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <button
                onClick={() => {
                  if (!canEdit) return;
                  navigate('/torneos-disponibles');
                }}
                disabled={!canEdit}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm
                  ${
                    canEdit
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
              >
                🏆 Ir a torneos
              </button>
              <button
                onClick={() => {
                  if (!canEdit) return;
                  setShowForm((prev) => !prev);
                }}
                disabled={!canEdit}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border
                  ${
                    canEdit
                      ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                      : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                  }`}
              >
                {showForm ? 'Cancelar registro' : '+ Nuevo robot'}
              </button>
              <button
                onClick={async () => {
                  const competitorId = user?.competitorProfile?.id;
                  if (!competitorId) return;

                  // 🔥 asegura data fresca antes de mostrar
                  const latest = await loadIncidents(competitorId);

                  const html =
                    latest.length === 0
                      ? `<p style="color:#64748b;font-size:12px;">Sin incidencias registradas.</p>`
                      : latest
                          .map((ev) => {
                            const badge =
                              ev.source === 'TOURNAMENT'
                                ? `<span style="padding:2px 8px;border-radius:999px;background:#1d4ed8;color:white;font-size:11px;">TORNEO</span>`
                                : `<span style="padding:2px 8px;border-radius:999px;background:#7c3aed;color:white;font-size:11px;">CLUB</span>`;

                            const resolved =
                              ev.resolvedAt
                                ? `<span style="padding:2px 8px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;border:1px solid #bbf7d0;">RESUELTA</span>`
                                : `<span style="padding:2px 8px;border-radius:999px;background:#fff7ed;color:#9a3412;font-size:11px;border:1px solid #fed7aa;">ACTIVA</span>`;

                            const extra =
                              ev.source === 'TOURNAMENT' ? ` • ${(ev.tournament?.nombre ?? 'Torneo')}` : '';

                            const areaLabel = AREA_LABEL_BY_TYPE[ev.type] || ev.category || '—';
                          const typeLabel = TYPE_LABEL_BY_CODE[ev.type] || ev.type;


                            return `
                              <div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin:10px 0;text-align:left;">
                                <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
                                  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                                    ${badge}
                                    ${resolved}
                                    <b style="font-size:12px;">${escapeHtml(areaLabel)} • ${escapeHtml(typeLabel)}</b>
                                  </div>
                                  <span style="color:#64748b;font-size:12px;">Sev: ${ev.severity}</span>
                                </div>

                                <div style="color:#0f172a;margin-top:8px;font-size:12px;">
                                  ${escapeHtml(ev.description)}
                                </div>

                                <div style="color:#64748b;margin-top:8px;font-size:11px;">
                                  ${new Date(ev.createdAt).toLocaleString()}${extra}
                                </div>
                              </div>
                            `;
                          })
                          .join('');

                  await Swal.fire({
                    title: 'Mi historial de incidencias',
                    html,
                    confirmButtonText: 'Cerrar',
                    width: 760,
                  });
                }}
                disabled={loadingIncidents}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border
                  ${loadingIncidents ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed' : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'}`}
              >
                📜 Incidencias
                {incidents.length > 0 && (
                  <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {incidents.length}
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* INFO DE CLUB Y ESTADOS */}
          <div className="mt-4 flex flex-wrap gap-2 items-center text-[11px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-semibold">Club:</span>
              <span className="font-mono text-xs truncate max-w-[180px]">
                {loadingCompetitor ? 'Cargando...' : clubName}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                clubStatus === 'approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : clubStatus === 'rejected'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span className="font-semibold">Club:</span>
              <span className="capitalize">
                {clubStatus === 'approved'
                  ? 'Aprobado'
                  : clubStatus === 'rejected'
                  ? 'Rechazado'
                  : 'En revisión'}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                competitorStatus === 'approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : competitorStatus === 'suspended'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span className="font-semibold">Competidor:</span>
              <span className="capitalize">
                {competitorStatus === 'approved'
                  ? 'Activo'
                  : competitorStatus === 'suspended'
                  ? 'Suspendido'
                  : 'Pendiente'}
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                accountLocked
                  ? 'bg-sky-50 border-sky-200 text-sky-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <span className="font-semibold">Bloqueo de cuenta:</span>
              <span>{accountLocked ? 'Bloqueada por intentos' : 'Sin bloqueos'}</span>
            </div>

            <button
              type="button"
              onClick={handleMyIncidents}
              disabled={loadingEvents}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] disabled:opacity-60"
            >
              {loadingEvents ? 'Cargando…' : 'Mis incidencias'}
            </button>


          </div>

          {/* BANNERS EXPLICATIVOS */}
          {!loadingCompetitor && (
            <div className="mt-4 space-y-2 text-[11px]">
              {!clubApproved && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold">
                      Tu club aún no está aprobado ({clubStatus}).
                    </p>
                    <p>
                      Podrás registrar robots e inscribirte a torneos cuando el
                      administrador apruebe el club de tu dueño.
                    </p>
                  </div>
                </div>
              )}

              {isSuspended && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-800">
                  <span className="text-lg">⛔</span>
                  <div>
                    <p className="font-semibold">
                      Tu perfil de competidor está suspendido.
                    </p>
                    <p>
                      El dueño de tu club te ha inhabilitado. No puedes registrar robots
                      ni participar hasta que te reactive.
                    </p>
                  </div>
                </div>
              )}

              {accountLocked && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-800">
                  <span className="text-lg">🔐</span>
                  <div>
                    <p className="font-semibold">
                      Tu cuenta de acceso fue bloqueada por intentos fallidos.
                    </p>
                    <p>
                      Pide al dueño de tu club que desbloquee tu usuario desde su panel
                      de gestión.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATS */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
                Robots registrados
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{robots.length}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Máquinas listas para combatir
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
                Categorías activas
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {distinctCategories.length}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Tipos de competencia registrados
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
                Peso total
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {totalPeso.toFixed(0)}{' '}
                <span className="text-sm font-semibold text-slate-500">g</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Carga total de tu flota
              </p>
            </div>
          </div>
        </section>

        {/* FORMULARIO DE REGISTRO */}
        {showForm && (
          <section className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Registrar nueva máquina
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Completa los datos básicos de tu robot. Podrás editar detalles más
              adelante.
            </p>

            <form
              onSubmit={handleSubmit(onSubmitRobot)}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Nombre del robot
                </label>
                <input
                  {...register('nombre', { required: 'El nombre es obligatorio' })}
                  className="mt-1 block w-full text-sm border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                  placeholder="Ej. Destructor X"
                />
                {errors.nombre && (
                  <span className="text-red-500 text-[11px]">
                    {errors.nombre.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  {...register('categoria', { required: 'Selecciona una categoría' })}
                  className="mt-1 block w-full text-sm border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-slate-900"
                >
                  <option value="">Seleccione...</option>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.gameType}
                        {cat.maxWeightGrams > 0
                          ? ` - ${cat.maxWeightGrams}g`
                          : ' - Libre'}
                        )
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {loadingCategories
                        ? 'Cargando categorías...'
                        : 'No hay categorías disponibles'}
                    </option>
                  )}
                </select>

                {errors.categoria && (
                  <span className="text-red-500 text-[11px]">
                    {errors.categoria.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Peso (g)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('peso', {
                    required: 'El peso es obligatorio',
                    min: { value: 1, message: 'Peso inválido' },
                  })}
                  className="mt-1 block w-full text-sm border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                  placeholder="Ej. 300"
                />
                {errors.peso && (
                  <span className="text-red-500 text-[11px]">
                    {errors.peso.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Foto URL (opcional)
                </label>
                <input
                  {...register('fotoUrl')}
                  className="mt-1 block w-full text-sm border border-slate-300 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  Guardar robot
                </button>
              </div>
            </form>
          </section>
        )}

        {/* FILTRO DE CATEGORÍAS */}
        {robots.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] text-slate-500 uppercase tracking-[0.16em]">
              Filtrar por categoría
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1 text-[11px] rounded-full border ${
                  filterCategory === 'all'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                Todas
              </button>
              {distinctCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 text-[11px] rounded-full border ${
                    filterCategory === cat
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LISTA DE ROBOTS */}
        {loadingRobots ? (
          <div className="text-center py-12 text-slate-500">
            Cargando tus robots...
          </div>
        ) : filteredRobots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-700 text-sm mb-1">
              {robots.length === 0
                ? 'Aún no tienes robots registrados.'
                : 'No hay robots en esta categoría.'}
            </p>
            <p className="text-[11px] text-slate-500 mb-4">
              {robots.length === 0
                ? 'Registra tu primera máquina para entrar a la arena.'
                : 'Prueba con otra categoría o registra un nuevo robot.'}
            </p>
            <button
              onClick={() => canEdit && setShowForm(true)}
              disabled={!canEdit}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium shadow-sm
                ${
                  canEdit
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              + Registrar robot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRobots.map((robot) => (
              <div
                key={robot.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 group"
              >
                <div className="h-32 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 flex items-center justify-center relative">
                  {robot.fotoUrl ? (
                    <img
                      src={robot.fotoUrl}
                      alt={robot.nombre}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                    />
                  ) : (
                    <span className="text-4xl">🤖</span>
                  )}
                  <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-[11px] px-2 py-1 rounded-full">
                    {robot.peso} g
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Listo para combatir
                  </div>
                </div>
                <div className="p-4">
                  <div className="uppercase tracking-[0.16em] text-[10px] text-blue-600 mb-1">
                    {robot.categoria}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                    {robot.nombre}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Diseñado por <span className="font-medium">{nickname}</span>
                  </p>

                  {/* ✅ Badge de estado */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full border ${
                        robot.status === 'Activo'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : robot.status === 'En mantenimiento'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {robot.status}
                    </span>

                    {/* ✅ Acciones rápidas de estado */}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(robot.id, 'Activo')}
                        className="text-[10px] px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
                      >
                        ⚔️ Activo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(robot.id, 'En mantenimiento')}
                        className="text-[10px] px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
                      >
                        🔧 Mant.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(robot.id, 'Destruido en batalla')}
                        className="text-[10px] px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
                      >
                        💥 Dest.
                      </button>
                    </div>
                  </div>

                  {/* ✅ Botón eliminar abajo a la derecha */}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteRobot(robot.id)}
                      className="text-[10px] px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN NAVEGACIÓN INFERIOR */}
        <section className="mt-10 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Siguientes pasos
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => {
                if (!canEdit) return;
                navigate('/torneos-disponibles');
              }}
              disabled={!canEdit}
              className={`relative flex items-center justify-center w-full rounded-2xl p-6 text-center transition group
                ${
                  canEdit
                    ? 'border border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer'
                    : 'border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
            >
              <div>
                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">
                  🏆
                </span>
                <span className="block text-sm font-semibold text-slate-900">
                  Inscribirse a torneos
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Ver eventos abiertos y seleccionar robots para competir.
                </span>
              </div>
            </button>

            <div className="relative flex items-center justify-center w-full border border-slate-200 rounded-2xl p-6 text-center bg-white">
              <div>
                <span className="text-3xl block mb-2">⚙️</span>
                <span className="block text-sm font-medium text-slate-900">
                  Gestionar equipo
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Próximamente: estadísticas avanzadas, historial de combates y más.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
