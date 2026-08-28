import { useState } from 'react'

/**
 * Tarjeta de una película. Recibe YA nuestro objeto normalizado
 * { id, title, year, poster }, nunca el objeto crudo de OMDb.
 */
function Movie ({ title, year, poster }) {
  // Algunos pósters de OMDb existen en el JSON pero la URL está rota (404).
  // Con este estado, si la imagen falla al cargar mostramos el placeholder
  // en vez de dejar el típico icono de imagen rota del navegador.
  const [imageFailed, setImageFailed] = useState(false)

  const showPlaceholder = !poster || imageFailed

  return (
    <article className='movie'>
      {showPlaceholder
        ? (
          // El placeholder para cuando Poster viene como "N/A".
          // aria-hidden en el emoji: es decorativo, no aporta información.
          <div className='movie__poster movie__poster--empty'>
            <span aria-hidden='true'>🎬</span>
            <span className='movie__poster-text'>Sin póster</span>
          </div>
          )
        : (
          <img
            className='movie__poster'
            src={poster}
            alt={`Póster de ${title}`}
            loading='lazy'
            onError={() => setImageFailed(true)}
          />
          )}

      <div className='movie__info'>
        <h3 className='movie__title' title={title}>{title}</h3>
        <span className='movie__year'>{year}</span>
      </div>
    </article>
  )
}

/**
 * Lista de películas. Solo se ocupa de pintar la cuadrícula o el mensaje de
 * "sin resultados": no sabe nada de fetch, ni de loading, ni de errores.
 */
export function Movies ({ movies }) {
  const hasMovies = movies.length > 0

  if (!hasMovies) {
    return (
      <p className='message'>
        No se han encontrado resultados para esa búsqueda.
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
          <Movie title={movie.title} year={movie.year} poster={movie.poster} />
        </li>
      ))}
    </ul>
  )
}
