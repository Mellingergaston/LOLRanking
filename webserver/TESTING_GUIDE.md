# 🧪 Guía de Prueba - Backend + Frontend Integration

Sigue estos pasos para probar que tu frontend se conecta correctamente al backend Node.js.

---

## ✅ Paso 1: Preparar el Backend

### 1.1 Instalar dependencias (si aún no lo hiciste)

```bash
cd webserver
npm install
```

### 1.2 Crear archivo `.env`

```bash
# En la carpeta webserver/, copia el archivo ejemplo
cp .env.example .env
```

### 1.3 Editar `.env` con tu API Key

Abre `webserver/.env` y pega tu API Key de Riot:

```
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORT=3000
```

### 1.4 Configurar jugadores en `server.js`

Abre `webserver/server.js` y busca la sección `PLAYER_IDS`:

```javascript
const PLAYER_IDS = [
  "Faker#KDA", // Reemplaza con tus amigos
  "Doublelift#NA1",
  "Agurin#LAS",
];

const RIOT_REGION = "la2"; // Tu región
```

---

## ✅ Paso 2: Iniciar el Backend

### En una terminal (cmd, PowerShell, o similar):

```bash
cd webserver
npm start
```

Deberías ver algo como:

```
╔══════════════════════════════════════════════════════════╗
║  🎮 Riot Games League of Legends Proxy Server            ║
║  Región: la2
║  Puerto: 3000
║  Jugadores configurados: 3
║  Estado: ✓ ACTIVO
╚══════════════════════════════════════════════════════════╝

📍 Endpoints disponibles:
   • GET http://localhost:3000/
   • GET http://localhost:3000/api/health
   • GET http://localhost:3000/api/ranking
```

✅ **El servidor está corriendo**

---

## ✅ Paso 3: Verificar Backend (Opcional pero recomendado)

### En una NUEVA terminal (sin cerrar la del servidor):

**Opción A - Con curl:**

```bash
curl http://localhost:3000/api/health
```

Debería responder:

```json
{
  "status": "ok",
  "timestamp": "...",
  "env": {
    "riot_region": "la2",
    "has_api_key": true,
    "players_configured": 3
  }
}
```

**Opción B - En el navegador:**

1. Abre http://localhost:3000/api/health
2. Deberías ver un JSON con el estado

---

## ✅ Paso 4: Verificar Frontend

### 4.1 Abrir `index.html` en el navegador

1. Abre `c:\Users\plixz\Desktop\LolWebApp\index.html`
2. El navegador debería cargar tu página web

### 4.2 Ver la consola del navegador

1. Presiona **F12** para abrir las Developer Tools
2. Ve a la pestaña **Console**
3. Deberías ver logs como:

```
📡 Conectando a: http://localhost:3000/api/ranking
✅ Respuesta del backend: {success: true, ranking: [...]}
✅ 3 jugadores mapeados exitosamente
✅ Se renderizaron 3 jugadores
```

✅ **¡Frontend conectado exitosamente!**

---

## 🐛 Troubleshooting

### ❌ Error: "RIOT_API_KEY no está configurada"

**Solución:**

1. Abre `webserver/.env`
2. Verifica que tenga: `RIOT_API_KEY=RGAPI-xxxx...`
3. NO debe tener espacios extras
4. Reinicia el servidor: Presiona Ctrl+C en la terminal y `npm start` nuevamente

### ❌ Error: "No se pudo conectar al backend"

**Solución:**

1. Verifica que el servidor esté corriendo (`npm start` en la carpeta webserver)
2. Verifica que esté en el puerto 3000 (debería decirlo en la terminal)
3. Abre http://localhost:3000/ en el navegador - debería ver JSON
4. Revisa que el frontend tenga `http://localhost:3000/api/ranking` en app.js:
   ```javascript
   const CONFIG = {
       API_ENDPOINT: 'http://localhost:3000/api/ranking',
       ...
   };
   ```

