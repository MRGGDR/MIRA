export interface ProcessConfig {
  code: string;
  name: string;
}

export const PROCESSES: ProcessConfig[] = [
  { code: 'DG', name: 'Gestión Gerencial (Dirección General)' },
  { code: 'SDG', name: 'Gestión Gerencial (Subdirección General)' },
  { code: 'SG', name: 'Gestión Gerencial (Secretaría General)' },
  { code: 'PE', name: 'Planeación Estratégica' },
  { code: 'SIPLAG', name: 'SIPLAG' },
  { code: 'OAJ', name: 'Gestión Jurídica' },
  { code: 'OAC', name: 'Gestión de Comunicaciones' },
  { code: 'OCI', name: 'Evaluación y Seguimiento' },
  { code: 'SCR', name: 'Gestión de Conocimiento del Riesgo' },
  { code: 'SRR', name: 'Gestión de Reducción del Riesgo' },
  { code: 'SMD', name: 'Gestión de Manejo de Desastres' },
  { code: 'GTI', name: 'Tecnologías de la Información' },
  { code: 'GTH', name: 'Gestión del Talento Humano' },
  { code: 'GAFC', name: 'Gestión Financiera' },
  { code: 'GAA', name: 'Gestión Administrativa' },
  { code: 'SGD', name: 'Subproceso Gestión Documental' },
  { code: 'SGB', name: 'Subproceso Gestión Bienes' },
  { code: 'SSA', name: 'Subproceso Servicios Administrativos' },
  { code: 'CDI', name: 'Gestión de Control Disciplinario' },
  { code: 'GGC', name: 'Gestión Contratación' },
  { code: 'GCI', name: 'Gestión para Cooperación Internacional' },
  { code: 'GRC', name: 'Relacionamiento con el Ciudadano' },
];

