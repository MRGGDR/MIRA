export interface ProcessConfig {
  code: string;
  name: string;
}

export const PROCESSES: ProcessConfig[] = [
  { code: 'GG', name: 'Gestion Gerencial' },
  { code: 'PE', name: 'Planeacion Estrategica' },
  { code: 'GC', name: 'Gestion de Comunicaciones' },
  { code: 'GJ', name: 'Gestion Juridica' },
  { code: 'GSI', name: 'Gestion de Sistemas de Informacion' },
  { code: 'SIPLAG', name: 'Sistema Integrado de Planeacion y Gestion' },
  { code: 'GCR', name: 'Gestion del Conocimiento del Riesgo' },
  { code: 'GRR', name: 'Gestion de Reduccion del Riesgo' },
  { code: 'GMD', name: 'Gestion de Manejo de Desastres' },
  { code: 'GTH', name: 'Gestion del Talento Humano' },
  { code: 'GF', name: 'Gestion Financiera' },
  { code: 'GCT', name: 'Gestion de Contratacion' },
  { code: 'CD', name: 'Control Disciplinario' },
  { code: 'GCI', name: 'Gestion de Cooperacion Internacional' },
  { code: 'GA', name: 'Gestion Administrativa' },
  { code: 'SSA', name: 'Servicios Administrativos' },
  { code: 'SGD', name: 'Gestion Documental' },
  { code: 'SGSC', name: 'Servicio al Ciudadano' },
  { code: 'SIT', name: 'Infraestructura Tecnologica' },
  { code: 'GBMI', name: 'Gestion de Bienes Muebles e Inmuebles' },
  { code: 'ES', name: 'Evaluacion y Seguimiento' },
  { code: 'OTRO', name: 'Otro proceso' },
];

export function getProcessName(codeOrName: string): string {
  return PROCESSES.find((process) => process.code === codeOrName || process.name === codeOrName)?.name ?? codeOrName;
}
