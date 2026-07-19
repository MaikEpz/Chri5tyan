# Arquitectura

El proyecto sigue Clean Architecture con una composición explícita en `src/main.jsx`.

## Regla de dependencias

```text
Domain <- Application <- Presentation
   ^             ^             ^
   +-------------+-- Infrastructure
```

- `domain`: entidades, catálogos y reglas puras. No conoce React, Three.js ni el navegador.
- `application`: casos de uso y coordinación de acciones del dominio.
- `presentation`: componentes, hooks y estado de interfaz. Recibe adaptadores mediante propiedades.
- `infrastructure`: Three.js, detección del dispositivo, carga del GLB y demás adaptadores externos.
- `main.jsx`: composition root. Es el único lugar que conecta implementaciones concretas con la aplicación.

Las pruebas de `test/architecture` protegen esta dirección de dependencias.

## Organización por funcionalidad

La aplicación web se divide bajo `presentation/features`:

- `quotes`: cotización y controles de producción.
- `casting`: búsqueda y registro de talento.
- `locations`: búsqueda y registro de locaciones.
- `equipment`: catálogo de alquiler.
- `workspace`: navegación y componentes compartidos del área web.

Cada funcionalidad puede crecer con sus propios componentes, hooks y adaptadores sin modificar el visor 3D.

## Flujo de cotización

1. La vista emite una intención.
2. `useProductionQuote` la convierte en una acción del caso de uso.
3. `productionQuoteReducer` coordina la actualización.
4. Las reglas de `domain/production` validan mínimos y calculan las horas.
5. React renderiza el nuevo estado.

Los precios, persistencia o una API futura deben entrar como puertos/casos de uso; nunca dentro de los componentes.

## Criterios para nuevas funcionalidades

- Una regla de negocio nueva empieza en `domain`.
- Una operación que coordina reglas pertenece a `application`.
- Una integración HTTP, almacenamiento o SDK pertenece a `infrastructure`.
- Un formulario o interacción visual pertenece a `presentation/features`.
- Evitar importar infraestructura desde presentación; inyectar el adaptador desde `main.jsx`.
- Añadir pruebas del dominio antes de conectar una regla nueva a la interfaz.
