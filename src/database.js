import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Asegurar que el directorio de datos existe
const dataDir = join(projectRoot, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH 
  ? join(projectRoot, process.env.DATABASE_PATH)
  : join(dataDir, 'subastas.db');

logger.info(`Inicializando base de datos en: ${dbPath}`);

const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Crear tablas si no existen
function initDatabase() {
  logger.info('Creando tablas de base de datos...');
  
  // Tabla de subastas
  db.exec(`
    CREATE TABLE IF NOT EXISTS subastas (
      id_subasta TEXT PRIMARY KEY,
      tipo TEXT,
      organismo TEXT,
      expediente TEXT,
      estado TEXT,
      descripcion_breve TEXT,
      fecha_extraccion TEXT,
      url_detalle TEXT,
      tipo_subasta TEXT,
      cuenta_expediente TEXT,
      fecha_inicio TEXT,
      fecha_conclusion TEXT,
      cantidad_reclamada REAL,
      lotes INTEGER,
      anuncio_boe TEXT,
      valor_subasta REAL,
      tasacion REAL,
      puja_minima REAL,
      importe_deposito REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de bienes
  db.exec(`
    CREATE TABLE IF NOT EXISTS bienes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_subasta TEXT NOT NULL,
      tipo TEXT,
      descripcion TEXT,
      idufir TEXT,
      referencia_catastral TEXT,
      direccion TEXT,
      codigo_postal TEXT,
      localidad TEXT,
      provincia TEXT,
      situacion_posesoria TEXT,
      visitable TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_subasta) REFERENCES subastas(id_subasta) ON DELETE CASCADE
    )
  `);

  // Tabla de ejecuciones del scraper
  db.exec(`
    CREATE TABLE IF NOT EXISTS scraper_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT,
      end_time TEXT,
      status TEXT,
      total_found INTEGER,
      new_items INTEGER,
      errors INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Índices para mejorar rendimiento
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subastas_estado ON subastas(estado);
    CREATE INDEX IF NOT EXISTS idx_subastas_fecha_conclusion ON subastas(fecha_conclusion);
    CREATE INDEX IF NOT EXISTS idx_bienes_localidad ON bienes(localidad);
    CREATE INDEX IF NOT EXISTS idx_bienes_id_subasta ON bienes(id_subasta);
  `);

  logger.info('Base de datos inicializada correctamente');
}

// Funciones de base de datos

export function insertSubasta(subasta) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO subastas (
      id_subasta, tipo, organismo, expediente, estado, descripcion_breve,
      fecha_extraccion, url_detalle, tipo_subasta, cuenta_expediente,
      fecha_inicio, fecha_conclusion, cantidad_reclamada, lotes,
      anuncio_boe, valor_subasta, tasacion, puja_minima, importe_deposito,
      updated_at
    ) VALUES (
      @id_subasta, @tipo, @organismo, @expediente, @estado, @descripcion_breve,
      @fecha_extraccion, @url_detalle, @tipo_subasta, @cuenta_expediente,
      @fecha_inicio, @fecha_conclusion, @cantidad_reclamada, @lotes,
      @anuncio_boe, @valor_subasta, @tasacion, @puja_minima, @importe_deposito,
      CURRENT_TIMESTAMP
    )
  `);
  
  return stmt.run(subasta);
}

export function insertBien(bien) {
  const stmt = db.prepare(`
    INSERT INTO bienes (
      id_subasta, tipo, descripcion, idufir, referencia_catastral,
      direccion, codigo_postal, localidad, provincia,
      situacion_posesoria, visitable
    ) VALUES (
      @id_subasta, @tipo, @descripcion, @idufir, @referencia_catastral,
      @direccion, @codigo_postal, @localidad, @provincia,
      @situacion_posesoria, @visitable
    )
  `);
  
  return stmt.run(bien);
}

export function subastaExists(idSubasta) {
  const stmt = db.prepare('SELECT id_subasta FROM subastas WHERE id_subasta = ?');
  return stmt.get(idSubasta) !== undefined;
}

export function getAllSubastas() {
  const stmt = db.prepare('SELECT * FROM subastas ORDER BY fecha_conclusion DESC');
  return stmt.all();
}

export function getSubastaWithBienes(idSubasta) {
  const subasta = db.prepare('SELECT * FROM subastas WHERE id_subasta = ?').get(idSubasta);
  if (!subasta) return null;
  
  const bienes = db.prepare('SELECT * FROM bienes WHERE id_subasta = ?').all(idSubasta);
  return { ...subasta, bienes };
}

export function insertScraperRun(run) {
  const stmt = db.prepare(`
    INSERT INTO scraper_runs (
      start_time, end_time, status, total_found, new_items, errors, error_message
    ) VALUES (
      @start_time, @end_time, @status, @total_found, @new_items, @errors, @error_message
    )
  `);
  
  return stmt.run(run);
}

export function getRecentRuns(limit = 10) {
  const stmt = db.prepare('SELECT * FROM scraper_runs ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

export function closeDatabase() {
  db.close();
  logger.info('Base de datos cerrada');
}

// Inicializar base de datos al importar el módulo
initDatabase();

export default db;
