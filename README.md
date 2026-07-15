# Fac Fit 🏋️

App de rutinas de gimnasio, sin login, pensada para instalarse en tu iPhone
como si fuera una app nativa (PWA - Progressive Web App).

## ¿Cómo la subo a internet? (una sola vez)

Necesitás un lugar gratis donde "vivan" estos archivos con una URL propia.
La forma más simple para vos, sin saber programar:

### Opción recomendada: GitHub Pages

1. Entrá a https://github.com y create una cuenta gratis (si no tenés).
2. Arriba a la derecha, tocá el **+** → **New repository**.
3. Nombre del repositorio: `facu-fitness` (o el que quieras). Dejalo en **Public**. Creá el repositorio.
4. Adentro del repositorio, tocá **Add file → Upload files**.
5. Arrastrá **todos** los archivos y carpetas de esta entrega (`index.html`, `style.css`,
   `app.js`, `exercises.js`, `manifest.json`, `sw.js`, la carpeta `icons/` y la carpeta `images/`)
   manteniendo la misma estructura de carpetas. Confirmá el commit ("Commit changes").
6. Andá a **Settings** (del repositorio) → **Pages** (menú izquierdo).
7. En "Branch" elegí `main` y carpeta `/ (root)` → **Save**.
8. Esperá 1-2 minutos. GitHub te va a dar una URL tipo:
   `https://tu-usuario.github.io/facu-fitness/`

Esa es la dirección de tu app. Andá abriéndola desde el iPhone (Safari) para instalarla (paso siguiente).

### Alternativa aún más rápida: Netlify Drop

1. Entrá a https://app.netlify.com/drop desde la computadora.
2. Arrastrá la carpeta completa `facu-fitness` a la página.
3. En segundos te da una URL pública (`https://algo-random.netlify.app`). Ya está.

## ¿Cómo la instalo en mi iPhone? (sin App Store)

1. Abrí **Safari** en el iPhone (tiene que ser Safari, no Chrome) y entrá a la URL de tu app.
2. Tocá el ícono de **Compartir** (el cuadradito con la flecha hacia arriba).
3. Deslizá y elegí **"Agregar a pantalla de inicio"**.
4. Confirmá el nombre (Fac Fit) y tocá **Agregar**.

Va a aparecer un ícono más en tu pantalla de inicio, como cualquier app. Al abrirlo,
ocupa toda la pantalla (sin la barra de Safari) y funciona incluso sin internet
una vez que la abriste la primera vez (queda guardada en el teléfono).

## ¿Por qué así y no una app "de verdad" en la App Store?

Publicar en la App Store requiere una cuenta de **Apple Developer** (paga, ~99 USD/año),
una Mac con Xcode, y pasar la revisión de Apple — mucho para una app personal.
Una PWA (esto que armamos) te da el mismo resultado en el uso diario: ícono propio,
pantalla completa, funciona offline, no necesita login — sin nada de eso.

Si en algún momento querés dar el salto a una app nativa real (para vender en la
App Store, por ejemplo), se puede reconvertir este mismo proyecto más adelante.

## ¿Qué necesito para seguir editando esto con Claude?

Nada especial. La próxima vez que quieras cambiar algo (agregar ejercicios,
cambiar colores, agregar una función nueva), volvé a este chat o abrí uno nuevo,
contame qué querés cambiar, y yo actualizo los archivos. Después repetís el paso
de "Upload files" en GitHub (o arrastrás de nuevo a Netlify) para que se actualice
la versión online.

## Estructura del proyecto

```
facu-fitness/
├── index.html          → pantallas de la app (splash, onboarding, inicio, etc.)
├── style.css            → estilos (blanco / gris / rojo)
├── app.js                → lógica: rutinas, calendario, asistencias, métricas
├── exercises.js          → base de datos de ejercicios + imágenes + tips
├── manifest.json         → configuración de instalación como app
├── sw.js                 → service worker (funcionamiento offline)
├── icons/                → ícono de la app en varios tamaños
└── images/exercises/     → pictogramas de cada ejercicio
```

## Nota sobre los datos

Todo lo que cargás (nombre, peso, días, asistencias) se guarda **solo en tu
teléfono** (localStorage del navegador). No hay servidor, no hay backend, no se
manda nada a ningún lado. Si borrás la app o los datos de Safari, se pierde el
historial — más adelante podemos agregar un botón de "exportar copia de seguridad"
si te sirve.
