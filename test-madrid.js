import BOEScraper from './src/scraper.js';
import logger from './src/logger.js';

async function testMadrid() {
  logger.info('=== Prueba con provincia de Madrid (sin filtro de localidad) ===');
  
  try {
    const scraper = new BOEScraper({
      headless: true,
      localidad: '' // Sin filtro de localidad, solo provincia
    });
    
    logger.info('Iniciando navegador...');
    await scraper.init();
    
    logger.info('Navegando a página de búsqueda...');
    await scraper.navigateToSearch();
    
    logger.info('Aplicando filtros (solo provincia Madrid)...');
    await scraper.applyFilters();
    
    logger.info('Enviando búsqueda...');
    await scraper.submitSearch();
    
    logger.info('Extrayendo total de resultados...');
    const total = await scraper.extractTotalResults();
    
    logger.info(`✅ Total de resultados encontrados en Madrid: ${total}`);
    
    if (total > 0) {
      logger.info('Extrayendo datos de la primera página...');
      const subastas = await scraper.extractListingData();
      
      logger.info(`✅ Extraídas ${subastas.length} subastas de la primera página`);
      
      if (subastas.length > 0) {
        logger.info('Ejemplo de subasta extraída:');
        logger.info(JSON.stringify(subastas[0], null, 2));
        
        // Probar extracción de detalle de la primera subasta
        logger.info('\nProbando extracción de detalle completo...');
        const detalle = await scraper.extractAuctionDetail(subastas[0].url_detalle);
        logger.info('Detalle extraído:');
        logger.info(JSON.stringify(detalle, null, 2));
      }
    } else {
      logger.warn('No se encontraron subastas en Madrid');
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

testMadrid();