### ❌ Error: "Respuesta inválida del servidor"

**Solución:**

1. Verifica que los PLAYER_IDS en server.js estén en formato correcto: `Nombre#TAG`
2. Abre http://localhost:3000/api/ranking en el navegador
3. El JSON debe tener: `"success": true` y `"ranking": [...]`

### ❌ Error: "Jugador no encontrado (404)"

**Solución:**

1. El Riot ID es incorrecto
2. Ve a https://www.op.gg/ y busca el jugador
3. Copia el Riot ID exacto (Nombre#TAG)
4. Actualiza PLAYER_IDS en server.js
5. Reinicia el servidor

### ❌ Error: "Rate limit excedido"

**Solución:**

1. La API de desarrollo tiene límites bajos
2. Espera unos minutos
3. O solicita una API Key production en el developer portal

### ❌ Firefox/Safari muestra CORS error

**Solución:**

1. Verifica que esté usando `http://` (no `https://`)
2. CORS solo está permitido desde `http://localhost`
3. Si abres el HTML desde una ruta local (file://), necesitas un servidor local

---

## 📡 Flujo Completo de la Aplicación

```
1. Usuario abre index.html
   ↓
2. app.js se carga y llama initializeApp()
   ↓
3. fetchRanking() hace petición fetch a http://localhost:3000/api/ranking
   ↓
4. Backend Node.js:
   - Lee PLAYER_IDS
   - Para cada jugador: Account-V1 → Summoner-V4 → League-V4
   - Consolida datos (tier, rank, LP, W/L, winrate)
   - Devuelve JSON ordenado por Elo
   ↓
5. Frontend mapper convierte datos del backend al formato de la app
   ↓
6. renderPlayers() muestra la tabla en el DOM
   ↓
7. ✅ ¡Ranking visible en la página!
```

---

## 🔄 Actualizar Datos

### Opción 1 - Recargar página

Presiona `F5` en el navegador (ejecuta fetchRanking nuevamente)

### Opción 2 - Consola del navegador

Abre F12 → Console y escribe:

```javascript
reloadRanking();
```

---

## 📊 Datos que recibirá tu Frontend

Cada jugador tendrá esta información (después del mapping):

```javascript
{
  id: "Faker#KDA",                    // Riot ID original
  nombre: "Faker",                    // Nombre in-game
  rango: "DIAMOND II",                // Tier + Rank
  elo: 2375,                          // ELO calculado
  lp: 75,                             // League Points
  winrate: 56.09,                     // Porcentaje
  riotId: "Faker#KDA",                // (Datos extras del backend)
  wins: 125,
  losses: 98,
  tier: "DIAMOND"
}
```

---

## ✨ Próximos Pasos

Una vez que todo funciona:

1. **Personalizar jugadores:**
   - Ve a `webserver/server.js`
   - Actualiza `PLAYER_IDS` con tus amigos reales
   - Restart el servidor

2. **Cambiar región (si no es LAS):**
   - En `server.js`, cambia `const RIOT_REGION = 'la2'` a otra región
   - Reinicia el servidor

3. **Mejorar el frontend:**
   - Agregar botón de "Actualizar"
   - Agregar filtros por tier
   - Usar gráficos para visualizar progreso
   - Agregar notificaciones de cambios

---

## 💡 Tips Útiles

**Logs útiles en la terminal del servidor:**

```
[2026-03-26T...] GET /api/ranking
Procesando: Faker#KDA...
  ✓ PUUID obtenido: xxx
  ✓ Info del invocador obtenida
  ✓ Ranking obtenido
✅ Ranking completado: 3 exitosos, 0 con error
```

**Si algo se congela:**

1. Presiona Ctrl+C en la terminal del servidor
2. Escribe `npm start` nuevamente
3. Recarga la página del navegador (F5)

---

¡Inténtalo ahora y avísame si tienes problemas! 🚀
