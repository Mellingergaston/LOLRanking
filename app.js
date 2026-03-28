// ============================================
// MOCK DATA - Datos de prueba locales
// ============================================
const MOCK_PLAYERS = [
    {
        id: 1,
        nombre: "ShadowKnight",
        rango: "Platino II",
        elo: 2487,
        lp: 78,
        winrate: 56.2
    },
    {
        id: 2,
        nombre: "PhoenixRise",
        rango: "Oro IV",
        elo: 1892,
        lp: 34,
        winrate: 51.8
    },
    {
        id: 3,
        nombre: "IceWizard",
        rango: "Platino IV",
        elo: 2156,
        lp: 92,
        winrate: 58.5
    }
];

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
    API_ENDPOINT: 'http://localhost:3000/api/ranking',
    FETCH_TIMEOUT: 60000, // 60 segundos (backend procesa múltiples jugadores)
    USE_MOCK_DATA: true   // Usa mock como fallback si backend falla
};

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Hace fetch real al backend Node.js
 * Mapea los datos del backend al formato esperado por renderPlayers()
 */
async function fetchRanking() {
    try {
        console.log('📡 Conectando a:', CONFIG.API_ENDPOINT);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const backendData = await response.json();
        console.log('✅ Respuesta del backend:', backendData);

        // Validar que la respuesta tenga la estructura esperada
        if (!backendData.success || !Array.isArray(backendData.ranking)) {
            throw new Error('Respuesta inválida del servidor');
        }

        // Mapear datos del backend al formato de la aplicación
        const mappedPlayers = backendData.ranking
            .filter(player => !player.error) // Filtrar jugadores sin error
            .map(player => mapBackendPlayerToAppFormat(player));

        console.log(`✅ ${mappedPlayers.length} jugadores mapeados exitosamente`);
        return { players: mappedPlayers };

    } catch (error) {
        console.error('❌ Error al conectar con el backend:', error.message);
        
        if (CONFIG.USE_MOCK_DATA) {
            console.warn('⚠️ Error en fetch. Verificar que el servidor Node.js está corriendo en puerto 3000');
            console.warn('⚠️ Usando datos mock locales como fallback...');
            await new Promise(resolve => setTimeout(resolve, 500));
            return { players: MOCK_PLAYERS };
        } else {
            throw new Error(`No se pudo conectar al backend en ${CONFIG.API_ENDPOINT}`);
        }
    }
}

/**
 * Convierte un jugador del formato del backend al formato de la app
 * @param {Object} backendPlayer - Jugador del backend
 * @returns {Object} Jugador para mostrar en la app
 */
function mapBackendPlayerToAppFormat(backendPlayer) {
    // El backend ya envía directamente el formato correcto
    return {
        riotId: backendPlayer.riotId,
        tier: backendPlayer.tier,
        rank: backendPlayer.rank,
        lp: backendPlayer.lp,
        winRate: backendPlayer.winRate,
        // Datos adicionales para ordenamiento y lógica
        _tierValue: getTierValue(backendPlayer.tier, backendPlayer.rank)
    };
}

/**
 * Convierte tier + rank a valor numérico para ordenar
 * @param {string} tier - Tier (IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER)
 * @param {string} rank - Rank (I, II, III, IV)
 * @returns {number} Valor numérico para ordenamiento
 */
/**
 * Convierte tier + rank a valor numérico para ordenar
 * Cada división (IV a I) suma 100 puntos.
 * Cada tier se separa por 500 puntos para garantizar que un Oro I con 99 PL 
 * nunca supere a un Platino IV con 0 PL.
 */
