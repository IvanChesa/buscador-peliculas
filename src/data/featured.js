// ---------------------------------------------------------------------------
// Los destacados de la portada.
//
// Son fijos, elegidos a mano, y NO cuestan ni una petición: la lista se pinta
// con estos datos y solo se llama a OMDb cuando alguien abre una ficha. Es a
// propósito: la clave de OMDb tiene 1000 peticiones al día y sería absurdo
// gastar seis solo en enseñar la portada.
//
// OMDb no tiene endpoint de "lo más buscado", así que tampoco habría forma
// honesta de calcularlo. Las notas son las de IMDb en el momento de escribir
// esto; el dato vivo llega al abrir la ficha.
//
// `poster: null` a propósito: la tarjeta usa el bloque tipográfico del diseño
// en vez de una imagen, que además habría que ir a buscar a la API.
// ---------------------------------------------------------------------------

export const FEATURED_MOVIES = [
  { id: 'tt0903747', title: 'Breaking Bad', short: 'Breaking Bad', year: '2008–2013', type: 'series', rating: '9.5', poster: null },
  { id: 'tt0468569', title: 'The Dark Knight', short: 'The Dark Knight', year: '2008', type: 'movie', rating: '9.0', poster: null },
  { id: 'tt1375666', title: 'Inception', short: 'Inception', year: '2010', type: 'movie', rating: '8.8', poster: null },
  { id: 'tt0133093', title: 'The Matrix', short: 'The Matrix', year: '1999', type: 'movie', rating: '8.7', poster: null },
  { id: 'tt0816692', title: 'Interstellar', short: 'Interstellar', year: '2014', type: 'movie', rating: '8.7', poster: null },
  { id: 'tt0076759', title: 'Star Wars: Episode IV — A New Hope', short: 'A New Hope', year: '1977', type: 'movie', rating: '8.6', poster: null }
]

// Los atajos de la portada, debajo del buscador.
export const SUGGESTIONS = ['Star Wars', 'Dune', 'Matrix', 'Breaking Bad', 'Blade Runner']

// El stack, para los chips de "Sobre el proyecto".
export const STACK = ['React 19', 'Vite', 'JavaScript', 'CSS plano', 'OMDb API', 'Vitest']
