import { useEffect, useRef } from 'react'
import { Poster } from './Poster'
import { typeLabel } from '../hooks/useMovies'

/**
 * Fila "Etiqueta: valor" de la ficha. No pinta nada si el dato no viene, que
 * es lo que queremos: OMDb deja muchos campos vacíos y una ficha llena de
 * huecos en blanco queda peor que una ficha corta.
 *
 * Devuelve un fragmento con el <dt> y el <dd> sueltos, sin envoltorio, porque
 * la <dl> es una rejilla de dos columnas: si los metiéramos en un <div> cada
 * pareja contaría como una sola celda y se rompería la alineación.
 */
function DetailRow ({ label, value }) {
  if (!value) return null

  return (
    <>
      <dt className='details__label'>{label}</dt>
      <dd className='details__value'>{value}</dd>
    </>
  )
}

/**
 * Ficha ampliada de una película, dentro de un modal.
 *
 * Usa el elemento <dialog> NATIVO en lugar de un div con position:fixed. A
 * cambio de un par de líneas de useEffect nos regala cosas que a mano son
 * bastante trabajo: atrapa el foco dentro del modal, deja inerte el resto de
 * la página para los lectores de pantalla, se cierra con Escape y trae su
 * propio fondo oscurecido (el pseudoelemento ::backdrop).
 *
 * El componente se monta solo cuando hay película seleccionada, así que puede
 * dar por hecho que `movie` existe.
 */
export function MovieDetails ({ movie, details, loading, error, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    // Guardamos quién tenía el foco (la tarjeta que se ha pulsado) para
    // devolvérselo al cerrar. Si no, el foco se iría al principio de la página
    // y quien navegue con teclado se perdería.
    const previouslyFocused = document.activeElement

    // showModal() —y no show()— es el que activa el modo modal de verdad.
    dialog.showModal()

    // Mientras el modal está abierto bloqueamos el scroll del fondo: <dialog>
    // hace muchas cosas por nosotros, pero esta no.
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [])

  /**
   * El evento `cancel` es el que dispara el navegador al pulsar Escape.
   * Hacemos preventDefault para que NO cierre el <dialog> por su cuenta: quien
   * manda es React. Avisamos al padre, el padre deja de renderizar este
   * componente y el cierre real ocurre en la limpieza del efecto de arriba.
   * Así solo hay un camino para cerrar y los dos estados no se desincronizan.
   */
  const handleCancel = (event) => {
    event.preventDefault()
    onClose()
  }

  /**
   * Cerrar al pulsar fuera. El truco: los clics en el fondo oscurecido tienen
   * como target el propio <dialog>, mientras que los de dentro tienen como
   * target algún hijo. Comparando con el ref distinguimos unos de otros.
   */
  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose()
  }

  const type = typeLabel(movie.type)

  return (
    <dialog
      ref={dialogRef}
      className='details'
      aria-labelledby='details-title'
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <button
        className='details__close'
        type='button'
        onClick={onClose}
        aria-label='Cerrar ficha'
      >
        ✕
      </button>

      <div className='details__body'>
        <Poster
          src={movie.poster}
          title={movie.title}
          year={movie.year}
          className='poster--lg'
        />

        <div className='details__content'>
          {/* Título y año salen de la película que ya teníamos de la búsqueda,
              así que se pintan al instante aunque la ficha aún esté cargando. */}
          <h2 className='details__title' id='details-title'>{movie.title}</h2>

          <div className='details__facts'>
            <span className='details__year'>{movie.year}</span>
            {type && (
              <>
                <span className='details__divider' aria-hidden='true' />
                <span className='details__type'>{type}</span>
              </>
            )}
            {details?.rating && (
              <>
                <span className='details__divider' aria-hidden='true' />
                <span className='details__rating'>
                  <span className='details__rating-value'>★ {details.rating}</span>
                  <span className='details__rating-scale'>
                    / 10{details.votes && ` · ${details.votes} votos`}
                  </span>
                </span>
              </>
            )}
          </div>

          {loading && <p className='state state--inline'>Cargando ficha…</p>}

          {error && (
            <p className='state state--error'>
              <strong>No se ha podido cargar la ficha.</strong> {error}
            </p>
          )}

          {details && (
            <>
              {details.genres.length > 0 && (
                <ul className='chips'>
                  {details.genres.map((genre) => (
                    <li className='chip' key={genre}>{genre}</li>
                  ))}
                </ul>
              )}

              {details.plot && <p className='details__plot'>{details.plot}</p>}

              {/* <dl> es la etiqueta correcta para pares dato/valor: asocia
                  cada término con su descripción también para los lectores
                  de pantalla, cosa que un montón de <div> no haría. */}
              <dl className='details__list'>
                <DetailRow label='Director' value={details.director} />
                <DetailRow label='Reparto' value={details.actors} />
                <DetailRow label='Duración' value={details.runtime} />
                <DetailRow label='Estreno' value={details.released} />
                <DetailRow label='Clasificación' value={details.rated} />
              </dl>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
