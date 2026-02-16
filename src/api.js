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

// Ejecutar scraper manualmente
app.post('/api/scrape', async (req, res) => {
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
          <span class="method post">POST</span>
          <strong>/api/scrape</strong> - Ejecutar scraper manualmente
        </div>
        
        <h2>Información</h2>
        <p><strong>Localidad filtrada:</strong> ${process.env.LOCALIDAD_FILTRO || 'Rivas Vaciamadrid'}</p>
        <p><strong>Programación:</strong> ${process.env.SCRAPER_SCHEDULE || '0 9 * * *'} (cron)</p>
        <p><strong>Base de datos:</strong> ${process.env.DATABASE_PATH || './data/subastas.db'}</p>
      </div>
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
