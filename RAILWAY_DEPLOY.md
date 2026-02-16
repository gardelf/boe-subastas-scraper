# 🚂 Guía de Despliegue en Railway

Esta guía te ayudará a desplegar el BOE Subastas Scraper en Railway paso a paso.

## Opción 1: Despliegue desde GitHub (Recomendado)

### Paso 1: Preparar el Repositorio

1. **Crea un repositorio en GitHub:**
   - Ve a [github.com/new](https://github.com/new)
   - Nombre: `boe-subastas-scraper`
   - Visibilidad: Privado (recomendado) o Público
   - No inicialices con README (ya tenemos uno)

2. **Sube el código:**

```bash
cd boe-subastas-scraper

# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit: BOE Subastas Scraper"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/boe-subastas-scraper.git

# Subir código
git branch -M main
git push -u origin main
```

### Paso 2: Crear Proyecto en Railway

1. **Ve a Railway:**
   - Accede a [railway.app](https://railway.app)
   - Inicia sesión con GitHub

2. **Crear nuevo proyecto:**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway a acceder a tus repositorios
   - Selecciona `boe-subastas-scraper`

3. **Railway detectará automáticamente:**
   - ✅ Dockerfile
   - ✅ railway.json
   - ✅ Configuración de build

### Paso 3: Configurar Variables de Entorno

En el dashboard de Railway, ve a tu servicio → **Variables**:

**Variables Obligatorias:**

```env
NODE_ENV=production
PORT=3000
LOCALIDAD_FILTRO=Rivas Vaciamadrid
PROVINCIA_FILTRO=Madrid
SCRAPER_SCHEDULE=0 9 * * *
DATABASE_PATH=./data/subastas.db
HEADLESS=true
BROWSER_TIMEOUT=30000
LOG_LEVEL=info
```

**Variables Opcionales (para notificaciones por email):**

```env
EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-app
NOTIFY_EMAIL=destino@email.com
```

### Paso 4: Configurar Volumen para Persistencia

**IMPORTANTE:** Sin volumen, perderás la base de datos al reiniciar.

1. En Railway, ve a tu servicio
2. Click en **Settings** → **Volumes**
3. Click en **+ New Volume**
4. Configuración:
   - **Mount Path:** `/app/data`
   - **Size:** 1 GB (suficiente)
5. Click en **Add**
6. Railway redesplegará automáticamente

### Paso 5: Desplegar

1. Railway iniciará el despliegue automáticamente
2. Monitorea los logs en la pestaña **Deployments**
3. Espera a ver: `✅ Build successful`
4. Luego: `✅ Deployment successful`

### Paso 6: Verificar Funcionamiento

1. **Obtener URL pública:**
   - Ve a **Settings** → **Networking**
   - Click en **Generate Domain**
   - Se generará una URL como: `https://tu-app.up.railway.app`

2. **Probar la API:**
   - Visita: `https://tu-app.up.railway.app/health`
   - Deberías ver: `{"status":"ok",...}`

3. **Ver la interfaz:**
   - Visita: `https://tu-app.up.railway.app/`
   - Verás la página de documentación de la API

4. **Ejecutar scraper manualmente:**
   ```bash
   curl -X POST https://tu-app.up.railway.app/api/scrape
   ```

5. **Ver logs en tiempo real:**
   - En Railway, pestaña **Logs**
   - Busca mensajes como: `Scraper ejecutado exitosamente`

---

## Opción 2: Despliegue con Railway CLI

### Paso 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### Paso 2: Login

```bash
railway login
```

Se abrirá tu navegador para autenticarte.

### Paso 3: Inicializar Proyecto

```bash
cd boe-subastas-scraper
railway init
```

Selecciona:
- "Create a new project"
- Nombre: `boe-subastas-scraper`

### Paso 4: Configurar Variables

```bash
# Variables obligatorias
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set LOCALIDAD_FILTRO="Rivas Vaciamadrid"
railway variables set PROVINCIA_FILTRO="Madrid"
railway variables set SCRAPER_SCHEDULE="0 9 * * *"
railway variables set DATABASE_PATH="./data/subastas.db"
railway variables set HEADLESS=true
railway variables set BROWSER_TIMEOUT=30000
railway variables set LOG_LEVEL=info

# Variables opcionales (email)
railway variables set EMAIL_NOTIFICATIONS=true
railway variables set SMTP_HOST=smtp.gmail.com
railway variables set SMTP_PORT=587
railway variables set SMTP_SECURE=false
railway variables set SMTP_USER="tu-email@gmail.com"
railway variables set SMTP_PASS="tu-contraseña-app"
railway variables set NOTIFY_EMAIL="destino@email.com"
```

### Paso 5: Crear Volumen

```bash
railway volume create --name subastas-data --mount-path /app/data
```

### Paso 6: Desplegar

```bash
railway up
```

Railway construirá y desplegará tu aplicación.

### Paso 7: Ver Logs

```bash
railway logs
```

### Paso 8: Abrir en Navegador

```bash
railway open
```

---

## Configuración Avanzada

### Programación Personalizada

Edita `SCRAPER_SCHEDULE` para cambiar la frecuencia:

```bash
# Cada 6 horas
railway variables set SCRAPER_SCHEDULE="0 */6 * * *"

# Dos veces al día (9 AM y 6 PM)
railway variables set SCRAPER_SCHEDULE="0 9,18 * * *"

# Solo días laborables a las 9 AM
railway variables set SCRAPER_SCHEDULE="0 9 * * 1-5"
```

### Múltiples Localidades

Para monitorear múltiples localidades, despliega múltiples instancias:

```bash
# Instancia 1: Rivas Vaciamadrid
railway variables set LOCALIDAD_FILTRO="Rivas Vaciamadrid"

# Instancia 2: Madrid (crear nuevo proyecto)
railway init
railway variables set LOCALIDAD_FILTRO="Madrid"
```

### Health Checks

Railway usa el endpoint `/health` para verificar que el servicio está activo:

- **Intervalo:** Cada 60 segundos
- **Timeout:** 100 segundos
- **Política de reinicio:** ON_FAILURE (hasta 10 intentos)

Configurado en `railway.json`.

---

## Monitoreo y Mantenimiento

### Ver Ejecuciones del Scraper

```bash
# Desde la API
curl https://tu-app.up.railway.app/api/runs
```

### Ver Subastas Encontradas

```bash
# Listar todas
curl https://tu-app.up.railway.app/api/subastas

# Ver una específica
curl https://tu-app.up.railway.app/api/subastas/SUB-JA-2016-13134
```

### Ejecutar Scraper Manualmente

```bash
curl -X POST https://tu-app.up.railway.app/api/scrape
```

### Descargar Base de Datos

Railway no permite acceso directo a volúmenes, pero puedes:

1. Agregar endpoint para exportar datos
2. Usar las exportaciones JSON/Excel automáticas
3. Consultar vía API

### Ver Logs en Tiempo Real

**Opción 1: Dashboard Web**
- Ve a railway.app → Tu proyecto → Logs

**Opción 2: CLI**
```bash
railway logs --follow
```

---

## Troubleshooting

### ❌ Build Failed

**Error común:** "Cannot find module 'playwright'"

**Solución:**
```bash
# Verifica que package.json tenga playwright
# Redespliega
railway up --detach
```

### ❌ Deployment Crashed

**Error común:** "Out of memory"

**Solución:**
1. Reduce la frecuencia del scraper
2. Considera plan de pago con más RAM
3. Optimiza `BROWSER_TIMEOUT`

### ❌ Database Locked

**Error común:** "database is locked"

**Solución:**
1. Asegúrate de tener volumen configurado
2. Reinicia el servicio:
   ```bash
   railway restart
   ```

### ❌ No se ejecuta el scraper

**Verificar:**
1. Logs: `railway logs`
2. Variables: `railway variables`
3. Zona horaria del cron (Europe/Madrid)

### ❌ Email no se envía

**Verificar:**
1. `EMAIL_NOTIFICATIONS=true`
2. Contraseña de aplicación de Gmail (no contraseña normal)
3. Logs para errores SMTP

---

## Costos Estimados

### Plan Gratuito (Hobby)
- **Incluye:** $5 de crédito/mes
- **Límites:**
  - 512 MB RAM
  - 1 GB disco
  - 100 GB transferencia
- **Suficiente para:** Scraper diario de Rivas Vaciamadrid

### Plan de Pago (Developer)
- **Costo:** $5/mes base + uso
- **Incluye:** $5 de crédito
- **Límites:** Más flexibles
- **Recomendado si:** Múltiples localidades o frecuencia alta

### Optimización de Costos

1. **Reduce frecuencia:** `0 9 * * *` (solo 1 vez al día)
2. **Usa volumen pequeño:** 1 GB es suficiente
3. **Headless mode:** `HEADLESS=true` (usa menos RAM)
4. **Monitorea uso:** Dashboard de Railway

---

## Comandos Útiles Railway CLI

```bash
# Ver estado del servicio
railway status

# Ver variables configuradas
railway variables

# Abrir dashboard web
railway open

# Conectar a shell del contenedor
railway shell

# Ver métricas
railway metrics

# Eliminar proyecto
railway delete
```

---

## Siguiente Paso: Automatización Completa

Una vez desplegado, el scraper:

1. ✅ Se ejecutará automáticamente según `SCRAPER_SCHEDULE`
2. ✅ Guardará datos en SQLite (persistente con volumen)
3. ✅ Exportará a JSON y Excel
4. ✅ Enviará emails si hay nuevas subastas (si está configurado)
5. ✅ Estará disponible vía API REST

**¡Tu scraper está listo para funcionar 24/7!** 🎉

---

## Recursos Adicionales

- [Documentación Railway](https://docs.railway.app)
- [Playwright Docs](https://playwright.dev)
- [Node-cron Syntax](https://www.npmjs.com/package/node-cron)
- [BOE Subastas](https://subastas.boe.es)

---

**¿Problemas?** Revisa los logs primero: `railway logs`
