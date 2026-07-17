# Chris Three.js Viewer

Visor web para cargar `Chris.glb` con React, Three.js, React Three Fiber y drei usando una estructura inspirada en Clean Architecture.

## Rendimiento y publicación

El diagnóstico, los objetivos y la lista de cambios pendientes para preparar el proyecto para la web están documentados en [`PERFORMANCE_ROADMAP.md`](./PERFORMANCE_ROADMAP.md).

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:5173/`.

## Navegacion

- La camara permanece fija en la habitacion.
- Lleva el mouse hacia el borde izquierdo o derecho del visor para girar la vista.
- El giro horizontal esta limitado a 5 grados hacia cada lado desde la vista inicial.
- Lleva el mouse hacia el borde superior o inferior para inclinar la vista.
- La inclinacion vertical esta limitada a 5 grados hacia arriba y abajo.
- Mantener el mouse cerca del centro detiene el giro.

## Publicar en Railway

Railway puede usar los comandos definidos en `package.json`:

```bash
npm ci
npm run build
npm start
```

El servidor escucha el puerto proporcionado por Railway mediante la variable `PORT`.

## Publicar en GitHub Pages

El repositorio incluye `.github/workflows/deploy-pages.yml`. Cada `push` a la rama
`main` compila el proyecto y publica `dist` automáticamente.

Después de subir el repositorio, abre **Settings → Pages** en GitHub y selecciona
**GitHub Actions** como origen de publicación. La primera publicación aparecerá en
la pestaña **Actions**.

## Estructura

- `src/domain`: entidades del dominio, como `ModelAsset`.
- `src/application`: casos de uso, como el modelo que debe presentar el visor.
- `src/infrastructure`: adaptadores de React Three Fiber, carga GLB, escena, luces y controles.
- `src/presentation`: componentes React de pantalla y estilos.

El archivo `Chris.glb` se carga desde la raiz del proyecto y Vite lo copia automaticamente al compilar.
