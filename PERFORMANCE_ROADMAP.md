# Plan de optimización para publicación web

Este documento registra el análisis de rendimiento realizado sobre el visor 3D y sirve como guía antes de publicarlo para usuarios de escritorio y dispositivos móviles.

## Estado actual

| Área | Medición actual | Riesgo principal |
| --- | ---: | --- |
| Modelo `Chris.glb` | 69.4 MiB | Descarga inicial lenta |
| Texturas embebidas | 66 imágenes / 99 megapíxeles | Uso elevado de memoria de GPU |
| Memoria estimada de texturas | ~503 MB con mipmaps | Posibles cierres o bajo rendimiento en móviles |
| Geometría | 566,433 triángulos | Carga elevada para dispositivos modestos |
| Primitivas | 165 | Draw calls base antes de sombras |
| Materiales | 71 | Cambios frecuentes de estado de renderizado |
| Luces exportadas | 2 puntuales y 1 direccional | Las sombras puntuales son muy costosas |
| JavaScript de producción | ~1.13 MiB / ~330 KB gzip | Aceptable para este tipo de aplicación |
| Animaciones y esqueletos | Ninguno | La escena estática permite optimizaciones agresivas |

El GLB contiene aproximadamente 56.2 MB de imágenes comprimidas. Al decodificarse como RGBA y generar mipmaps, pueden ocupar alrededor de 503 MB en la GPU. A esto se suman geometría, framebuffers y mapas de sombra.

## Prioridad 1: optimizar texturas

- [ ] Reducir la mayoría de las texturas a 1024×1024 o 512×512.
- [ ] Mantener 2048×2048 únicamente en superficies que se observan de cerca.
- [ ] Reducir la textura de madera de 4000×4000.
- [ ] Reemplazar imágenes de color sólido por colores de material o texturas de 1×1.
- [ ] Convertir las texturas a KTX2/Basis para reducir descarga y memoria de GPU.
- [ ] Empaquetar AO, roughness y metallic en canales de una sola textura cuando sea posible.
- [ ] Revisar si todas las texturas PNG necesitan transparencia; usar formatos más compactos cuando no la necesiten.

Objetivo recomendado:

- GLB final entre 15 y 25 MB.
- Menos de 150 MB de texturas en GPU para la versión móvil.

## Prioridad 2: reducir el costo de sombras

Actualmente todos los meshes proyectan y reciben sombras en `LoadedModel.jsx`. Las dos luces puntuales cálidas pueden producir sombras de 2048×2048. Cada luz puntual necesita seis caras de mapa de sombras, por lo que esta configuración puede consumir cerca de 192 MB adicionales y multiplicar los draw calls.

- [ ] Mantener sombras dinámicas en una sola luz principal.
- [ ] Reducir los mapas de sombra a 512×512 o 1024×1024.
- [ ] Activar `castShadow` solamente en muebles y objetos importantes.
- [ ] Activar `receiveShadow` principalmente en suelo, escritorio, sofá y paredes necesarias.
- [ ] Desactivar la actualización continua de sombras cuando la escena ya esté estable.
- [ ] Evaluar iluminación horneada, AO o lightmaps desde Blender.
- [ ] Crear un perfil móvil sin sombras puntuales dinámicas.

Archivos relacionados:

- `src/infrastructure/react-three/model/LoadedModel.jsx`
- `src/infrastructure/react-three/lights/lightUtils.js`
- `src/infrastructure/react-three/lights/LightRigs.jsx`

## Prioridad 3: simplificar geometría

Los 20 meshes más pesados concentran aproximadamente 440,903 triángulos, cerca del 78% de toda la geometría.

- [ ] Identificar visualmente esos meshes en Blender.
- [ ] Aplicar decimación principalmente a los objetos que superan 10,000 triángulos.
- [ ] Eliminar caras interiores o detalles que nunca aparecen en cámara.
- [ ] Usar instancias para objetos repetidos.
- [ ] Aplicar Meshopt o Draco para reducir el tamaño de descarga.
- [ ] Crear LOD o una versión móvil para objetos secundarios.

Objetivos recomendados:

- Escritorio: 250,000–350,000 triángulos.
- Móvil: menos de 200,000 triángulos.
- Reducir primitivas y draw calls siempre que sea posible sin fusionar objetos con materiales incompatibles.

## Prioridad 4: materiales y caras traseras

