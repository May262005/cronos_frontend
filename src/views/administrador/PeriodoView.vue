<template>
  <div class="app-layout">
    <Teleport to="body">
      <div v-if="cargandoAccion" class="cronos-loading">
        <div class="cronos-spinner"></div>
        <p>Procesando solicitud...</p>
      </div>
    </Teleport>

    <main class="profesores-main">
      <!-- HEADER -->
      <div class="profesores-header">
        <button @click="goBack" class="btn-back-icon" title="Volver al Dashboard">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-text">
          <div class="header-eyebrow">
            <span class="dot"></span> CALENDARIO ESCOLAR
          </div>
          <h1>Ciclos y Períodos</h1>
          <p>Gestión de etapas y calendarios institucionales</p>
        </div>
        <div class="header-spacer"></div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="tabs">
          <button class="tab active">
            <i class="fas fa-calendar-alt"></i>
            <span>Períodos</span>
            <span class="tab-count">{{ periodos.length }}</span>
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="btn-primary" @click="abrirFormularioNuevo">
            <i class="fas fa-plus"></i> Nuevo Período
          </button>
        </div>
      </div>

      <!-- BUSCADOR -->
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input
          v-model="terminoBusqueda"
          @input="paginaActual = 1"
          type="text"
          placeholder="Buscar por nombre del período…"
        />
        <button v-if="terminoBusqueda" @click="limpiarBusqueda" class="clear-search">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-container">
        <div class="spinner-modern"></div>
        <p>Cargando períodos…</p>
      </div>

      <!-- TABLA -->
      <div class="tabla-wrap" v-else-if="periodosFiltrados.length > 0">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nombre del Período</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estado</th>
              <th class="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="periodo in periodosPaginados" :key="periodo.id">
              <td>
                <div class="persona">
                  <div class="avatar" :style="{ backgroundColor: periodo.activo ? '#10b981' : '#94a3b8' }">
                    <i class="fas fa-calendar-alt" style="font-size: 0.9rem;"></i>
                  </div>
                  <div class="persona-info">
                    <span class="persona-nombre">{{ periodo.nombre }}</span>
                    <span class="persona-titulo">Ciclo escolar</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="chip chip-prof"><i class="far fa-calendar-alt"></i> {{ periodo.fecha_inicio }}</span>
              </td>
              <td>
                <span class="chip chip-prof"><i class="far fa-calendar-check"></i> {{ periodo.fecha_fin }}</span>
              </td>
              <td>
                <span :class="['chip', periodo.activo ? 'chip-division' : 'chip-turno']">
                  <i :class="periodo.activo ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                  {{ periodo.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="col-acciones">
                <div class="acciones">
                  <button @click="editarPeriodo(periodo)" title="Editar">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="eliminarPeriodo(periodo.id)" title="Eliminar" class="danger">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINACIÓN -->
        <footer class="pagination">
          <div class="pagination-info">
            Mostrando
            <b>{{ rangoInicio }}–{{ rangoFin }}</b>
            de
            <b>{{ totalRegistros }}</b>
            {{ totalRegistros === 1 ? 'período' : 'períodos' }}
          </div>

          <div class="pagination-controls">
            <label class="page-size">
              <span>Filas:</span>
              <select v-model.number="porPagina" @change="paginaActual = 1">
                <option :value="8">8</option>
                <option :value="15">15</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </label>

            <button class="page-btn" :disabled="paginaActual === 1" @click="paginaActual = 1" title="Primera">
              <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="page-btn" :disabled="paginaActual === 1" @click="paginaActual--" title="Anterior">
              <i class="fas fa-angle-left"></i>
            </button>

            <template v-for="(p, idx) in paginasVisibles" :key="idx">
              <span v-if="p === '...'" class="page-dots">…</span>
              <button v-else :class="['page-btn', { active: p === paginaActual }]" @click="paginaActual = p">
                {{ p }}
              </button>
            </template>

            <button class="page-btn" :disabled="paginaActual === totalPaginas" @click="paginaActual++" title="Siguiente">
              <i class="fas fa-angle-right"></i>
            </button>
            <button class="page-btn" :disabled="paginaActual === totalPaginas" @click="paginaActual = totalPaginas" title="Última">
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>
        </footer>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-calendar-alt"></i>
        </div>
        <h3>Sin registros aún</h3>
        <p>Comienza agregando tu primer ciclo escolar al sistema.</p>
        <button class="btn-primary" @click="abrirFormularioNuevo">
          <i class="fas fa-plus"></i> Crear el primero
        </button>
      </div>
    </main>

    <!-- MODAL -->
    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-modal">
        <div class="modal-header">
          <div class="modal-eyebrow">{{ modoEdicion ? 'EDITAR' : 'NUEVO REGISTRO' }}</div>
          <h2>{{ modoEdicion ? 'Actualizar' : 'Registrar' }} período</h2>
          <button class="close-btn" @click="cerrarFormulario">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="guardarPeriodo">
            <div class="form-grid">
              <div class="field full-width">
                <label>Nombre del Período *</label>
                <input v-model="formPeriodo.nombre" type="text" placeholder="Ej. SEP-DIC 2026" required />
              </div>

              <div class="field">
                <label>Fecha de Inicio *</label>
                <input v-model="formPeriodo.fecha_inicio" type="date" required />
              </div>

              <div class="field">
                <label>Fecha de Fin *</label>
                <input v-model="formPeriodo.fecha_fin" type="date" required />
              </div>

              <div class="field full-width">
                <label>Estado del Período *</label>
                <select v-model="formPeriodo.activo" required>
                  <option :value="true">Activo (En curso)</option>
                  <option :value="false">Inactivo (Concluido / Futuro)</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="cerrarFormulario">Cancelar</button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-check"></i>
                {{ modoEdicion ? 'Guardar cambios' : 'Crear registro' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from '../../utils/axios-config'
import '../../assets/styles.css'
import Swal from 'sweetalert2'

const router = useRouter()
const goBack = () => router.back()
const API_URL = `/periodos`

/* ============ ESTADO ============ */
const periodos = ref([])
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const periodoEditando = ref(null)
const terminoBusqueda = ref('')
const cargando = ref(false)
const cargandoAccion = ref(false)

/* ============ PAGINACIÓN ============ */
const paginaActual = ref(1)
const porPagina = ref(15)

/* ============ SWAL ============ */
const swalBase = {
  position: 'center',
  heightAuto: false,
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  backdrop: 'rgba(15, 23, 42, 0.45)',
  confirmButtonColor: '#3ABEF9',
  cancelButtonColor: '#94a3b8',
}
const mensajeDeError = (err, porDefecto) => {
  const m = err?.response?.data?.message
  return Array.isArray(m) ? m.join(', ') : m || porDefecto
}
const alertaExito = (titulo, texto = '') =>
  Swal.fire({ ...swalBase, icon: 'success', title: titulo, text: texto, timer: 2000, showConfirmButton: false })
const alertaError = (texto, titulo = 'Algo salió mal') =>
  Swal.fire({ ...swalBase, icon: 'error', title: titulo, text: texto, confirmButtonText: 'Entendido' })
const alertaConfirmar = (titulo, texto) =>
  Swal.fire({
    ...swalBase,
    icon: 'warning',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    reverseButtons: true,
  })

/* ============ FORM ============ */
const formPeriodo = ref({
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: true
})

/* ============ FILTRADO Y PAGINACIÓN ============ */
const periodosFiltrados = computed(() => {
  let filtrados = periodos.value
  if (terminoBusqueda.value.trim()) {
    const q = terminoBusqueda.value.toLowerCase()
    filtrados = filtrados.filter(p => p.nombre?.toLowerCase().includes(q))
  }
  return filtrados
})

const totalRegistros = computed(() => periodosFiltrados.value.length)
const totalPaginas = computed(() => Math.max(1, Math.ceil(totalRegistros.value / porPagina.value)))
const periodosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  return periodosFiltrados.value.slice(inicio, inicio + porPagina.value)
})

