import { useState, useRef, useCallback } from 'react'
import { RESULTS_PER_PAGE, searchMovies } from '../services/movies'

/**
 * Traduce el formato de OMDb (Title, Year, imdbID, Poster) a NUESTRO formato
 * (title, year, id, poster).
 *
 * ¿Por qué molestarse? Para que el resto de la app no dependa de OMDb. Si
 * mañana cambiamos de API, solo hay que reescribir esta función: los
 * componentes siguen recibiendo { id, title, year, poster } igual que siempre.
 * A esto se le llama capa anticorrupción.
 *
 * Se exporta para poder probarla sin montar el hook entero.
 */
export function mapMovies (apiMovies) {
  return apiMovies.map((movie) => ({
    id: movie.imdbID,
    title: movie.Title,
    year: movie.Year,
    // 'movie' | 'series' | 'game'. Lo guardamos tal cual (en inglés, como lo
    // manda OMDb) y lo traducimos al pintarlo con typeLabel(): los datos van
    // en un idioma, la interfaz en otro.
    type: movie.Type ?? null,
    // OMDb manda el string "N/A" cuando no tiene póster. Lo normalizamos a null
    // aquí para que el componente solo tenga que preguntar `if (poster)` y no
    // conocer esa rareza de la API.
    poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null
  }))
}

// Los tipos que devuelve OMDb, en español y en singular.
const TYPE_LABELS = {
  movie: 'película',
  series: 'serie',
  episode: 'episodio',
  game: 'videojuego'
}

/** Traduce el tipo de OMDb. Si aparece uno que no conocemos, lo deja pasar. */
export function typeLabel (type) {
  return TYPE_LABELS[type] ?? type ?? ''
}

/**
 * Añade las películas nuevas a las que ya teníamos, DESCARTANDO las repetidas.
 *
 * OMDb devuelve de vez en cuando el mismo imdbID en dos páginas distintas. Si
 * las concatenáramos a lo bruto acabaríamos con dos elementos con la misma
 * `key` y React protestaría (y pintaría la tarjeta duplicada).
 *
 * Se exporta para poder probarla suelta.
 */
export function appendUnique (previous, incoming) {
  const seen = new Set(previous.map((movie) => movie.id))
  const nuevas = []

  for (const movie of incoming) {
    if (seen.has(movie.id)) continue
    // Añadimos al Set sobre la marcha: así también se filtra un id repetido
    // DENTRO del propio lote, no solo contra lo que ya teníamos.
    seen.add(movie.id)
    nuevas.push(movie)
  }

  return previous.concat(nuevas)
}

