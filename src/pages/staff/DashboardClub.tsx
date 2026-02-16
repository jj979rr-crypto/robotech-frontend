import { useEffect, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  clubService,
  type Competitor,
  type CompetitorStatus,
} from '../../services/clubService';
import { competitorService } from '../../services/competitorService';
import { userService } from '../../services/userService';
import { behaviorService, type BehaviorEvent } from '../../services/behaviorService';
import Swal from 'sweetalert2';
import type { BehaviorCategory } from '../../services/behaviorService';

type TabKey = 'overview' | 'competitors' | 'tournaments' | 'settings';
type AreaKey = 'ADMIN_DOC' | 'WORKSHOP_RESOURCES' | 'COMMITMENT_ATTENDANCE' | 'INTERNAL_CONDUCT';

const INCIDENT_AREAS: Array<{ key: AreaKey; label: string; category: BehaviorCategory }> = [
  { key: 'ADMIN_DOC', label: 'Administrativas / documentarias', category: 'TECHNICAL' },
  { key: 'WORKSHOP_RESOURCES', label: 'Taller / recursos', category: 'TECHNICAL' },
  { key: 'COMMITMENT_ATTENDANCE', label: 'Compromiso / asistencia', category: 'CONDUCT' },
  { key: 'INTERNAL_CONDUCT', label: 'Conducta interna / convivencia', category: 'CONDUCT' },
];

const INCIDENT_TYPES: Record<
  AreaKey,
  Array<{ code: string; label: string; defaultSeverity: number }>
> = {
  ADMIN_DOC: [
    { code: 'MISSING_DNI_COPY', label: 'Olvido de DNI / copia', defaultSeverity: 2 },
    { code: 'MISSING_WAIVER', label: 'Falta de waiver / permiso legal', defaultSeverity: 5 },
    { code: 'DUES_ARREARS', label: 'Deuda de cuotas', defaultSeverity: 4 },
    { code: 'NOT_REGISTERED_SYSTEM', label: 'No registro en el sistema a tiempo', defaultSeverity: 2 },
  ],
  WORKSHOP_RESOURCES: [
    { code: 'DAMAGE_NEGLIGENCE', label: 'Daño por negligencia (componentes)', defaultSeverity: 4 },
    { code: 'TOOL_LOSS', label: 'Pérdida de herramientas', defaultSeverity: 3 },
    { code: 'MACHINE_MISUSE', label: 'Mal uso de maquinaria', defaultSeverity: 4 },
    { code: 'MATERIAL_WASTE', label: 'Desperdicio de material', defaultSeverity: 2 },
    { code: 'WORKSHOP_SAFETY_VIOLATION', label: 'Falta de seguridad en taller', defaultSeverity: 5 },
  ],
  COMMITMENT_ATTENDANCE: [
    { code: 'NO_SHOW_CRITICAL', label: 'Ausencia a reunión crítica', defaultSeverity: 3 },
    { code: 'LATE_CRITICAL', label: 'Llegada tarde a reunión clave', defaultSeverity: 2 },
    { code: 'MISSED_DEADLINE', label: 'Incumplimiento de deadline', defaultSeverity: 3 },
    { code: 'TASK_ABANDONMENT', label: 'Abandono de tareas', defaultSeverity: 3 },
  ],
  INTERNAL_CONDUCT: [
    { code: 'INTERPERSONAL_CONFLICT', label: 'Conflicto interpersonal', defaultSeverity: 3 },
    { code: 'BAD_REPRESENTATION', label: 'Mala representación del club', defaultSeverity: 3 },
    { code: 'AGGRESSION_OR_SABOTAGE', label: 'Agresión / sabotaje / robo', defaultSeverity: 5 },
    { code: 'TOXICITY', label: 'Toxicidad / insultos', defaultSeverity: 3 },
  ],
};

// Para mostrar en español en historial aunque el backend guarde códigos
const TYPE_LABEL_BY_CODE = Object.values(INCIDENT_TYPES)
  .flat()
  .reduce<Record<string, string>>((acc, t) => {
    acc[t.code] = t.label;
    return acc;
  }, {});

const AREA_LABEL_BY_TYPE = (() => {
  const map: Record<string, string> = {};
  for (const area of INCIDENT_AREAS) {
    for (const t of INCIDENT_TYPES[area.key]) map[t.code] = area.label;
  }
  return map;
})();

const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const RISK_WINDOW_DAYS = 30;

type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

