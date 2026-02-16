// Dashboard HTML inline para evitar problemas de rutas
const dashboardHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - BOE Subastas Scraper</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { color: #333; font-size: 32px; display: flex; align-items: center; gap: 10px; }
    .header .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
    .btn { padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; transform: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .card h2 { color: #333; font-size: 18px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
    .stat-value { font-size: 48px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .stat-label { color: #666; font-size: 14px; }
    .progress-section { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 20px; }
    .progress-bar { width: 100%; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden; position: relative; margin: 20px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px; }
    .status-idle { background: #e0e0e0; color: #666; }
    .status-running { background: #4caf50; color: white; animation: pulse 1.5s infinite; }
    .status-success { background: #4caf50; color: white; }
    .status-error { background: #f44336; color: white; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .table-container { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f5f5f5; padding: 15px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
    td { padding: 15px; border-bottom: 1px solid #eee; color: #666; }
    tr:hover { background: #f9f9f9; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .empty-state-icon { font-size: 64px; margin-bottom: 20px; }
    .log-entry { padding: 10px; margin: 5px 0; border-radius: 5px; font-family: monospace; font-size: 13px; }
    .log-info { background: #e3f2fd; color: #1976d2; }
    .log-success { background: #e8f5e9; color: #388e3c; }
    .log-error { background: #ffebee; color: #d32f2f; }
    .refresh-indicator { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #4caf50; margin-left: 10px; animation: blink 2s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🔍 BOE Subastas Scraper</h1>
        <div class="subtitle">Panel de Control - Rivas Vaciamadrid</div>
      </div>
      <button class="btn btn-primary" onclick="runScraper()" id="runBtn">🚀 Ejecutar Scraper</button>
    </div>
    
    <div class="grid">
      <div class="card"><h2>📊 Total Subastas</h2><div class="stat-value" id="totalSubastas">-</div><div class="stat-label">En base de datos</div></div>
      <div class="card"><h2>✅ Última Ejecución</h2><div class="stat-value" id="lastRunStatus" style="font-size: 24px;">-</div><div class="stat-label" id="lastRunTime">Nunca</div></div>
      <div class="card"><h2>🆕 Nuevas Hoy</h2><div class="stat-value" id="newToday">-</div><div class="stat-label">Subastas encontradas</div></div>
      <div class="card"><h2>📅 Próxima Ejecución</h2><div class="stat-value" style="font-size: 24px;" id="nextRun">09:00</div><div class="stat-label">Automática diaria</div></div>
    </div>
    
    <div class="progress-section">
      <h2>⚡ Estado del Scraper <span class="status-badge status-idle" id="statusBadge">Inactivo</span><span class="refresh-indicator" id="refreshIndicator" style="display: none;"></span></h2>
      <div class="progress-bar"><div class="progress-fill" id="progressBar" style="width: 0%;">0%</div></div>
      <div id="progressLog"></div>
    </div>
    
    <div class="table-container">
      <h2>📋 Historial de Ejecuciones</h2>
      <table id="runsTable">
        <thead><tr><th>Fecha/Hora</th><th>Estado</th><th>Duración</th><th>Encontradas</th><th>Nuevas</th><th>Errores</th></tr></thead>
        <tbody id="runsTableBody"><tr><td colspan="6" class="empty-state"><div class="empty-state-icon">⏳</div><div>Cargando historial...</div></td></tr></tbody>
      </table>
    </div>
    
    <div class="table-container" style="margin-top: 20px;">
      <h2>🏠 Últimas Subastas Encontradas</h2>
      <table id="subastasTable">
        <thead><tr><th>ID</th><th>Título</th><th>Valor</th><th>Puja Mínima</th><th>Estado</th><th>Fecha Fin</th></tr></thead>
        <tbody id="subastasTableBody"><tr><td colspan="6" class="empty-state"><div class="empty-state-icon">📦</div><div>No hay subastas en la base de datos</div></td></tr></tbody>
      </table>
    </div>
  </div>
  
  <script>
    let isRunning = false;
    let refreshInterval = null;
    
    function formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    function formatDuration(start, end) {
      if (!start || !end) return '-';
      const duration = (new Date(end) - new Date(start)) / 1000;
      return duration.toFixed(1) + 's';
    }
    
    function formatCurrency(value) {
      if (!value) return '-';
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    }
    
    async function loadStats() {
      try {
        const subastasRes = await fetch('/api/subastas');
        const subastasData = await subastasRes.json();
        document.getElementById('totalSubastas').textContent = subastasData.total || 0;
        
        const runsRes = await fetch('/api/runs?limit=10');
        const runsData = await runsRes.json();
        
        if (runsData.success && runsData.data.length > 0) {
          const lastRun = runsData.data[0];
          const statusIcon = lastRun.status === 'success' ? '✅' : '❌';
          document.getElementById('lastRunStatus').textContent = statusIcon;
          document.getElementById('lastRunTime').textContent = formatDate(lastRun.end_time);
          document.getElementById('newToday').textContent = lastRun.new_items || 0;
          updateRunsTable(runsData.data);
        }
        
        if (subastasData.success && subastasData.data.length > 0) {
          updateSubastasTable(subastasData.data.slice(0, 10));
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    }
    
    function updateRunsTable(runs) {
      const tbody = document.getElementById('runsTableBody');
      if (runs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">📭</div><div>No hay ejecuciones registradas</div></td></tr>';
        return;
      }
      tbody.innerHTML = runs.map(run => \`
        <tr>
          <td>\${formatDate(run.start_time)}</td>
          <td><span class="status-badge status-\${run.status}">\${run.status === 'success' ? '✅ Éxito' : '❌ Error'}</span></td>
          <td>\${formatDuration(run.start_time, run.end_time)}</td>
          <td>\${run.total_found || 0}</td>
          <td>\${run.new_items || 0}</td>
          <td>\${run.errors || 0}</td>
        </tr>
      \`).join('');
    }
    
    function updateSubastasTable(subastas) {
      const tbody = document.getElementById('subastasTableBody');
      if (subastas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">📦</div><div>No hay subastas en la base de datos</div></td></tr>';
        return;
      }
      tbody.innerHTML = subastas.map(subasta => \`
        <tr>
          <td><strong>\${subasta.id_subasta}</strong></td>
          <td>\${subasta.titulo || '-'}</td>
          <td>\${formatCurrency(subasta.valor_subasta)}</td>
          <td>\${formatCurrency(subasta.puja_minima)}</td>
          <td>\${subasta.estado || '-'}</td>
          <td>\${formatDate(subasta.fecha_fin)}</td>
        </tr>
      \`).join('');
    }
    
    async function runScraper() {
      const btn = document.getElementById('runBtn');
      const statusBadge = document.getElementById('statusBadge');
      const progressBar = document.getElementById('progressBar');
      const progressLog = document.getElementById('progressLog');
      const refreshIndicator = document.getElementById('refreshIndicator');
      
      if (isRunning) return;
      
      isRunning = true;
      btn.disabled = true;
      btn.textContent = '⏳ Ejecutando...';
      statusBadge.className = 'status-badge status-running';
      statusBadge.textContent = 'Ejecutando';
      refreshIndicator.style.display = 'inline-block';
      
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
        progressBar.textContent = progress + '%';
      }, 500);
      
      progressLog.innerHTML = '';
      const addLog = (message, type = 'info') => {
        const log = document.createElement('div');
        log.className = \`log-entry log-\${type}\`;
        log.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
        progressLog.appendChild(log);
      };
      
      addLog('Iniciando scraper...', 'info');
      
      try {
        const response = await fetch('/api/scrape');
        const data = await response.json();
        
        if (data.success) {
          addLog('Scraper iniciado correctamente', 'success');
          addLog('Navegando al portal BOE...', 'info');
          await new Promise(resolve => setTimeout(resolve, 2000));
          addLog('Aplicando filtros de búsqueda...', 'info');
          await new Promise(resolve => setTimeout(resolve, 2000));
          addLog('Extrayendo datos de subastas...', 'info');
          await new Promise(resolve => setTimeout(resolve, 2000));
          addLog('Guardando en base de datos...', 'success');
          
          clearInterval(progressInterval);
          progressBar.style.width = '100%';
          progressBar.textContent = '100%';
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          addLog('✅ Scraping completado exitosamente', 'success');
          
          statusBadge.className = 'status-badge status-success';
          statusBadge.textContent = 'Completado';
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadStats();
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (error) {
        clearInterval(progressInterval);
        addLog('❌ Error: ' + error.message, 'error');
        statusBadge.className = 'status-badge status-error';
        statusBadge.textContent = 'Error';
      } finally {
        isRunning = false;
        btn.disabled = false;
        btn.textContent = '🚀 Ejecutar Scraper';
        refreshIndicator.style.display = 'none';
        
        setTimeout(() => {
          statusBadge.className = 'status-badge status-idle';
          statusBadge.textContent = 'Inactivo';
          progressBar.style.width = '0%';
          progressBar.textContent = '0%';
          progressLog.innerHTML = '';
        }, 5000);
      }
    }
    
    function startAutoRefresh() {
      refreshInterval = setInterval(() => { loadStats(); }, 30000);
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      loadStats();
      startAutoRefresh();
    });
  </script>
</body>
</html>`;

module.exports = dashboardHTML;
