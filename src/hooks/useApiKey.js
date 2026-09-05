import { useCallback, useState } from 'react'
import {
  clearStoredApiKey,
  getApiKey,
  hasEnvApiKey,
  readStoredApiKey,
  storeApiKey
} from '../services/apiKey'
import { verifyApiKey } from '../services/movies'

/**
 * Gestiona la API key que usa la aplicación: cuál está activa, guardarla,
 * comprobarla y borrarla.
 */
export function useApiKey () {
  // useState con FUNCIÓN (no getApiKey()): así solo se lee el localStorage en
  // el primer render, y no en cada uno.
  const [apiKey, setApiKey] = useState(getApiKey)
  const [isUserKey, setIsUserKey] = useState(() => readStoredApiKey() !== '')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Comprueba la clave contra OMDb y, SOLO si vale, la guarda.
   *
   * Guardar primero y preguntar después sería peor: el usuario se quedaría con
   * una clave mala guardada y vería fallar todas las búsquedas sin entender
   * por qué.
   *
   * @returns {Promise<boolean>} true si se ha guardado.
   */
  const save = useCallback(async (rawKey) => {
    const key = rawKey.trim()

    if (key === '') {
      setError('Escribe tu API key.')
      return false
    }

    setChecking(true)
    setError(null)

    try {
      await verifyApiKey({ key })
    } catch (e) {
      setError(e.message)
      setChecking(false)
      return false
    }

    storeApiKey(key)
    setApiKey(key)
    setIsUserKey(true)
    setChecking(false)
    return true
  }, [])

  /** Olvida la clave del usuario y vuelve a la de .env.local, si la hubiera. */
  const clear = useCallback(() => {
    clearStoredApiKey()
    setApiKey(getApiKey())
    setIsUserKey(false)
    setError(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    apiKey,
    hasApiKey: apiKey !== '',
    // Distingue "la ha escrito el usuario" de "viene del .env.local del
    // proyecto": la interfaz lo explica de forma distinta en cada caso.
    isUserKey,
    hasEnvKey: hasEnvApiKey(),
    checking,
    error,
    save,
    clear,
    clearError
  }
}
