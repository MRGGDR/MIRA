import { describe, expect, it } from 'vitest';
import { applyListFormat } from '@/features/actions/utils/structuredText';

describe('applyListFormat', () => {
  it('convierte varias líneas en una lista con viñetas y conserva los saltos', () => {
    const result = applyListFormat('Primera causa\nSegunda causa', 0, 27, 'bullet');

    expect(result.value).toBe('• Primera causa\n• Segunda causa');
  });

  it('numera únicamente las líneas seleccionadas', () => {
    const text = 'Introducción\nPaso uno\nPaso dos\nCierre';
    const result = applyListFormat(text, 13, 30, 'number');

    expect(result.value).toBe('Introducción\n1. Paso uno\n2. Paso dos\nCierre');
  });

  it('permite quitar el formato al volver a aplicar el mismo estilo', () => {
    const text = '• Una\n• Dos';
    const result = applyListFormat(text, 0, text.length, 'bullet');

    expect(result.value).toBe('Una\nDos');
  });

  it('cambia de viñetas a numeración sin acumular prefijos', () => {
    const text = '• Una\n• Dos';
    const result = applyListFormat(text, 0, text.length, 'number');

    expect(result.value).toBe('1. Una\n2. Dos');
  });
});
