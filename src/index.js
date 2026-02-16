import dotenv from 'dotenv';
import logger from './logger.js';
import Scheduler from './scheduler.js';
import { startServer } from './api.js';
import { closeDatabase } from './database.js';

dotenv.config();

async function main() {
  logger.info('=== Iniciando BOE Subastas Scraper ===');
  logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Localidad: ${process.env.LOCALIDAD_FILTRO || 'Rivas Vaciamadrid'}`);
  
  try {
    // Iniciar servidor API
    await startServer();
    
    // Iniciar scheduler
    const scheduler = new Scheduler();
    scheduler.start();
    
    // Si se pasa argumento --now, ejecutar inmediatamente
    if (process.argv.includes('--now')) {
      logger.info('Ejecutando scraper inmediatamente (--now)...');
      await scheduler.runNow();
    }
    
    logger.info('=== Sistema iniciado correctamente ===');
    logger.info('Presiona Ctrl+C para detener');
    
    // Manejo de señales de terminación
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} recibido, cerrando aplicación...`);
      
      scheduler.stop();
      closeDatabase();
      
      logger.info('Aplicación cerrada correctamente');
      process.exit(0);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error(`Error fatal: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar aplicación
main();
