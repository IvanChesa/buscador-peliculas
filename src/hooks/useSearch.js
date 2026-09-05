import { useState, useEffect, useRef } from 'react'

export const MIN_SEARCH_LENGTH = 3

/**
 * Función PURA de validación: entra un string, sale un mensaje de error o null.
 * La sacamos fuera del hook a propósito, por dos motivos:
 *  1. Es fácil de probar (no necesita React para nada).
 *  2. App.jsx la puede usar directamente sobre el valor que acaba de teclear el
 *     usuario, sin esperar a que el estado del hook se actualice.
 */
export function validateSearch (search) {
  if (search === '') return 'No se puede buscar una película vacía.'
  if (search.startsWith(' ')) return 'La búsqueda no puede empezar por un espacio.'
  if (search.length < MIN_SEARCH_LENGTH) {
    return `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres.`
  }
  return null // null = todo correcto
}

/**
 * Gestiona el valor del input y su mensaje de validación.
 */
export function useSearch () {
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)

  // useRef guarda un valor entre renders SIN provocar un re-render al cambiarlo.
  // Lo usamos como "bandera": mientras el usuario no haya escrito nada, no le
  // enseñamos el error de "búsqueda vacía". Sería muy agresivo saludarle con un
  // error en rojo nada más abrir la página.
  //
  // ¿Por qué useRef y no useState? Porque este dato no se pinta en pantalla.
  // Con useState provocaríamos un render extra inútil cada vez que lo tocáramos.
  const hasTyped = useRef(false)

  useEffect(() => {
    if (!hasTyped.current) return
    setError(validateSearch(search))
  }, [search])

  const updateSearch = (newSearch) => {
    hasTyped.current = true
    setSearch(newSearch)
  }

  /**
   * Fuerza la validación aunque el usuario todavía no haya tocado el input.
   * La llamamos al enviar el formulario: si no, pulsar "Buscar" con el campo
   * vacío no mostraría ningún mensaje y parecería que la app está rota.
   * Devuelve true si la búsqueda es válida.
   */
  const validate = () => {
    hasTyped.current = true
    const message = validateSearch(search)
    setError(message)
    return message === null
  }

  /**
   * Deja el input como recién abierta la app: sin texto y sin mensaje.
   * Lo usa el botón "Limpiar" de los resultados. Ojo con `hasTyped`: si no lo
   * bajáramos, vaciar el campo dispararía el error de "búsqueda vacía" y el
   * usuario volvería a la portada con un aviso en rojo sin haber hecho nada.
   */
  const reset = () => {
    hasTyped.current = false
    setSearch('')
    setError(null)
  }

  return { search, updateSearch, validate, reset, error }
}
