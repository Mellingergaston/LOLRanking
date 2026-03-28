require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS - Permite peticiones desde el frontend local
const corsOptions = {
  origin: ['http://localhost', 'null'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Región de Riot Games (ej: la2, na1, euw1, kr)
const RIOT_REGION = 'la2';

// Array de Riot IDs a trackear - ACTUALIZA AQUÍ CON TUS AMIGOS
const PLAYER_IDS = [
  'ElNiñøLacoste#coco',           
  'breakneck#3766',      
  '456#real',
  'ellbertoo#6831',
  'ElOrgulloPeleda#LAS', 
  'ElRayoLautySappe#RAYO',
  'Jig#jajs',     
  'METESACA#TONKA',
  'PlayMaker#2536',
  'I mit0 I#LAS',
];

// Configuración de la API de Riot
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_API_BASE = 'https://' + RIOT_REGION + '.api.riotgames.com';
const ACCOUNT_API_BASE = 'https://americas.api.riotgames.com'; // Account-V1 usa servidor regional diferente

// Timeout y reintentos
const API_TIMEOUT = 5000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 500; // ms

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors(corsOptions));
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Realiza llamadas a la API de Riot con reintentos
 * @param {string} endpoint - URL del endpoint
 * @param {number} retries - Intentos restantes
 * @returns {Promise<Object>} Respuesta de la API
 */
/**
 * Realiza llamadas a la API de Riot con reintentos
 */
async function callRiotAPI(endpoint, retries = MAX_RETRIES) {
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        // Agregamos headers de navegador real para evitar bloqueos del Firewall
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      timeout: API_TIMEOUT,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (response.status === 429) {
      if (retries > 0) {
        await sleep(RETRY_DELAY);
        return callRiotAPI(endpoint, retries - 1);
      }
      throw new Error('Rate limit excedido después de reintentos');
    }

    if (response.status >= 400) {
      // AQUÍ ESTÁ LA MAGIA: Extraemos el error real que escupe Riot
      const riotMessage = response.data?.status?.message || JSON.stringify(response.data) || response.statusText;
      throw new Error(`[Riot Error ${response.status}]: ${riotMessage}`);
    }

    return response.data;
  } catch (error) {
    if (retries > 0 && error.code === 'ECONNABORTED') {
      await sleep(RETRY_DELAY);
      return callRiotAPI(endpoint, retries - 1);
    }
    throw error;
  }
}

/**
 * Helper para dormir (async delay)
 * @param {number} ms - Milisegundos
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene el PUUID de un jugador usando Account-V1
 * @param {string} gameName - Nombre del jugador
 * @param {string} tagLine - Tag/etiqueta del jugador
 * @returns {Promise<string>} PUUID del jugador
 */
async function getPlayerPUUID(gameName, tagLine) {
  try {
    const endpoint = `${ACCOUNT_API_BASE}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
    const data = await callRiotAPI(endpoint);
    return data.puuid;
  } catch (error) {
    throw new Error(`No se pudo obtener PUUID para ${gameName}#${tagLine}: ${error.message}`);
  }
}

/**
 * Obtiene información del invocador usando Summoner-V4
 * @param {string} puuid - PUUID del jugador
 * @returns {Promise<Object>} Datos del invocador
 */
async function getSummonerInfo(puuid) {
  try {
    const endpoint = `${RIOT_API_BASE}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
    const data = await callRiotAPI(endpoint);
    return data;
  } catch (error) {
    throw new Error(`No se pudo obtener info del invocador: ${error.message}`);
  }
}

/**
 * Obtiene ranking del invocador usando League-V4
 * @param {string} summonerId - ID del invocador
 * @returns {Promise<Object>} Datos de ranking
 */
/**
 * Obtiene ranking del invocador usando League-V4
 */
/**
 * Obtiene ranking del invocador usando League-V4 (Versión moderna con PUUID)
 */
async function getPlayerRanking(puuid) {
  try {
    // Ya no usamos encodeURIComponent porque el PUUID tiene un formato seguro para URLs
    const endpoint = `${RIOT_API_BASE}/lol/league/v4/entries/by-puuid/${puuid}`;
    
    const data = await callRiotAPI(endpoint);
    
    if (!Array.isArray(data)) {
        return null;
    }

    const soloRank = data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
    return soloRank || null;
    
  } catch (error) {
    throw new Error(`Falló League-V4: ${error.message}`);
  }
}

/**
 * Calcula el winrate en porcentaje
 * @param {number} wins - Victorias
 * @param {number} losses - Derrotas
 * @returns {number} Winrate en porcentaje
 */
function calculateWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) return 0;
  return (wins / total * 100).toFixed(2);
}

/**
 * Obtiene toda la información consolidada de un jugador
 * @param {string} riotId - Riot ID en formato "Nombre#TAG"
 * @returns {Promise<Object>} Datos consolidados del jugador
 */
async function getPlayerData(riotId) {
  try {
    // Validar formato
    if (!riotId.includes('#')) {
      throw new Error('Formato inválido. Debe ser: Nombre#TAG');
    }

    const [gameName, tagLine] = riotId.split('#');

    console.log(`Procesando: ${gameName}#${tagLine}...`);

    // 1. Obtener PUUID - Account-V1
    const puuid = await getPlayerPUUID(gameName, tagLine);
    console.log(`  ✓ PUUID obtenido: ${puuid}`);

    // Pequeña pausa entre llamadas para no saturar
    await sleep(100);

    // 2. Obtener información del invocador - Summoner-V4
    const summonerInfo = await getSummonerInfo(puuid);
    console.log(`  ✓ Info del invocador obtenida`);

   // 3. Obtener ranking - League-V4 (Actualizado)
    const rankingInfo = await getPlayerRanking(puuid);
    console.log(`  ✓ Ranking obtenido`);

    // Si no tiene ranking, asignar valores por defecto
    if (!rankingInfo) {
      console.log(`  ⚠ Jugador sin ranking (unranked)`);
      return {
        riotId: riotId,
        summoner: summonerInfo.name,
        puuid: puuid,
        rank: 'UNRANKED',
        lp: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        tier: null,
        error: null
      };
    }

    // Construir respuesta consolidada
    const winRate = calculateWinRate(rankingInfo.wins, rankingInfo.losses);

    return {
      riotId: riotId,
      summoner: summonerInfo.name,
      puuid: puuid,
      tier: rankingInfo.tier,
      rank: rankingInfo.rank,
      lp: rankingInfo.leaguePoints,
      wins: rankingInfo.wins,
      losses: rankingInfo.losses,
      winRate: parseFloat(winRate),
      error: null
    };
  } catch (error) {
    console.error(`  ✗ Error procesando ${riotId}: ${error.message}`);
    return {
      riotId: riotId,
      error: error.message,
      summoner: null,
      tier: null,
      rank: null,
      lp: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    };
  }
}