function getTierValue(tier, rank) {
    const tierValues = {
        'CHALLENGER': 4500,
        'GRANDMASTER': 4500,
        'MASTER': 4500,  // Comparten base, la diferencia la marcan sus PL
        'DIAMOND': 4000,
        'EMERALD': 3500, // Esmeralda agregado entre Platino y Diamante
        'PLATINUM': 3000,
        'GOLD': 2500,
        'SILVER': 2000,
        'BRONZE': 1500,
        'IRON': 1000,
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
/**
 * Ordena los jugadores por Tier, Rank y LP (mayor a menor)
 */
function sortPlayersByElo(players) {
    return [...players].sort((a, b) => {
        const aValue = a._tierValue + (a.lp || 0) / 100;
        const bValue = b._tierValue + (b.lp || 0) / 100;
        return bValue - aValue;
    });
}

/**
 * Convierte el Elo a posición en el array (1-based)
 */
function getPositionFromRank(index) {
    return index + 1;
}

/**
 * Genera el HTML de una fila de jugador
 */
function createPlayerRowHTML(player, position) {
    const winrateValue = player.winRate || player.winrate || 0;
    const winrateColor = winrateValue >= 55 ? 'color: #00ff88;' : '';
    const medalEmoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
    const rankDisplay = `${player.tier} ${player.rank}`;
    
    return `
        <div class="player-row player-row--${position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : ''}">
            <div class="player-rank rank-${position > 3 ? 'default' : position}">
                ${medalEmoji} #${position}
            </div>
            <div class="player-info">
                <span class="player-name">${escapeHTML(player.riotId)}</span>
                <span class="player-info-meta">${escapeHTML(rankDisplay)}</span>
            </div>
            <div class="player-rank-badge">
                <span class="rank-tier">${rankDisplay}</span>
            </div>
            <div class="player-lp">
                <div class="lp-label">LP</div>
                <div>${player.lp}</div>
            </div>
            <div class="player-winrate">
                <div class="winrate-value" style="${winrateColor}">${winrateValue}%</div>
                <div class="winrate-label">WR</div>
            </div>
        </div>
    `;
}

/**
 * Escapa caracteres HTML para prevenir inyección
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Renderiza los jugadores en el DOM
 */
function renderPlayers(players) {
    const container = document.getElementById('playersContainer');
    const errorContainer = document.getElementById('errorContainer');
    
    if (!container) {
        console.error('❌ Contenedor de jugadores no encontrado');
        return;
    }

    try {
        // Limpiar estado de error previo si existe
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';

        // Validar datos
        if (!Array.isArray(players) || players.length === 0) {
            throw new Error('No hay datos de jugadores disponibles');
        }

        // Ordenar por Elo (mayor a menor)
        const sortedPlayers = sortPlayersByElo(players);

        // Generar HTML
        const playersHTML = sortedPlayers
            .map((player, index) => createPlayerRowHTML(player, getPositionFromRank(index)))
            .join('');

        // Inyectar en el DOM
        container.innerHTML = playersHTML;
        console.log(`✅ Se renderizaron ${sortedPlayers.length} jugadores`);

        // Animación de entrada
        const rows = container.querySelectorAll('.player-row');
        rows.forEach((row, index) => {
            row.style.animation = `slideDown ${0.3 + index * 0.1}s ease-out`;
        });

    } catch (error) {
        console.error('❌ Error al renderizar jugadores:', error);
        showError(error.message);
    }
}

/**
 * Muestra un mensaje de error en el UI
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    
    let helpText = '';
    if (message.includes('conectar') || message.includes('http')) {
        helpText = `
            <p style="margin-top: 0.5rem; font-size: 0.85rem;">
                <strong>💡 Solución:</strong><br>
                1. Verifica que el servidor Node.js esté corriendo: <code>npm start</code> en la carpeta <code>webserver/</code><br>
                2. El servidor debe estar en: ${CONFIG.API_ENDPOINT}<br>
                3. Revisa la consola del navegador (F12) para más detalles
            </p>
        `;
    }
    
    errorContainer.innerHTML = `
        <strong>⚠️ Error:</strong> ${escapeHTML(message)}
        ${helpText}
    `;
    errorContainer.style.display = 'block';
}

/**
 * Función principal de inicialización
 */
async function initializeApp() {
    console.log('🎮 Inicializando aplicación de ranking...');
    
    try {
        // Obtener datos
        const data = await fetchRanking();

        // Extraer array de jugadores
        const players = data.players || data || [];

        // Renderizar
        renderPlayers(players);

    } catch (error) {
        console.error('❌ Error fatal en la aplicación:', error);
        showError('No se pudieron cargar los datos. Intenta recargar la página.');
    }
}

// ============================================
// EVENT LISTENERS Y EJECUCIÓN
// ============================================

/**
 * Esperar a que el DOM esté listo
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================
// FUNCIONES ÚTILES PARA DESARROLLO
// ============================================

/**
 * Recargar datos manualmente (para debugging)
 * Usa: reloadRanking() en la consola del navegador
 */
window.reloadRanking = async function() {
    console.log('🔄 Recargando datos...');
    const data = await fetchRanking();
    const players = data.players || data || [];
    renderPlayers(players);
};

/**
 * Ver datos mock actuales
 * Usa: viewMockData() en la consola del navegador
 */
window.viewMockData = function() {
    console.log('📦 Datos Mock Actuales:', MOCK_PLAYERS);
    console.table(MOCK_PLAYERS);
};

/**
 * Cambiar entre mock data y backend
 * Usa: toggleMockData() en la consola del navegador
 */
window.toggleMockData = function() {
    CONFIG.USE_MOCK_DATA = !CONFIG.USE_MOCK_DATA;
    console.log(`Mock data ${CONFIG.USE_MOCK_DATA ? 'habilitado' : 'deshabilitado'}`);
    reloadRanking();
};

/**
 * Ver configuración actual
 * Usa: showConfig() en la consola del navegador
 */
window.showConfig = function() {
    console.table(CONFIG);
};

// Log inicial
console.log(
    '%c⚔ League of Legends - Ranking Elo ⚔',
    'font-size: 16px; font-weight: bold; color: #c89b3c; text-shadow: 0 0 10px #c89b3c;'
);
console.log(
    '%cComandos disponibles en consola:',
    'font-weight: bold; color: #00d4ff;'
);
console.log(
    '%creloadRanking() - Recargar datos',
    'color: #a09b8c;'
);
console.log(
    '%cviewMockData() - Ver datos de prueba',
    'color: #a09b8c;'
);
console.log(
    '%ctoggleMockData() - Cambiar entre mock y backend',
    'color: #a09b8c;'
);
console.log(
    '%cshowConfig() - Ver configuración',
    'color: #a09b8c;'
);
