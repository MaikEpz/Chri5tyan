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

## Backend e integración

El backend vive en la carpeta hermana `Proyecto Chris - Backend`. Para trabajar
con ambos proyectos:

1. Inicia PostgreSQL y el backend en `http://localhost:8080`.
2. Copia `.env.example` a `.env` si necesitas cambiar la URL de la API.
3. Inicia este frontend con `npm run dev`.

La variable `VITE_API_BASE_URL` define el origen del backend. Si queda vacía, la
aplicación activa automáticamente el modo de demostración sin solicitudes de
red. Para conectar el backend local usa `VITE_API_BASE_URL=http://localhost:8080`;
el backend debe permitir el origen exacto de Vite mediante `CORS_ALLOWED_ORIGINS`.

En el modo de demostración el administrador puede iniciar sesión con el usuario
`admin` y la contraseña `admin`. Los catálogos, la moderación y las operaciones
administrativas usan datos temporales en memoria que se reinician al recargar.

Casting, locaciones y equipos se consultan desde la API. Si el backend no está
disponible, la interfaz conserva los registros de ejemplo incluidos en el
frontend. El registro de usuarios, los formularios con imágenes y las
solicitudes cinematográficas requieren autenticación. Las cotizaciones y su
PDF continúan funcionando localmente y no se guardan en el backend.

## Verificación de correo

El registro crea una cuenta pendiente y muestra una vista de espera con
reenvío limitado a una vez por minuto. El correo abre
`/#/verify-email?token=...`; la aplicación retira inmediatamente el token del
historial y muestra una página dedicada con los estados verificado, vencido,
reemplazado, inválido o error de red. Verificar no inicia sesión: al finalizar,
el usuario vuelve al diálogo de acceso con su correo recordado solamente en
`sessionStorage`.

El backend conserva los envíos en una cola durable y reintenta Gmail ante
fallos temporales. Para que los enlaces apunten al frontend correcto,
`FRONTEND_URL` debe coincidir con la URL pública de esta aplicación.

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
- `src/application`: casos de uso y servicios especializados; los catálogos separan lectura pública, envíos, administración, moderación, mappers y fallback.
- `src/infrastructure`: adaptadores externos. HTTP se divide por capacidad y React Three separa escena, monitor, geometría, overlays y renderizado Canvas.
- `src/presentation`: features independientes que reutilizan componentes de `components/admin`, `components/catalog`, `components/forms`, `components/layout` y `components/ui`.

Las pruebas de arquitectura validan la dirección de las dependencias y evitan
imports entre features hermanos, salvo desde el compositor del workspace.

## Sistema visual

La interfaz utiliza Tailwind CSS v4 mediante su plugin oficial de Vite. Los
tokens de marca y las utilidades base viven en `src/presentation/tailwind.css`,
y los componentes reutilizables (`Button`, `Dialog`, `TextField` y controles
segmentados) se encuentran en `src/presentation/components/ui`.

`src/presentation/styles.css` conserva únicamente el orden de importación de
las hojas especializadas de `src/presentation/styles`: visor, workspace,
catálogo/media y portafolio/administración. Las pantallas nuevas deben preferir
los tokens y primitivas compartidas antes de agregar selectores globales nuevos.

El archivo `Chris.glb` se carga desde la raiz del proyecto y Vite lo copia automaticamente al compilar.
