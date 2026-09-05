// Los tres filtros que OMDb entiende de verdad en el endpoint de búsqueda.
// (Año y género, que salían en el diseño, no existen en su API: el año solo
// admite una coincidencia exacta y el género no se puede filtrar, así que
// pintar esos desplegables habría sido decorar algo que no funciona.)
const TYPE_FILTERS = [
  { value: '', label: 'todo' },
  { value: 'movie', label: 'películas' },
  { value: 'series', label: 'series' }
]

/**
 * La fila que va encima de la cuadrícula: cuántos resultados hay y el filtro
 * por tipo. Presentación pura: el filtro activo y su cambio viven en App.
 */
export function ResultsToolbar ({ meta, type, onTypeChange, disabled }) {
  return (
    <div className='results-toolbar'>
      {/* role='status' hace que el lector de pantalla cante el número de
          resultados al terminar la búsqueda, sin robar el foco al input. */}
      <p className='results-toolbar__meta' role='status'>{meta}</p>

      <div className='results-toolbar__filters' role='group' aria-label='Filtrar por tipo'>
        {TYPE_FILTERS.map(({ value, label }) => {
          const active = value === type

          return (
            <button
              className={`chip chip--button${active ? ' chip--active' : ''}`}
              type='button'
              key={value || 'todo'}
              onClick={() => onTypeChange(value)}
              disabled={disabled}
              // aria-pressed es lo que convierte un botón en un interruptor
              // para el lector de pantalla: dice cuál está seleccionado.
              aria-pressed={active}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
