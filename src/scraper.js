import { chromium } from 'playwright';
import dotenv from 'dotenv';
import logger from './logger.js';
import { 
  insertSubasta, 
  insertBien, 
  subastaExists,
  insertScraperRun 
} from './database.js';
import { saveToJSON, saveToExcel } from './exporter.js';

dotenv.config();

const BASE_URL = 'https://subastas.boe.es';
const SEARCH_URL = `${BASE_URL}/subastas_ava.php`;

class BOEScraper {
  constructor(options = {}) {
    this.localidad = options.localidad || process.env.LOCALIDAD_FILTRO || 'Rivas Vaciamadrid';
    this.headless = options.headless !== undefined ? options.headless : process.env.HEADLESS !== 'false';
    this.timeout = parseInt(process.env.BROWSER_TIMEOUT || '30000');
    this.browser = null;
    this.page = null;
    this.stats = {
      totalFound: 0,
      newItems: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  async init() {
    logger.info('Iniciando navegador Playwright...');
    this.browser = await chromium.launch({ 
      headless: this.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(this.timeout);
    logger.info('Navegador iniciado correctamente');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Navegador cerrado');
    }
  }

  async navigateToSearch() {
    logger.info(`Navegando a: ${SEARCH_URL}`);
    await this.page.goto(SEARCH_URL, { waitUntil: 'networkidle' });
    logger.info('Página de búsqueda cargada');
  }

  async applyFilters() {
    logger.info(`Aplicando filtro de localidad: ${this.localidad}`);
    
    // Rellenar campo de localidad
    const localidadInput = await this.page.locator('#BIEN\\.LOCALIDAD');
    await localidadInput.fill(this.localidad);
    
    logger.info('Filtros aplicados');
  }

  async submitSearch() {
    logger.info('Enviando formulario de búsqueda...');
    
    // Hacer clic en el botón de buscar
    await this.page.locator('input[type="submit"][value="Buscar"]').click();
    
    // Esperar a que carguen los resultados
    await this.page.waitForLoadState('networkidle');
    
    logger.info('Resultados de búsqueda cargados');
  }

  async extractTotalResults() {
    try {
      // Buscar el texto que indica el total de resultados
      const resultsText = await this.page.locator('text=/Resultados \\d+ a \\d+ de (\\d+)/').first().textContent();
      const match = resultsText.match(/de (\\d+)/);
      
      if (match) {
        const total = parseInt(match[1]);
        logger.info(`Total de resultados encontrados: ${total}`);
        this.stats.totalFound = total;
        return total;
      }
    } catch (error) {
      logger.warn('No se pudo extraer el total de resultados, asumiendo que hay resultados en la página');
    }
    
    return 0;
  }

  async extractListingData() {
    logger.info('Extrayendo datos del listado de subastas...');
    
    const subastas = [];
    
    // Buscar todos los bloques de subastas
    const subastaBlocks = await this.page.locator('div').filter({ hasText: /^SUBASTA SUB-/ }).all();
    
    logger.info(`Encontrados ${subastaBlocks.length} bloques de subastas en esta página`);
    
    for (let i = 0; i < subastaBlocks.length; i++) {
      try {
        const block = subastaBlocks[i];
        const text = await block.textContent();
        
        // Extraer ID de subasta
        const idMatch = text.match(/SUBASTA (SUB-[A-Z]+-\\d+-\\d+)/);
        if (!idMatch) continue;
        
        const idSubasta = idMatch[1];
        
        // Extraer organismo
        let organismo = '';
        const organismoMatch = text.match(/JUZGADO[^\\n]+|Notaría[^\\n]+/);
        if (organismoMatch) {
          organismo = organismoMatch[0].trim();
        }
        
        // Extraer expediente
        let expediente = '';
        const expMatch = text.match(/Expediente:\\s*([^\\n]+)/);
        if (expMatch) {
          expediente = expMatch[1].trim();
        }
        
        // Extraer estado
        let estado = '';
        const estadoMatch = text.match(/Estado:\\s*([^\\n]+)/);
        if (estadoMatch) {
          estado = estadoMatch[1].trim();
        }
        
        // Extraer descripción breve (buscar texto en mayúsculas que describe el bien)
        let descripcionBreve = '';
        const descMatch = text.match(/[A-ZÁÉÍÓÚÑ%\\d\\s]{20,}/);
        if (descMatch) {
          descripcionBreve = descMatch[0].trim();
        }
        
        // Buscar enlace "Más..."
        const linkElement = await block.locator('a[href*="detalleSubasta"]').first();
        let urlDetalle = '';
        if (await linkElement.count() > 0) {
          const href = await linkElement.getAttribute('href');
          urlDetalle = href.startsWith('http') ? href : `${BASE_URL}/${href}`;
        }
        
        const subasta = {
          id_subasta: idSubasta,
          tipo: this.extractTipoFromId(idSubasta),
          organismo,
          expediente,
          estado,
          descripcion_breve: descripcionBreve,
          fecha_extraccion: new Date().toISOString(),
          url_detalle: urlDetalle
        };
        
        subastas.push(subasta);
        logger.debug(`Subasta extraída: ${idSubasta}`);
        
      } catch (error) {
        logger.error(`Error extrayendo subasta del bloque ${i}: ${error.message}`);
        this.stats.errors++;
      }
    }
    
    logger.info(`Extraídas ${subastas.length} subastas del listado`);
    return subastas;
  }

  extractTipoFromId(idSubasta) {
    const tipoMap = {
      'JA': 'Judicial',
      'JV': 'Judicial Vehículos',
      'NV': 'Notarial',
      'NE': 'Notarial Electrónica',
      'AT': 'AEAT',
      'SA': 'Subasta Administrativa'
    };
    
    const match = idSubasta.match(/SUB-([A-Z]+)-/);
    if (match) {
      return tipoMap[match[1]] || match[1];
    }
    return 'Desconocido';
  }

  async extractDetailData(urlDetalle) {
    logger.info(`Extrayendo detalles de: ${urlDetalle}`);
    
    try {
      await this.page.goto(urlDetalle, { waitUntil: 'networkidle' });
      
      const detalle = {};
      
      // Extraer datos de la tabla "Datos de la subasta"
      const extractTableData = async (label) => {
        try {
          const row = await this.page.locator(`tr:has-text("${label}")`).first();
          if (await row.count() > 0) {
            const cells = await row.locator('td').allTextContents();
            return cells[1]?.trim() || '';
          }
        } catch (e) {
          return '';
        }
        return '';
      };
      
      detalle.tipo_subasta = await extractTableData('Tipo de subasta');
      detalle.cuenta_expediente = await extractTableData('Cuenta expediente');
      detalle.fecha_inicio = await extractTableData('Fecha de inicio');
      detalle.fecha_conclusion = await extractTableData('Fecha de conclusión');
      
      const cantidadText = await extractTableData('Cantidad reclamada');
      detalle.cantidad_reclamada = this.parseMoneyAmount(cantidadText);
      
      const lotesText = await extractTableData('Lotes');
      detalle.lotes = lotesText.toLowerCase().includes('sin lotes') ? 0 : 1;
      
      detalle.anuncio_boe = await extractTableData('Anuncio BOE');
      
      const valorText = await extractTableData('Valor subasta');
      detalle.valor_subasta = this.parseMoneyAmount(valorText);
      
      const tasacionText = await extractTableData('Tasación');
      detalle.tasacion = this.parseMoneyAmount(tasacionText);
      
      const pujaText = await extractTableData('Puja mínima');
      detalle.puja_minima = this.parseMoneyAmount(pujaText);
      
      const depositoText = await extractTableData('Importe del depósito');
      detalle.importe_deposito = this.parseMoneyAmount(depositoText);
      
      // Extraer datos del bien (hacer clic en pestaña Bienes)
      const bienesTab = await this.page.locator('a:has-text("Bienes")').first();
      if (await bienesTab.count() > 0) {
        await bienesTab.click();
        await this.page.waitForTimeout(1000);
        
        detalle.bien = await this.extractBienData();
      }
      
      logger.info('Detalles extraídos correctamente');
      return detalle;
      
    } catch (error) {
      logger.error(`Error extrayendo detalles: ${error.message}`);
      this.stats.errors++;
      return null;
    }
  }

  async extractBienData() {
    const bien = {};
    
    const extractBienField = async (label) => {
      try {
        const row = await this.page.locator(`tr:has-text("${label}")`).first();
        if (await row.count() > 0) {
          const cells = await row.locator('td').allTextContents();
          return cells[1]?.trim() || '';
        }
      } catch (e) {
        return '';
      }
      return '';
    };
    
    // Buscar el tipo de bien en el encabezado
    const bienHeader = await this.page.locator('text=/Bien \\d+ - (.+)/').first().textContent().catch(() => '');
    const tipoMatch = bienHeader.match(/Bien \\d+ - (.+)/);
    bien.tipo = tipoMatch ? tipoMatch[1] : '';
    
    bien.descripcion = await extractBienField('Descripción');
    bien.idufir = await extractBienField('IDUFIR');
    bien.referencia_catastral = await extractBienField('Referencia catastral');
    bien.direccion = await extractBienField('Dirección');
    bien.codigo_postal = await extractBienField('Código Postal');
    bien.localidad = await extractBienField('Localidad');
    bien.provincia = await extractBienField('Provincia');
    bien.situacion_posesoria = await extractBienField('Situación posesoria');
    bien.visitable = await extractBienField('Visitable');
    
    return bien;
  }

  parseMoneyAmount(text) {
    if (!text) return null;
    
    // Eliminar símbolos de moneda y espacios
    const cleaned = text.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(cleaned);
    
    return isNaN(amount) ? null : amount;
  }

  async hasNextPage() {
    const nextLink = await this.page.locator('a:has-text("Pág. siguiente")').first();
    return await nextLink.count() > 0;
  }

  async goToNextPage() {
    logger.info('Navegando a la siguiente página...');
    const nextLink = await this.page.locator('a:has-text("Pág. siguiente")').first();
    await nextLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async scrape() {
    this.stats.startTime = new Date().toISOString();
    logger.info('=== Iniciando scraping de subastas BOE ===');
    
    try {
      await this.init();
      await this.navigateToSearch();
      await this.applyFilters();
      await this.submitSearch();
      
      await this.extractTotalResults();
      
      const allSubastas = [];
      let pageNum = 1;
      
      do {
        logger.info(`Procesando página ${pageNum}...`);
        
        const subastas = await this.extractListingData();
        
        // Procesar cada subasta
        for (const subasta of subastas) {
          // Verificar si ya existe en la base de datos
          if (subastaExists(subasta.id_subasta)) {
            logger.debug(`Subasta ${subasta.id_subasta} ya existe en BD, saltando...`);
            continue;
          }
          
          // Es nueva, extraer detalles completos
          logger.info(`Nueva subasta encontrada: ${subasta.id_subasta}`);
          
          if (subasta.url_detalle) {
            const detalle = await this.extractDetailData(subasta.url_detalle);
            
            if (detalle) {
              // Combinar datos de listado y detalle
              const subastaCompleta = { ...subasta, ...detalle };
              
              // Guardar en base de datos
              insertSubasta(subastaCompleta);
              
              // Guardar bien asociado
              if (detalle.bien) {
                insertBien({
                  id_subasta: subasta.id_subasta,
                  ...detalle.bien
                });
              }
              
              allSubastas.push(subastaCompleta);
              this.stats.newItems++;
              
              logger.info(`Subasta ${subasta.id_subasta} guardada correctamente`);
            }
          }
          
          // Pequeña pausa para no saturar el servidor
          await this.page.waitForTimeout(500);
        }
        
        // Verificar si hay siguiente página
        if (await this.hasNextPage()) {
          await this.goToNextPage();
          pageNum++;
        } else {
          break;
        }
        
      } while (true);
      
      this.stats.endTime = new Date().toISOString();
      
      logger.info('=== Scraping completado ===');
      logger.info(`Total encontrado: ${this.stats.totalFound}`);
      logger.info(`Nuevas subastas: ${this.stats.newItems}`);
      logger.info(`Errores: ${this.stats.errors}`);
      
      // Guardar estadísticas de ejecución
      insertScraperRun({
        start_time: this.stats.startTime,
        end_time: this.stats.endTime,
        status: 'success',
        total_found: this.stats.totalFound,
        new_items: this.stats.newItems,
        errors: this.stats.errors,
        error_message: null
      });
      
      // Exportar datos si hay nuevos items
      if (this.stats.newItems > 0) {
        await saveToJSON(allSubastas);
        await saveToExcel(allSubastas);
      }
      
      return {
        success: true,
        stats: this.stats,
        subastas: allSubastas
      };
      
    } catch (error) {
      this.stats.endTime = new Date().toISOString();
      logger.error(`Error durante el scraping: ${error.message}`);
      logger.error(error.stack);
      
      insertScraperRun({
        start_time: this.stats.startTime,
        end_time: this.stats.endTime,
        status: 'error',
        total_found: this.stats.totalFound,
        new_items: this.stats.newItems,
        errors: this.stats.errors + 1,
        error_message: error.message
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
      
    } finally {
      await this.close();
    }
  }
}

export default BOEScraper;

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new BOEScraper();
  scraper.scrape()
    .then(result => {
      if (result.success) {
        logger.info('Scraping ejecutado exitosamente');
        process.exit(0);
      } else {
        logger.error('Scraping falló');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Error fatal: ${error.message}`);
      process.exit(1);
    });
}
