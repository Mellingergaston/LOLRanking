# 🎮 League of Legends Proxy Server

Servidor Node.js/Express que actúa como proxy seguro entre tu frontend y la API de Riot Games.

## ⚡ Inicio Rápido

### 1. Instalación de dependencias

```bash
npm install
```

### 2. Configurar API Key

1. Ve a [Riot Developer Portal](https://developer.riotgames.com/)
2. Registrate o inicia sesión
3. Crea una nueva API Key
4. Copia el archivo `.env.example` a `.env` en el mismo directorio
5. Pega tu API Key en el archivo `.env`:

```bash
# Copia el archivo ejemplo
cp .env.example .env

# Edita .env y pega tu API Key
# RIOT_API_KEY=RGAPI-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Configurar jugadores

Abre `server.js` y busca la sección `PLAYER_IDS`:

```javascript
const PLAYER_IDS = [
  "Nombre#TAG", // Reemplaza con tu Riot ID
  "OtraPersona#NA1",
  "JugadorLAS#LAS",
];
```

También configura la región si no es `la2`:

```javascript
const RIOT_REGION = "la2"; // Cambia según tu región
```

**Regiones disponibles:**

- `la2` - LAS (Latin America South)
- `na1` - NA (North America)
- `euw1` - EUW (Europe West)
- `kr` - KR (Korea)
- `br1` - BR (Brazil)
- Más regiones en la documentación oficial

### 4. Iniciar servidor

```bash
npm start
# o si tienes nodemon instalado:
# nodemon
```

El servidor estará en `http://localhost:3000`

---

## 📍 Endpoints Disponibles

### GET `/`

Información general del servidor.

**Respuesta:**

```json
{
  "message": "Riot Games League of Legends Proxy Server",
  "endpoints": { ... }
}
```

### GET `/api/health`

Verifica el estado del servidor.

**Respuesta:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "env": {
    "riot_region": "la2",
    "has_api_key": true,
    "players_configured": 3
  }
}
```

### GET `/api/ranking`

**Principal endpoint** - Obtiene el ranking de todos los jugadores configurados, ordenado de mayor a menor Elo.

**Respuesta exitosa:**

```json
{
  "success": true,
  "timestamp": "2026-03-26T...",
  "region": "la2",
  "total": 3,
  "successCount": 3,
  "errorCount": 0,
  "ranking": [
    {
      "riotId": "Nombre#TAG",
      "summoner": "NombreIngame",
      "puuid": "...",
      "tier": "DIAMOND",
      "rank": "II",
      "lp": 75,
      "wins": 125,
      "losses": 98,
      "winRate": 56.09,
      "error": null
    },
    ...
  ]
}
```

---

## 🔒 Seguridad

✅ **Implementado:**

- ✓ API Key en archivo `.env` (nunca en código)
- ✓ CORS configurado solo para `http://localhost`
- ✓ `.env` en `.gitignore` (no se sube a Git)
- ✓ Manejo robusto de errores
- ✓ Respuestas HTTP seguras

⚠️ **Importante:**

- Nunca compartas tu `RIOT_API_KEY`
- Nunca subas el archivo `.env` a Git
- Nunca hagas hardcode de la API Key en el código

---

## 🚀 Estructura del Código

El servidor sigue este flujo para cada jugador:

```
1. Account-V1: Nombre#TAG → PUUID
   ↓
2. Summoner-V4: PUUID → ID del Invocador
   ↓
3. League-V4: ID Invocador → Ranking (Tier, Rank, LP, W/L)
   ↓
4. Calcular Winrate y consolidar datos
```

**Características:**

- Llamadas **secuenciales** para evitar rate limit
- **Reintentos automáticos** si hay timeout o rate limit
- **Manejo de errores** por cada paso
- **Pausas entre llamadas** para respetar límites de la API
- **Ordenamiento por Elo** (descendente)

---

## 🛠️ Configuración Avanzada

### Cambiar región

```javascript
const RIOT_REGION = "na1"; // Cambiar aquí
```

### Ajustar timeouts

```javascript
const API_TIMEOUT = 5000; // 5 segundos
const MAX_RETRIES = 2; // Reintentos
const RETRY_DELAY = 500; // 500ms entre reintentos
```

### Cambiar puerto

Opción 1 - Variable de entorno:

```bash
PORT=5000 npm start
```

Opción 2 - Archivo `.env`:

```
PORT=5000
```

---

## 🐛 Troubleshooting

### "RIOT_API_KEY no está configurada"

- ✓ Copia `.env.example` a `.env`
- ✓ Pega tu API Key en `.env`
- ✓ Reinicia el servidor

### "Jugador no encontrado (404)"

- ✓ Verifica que el Riot ID tenga el formato correcto: `Nombre#TAG`
- ✓ Usa el Riot ID actual del jugador (pueden cambiar)
- ✓ Verifica que el jugador exista en esa región

### "Rate limit excedido"

- Espera unos minutos (la API de Dev tiene límites bajos)
- O solicita una API Key con límites más altos en el Dev Portal

### "Error: 403 - API Key inválida"

- ✓ Verifica que copiastes la API Key correctamente
- ✓ La key no tiene espacios extra al inicio/final
- ✓ La key no ha expirado

### "CORS error en frontend"

- ✓ Verifica que el frontend esté en `http://localhost`
- ✓ Verifica que el servidor esté corriendo en `http://localhost:3000`
- ✓ El frontend debe hacer peticiones a `http://localhost:3000/api/ranking`

---

## 📝 Formato de Riot ID

Siempre necesitas el formato: `Nombre#TAG`

Ejemplos válidos:

- `Faker#KDA`
- `Doublelift#NA1`
- `Perkz#EUW`
- `Agurin#LAS`

Obtén el Riot ID correcto:

1. Ve a [OP.GG](https://www.op.gg/)
2. Busca el jugador
3. En su perfil verás el Riot ID completo (Nombre#TAG)

---

## 📦 Dependencias

- **express** ^5.2.1 - Framework web
- **cors** ^2.8.6 - Manejo de CORS
- **dotenv** ^17.3.1 - Variables de entorno
- **axios** ^1.13.6 - Cliente HTTP

---

## 📚 Referencias

- [Riot Games Developer Portal](https://developer.riotgames.com/)
- [Riot Games API Docs](https://developer.riotgames.com/apis)
- [League of Legends API Reference](https://developer.riotgames.com/apis#lol)

---

## 🎯 Próximos Pasos

1. ✓ Configurar `.env` con tu API Key
2. ✓ Actualizar `PLAYER_IDS` con tus amigos
3. ✓ Ejecutar `npm start`
4. ✓ Llamar a `http://localhost:3000/api/ranking`
5. ✓ Integrar con tu frontend

---

## 📄 Licencia

MIT
