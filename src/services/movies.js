// ---------------------------------------------------------------------------
// ÚNICO archivo de toda la app que habla con la API de OMDb.
// Si mañana cambiamos de API (a TMDB, por ejemplo), solo se toca este archivo:
// los hooks y los componentes ni se enteran.
// ---------------------------------------------------------------------------

const API_URL = 'https://www.omdbapi.com/'

// Vite solo expone al navegador las variables que empiezan por VITE_.
// import.meta.env es la forma de leerlas (no existe `process.env` en el cliente).
const API_KEY = import.meta.env.VITE_OMDB_API_KEY

// Traducimos los errores que devuelve OMDb (vienen en inglés) a mensajes
// nuestros. Si aparece uno que no conocemos, mostramos el original.
const API_ERROR_MESSAGES = {
  'Too many results.': 'La búsqueda es demasiado genérica. Prueba a concretar más.',
  'Invalid API key!': 'La API key no es válida. Revisa tu archivo .env.local.',
  'No API key provided.': 'Falta la API key. Revisa tu archivo .env.local.'
}

/**
 * Busca películas en OMDb.
 * @param {{ search: string }} params
 * @returns {Promise<Array>} array de películas EN CRUDO (formato OMDb).
 *                           Devuelve [] si no hay resultados.
 * @throws {Error} si falla la red o la API devuelve un error real.
 */
export async function searchMovies ({ search }) {
  if (search === '') return []

  // Fallo típico al clonar el repo: no existe .env.local. Mejor avisar claro
  // que dejar que la API responda "No API key provided." sin contexto.
  if (!API_KEY) {
    throw new Error(
      'No hay API key configurada. Crea un archivo .env.local con VITE_OMDB_API_KEY y reinicia el servidor.'
    )
  }

  // encodeURIComponent evita que términos con espacios, & o ? rompan la URL.
  const url = `${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(search)}`

  let response
  try {
    response = await fetch(url)
  } catch {
    // fetch SOLO lanza excepción cuando falla la red (sin conexión, DNS, CORS).
    // Un 404 o un 500 NO entran aquí: eso se comprueba con response.ok.
    throw new Error('No se ha podido conectar. Comprueba tu conexión a internet.')
  }

  if (!response.ok) {
    throw new Error(`La API ha respondido con un error (HTTP ${response.status}).`)
  }

  const json = await response.json()

  // ---- LA PARTE IMPORTANTE ----------------------------------------------
  // OMDb devuelve HTTP 200 (o sea, "todo bien") incluso cuando no encuentra
  // nada. El try/catch de arriba NUNCA se enteraría. Hay que mirar a mano
  // el campo Response, que es el string "True" o "False" (¡no un booleano!).
  if (json.Response === 'False') {
    // "No hay resultados" no es un error de la app: es una respuesta válida.
    // Devolvemos un array vacío y que la UI decida cómo mostrarlo.
    if (json.Error === 'Movie not found!') return []

    // Cualquier otro caso (API key mala, demasiados resultados...) sí es error.
    throw new Error(API_ERROR_MESSAGES[json.Error] ?? json.Error)
  }

  // json.Search puede no venir en casos raros: ?? [] nos protege de un crash.
  return json.Search ?? []
}