const rangoInicio = computed(() => totalRegistros.value === 0 ? 0 : (paginaActual.value - 1) * porPagina.value + 1)
const rangoFin = computed(() => Math.min(paginaActual.value * porPagina.value, totalRegistros.value))

const paginasVisibles = computed(() => {
  const total = totalPaginas.value
  const actual = paginaActual.value
  const delta = 1
  const rango = []
  const rangoConElipsis = []

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= actual - delta && i <= actual + delta)) {
      rango.push(i)
    }
  }

  let prev
  for (const page of rango) {
    if (prev) {
      if (page - prev === 2) rangoConElipsis.push(prev + 1)
      else if (page - prev > 2) rangoConElipsis.push('...')
    }
    rangoConElipsis.push(page)
    prev = page
  }
  return rangoConElipsis
})

watch([totalPaginas, porPagina], () => {
  if (paginaActual.value > totalPaginas.value) {
    paginaActual.value = totalPaginas.value
  }
})

const limpiarBusqueda = () => {
  terminoBusqueda.value = ''
  paginaActual.value = 1
}

/* ============ API ============ */
const obtenerPeriodos = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_URL)
    periodos.value = res.data
  } catch (error) {
    console.error(error)
    await alertaError('No se pudieron cargar los períodos')
  } finally {
    cargando.value = false
  }
}

