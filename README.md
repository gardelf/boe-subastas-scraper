# 🔍 BOE Subastas Scraper - Rivas Vaciamadrid

Aplicación Node.js con Playwright que extrae diariamente información de subastas del BOE (Boletín Oficial del Estado) filtradas para **Rivas Vaciamadrid**, lista para desplegar en Railway.

## 📋 Características

- ✅ **Scraping automatizado** con Playwright (navegador real)
- ✅ **Filtrado específico** para Rivas Vaciamadrid
- ✅ **Programación diaria** con node-cron
- ✅ **Base de datos SQLite** para evitar duplicados
- ✅ **Exportación** a JSON y Excel
- ✅ **API REST** para consultar datos
- ✅ **Notificaciones por email** (opcional)
- ✅ **Logs detallados** con Winston
- ✅ **Listo para Railway** con Dockerfile

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18 o superior
- npm o pnpm

### Instalación Local

```bash
# Clonar repositorio (o descargar archivos)
cd boe-subastas-scraper

# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npx playwright install chromium

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus configuraciones
nano .env

# Ejecutar scraper una vez (modo test)
npm run scrape

# Iniciar aplicación completa (API + Scheduler)
npm start

# Ejecutar scraper inmediatamente al iniciar
npm start -- --now
```

## ⚙️ Configuración

Edita el archivo `.env` con tus parámetros:

```env
# Configuración del Scraper
NODE_ENV=production
PORT=3000

# Filtros de búsqueda
LOCALIDAD_FILTRO=Rivas Vaciamadrid
PROVINCIA_FILTRO=Madrid

# Programación (formato cron)
# Por defecto: 9 AM todos los días
SCRAPER_SCHEDULE=0 9 * * *

# Base de datos
DATABASE_PATH=./data/subastas.db

# Notificaciones por email (opcional)
EMAIL_NOTIFICATIONS=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
NOTIFY_EMAIL=destino@email.com

# Configuración de Playwright
HEADLESS=true
BROWSER_TIMEOUT=30000

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/scraper.log
```

### Formato Cron

El formato de `SCRAPER_SCHEDULE` sigue la sintaxis estándar de cron:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Día de la semana (0-6, 0=Domingo)
│ │ │ └───── Mes (1-12)
│ │ └─────── Día del mes (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

**Ejemplos:**
- `0 9 * * *` - Todos los días a las 9:00 AM
- `0 */6 * * *` - Cada 6 horas
- `0 9,18 * * *` - A las 9:00 AM y 6:00 PM
- `0 9 * * 1-5` - Lunes a viernes a las 9:00 AM

## 📡 API REST

Una vez iniciada la aplicación, la API estará disponible en `http://localhost:3000`

### Endpoints

#### `GET /health`
Health check del servicio

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T08:30:00.000Z",
  "service": "boe-subastas-scraper"
}
```

#### `GET /api/subastas`
Listar todas las subastas almacenadas

**Respuesta:**
```json
{
  "success": true,
  "total": 103,
  "data": [...]
}
```

#### `GET /api/subastas/:id`
Obtener detalle de una subasta específica con sus bienes

**Ejemplo:** `GET /api/subastas/SUB-JA-2016-13134`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id_subasta": "SUB-JA-2016-13134",
    "tipo": "Judicial",
    "estado": "Finalizada",
    "bienes": [...]
  }
}
```

#### `GET /api/runs`
Historial de ejecuciones del scraper

**Query params:**
- `limit` (opcional): Número de ejecuciones a devolver (default: 10)

**Respuesta:**
```json
{
  "success": true,
  "total": 10,
  "data": [
    {
      "id": 1,
      "start_time": "2026-02-16T09:00:00.000Z",
      "end_time": "2026-02-16T09:05:30.000Z",
      "status": "success",
      "total_found": 103,
      "new_items": 5,
      "errors": 0
    }
  ]
}
```

#### `POST /api/scrape`
Ejecutar scraper manualmente

**Respuesta:**
```json
{
  "success": true,
  "message": "Scraper iniciado en segundo plano"
}
```

## 📊 Estructura de Datos

### Tabla `subastas`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_subasta | TEXT | ID único (ej: SUB-JA-2016-13134) |
| tipo | TEXT | Tipo de subasta (Judicial, Notarial, etc.) |
| organismo | TEXT | Juzgado o notaría responsable |
| expediente | TEXT | Número de expediente |
| estado | TEXT | Estado actual de la subasta |
| descripcion_breve | TEXT | Descripción corta del bien |
| fecha_inicio | TEXT | Fecha de inicio |
| fecha_conclusion | TEXT | Fecha de conclusión |
| valor_subasta | REAL | Valor de salida en euros |
| tasacion | REAL | Tasación en euros |
| anuncio_boe | TEXT | Referencia BOE |
| url_detalle | TEXT | URL completa de la subasta |

### Tabla `bienes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id_subasta | TEXT | Relación con subasta |
| tipo | TEXT | Tipo de bien (Vivienda, Local, etc.) |
| direccion | TEXT | Dirección completa |
| localidad | TEXT | Localidad (Rivas Vaciamadrid) |
| provincia | TEXT | Provincia (Madrid) |
| codigo_postal | TEXT | Código postal |
| referencia_catastral | TEXT | Referencia catastral |
| idufir | TEXT | Identificador único de finca |

## 🐳 Despliegue en Railway