const computeRisk = (events: BehaviorEvent[]) => {
  const now = Date.now();
  const windowMs = RISK_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // solo últimos 30 días (luego aquí filtraremos “no resueltas” cuando exista resolvedAt)
const recent = (events || []).filter((e) => {
  const within30 = now - new Date(e.createdAt).getTime() <= windowMs;
  const active = !e.resolvedAt; // solo activas
  return within30 && active;
});


  const yellowCount = recent.filter((e) => e.severity <= 2).length;

  // SOLO severidad 5
  const hasSev5 = recent.some((e) => e.severity === 5);
  const hasSev4 = recent.some((e) => e.severity === 4);
  const hasSev3 = recent.some((e) => e.severity === 3);

  let level: RiskLevel = 'GREEN';
  if (hasSev5) level = 'RED';
  else if (hasSev4 || hasSev3 || yellowCount >= 3) level = 'ORANGE';
  else if (yellowCount > 0) level = 'YELLOW';

  const ui =
    level === 'GREEN'
      ? { label: '🟢 Verde', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
      : level === 'YELLOW'
      ? { label: '🟡 Amarillo', cls: 'bg-amber-50 border-amber-200 text-amber-800' }
      : level === 'ORANGE'
      ? { label: '🟠 Naranja', cls: 'bg-orange-50 border-orange-200 text-orange-800' }
      : { label: '🔴 Rojo', cls: 'bg-red-50 border-red-200 text-red-700' };

  return { level, ...ui, recentCount: recent.length, yellowCount };
};

// ======= ICONS =======
const IconCalendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const IconMapPin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

// ====== DASHBOARD CLUB ======
export const DashboardClub = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorsCount, setCompetitorsCount] = useState(0);

  const [clubForm, setClubForm] = useState({
    descripcion: '',
    direccion: '',
  });

  const [savingClub, setSavingClub] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  // Modal de detalle de competidor
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(
    null,
  );
  const [selectedCompetitorRobots, setSelectedCompetitorRobots] = useState<any[]>(
    [],
  );
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [loadingRobots, setLoadingRobots] = useState(false);

  const [selectedCompetitorEvents, setSelectedCompetitorEvents] = useState<BehaviorEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsCacheByCompetitor, setEventsCacheByCompetitor] = useState<Record<string, BehaviorEvent[]>>({});

  const [clubTournaments, setClubTournaments] = useState<any[]>([]); // Usa la interfaz ClubTournament si la importaste
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  // ====== DERIVADOS DEL USER ======
  const club = user?.clubProfile;
  const isApproved = club?.status === 'approved';

  const cacheRef = useRef(eventsCacheByCompetitor);
  // 1) init dashboard
  useEffect(() => {
    const initDashboard = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/internal');
        return;
      }

      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);

      if (parsedUser.clubProfile?.id) {
        await refreshClubData(parsedUser);
      }

      setLoading(false);
    };

    initDashboard();
  }, [navigate]);

  // 2) mantener el ref sincronizado
  useEffect(() => {
    cacheRef.current = eventsCacheByCompetitor;
  }, [eventsCacheByCompetitor]);

  useEffect(() => {
    const fetchTournaments = async () => {
      if (activeTab === 'tournaments' && club?.id) {
        setLoadingTournaments(true);
        try {
          const data = await clubService.getTournaments(club.id);
          setClubTournaments(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error cargando torneos del club', error);
          // Opcional: showToast('Error al cargar torneos', 'error');
        } finally {
          setLoadingTournaments(false);
        }
      }
    };

    fetchTournaments();
  }, [activeTab, club?.id]);




  const refreshClubData = async (currentUser: any) => {
    const clubId = currentUser.clubProfile.id;

    // A. Estado del club (status + código + datos básicos)
    try {
      const statusData = await clubService.getStatus(clubId);

      if (statusData && currentUser.clubProfile) {
        const statusChanged = currentUser.clubProfile.status !== statusData.status;

        const updatedUser = {
          ...currentUser,
          clubProfile: {
            ...currentUser.clubProfile,
            status: statusData.status,
            codigoInvitacion: statusData.codigoInvitacion,
            descripcion:
              statusData.descripcion ?? currentUser.clubProfile.descripcion,
            direccion: statusData.direccion ?? currentUser.clubProfile.direccion,
          },
        };

        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        if (statusChanged && statusData.status === 'approved') {
          showToast('¡Tu club ha sido aprobado!', 'success');
        }

        setClubForm({
          descripcion: updatedUser.clubProfile.descripcion || '',
          direccion: updatedUser.clubProfile.direccion || '',
        });
      }
    } catch (err) {
      console.error('Error al obtener estado del club', err);
    }

    // B. Competidores
    try {
      const competitorsList = await clubService.getCompetitors(clubId);
      setCompetitors(Array.isArray(competitorsList) ? competitorsList : []);
      setCompetitorsCount(
        Array.isArray(competitorsList) ? competitorsList.length : 0,
      );
    } catch (err) {
      console.error('Error al obtener competidores', err);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(
      () => setToast({ show: false, message: '', type: 'success' }),
      3500,
    );
  };

  const copyToClipboard = () => {
    if (user?.clubProfile?.codigoInvitacion) {
      navigator.clipboard.writeText(user.clubProfile.codigoInvitacion);
      showToast('¡Código copiado!', 'success');
    }
  };



  // ====== HANDLERS ======

  const handleUnlockCompetitor = async (competitor: Competitor) => {
    if (!isApproved) {
      showToast(
        'Tu club aún no está aprobado. No puedes gestionar competidores.',
        'error',
      );
      return;
    }

    const userId = competitor.user?.id;
    if (!userId) return;

    try {
      await userService.unlockCompetitor(userId);

      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === competitor.id
            ? {
                ...c,
                user: c.user && { ...c.user, isLocked: false },
              }
            : c,
        ),
      );

      showToast('Cuenta de competidor desbloqueada.', 'success');
    } catch (error: any) {
      console.error('Error unlockCompetitor:', error);
      console.log('Backend data:', error?.response?.data);

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo desbloquear al competidor.';

      showToast(msg, 'error');
    }
  };



  const handleChangeCompetitorStatus = async (
    competitor: Competitor,
    newStatus: CompetitorStatus,
  ) => {
    if (!isApproved) {
      showToast(
        'Tu club aún no está aprobado. No puedes gestionar competidores.',
        'error',
      );
      return;
    }

    try {
      const updated = await competitorService.changeStatus(
        competitor.id,
        newStatus,
      );

      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === competitor.id ? { ...c, status: updated.status } : c,
        ),
      );

      showToast(
        newStatus === 'suspended'
          ? 'Competidor inhabilitado.'
          : 'Competidor reactivado.',
        'success',
      );
    } catch (error: any) {
      console.error(error);
      showToast('No se pudo actualizar el estado del competidor.', 'error');
    }
  };

  const handleDeleteCompetitor = async (competitor: Competitor) => {
    const confirmDelete = window.confirm(
      `¿Eliminar al competidor ${competitor.nombres} ${competitor.apellidos}?`,
    );
    if (!confirmDelete) return;

    try {
      await competitorService.delete(competitor.id);
      setCompetitors((prev) => prev.filter((c) => c.id !== competitor.id));
      setCompetitorsCount((prev) => Math.max(prev - 1, 0));
      showToast('Competidor eliminado correctamente.', 'success');
    } catch (error) {
      console.error(error);
      showToast(
        'No se pudo eliminar al competidor. Verifica si tiene robots o inscripciones asociadas.',
        'error',
      );
    }
  };

  const handleViewCompetitor = async (competitor: Competitor) => {
    setSelectedCompetitor(competitor);

    // robots
    setSelectedCompetitorRobots([]);
    setLoadingRobots(true);

    // historial
    setSelectedCompetitorEvents([]);
    setLoadingEvents(true);

    setShowCompetitorModal(true);

    try {
      const [robots, events] = await Promise.all([
        competitorService.getRobots(competitor.id),
        behaviorService.listByCompetitor(competitor.id),
      ]);

      setSelectedCompetitorRobots(Array.isArray(robots) ? robots : []);
      setSelectedCompetitorEvents(Array.isArray(events) ? events : []);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los datos del competidor.', 'error');
    } finally {
      setLoadingRobots(false);
      setLoadingEvents(false);
    }
  };


  const handleClubFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setClubForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClubSettings = async () => {
    if (!club?.id) return;
    try {
      setSavingClub(true);
      const updated = await clubService.update(club.id, clubForm);

      const updatedUser = {
        ...user,
        clubProfile: {
          ...club,
          descripcion: updated.descripcion ?? clubForm.descripcion,
          direccion: updated.direccion ?? clubForm.direccion,
        },
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      showToast('Datos del club actualizados.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Error al actualizar los datos del club.', 'error');
    } finally {
      setSavingClub(false);
    }
  };


  const handleCreateClubIncident = async (competitor: Competitor) => {
    if (!isApproved) {
      showToast('Tu club aún no está aprobado. No puedes registrar incidencias.', 'error');
      return;
    }

    const areaOptions = INCIDENT_AREAS.map(a => `<option value="${a.key}">${a.label}</option>`).join('');
    const defaultArea: AreaKey = 'ADMIN_DOC';
    const defaultTypes = INCIDENT_TYPES[defaultArea]
      .map(t => `<option value="${t.code}">${t.label}</option>`)
      .join('');

    const { value } = await Swal.fire({
      title: `Incidencia (Club) — @${competitor.nickname}`,
      html: `
        <div style="text-align:left; display:flex; flex-direction:column; gap:10px;">
          <label style="font-size:12px;">Área</label>
          <select id="area" class="swal2-input" style="margin:0;">${areaOptions}</select>

          <label style="font-size:12px;">Tipo</label>
          <select id="typeCode" class="swal2-input" style="margin:0;">${defaultTypes}</select>

          <label style="font-size:12px;">Severidad (1-5)</label>
          <input id="sev" type="number" min="1" max="5" value="2" class="swal2-input" style="margin:0;" />

          <label style="font-size:12px;">Detalles</label>
          <textarea id="desc" class="swal2-textarea" placeholder="Describe lo ocurrido..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Cancelar',

      didOpen: () => {
        const areaEl = document.getElementById('area') as HTMLSelectElement;
        const typeEl = document.getElementById('typeCode') as HTMLSelectElement;
        const sevEl = document.getElementById('sev') as HTMLInputElement;

        const renderTypes = (areaKey: AreaKey) => {
          const types = INCIDENT_TYPES[areaKey];
          typeEl.innerHTML = types.map(t => `<option value="${t.code}">${t.label}</option>`).join('');
          sevEl.value = String(types[0]?.defaultSeverity ?? 3);
        };

        areaEl.value = defaultArea;
        renderTypes(defaultArea);

        areaEl.addEventListener('change', () => renderTypes(areaEl.value as AreaKey));

        typeEl.addEventListener('change', () => {
          const areaKey = areaEl.value as AreaKey;
          const t = INCIDENT_TYPES[areaKey].find(x => x.code === typeEl.value);
          if (t) sevEl.value = String(t.defaultSeverity);
        });
      },

    preConfirm: () => {
      const areaKey = (document.getElementById('area') as HTMLSelectElement).value as AreaKey;
      const typeCode = (document.getElementById('typeCode') as HTMLSelectElement).value;
      const description = (document.getElementById('desc') as HTMLTextAreaElement).value.trim();

      if (!typeCode || !description) {
        Swal.showValidationMessage('Completa tipo y detalles.');
        return;
      }

      const category = INCIDENT_AREAS.find(a => a.key === areaKey)!.category;

      const t = INCIDENT_TYPES[areaKey].find(x => x.code === typeCode);
      const severity = t?.defaultSeverity ?? 3;

      return { category, type: typeCode, severity, description };
    },

    });

    if (!value) return;

    try {
      await behaviorService.createClubIncident(competitor.id, value);
      showToast('Incidencia registrada.', 'success');

      // refrescar historial + cache
      const events = await behaviorService.listByCompetitor(competitor.id);
      const safeEvents = Array.isArray(events) ? events : [];

      if (selectedCompetitor?.id === competitor.id) setSelectedCompetitorEvents(safeEvents);

      setEventsCacheByCompetitor((prev) => ({ ...prev, [competitor.id]: safeEvents }));
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || error?.message || 'No se pudo registrar la incidencia.';
      showToast(Array.isArray(msg) ? msg[0] : msg, 'error');
    }
  };


  const handleQuickHistory = async (competitor: Competitor) => {
    try {
      const events = await behaviorService.listByCompetitor(competitor.id);

      const html =
        !events || events.length === 0
          ? `<p style="color:#64748b;font-size:12px;">Sin incidencias registradas.</p>`
          : events
              .map((ev: any) => {
                const badge =
                  ev.source === 'TOURNAMENT'
                    ? `<span style="padding:2px 8px;border-radius:999px;background:#1d4ed8;color:white;font-size:11px;">TORNEO</span>`
                    : `<span style="padding:2px 8px;border-radius:999px;background:#7c3aed;color:white;font-size:11px;">CLUB</span>`;

                const extra =
                  ev.source === 'TOURNAMENT' ? ` • ${(ev.tournament?.nombre ?? 'Torneo')}` : '';

                const areaLabel = AREA_LABEL_BY_TYPE[ev.type] || '—';
                const typeLabel = TYPE_LABEL_BY_CODE[ev.type] || ev.type;

                return `
                  <div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin:10px 0;text-align:left;">
                    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
                      <div style="display:flex;gap:8px;align-items:center;">
                        ${badge}
                        <b style="font-size:12px;">${escapeHtml(areaLabel)} • ${escapeHtml(typeLabel)}</b>
                      </div>
                      <span style="color:#64748b;font-size:12px;">Sev: ${ev.severity}</span>
                    </div>
                    <div style="color:#0f172a;margin-top:8px;font-size:12px;">${escapeHtml(ev.description)}</div>
                    <div style="color:#64748b;margin-top:8px;font-size:11px;">
                      ${new Date(ev.createdAt).toLocaleString()}${extra}
                    </div>
                  </div>
                `;
              })
              .join('');

      await Swal.fire({
        title: `Historial — @${competitor.nickname}`,
        html,
        confirmButtonText: 'Cerrar',
        width: 700,
      });
    } catch (error) {
      console.error(error);
      showToast('No se pudo cargar el historial.', 'error');
    }
  };

  const handleResolveIncident = async (competitorId: string, eventId: string) => {
    if (!isApproved) {
      showToast('Tu club aún no está aprobado.', 'error');
      return;
    }

    const ok = await Swal.fire({
      title: '¿Marcar como resuelta?',
      text: 'La incidencia quedará resuelta (no se elimina del historial).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Cancelar',
    });

    if (!ok.isConfirmed) return;

    try {
      await behaviorService.resolveEvent(eventId);

      const events = await behaviorService.listByCompetitor(competitorId);
      const safe = Array.isArray(events) ? events : [];

      if (selectedCompetitor?.id === competitorId) setSelectedCompetitorEvents(safe);
      setEventsCacheByCompetitor((prev) => ({ ...prev, [competitorId]: safe }));

      showToast('Incidencia marcada como resuelta.', 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'No se pudo marcar como resuelta.';
      showToast(Array.isArray(msg) ? msg[0] : msg, 'error');
    }
  };

  // ====== SPINNER INICIAL ======
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      {/* TOAST */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-500 transform ${
          toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div
          className={`bg-white border-l-4 shadow-xl rounded-r-lg p-4 flex items-center pr-6 ${
            toast.type === 'success' ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <span
            className={`text-xl mr-3 ${
              toast.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {toast.type === 'success' ? '✓' : '⚠️'}
          </span>
          <div>
            <p className="font-bold text-gray-800 text-sm">Notificación</p>
            <p className="text-sm text-gray-600">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur shadow-sm px-6 py-3 flex justify-between items-center sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            R
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              ROBOTECH <span className="text-blue-600">MANAGER</span>
            </h1>
            <p className="text-[11px] text-slate-500">Panel dueño de club</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 hidden sm:block truncate max-w-[200px]">
            {user.email}
          </span>
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/internal');
            }}
            className="text-xs text-red-600 font-medium hover:text-red-800 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <section className="mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl px-6 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
              Panel de gestión de club
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold flex items-center gap-2">
              {club?.nombre || 'Mi Club'}
              {isApproved && (
                <span className="inline-flex items-center text-[11px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mr-1" />
                  Verificado
                </span>
              )}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-md">
              Gestiona tus competidores, tu presencia en los torneos y los datos públicos
              de tu club.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-col items-end gap-2">
            <div
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2 border ${
                club?.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-200 border-emerald-300/50'
                  : club?.status === 'rejected'
                  ? 'bg-red-500/10 text-red-200 border-red-300/50'
                  : 'bg-amber-500/10 text-amber-200 border-amber-300/60'
              }`}
            >
              {club?.status === 'pending' && (
                <span className="w-1.5 h-1.5 bg-amber-300 rounded-full animate-pulse" />
              )}
              {club?.status === 'approved' && 'Estado: Aprobado'}
              {club?.status === 'pending' && 'Estado: En revisión'}
              {club?.status === 'rejected' && 'Estado: Rechazado'}
            </div>

            <p className="text-[11px] text-slate-300">
              ID club: <span className="font-mono">{club?.id?.slice(0, 8)}...</span>
            </p>
          </div>
        </section>

        {/* TABS */}
        <div className="border-b border-slate-200 mb-5 flex gap-3 overflow-x-auto">
          {[
            { key: 'overview', label: 'Resumen' },
            { key: 'competitors', label: 'Competidores' },
            { key: 'tournaments', label: 'Torneos' },
            { key: 'settings', label: 'Configuración' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`relative px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Estado */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
                Estado actual
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 capitalize">
                {club?.status === 'pending'
                  ? 'Pendiente'
                  : club?.status === 'approved'
                  ? 'Aprobado'
                  : club?.status === 'rejected'
                  ? 'Rechazado'
                  : 'Desconocido'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {club?.status === 'pending'
                  ? 'Tu club está siendo revisado por el administrador.'
                  : club?.status === 'approved'
                  ? 'Tu club ya puede operar normalmente en torneos.'
                  : club?.status === 'rejected'
                  ? 'Revisa las observaciones del administrador para corregir tu registro.'
                  : ''}
              </p>
            </div>

            {/* Código invitación */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
                Código de invitación
              </p>

              {isApproved ? (
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 truncate flex-1">
                    {club?.codigoInvitacion || 'ERROR'}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Copiar código"
                  >
                    📋
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                  <span className="text-slate-400">🔒</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Se habilitará cuando el administrador apruebe tu club.
                  </span>
                </div>
              )}
            </div>

            {/* Competidores */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500/80" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
                Competidores
              </p>
              <p className="mt-2 text-4xl font-black text-indigo-600">
                {competitorsCount}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Miembros registrados en tu club
              </p>

              <button
                onClick={() => setActiveTab('competitors')}
                className="mt-4 inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Ver detalle
                <span className="ml-1">↗</span>
              </button>
            </div>
          </section>
        )}

        {/* COMPETITORS */}
        {activeTab === 'competitors' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Competidores de tu club
                </h3>
                <p className="text-xs text-slate-500">
                  Gestiona su estado, acceso y revisa sus robots registrados.
                </p>
              </div>
              {isApproved ? (
                <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                  Gestión habilitada
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                  Tu club aún no está aprobado
                </span>
              )}
            </div>

            {competitors.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-500">
                Aún no hay competidores registrados. Comparte tu código de invitación
                una vez tu club sea aprobado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-slate-400 border-b border-slate-100">
                      <th className="py-2 pr-3">Competidor</th>
                      <th className="py-2 pr-3">Nickname</th>
                      <th className="py-2 pr-3">Estado competidor</th>
                      <th className="py-2 pr-3">Estado cuenta</th>
                      <th className="py-2 pr-3">Riesgo</th>
                      <th className="py-2 pr-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp) => {
                      const isLocked = comp.user?.isLocked;
                      const status: CompetitorStatus =
                        (comp.status as CompetitorStatus) || 'pending';
                      const risk = computeRisk(eventsCacheByCompetitor[comp.id] || []);


                      return (
                        <tr
                          key={comp.id}
                          className="border-b border-slate-50 hover:bg-slate-50/60"
                        >
                          {/* Competidor */}
                          <td className="py-2 pr-3">
                            <p className="text-xs font-medium text-slate-900">
                              {comp.nombres} {comp.apellidos}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              DNI: {comp.dni}
                            </p>
                          </td>

                          {/* Nickname */}
                          <td className="py-2 pr-3 text-xs text-slate-700">
                            @{comp.nickname}
                          </td>

                          {/* Estado Competidor */}
                          <td className="py-2 pr-3">
                            {status === 'suspended' ? (
                              <span className="inline-flex items-center text-[11px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                ● Suspendido
                              </span>
                            ) : status === 'approved' ? (
                              <span className="inline-flex items-center text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                ● Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                ● Pendiente
                              </span>
                            )}
                          </td>

                          {/* Estado cuenta */}
                          <td className="py-2 pr-3">
                            {isLocked ? (
                              <span className="inline-flex items-center text-[11px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                ● Bloqueado
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                ● Normal
                              </span>
                            )}
                          </td>

                          {/* Riesgo */}
                          <td className="py-2 pr-3">
                            <span
                              title={`Incidencias (30 días): ${risk.recentCount}`}
                              className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border ${risk.cls}`}
                            >
                              {risk.label}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-2 pr-3 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">

                              {/* Incidencia (club) */}
                              <button
                                onClick={() => handleCreateClubIncident(comp)}
                                disabled={!isApproved}
                                className={`text-[11px] px-2 py-1 rounded-lg border ${
                                  isApproved
                                    ? 'border-purple-200 text-purple-700 hover:bg-purple-50'
                                    : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Incidencia
                              </button>

                              {/* Historial rápido */}
                              <button
                                onClick={() => handleQuickHistory(comp)}
                                className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                              >
                                Historial
                              </button>

                              {/* Ver */}
                              <button
                                onClick={() => handleViewCompetitor(comp)}
                                className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                              >
                                Ver
                              </button>

                              {/* Aprobar / Inhabilitar / Habilitar */}
                              {status === 'pending' && (
                                <button
                                  onClick={() =>
                                    handleChangeCompetitorStatus(comp, 'approved')
                                  }
                                  disabled={!isApproved}
                                  className={`text-[11px] px-2 py-1 rounded-lg border ${
                                    isApproved
                                      ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                      : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  Aprobar
                                </button>
                              )}

                              {status === 'approved' && (
                                <button
                                  onClick={() =>
                                    handleChangeCompetitorStatus(comp, 'suspended')
                                  }
                                  disabled={!isApproved}
                                  className={`text-[11px] px-2 py-1 rounded-lg border ${
                                    isApproved
                                      ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                      : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  Inhabilitar
                                </button>
                              )}

                              {status === 'suspended' && (
                                <button
                                  onClick={() =>
                                    handleChangeCompetitorStatus(comp, 'approved')
                                  }
                                  disabled={!isApproved}
                                  className={`text-[11px] px-2 py-1 rounded-lg border ${
                                    isApproved
                                      ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                      : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  Habilitar
                                </button>
                              )}

                              {/* Desbloquear login (bloqueo por intentos) */}
                              {isLocked && (
                                <button
                                  onClick={() => handleUnlockCompetitor(comp)}
                                  disabled={!isApproved}
                                  className={`text-[11px] px-2 py-1 rounded-lg border ${
                                    isApproved
                                      ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                                      : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  Desbloquear
                                </button>
                              )}

                              {/* Eliminar */}
                              <button
                                onClick={() => handleDeleteCompetitor(comp)}
                                className="text-[11px] px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TOURNAMENTS (placeholder) */}
        {activeTab === 'tournaments' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Historial de Torneos
                </h3>
                <p className="text-xs text-slate-500">
                  Eventos donde tu club tiene presencia o ha participado.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                Total: {clubTournaments.length}
              </span>
            </div>

            {loadingTournaments ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : clubTournaments.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50/50">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
                  <IconCalendar className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-900">Sin participación aún</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Tu club no ha registrado inscripciones en ningún torneo activo o pasado.
                </p>
                <button 
                  onClick={() => navigate('/torneos-disponibles')} // Asumiendo que esta ruta existe para ver el marketplace
                  className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Explorar torneos disponibles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {clubTournaments.map((torneo) => {
                   // Calcular estado visual
                   const isActive = ['PENDIENTE', 'EN_CURSO'].includes(torneo.estado);

                   return (
                    <div 
                      key={torneo.id} 
                      className="group border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white"
                    >
                      {/* Fecha Box */}
                      <div className="flex-shrink-0 w-full sm:w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center justify-center text-slate-600">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {new Date(torneo.fechaInicio).toLocaleString('es-ES', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold text-slate-800 leading-none">
                          {new Date(torneo.fechaInicio).getDate()}
                        </span>
                      </div>

                      {/* Info Principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {torneo.nombre}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {isActive ? 'Activo' : 'Finalizado'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          {torneo.location && (
                            <span className="flex items-center gap-1 truncate">
                              <IconMapPin className="w-3.5 h-3.5 text-slate-400" />
                              {torneo.location.nombre}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {torneo.inscripcionesCount || 0} inscripciones del club
                          </span>
                        </div>
                      </div>

                      {/* Botón Acción */}
                      <div>
                        <button
                          onClick={() => navigate(`/torneos/${torneo.id}/inscritos`)}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Ver Inscritos
                        </button>
                      </div>
                    </div>
                   );
                })}
              </div>
            )}
          </section>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Configuración del club
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Edita solo datos no críticos que se mostrarán en la landing o en el
              marketplace (descripción y dirección).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Descripción pública
                </label>
                <textarea
                  name="descripcion"
                  value={clubForm.descripcion}
                  onChange={handleClubFormChange}
                  rows={4}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none"
                  placeholder="Describe brevemente a tu club, enfoque, experiencia, etc."
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={clubForm.direccion}
                  onChange={handleClubFormChange}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  placeholder="Ej. Av. Siempre Viva 123, Lima"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Este dato puede mostrarse en la información de sedes o contacto.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                disabled={savingClub}
                onClick={handleSaveClubSettings}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {savingClub && (
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Guardar cambios
              </button>
            </div>
          </section>
        )}

        {/* MODAL DETALLE COMPETIDOR */}
        {showCompetitorModal && selectedCompetitor && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 relative">
              <button
                onClick={() => {
                  setShowCompetitorModal(false);
                  setSelectedCompetitor(null);
                  setSelectedCompetitorRobots([]);
                  setSelectedCompetitorEvents([]);
                }}

                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>

              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                Detalles del competidor
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {selectedCompetitor.nombres} {selectedCompetitor.apellidos}{' '}
                (@{selectedCompetitor.nickname})
              </p>

              {/* Datos básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-600">DNI</p>
                  <p className="font-mono text-slate-800">
                    {selectedCompetitor.dni}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-slate-600">Correo</p>
                  <p className="text-slate-800 break-all">
                    {selectedCompetitor.user?.email || '—'}
                  </p>
                </div>
              </div>

              {/* Estado de cuenta */}
              <div className="mb-3 text-xs text-slate-600 space-y-1">
                <p>
                  <span className="font-semibold">Estado competidor:</span>{' '}
                  <span
                    className={
                      selectedCompetitor.status === 'suspended'
                        ? 'text-red-600'
                        : selectedCompetitor.status === 'approved'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }
                  >
                    {selectedCompetitor.status === 'approved'
                      ? 'Aprobado'
                      : selectedCompetitor.status === 'suspended'
                      ? 'Suspendido'
                      : 'Pendiente'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Cuenta bloqueada:</span>{' '}
                  {selectedCompetitor.user?.isLocked ? 'Sí (por intentos)' : 'No'}
                </p>
              </div>

              <div>
                <h5 className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-[0.16em]">
                  Robots registrados
                </h5>

                {loadingRobots ? (
                  <div className="py-4 text-center text-xs text-slate-500">
                    Cargando robots...
                  </div>
                ) : selectedCompetitorRobots.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-500">
                    Este competidor aún no tiene robots registrados.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedCompetitorRobots.map((robot: any) => (
                      <li
                        key={robot.id}
                        className="border border-slate-100 rounded-lg px-3 py-2 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {robot.nombre}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Categoría: {robot.categoria}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* HISTORIAL DE INCIDENCIAS */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
                    Historial de incidencias
                  </h5>

                  <button
                    onClick={() => handleCreateClubIncident(selectedCompetitor)}
                    disabled={!isApproved}
                    className={`text-[11px] px-2 py-1 rounded-lg border ${
                      isApproved
                        ? 'border-purple-200 text-purple-700 hover:bg-purple-50'
                        : 'border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    + Registrar
                  </button>
                </div>

                {loadingEvents ? (
                  <div className="py-3 text-center text-xs text-slate-500">
                    Cargando incidencias...
                  </div>
                ) : selectedCompetitorEvents.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-500">
                    No hay incidencias registradas para este competidor.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {selectedCompetitorEvents.map((ev: any) => (
                      <li
                          key={ev.id}
                          className="border border-slate-100 rounded-lg px-3 py-2 text-xs"
                        >
                          {(() => {
                            const isResolved = !!ev.resolvedAt; // requiere que el backend devuelva resolvedAt (o null)

                            return (
                              <>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        ev.source === 'TOURNAMENT'
                                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                                          : 'bg-purple-50 border-purple-200 text-purple-700'
                                      }`}
                                    >
                                      {ev.source === 'TOURNAMENT' ? 'TORNEO' : 'CLUB'}
                                    </span>

                                    <span className="font-semibold text-slate-800">
                                      {(AREA_LABEL_BY_TYPE[ev.type] || ev.category)} •{' '}
                                      {(TYPE_LABEL_BY_CODE[ev.type] || ev.type)}
                                    </span>

                                    {isResolved && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-700">
                                        RESUELTA
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-500">Sev: {ev.severity}</span>

                                    {!isResolved && (
                                      <button
                                        onClick={() => handleResolveIncident(selectedCompetitor.id, ev.id)}
                                        disabled={!isApproved}
                                        className={`text-[11px] px-2 py-1 rounded-lg border ${
                                          isApproved
                                            ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                            : 'border-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                      >
                                        Marcar resuelta
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <p className="mt-1 text-slate-700">{ev.description}</p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  {new Date(ev.createdAt).toLocaleString()}
                                  {ev.source === 'TOURNAMENT' && ev.tournament?.nombre
                                    ? ` • ${ev.tournament.nombre}`
                                    : ''}
                                </p>
                              </>
                            );
                          })()}
                        </li>
                    ))}
                  </ul>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

