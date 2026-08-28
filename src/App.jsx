import { useCallback, useEffect, useRef } from 'react'
import { SearchForm } from './components/SearchForm'
import { Movies } from './components/Movies'
import { useMovies } from './hooks/useMovies'
import { useSearch, validateSearch } from './hooks/useSearch'
import './App.css'

// Milisegundos que esperamos a que el usuario deje de teclear antes de buscar.
const DEBOUNCE_DELAY = 300

function App () {
  // Cada hook se ocupa de una cosa: uno del input, otro de los datos.
  // Renombramos los dos `error` porque son cosas distintas y se muestran en
  // sitios distintos: uno debajo del input, el otro en la zona de resultados.
  const { search, updateSearch, validate, error: validationError } = useSearch()
  const { movies, getMovies, loading, error: apiError, hasSearched } = useMovies()

  // Guardamos el id del setTimeout pendiente. Tiene que ser un ref: si fuera un
  // useState, cada tecla provocaría un render extra, y además al re-renderizar
  // perderíamos la referencia al timeout que queremos cancelar.
  const debounceTimeout = useRef(null)

  /**
   * DEBOUNCE: en vez de pedir a la API en cada tecla, programamos la búsqueda
   * para dentro de 300 ms y cancelamos la anterior. Si el usuario escribe
   * "avengers" (8 teclas) solo se hace 1 petición en lugar de 8.
   */
  const debouncedGetMovies = useCallback((newSearch) => {
    clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      getMovies({ search: newSearch })
    }, DEBOUNCE_DELAY)
  }, [getMovies])

  // Si el usuario cierra la página con una búsqueda pendiente, cancelamos el
  // timeout. Es la limpieza estándar de cualquier efecto que deja algo abierto.
  useEffect(() => {
    return () => clearTimeout(debounceTimeout.current)
  }, [])

  const handleChange = (event) => {
    const newSearch = event.target.value
    updateSearch(newSearch)

    // OJO: validamos `newSearch`, NO `search`. En este instante el estado
    // `search` todavía tiene el valor ANTERIOR (React lo actualiza después).
    // Solo lanzamos la búsqueda automática si el término es válido: así no
    // gastamos peticiones en "a", "" o textos que empiezan por espacio.
    if (validateSearch(newSearch) === null) {
      debouncedGetMovies(newSearch)
    }
  }

  const handleSubmit = (event) => {
    // Sin esto el navegador recargaría la página entera al enviar el form.
    event.preventDefault()

    // CONVIVENCIA con el debounce: cancelamos la búsqueda automática pendiente.
    // Si no, buscaríamos ahora al pulsar el botón y otra vez 300 ms después.
    clearTimeout(debounceTimeout.current)

    // validate() fuerza el mensaje de error aunque el usuario no haya escrito.
    if (!validate()) return

    // Aquí sí usamos `search` del estado: es el valor actual del input.
    // Si es el mismo que la última búsqueda, useMovies lo ignora solo.
    getMovies({ search })
  }

  /**
   * Los cuatro estados visuales, en orden de prioridad. Lo saco a una función
   * para no acabar con ternarios anidados dentro del JSX, que son ilegibles.
   */
  const renderResults = () => {
    if (loading) return <p className='message'>Cargando películas…</p>

    if (apiError) {
      return (
        <p className='message message--error'>
          <strong>Algo ha ido mal.</strong> {apiError}
        </p>
      )
    }

    // Estado inicial: la app acaba de abrirse y no se ha buscado nada todavía.
    if (!hasSearched) {
      return (
        <p className='message'>
          Escribe el título de una película para empezar a buscar.
        </p>
      )
    }

    // Movies se encarga del caso "he buscado pero no hay resultados".
    return <Movies movies={movies} />
  }

  return (
    <div className='app'>
      <header className='app__header'>
        <h1 className='app__title'>🍿 Buscador de películas</h1>
        <p className='app__subtitle'>Busca cualquier película o serie en OMDb</p>

        <SearchForm
          search={search}
          error={validationError}
          loading={loading}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </header>

      {/* aria-busy avisa a los lectores de pantalla de que esto se está actualizando */}
      <main className='app__results' aria-busy={loading}>
        {renderResults()}
      </main>
    </div>
  )
}

export default App