### Opción 1: Desde GitHub

1. Sube el código a un repositorio GitHub
2. Ve a [Railway](https://railway.app)
3. Crea un nuevo proyecto
4. Conecta tu repositorio GitHub
5. Railway detectará automáticamente el `Dockerfile`
6. Configura las variables de entorno en Railway:
   - `NODE_ENV=production`
   - `LOCALIDAD_FILTRO=Rivas Vaciamadrid`
   - `SCRAPER_SCHEDULE=0 9 * * *`
   - (Opcional) Variables de email si quieres notificaciones
7. Despliega

### Opción 2: Desde Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up

# Configurar variables de entorno
railway variables set NODE_ENV=production
railway variables set LOCALIDAD_FILTRO="Rivas Vaciamadrid"
railway variables set SCRAPER_SCHEDULE="0 9 * * *"
```

### Configurar Volumen para Persistencia (Recomendado)

Para que la base de datos SQLite persista entre reinicios:

1. En Railway, ve a tu servicio
2. Ve a "Settings" → "Volumes"
3. Crea un nuevo volumen:
   - **Mount Path:** `/app/data`
4. Redespliega el servicio

## 📁 Estructura del Proyecto

```
boe-subastas-scraper/
├── src/
│   ├── index.js          # Punto de entrada principal
│   ├── scraper.js        # Lógica del scraper con Playwright
│   ├── database.js       # Gestión de SQLite
│   ├── scheduler.js      # Programación con node-cron
│   ├── api.js            # API REST con Express
│   ├── exporter.js       # Exportación a JSON/Excel
│   ├── notifier.js       # Notificaciones por email
│   └── logger.js         # Configuración de logs
├── data/                 # Base de datos y exportaciones
│   ├── subastas.db       # SQLite database
│   ├── subastas_latest.json
│   └── subastas_latest.xlsx
├── logs/                 # Archivos de log
│   ├── scraper.log
│   └── error.log
├── config/               # Configuraciones adicionales
├── .env                  # Variables de entorno (no subir a git)
├── .env.example          # Plantilla de variables
├── package.json          # Dependencias npm
├── Dockerfile            # Configuración Docker
├── railway.json          # Configuración Railway
└── README.md             # Este archivo
```

## 🔧 Desarrollo

### Scripts disponibles

```bash
# Iniciar aplicación completa
npm start

# Ejecutar solo el scraper una vez
npm run scrape

# Modo desarrollo con auto-reload
npm run dev

# Ejecutar scraper inmediatamente al iniciar
npm start -- --now
```

### Logs

Los logs se guardan en:
- `logs/scraper.log` - Logs generales
- `logs/error.log` - Solo errores

En desarrollo, también se muestran en consola con colores.

## 📧 Configuración de Email (Gmail)

Para usar Gmail como servidor SMTP:

1. Activa la verificación en 2 pasos en tu cuenta Google
2. Genera una "Contraseña de aplicación":
   - Ve a [myaccount.google.com](https://myaccount.google.com)
   - Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
   - Genera una nueva contraseña
3. Usa esa contraseña en `SMTP_PASS` (no tu contraseña normal)

```env
EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # Contraseña de aplicación
NOTIFY_EMAIL=destino@email.com
```

## 🛠️ Tecnologías Utilizadas

- **Node.js 18+** - Runtime de JavaScript
- **Playwright** - Automatización de navegador
- **Express** - Framework web para API REST
- **better-sqlite3** - Base de datos SQLite
- **node-cron** - Programación de tareas
- **ExcelJS** - Exportación a Excel
- **Nodemailer** - Envío de emails
- **Winston** - Sistema de logs
- **dotenv** - Gestión de variables de entorno

## 📝 Notas Importantes

### Sobre el Scraping

- El scraper respeta el servidor del BOE con pausas entre peticiones
- Solo extrae datos públicos disponibles en subastas.boe.es
- Evita duplicados verificando la base de datos antes de insertar
- Guarda logs detallados de cada ejecución

### Sobre Railway

- Railway puede hibernar servicios gratuitos tras inactividad
- Configura un volumen para persistir la base de datos
- El health check mantiene el servicio activo
- Considera los límites de uso del plan gratuito

### Limitaciones

- Playwright requiere recursos significativos (RAM ~500MB)
- La primera ejecución puede tardar varios minutos
- El scraping depende de la estructura HTML del BOE (puede cambiar)

## 🐛 Troubleshooting

### Error: "Chromium not found"

```bash
npx playwright install chromium
```

### Error: "ECONNREFUSED" o timeouts

- Verifica tu conexión a internet
- Aumenta `BROWSER_TIMEOUT` en `.env`
- El BOE puede estar temporalmente inaccesible

### Base de datos bloqueada

```bash
# Eliminar archivos de bloqueo
rm data/*.db-shm data/*.db-wal
```

### Railway: Out of Memory

- Reduce la frecuencia del scraper
- Considera un plan de pago con más RAM
- Optimiza el código para usar menos memoria

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👤 Autor

Creado para automatizar la búsqueda de subastas del BOE en Rivas Vaciamadrid

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para problemas o preguntas:
- Revisa los logs en `logs/scraper.log`
- Verifica la configuración en `.env`
- Consulta la documentación de Railway

---

**⚠️ Disclaimer:** Esta herramienta extrae datos públicos del BOE. Úsala de manera responsable y respetando los términos de uso del portal oficial.
