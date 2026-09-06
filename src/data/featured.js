// ---------------------------------------------------------------------------
// Los destacados de la portada.
//
// Son fijos, elegidos a mano, y NO cuestan ni una petición a OMDb: la lista se
// pinta con estos datos y solo se llama a la API cuando alguien abre una ficha.
// Es a propósito: la clave de OMDb tiene 1000 peticiones al día y sería absurdo
// gastar seis solo en enseñar la portada.
//
// OMDb no tiene endpoint de "lo más buscado", así que tampoco habría forma
// honesta de calcularlo. Las notas son las de IMDb en el momento de escribir
// esto; el dato vivo llega al abrir la ficha.
//
// Los `poster` son las URLs que devuelve OMDb, pedidas UNA vez y copiadas aquí,
// normalizadas todas a la misma anchura (`_V1_SX400`). Son imágenes del CDN de
// Amazon, no llamadas a la API: el navegador las descarga directamente y el
// cupo diario del visitante sigue intacto. Si alguna caducase, `Poster` cae
// solo en el bloque tipográfico usando `short` como título.
// ---------------------------------------------------------------------------

const POSTER_BASE = 'https://m.media-amazon.com/images/M/'

/** Monta la URL del póster a partir del identificador de la imagen. */
const poster = (id) => `${POSTER_BASE}${id}._V1_SX400.jpg`

export const FEATURED_MOVIES = [
  { id: 'tt0903747', title: 'Breaking Bad', short: 'Breaking Bad', year: '2008–2013', type: 'series', rating: '9.5', poster: poster('MV5BMzU5ZGYzNmQtMTdhYy00OGRiLTg0NmQtYjVjNzliZTg1ZGE4XkEyXkFqcGc@') },
  { id: 'tt0468569', title: 'The Dark Knight', short: 'The Dark Knight', year: '2008', type: 'movie', rating: '9.1', poster: poster('MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@') },
  { id: 'tt1375666', title: 'Inception', short: 'Inception', year: '2010', type: 'movie', rating: '8.8', poster: poster('MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@') },
  { id: 'tt0133093', title: 'The Matrix', short: 'The Matrix', year: '1999', type: 'movie', rating: '8.7', poster: poster('MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@') },
  { id: 'tt0816692', title: 'Interstellar', short: 'Interstellar', year: '2014', type: 'movie', rating: '8.7', poster: poster('MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@') },
  { id: 'tt0076759', title: 'Star Wars: Episode IV — A New Hope', short: 'A New Hope', year: '1977', type: 'movie', rating: '8.6', poster: poster('MV5BOGUwMDk0Y2MtNjBlNi00NmRiLTk2MWYtMGMyMDlhYmI4ZDBjXkEyXkFqcGc@') }
]

// Los atajos de la portada, debajo del buscador.
export const SUGGESTIONS = ['Star Wars', 'Dune', 'Matrix', 'Breaking Bad', 'Blade Runner']

// El stack, para los chips de "Sobre el proyecto".
export const STACK = ['React 19', 'Vite', 'JavaScript', 'CSS plano', 'OMDb API', 'Vitest']
