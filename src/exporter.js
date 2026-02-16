import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ExcelJS from 'exceljs';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const dataDir = join(projectRoot, 'data');

// Asegurar que el directorio de datos existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export async function saveToJSON(subastas) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `subastas_${timestamp}.json`;
    const filepath = join(dataDir, filename);
    
    // También guardar en archivo general
    const generalFilepath = join(dataDir, 'subastas_latest.json');
    
    const data = {
      timestamp: new Date().toISOString(),
      total: subastas.length,
      subastas
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    fs.writeFileSync(generalFilepath, JSON.stringify(data, null, 2), 'utf-8');
    
    logger.info(`Datos exportados a JSON: ${filename}`);
    return filepath;
    
  } catch (error) {
    logger.error(`Error exportando a JSON: ${error.message}`);
    throw error;
  }
}

export async function saveToExcel(subastas) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `subastas_${timestamp}.xlsx`;
    const filepath = join(dataDir, filename);
    
    // También guardar en archivo general
    const generalFilepath = join(dataDir, 'subastas_latest.xlsx');
    
    const workbook = new ExcelJS.Workbook();
    
    // Hoja de subastas
    const worksheet = workbook.addWorksheet('Subastas');
    
    // Definir columnas
    worksheet.columns = [
      { header: 'ID Subasta', key: 'id_subasta', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Estado', key: 'estado', width: 20 },
      { header: 'Organismo', key: 'organismo', width: 40 },
      { header: 'Expediente', key: 'expediente', width: 20 },
      { header: 'Descripción', key: 'descripcion_breve', width: 60 },
      { header: 'Fecha Inicio', key: 'fecha_inicio', width: 20 },
      { header: 'Fecha Conclusión', key: 'fecha_conclusion', width: 20 },
      { header: 'Valor Subasta (€)', key: 'valor_subasta', width: 15 },
      { header: 'Tasación (€)', key: 'tasacion', width: 15 },
      { header: 'Puja Mínima (€)', key: 'puja_minima', width: 15 },
      { header: 'Depósito (€)', key: 'importe_deposito', width: 15 },
      { header: 'Cantidad Reclamada (€)', key: 'cantidad_reclamada', width: 18 },
      { header: 'Anuncio BOE', key: 'anuncio_boe', width: 20 },
      { header: 'Dirección', key: 'bien_direccion', width: 40 },
      { header: 'Código Postal', key: 'bien_codigo_postal', width: 12 },
      { header: 'Localidad', key: 'bien_localidad', width: 20 },
      { header: 'Provincia', key: 'bien_provincia', width: 15 },
      { header: 'Ref. Catastral', key: 'bien_referencia_catastral', width: 20 },
      { header: 'IDUFIR', key: 'bien_idufir', width: 20 },
      { header: 'Tipo Bien', key: 'bien_tipo', width: 25 },
      { header: 'Visitable', key: 'bien_visitable', width: 12 },
      { header: 'URL Detalle', key: 'url_detalle', width: 80 },
      { header: 'Fecha Extracción', key: 'fecha_extraccion', width: 20 }
    ];
    
    // Estilo de encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Agregar datos
    subastas.forEach(subasta => {
      const row = {
        id_subasta: subasta.id_subasta,
        tipo: subasta.tipo,
        estado: subasta.estado,
        organismo: subasta.organismo,
        expediente: subasta.expediente,
        descripcion_breve: subasta.descripcion_breve,
        fecha_inicio: subasta.fecha_inicio,
        fecha_conclusion: subasta.fecha_conclusion,
        valor_subasta: subasta.valor_subasta,
        tasacion: subasta.tasacion,
        puja_minima: subasta.puja_minima,
        importe_deposito: subasta.importe_deposito,
        cantidad_reclamada: subasta.cantidad_reclamada,
        anuncio_boe: subasta.anuncio_boe,
        bien_direccion: subasta.bien?.direccion || '',
        bien_codigo_postal: subasta.bien?.codigo_postal || '',
        bien_localidad: subasta.bien?.localidad || '',
        bien_provincia: subasta.bien?.provincia || '',
        bien_referencia_catastral: subasta.bien?.referencia_catastral || '',
        bien_idufir: subasta.bien?.idufir || '',
        bien_tipo: subasta.bien?.tipo || '',
        bien_visitable: subasta.bien?.visitable || '',
        url_detalle: subasta.url_detalle,
        fecha_extraccion: subasta.fecha_extraccion
      };
      
      worksheet.addRow(row);
    });
    
    // Aplicar filtros
    worksheet.autoFilter = {
      from: 'A1',
      to: 'X1'
    };
    
    // Guardar archivo
    await workbook.xlsx.writeFile(filepath);
    await workbook.xlsx.writeFile(generalFilepath);
    
    logger.info(`Datos exportados a Excel: ${filename}`);
    return filepath;
    
  } catch (error) {
    logger.error(`Error exportando a Excel: ${error.message}`);
    throw error;
  }
}
