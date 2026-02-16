# 🔍 Parámetros de Búsqueda del Scraper BOE

## 📋 Configuración Actual

### Filtros Activos

| Parámetro | Valor Actual | Campo BOE | Descripción |
|-----------|--------------|-----------|-------------|
| **Localidad** | `Rivas Vaciamadrid` | `BIEN.LOCALIDAD` | Filtra subastas por localidad específica |
| **Provincia** | `Madrid` | `BIEN.COD_PROVINCIA` | (Documentado pero no aplicado actualmente) |

### Filtros NO Aplicados (Por Defecto)

| Parámetro | Valor | Estado |
|-----------|-------|--------|
| Tipo de subasta | Todos | ❌ Sin filtrar |
| Estado de la subasta | Cualquiera | ❌ Sin filtrar |
| Tipo de bien | Todos | ❌ Sin filtrar |
| Dirección | - | ❌ Sin filtrar |
| Código postal | - | ❌ Sin filtrar |
| Postura mínima | - | ❌ Sin filtrar |
| Cuenta expediente | - | ❌ Sin filtrar |
| ID Subasta | - | ❌ Sin filtrar |
| Acreedor | - | ❌ Sin filtrar |
| Fecha fin subasta | - | ❌ Sin filtrar |
| Fecha inicio subasta | - | ❌ Sin filtrar |

---

## 🎯 Filtros Disponibles en el Portal BOE

### 1. Tipo de Subasta
- ⚪ Todos (actual)
- ⚪ Judicial
- ⚪ Notarial
- ⚪ AEAT
- ⚪ Otras administraciones tributarias
- ⚪ Subastas administrativas generales

### 2. Estado de la Subasta
- ⚪ Cualquiera (actual)
- ⚪ Próxima apertura
- ⚪ Celebrándose
- ⚪ Suspendida
- ⚪ Cancelada
- ⚪ Concluida en Portal de Subastas
- ⚪ Finalizada por Autoridad Gestora

### 3. Tipo de Bien Subastado
- ⚪ Todos (actual)
- ⚪ Inmuebles
- ⚪ Vehículos
- ⚪ Otros bienes muebles

### 4. Domicilio del Inmueble
- **Dirección**: Campo libre
- **Código postal**: Campo libre
- **Localidad**: ✅ `Rivas Vaciamadrid` (aplicado)
- **Provincia**: Desplegable (32 opciones)

### 5. Otros Filtros
- **Postura mínima inferior a**: 50.000€, 100.000€, 150.000€, 200.000€
- **Cuenta expediente**: 5 campos numéricos (solo subastas judiciales)
- **ID Subasta**: Campo libre
- **Acreedor**: Campo libre
- **Fecha fin Subasta**: Rango de fechas (desde/hasta)
- **Fecha inicio Subasta**: Rango de fechas (desde/hasta)

---

## 💻 Implementación en el Código

### Archivo: `src/scraper.js`

```javascript
async applyFilters() {
  logger.info(`Aplicando filtro de localidad: ${this.localidad}`);
  
  // Rellenar campo de localidad
  const localidadInput = await this.page.locator('#BIEN\\.LOCALIDAD');
  await localidadInput.fill(this.localidad);
  
  logger.info('Filtros aplicados');
}
```

### Configuración: `.env`

```bash
# Filtros de búsqueda
LOCALIDAD_FILTRO=Rivas Vaciamadrid
PROVINCIA_FILTRO=Madrid  # Documentado pero no implementado
```

---

## 🔧 Cómo Modificar los Filtros

### Opción 1: Variables de Entorno (Recomendado)

Edita el archivo `.env`:

```bash
# Cambiar localidad
LOCALIDAD_FILTRO=Madrid

# O cualquier otra localidad
LOCALIDAD_FILTRO=Barcelona
LOCALIDAD_FILTRO=Valencia
```

### Opción 2: Modificar el Código

Edita `src/scraper.js` para agregar más filtros:

```javascript
async applyFilters() {
  logger.info(`Aplicando filtros...`);
  
  // 1. Localidad (ya implementado)
  const localidadInput = await this.page.locator('#BIEN\\.LOCALIDAD');
  await localidadInput.fill(this.localidad);
  
  // 2. NUEVO: Tipo de bien (Inmuebles)
  await this.page.locator('input[value="I"]').check(); // I=Inmuebles
  
  // 3. NUEVO: Estado (Celebrándose)
  await this.page.locator('input[value="CE"]').check(); // CE=Celebrándose
  
  // 4. NUEVO: Provincia
  await this.page.locator('#BIEN\\.COD_PROVINCIA').selectOption('32'); // 32=Madrid
  
  // 5. NUEVO: Postura mínima
  await this.page.locator('#SUBASTA\\.POSTURA_MINIMA_MINIMA_LOTES').selectOption('50000');
  
  logger.info('Filtros aplicados');
}
```

---

## 📊 Filtros Recomendados para Rivas Vaciamadrid

### Configuración Básica (Actual)
```javascript
Localidad: "Rivas Vaciamadrid"
```
**Resultado**: Busca TODAS las subastas en Rivas Vaciamadrid

### Configuración Recomendada para Inmuebles
```javascript
Localidad: "Rivas Vaciamadrid"
Tipo de bien: "Inmuebles"
Estado: "Celebrándose" o "Próxima apertura"
```
**Resultado**: Solo inmuebles activos en Rivas Vaciamadrid

