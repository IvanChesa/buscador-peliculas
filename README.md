# 🍿 Buscador de películas

Aplicación web de una sola página para buscar películas y series usando la API
pública de [OMDb](https://www.omdbapi.com/). Escribe un título y los resultados
aparecen solos en una cuadrícula responsive, con búsqueda automática mientras
escribes (debounce), paginación, ficha ampliada de cada película, validación del
formulario y estados de carga y error diferenciados.

Proyecto realizado como práctica de React (DAW).

## ✨ Características

- Búsqueda por título contra la API de OMDb.
- **Búsqueda automática con debounce de 300 ms**: no se lanza una petición por
  cada tecla, solo cuando dejas de escribir.
- Envío manual del formulario que convive con la búsqueda automática.
- **Validaciones**: no se permite búsqueda vacía, ni que empiece por espacio, ni
  con menos de 3 caracteres. El mensaje aparece bajo el input sin bloquear el
  formulario.
- **Cuatro estados visuales** diferenciados: inicial, cargando, error de red o de
  API, y "no se han encontrado resultados".
- No se repite dos veces seguidas la misma búsqueda.
- Placeholder para las películas que no tienen póster (`"Poster": "N/A"`).
- **Paginación**: OMDb devuelve los resultados de 10 en 10. El botón «Cargar
  más» va añadiendo páginas a la cuadrícula y un contador indica cuántos
  resultados llevas de cuántos.
- **Ficha ampliada**: al pulsar una película se abre un modal con la sinopsis,
  el director, el reparto, la duración y la nota de IMDb. Está hecho con el
  elemento `<dialog>` nativo, que trae de serie la trampa de foco, el cierre
  con Escape y el fondo oscurecido.
- Se descartan los resultados repetidos entre páginas (OMDb manda a veces el
  mismo `imdbID` en dos páginas distintas).
- Cuadrícula responsive con CSS Grid, tema oscuro, sin frameworks de CSS.
- **Cada visitante usa su propia API key**: la aplicación pide la clave en la
  propia interfaz, la comprueba contra OMDb antes de aceptarla y la guarda en
  el navegador de quien la escribe. Así el buscador funciona para cualquiera
  sin gastar el cupo diario del autor.
- **Tests unitarios con Vitest** de la validación, del mapeo de datos, del
  almacenamiento de la clave y del servicio de OMDb.

## 📸 Capturas

<!-- Haz las capturas, guárdalas en una carpeta /screenshots y descomenta: -->

<!-- ![Estado inicial](./screenshots/inicial.png) -->

_Estado inicial_

<!-- ![Resultados de búsqueda](./screenshots/resultados.png) -->

_Resultados de una búsqueda_

<!-- ![Validación del formulario](./screenshots/validacion.png) -->

_Mensaje de validación_

<!-- ![Vista móvil](./screenshots/movil.png) -->

_Vista en móvil_

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| [React](https://react.dev/) | Interfaz y gestión de estado con hooks |
| [Vite](https://vite.dev/) | Servidor de desarrollo y empaquetado |
| JavaScript (ES Modules) | Sin TypeScript |
| CSS plano | Sin Tailwind ni librerías de componentes |
| [OMDb API](https://www.omdbapi.com/) | Origen de los datos |
| [Oxlint](https://oxc.rs/) | Linter |
| [Vitest](https://vitest.dev/) | Tests unitarios |

**Sin librerías de estado** (nada de Redux ni Zustand) y **sin React Router**:
todo se resuelve con `useState`, `useEffect`, `useRef` y `useCallback`.

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── SearchForm.jsx       # Formulario: input controlado + botón
│   ├── Movies.jsx           # Cuadrícula de películas + tarjeta individual
│   ├── MovieDetails.jsx     # Ficha ampliada en un <dialog> nativo
│   └── ApiKeyForm.jsx       # Sección para introducir tu propia API key
├── hooks/
│   ├── useMovies.js         # Búsqueda y paginación; mapea la respuesta
│   ├── useMovieDetails.js   # Ficha de una película, con caché en memoria
│   ├── useApiKey.js         # Clave activa: guardarla, comprobarla, borrarla
│   └── useSearch.js         # Estado del input y su validación
├── services/
│   ├── movies.js            # ÚNICO sitio donde se hace fetch a OMDb
│   └── apiKey.js            # De dónde sale la clave (navegador o .env.local)
├── App.jsx                  # Une los hooks, el debounce y los estados visuales
├── App.css                  # Estilos de la aplicación
└── index.css                # Reset y variables del tema
```

### Regla de arquitectura

```
Componente  →  Hook  →  Service  →  API
```

Ningún componente hace `fetch` directamente. El componente llama al hook, el
hook llama al service y solo el service habla con OMDb. Además, el hook
**mapea** la respuesta a un objeto propio con las claves en minúscula:

```js
// Lo que devuelve OMDb        ->  Lo que usa nuestra app
{ imdbID, Title, Year, Poster } -> { id, title, year, poster }
```

Así, si algún día se cambia de API, solo hay que tocar `services/movies.js` y la
función de mapeo: los componentes no se enteran.

## 🚀 Instalación

Necesitas [Node.js](https://nodejs.org/) 18 o superior.

```bash
# 1. Clonar el repositorio
git clone https://github.com/IvanChesa/buscador-peliculas.git
cd buscador-peliculas

# 2. Instalar dependencias
npm install
```

## 🔑 La API key

La aplicación necesita una clave de OMDb. Hay **dos formas** de dársela, y la
primera no requiere tocar ningún archivo.

### Opción A — desde la propia aplicación (la que usarán tus visitantes)

Arranca la app y te recibirá una pantalla pidiendo la clave, con el enlace para
conseguirla. La pegas, se comprueba contra OMDb en el momento y, si vale, se
guarda en el `localStorage` de **ese** navegador. No hace falta nada más.

Es la vía pensada para la aplicación publicada: cada persona trae su clave y
gasta su propio cupo de 1000 peticiones diarias, no el tuyo.

Desde el pie de la página se puede **cambiar** o **borrar** la clave guardada.

### Opción B — con un archivo `.env.local` (cómodo para desarrollar)

Para no tener que escribir la clave cada vez que trabajas en el proyecto:

1. Consigue una gratis en <https://www.omdbapi.com/apikey.aspx> (plan **FREE**,
   1000 peticiones al día). Te llegará por correo y tendrás que **activarla**
   pulsando el enlace del email.

2. Crea el archivo `.env.local` en la raíz del proyecto copiando el ejemplo:

   ```bash
   # PowerShell (Windows)
   Copy-Item .env.example .env.local
   ```

   ```bash
   # Bash (macOS / Linux)
   cp .env.example .env.local
   ```

3. Abre `.env.local` y pega tu clave:

   ```
   VITE_OMDB_API_KEY=tu_api_key_aqui
   ```

> ⚠️ **Importante:** el prefijo `VITE_` es obligatorio. Vite solo expone al
> navegador las variables que lo llevan. Y tras crear o modificar `.env.local`
> hay que **reiniciar el servidor de desarrollo** (`Ctrl + C` y `npm run dev`):
> Vite lee las variables al arrancar, no en caliente.

`.env.local` está en el `.gitignore`, así que tu clave nunca se sube al
repositorio.

Si existe `.env.local`, la app arranca ya configurada y no pide nada. La clave
que el usuario escriba a mano **tiene prioridad** sobre la del archivo.

> ⚠️ **Antes de publicar la aplicación, haz el build SIN `.env.local`.**
>
> Vite sustituye `import.meta.env.VITE_OMDB_API_KEY` por su valor literal al
> compilar: si el archivo está presente, **tu clave personal acaba escrita
> dentro del JavaScript que se descarga cualquier visitante**, y te gastarán tu
> cupo. Renombra o borra `.env.local` antes de `npm run build` y deja que sea
> cada persona quien introduzca la suya:
>
> ```bash
> mv .env.local .env.local.bak   # (Windows: Rename-Item .env.local .env.local.bak)
> npm run build
> mv .env.local.bak .env.local
> ```

## ▶️ Ejecutar

```bash
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # build de producción en /dist
npm run preview   # sirve el build de producción para probarlo
npm run lint      # pasa el linter
npm test          # ejecuta los tests una vez
npm run test:watch # los deja en modo vigilancia
```

## 🧪 Tests

```bash
npm test
```

Los tests son de **Vitest** y no tocan la red: `fetch` está simulado, así que se
pueden ejecutar sin API key y sin conexión. Cubren las piezas que no
dependen de la interfaz:

| Archivo | Qué comprueba |
|---|---|
| `useSearch.test.js` | Las reglas de validación del formulario |
| `useMovies.test.js` | El mapeo de OMDb a nuestro formato (incluido `Poster: "N/A"`) |
| `useMovieDetails.test.js` | El mapeo de la ficha y la limpieza de los `"N/A"` |
| `services/movies.test.js` | Paginación, códigos de error de OMDb, fallos de red y HTTP |
| `services/apiKey.test.js` | Guardado de la clave, prioridad de orígenes y `localStorage` no disponible |

Que la validación y los mapeos sean **funciones puras exportadas aparte** es justo
lo que permite probarlos sin renderizar ni un componente.

## 🔒 Nota de seguridad sobre la API key

**En una aplicación 100 % frontend, la API key queda expuesta.**

Aunque la clave esté en un archivo `.env.local` que no se sube a GitHub, Vite la
**sustituye literalmente por su valor** al hacer el build. El resultado es que
la clave acaba escrita en texto plano dentro de los archivos JavaScript que se
descarga el navegador. Cualquiera puede verla abriendo las DevTools, mirando la
pestaña *Network* o leyendo el bundle en `/dist`.

Es decir: **`.env.local` protege la clave de tu repositorio, no de tus
usuarios.**

### Cómo lo resuelve este proyecto

No enviando ninguna clave. Si el build se hace sin `.env.local`, el bundle
publicado **no contiene ningún secreto**: es cada visitante quien introduce su
clave, que se queda en el `localStorage` de su navegador y solo viaja a OMDb.

Esa clave sigue siendo visible para su dueño en las DevTools, claro, pero eso no
es un problema: es suya. Lo que se evita es repartir la tuya entre desconocidos.

### Cuándo esto no basta

Una clave de OMDb es gratuita y limitada a 1000 peticiones diarias, así que
pedírsela al usuario es razonable. Con una clave **de pago**, o cuando no puedes
esperar que el usuario tenga una, no vale: nunca debe llegar al navegador. Ahí
la solución correcta es meter un **backend por delante**:

```
Navegador  →  Tu servidor (guarda la clave)  →  API externa
```

El navegador llama a tu propio servidor, y es ese servidor —donde la variable de
entorno sí es privada— quien añade la clave y llama a la API externa. Se puede
hacer con Node/Express, con serverless functions (Vercel, Netlify) o con el
backend que uses. La regla general: **si una clave llega al navegador, hay que
considerarla pública.**

## 📄 Licencia

Proyecto educativo de uso libre. Los datos de las películas pertenecen a
[OMDb API](https://www.omdbapi.com/).
