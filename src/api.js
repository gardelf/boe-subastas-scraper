import express from 'express';
import dotenv from 'dotenv';
import logger from './logger.js';
import { 
  getAllSubastas, 
  getSubastaWithBienes,
  getRecentRuns 
} from './database.js';
import BOEScraper from './scraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'boe-subastas-scraper'
  });
});

// Obtener todas las subastas
app.get('/api/subastas', (req, res) => {
  try {
    const subastas = getAllSubastas();
    res.json({
      success: true,
      total: subastas.length,
      data: subastas
    });
  } catch (error) {
    logger.error(`Error obteniendo subastas: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener una subasta específica con sus bienes
app.get('/api/subastas/:id', (req, res) => {
  try {
    const { id } = req.params;
    const subasta = getSubastaWithBienes(id);
    
    if (!subasta) {
      return res.status(404).json({
        success: false,
        error: 'Subasta no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: subasta
    });
  } catch (error) {
    logger.error(`Error obteniendo subasta: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener historial de ejecuciones del scraper
app.get('/api/runs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const runs = getRecentRuns(limit);
    
    res.json({
      success: true,
      total: runs.length,
      data: runs
    });
  } catch (error) {
    logger.error(`Error obteniendo ejecuciones: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ejecutar scraper manualmente (función compartida para GET y POST)
const executeScraper = async (req, res) => {
  try {
    logger.info('Scraper ejecutado manualmente vía API');
    
    // Responder inmediatamente
    res.json({
      success: true,
      message: 'Scraper iniciado en segundo plano'
    });
    
    // Ejecutar scraper en segundo plano
    const scraper = new BOEScraper();
    scraper.scrape()
      .then(result => {
        logger.info(`Scraper manual completado: ${result.success ? 'éxito' : 'error'}`);
      })
      .catch(error => {
        logger.error(`Error en scraper manual: ${error.message}`);
      });
      
  } catch (error) {
    logger.error(`Error iniciando scraper: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Permitir tanto POST como GET para facilitar el uso desde navegador
app.post('/api/scrape', executeScraper);
app.get('/api/scrape', executeScraper);

// Servir archivos estáticos desde public
app.use(express.static('public'));

// Dashboard principal con visualización de datos
app.get('/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - BOE Subastas Scraper</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 20px; }
    h1 { color: #333; margin-bottom: 10px; font-size: 32px; }
    h2 { color: #333; margin-bottom: 20px; font-size: 24px; }
    .btn { padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .info { color: #666; margin: 10px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
    .stat-number { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .stat-label { font-size: 14px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f9f9f9; }
    .status-success { color: #4caf50; font-weight: bold; }
    .status-error { color: #f44336; font-weight: bold; }
    .loading { text-align: center; padding: 20px; color: #667eea; }
    .refresh-btn { float: right; padding: 8px 16px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>🔍 BOE Subastas Scraper</h1>
      <p class="info">Panel de control para Rivas Vaciamadrid</p>
      <button class="btn" onclick="runScraper()" id="runBtn">🚀 Ejecutar Scraper Ahora</button>
      <button class="btn refresh-btn" onclick="loadData()">🔄 Actualizar</button>
      <div id="status" style="margin-top: 20px;"></div>
    </div>
    
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card">
        <div class="stat-label">Total Subastas</div>
        <div class="stat-number" id="totalSubastas">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Última Ejecución</div>
        <div class="stat-number" id="lastRun">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Nuevas Hoy</div>
        <div class="stat-number" id="newToday">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Estado</div>
        <div class="stat-number" id="status">-</div>
      </div>
    </div>

    <div class="card">
      <h2>📈 Historial de Ejecuciones</h2>
      <div id="runsTable" class="loading">Cargando datos...</div>
    </div>

    <div class="card">
      <h2>📋 Últimas Subastas Encontradas</h2>
      <div id="subastasTable" class="loading">Cargando datos...</div>
    </div>
    
    <div class="card">
      <h2>🔗 Enlaces Rápidos</h2>
      <ul style="list-style: none; padding: 0;">
        <li style="margin: 10px 0;"><a href="/api/subastas" style="color: #667eea; text-decoration: none; font-weight: 500;">📋 Ver Subastas (JSON)</a></li>
        <li style="margin: 10px 0;"><a href="/api/runs" style="color: #667eea; text-decoration: none; font-weight: 500;">📈 Ver Historial (JSON)</a></li>
        <li style="margin: 10px 0;"><a href="/api/export/json" style="color: #667eea; text-decoration: none; font-weight: 500;">💾 Exportar JSON</a></li>
        <li style="margin: 10px 0;"><a href="/api/export/excel" style="color: #667eea; text-decoration: none; font-weight: 500;">📊 Exportar Excel</a></li>
      </ul>
    </div>
  </div>
  
  <script>
    async function loadData() {
      try {
        // Cargar estadísticas
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();
        
        document.getElementById('totalSubastas').textContent = stats.data.total_subastas || 0;
        document.getElementById('newToday').textContent = stats.data.nuevas_hoy || 0;
        
        // Cargar historial de ejecuciones
        const runsRes = await fetch('/api/runs');
        const runs = await runsRes.json();
        
        if (runs.success && runs.data.length > 0) {
          const lastRun = runs.data[0];
          const lastRunDate = new Date(lastRun.start_time);
          document.getElementById('lastRun').textContent = lastRunDate.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
          document.getElementById('status').innerHTML = lastRun.status === 'success' ? '✅' : '❌';
          
          let tableHTML = '<table><thead><tr><th>ID</th><th>Fecha y Hora</th><th>Duración</th><th>Estado</th><th>Encontradas</th><th>Nuevas</th><th>Errores</th></tr></thead><tbody>';
          
          runs.data.forEach(run => {
            const startDate = new Date(run.start_time);
            const endDate = new Date(run.end_time);
            const duration = ((endDate - startDate) / 1000).toFixed(1);
            const statusClass = run.status === 'success' ? 'status-success' : 'status-error';
            
            tableHTML += `<tr>
              <td>#${run.id}</td>
              <td>${startDate.toLocaleString('es-ES')}</td>
              <td>${duration}s</td>
              <td class="${statusClass}">${run.status === 'success' ? '✅ Exitoso' : '❌ Error'}</td>
              <td>${run.total_found}</td>
              <td>${run.new_items}</td>
              <td>${run.errors}</td>
            </tr>`;
          });
          
          tableHTML += '</tbody></table>';
          document.getElementById('runsTable').innerHTML = tableHTML;
        } else {
          document.getElementById('runsTable').innerHTML = '<p style="color: #999;">No hay ejecuciones registradas aún.</p>';
          document.getElementById('lastRun').textContent = 'N/A';
          document.getElementById('status').textContent = '-';
        }
        
        // Cargar subastas
        const subastasRes = await fetch('/api/subastas');
        const subastas = await subasRes.json();
        
        if (subastas.success && subastas.data.length > 0) {
          let tableHTML = '<table><thead><tr><th>ID</th><th>Título</th><th>Tipo</th><th>Estado</th><th>Valor</th><th>Localidad</th></tr></thead><tbody>';
          
          subastas.data.slice(0, 10).forEach(subasta => {
            tableHTML += `<tr>
              <td>${subasta.id_subasta}</td>
              <td><strong>${subasta.titulo || 'Sin título'}</strong></td>
              <td>${subasta.tipo_subasta || '-'}</td>
              <td>${subasta.estado || '-'}</td>
              <td>${subasta.valor_subasta ? subasta.valor_subasta.toLocaleString('es-ES', {style: 'currency', currency: 'EUR'}) : '-'}</td>
              <td>${subasta.localidad || '-'}</td>
            </tr>`;
          });
          
          tableHTML += '</tbody></table>';
          document.getElementById('subastasTable').innerHTML = tableHTML;
        } else {
          document.getElementById('subastasTable').innerHTML = '<p style="color: #999;">No hay subastas registradas aún. Ejecuta el scraper para comenzar.</p>';
        }
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('runsTable').innerHTML = '<p style="color: #f44336;">Error cargando datos. Intenta actualizar la página.</p>';
      }
    }
    
    async function runScraper() {
      const statusDiv = document.getElementById('status');
      const runBtn = document.getElementById('runBtn');
      
      runBtn.disabled = true;
      runBtn.textContent = '⏳ Ejecutando...';
      statusDiv.innerHTML = '<p style="color: #667eea; font-weight: 500;">⏳ Scraper iniciado. Esto puede tardar 5-10 segundos...</p>';
      
      try {
        const response = await fetch('/api/scrape');
        const data = await response.json();
        
        if (data.success) {
          statusDiv.innerHTML = '<p style="color: #4caf50; font-weight: 500;">✅ Scraper completado. Actualizando datos...</p>';
          setTimeout(() => {
            loadData();
            runBtn.disabled = false;
            runBtn.textContent = '🚀 Ejecutar Scraper Ahora';
            statusDiv.innerHTML = '';
          }, 3000);
        } else {
          statusDiv.innerHTML = '<p style="color: #f44336; font-weight: 500;">❌ Error: ' + data.error + '</p>';
          runBtn.disabled = false;
          runBtn.textContent = '🚀 Ejecutar Scraper Ahora';
        }
      } catch (error) {
        statusDiv.innerHTML = '<p style="color: #f44336; font-weight: 500;">❌ Error: ' + error.message + '</p>';
        runBtn.disabled = false;
        runBtn.textContent = '🚀 Ejecutar Scraper Ahora';
      }
    }
    
    // Cargar datos al iniciar
    loadData();
    
    // Auto-refresh cada 30 segundos
    setInterval(loadData, 30000);
  </script>
</body>
</html>
  `);
});

// Página de inicio simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BOE Subastas Scraper</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          border-bottom: 3px solid #4472C4;
          padding-bottom: 10px;
        }
        .endpoint {
          background: #f9f9f9;
          padding: 10px;
          margin: 10px 0;
          border-left: 4px solid #4472C4;
          font-family: monospace;
        }
        .method {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: bold;
          margin-right: 10px;
        }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #4472C4;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          margin: 10px 0;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #365a9e;
        }
        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .status {
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          display: none;
        }
        .status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .info-box {
          background: #e7f3ff;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 4px solid #2196F3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔍 BOE Subastas Scraper</h1>
        <p>Scraper automatizado de subastas del BOE para Rivas Vaciamadrid</p>
        
        <h2>API Endpoints</h2>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/health</strong> - Health check
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/subastas</strong> - Listar todas las subastas
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/subastas/:id</strong> - Obtener detalle de una subasta
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <strong>/api/runs</strong> - Historial de ejecuciones del scraper
        </div>
        
        <div class="endpoint">
          <span class="method get">GET</span>
          <span class="method post">POST</span>
          <strong>/api/scrape</strong> - Ejecutar scraper manualmente
        </div>
        
        <h2>📊 Panel de Control</h2>
        <div class="info-box">
          <p>🎉 <strong>Nuevo:</strong> Accede al panel de control completo con visualización en tiempo real del progreso del scraping.</p>
          <p><a href="/dashboard" style="color: #4472C4; font-weight: bold; text-decoration: none;">➡️ Ir al Dashboard Interactivo</a></p>
        </div>
        
        <h2>⚡ Ejecutar Scraper Ahora</h2>
        <div class="info-box">
          <p><strong>🔍 Buscará subastas en:</strong> ${process.env.LOCALIDAD_FILTRO || 'Rivas Vaciamadrid'}, ${process.env.PROVINCIA_FILTRO || 'Madrid'}</p>
          <p><strong>⏱️ Tiempo estimado:</strong> 5-10 segundos</p>
        </div>
        <button class="btn" onclick="runScraper()" id="scrapeBtn">🚀 Ejecutar Scraper</button>
        <div class="status" id="status"></div>
        
        <h2>Información</h2>
        <p><strong>Localidad filtrada:</strong> ${process.env.LOCALIDAD_FILTRO || 'Rivas Vaciamadrid'}</p>
        <p><strong>Programación:</strong> ${process.env.SCRAPER_SCHEDULE || '0 9 * * *'} (cron)</p>
        <p><strong>Base de datos:</strong> ${process.env.DATABASE_PATH || './data/subastas.db'}</p>
      </div>
      
      <script>
        async function runScraper() {
          const btn = document.getElementById('scrapeBtn');
          const status = document.getElementById('status');
          
          btn.disabled = true;
          btn.textContent = '⏳ Ejecutando...';
          status.style.display = 'none';
          
          try {
            const response = await fetch('/api/scrape');
            const data = await response.json();
            
            if (data.success) {
              status.className = 'status success';
              status.textContent = '✅ ' + data.message + '. Espera 5-10 segundos y recarga para ver resultados.';
              status.style.display = 'block';
              
              // Redirigir a /api/subastas después de 8 segundos
              setTimeout(() => {
                window.location.href = '/api/subastas';
              }, 8000);
            } else {
              throw new Error(data.error || 'Error desconocido');
            }
          } catch (error) {
            status.className = 'status error';
            status.textContent = '❌ Error: ' + error.message;
            status.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '🚀 Ejecutar Scraper';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado'
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

export function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API REST escuchando en puerto ${PORT}`);
      logger.info(`Accede a http://localhost:${PORT} para ver la documentación`);
      resolve(server);
    });
  });
}

export default app;
