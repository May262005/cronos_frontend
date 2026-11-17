<template>
  <div class="dashboard-view">
    
    <!-- HEADER SENCILLO -->
    <header class="page-header">
      <div>
        <h1>Resumen General</h1>
        <p>Estadísticas del sistema y estado actual.</p>
      </div>
      <div class="date-box">
        <span class="date">{{ fechaActual }}</span>
        <span class="time">{{ horaActual }}</span>
      </div>
    </header>

    <!-- TARJETAS DE ESTADÍSTICAS (Datos de prueba por ahora) -->
    <div class="stats-grid">
      
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Total Alumnos</span>
          <div class="stat-icon blue"><i class="fas fa-user-graduate"></i></div>
        </div>
        <div class="stat-value">1,248</div>
        <div class="stat-desc">Estudiantes registrados en el sistema</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Total Profesores</span>
          <div class="stat-icon purple"><i class="fas fa-chalkboard-teacher"></i></div>
        </div>
        <div class="stat-value">84</div>
        <div class="stat-desc">Docentes activos en la plantilla</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Grupos Activos</span>
          <div class="stat-icon orange"><i class="fas fa-users"></i></div>
        </div>
        <div class="stat-value">32</div>
        <div class="stat-desc">Secciones y clases en curso</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Materias</span>
          <div class="stat-icon green"><i class="fas fa-book"></i></div>
        </div>
        <div class="stat-value">156</div>
        <div class="stat-desc">Asignaturas en el catálogo</div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const horaActual = ref('')
const fechaActual = ref('')
let timer = null

const actualizarReloj = () => {
  const ahora = new Date()
  horaActual.value = ahora.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: true
  })
  const opciones = { weekday: 'long', day: 'numeric', month: 'long' }
  let fecha = ahora.toLocaleDateString('es-MX', opciones)
  fechaActual.value = fecha.charAt(0).toUpperCase() + fecha.slice(1)
}

onMounted(() => {
  actualizarReloj()
  timer = setInterval(actualizarReloj, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.dashboard-view {
  max-width: 1100px;
  margin: 0 auto;
}

/* ===== HEADER ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  transition: border-color 0.3s;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 8px 0;
  text-align: left;
}

.page-header p {
  color: var(--text-muted);
  margin: 0;
  font-size: 1rem;
}

.date-box {
  text-align: right;
}

.date-box .date {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
}

.date-box .time {
  font-size: 0.9rem;
  color: #3ABEF9;
  font-weight: 700;
}

/* ===== TARJETAS DE ESTADÍSTICAS ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s, border-color 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

/* Colores de los iconos (Modo Claro) */
.stat-icon.blue { background: #f0f9ff; color: #0284c7; }
.stat-icon.purple { background: #f5f3ff; color: #7c3aed; }
.stat-icon.orange { background: #fff7ed; color: #ea580c; }
.stat-icon.green { background: #ecfdf5; color: #059669; }

/* Colores de los iconos (Modo Oscuro) */
[data-theme="dark"] .stat-icon.blue { background: rgba(2, 132, 199, 0.2); color: #38bdf8; }
[data-theme="dark"] .stat-icon.purple { background: rgba(124, 58, 237, 0.2); color: #a78bfa; }
[data-theme="dark"] .stat-icon.orange { background: rgba(234, 88, 12, 0.2); color: #fb923c; }
[data-theme="dark"] .stat-icon.green { background: rgba(5, 150, 105, 0.2); color: #34d399; }

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-desc {
  font-size: 0.8rem;
  color: var(--text-light);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .date-box { text-align: left; }
}
</style>