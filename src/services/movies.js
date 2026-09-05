// ---------------------------------------------------------------------------
// ÚNICO archivo de toda la app que habla con la API de OMDb.
// Si mañana cambiamos de API (a TMDB, por ejemplo), solo se toca este archivo:
// los hooks y los componentes ni se enteran.
// ---------------------------------------------------------------------------

import { getApiKey } from './apiKey'

const API_URL = 'https://www.omdbapi.com/'

// OMDb siempre devuelve las páginas de 10 en 10. No es configurable, pero lo
// dejamos como constante para no repetir el número mágico por el código.
export const RESULTS_PER_PAGE = 10

// Traducimos los errores que devuelve OMDb (vienen en inglés) a mensajes
// nuestros. Si aparece uno que no conocemos, mostramos el original.
const API_ERROR_MESSAGES = {
  'Too many results.': 'La búsqueda es demasiado genérica. Prueba a concretar más.',
  'Invalid API key!': 'Esa API key no es válida. Comprueba que la has copiado entera y que la has activado desde el correo de OMDb.',
  'No API key provided.': 'Falta la API key.',
  'Incorrect IMDb ID.': 'No hemos podido encontrar esa película.'
}

/**
 * Hace la petición a OMDb y devuelve el JSON ya validado.
 *
 * Lo comparten la búsqueda y el detalle porque el manejo de errores de OMDb es
 * idéntico en los dos casos: misma API key, mismos fallos de red y el mismo
 * campo `Response` que hay que mirar a mano.
 *
 * @param {Record<string, string|number>} params parámetros propios del endpoint.
 * @param {{ key?: string }} [options] clave concreta a usar. Solo la pasa
 *        verifyApiKey, para probar una que el usuario todavía no ha guardado.
 * @returns {Promise<object>} el JSON de OMDb cuando Response === 'True'.
 * @throws {Error} si falta la key, falla la red o la API devuelve un error real.
 */
async function fetchFromOmdb (params, { key } = {}) {
  // La clave se lee AQUÍ, en cada petición, y no una sola vez al importar el
  // módulo: el usuario puede introducirla o cambiarla con la app ya abierta.
  const apiKey = key ?? getApiKey()

  if (!apiKey) {
    throw new Error(
      'No hay ninguna API key configurada. Introduce la tuya para empezar a buscar.'
    )
  }

  // URLSearchParams codifica solo cada valor (como encodeURIComponent) pero
  // además arma la query entera: nos ahorra concatenar '&' a mano y que un
  // título con espacios, & o ? rompa la URL.
  const query = new URLSearchParams({ apikey: apiKey, ...params })

  let response
  try {
    response = await fetch(`${API_URL}?${query}`)
  } catch {
    // fetch SOLO lanza excepción cuando falla la red (sin conexión, DNS, CORS).
    // Un 404 o un 500 NO entran aquí: eso se comprueba con response.ok.
    throw new Error('No se ha podido conectar. Comprueba tu conexión a internet.')
  }

  if (!response.ok) {
    // OMDb NO contesta con un JSON explicativo cuando la clave es mala: manda
    // un 401 pelado. Sin este caso, quien se equivoque al pegar su clave vería
    // "HTTP 401" y no tendría ni idea de qué ha hecho mal.
    if (response.status === 401) {
      throw new Error(API_ERROR_MESSAGES['Invalid API key!'])
    }

    throw new Error(`La API ha respondido con un error (HTTP ${response.status}).`)
  }

  const json = await response.json()

  // ---- LA PARTE IMPORTANTE ----------------------------------------------
  // OMDb devuelve HTTP 200 (o sea, "todo bien") incluso cuando no encuentra
  // nada. El try/catch de arriba NUNCA se enteraría. Hay que mirar a mano
  // el campo Response, que es el string "True" o "False" (¡no un booleano!).
  if (json.Response === 'False') {
    // Marcamos el error con una propiedad para que quien llame pueda
    // distinguir "no hay nada" de "algo ha fallado" sin comparar strings.
    const error = new Error(API_ERROR_MESSAGES[json.Error] ?? json.Error)
    error.notFound = json.Error === 'Movie not found!'
    throw error
  }

  return json
}

/**
 * Busca películas en OMDb.
 *
 * @param {{ search: string, page?: number, type?: string }} params
 *        `type` es el filtro de OMDb: 'movie', 'series' o '' para no filtrar.
 * @returns {Promise<{ results: Array, totalResults: number }>}
 *          `results` son las películas EN CRUDO (formato OMDb), de 10 en 10.
 *          `totalResults` es el total de la búsqueda, no el de esta página:
 *          es lo que nos permite saber si quedan más páginas por pedir.
 * @throws {Error} si falla la red o la API devuelve un error real.
 */
export async function searchMovies ({ search, page = 1, type = '' }) {
  if (search === '') return { results: [], totalResults: 0 }

  let json
  try {
    // El parámetro `type` solo se manda cuando hay filtro: OMDb responde
    // "Incorrect Type." si le llega vacío.
    json = await fetchFromOmdb({ s: search, page, ...(type ? { type } : {}) })
  } catch (error) {
    // "No hay resultados" no es un error de la app: es una respuesta válida.
    // Devolvemos vacío y que la UI decida cómo mostrarlo.
    if (error.notFound) return { results: [], totalResults: 0 }
    throw error
  }

  return {
    // json.Search puede no venir en casos raros: ?? [] nos protege de un crash.
    results: json.Search ?? [],
    // OMDb manda totalResults como STRING ("42"). Lo pasamos a número aquí para
    // que el resto de la app no tenga que acordarse de esa rareza.
    totalResults: Number(json.totalResults) || 0
  }
}

/**
 * Pide la ficha completa de UNA película por su id de IMDb.
 *
 * El endpoint de búsqueda solo devuelve título, año y póster; la sinopsis, el
 * reparto o la nota de IMDb hay que pedirlas aparte con `i=<imdbID>`.
 *
 * @param {{ id: string }} params
 * @returns {Promise<object>} la ficha EN CRUDO (formato OMDb).
 * @throws {Error} si falla la red o la película no existe.
 */
export async function getMovieDetails ({ id }) {
  // plot=full trae la sinopsis larga; por defecto OMDb manda solo dos líneas.
  return fetchFromOmdb({ i: id, plot: 'full' })
}

/**
 * Comprueba si una API key sirve, ANTES de guardarla.
 *
 * Hace la petición más barata posible (una búsqueda que sabemos que devuelve
 * un único resultado) y solo mira si OMDb la acepta. Así el usuario se entera
 * al instante de que se ha equivocado, en vez de guardar una clave mala y ver
 * fallar todas las búsquedas después.
 *
 * @param {{ key: string }} params
 * @returns {Promise<true>} si la clave es válida.
 * @throws {Error} con un mensaje ya traducido si no lo es.
 */
export async function verifyApiKey ({ key }) {
  await fetchFromOmdb({ i: 'tt0133093' }, { key })
  return true
}
