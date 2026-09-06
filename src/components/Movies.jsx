import { Poster } from './Poster'
import { typeLabel } from '../hooks/useMovies'

/**
 * Tarjeta de una película. Recibe YA nuestro objeto normalizado
 * { id, title, year, type, poster }, nunca el objeto crudo de OMDb.
 *
 * `label` es el título corto para el plan B del póster (los destacados lo
 * usan) y `badge` una chapa opcional sobre la portada, que ahí es la nota de
 * IMDb. Sin ellos la tarjeta es la de los resultados de búsqueda.
 */
export function MovieCard ({ movie, onSelect, label, badge }) {
  const { title, year, type, poster } = movie

  return (
    <article className='movie'>
      <Poster src={poster} title={title} label={label} year={year} />

      {/* La chapa va ENCIMA del póster y no en el pie: abajo hay sitio justo
          para "año · tipo", y al añadirle la nota el texto se partía en dos
          líneas en cuanto la tarjeta se estrechaba. */}
      {badge && <span className='movie__badge'>{badge}</span>}

      {/*
        PATRÓN "ENLACE ESTIRADO": el botón envuelve solo el título, pero en el
        CSS su ::after se estira sobre toda la tarjeta, así que se puede hacer
        clic en cualquier parte (también en el póster).

        ¿Por qué no meter la tarjeta entera dentro del <button>? Porque un
        <button> solo admite contenido de tipo texto: un <h3> dentro sería HTML
        inválido. Así conservamos el encabezado y, de paso, el nombre accesible
        del botón es el título de la película, que es justo lo que debe leer un
        lector de pantalla.
      */}
      <div className='movie__info'>
        <h3 className='movie__title'>
          <button
            className='movie__button'
            type='button'
            onClick={() => onSelect(movie)}
          >
            {title}
          </button>
        </h3>

        <p className='movie__meta'>
          {/* filter(Boolean) por si OMDb no manda el tipo: así no queda un
              separador suelto colgando detrás del año. */}
          {[year, typeLabel(type)].filter(Boolean).join(' · ')}
        </p>
      </div>
    </article>
  )
}

/**
 * Lista de películas. Solo se ocupa de pintar la cuadrícula o el mensaje de
 * "sin resultados": no sabe nada de fetch, ni de loading, ni de errores.
 */
export function Movies ({ movies, onSelect }) {
  const hasMovies = movies.length > 0

  if (!hasMovies) {
    return (
      <p className='state'>
        No se han encontrado resultados para esa búsqueda. Prueba con otro
        título, o quita el filtro de tipo.
      </p>
    )
  }

  return (
    <ul className='movies'>
      {movies.map((movie) => (
        // La `key` debe ser un identificador ESTABLE y único: usamos el id de
        // IMDb. Usar el índice del array sería un error, porque al cambiar la
        // búsqueda React reutilizaría tarjetas equivocadas (y en nuestro caso
        // se quedaría el estado `imageFailed` de la película anterior).
        <li key={movie.id}>
          <MovieCard movie={movie} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  )
}
