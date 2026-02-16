// src/constants/incidents.ts
import type { BehaviorCategory } from '../services/behaviorService';

export type AreaKey =
  | 'ADMIN_DOC'
  | 'WORKSHOP_RESOURCES'
  | 'COMMITMENT_ATTENDANCE'
  | 'INTERNAL_CONDUCT';

export const INCIDENT_AREAS: Array<{ key: AreaKey; label: string; category: BehaviorCategory }> = [
  { key: 'ADMIN_DOC', label: 'Administrativas / documentarias', category: 'TECHNICAL' },
  { key: 'WORKSHOP_RESOURCES', label: 'Taller / recursos', category: 'TECHNICAL' },
  { key: 'COMMITMENT_ATTENDANCE', label: 'Compromiso / asistencia', category: 'CONDUCT' },
  { key: 'INTERNAL_CONDUCT', label: 'Conducta interna / convivencia', category: 'CONDUCT' },
];

export const INCIDENT_TYPES: Record<
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

// labels por código (para mostrar español aunque guardes el code)
export const TYPE_LABEL_BY_CODE = Object.values(INCIDENT_TYPES)
  .flat()
  .reduce<Record<string, string>>((acc, t) => {
    acc[t.code] = t.label;
    return acc;
  }, {});

// label de “área” según el type code
export const AREA_LABEL_BY_TYPE = (() => {
  const map: Record<string, string> = {};
  for (const area of INCIDENT_AREAS) {
    for (const t of INCIDENT_TYPES[area.key]) map[t.code] = area.label;
  }
  return map;
})();

export const escapeHtml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
