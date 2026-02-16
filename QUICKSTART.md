# 🚀 Inicio Rápido - BOE Subastas Scraper

## ✅ Instalación Completada

El proyecto está listo para usar. Todas las dependencias están instaladas.

## 📝 Próximos Pasos

### 1. Probar el Scraper (Recomendado)

Antes de desplegar, prueba que todo funciona:

```bash
cd /home/ubuntu/boe-subastas-scraper

# Ejecutar prueba rápida (solo extrae datos, no guarda en BD)
node test-scraper.js

# Ejecutar scraper completo (guarda en BD y exporta)
npm run scrape
```

### 2. Configurar Variables de Entorno

Edita el archivo `.env` si quieres cambiar la configuración:

```bash
nano .env
```

Parámetros importantes:
- `LOCALIDAD_FILTRO`: Localidad a filtrar (default: Rivas Vaciamadrid)
- `SCRAPER_SCHEDULE`: Cuándo ejecutar (default: 9 AM diario)
- `EMAIL_NOTIFICATIONS`: Activar notificaciones (default: false)

### 3. Iniciar Aplicación Completa

```bash
# Iniciar servidor API + Scheduler
npm start

# O ejecutar scraper inmediatamente al iniciar
npm start -- --now
```

La aplicación estará disponible en: http://localhost:3000

### 4. Probar la API

Una vez iniciada la aplicación:

```bash
# Health check
curl http://localhost:3000/health

# Ver todas las subastas
curl http://localhost:3000/api/subastas

# Ejecutar scraper manualmente
curl -X POST http://localhost:3000/api/scrape

# Ver historial de ejecuciones
curl http://localhost:3000/api/runs
```

## 🐳 Desplegar en Railway

Sigue la guía completa en: **RAILWAY_DEPLOY.md**

Resumen rápido:

1. Sube el código a GitHub
2. Conecta Railway con tu repositorio
3. Configura variables de entorno
4. Crea volumen para `/app/data`
5. Despliega

## 📂 Archivos Generados

Después de ejecutar el scraper, encontrarás:

- **Base de datos**: `data/subastas.db`
- **Exportación JSON**: `data/subastas_latest.json`
- **Exportación Excel**: `data/subastas_latest.xlsx`
- **Logs**: `logs/scraper.log` y `logs/error.log`

## 🔍 Verificar que Funciona

Después de ejecutar el scraper:

```bash
# Ver cuántas subastas se encontraron
sqlite3 data/subastas.db "SELECT COUNT(*) FROM subastas;"

# Ver las últimas 5 subastas
sqlite3 data/subastas.db "SELECT id_subasta, estado, descripcion_breve FROM subastas LIMIT 5;"

# Ver logs
tail -f logs/scraper.log
```

## 📧 Configurar Notificaciones por Email (Opcional)

Si quieres recibir emails cuando se encuentren nuevas subastas:

1. Edita `.env`:
   ```env
   EMAIL_NOTIFICATIONS=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-contraseña-app
   NOTIFY_EMAIL=destino@email.com
   ```

2. Para Gmail, genera una "Contraseña de aplicación":
   - Ve a [myaccount.google.com](https://myaccount.google.com)
   - Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
   - Usa esa contraseña en `SMTP_PASS`

## 🛠️ Comandos Útiles

```bash
# Ver estructura del proyecto
tree -L 2 -I node_modules

# Ver logs en tiempo real
tail -f logs/scraper.log

# Limpiar base de datos (empezar de cero)
rm data/subastas.db

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Actualizar Playwright
npx playwright install chromium
```

## 📖 Documentación Completa

- **README.md**: Documentación completa del proyecto
- **RAILWAY_DEPLOY.md**: Guía detallada de despliegue en Railway
- **architecture_design.md**: Diseño técnico de la arquitectura
- **boe_research.md**: Investigación sobre la estructura del BOE

## ❓ Problemas Comunes

### "Cannot find module 'playwright'"
```bash
npm install
npx playwright install chromium
```

### "Database is locked"
```bash
rm data/*.db-shm data/*.db-wal
```

### El scraper no encuentra resultados
- Verifica que la localidad esté bien escrita
- Puede que no haya subastas activas en ese momento
- Revisa los logs para ver errores

### Timeout en navegación
- Aumenta `BROWSER_TIMEOUT` en `.env`
- Verifica tu conexión a internet

## 🎯 Siguiente Paso Recomendado

**Ejecuta una prueba completa:**

```bash
npm run scrape
```

Esto ejecutará el scraper una vez y guardará los resultados. Luego revisa:
- `data/subastas_latest.xlsx` - Ver subastas en Excel
- `logs/scraper.log` - Ver qué pasó

---

**¿Todo listo?** Despliega en Railway siguiendo **RAILWAY_DEPLOY.md** 🚀
