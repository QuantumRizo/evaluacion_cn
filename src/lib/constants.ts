export const DB_ID = 'evaluacion_desempeno';

export const COLLECTIONS = {
  EMPLOYEES: 'employees',
  EVALUATION_CYCLES: 'evaluation_cycles',
  QUESTIONS: 'questions',
  RESPONSES: 'responses',
  FINAL_REPORTS: 'final_reports',
  EVALUATION_ASSIGNMENTS: 'evaluation_assignments',
} as const;

export const SCORE_OPTIONS = [
  { label: 'Casi nunca', value: 0.25 },
  { label: 'A veces', value: 0.50 },
  { label: 'Casi siempre', value: 0.75 },
  { label: 'Siempre', value: 1.00 },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  orientacion_resultados: 'Orientación a Resultados',
  pensamiento_estrategico: 'Pensamiento Estratégico',
  calidad_mejora_continua: 'Calidad y Mejora Continua',
  relaciones_interpersonales: 'Relaciones Interpersonales',
  iniciativa: 'Iniciativa',
  trabajo_equipo: 'Trabajo en Equipo',
  organizacion: 'Organización',
  comunicacion: 'Comunicación',
};

export const CATEGORY_ORDER = [
  'orientacion_resultados',
  'pensamiento_estrategico',
  'calidad_mejora_continua',
  'relaciones_interpersonales',
  'iniciativa',
  'trabajo_equipo',
  'organizacion',
  'comunicacion',
] as const;
