import { describe, expect, it } from 'vitest';
import { getProcessName, getProcessNamesForAccess, isSameProcess } from '@/config/processes';

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
});
