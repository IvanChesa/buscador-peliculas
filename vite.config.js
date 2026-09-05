import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vitest reutiliza esta misma configuración: no hace falta un archivo aparte.
  test: {
    // 'node' basta porque solo probamos funciones puras y el servicio (con
    // fetch simulado). No montamos componentes, así que no necesitamos jsdom.
    environment: 'node',
    // El servicio lee la API key al importarse y sin ella lanza un error. Le
    // damos una falsa para los tests: nunca se llega a usar de verdad porque
    // fetch está simulado.
    env: {
      VITE_OMDB_API_KEY: 'test-api-key'
    }
  }
})