export function useMovies () {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  // Separado de `loading` a propósito: al cargar más NO queremos vaciar la
  // cuadrícula ni enseñar "Cargando películas…", solo el botón en modo espera.
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  // Nos permite distinguir "aún no has buscado nada" de "he buscado y no hay
  // resultados". Sin esto, ambos casos serían `movies.length === 0`.
  const [hasSearched, setHasSearched] = useState(false)
  // Total de la búsqueda según OMDb (no de la página): con él sabemos cuántas
  // páginas hay y podemos enseñar "20 de 138".
  const [totalResults, setTotalResults] = useState(0)
  // Última página cargada. Hace falta en el RENDER para saber si quedan más,
  // por eso es estado además del ref: el ref lo lee loadMoreMovies (que es una
  // función estable) y el estado lo lee el cálculo de `hasMore`.
  const [page, setPage] = useState(1)
  // OMDb no siempre es coherente: puede decir que hay 26 000 resultados y
  // devolver una página vacía mucho antes. Si eso pasa, dejamos de ofrecer
  // "Cargar más" aunque las cuentas digan que faltan páginas.
  const [reachedEnd, setReachedEnd] = useState(false)

  // Guarda el último término buscado para no repetir la misma petición dos
  // veces seguidas. Es un ref y no un estado porque cambiarlo no debe repintar.
  const previousSearch = useRef('')

  // Contador de peticiones. Con el debounce puede haber varias peticiones
  // volando a la vez ("spid" y "spider") y NO tienen por qué llegar en orden.
  // Si llega tarde la respuesta de "spid", pisaría los resultados de "spider".
  // Solución: cada petición coge un número y solo la más reciente pinta.
  const requestId = useRef(0)

  // Página ya cargada y término al que pertenece. Son refs porque `loadMore`
  // necesita leerlos y queremos que sea una función estable (deps vacías): con
  // useState se quedaría con los valores del render en el que se creó.
  const currentPage = useRef(1)
  const currentSearch = useRef('')
  // El filtro con el que se pidió la página 1. "Cargar más" tiene que repetirlo
  // o la página 2 vendría sin filtrar y se mezclarían series entre películas.
  const currentType = useRef('')
  // Candado para que dos clics seguidos en "Cargar más" no pidan la misma
  // página dos veces. Un ref se actualiza al instante; un estado, en el
  // siguiente render, y para entonces ya habría salido la segunda petición.
  const isLoadingMore = useRef(false)

  // useCallback mantiene la MISMA referencia de función entre renders.
  // Es imprescindible aquí porque en App.jsx esta función es dependencia del
  // debounce: si cambiara en cada render, el debounce se recrearía sin parar.
  const getMovies = useCallback(async ({ search, type = '' }) => {
    // Requisito: no repetir la búsqueda anterior. El filtro forma parte de la
    // identidad de la búsqueda: "matrix" y "matrix + series" no son lo mismo,
    // así que cambiar de filtro SÍ debe volver a pedir.
    const searchKey = `${type}|${search}`
    if (searchKey === previousSearch.current) return
    previousSearch.current = searchKey

    const myRequestId = ++requestId.current
    // "Obsoleta" = mientras yo esperaba, ha salido otra petición más nueva.
    const isStale = () => myRequestId !== requestId.current

    // Una búsqueda nueva siempre empieza por la página 1.
    currentSearch.current = search
    currentType.current = type
    currentPage.current = 1
    setPage(1)
    setReachedEnd(false)

    setLoading(true)
    setError(null)

    try {
      const { results, totalResults } = await searchMovies({ search, page: 1, type })
      if (isStale()) return
      setMovies(mapMovies(results))
      setTotalResults(totalResults)
    } catch (e) {
      if (isStale()) return
      // Si ha fallado, borramos el "último buscado" para que el usuario pueda
      // reintentar el MISMO término. Si no, el guard de arriba lo bloquearía
      // y parecería que el botón no hace nada.
      previousSearch.current = ''
      setMovies([])
      setTotalResults(0)
      setError(e.message)
    }

    // Si la petición era obsoleta ya hemos salido con `return`, así que aquí
    // solo llega la más reciente: es la única que puede apagar el "cargando".
    setLoading(false)
    setHasSearched(true)
  }, [])

  /**
   * Pide la siguiente página y la AÑADE a la lista, sin borrar lo que ya hay.
   */
  const loadMoreMovies = useCallback(async () => {
    if (isLoadingMore.current) return

    // Ojo: aquí NO incrementamos requestId. Cargar más no invalida la búsqueda
    // en curso, solo la continúa. Nos quedamos con el número actual para poder
    // detectar si mientras tanto el usuario lanza una búsqueda distinta.
    const myRequestId = requestId.current
    const isStale = () => myRequestId !== requestId.current
    const nextPage = currentPage.current + 1

    isLoadingMore.current = true
    setLoadingMore(true)
    setError(null)

    try {
      const { results } = await searchMovies({
        search: currentSearch.current,
        page: nextPage,
        type: currentType.current
      })
      // Si el usuario ha buscado otra cosa mientras esperábamos, estos
      // resultados son de la búsqueda vieja: pegarlos sería un desastre.
      if (isStale()) return
      currentPage.current = nextPage
      setPage(nextPage)

      // Página vacía = OMDb ya no tiene más, aunque totalResults diga otra cosa.
      if (results.length === 0) setReachedEnd(true)

      setMovies((previous) => appendUnique(previous, mapMovies(results)))
    } catch (e) {
      if (isStale()) return
      // No vaciamos la lista: lo que ya se veía sigue siendo válido, solo ha
      // fallado la ampliación. El usuario puede reintentar con el mismo botón.
      setError(e.message)
    } finally {
      isLoadingMore.current = false
      setLoadingMore(false)
    }
  }, [])

  /**
   * Vuelve al estado inicial, como si la app acabara de abrirse.
   * Se usa al cambiar de API key: los resultados que hubiera en pantalla se
   * pidieron con la clave anterior y el guard de "no repetir búsqueda"
   * impediría volver a buscar lo mismo.
   */
  const reset = useCallback(() => {
    // Invalida cualquier petición en vuelo para que no pinte al volver.
    requestId.current++
    previousSearch.current = ''
    currentSearch.current = ''
    currentType.current = ''
    currentPage.current = 1
    isLoadingMore.current = false

    setMovies([])
    setTotalResults(0)
    setPage(1)
    setReachedEnd(false)
    setError(null)
    setHasSearched(false)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  return {
    movies,
    getMovies,
    loadMoreMovies,
    reset,
    loading,
    loadingMore,
    error,
    hasSearched,
    totalResults,
    // Contamos PÁGINAS, no películas.
    //
    // Antes esto era `movies.length < totalResults`, y tenía un fallo: cuando
    // se descarta un duplicado, la lista se queda con menos películas de las
    // que dice OMDb y la resta NUNCA cuadra. Resultado: el botón "Cargar más"
    // no desaparecía jamás y, al pulsarlo, pedía una página inexistente que no
    // añadía nada. Con las páginas el deduplicado deja de influir.
    hasMore: !reachedEnd && page < Math.ceil(totalResults / RESULTS_PER_PAGE)
  }
}
