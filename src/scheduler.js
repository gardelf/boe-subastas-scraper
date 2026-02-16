import cron from 'node-cron';
import dotenv from 'dotenv';
import logger from './logger.js';
import BOEScraper from './scraper.js';
import { sendEmailNotification } from './notifier.js';

dotenv.config();

const SCRAPER_SCHEDULE = process.env.SCRAPER_SCHEDULE || '0 9 * * *'; // Por defecto: 9 AM diario

class Scheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
  }

  async runScraper() {
    if (this.isRunning) {
      logger.warn('El scraper ya está en ejecución, saltando esta ejecución programada');
      return;
    }

    this.isRunning = true;
    logger.info('=== Ejecución programada del scraper iniciada ===');

    try {
      const scraper = new BOEScraper();
      const result = await scraper.scrape();

      if (result.success) {
        logger.info('Scraper ejecutado exitosamente');
        
        // Enviar notificación por email si hay nuevas subastas
        if (result.stats.newItems > 0) {
          logger.info(`Se encontraron ${result.stats.newItems} nuevas subastas`);
          
          if (process.env.EMAIL_NOTIFICATIONS === 'true') {
            try {
              await sendEmailNotification(result);
              logger.info('Notificación por email enviada');
            } catch (emailError) {
              logger.error(`Error enviando email: ${emailError.message}`);
            }
          }
        } else {
          logger.info('No se encontraron nuevas subastas');
        }
      } else {
        logger.error(`Scraper falló: ${result.error}`);
      }

    } catch (error) {
      logger.error(`Error durante la ejecución programada: ${error.message}`);
      logger.error(error.stack);
    } finally {
      this.isRunning = false;
      logger.info('=== Ejecución programada del scraper finalizada ===');
    }
  }

  start() {
    if (!cron.validate(SCRAPER_SCHEDULE)) {
      logger.error(`Expresión cron inválida: ${SCRAPER_SCHEDULE}`);
      throw new Error(`Expresión cron inválida: ${SCRAPER_SCHEDULE}`);
    }

    logger.info(`Programando scraper con expresión cron: ${SCRAPER_SCHEDULE}`);
    
    this.task = cron.schedule(SCRAPER_SCHEDULE, async () => {
      await this.runScraper();
    }, {
      timezone: 'Europe/Madrid'
    });

    logger.info('Scheduler iniciado correctamente');
    logger.info(`Próxima ejecución: ${this.getNextExecutionTime()}`);
  }

  stop() {
    if (this.task) {
      this.task.stop();
      logger.info('Scheduler detenido');
    }
  }

  getNextExecutionTime() {
    // Esta es una aproximación, node-cron no expone directamente la próxima ejecución
    return 'Ver logs para detalles de ejecución';
  }

  async runNow() {
    logger.info('Ejecutando scraper manualmente...');
    await this.runScraper();
  }
}

export default Scheduler;
