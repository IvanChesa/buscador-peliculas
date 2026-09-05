import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredApiKey,
  getApiKey,
  hasEnvApiKey,
  readStoredApiKey,
  storeApiKey
} from './apiKey'

// En el entorno 'node' de Vitest no existe localStorage, así que lo fabricamos.
function fakeStorage (initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  }
}

/** localStorage que revienta: modo incógnito, almacenamiento bloqueado... */
function explodingStorage () {
  const boom = () => { throw new Error('SecurityError') }
  return { getItem: boom, setItem: boom, removeItem: boom }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('almacenamiento de la API key', () => {
  it('guarda y recupera la clave', () => {
    vi.stubGlobal('localStorage', fakeStorage())

    expect(storeApiKey('mi-clave')).toBe(true)
    expect(readStoredApiKey()).toBe('mi-clave')
  })

  it('borra la clave guardada', () => {
    vi.stubGlobal('localStorage', fakeStorage())

    storeApiKey('mi-clave')
    clearStoredApiKey()
    expect(readStoredApiKey()).toBe('')
  })

  it('devuelve cadena vacía si no hay nada guardado', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(readStoredApiKey()).toBe('')
  })
})

describe('cuando localStorage no está disponible', () => {
  // Esto es lo que pasa de verdad en modo incógnito de algunos navegadores:
  // localStorage EXISTE pero lanza al tocarlo. La app tiene que aguantarlo.
  it('leer no revienta, devuelve cadena vacía', () => {
    vi.stubGlobal('localStorage', explodingStorage())
    expect(() => readStoredApiKey()).not.toThrow()
    expect(readStoredApiKey()).toBe('')
  })

  it('guardar no revienta, devuelve false', () => {
    vi.stubGlobal('localStorage', explodingStorage())
    expect(storeApiKey('x')).toBe(false)
  })

  it('borrar no revienta', () => {
    vi.stubGlobal('localStorage', explodingStorage())
    expect(() => clearStoredApiKey()).not.toThrow()
  })
})

describe('getApiKey (prioridad de orígenes)', () => {
  // La de .env.local la pone vite.config.js para los tests: 'test-api-key'.
  it('usa la de .env.local si el usuario no ha guardado ninguna', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    expect(getApiKey()).toBe('test-api-key')
  })

  it('la clave del usuario GANA sobre la de .env.local', () => {
    vi.stubGlobal('localStorage', fakeStorage())
    storeApiKey('la-del-usuario')
    expect(getApiKey()).toBe('la-del-usuario')
  })

  it('sabe si el proyecto trae clave de entorno', () => {
    expect(hasEnvApiKey()).toBe(true)
  })
})
