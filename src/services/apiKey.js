// ---------------------------------------------------------------------------
// Dónde vive la API key.
//
// Hay DOS orígenes posibles, por este orden:
//   1. La que el usuario haya guardado en el navegador (localStorage).
//   2. La de .env.local, si el proyecto se ejecuta en local con una.
//
// La del usuario gana. Así la aplicación publicada funciona para cualquiera
// que traiga su propia clave, y en desarrollo sigue arrancando sin tener que
// escribir nada.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'buscador-peliculas:omdb-api-key'

// Vite solo expone al navegador las variables que empiezan por VITE_.
// Ojo: si se hace el build con .env.local presente, esta clave queda escrita
// dentro del bundle. Para publicar la app, hacer el build SIN ella.
const ENV_API_KEY = import.meta.env.VITE_OMDB_API_KEY ?? ''

/**
 * localStorage puede LANZAR, no solo devolver null: pasa en modo incógnito de
 * algunos navegadores y cuando el usuario bloquea el almacenamiento del sitio.
 * Por eso cada acceso va envuelto: la app tiene que seguir funcionando aunque
 * no se pueda recordar la clave entre visitas.
 */
export function readStoredApiKey () {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function storeApiKey (key) {
  try {
    localStorage.setItem(STORAGE_KEY, key)
    return true
  } catch {
    return false
  }
}

export function clearStoredApiKey () {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Si no se puede borrar, no hay nada que hacer: seguimos.
  }
}

/** La clave que debe usarse ahora mismo ('' si no hay ninguna). */
export function getApiKey () {
  return readStoredApiKey() || ENV_API_KEY
}

/** ¿Venimos con una clave de .env.local? Sirve para explicarlo en la interfaz. */
export function hasEnvApiKey () {
  return ENV_API_KEY !== ''
}

export { STORAGE_KEY }
