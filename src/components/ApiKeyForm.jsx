import { useState } from 'react'

const OMDB_SIGNUP_URL = 'https://www.omdbapi.com/apikey.aspx'

/** Enseña solo los cuatro últimos caracteres: lo justo para reconocer la clave. */
function maskKey (key) {
  if (!key) return ''
  return '•'.repeat(Math.max(key.length - 4, 4)) + key.slice(-4)
}

/**
 * Formulario de la API key de OMDb.
 *
 * Existe porque esta es una aplicación 100 % de frontend: no hay servidor donde
 * esconder una clave, y la del autor tiene un límite de 1000 peticiones al día
 * que se agotaría entre todos. Con esto, cada uno usa la suya y su cupo.
 *
 * La clave se guarda en el localStorage del navegador de quien la escribe: no
 * se envía a ningún sitio que no sea la propia API de OMDb.
 *
 * Sale en dos sitios y por eso tiene dos variantes:
 *  - 'page': la pantalla de bienvenida, cuando todavía no hay ninguna clave.
 *    Explica qué es, para qué sirve y cómo conseguirla.
 *  - 'inline': la fila del panel de ajustes, para cambiarla o borrarla. Ahí ya
 *    no hace falta explicar nada: el usuario sabe lo que busca.
 */
export function ApiKeyForm ({
  variant = 'page',
  checking,
  error,
  activeKey,
  onSave,
  onClear,
  onCancel,
  onChangeInput
}) {
  const [value, setValue] = useState('')
  const isPage = variant === 'page'

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(value)
  }

  const handleChange = (event) => {
    setValue(event.target.value)
    // Al retocar el campo quitamos el error anterior: seguir enseñando
    // "esa clave no vale" mientras el usuario escribe otra distinta despista.
    onChangeInput()
  }

  return (
    <section className={`api-key api-key--${variant}`}>
      {isPage && (
        <>
          <h2 className='api-key__title'>Introduce tu API key de OMDb</h2>

          <p className='api-key__text'>
            Este buscador consulta la API de OMDb, que necesita una clave
            propia. Es <strong>gratis</strong> y se consigue en un minuto.
          </p>

          <ol className='api-key__steps'>
            <li>
              Pídela en{' '}
              <a
                href={OMDB_SIGNUP_URL}
                target='_blank'
                // noreferrer/noopener: sin esto, la página que abrimos podría
                // manipular la nuestra a través de window.opener.
                rel='noreferrer noopener'
              >
                omdbapi.com/apikey.aspx
              </a>{' '}
              con el plan <strong>FREE</strong> (1000 peticiones al día).
            </li>
            <li>Te llegará por correo. <strong>Actívala</strong> pulsando el enlace del email.</li>
            <li>Pégala aquí abajo.</li>
          </ol>
        </>
      )}

      <form className='api-key__form' onSubmit={handleSubmit}>
        <label className={isPage ? 'api-key__label' : 'visually-hidden'} htmlFor='api-key'>
          {isPage ? 'Tu API key' : 'API key de OMDb'}
        </label>

        <div className='api-key__row'>
          <input
            id='api-key'
            className='api-key__input'
            type='text'
            value={value}
            onChange={handleChange}
            // En ajustes el placeholder enseña la clave que hay ahora,
            // enmascarada: se reconoce sin dejarla a la vista de nadie que pase
            // por delante de la pantalla.
            placeholder={activeKey ? maskKey(activeKey) : 'p. ej. a1b2c3d4'}
            autoComplete='off'
            spellCheck='false'
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'api-key-error' : undefined}
          />

          <button className='button button--primary' type='submit' disabled={checking}>
            {checking ? 'Comprobando…' : 'Guardar'}
          </button>

          {/* Solo se puede borrar la clave del usuario: la de .env.local no es
              suya, la pone el proyecto. */}
          {onClear && (
            <button className='button button--secondary' type='button' onClick={onClear}>
              Borrar
            </button>
          )}

          {/* Solo hay algo que cancelar si ya había una clave funcionando. */}
          {onCancel && (
            <button className='button button--ghost' type='button' onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>

        <p id='api-key-error' className='api-key__error' role='alert'>
          {error}
        </p>
      </form>

      <p className='api-key__note'>
        {isPage
          ? 'La clave se guarda solo en este navegador y se envía únicamente a OMDb. Puedes borrarla cuando quieras.'
          : 'Guardada solo en este navegador'}
      </p>
    </section>
  )
}
