import { describe, expect, it } from 'vitest'
import { MIN_SEARCH_LENGTH, validateSearch } from './useSearch'

// validateSearch es una función pura: entra un string, sale un mensaje o null.
// Por eso se puede probar sin React, sin renderizar nada y sin mocks.
describe('validateSearch', () => {
  it('rechaza la búsqueda vacía', () => {
    expect(validateSearch('')).toBe('No se puede buscar una película vacía.')
  })

  it('rechaza que empiece por espacio', () => {
    expect(validateSearch(' matrix')).toBe(
      'La búsqueda no puede empezar por un espacio.'
    )
  })

  it('rechaza los términos demasiado cortos', () => {
    expect(validateSearch('ab')).toBe(
      `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres.`
    )
  })

  it('acepta un término válido', () => {
    expect(validateSearch('matrix')).toBeNull()
  })

  it('acepta justo el mínimo de caracteres', () => {
    expect(validateSearch('a'.repeat(MIN_SEARCH_LENGTH))).toBeNull()
  })

  it('acepta espacios que no van al principio', () => {
    expect(validateSearch('star wars')).toBeNull()
  })
})