El código configura actualmente todos los materiales como `THREE.DoubleSide`. Esto desactiva el descarte de caras traseras y aumenta el trabajo de rasterización y sombras.

- [ ] Usar `THREE.FrontSide` en muebles y objetos cerrados.
- [ ] Reservar `THREE.DoubleSide` para hojas, telas delgadas y planos sin grosor.
- [ ] Revisar materiales con transmisión, sheen, specular e IOR; conservar extensiones solo donde sean visibles.
- [ ] Compartir materiales idénticos para reducir cambios de estado.

Archivo relacionado:

- `src/infrastructure/react-three/model/LoadedModel.jsx`

## Prioridad 5: renderizado bajo demanda

La escena es casi completamente estática, pero el Canvas y `ScrollLookControls` trabajan continuamente.

- [ ] Evaluar `frameloop="demand"` en el Canvas.
- [ ] Solicitar frames mientras la cámara está girando o interpolando.
- [ ] Solicitar frames al abrir, cambiar o cerrar la interfaz del monitor.
- [ ] Detener el renderizado cuando la escena quede inmóvil.
- [ ] Mantener `PerformanceMonitor` y `AdaptiveDpr` como protección para equipos modestos.
- [ ] Definir límites de DPR distintos para móvil y escritorio si las pruebas lo requieren.

Archivos relacionados:

- `src/presentation/components/ViewerPage.jsx`
- `src/infrastructure/react-three/controls/ScrollLookControls.jsx`
- `src/infrastructure/react-three/monitor/MonitorScreen.jsx`

## Prioridad 6: carga progresiva

- [ ] Mostrar una imagen de portada mientras carga la escena.
- [ ] Preparar una versión ligera que aparezca antes del modelo completo.
- [ ] Separar habitación, mobiliario y detalles en recursos independientes si el flujo lo permite.
- [ ] Cargar objetos secundarios después de que la habitación ya sea interactiva.
- [ ] Mostrar errores de carga y un botón para reintentar.
- [ ] Añadir una alternativa estática para navegadores o dispositivos sin WebGL adecuado.

## Preparación para hosting

- [ ] Servir GLB, KTX2, JavaScript y CSS mediante CDN.
- [ ] Configurar caché inmutable y de larga duración para recursos con hash.
- [ ] Verificar el MIME `model/gltf-binary` para archivos GLB.
- [ ] Mantener compresión Brotli o gzip para JavaScript, CSS, HTML y SVG.
- [ ] Probar la aplicación con límites de red móvil antes de publicar.
- [ ] Fijar versiones exactas en `package.json` en lugar de usar `latest`.
- [ ] Registrar una versión de Node compatible para builds reproducibles.
- [ ] Verificar la ruta `base` de Vite si el sitio se publica en un subdirectorio.

## Presupuesto de rendimiento sugerido

| Métrica | Objetivo inicial |
| --- | ---: |
| GLB transferido | ≤ 25 MB |
| JavaScript gzip | ≤ 350 KB |
| Texturas en GPU móvil | ≤ 150 MB |
| Triángulos escritorio | ≤ 350,000 |
| Triángulos móvil | ≤ 200,000 |
| Draw calls visibles | Idealmente ≤ 100–150 |
| FPS escritorio | 60 FPS |
| FPS móvil modesto | ≥ 30 FPS |

## Orden de implementación recomendado

1. Reducir sombras y seleccionar qué objetos proyectan o reciben sombras.
2. Retirar `DoubleSide` global y aplicarlo solamente donde sea necesario.
3. Optimizar texturas y convertirlas a un formato comprimido para GPU.
4. Simplificar los meshes que concentran la mayor cantidad de triángulos.
5. Implementar renderizado bajo demanda.
6. Añadir carga progresiva y perfiles de calidad.
7. Configurar CDN, caché, fallback y pruebas de publicación.

## Validación después de cada fase

- Medir tiempo de descarga y tiempo hasta que la escena sea interactiva.
- Registrar FPS mínimo y promedio durante el movimiento de cámara.
- Revisar memoria de GPU y cierres en dispositivos móviles.
- Revisar draw calls, triángulos y mapas de sombra con herramientas de inspección WebGL.
- Comparar capturas antes y después para evitar pérdidas visuales importantes.
- Ejecutar `npm run build` y comprobar la aplicación de producción.