### Configuración Ampliada para Madrid
```javascript
Provincia: "Madrid"
Tipo de bien: "Inmuebles"
Estado: "Celebrándose"
Postura mínima: "< 200.000€"
```
**Resultado**: Inmuebles asequibles en toda la provincia de Madrid

---

## 🎯 Ejemplos de Uso

### Caso 1: Solo Inmuebles en Rivas Vaciamadrid

**Modificar** `src/scraper.js`:

```javascript
async applyFilters() {
  logger.info(`Aplicando filtros para inmuebles en ${this.localidad}`);
  
  // Localidad
  await this.page.locator('#BIEN\\.LOCALIDAD').fill(this.localidad);
  
  // Solo inmuebles
  await this.page.locator('input[value="I"]').check();
  
  logger.info('Filtros aplicados: Inmuebles en ' + this.localidad);
}
```

### Caso 2: Subastas Activas (Celebrándose)

```javascript
async applyFilters() {
  logger.info(`Aplicando filtros para subastas activas en ${this.localidad}`);
  
  // Localidad
  await this.page.locator('#BIEN\\.LOCALIDAD').fill(this.localidad);
  
  // Solo celebrándose
  await this.page.locator('input[value="CE"]').check();
  
  logger.info('Filtros aplicados: Subastas activas en ' + this.localidad);
}
```

### Caso 3: Toda la Provincia de Madrid

```javascript
async applyFilters() {
  logger.info('Aplicando filtros para provincia de Madrid');
  
  // Provincia Madrid (código 32)
  await this.page.locator('#BIEN\\.COD_PROVINCIA').selectOption('32');
  
  // Solo inmuebles
  await this.page.locator('input[value="I"]').check();
  
  // Solo celebrándose
  await this.page.locator('input[value="CE"]').check();
  
  logger.info('Filtros aplicados: Inmuebles activos en Madrid');
}
```

---

## 🔍 Códigos de Valores del Portal BOE

### Tipo de Bien
- `T` = Todos
- `I` = Inmuebles
- `V` = Vehículos
- `M` = Otros bienes muebles

### Estado de Subasta
- `CE` = Celebrándose
- `PA` = Próxima apertura
- `SU` = Suspendida
- `CA` = Cancelada
- `CO` = Concluida en Portal de Subastas
- `FI` = Finalizada por Autoridad Gestora

### Tipo de Subasta
- `J` = Judicial
- `N` = Notarial
- `A` = AEAT
- `O` = Otras administraciones tributarias
- `G` = Subastas administrativas generales

### Provincias (ejemplos)
- `28` = Madrid
- `08` = Barcelona
- `46` = Valencia
- `41` = Sevilla
- `29` = Málaga

---

## ⚙️ Configuración Flexible

### Crear Filtros Configurables

Edita `.env` para agregar más opciones:

```bash
# Filtros de búsqueda
LOCALIDAD_FILTRO=Rivas Vaciamadrid
PROVINCIA_FILTRO=Madrid
TIPO_BIEN=I  # I=Inmuebles, V=Vehículos, M=Muebles, T=Todos
ESTADO_SUBASTA=CE  # CE=Celebrándose, PA=Próxima apertura
POSTURA_MINIMA=200000  # Euros
```

Luego modifica `src/scraper.js`:

```javascript
async applyFilters() {
  const localidad = process.env.LOCALIDAD_FILTRO;
  const tipoBien = process.env.TIPO_BIEN || 'T';
  const estado = process.env.ESTADO_SUBASTA;
  const posturaMin = process.env.POSTURA_MINIMA;
  
  logger.info(`Aplicando filtros: ${localidad}, tipo=${tipoBien}, estado=${estado}`);
  
  // Localidad
  if (localidad) {
    await this.page.locator('#BIEN\\.LOCALIDAD').fill(localidad);
  }
  
  // Tipo de bien
  if (tipoBien && tipoBien !== 'T') {
    await this.page.locator(`input[value="${tipoBien}"]`).check();
  }
  
  // Estado
  if (estado) {
    await this.page.locator(`input[value="${estado}"]`).check();
  }
  
  // Postura mínima
  if (posturaMin) {
    await this.page.locator('#SUBASTA\\.POSTURA_MINIMA_MINIMA_LOTES').selectOption(posturaMin);
  }
  
  logger.info('Filtros aplicados correctamente');
}
```

---

## 📝 Resumen

### Filtros Actuales
✅ **Localidad**: Rivas Vaciamadrid  
❌ **Otros filtros**: No aplicados

### Resultado Actual
Busca **TODAS** las subastas (inmuebles, vehículos, muebles) en Rivas Vaciamadrid, sin importar el estado (activas, finalizadas, canceladas, etc.)

### Recomendación
Para obtener mejores resultados, considera agregar:
1. **Tipo de bien**: `Inmuebles` (si solo te interesan propiedades)
2. **Estado**: `Celebrándose` o `Próxima apertura` (solo subastas activas)
3. **Postura mínima**: Según tu presupuesto

---

## 🚀 Próximos Pasos

¿Quieres que modifique el scraper para agregar más filtros? Puedo:

1. ✅ Agregar filtro de tipo de bien (Inmuebles/Vehículos/Muebles)
2. ✅ Agregar filtro de estado (Celebrándose/Próxima apertura)
3. ✅ Agregar filtro de postura mínima
4. ✅ Ampliar búsqueda a toda la provincia de Madrid
5. ✅ Hacer los filtros configurables desde `.env`

**Dime qué filtros adicionales necesitas y actualizo el código.**

---

*Documento generado el 16 de Febrero de 2026*
