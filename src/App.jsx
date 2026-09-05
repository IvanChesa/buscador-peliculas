import { useCallback, useEffect, useRef, useState } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { SiteFooter } from './components/SiteFooter'
import { Home } from './components/Home'
import { SearchForm } from './components/SearchForm'
import { ResultsToolbar } from './components/ResultsToolbar'
import { Movies } from './components/Movies'
import { MovieDetails } from './components/MovieDetails'
import { ApiKeyForm } from './components/ApiKeyForm'
import { useMovies } from './hooks/useMovies'
import { useMovieDetails } from './hooks/useMovieDetails'
import { useApiKey } from './hooks/useApiKey'
import { useSearch, validateSearch } from './hooks/useSearch'
import './App.css'

// Milisegundos que esperamos a que el usuario deje de teclear antes de buscar.
const DEBOUNCE_DELAY = 300

function App () {
  // Cada hook se ocupa de una cosa: uno del input, otro de los datos.
  // Renombramos los dos `error` porque son cosas distintas y se muestran en
  // sitios distintos: uno debajo del input, el otro en la zona de resultados.
  const {
    search,
    updateSearch,
    validate,
    reset: resetSearch,
    error: validationError
  } = useSearch()
  const {
    movies,
    getMovies,
    loadMoreMovies,
    reset: resetMovies,
    loading,
    loadingMore,
    error: apiError,
    hasSearched,
    totalResults,
    hasMore
  } = useMovies()

  // La ficha ampliada vive en su propio hook: App solo decide cuándo se abre.
  const {
    selected,
    details,
    loading: detailsLoading,
    error: detailsError,
    openMovie,
    closeMovie
  } = useMovieDetails()

  // Sin API key no hay nada que buscar, así que este hook manda sobre el resto.
  const {
    apiKey,
    hasApiKey,
    isUserKey,
    checking: checkingApiKey,
    error: apiKeyError,
    save: saveApiKey,
    clear: clearApiKey,
    clearError: clearApiKeyError
  } = useApiKey()

  // Filtro de tipo de la barra de resultados: '' (todo), 'movie' o 'series'.
  // Vive aquí y no en useMovies porque forma parte de lo que el usuario tiene
  // elegido en la interfaz, no del resultado de la última petición.
  const [typeFilter, setTypeFilter] = useState('')

  // El panel de ajustes de la cabecera, donde se cambia o se borra la clave.
  const [settingsOpen, setSettingsOpen] = useState(false)

  /**
   * QUÉ SE VE. Tres pantallas excluyentes, en este orden de prioridad:
   *  1. Sin clave no se puede hacer nada: solo el formulario que la pide.
   *  2. Nada más entrar, la portada.
   *  3. En cuanto se busca (o mientras se busca), los resultados.
   */
  const showOnboarding = !hasApiKey
  const showResults = hasSearched || loading

  // Guardamos el id del setTimeout pendiente. Tiene que ser un ref: si fuera un
  // useState, cada tecla provocaría un render extra, y además al re-renderizar
  // perderíamos la referencia al timeout que queremos cancelar.
  const debounceTimeout = useRef(null)

  const cancelPendingSearch = useCallback(() => {
    clearTimeout(debounceTimeout.current)
  }, [])

  /**
   * DEBOUNCE: en vez de pedir a la API en cada tecla, programamos la búsqueda
   * para dentro de 300 ms y cancelamos la anterior. Si el usuario escribe
   * "avengers" (8 teclas) solo se hace 1 petición en lugar de 8.
   */
  const debouncedGetMovies = useCallback((newSearch, type) => {
    cancelPendingSearch()
    debounceTimeout.current = setTimeout(() => {
      getMovies({ search: newSearch, type })
    }, DEBOUNCE_DELAY)
  }, [getMovies, cancelPendingSearch])

  // Si el usuario cierra la página con una búsqueda pendiente, cancelamos el
  // timeout. Es la limpieza estándar de cualquier efecto que deja algo abierto.
  useEffect(() => {
    return cancelPendingSearch
  }, [cancelPendingSearch])

  const handleChange = (event) => {
    const newSearch = event.target.value
    updateSearch(newSearch)

    // Cancelamos SIEMPRE la búsqueda pendiente, también cuando lo recién
    // escrito no es válido. Si solo se cancelara dentro del `if`, al teclear
    // "spider" y borrar hasta "sp" en menos de 300 ms el timeout de "spider"
    // seguiría vivo: buscaríamos un término que ya no está en el input.
    cancelPendingSearch()

    // OJO: validamos `newSearch`, NO `search`. En este instante el estado
    // `search` todavía tiene el valor ANTERIOR (React lo actualiza después).
    // Solo lanzamos la búsqueda automática si el término es válido: así no
    // gastamos peticiones en "a", "" o textos que empiezan por espacio.
    if (validateSearch(newSearch) === null) {
      debouncedGetMovies(newSearch, typeFilter)
    }
  }

  const handleSubmit = (event) => {
    // Sin esto el navegador recargaría la página entera al enviar el form.
    event.preventDefault()

    // CONVIVENCIA con el debounce: cancelamos la búsqueda automática pendiente.
    // Si no, buscaríamos ahora al pulsar el botón y otra vez 300 ms después.
    cancelPendingSearch()

    // validate() fuerza el mensaje de error aunque el usuario no haya escrito.
    if (!validate()) return

    // Aquí sí usamos `search` del estado: es el valor actual del input.
    // Si es el mismo que la última búsqueda, useMovies lo ignora solo.
    getMovies({ search, type: typeFilter })
  }

  /** Los atajos de la portada ("Star Wars", "Dune"...): escriben y buscan. */
  const handleSuggestion = (term) => {
    cancelPendingSearch()
    updateSearch(term)
    getMovies({ search: term, type: typeFilter })
  }

  /**
   * Cambiar de filtro repite la búsqueda con el mismo término. No hace falta
   * comprobar si el filtro es distinto: useMovies ya ignora las peticiones
   * repetidas, y ahora el tipo forma parte de esa comparación.
   */
  const handleTypeChange = (newType) => {
    setTypeFilter(newType)
    cancelPendingSearch()

    // Con el campo vacío o a medias no hay nada que repetir: se guarda el
    // filtro y se aplicará en la siguiente búsqueda.
    if (validateSearch(search) === null) {
      getMovies({ search, type: newType })
    }
  }

  /** "Limpiar": vuelve a la portada, como si acabáramos de entrar. */
  const handleClearSearch = () => {
    cancelPendingSearch()
    resetSearch()
    resetMovies()
    setTypeFilter('')
  }

  /**
   * Al cambiar de clave hay que tirar los resultados: se pidieron con la
   * anterior y, además, el guard de "no repetir la misma búsqueda" impediría
   * volver a buscar lo mismo con la nueva.
   */
  const handleSaveApiKey = async (key) => {
    const saved = await saveApiKey(key)
    if (!saved) return

    cancelPendingSearch()
    resetMovies()
    setSettingsOpen(false)
  }

  const handleClearApiKey = () => {
    cancelPendingSearch()
    clearApiKey()
    resetMovies()
    setSettingsOpen(false)
  }

  /** El texto de la barra de resultados, que cambia según el estado. */
  const buildResultsMeta = () => {
    if (loading) return 'Buscando…'
    if (apiError && movies.length === 0) return 'La búsqueda no se ha podido completar'
    if (movies.length === 0) return `Sin resultados para «${search}»`

    const noun = totalResults === 1 ? 'resultado' : 'resultados'
    return `Mostrando ${movies.length} de ${totalResults} ${noun} para «${search}»`
  }

  /**
   * Los estados visuales de la cuadrícula, en orden de prioridad. Lo saco a una
   * función para no acabar con ternarios anidados dentro del JSX, que son
   * ilegibles.
   */
  const renderMovies = () => {
    if (loading) return <p className='state'>Cargando películas…</p>

    // Error "duro": la búsqueda ha fallado y no hay nada que enseñar.
    if (apiError && movies.length === 0) {
      return (
        <p className='state state--error'>
          <strong>Algo ha ido mal.</strong> {apiError}
        </p>
      )
    }

    // Movies se encarga del caso "he buscado pero no hay resultados".
    return (
      <>
        <Movies movies={movies} onSelect={openMovie} />

        {/* Si lo que ha fallado es CARGAR MÁS, la lista que ya se veía sigue
            siendo buena: avisamos debajo en vez de borrarlo todo. */}
        {apiError && movies.length > 0 && (
          <p className='state state--error'>
            <strong>No se han podido cargar más resultados.</strong> {apiError}
          </p>
        )}

        {hasMore && (
          <div className='load-more'>
            <button
              className='button button--secondary button--lg'
              type='button'
              onClick={loadMoreMovies}
              disabled={loadingMore}
            >
              {loadingMore ? 'Cargando…' : 'Cargar más resultados'}
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className='site' id='top'>
      <SiteHeader
        hasApiKey={hasApiKey}
        isUserKey={isUserKey}
        showNav={!showOnboarding && !showResults}
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen((open) => !open)}
      >
        <ApiKeyForm
          variant='inline'
          activeKey={apiKey}
          checking={checkingApiKey}
          error={apiKeyError}
          onSave={handleSaveApiKey}
          onChangeInput={clearApiKeyError}
          onClear={isUserKey ? handleClearApiKey : undefined}
        />
      </SiteHeader>

      {/* aria-busy avisa a los lectores de pantalla de que esto se actualiza */}
      <main className='site__main' aria-busy={loading}>
        {showOnboarding
          ? (
            <div className='container onboarding'>
              <ApiKeyForm
                checking={checkingApiKey}
                error={apiKeyError}
                onSave={handleSaveApiKey}
                onChangeInput={clearApiKeyError}
              />
            </div>
            )
          : showResults
            ? (
              <>
                <div className='results-bar'>
                  <div className='container'>
                    <SearchForm
                      variant='bar'
                      search={search}
                      error={validationError}
                      loading={loading}
                      onChange={handleChange}
                      onSubmit={handleSubmit}
                      onClear={handleClearSearch}
                    />
                  </div>
                </div>

                <div className='container results'>
                  <ResultsToolbar
                    meta={buildResultsMeta()}
                    type={typeFilter}
                    onTypeChange={handleTypeChange}
                    disabled={loading}
                  />
                  {renderMovies()}
                </div>
              </>
              )
            : (
              <Home
                search={search}
                error={validationError}
                loading={loading}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onSuggestion={handleSuggestion}
                onOpenMovie={openMovie}
              />
              )}
      </main>

      <SiteFooter />

      {/* El modal se MONTA solo cuando hay película elegida, en vez de estar
          siempre en el DOM escondido. Así su efecto de apertura se dispara al
          montarse y no hay que sincronizar un prop `open` con el <dialog>. */}
      {selected && (
        <MovieDetails
          // key por id: fuerza un componente nuevo por cada película, así no se
          // hereda el estado de "póster roto" de la ficha anterior.
          key={selected.id}
          movie={selected}
          details={details}
          loading={detailsLoading}
          error={detailsError}
          onClose={closeMovie}
        />
      )}
    </div>
  )
}

export default App
