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

// Dashboard principal
app.get('/dashboard', (req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
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
