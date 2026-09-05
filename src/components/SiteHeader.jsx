/**
 * Cabecera fija de la aplicación: marca, navegación de la portada, estado de la
 * API key y el botón que despliega los ajustes.
 *
 * Es un componente de presentación: recibe el estado de la clave y devuelve
 * eventos hacia arriba. Lo que se pinta DENTRO del panel de ajustes llega por
 * `children`, así que la cabecera no necesita saber nada del formulario.
 */
export function SiteHeader ({
  hasApiKey,
  isUserKey,
  showNav,
  settingsOpen,
  onToggleSettings,
  children
}) {
  // Tres estados posibles y tres mensajes distintos: la del usuario, la del
  // .env.local del proyecto y ninguna. El punto de color viene del sistema de
  // diseño, donde el verde/ámbar son SOLO para estado, nunca decorativos.
  const status = !hasApiKey
    ? { tone: 'warn', text: 'sin API key' }
    : isUserKey
      ? { tone: 'ok', text: 'API key activa' }
      : { tone: 'ok', text: 'API key de .env.local' }

  return (
    <header className='site-header'>
      <div className='site-header__inner'>
        <a className='site-header__brand' href='#top'>buscador de películas</a>

        {/* Los anclas solo existen en la portada: en los resultados no hay a
            dónde saltar, así que la navegación desaparece en vez de mentir. */}
        {showNav && (
          <nav className='site-header__nav'>
            <a href='#destacados'>Destacados</a>
            <a href='#proyecto'>Sobre el proyecto</a>
          </nav>
        )}

        <div className='site-header__actions'>
          <span className={`key-status key-status--${status.tone}`}>
            <span className='key-status__dot' aria-hidden='true'>●</span>
            {status.text}
          </span>

          {/* Sin clave no se enseña: ya hay un formulario a pantalla completa
              pidiéndola, y dos sitios para lo mismo despistan. */}
          {hasApiKey && (
            <button
              className='button button--secondary button--sm'
              type='button'
              onClick={onToggleSettings}
              // Le dice al lector de pantalla que este botón despliega algo y
              // si ahora mismo está abierto o cerrado.
              aria-expanded={settingsOpen}
              aria-controls='settings-panel'
            >
              Ajustes
            </button>
          )}
        </div>
      </div>

      {settingsOpen && (
        <div className='site-header__panel' id='settings-panel'>
          <div className='site-header__panel-inner'>{children}</div>
        </div>
      )}
    </header>
  )
}
