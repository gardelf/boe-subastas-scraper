import BOEScraper from './src/scraper.js';
import logger from './src/logger.js';

async function testScraper() {
  logger.info('=== Prueba rápida del scraper ===');
  
  try {
    const scraper = new BOEScraper({
      headless: true,
      localidad: 'Rivas Vaciamadrid'
    });
    
    logger.info('Iniciando navegador...');
    await scraper.init();
    
    logger.info('Navegando a página de búsqueda...');
    await scraper.navigateToSearch();
    
    logger.info('Aplicando filtros...');
    await scraper.applyFilters();
    
    logger.info('Enviando búsqueda...');
    await scraper.submitSearch();
    
    logger.info('Extrayendo total de resultados...');
    const total = await scraper.extractTotalResults();
    
    logger.info(`✅ Total de resultados encontrados: ${total}`);
    
    logger.info('Extrayendo datos de la primera página...');
    const subastas = await scraper.extractListingData();
    
    logger.info(`✅ Extraídas ${subastas.length} subastas de la primera página`);
    
    if (subastas.length > 0) {
      logger.info('Ejemplo de subasta extraída:');
      logger.info(JSON.stringify(subastas[0], null, 2));
    }
    
    await scraper.close();
    
    logger.info('=== Prueba completada exitosamente ===');
    process.exit(0);
    
  } catch (error) {
    logger.error(`Error en la prueba: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

testScraper();