/* ============ ACCIONES ============ */
const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  periodoEditando.value = null
  formPeriodo.value = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true
  }
  mostrarFormulario.value = true
}

const editarPeriodo = (periodo) => {
  modoEdicion.value = true
  periodoEditando.value = periodo.id
  formPeriodo.value = {
    nombre: periodo.nombre,
    fecha_inicio: periodo.fecha_inicio,
    fecha_fin: periodo.fecha_fin,
    activo: periodo.activo
  }
  mostrarFormulario.value = true
}

const guardarPeriodo = async () => {
  cargandoAccion.value = true
  const eraEdicion = modoEdicion.value
  try {
    if (eraEdicion) {
      await axios.patch(`${API_URL}/${periodoEditando.value}`, formPeriodo.value)
    } else {
      await axios.post(API_URL, formPeriodo.value)
    }
    cerrarFormulario()
    alertaExito(eraEdicion ? 'Actualizado' : 'Agregado')
    await obtenerPeriodos()
  } catch (error) {
    await alertaError(mensajeDeError(error, 'Error al guardar el período'))
  } finally {
    cargandoAccion.value = false
  }
}

const eliminarPeriodo = async (id) => {
  const confirm = await alertaConfirmar('¿Eliminar período?', 'Esta acción no se puede deshacer.')
  if (!confirm.isConfirmed) return
  cargandoAccion.value = true
  try {
    await axios.delete(`${API_URL}/${id}`)
    alertaExito('Eliminado')
    await obtenerPeriodos()
  } catch (error) {
    await alertaError(mensajeDeError(error, 'No se pudo eliminar el período'))
  } finally {
    cargandoAccion.value = false
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  periodoEditando.value = null
}

onMounted(() => {
  obtenerPeriodos()
})
</script>

<style>
.cronos-loading {
  position: fixed; inset: 0;
  background: var(--bg-body);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  z-index: 2000; color: var(--text-main); font-weight: 600;
  backdrop-filter: blur(4px);
  opacity: 0.9;
}
.cronos-spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--border-color); border-top-color: #3ABEF9;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style scoped>
/* ============ HEADER ============ */
.profesores-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
.btn-back-icon {
  width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color);
  border-radius: 10px; cursor: pointer; transition: all 0.15s ease; flex-shrink: 0;
}
.btn-back-icon:hover { color: #0284c7; border-color: #3ABEF9; }

.header-text { flex: 1; text-align: center; }
.header-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 700; color: #3ABEF9; letter-spacing: 0.12em; margin-bottom: 10px; }
.header-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.2); }

