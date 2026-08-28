import { useState, useRef, useCallback } from 'react'
import { searchMovies } from '../services/movies'

/**
 * Traduce el formato de OMDb (Title, Year, imdbID, Poster) a NUESTRO formato
 * (title, year, id, poster).
 *
 * ¿Por qué molestarse? Para que el resto de la app no dependa de OMDb. Si
 * mañana cambiamos de API, solo hay que reescribir esta función: los
 * componentes siguen recibiendo { id, title, year, poster } igual que siempre.
 * A esto se le llama capa anticorrupción.
 */
function mapMovies (apiMovies) {
  return apiMovies.map((movie) => ({
    id: movie.imdbID,
    title: movie.Title,
    year: movie.Year,
    // OMDb manda el string "N/A" cuando no tiene póster. Lo normalizamos a null
    // aquí para que el componente solo tenga que preguntar `if (poster)` y no
    // conocer esa rareza de la API.
    poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null
  }))
}

export function useMovies () {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Nos permite distinguir "aún no has buscado nada" de "he buscado y no hay
  // resultados". Sin esto, ambos casos serían `movies.length === 0`.
  const [hasSearched, setHasSearched] = useState(false)

  // Guarda el último término buscado para no repetir la misma petición dos
  // veces seguidas. Es un ref y no un estado porque cambiarlo no debe repintar.
  const previousSearch = useRef('')

  // Contador de peticiones. Con el debounce puede haber varias peticiones
  // volando a la vez ("spid" y "spider") y NO tienen por qué llegar en orden.
  // Si llega tarde la respuesta de "spid", pisaría los resultados de "spider".
  // Solución: cada petición coge un número y solo la más reciente pinta.
  const requestId = useRef(0)

  // useCallback mantiene la MISMA referencia de función entre renders.
  // Es imprescindible aquí porque en App.jsx esta función es dependencia del
  // debounce: si cambiara en cada render, el debounce se recrearía sin parar.
  const getMovies = useCallback(async ({ search }) => {
    // Requisito: no repetir la búsqueda anterior.
    if (search === previousSearch.current) return
    previousSearch.current = search

    const myRequestId = ++requestId.current
    // "Obsoleta" = mientras yo esperaba, ha salido otra petición más nueva.
    const isStale = () => myRequestId !== requestId.current

    setLoading(true)
    setError(null)

    try {
      const newMovies = await searchMovies({ search })
      if (isStale()) return
      setMovies(mapMovies(newMovies))
    } catch (e) {
      if (isStale()) return
      // Si ha fallado, borramos el "último buscado" para que el usuario pueda
      // reintentar el MISMO término. Si no, el guard de arriba lo bloquearía
      // y parecería que el botón no hace nada.
      previousSearch.current = ''
      setMovies([])
      setError(e.message)
    }

    // Si la petición era obsoleta ya hemos salido con `return`, así que aquí
    // solo llega la más reciente: es la única que puede apagar el "cargando".
    setLoading(false)
    setHasSearched(true)
  }, [])

  return { movies, getMovies, loading, error, hasSearched }
}
