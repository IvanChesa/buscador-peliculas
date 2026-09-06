import { SearchForm } from './SearchForm'
import { MovieCard } from './Movies'
import { FEATURED_MOVIES, STACK, SUGGESTIONS } from '../data/featured'

/** La etiqueta con la rayita que abre cada sección. Sale del sistema de diseño. */
function SectionLabel ({ children }) {
  return (
    <p className='section-label'>
      <span className='section-label__rule' aria-hidden='true' />
      {children}
    </p>
  )
}

/**
 * La portada: lo que se ve antes de buscar nada.
 *
 * No tiene estado propio. El input sigue viviendo en App (es el mismo que usa
 * la barra de resultados), y aquí solo se pinta más grande.
 */
export function Home ({
  search,
  error,
  loading,
  onChange,
  onSubmit,
  onSuggestion,
  onOpenMovie
}) {
  return (
    <>
      <section className='hero'>
        {/* Rejilla técnica y glow del acento: decoración pura, así que
            aria-hidden y pointer-events:none para que no estorben. */}
        <div className='hero__grid-lines' aria-hidden='true' />
        <div className='hero__glow' aria-hidden='true' />

        <div className='container hero__inner'>
          <div className='hero__main'>
            <SectionLabel>OMDb API · proyecto propio</SectionLabel>

            <h1 className='hero__title'>
              Busca cualquier película o serie. Sin ruido.
            </h1>

            <p className='hero__lead'>
              Escribe un título y tienes ficha completa: sinopsis, reparto,
              duración, clasificación y nota de IMDb. Sin registro y sin
              publicidad.
            </p>

            <SearchForm
              search={search}
              error={error}
              loading={loading}
              onChange={onChange}
              onSubmit={onSubmit}
            />

            <div className='hero__suggestions'>
              <span className='hero__suggestions-label'>Populares</span>
              {SUGGESTIONS.map((term) => (
                <button
                  className='chip chip--button'
                  type='button'
                  key={term}
                  onClick={() => onSuggestion(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className='hero__cards'>
            <div className='feature-card feature-card--accent'>
              <p className='feature-card__label'>Búsqueda en vivo</p>
              <p className='feature-card__text'>
                Consulta directa a OMDb con debounce de 300 ms: se pide cuando
                dejas de escribir, no en cada tecla.
              </p>
            </div>
            <div className='feature-card'>
              <p className='feature-card__label'>Ficha completa</p>
              <p className='feature-card__text'>
                Director, reparto, duración, estreno y clasificación por edades
                en una sola vista.
              </p>
            </div>
            <div className='feature-card'>
              <p className='feature-card__label'>Tu propia API key</p>
              <p className='feature-card__text'>
                Se guarda en tu navegador. No pasa por ningún servidor
                intermedio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className='container section' id='destacados'>
        <div className='section__head'>
          <div>
            <SectionLabel>Destacados</SectionLabel>
            <h2 className='section__title'>Por dónde empezar</h2>
          </div>
          {/* OMDb no tiene endpoint de "lo más buscado", así que la lista es
              fija y aquí se dice, en vez de fingir que se actualiza sola. */}
          <span className='section__note'>selección fija · sin gastar peticiones</span>
        </div>

        <ul className='movies'>
          {FEATURED_MOVIES.map((movie) => (
            <li key={movie.id}>
              <MovieCard
                movie={movie}
                onSelect={onOpenMovie}
                // `short` solo entra en juego si la URL del póster caducase:
                // es el título que cabe en el bloque tipográfico del plan B.
                label={movie.short}
                badge={`★ ${movie.rating}`}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className='container section section--split' id='proyecto'>
        <div>
          <SectionLabel>Sobre el proyecto</SectionLabel>
          <h2 className='section__title'>Práctica de React, hecha en serio</h2>
        </div>
        <div>
          <p className='section__text'>
            Cliente en React sin librerías de estado ni router: el componente
            llama al hook, el hook al servicio y solo el servicio habla con
            OMDb. Si mañana se cambia de API, se toca un archivo. La clave vive
            en el localStorage de cada visitante, así que no hay backend que
            mantener ni cupo compartido.
          </p>
          <p className='section__text'>
            Lo interesante está en los detalles: debounce en el input, caché de
            las fichas ya abiertas, paginación que descarta los ids repetidos
            que manda OMDb y estados de carga, error y vacío diferenciados.
          </p>
          <ul className='chips'>
            {STACK.map((tech) => (
              <li className='chip' key={tech}>{tech}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
