# Elo Ranking — LOLRanking

App personal para el grupo de amigos: ranking de League of Legends (rango vigente) y estadísticas del último mes (kills, daño hecho, daño recibido, visión) sacadas de la API de Riot.

Next.js (App Router) + TypeScript + Prisma/SQLite, todo en un solo proyecto.

## Setup

```bash
npm install
npx prisma migrate dev   # crea la base de datos local (prisma/dev.db)
cp .env.example .env     # completar RIOT_API_KEY
npm run dev
```

Abrí http://localhost:3000

## Configuración (`.env`)

- `RIOT_API_KEY`: sacala en https://developer.riotgames.com/. Las Development Keys duran 24hs, hay que renovarlas seguido.
- `RIOT_PLATFORM`: región de la plataforma (`la2`, `na1`, `euw1`, etc.)
- `DATABASE_URL`: ruta del archivo SQLite local, no hace falta tocarla.

## Jugadores del grupo

Se editan en `src/infrastructure/config/trackedPlayers.ts` (lista de Riot IDs `Nombre#TAG`). No hay alta desde la UI.

## Cómo está armado

Arquitectura en capas (SOLID):

- `src/domain`: entidades e interfaces (`repositories/*`), sin dependencias externas.
- `src/application`: casos de uso, orquestan interfaces de dominio.
- `src/infrastructure`: implementaciones concretas — cliente de la API de Riot (`infrastructure/riot`), persistencia con Prisma (`infrastructure/persistence`), y `container.ts` como único punto donde se cablean las implementaciones.
- `src/ui`: componentes React (presentación).
- `src/app`: rutas de Next.js (`page.tsx`, `api/ranking`, `api/sync`).

## Cómo se calculan las estadísticas

- **Rango vigente** (tier, división, LP, W/L): en vivo en cada carga vía League-V4.
- **Estadísticas de partidas** (kills, daño, visión — ventana móvil de 30 días): se leen de una cache local en SQLite. Para llenarla o traer partidas nuevas, tocá el botón **"Sincronizar partidas"** en la app (dispara `POST /api/sync`). La primera sincronización puede tardar unos minutos por los rate limits de Riot; las siguientes son rápidas porque solo trae partidas nuevas.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npx prisma studio` — explorar la base de datos local

## Encuentros con otros jugadores

El perfil incluye **Encuentros**: jugadores de ambos equipos, incluso si no forman parte del grupo. Muestra total de partidas compartidas, aliados, rivales, primer y último encuentro, con búsqueda por Riot ID o último campeón y filtros por equipo.

La identidad se agrupa por PUUID, por lo que cambiar de nombre no reinicia el conteo. Una clave única por partida, jugador seguido y otro participante evita duplicados. La participación y sus encuentros se guardan en una transacción.

Para actualizar una instalación existente:

```bash
npx prisma generate
npx prisma migrate deploy
```

Luego reiniciá el servidor y tocá **Sincronizar partidas**. Se consultan los últimos 30 días en páginas de 100 y se intenta completar también cada partida ya guardada que todavía no tenga encuentros. Los encuentros persisten indefinidamente en la base local. No se importan automáticamente partidas antiguas que nunca se guardaron; las que Riot ya no ofrece quedan pendientes y se informa la sincronización parcial. La primera actualización puede tardar por los límites de Riot.

## Validación

- `npm test`: agregación, cambios de identidad, separación por equipo, adaptación de Riot, migración/SQLite, idempotencia y paginación con recuperación histórica.
- `npm run test:ui`: prueba de componentes reales con fixtures aislados, usando Edge headless instalado. Comprueba escritorio/móvil, búsquedas, filtros y estados de error; genera capturas en `test-results/`. No consulta Riot ni modifica la base de la aplicación.
- `npm run lint` y `npm run build`: calidad estática y compilación de producción.

La interfaz usa una base oscura con acentos menta y violeta, navegación por secciones y transiciones que respetan `prefers-reduced-motion`.