.header-text h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-main); margin: 0 0 6px; line-height: 1.1; }
.header-text p { color: var(--text-muted); font-size: 0.92rem; margin: 0; }
.header-spacer { width: 40px; flex-shrink: 0; }

/* ============ TOOLBAR ============ */
.toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px;
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
  margin-bottom: 16px; flex-wrap: wrap; box-shadow: var(--shadow-card);
  transition: background-color 0.3s, border-color 0.3s;
}
.tabs { display: flex; gap: 2px; padding: 4px; background: var(--bg-tab); border-radius: 9px; }
.tab { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border: none; background: transparent; border-radius: 6px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); cursor: default; font-family: inherit; }
.tab.active { background: var(--bg-card); color: var(--text-main); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); font-weight: 600; }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; background: #dbeafe; color: #1e40af; font-size: 0.7rem; font-weight: 700; border-radius: 5px; font-variant-numeric: tabular-nums; }
[data-theme="dark"] .tab-count { background: #1e3a8a; color: #bfdbfe; }
.tab.active .tab-count { background: rgba(58, 190, 249, 0.15); color: #0284c7; }
[data-theme="dark"] .tab.active .tab-count { background: rgba(58, 190, 249, 0.3); color: #7dd3fc; }

.toolbar-actions { display: flex; align-items: center; gap: 6px; padding-right: 4px; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; background: #3ABEF9; color: #ffffff; border: 1px solid #3ABEF9; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-primary:hover { background: #0284c7; border-color: #0284c7; }
.btn-secondary { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color); padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-secondary:hover { background: var(--bg-hover); color: var(--text-main); border-color: #3ABEF9; }

/* ============ BUSCADOR ============ */
.search-bar { position: relative; margin-bottom: 20px; }
.search-bar i { position: absolute; top: 50%; left: 16px; transform: translateY(-50%); color: var(--text-light); font-size: 0.9rem; pointer-events: none; }
.search-bar input {
  width: 100%; padding: 12px 44px 12px 44px; border: 1px solid var(--border-color); border-radius: 10px;
  font-size: 0.9rem; background: var(--bg-input); color: var(--text-main); outline: none; transition: all 0.15s ease;
  font-family: inherit; box-shadow: var(--shadow-card);
}
.search-bar input::placeholder { color: var(--text-light); }
.search-bar input:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12); }
.clear-search { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: transparent; border: none; color: var(--text-light); cursor: pointer; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.clear-search:hover { background: var(--bg-hover); color: var(--text-main); }

/* ============ TABLA ============ */
.tabla-wrap {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
  overflow: hidden; box-shadow: var(--shadow-card); transition: background-color 0.3s, border-color 0.3s;
}
.tabla { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.tabla thead { background: var(--bg-hover); color: var(--text-muted); }
.tabla th { text-align: left; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 14px 20px; border-bottom: 1px solid var(--border-color); }
.tabla td { padding: 16px 20px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr { transition: background 0.12s ease; }
.tabla tbody tr:hover { background: var(--bg-hover); }

.persona { display: flex; align-items: center; gap: 12px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #ffffff; flex-shrink: 0; letter-spacing: 0.03em; }

.persona-info { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.persona-nombre { font-weight: 600; color: var(--text-main); font-size: 0.9rem; }
.persona-titulo { font-size: 0.76rem; color: var(--text-muted); }

.chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.chip-division { background: #eff6ff; color: #1d4ed8; }
[data-theme="dark"] .chip-division { background: #1e3a8a; color: #bfdbfe; }
.chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #3ABEF9; flex-shrink: 0; }
.chip-turno { background: #e0f2fe; color: #075985; }
[data-theme="dark"] .chip-turno { background: #0c4a6e; color: #bae6fd; }
.chip-prof { background: #f1f5f9; color: #334155; }
[data-theme="dark"] .chip-prof { background: #334155; color: #e2e8f0; }

.col-acciones { text-align: right; }
.acciones { display: inline-flex; gap: 2px; opacity: 0.5; transition: opacity 0.15s ease; }
.tabla tbody tr:hover .acciones { opacity: 1; }
.acciones button { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); border-radius: 6px; cursor: pointer; transition: all 0.15s ease; font-size: 0.78rem; }
.acciones button:hover { background: var(--bg-hover); color: #0284c7; }
.acciones button.danger:hover { background: var(--bg-hover); color: #ef4444; }

/* ============ PAGINACIÓN ============ */
.pagination { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 20px; background: var(--bg-card); border-top: 1px solid var(--border-color); flex-wrap: wrap; }
.pagination-info { color: var(--text-muted); font-size: 0.82rem; }
.pagination-info b { color: var(--text-main); font-weight: 700; }
.pagination-controls { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.page-size { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.82rem; margin-right: 10px; }
.page-size select { padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-input); color: var(--text-main); font-size: 0.82rem; font-family: inherit; cursor: pointer; outline: none; }
.page-size select:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12); }

.page-btn { min-width: 32px; height: 32px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 600; font-family: inherit; font-variant-numeric: tabular-nums; transition: all 0.15s ease; }
.page-btn:hover:not(:disabled):not(.active) { background: var(--bg-hover); color: var(--text-main); border-color: var(--border-hover); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn.active { background: #3ABEF9; color: #ffffff; border-color: #3ABEF9; }
.page-btn.active:hover { background: #0284c7; border-color: #0284c7; }
.page-dots { padding: 0 4px; color: var(--text-light); font-weight: 700; }

/* ============ EMPTY STATE ============ */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 80px 24px; box-shadow: var(--shadow-card); }
.empty-icon { width: 64px; height: 64px; margin-bottom: 20px; background: var(--bg-hover); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #3ABEF9; font-size: 1.6rem; }
.empty-state h3 { font-size: 1.15rem; color: var(--text-main); margin: 0 0 8px; font-weight: 700; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; margin: 0 0 24px; max-width: 400px; }

/* ============ LOADING ============ */
.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: var(--text-muted); font-weight: 500; }
.spinner-modern { width: 34px; height: 34px; border: 3px solid var(--border-color); border-top-color: #3ABEF9; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }

/* ============ MODAL ============ */
.form-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.form-modal { background: var(--bg-card); width: 100%; max-width: 640px; border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-modal); animation: pop 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop { from { opacity: 0; transform: translateY(8px) scale(0.97); } to { opacity: 1; transform: none; } }
.modal-header { position: relative; padding: 22px 24px 18px; border-bottom: 1px solid var(--border-color); background: var(--bg-card); }
.modal-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #3ABEF9; }
.modal-eyebrow { font-size: 0.68rem; font-weight: 700; color: #3ABEF9; letter-spacing: 0.12em; margin-bottom: 6px; }
.modal-header h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.01em; }
.close-btn { position: absolute; top: 16px; right: 18px; background: transparent; border: none; font-size: 1.5rem; line-height: 1; color: var(--text-muted); cursor: pointer; padding: 0 4px; border-radius: 6px; transition: all 0.15s; }
.close-btn:hover { color: var(--text-main); background: var(--bg-hover); }
.modal-body { padding: 22px 24px; max-height: 72vh; overflow-y: auto; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; }
.field.full-width { grid-column: 1 / -1; }
.field label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.01em; }
.field input, .field select {
  padding: 10px 13px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.88rem; outline: none;
  background: var(--bg-input); transition: all 0.15s ease; color: var(--text-main); font-family: inherit;
}
.field input:focus, .field select:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12); }

.modal-footer { padding: 14px 24px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); background: var(--bg-card); margin: 22px -24px -22px; }

/* ============ RESPONSIVE ============ */
@media (max-width: 800px) {
  .profesores-main { padding: 24px 16px 48px; }
  .form-grid { grid-template-columns: 1fr; }
  .header-text h1 { font-size: 1.5rem; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-actions { justify-content: flex-end; }
  .tabla th, .tabla td { padding: 12px 14px; }
  .pagination { flex-direction: column; align-items: stretch; }
  .pagination-controls { justify-content: center; }
}
</style>