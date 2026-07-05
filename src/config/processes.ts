export interface ProcessConfig {
  code: string;
  name: string;
}

export const PROCESSES: ProcessConfig[] = [
  { code: 'Bienes Muebles e Inmuebles', name: 'Bienes Muebles e Inmuebles' },
  { code: 'Evaluación y Seguimiento', name: 'Evaluación y Seguimiento' },
  { code: 'Gestión Administrativa', name: 'Gestión Administrativa' },
  { code: 'Gestión Contratación', name: 'Gestión Contratación' },
  { code: 'Gestión Control Disciplinario Interno', name: 'Gestión Control Disciplinario Interno' },
  { code: 'Gestión de Comunicaciones', name: 'Gestión de Comunicaciones' },
  { code: 'Gestión de Manejo de Desastres', name: 'Gestión de Manejo de Desastres' },
  { code: 'Gestión de Reducción del Riesgo', name: 'Gestión de Reducción del Riesgo' },
  { code: 'Gestión de Tecnologías de la Información', name: 'Gestión de Tecnologías de la Información' },
  { code: 'Gestión del Conocimiento del Riesgo', name: 'Gestión del Conocimiento del Riesgo' },
  { code: 'Gestión del Talento Humano', name: 'Gestión del Talento Humano' },
  { code: 'Gestión Documental', name: 'Gestión Documental' },
  { code: 'Gestión Financiera', name: 'Gestión Financiera' },
  { code: 'Gestión Gerencial (Dirección General)', name: 'Gestión Gerencial (Dirección General)' },
  { code: 'Gestión Gerencial (Secretaría General)', name: 'Gestión Gerencial (Secretaría General)' },
  { code: 'Gestión Gerencial (Subdirección General)', name: 'Gestión Gerencial (Subdirección General)' },
  { code: 'Gestión Jurídica', name: 'Gestión Jurídica' },
  { code: 'Gestión para Cooperación Internacional', name: 'Gestión para Cooperación Internacional' },
  { code: 'Planeación Estratégica', name: 'Planeación Estratégica' },
  { code: 'Relacionamiento con el Ciudadano', name: 'Relacionamiento con el Ciudadano' },
  { code: 'Servicios Administrativos', name: 'Servicios Administrativos' },
  { code: 'Sistema Integrado de Planeación y Gestión', name: 'Sistema Integrado de Planeación y Gestión' },
];

export const PROCESS_LEADERS = [
  'Adriana Rodriguez Cortes',
  'Ana Milena Prada Uribe',
  'Antonio Jose Lopez Reales',
  'Diana Marcela Giraldo Lopez',
  'Fanny Torres Estupiñan',
  'Isabel Cristina Arboleda Lopez',
  'JAVIER PAVA SÁNCHEZ',
  'Jorge Alejandro Maldonado Gutiérrez',
  'José Ricardo Hurtado Chacón',
  'Maria Constanza Meza Elizalde',
  'Maria Ximena Noguera Hidalgo',
  'Michael Oyuela Vargas',
  'Paulina Hernandez Aldana',
  'Rafael Enrique Cruz Rodriguez',
  'Yanizza Lozano',
  'Yesid Alonso Salamanca Zuluaga',
];

export const LEGACY_PROCESS_NAMES: Record<string, string[]> = {
  CD: ['Gestión Control Disciplinario Interno'],
  ES: ['Evaluación y Seguimiento'],
  GA: ['Gestión Administrativa'],
  GBMI: ['Bienes Muebles e Inmuebles'],
  GC: ['Gestión de Comunicaciones'],
  GCI: ['Gestión para Cooperación Internacional'],
  GCR: ['Gestión del Conocimiento del Riesgo'],
  GCT: ['Gestión Contratación'],
  GF: ['Gestión Financiera'],
  GG: ['Gestión Gerencial (Dirección General)', 'Gestión Gerencial (Secretaría General)', 'Gestión Gerencial (Subdirección General)'],
  GJ: ['Gestión Jurídica'],
  GMD: ['Gestión de Manejo de Desastres'],
  GRR: ['Gestión de Reducción del Riesgo'],
  GSI: ['Gestión de Tecnologías de la Información'],
  GTH: ['Gestión del Talento Humano'],
  PE: ['Planeación Estratégica'],
  SGSC: ['Relacionamiento con el Ciudadano'],
  SGD: ['Gestión Documental'],
  SIPLAG: ['Sistema Integrado de Planeación y Gestión'],
  SIT: ['Gestión de Tecnologías de la Información'],
  SSA: ['Servicios Administrativos'],
};

export function getProcessName(codeOrName: string): string {
  return PROCESSES.find((process) => process.code === codeOrName || process.name === codeOrName)?.name ?? LEGACY_PROCESS_NAMES[codeOrName]?.[0] ?? codeOrName;
}

export function getProcessNamesForAccess(codeOrName: string): string[] {
  if (!codeOrName) return [];
  const directMatch = PROCESSES.find((process) => process.code === codeOrName || process.name === codeOrName);
  if (directMatch) return [directMatch.name];
  return LEGACY_PROCESS_NAMES[codeOrName] ?? [codeOrName];
}

export function isLegacyProcessCode(value: string): boolean {
  return Boolean(LEGACY_PROCESS_NAMES[value]);
}
