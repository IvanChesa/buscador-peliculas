import { useState } from 'react'

/**
 * El marco 2:3 de un póster, con su plan B.
 *
 * Se usa en tres sitios (tarjeta de resultado, destacados y ficha ampliada), y
 * por eso vive aparte: los tres tienen el mismo problema. OMDb manda el string
 * "N/A" cuando no tiene póster, y además da URLs que existen en el JSON pero
 * responden 404. Sin esto se vería el icono de imagen rota del navegador.
 *
 * El plan B no es un icono genérico: es el mismo bloque tipográfico del diseño
 * (año arriba, título abajo sobre un degradado), así que una película sin
 * póster no rompe la cuadrícula ni canta como un hueco.
 */
export function Poster ({ src, title, label, year, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showFallback = !src || imageFailed

  return (
    <div className={`poster ${className}`.trim()}>
      {showFallback
        ? (
          // aria-hidden: el título ya se lee justo debajo, en la tarjeta. Si no
          // lo ocultáramos, el lector de pantalla lo diría dos veces seguidas.
          <div className='poster__fallback' aria-hidden='true'>
            {year && <span className='poster__year'>{year}</span>}
            <span className='poster__label'>{label ?? title}</span>
          </div>
          )
        : (
          <img
            className='poster__image'
            src={src}
            alt={`Póster de ${title}`}
            loading='lazy'
            onError={() => setImageFailed(true)}
          />
          )}
    </div>
  )
}
