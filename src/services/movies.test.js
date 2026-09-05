import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMovieDetails, searchMovies, verifyApiKey } from './movies'
import { storeApiKey } from './apiKey'

/**
 * Simula la respuesta de OMDb. No tocamos la red en ningún test: es lenta,
 * necesita API key de verdad y los resultados cambiarían con el tiempo.
 */
function mockFetch (json, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => json
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Respuesta típica de búsqueda con un resultado. */
const OK_SEARCH = {
  Response: 'True',
  totalResults: '138',
  Search: [
    {
      imdbID: 'tt0133093',
      Title: 'The Matrix',
      Year: '1999',
      Poster: 'https://example.com/matrix.jpg'
    }
  ]
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('searchMovies', () => {
  it('devuelve los resultados en crudo y el total como NÚMERO', async () => {
    mockFetch(OK_SEARCH)

    const { results, totalResults } = await searchMovies({ search: 'matrix' })

    expect(results).toHaveLength(1)
    expect(results[0].Title).toBe('The Matrix')
    // OMDb lo manda como string "138"; el servicio lo normaliza.
    expect(totalResults).toBe(138)
  })

  it('no llama a la API si el término está vacío', async () => {
    const fetchMock = mockFetch(OK_SEARCH)

    await expect(searchMovies({ search: '' })).resolves.toEqual({
      results: [],
      totalResults: 0
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('pide la página 1 por defecto y la que le digan si se la pasan', async () => {
    const fetchMock = mockFetch(OK_SEARCH)

    await searchMovies({ search: 'matrix' })
    expect(fetchMock.mock.calls[0][0]).toContain('page=1')

    await searchMovies({ search: 'matrix', page: 3 })
    expect(fetchMock.mock.calls[1][0]).toContain('page=3')
  })

  it('manda el filtro de tipo solo cuando lo hay', async () => {
    const fetchMock = mockFetch(OK_SEARCH)

    await searchMovies({ search: 'matrix' })
    // Sin filtro, OMDb no debe recibir el parámetro: vacío responde error.
    expect(fetchMock.mock.calls[0][0]).not.toContain('type=')

    await searchMovies({ search: 'matrix', type: 'series' })
    expect(fetchMock.mock.calls[1][0]).toContain('type=series')
  })

  it('codifica el término para no romper la URL', async () => {
    const fetchMock = mockFetch(OK_SEARCH)

    await searchMovies({ search: 'tom & jerry' })

    const url = fetchMock.mock.calls[0][0]
    // El & del título va escapado, así que solo hay & de separación real.
    expect(url).toContain('s=tom+%26+jerry')
  })

  // "No hay resultados" NO es un error de la app: es una respuesta válida.
  it('devuelve vacío (sin lanzar) cuando OMDb no encuentra nada', async () => {
    mockFetch({ Response: 'False', Error: 'Movie not found!' })

    await expect(searchMovies({ search: 'asdfghjkl' })).resolves.toEqual({
      results: [],
      totalResults: 0
    })
  })

  it('traduce al español los errores conocidos de OMDb', async () => {
    mockFetch({ Response: 'False', Error: 'Too many results.' })

    await expect(searchMovies({ search: 'the' })).rejects.toThrow(
      'La búsqueda es demasiado genérica. Prueba a concretar más.'
    )
  })

  it('deja pasar el mensaje original si el error no lo conocemos', async () => {
    mockFetch({ Response: 'False', Error: 'Something exploded.' })

    await expect(searchMovies({ search: 'matrix' })).rejects.toThrow(
      'Something exploded.'
    )
  })

  // Un 500 NO hace que fetch lance: hay que mirar response.ok a mano.
  it('detecta los errores HTTP, que fetch no lanza', async () => {
    mockFetch({}, { ok: false, status: 500 })

    await expect(searchMovies({ search: 'matrix' })).rejects.toThrow(
      'La API ha respondido con un error (HTTP 500).'
    )
  })

  it('avisa de forma clara cuando falla la red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(searchMovies({ search: 'matrix' })).rejects.toThrow(
      'No se ha podido conectar. Comprueba tu conexión a internet.'
    )
  })

  it('no revienta si OMDb responde True pero sin el array Search', async () => {
    mockFetch({ Response: 'True', totalResults: '0' })

    const { results } = await searchMovies({ search: 'matrix' })
    expect(results).toEqual([])
  })

  it('avisa si no hay ninguna API key configurada', async () => {
    // Ahora la clave se lee en CADA petición (puede cambiar en caliente), así
    // que basta con vaciar el entorno y el almacenamiento.
    vi.stubEnv('VITE_OMDB_API_KEY', '')
    vi.resetModules()
    const { searchMovies: freshSearchMovies } = await import('./movies')

    await expect(freshSearchMovies({ search: 'matrix' })).rejects.toThrow(
      /No hay ninguna API key configurada/
    )
  })

  it('usa la clave que el usuario ha guardado antes que la de .env.local', async () => {
    const fetchMock = mockFetch(OK_SEARCH)
    const map = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k)
    })
    storeApiKey('clave-del-usuario')

    await searchMovies({ search: 'matrix' })

    expect(fetchMock.mock.calls[0][0]).toContain('apikey=clave-del-usuario')
    expect(fetchMock.mock.calls[0][0]).not.toContain('test-api-key')
  })
})

describe('getMovieDetails', () => {
  it('pide la ficha por id y con la sinopsis larga', async () => {
    const fetchMock = mockFetch({ Response: 'True', imdbID: 'tt0133093' })

    await getMovieDetails({ id: 'tt0133093' })

    const url = fetchMock.mock.calls[0][0]
    expect(url).toContain('i=tt0133093')
    expect(url).toContain('plot=full')
  })

  it('devuelve la ficha en crudo', async () => {
    mockFetch({ Response: 'True', imdbID: 'tt0133093', Title: 'The Matrix' })

    const details = await getMovieDetails({ id: 'tt0133093' })
    expect(details.Title).toBe('The Matrix')
  })

  it('traduce el error de id incorrecto', async () => {
    mockFetch({ Response: 'False', Error: 'Incorrect IMDb ID.' })

    await expect(getMovieDetails({ id: 'nope' })).rejects.toThrow(
      'No hemos podido encontrar esa película.'
    )
  })
})

describe('verifyApiKey', () => {
  it('usa la clave que se le pasa, no la configurada', async () => {
    const fetchMock = mockFetch({ Response: 'True', imdbID: 'tt0133093' })

    await expect(verifyApiKey({ key: 'clave-a-probar' })).resolves.toBe(true)
    expect(fetchMock.mock.calls[0][0]).toContain('apikey=clave-a-probar')
  })

  it('rechaza con mensaje claro si OMDb dice que la clave no vale', async () => {
    mockFetch({ Response: 'False', Error: 'Invalid API key!' })

    await expect(verifyApiKey({ key: 'mala' })).rejects.toThrow(
      /no es válida/
    )
  })

  // OMDb NO manda un JSON con Response:'False' cuando la clave es mala:
  // manda un 401 pelado. El usuario tiene que entender qué ha pasado.
  it('traduce el 401 de OMDb a "esa clave no vale"', async () => {
    mockFetch({}, { ok: false, status: 401 })

    await expect(verifyApiKey({ key: 'mala' })).rejects.toThrow(/no es válida/)
  })
})
