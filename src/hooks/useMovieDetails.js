import { useState, useRef, useCallback } from 'react'
import { getMovieDetails } from '../services/movies'

/**
 * OMDb rellena con el string "N/A" TODOS los campos que no tiene, en vez de
 * omitirlos o mandar null. Si no lo normalizamos aquí, acabaríamos pintando
 * "Director: N/A" por toda la ficha.
 */
function clean (value) {
  return value && value !== 'N/A' ? value : null
}

/**
 * Pasa la ficha cruda de OMDb a nuestro formato, igual que hace mapMovies con
 * los resultados de búsqueda. Se exporta para poder probarla suelta.
 */
export function mapMovieDetails (raw) {
  return {
    id: raw.imdbID,
    title: raw.Title,
    year: raw.Year,
    poster: clean(raw.Poster),
    plot: clean(raw.Plot),
    director: clean(raw.Director),
    actors: clean(raw.Actors),
    runtime: clean(raw.Runtime),
    rated: clean(raw.Rated),
    released: clean(raw.Released),
    rating: clean(raw.imdbRating),
    votes: clean(raw.imdbVotes),
    // "Action, Adventure, Sci-Fi" -> ['Action', 'Adventure', 'Sci-Fi'], para
    // poder pintar cada género como una etiqueta independiente.
    genres: clean(raw.Genre)?.split(', ') ?? []
  }
}

/**
 * Gestiona la ficha ampliada de una película: qué película está abierta, sus
 * datos completos y el estado de esa petición.
 */
export function useMovieDetails () {
  // La película "básica" que el usuario ha pulsado ({ id, title, year, poster },
  // lo que ya teníamos de la búsqueda). En cuanto se rellena, el modal se abre.
  //
  // Es deliberado que sea un estado distinto de `details`: así el modal se abre
  // AL INSTANTE con el título y el póster que ya conocíamos, y la sinopsis
  // aparece cuando llega. Si esperásemos a la petición, el usuario haría clic y
  // no pasaría nada durante medio segundo.
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Caché en memoria: la ficha de una película no cambia mientras navegas, así
  // que si vuelves a abrir la misma no tiene sentido volver a pedirla.
  const cache = useRef(new Map())

  // Mismo problema que en useMovies: si el usuario abre una película, cierra y
  // abre otra rápido, las respuestas pueden llegar cambiadas de orden.
  const requestId = useRef(0)

  const openMovie = useCallback(async (movie) => {
    setSelected(movie)

    const cached = cache.current.get(movie.id)
    if (cached) {
      setDetails(cached)
      setError(null)
      setLoading(false)
      return
    }

    const myRequestId = ++requestId.current
    const isStale = () => myRequestId !== requestId.current

    setDetails(null)
    setError(null)
    setLoading(true)

    try {
      const raw = await getMovieDetails({ id: movie.id })
      if (isStale()) return
      const mapped = mapMovieDetails(raw)
      cache.current.set(movie.id, mapped)
      setDetails(mapped)
    } catch (e) {
      if (isStale()) return
      setError(e.message)
    }

    if (isStale()) return
    setLoading(false)
  }, [])

  const closeMovie = useCallback(() => {
    // Invalidamos la petición en vuelo: si el usuario cierra el modal antes de
    // que llegue la ficha, no queremos que se pinte nada al volver.
    requestId.current++
    setSelected(null)
    setDetails(null)
    setError(null)
    setLoading(false)
  }, [])

  return { selected, details, loading, error, openMovie, closeMovie }
}
