const OMDB_URL = 'https://www.omdbapi.com/'
const AUTHOR_URL = 'https://ivanchesa.es'

/** Pie de página. Fijo y sin estado: dos líneas de crédito y poco más. */
export function SiteFooter () {
  return (
    <footer className='site-footer'>
      <div className='site-footer__inner'>
        <span>
          Datos de{' '}
          {/* noreferrer/noopener: sin esto, la página que abrimos podría
              manipular la nuestra a través de window.opener. */}
          <a href={OMDB_URL} target='_blank' rel='noreferrer noopener'>OMDb API</a>
          {' '}· no afiliado a IMDb
        </span>
        <span>
          Proyecto de{' '}
          <a href={AUTHOR_URL} target='_blank' rel='noreferrer noopener'>ivanchesa.es</a>
        </span>
      </div>
    </footer>
  )
}