export const PROCESS_LEADERS = [
  'Adriana Rodriguez Cortes',
  'Ana Milena Prada Uribe',
  'Antonio Jose Lopez Reales',
  'Diana Marcela Giraldo Lopez',
  'Fanny Torres Estupiñan',
  'Isabel Cristina Arboleda Lopez',
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

export const PROCESS_DRIVE_LINKS: Record<string, string> = {
  'Gestión Gerencial (Dirección General)': 'https://drive.google.com/drive/folders/1NEbkOlyWeyKn-fMp17YwB0JOv3fNvG_r?usp=sharing',
  'Gestión Gerencial (Subdirección General)': 'https://drive.google.com/drive/folders/1k0wEhjDn8p7NSai5V6UEOzRiaxfl6Xvn?usp=sharing',
  'Gestión Gerencial (Secretaría General)': 'https://drive.google.com/drive/folders/1c7PAIQsslwYgY5IaPpTb1U0J7kJ12fAj?usp=sharing',
  'Planeación Estratégica': 'https://drive.google.com/drive/folders/1CpBwoc5P01W2AZctASXlD7LMqQUeYXem?usp=sharing',
  SIPLAG: 'https://drive.google.com/drive/folders/1IcURbjJ2DWtncOu7xZU-AiwaSiP0h9DK?usp=sharing',
  'Gestión Jurídica': 'https://drive.google.com/drive/folders/1EnFV5T04gSRrwEuBxwt0kFtxOaTF8usZ?usp=sharing',
  'Gestión de Comunicaciones': 'https://drive.google.com/drive/folders/1Z21OGAywROqK5j3osjrs7WbQIXSww8Vp?usp=sharing',
  'Evaluación y Seguimiento': 'https://drive.google.com/drive/folders/1rlGIaDoyhY6_L0N_-nORA9Jb_OV-V_CH?usp=sharing',
  'Gestión de Conocimiento del Riesgo': 'https://drive.google.com/drive/folders/1Moh8X7v36V4rJrPv_CHDt8kXeB9PDxlq?usp=sharing',
  'Gestión de Reducción del Riesgo': 'https://drive.google.com/drive/folders/1068zYn9yX36-GicMx-11kWXphOMnX6pt?usp=sharing',
  'Gestión de Manejo de Desastres': 'https://drive.google.com/drive/folders/1ze2Ca6hDVxfy0wdHgRPHt1sNPpKkMxM2?usp=sharing',
  'Tecnologías de la Información': 'https://drive.google.com/drive/folders/1-n3YtyrCGqust2kWx8-3KepFuv98WSKM?usp=sharing',
  'Gestión del Talento Humano': 'https://drive.google.com/drive/folders/1HsCAajjr58eds7Vb8hzy7vl8PhSVNQds?usp=sharing',
  'Gestión Financiera': 'https://drive.google.com/drive/folders/1QJf1ivDXErIhR9hM_2_pw9_1_1d7ZhA2?usp=sharing',
  'Gestión Administrativa': 'https://drive.google.com/drive/folders/1T-a8ibBGWbamr3jlclSe0Ci5BybXtj4p?usp=sharing',
  'Subproceso Gestión Documental': 'https://drive.google.com/drive/folders/10MSPkBJZWkJvkGF_muP8lYyBKEqaySiM?usp=sharing',
  'Subproceso Gestión Bienes': 'https://drive.google.com/drive/folders/1Qy_dgCgqgQdn9Ukw-unTasMn4Bjluy2J?usp=sharing',
  'Subproceso Servicios Administrativos': 'https://drive.google.com/drive/folders/1T-a8ibBGWbamr3jlclSe0Ci5BybXtj4p?usp=sharing',
  'Gestión de Control Disciplinario': 'https://drive.google.com/drive/folders/1aISaEcdX_APYUyoDIPEHrLn8uavkOtTj?usp=sharing',
  'Gestión Contratación': 'https://drive.google.com/drive/folders/1Gvb5q_IuiJ9pRH5vBsPeCTNvWhxtb3wT?usp=sharing',
  'Gestión para Cooperación Internacional': 'https://drive.google.com/drive/folders/1lOQFBXKa2_GJk52WRn0sINwUpyvgcRV0?usp=sharing',
  'Relacionamiento con el Ciudadano': 'https://drive.google.com/drive/folders/1c4IGLl7Ibb5fUBLkjy2qcE6St29UpxMP?usp=sharing',
};

export const LEGACY_PROCESS_NAMES: Record<string, string[]> = {
  CD: ['Gestión de Control Disciplinario'],
  CDI: ['Gestión de Control Disciplinario'],
  ES: ['Evaluación y Seguimiento'],
  GA: ['Gestión Administrativa'],
  GAA: ['Gestión Administrativa'],
  GBMI: ['Subproceso Gestión Bienes'],
  GC: ['Gestión de Comunicaciones'],
  GCI: ['Gestión para Cooperación Internacional'],
  GCR: ['Gestión de Conocimiento del Riesgo'],
  GCT: ['Gestión Contratación'],
  GF: ['Gestión Financiera'],
  GG: ['Gestión Gerencial (Dirección General)', 'Gestión Gerencial (Secretaría General)', 'Gestión Gerencial (Subdirección General)'],
  GJ: ['Gestión Jurídica'],
  GMD: ['Gestión de Manejo de Desastres'],
  GRR: ['Gestión de Reducción del Riesgo'],
  GSI: ['Tecnologías de la Información'],
  GTH: ['Gestión del Talento Humano'],
  PE: ['Planeación Estratégica'],
  SGSC: ['Relacionamiento con el Ciudadano'],
  SGD: ['Subproceso Gestión Documental'],
  SGB: ['Subproceso Gestión Bienes'],
  SIPLAG: ['SIPLAG'],
  SIT: ['Tecnologías de la Información'],
  SSA: ['Subproceso Servicios Administrativos'],
  OAJ: ['Gestión Jurídica'],
  OAC: ['Gestión de Comunicaciones'],
  SCR: ['Gestión de Conocimiento del Riesgo'],
  SRR: ['Gestión de Reducción del Riesgo'],
  SMD: ['Gestión de Manejo de Desastres'],
  CNL: ['Gestión de Manejo de Desastres'],
  GTI: ['Tecnologías de la Información'],
  GAFC: ['Gestión Financiera'],
  GGC: ['Gestión Contratación'],
  GRC: ['Relacionamiento con el Ciudadano'],
  DG: ['Gestión Gerencial (Dirección General)'],
  SDG: ['Gestión Gerencial (Subdirección General)'],
  SG: ['Gestión Gerencial (Secretaría General)'],
};

const PROCESS_NAME_ALIASES: Record<string, string> = {
  'Bienes Muebles e Inmuebles': 'Subproceso Gestión Bienes',
  'Gestión Control Disciplinario Interno': 'Gestión de Control Disciplinario',
  'Gestión de Tecnologías de la Información': 'Tecnologías de la Información',
  'Tecnologias de la Información': 'Tecnologías de la Información',
  'Gestión del Conocimiento del Riesgo': 'Gestión de Conocimiento del Riesgo',
  'Gestión Documental': 'Subproceso Gestión Documental',
  'Servicios Administrativos': 'Subproceso Servicios Administrativos',
  'Sistema Integrado de Planeación y Gestión': 'SIPLAG',
};

export function getProcessName(codeOrName: string): string {
  if (!codeOrName) return '';
  const directMatch = findProcessByCodeOrName(codeOrName);
  if (directMatch) return directMatch.name;
  const alias = findProcessAlias(codeOrName);
  if (alias) return alias;
  const legacy = LEGACY_PROCESS_NAMES[codeOrName.trim().toUpperCase()];
  return legacy?.[0] ?? codeOrName;
}

export function getProcessNamesForAccess(codeOrName: string): string[] {
  if (!codeOrName) return [];
  const directMatch = findProcessByCodeOrName(codeOrName);
  if (directMatch) return [directMatch.name];
  const alias = findProcessAlias(codeOrName);
  if (alias) return [alias];
  return LEGACY_PROCESS_NAMES[codeOrName.trim().toUpperCase()] ?? [codeOrName];
}

export function getDriveLinkForProcess(codeOrName: string): string {
  const processName = getProcessName(codeOrName);
  return PROCESS_DRIVE_LINKS[processName] ?? '';
}

export function isLegacyProcessCode(value: string): boolean {
  return Boolean(LEGACY_PROCESS_NAMES[value.trim().toUpperCase()]);
}

export function processIdentity(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function isSameProcess(left: string, right: string): boolean {
  if (!left || !right) return false;
  const leftNames = getProcessNamesForAccess(left);
  const rightNames = getProcessNamesForAccess(right);
  return leftNames.some((leftName) =>
    rightNames.some((rightName) => processIdentity(leftName) === processIdentity(rightName)),
  );
}

function findProcessByCodeOrName(codeOrName: string): ProcessConfig | undefined {
  const value = codeOrName.trim();
  const code = value.toUpperCase();
  const identity = processIdentity(value);
  return PROCESSES.find((process) => process.code === code || processIdentity(process.name) === identity);
}

function findProcessAlias(codeOrName: string): string | undefined {
  const value = codeOrName.trim();
  const identity = processIdentity(value);
  const exactAlias = PROCESS_NAME_ALIASES[value];
  if (exactAlias) return exactAlias;
  const aliasEntry = Object.entries(PROCESS_NAME_ALIASES).find(([alias]) => processIdentity(alias) === identity);
  return aliasEntry?.[1];
}
