import { describe, expect, it } from 'vitest'
import { mapMovieDetails } from './useMovieDetails'

const RAW = {
  imdbID: 'tt0133093',
  Title: 'The Matrix',
  Year: '1999',
  Poster: 'https://example.com/matrix.jpg',
  Plot: 'Un hacker descubre la verdad sobre su realidad.',
  Director: 'Lana Wachowski, Lilly Wachowski',
  Actors: 'Keanu Reeves, Laurence Fishburne',
  Runtime: '136 min',
  Rated: 'R',
  Released: '31 Mar 1999',
  imdbRating: '8.7',
  imdbVotes: '2,038,142',
  Genre: 'Action, Sci-Fi'
}

describe('mapMovieDetails', () => {
  it('traduce la ficha de OMDb a nuestro formato', () => {
    const details = mapMovieDetails(RAW)

    expect(details.id).toBe('tt0133093')
    expect(details.title).toBe('The Matrix')
    expect(details.rating).toBe('8.7')
    expect(details.runtime).toBe('136 min')
  })

  it('parte el string de géneros en un array', () => {
    expect(mapMovieDetails(RAW).genres).toEqual(['Action', 'Sci-Fi'])
  })

  it('deja los géneros en array vacío si OMDb manda "N/A"', () => {
    expect(mapMovieDetails({ ...RAW, Genre: 'N/A' }).genres).toEqual([])
  })

  // OMDb rellena con "N/A" TODO lo que no tiene. Si esto se colara, la ficha
  // mostraría "Director: N/A" en pantalla.
  it('convierte todos los "N/A" en null', () => {
    const details = mapMovieDetails({
      ...RAW,
      Plot: 'N/A',
      Director: 'N/A',
      Actors: 'N/A',
      Poster: 'N/A',
      imdbRating: 'N/A'
    })

    expect(details.plot).toBeNull()
    expect(details.director).toBeNull()
    expect(details.actors).toBeNull()
    expect(details.poster).toBeNull()
    expect(details.rating).toBeNull()
  })
})
