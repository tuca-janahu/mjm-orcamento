import { describe, expect, it } from 'vitest';
import {
  hasDuplicateNormalizedNames,
  normalizeComparableName
} from '../src/normalization.js';

describe('normalização de nomes comparáveis', () => {
  it('compacta espaços, remove diacríticos e normaliza caixa', () => {
    expect(normalizeComparableName('  Gestão   de Estoque  ')).toBe('gestao de estoque');
  });

  it('detecta duplicidade sem determinar a mensagem de domínio', () => {
    expect(hasDuplicateNormalizedNames(['Gestão de Estoque', 'gestao   de estoque'])).toBe(true);
    expect(hasDuplicateNormalizedNames(['Estoque', 'Contratos'])).toBe(false);
  });
});
