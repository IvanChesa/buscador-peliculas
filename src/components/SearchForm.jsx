/**
 * Componente de PRESENTACIÓN puro: no tiene estado propio ni sabe nada de OMDb.
 * Todo lo recibe por props y avisa hacia arriba con onChange / onSubmit.
 * Así se puede reutilizar y probar sin montar media aplicación.
 *
 * Aparece en dos sitios con dos tamaños distintos (el buscador grande de la
 * portada y la barra estrecha de los resultados). En vez de duplicar el
 * componente, se cambia con `variant`: el HTML es el mismo, manda el CSS.
 */
export function SearchForm ({
  search,
  error,
  loading,
  onChange,
  onSubmit,
  onClear,
  variant = 'hero'
}) {
  return (
    <form className={`search-form search-form--${variant}`} onSubmit={onSubmit}>
      <div className='search-form__row'>
        <label className='visually-hidden' htmlFor='search'>
          Buscar película
        </label>

        {/*
          INPUT CONTROLADO: su `value` sale del estado de React y cualquier
          tecleo pasa por onChange. React es la única fuente de verdad; el DOM
          nunca guarda un valor que nosotros no conozcamos.

          aria-invalid / aria-describedby conectan el input con su mensaje de
          error para los lectores de pantalla.
        */}
        <input
          id='search'
          className='search-form__input'
          type='text'
          value={search}
          onChange={onChange}
          placeholder='Avengers, Matrix, Star Wars…'
          autoComplete='off'
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'search-error' : undefined}
        />

        {/*
          El botón NO se deshabilita cuando hay error de validación: el enunciado
          pide "mostrar el error sin bloquear el formulario". Solo lo bloqueamos
          mientras hay una petición en curso, para no duplicar llamadas.
        */}
        <button className='button button--primary' type='submit' disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar →'}
        </button>

        {/* Solo hay algo que limpiar cuando ya se ha buscado (barra de resultados). */}
        {onClear && (
          <button className='button button--secondary' type='button' onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      {/*
        role='alert' hace que el lector de pantalla anuncie el mensaje en cuanto
        aparece. Reservamos el hueco siempre (ver CSS) para que la cuadrícula no
        pegue un salto vertical cada vez que aparece o desaparece el error.
      */}
      <p id='search-error' className='search-form__error' role='alert'>
        {error}
      </p>
    </form>
  )
}
