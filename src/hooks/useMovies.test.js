import { describe, expect, it } from 'vitest'
import { appendUnique, mapMovies, typeLabel } from './useMovies'

// Este es el test que protege la "capa anticorrupción": si alguien cambia el
// mapeo, media app deja de funcionar y aquí saltaría al instante.
describe('mapMovies', () => {
  it('traduce las claves de OMDb a las nuestras', () => {
    const result = mapMovies([
      {
        imdbID: 'tt0133093',
        Title: 'The Matrix',
        Year: '1999',
        Type: 'movie',
        Poster: 'https://example.com/matrix.jpg'
      }
    ])

    expect(result).toEqual([
      {
        id: 'tt0133093',
        title: 'The Matrix',
        year: '1999',
        type: 'movie',
        poster: 'https://example.com/matrix.jpg'
      }
    ])
  })

  it('deja el tipo a null si OMDb no lo manda', () => {
    const [movie] = mapMovies([{ imdbID: 'tt1', Title: 'X', Year: '2020' }])

    expect(movie.type).toBeNull()
  })

  it('convierte el póster "N/A" de OMDb en null', () => {
    const [movie] = mapMovies([
      { imdbID: 'tt1', Title: 'Sin póster', Year: '2020', Poster: 'N/A' }
    ])

    expect(movie.poster).toBeNull()
  })

  it('convierte en null el póster que no viene', () => {
    const [movie] = mapMovies([{ imdbID: 'tt1', Title: 'X', Year: '2020' }])

    expect(movie.poster).toBeNull()
  })

  it('devuelve un array vacío si no hay resultados', () => {
    expect(mapMovies([])).toEqual([])
  })
})

// OMDb repite el mismo imdbID en páginas consecutivas: comprobado contra la
// API real, la búsqueda "love" devuelve 7 ids repetidos en sus 100 páginas.
describe('appendUnique', () => {
  const peli = (id) => ({ id, title: 'x', year: '2000', type: 'movie', poster: null })

  it('añade las nuevas al final', () => {
    expect(appendUnique([peli('a')], [peli('b'), peli('c')]).map(m => m.id))
      .toEqual(['a', 'b', 'c'])
  })

  it('descarta las que ya estaban', () => {
    expect(appendUnique([peli('a'), peli('b')], [peli('b'), peli('c')]).map(m => m.id))
      .toEqual(['a', 'b', 'c'])
  })

  it('descarta también los repetidos DENTRO del lote entrante', () => {
    expect(appendUnique([peli('a')], [peli('b'), peli('b'), peli('c')]).map(m => m.id))
      .toEqual(['a', 'b', 'c'])
  })

  it('no toca el array anterior', () => {
    const previas = [peli('a')]
    appendUnique(previas, [peli('b')])
    expect(previas).toHaveLength(1)
  })

  it('aguanta un lote vacío', () => {
    expect(appendUnique([peli('a')], []).map(m => m.id)).toEqual(['a'])
  })
})

describe('typeLabel', () => {
  it('traduce los tipos de OMDb', () => {
    expect(typeLabel('movie')).toBe('película')
    expect(typeLabel('series')).toBe('serie')
  })

  it('deja pasar un tipo desconocido en vez de romper', () => {
    expect(typeLabel('podcast')).toBe('podcast')
  })

  it('devuelve cadena vacía si no hay tipo', () => {
    expect(typeLabel(null)).toBe('')
  })
})
