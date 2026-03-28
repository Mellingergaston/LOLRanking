/**
 * Ejemplos de cómo consumir el endpoint /api/ranking
 * desde tu frontend JavaScript
 */

// ============================================================================
// OPCIÓN 1: Con Fetch API (Vanilla JavaScript)
// ============================================================================

async function getRankingWithFetch() {
  try {
    const response = await fetch('http://localhost:3000/api/ranking');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Ranking obtenido:', data);
    
    // Procesar datos
    displayRanking(data.ranking);
    
    return data;
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    // Mostrar error al usuario
    showError('No se pudo obtener el ranking. Verifica que el servidor esté activo.');
  }
}

// ============================================================================
// OPCIÓN 2: Con Axios (si lo tienes instalado)
// ============================================================================

async function getRankingWithAxios() {
  try {
    const response = await axios.get('http://localhost:3000/api/ranking');
    console.log('Ranking obtenido:', response.data);
    
    displayRanking(response.data.ranking);
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    showError('No se pudo obtener el ranking.');
  }
}

// ============================================================================
// OPCIÓN 3: Con async/await y mejor manejo de errores
// ============================================================================

async function getRankingAdvanced() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

  try {
    const response = await fetch('http://localhost:3000/api/ranking', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validar que la respuesta tenga la estructura esperada
    if (!data.success || !Array.isArray(data.ranking)) {
      throw new Error('Respuesta inválida del servidor');
    }

    console.log(`✓ Ranking obtenido: ${data.ranking.length} jugadores`);
    console.log(`Status: ${data.successCount}/${data.total} exitosos`);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('Timeout: El servidor tardó demasiado en responder');
      showError('Timeout. El servidor no responde. Intenta más tarde.');
    } else {
      console.error('Error:', error.message);
      showError(`Error: ${error.message}`);
    }
    
    return null;
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Muestra el ranking en la página
 * @param {Array} players - Array de jugadores
 */
function displayRanking(players) {
  const container = document.getElementById('ranking-container');
  
  if (!container) {
    console.warn('No existe elemento #ranking-container');
    return;
  }

  // Limpiar contenedor
  container.innerHTML = '';

  // Crear tabla
  const table = document.createElement('table');
  table.className = 'ranking-table';
  
  // Header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>#</th>
      <th>Nombre</th>
      <th>Tier</th>
      <th>LP</th>
      <th>W/L</th>
      <th>Winrate</th>
    </tr>
  `;
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  
  players.forEach((player, index) => {
    const tr = document.createElement('tr');
    
    if (player.error) {
      // Fila de error
      tr.className = 'error-row';
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${player.riotId}</td>
        <td colspan="4" class="error-message">${player.error}</td>
      `;
    } else {
      // Fila exitosa
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${player.summoner}</td>
        <td>${player.tier} ${player.rank}</td>
        <td>${player.lp}</td>
        <td>${player.wins}W ${player.losses}L</td>
        <td>${player.winRate}%</td>
      `;
    }
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje a mostrar
 */
function showError(message) {
  const errorDiv = document.getElementById('error-message') 
    || document.createElement('div');
  
  if (!errorDiv.id) {
    errorDiv.id = 'error-message';
    errorDiv.className = 'error-banner';
    document.body.insertBefore(errorDiv, document.body.firstChild);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';

  // Auto-hide después de 5 segundos
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

/**
 * Verifica que el servidor esté disponible
 */
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✓ Servidor disponible');
      console.log('  Región:', data.env.riot_region);
      console.log('  Jugadores configurados:', data.env.players_configured);
      return true;
    }
  } catch (error) {
    console.error('✗ Servidor no disponible:', error.message);
    return false;
  }
}

// ============================================================================
// USO EN HTML
// ============================================================================

/**
 * Ejemplo de HTML para integrar:
 * 
 * <div id="ranking-container"></div>
 * <button onclick="loadRanking()">Actualizar Ranking</button>
 * 
 * <script>
 *   async function loadRanking() {
 *     // Primero verificar que el servidor esté up
 *     const isHealthy = await checkServerHealth();
 *     if (!isHealthy) {
 *       showError('Servidor no disponible');
 *       return;
 *     }
 *     
 *     // Obtener y mostrar ranking
 *     const data = await getRankingAdvanced();
 *     if (data) {
 *       displayRanking(data.ranking);
 *     }
 *   }
 *   
 *   // Cargar al iniciar
 *   window.addEventListener('DOMContentLoaded', loadRanking);
 * </script>
 */

// ============================================================================
// ESTILOS CSS (Ejemplo)
// ============================================================================

/**
 * Agregar este CSS a tu stylesheet:
 * 
.ranking-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.ranking-table thead {
  background-color: #40E0D0;
  color: white;
  text-align: left;
}

.ranking-table th,
.ranking-table td {
  padding: 12px 15px;
  border: 1px solid #ddd;
}

.ranking-table tbody tr {
  border-bottom: 1px solid #ddd;
}

.ranking-table tbody tr:hover {
  background-color: #f3f3f3;
}

.ranking-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.error-row {
  background-color: #ffebee;
}

.error-message {
  color: #c62828;
  font-weight: bold;
}

.error-banner {
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  margin: 10px 0;
  border-left: 4px solid #c62828;
  border-radius: 4px;
  display: none;
}
 */
