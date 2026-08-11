import { describe, expect, it } from 'vitest';
import {
  getDriveLinkForProcess,
  getProcessName,
  getProcessNamesForAccess,
  isSameProcess,
  REPORTING_DRIVE_LINK,
} from '@/config/processes';

describe('process helpers', () => {
  it('matches process names with or without accents', () => {
    expect(isSameProcess('Planeacion Estrategica', 'Planeación Estratégica')).toBe(true);
    expect(getProcessName('Planeacion Estrategica')).toBe('Planeación Estratégica');
  });

  it('matches legacy process codes against canonical process names', () => {
    expect(isSameProcess('PE', 'Planeación Estratégica')).toBe(true);
    expect(getProcessNamesForAccess('PE')).toEqual(['Planeación Estratégica']);
  });

  it('matches old aliases against current sub-process names', () => {
    expect(isSameProcess('Gestión Documental', 'Subproceso Gestión Documental')).toBe(true);
    expect(getProcessName('Gestion Documental')).toBe('Subproceso Gestión Documental');
  });

  it('uses the shared reporting Drive for every user and process', () => {
    expect(getDriveLinkForProcess('PE')).toBe(REPORTING_DRIVE_LINK);
    expect(getDriveLinkForProcess('Gestión de Comunicaciones')).toBe(REPORTING_DRIVE_LINK);
    expect(getDriveLinkForProcess('')).toBe(REPORTING_DRIVE_LINK);
  });
});