/**
 * Convierte tier + rank a valor numérico para ordenar
 * @param {string} tier - Tier (IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
 * @param {string} rank - Rank (I, II, III, IV)
 * @returns {number} Valor numérico para ordenamiento
 */
function getTierValue(tier, rank) {
  const tierValues = {
    'CHALLENGER': 2700,
    'GRANDMASTER': 2600,
    'MASTER': 2500,
    'DIAMOND': 2000,
    'PLATINUM': 1500,
    'GOLD': 1000,
    'SILVER': 500,
    'BRONZE': 200,
    'IRON': 100,
    'UNRANKED': 0
  };

  const rankValues = {
    'I': 300,
    'II': 200,
    'III': 100,
    'IV': 0
  };

  const baseValue = tierValues[tier] || 0;
  const rankBonus = rankValues[rank] || 0;

  return baseValue + rankBonus;
}

// ============================================================================
// RUTAS / ENDPOINTS
// ============================================================================

/**
 * GET /api/ranking
 * Retorna el ranking de todos los jugadores ordenados por Elo (mayor a menor)
 */
app.get('/api/ranking', async (req, res) => {
  try {
    console.log('\n========================================');
    console.log('Iniciando obtención de ranking...');
    console.log('========================================');

    // Procesar cada jugador secuencialmente
    const results = [];
    for (const riotId of PLAYER_IDS) {
      try {
        const playerData = await getPlayerData(riotId);
        results.push(playerData);
      } catch (error) {
        console.error(`Error fatal procesando ${riotId}:`, error);
        results.push({
          riotId: riotId,
          error: 'Error no controlado: ' + error.message,
          summoner: null
        });
      }

      // Pausa entre jugadores para evitar rate limit
      await sleep(200);
    }

    // Separar jugadores con error de los exitosos
    const successfulPlayers = results.filter(p => !p.error);
    const failedPlayers = results.filter(p => p.error);

    // Ordenar por tier + lp (mayor a menor)
    successfulPlayers.sort((a, b) => {
      const aValue = getTierValue(a.tier, a.rank) + a.lp;
      const bValue = getTierValue(b.tier, b.rank) + b.lp;
      return bValue - aValue;
    });

    // Combinar: primero exitosos, luego con error
    const orderedResults = [...successfulPlayers, ...failedPlayers];

    console.log('\n========================================');
    console.log(`Ranking completado: ${successfulPlayers.length} exitosos, ${failedPlayers.length} con error`);
    console.log('========================================\n');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      region: RIOT_REGION,
      total: results.length,
      successCount: successfulPlayers.length,
      errorCount: failedPlayers.length,
      ranking: orderedResults
    });
  } catch (error) {
    console.error('Error en endpoint /api/ranking:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ranking: ' + error.message
    });
  }
});

/**
 * GET /api/health
 * Endpoint para verificar que el servidor está funcionando
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      riot_region: RIOT_REGION,
      has_api_key: !!RIOT_API_KEY,
      players_configured: PLAYER_IDS.length
    }
  });
});

/**
 * GET /
 * Ruta raíz con información del servidor
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Riot Games League of Legends Proxy Server',
    version: '1.0.0',
    endpoints: {
      '/api/health': 'GET - Verificar estado del servidor',
      '/api/ranking': 'GET - Obtener ranking de jugadores'
    },
    docs: 'Actualiza los PLAYER_IDS en server.js y RIOT_API_KEY en .env'
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

if (!RIOT_API_KEY) {
  console.error('❌ ERROR: RIOT_API_KEY no está configurada en el archivo .env');
  console.error('Por favor, crea un archivo .env con tu API key de Riot Games');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🎮 Riot Games League of Legends Proxy Server            ║
║  Región: ${RIOT_REGION}
║  Puerto: ${PORT}
║  Jugadores configurados: ${PLAYER_IDS.length}
║  Estado: ✓ ACTIVO
╚══════════════════════════════════════════════════════════╝

📍 Endpoints disponibles:
   • GET http://localhost:${PORT}/
   • GET http://localhost:${PORT}/api/health
   • GET http://localhost:${PORT}/api/ranking

📚 Documentación:
   1. Sube tu RIOT_API_KEY al archivo .env
   2. Actualiza los PLAYER_IDS en este archivo (server.js)
   3. Llama a /api/ranking para obtener el ranking
  `);
});
