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
            <span class="dot"></span> DIRECTORIO INSTITUCIONAL
          </div>
          <h1>{{ tituloVista }}</h1>
          <p>{{ subtituloVista }}</p>
        </div>
        <div class="header-spacer"></div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="cambiarTipoVista(t.key)"
            :class="['tab', { active: tipoVista === t.key }]"
          >
            <i :class="t.icon"></i>
            <span>{{ t.label }}</span>
            <span class="tab-count">{{ contarPorTipo(t.key) }}</span>
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="btn-icon" title="Descargar plantilla" @click="descargarPlantilla">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon" title="Importar Excel" @click="triggerFileInput">
            <i class="fas fa-file-arrow-up"></i>
          </button>
          <input
            type="file"
            ref="fileInputRef"
            style="display: none"
            accept=".xlsx, .xls, .csv"
            @change="procesarArchivoExcel"
          />
          <button class="btn-primary" @click="abrirFormularioNuevo">
            <i class="fas fa-plus"></i> Nuevo registro
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
          placeholder="Buscar por nombre, correo, título, división, turno o color…"
        />
        <button v-if="terminoBusqueda" @click="limpiarBusqueda" class="clear-search">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-container">
        <div class="spinner-modern"></div>
        <p>Cargando registros…</p>
      </div>

      <!-- TABLA -->
      <div class="tabla-wrap" v-else-if="profesoresFiltrados.length > 0">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>Contacto</th>
              <th>División</th>
              <th>Turnos</th>
              <th>Título profesional</th>
              <th>Color</th>
              <th class="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="profesor in profesoresPaginados" :key="profesor.id">
              <td data-label="Nombre">
                <div class="persona">
                  <div :class="['avatar', profesor.es_psicologo ? 'av-psi' : 'av-prof']">
                    {{ iniciales(profesor) }}
                  </div>
                  <div class="persona-info">
                    <span class="persona-nombre">
                      {{ profesor.usuario?.nombre }}
                      {{ profesor.usuario?.apellido_paterno }}
                      {{ profesor.usuario?.apellido_materno }}
                    </span>
                    <span class="persona-titulo">{{ profesor.titulo || 'Sin título registrado' }}</span>
                  </div>
                </div>
              </td>
              <td data-label="Contacto">
                <div class="contacto">
                  <span class="contacto-mail">{{ profesor.usuario?.correo_electronico || '—' }}</span>
                  <span v-if="profesor.telefono" class="contacto-tel">
                    <i class="fas fa-phone"></i> {{ profesor.telefono }}
                  </span>
                </div>
              </td>
              <td data-label="División">
                <span class="chip chip-division">
                  <span class="chip-dot"></span>
                  {{ profesor.division?.nombre || '—' }}
                </span>
              </td>
              <td data-label="Turnos">
                <div class="turnos-container">
                  <span v-for="t in profesor.turnos" :key="t.id" class="chip chip-turno">
                    {{ t.nombre }}
                  </span>
                  <span v-if="!profesor.turnos || profesor.turnos.length === 0" class="chip chip-turno">—</span>
                </div>
              </td>
              <td data-label="Título">
                <span :class="['chip', profesor.es_psicologo ? 'chip-psi' : 'chip-prof']">
                  <i :class="profesor.es_psicologo ? 'fas fa-brain' : 'fas fa-chalkboard-user'"></i>
                  {{ profesor.es_psicologo ? 'Psicólogo' : 'Profesor' }}
                </span>
              </td>
              <td data-label="Color">
                <div class="color-cell">
                  <span class="color-box" :style="{ backgroundColor: profesor.color_calendario || '#3ABEF9' }"></span>
                  <code class="color-hex">{{ profesor.color_calendario || '#3ABEF9' }}</code>
                </div>
              </td>
              <td data-label="Acciones" class="col-acciones">
                <div class="acciones">
                  <button @click="editarProfesor(profesor)" title="Editar">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="verDisponibilidad(profesor)" title="Horario">
                    <i class="fas fa-calendar-alt"></i>
                  </button>
                  <button @click="eliminarProfesor(profesor.id)" title="Eliminar" class="danger">
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
            Mostrando <b>{{ rangoInicio }}–{{ rangoFin }}</b> de
            <b>{{ totalRegistros }}</b>
            {{ totalRegistros === 1 ? 'registro' : 'registros' }}
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
        <div class="empty-icon"><i class="fas fa-inbox"></i></div>
        <h3>Sin registros aún</h3>
        <p>No hay {{ tipoVista === 'psicologos' ? 'psicólogos' : 'profesores' }} que coincidan con los filtros actuales.</p>
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
          <h2>{{ modoEdicion ? 'Actualizar' : 'Registrar' }} {{ formProfesor.es_psicologo ? 'psicólogo' : 'profesor' }}</h2>
          <button class="close-btn" @click="cerrarFormulario">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="guardarProfesor">
            <div class="form-grid">
              <div class="field full-width">
                <label class="toggle-card" :class="{ disabled: modoEdicion }">
                  <input type="checkbox" v-model="formProfesor.es_psicologo" :disabled="modoEdicion" />
                  <div class="toggle-content">
                    <span class="toggle-title">Psicólogo institucional</span>
                    <span class="toggle-desc">Habilita el rol clínico en lugar del docente.</span>
                  </div>
                </label>
              </div>

              <div class="field">
                <label>Nombre(s) *</label>
                <input v-model="formProfesor.nombre" type="text" placeholder="Ej. Carlos Alberto" required />
              </div>
              <div class="field">
                <label>Apellido paterno *</label>
                <input v-model="formProfesor.apellido_paterno" type="text" placeholder="Ej. Pérez" required />
              </div>
              <div class="field">
                <label>Apellido materno</label>
                <input v-model="formProfesor.apellido_materno" type="text" placeholder="Ej. Gómez" />
              </div>
              <div class="field">
                <label>Correo electrónico *</label>
                <input v-model="formProfesor.correo_electronico" type="email" placeholder="correo@institucion.edu" required />
              </div>
              <div class="field">
                <label>Teléfono</label>
                <input v-model="formProfesor.telefono" type="tel" placeholder="4421234567" maxlength="10" />
              </div>
              <div class="field">
                <label>Título profesional</label>
                <input v-model="formProfesor.titulo" type="text" placeholder="Ej. Dr., Mtro., Ing." maxlength="100" />
              </div>
              <div class="field">
                <label>División</label>
                <select v-model="formProfesor.id_division" :disabled="bloqueaDivisionTurno">
                  <option :value="null">Sin división</option>
                  <option v-for="d in divisiones" :key="d.id" :value="d.id">{{ d.nombre }}</option>
                </select>
                <small v-if="bloqueaDivisionTurno" class="hint">Asignado a tu división automáticamente.</small>
              </div>

              <!-- CHECKBOXES DE TURNOS -->
              <div class="field full-width" v-if="!bloqueaDivisionTurno">
                <label>Turnos asignados</label>
                <div class="checkbox-group">
                  <label v-for="t in turnos" :key="t.id" class="checkbox-card">
                    <input type="checkbox" :value="t.id" v-model="formProfesor.id_turnos" />
                    <span>{{ t.nombre }}</span>
                  </label>
                </div>
                <small class="hint">Puedes seleccionar más de un turno si el profesor lo requiere.</small>
              </div>
              
              <div class="field" v-else>
                <label>Turno</label>
                <input type="text" :value="turnos.find(t => t.id === idTurnoActual)?.nombre || 'Asignado'" disabled />
                <small class="hint">Asignado a tu turno automáticamente.</small>
              </div>

              <!-- SELECTOR DE COLOR -->
              <div class="field full-width">
                <label>Color del calendario</label>
                <div class="color-picker-wrapper">
                  <input type="color" v-model="formProfesor.color_calendario" class="color-pointer" />
                  <div class="color-preview" :style="{ backgroundColor: formProfesor.color_calendario }"></div>
                  <span class="color-hex-text">{{ formProfesor.color_calendario }}</span>
                  <input
                    type="text"
                    class="color-hex-input"
                    :value="formProfesor.color_calendario"
                    @input="onHexInput($event)"
                    maxlength="7"
                    spellcheck="false"
                    placeholder="#RRGGBB"
                  />
                </div>
                
                <div class="palette-grid">
                  <button
                    type="button"
                    v-for="c in paletaRapida"
                    :key="c"
                    class="palette-swatch"
                    :class="{ selected: formProfesor.color_calendario.toLowerCase() === c.toLowerCase() }"
                    :style="{ backgroundColor: c }"
                    :title="c"
                    @click="formProfesor.color_calendario = c"
                  ></button>
                </div>
                <small class="hint">
                  Haz clic en un color o escribe el HEX. Estos colores están en la plantilla de Excel.
                </small>
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
const API_URL = `/profesores`

/* ============ ESTADO ============ */
const profesores = ref([])
const divisiones = ref([])
const turnos = ref([])
const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const profesorEditando = ref(null)
const tipoVista = ref('todos')
const terminoBusqueda = ref('')
const cargando = ref(false)
const cargandoAccion = ref(false)
const fileInputRef = ref(null)

/* ============ PAGINACIÓN ============ */
const paginaActual = ref(1)
const porPagina = ref(15)

/* ============ CONTEXTO ============ */
const rol = localStorage.getItem('rol')
const idDivisionActual = computed(() => Number(localStorage.getItem('id_division') || 0))
const idTurnoActual = computed(() => Number(localStorage.getItem('id_turno') || 0))

const bloqueaDivisionTurno = computed(
  () => rol === 'admin' && idDivisionActual.value > 0 && idTurnoActual.value > 0
)

const tabs = [
  { key: 'todos', label: 'Todos', icon: 'fas fa-users' },
  { key: 'profesores', label: 'Profesores', icon: 'fas fa-chalkboard-user' },
  { key: 'psicologos', label: 'Psicólogos', icon: 'fas fa-brain' },
]

const tituloVista = computed(() =>
  tipoVista.value === 'todos'
    ? 'Directorio de personal'
    : tipoVista.value === 'profesores'
    ? 'Cuerpo docente'
    : 'Área de psicología'
)

const subtituloVista = computed(() => {
  const total = profesoresFiltrados.value.length
  const etiqueta = tipoVista.value === 'psicologos' ? 'psicólogos' : tipoVista.value === 'profesores' ? 'profesores' : 'registros'
  return `${total} ${etiqueta} · Administración de personal`
})

const iniciales = (p) => {
  const n = (p.usuario?.nombre || '').trim().charAt(0)
  const a = (p.usuario?.apellido_paterno || '').trim().charAt(0)
  return (n + a).toUpperCase() || '?'
}

const contarPorTipo = (key) => {
  if (key === 'todos') return profesores.value.length
  if (key === 'psicologos') return profesores.value.filter(p => p.es_psicologo).length
  return profesores.value.filter(p => !p.es_psicologo).length
}

const cambiarTipoVista = (key) => {
  tipoVista.value = key
  paginaActual.value = 1
}

const limpiarBusqueda = () => {
  terminoBusqueda.value = ''
  paginaActual.value = 1
}

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
const formProfesor = ref({
  nombre: '', apellido_paterno: '', apellido_materno: '', correo_electronico: '',
  telefono: '', titulo: '', es_psicologo: false, id_division: null, 
  id_turnos: [], 
  color_calendario: '#3ABEF9'
})

/* ============ PALETA DE COLORES Y HEX INPUT ============ */
const paletaRapida = [
  '#FEE2E2', '#FCA5A5', '#EF4444', '#B91C1C', '#7F1D1D',
  '#FFEDD5', '#FDBA74', '#F97316', '#C2410C', '#7C2D12',
  '#FEF3C7', '#FCD34D', '#F59E0B', '#B45309', '#78350F',
  '#FEF9C3', '#FDE047', '#EAB308', '#A16207', '#D9F99D',
  '#84CC16', '#3F6212', '#DCFCE7', '#86EFAC', '#22C55E',
  '#15803D', '#14532D', '#D1FAE5', '#6EE7B7', '#10B981',
  '#047857', '#CCFBF1', '#5EEAD4', '#14B8A6', '#0F766E',
  '#CFFAFE', '#67E8F9', '#06B6D4', '#0E7490', '#E0F2FE',
  '#7DD3FC', '#3ABEF9', '#0284C7', '#1E3A8A', '#E0E7FF',
  '#A5B4FC', '#6366F1', '#4338CA', '#F3E8FF', '#D8B4FE',
  '#A855F7', '#7E22CE', '#EDE9FE', '#A78BFA', '#8B5CF6',
  '#6D28D9', '#FCE7F3', '#F9A8D4', '#EC4899', '#BE185D',
  '#FDF2F8', '#F472B6', '#DB2777', '#F8FAFC', '#CBD5E1',
  '#64748B', '#334155', '#0F172A', '#FEF2F2', '#E7E5E4',
  '#A8A29E', '#78716C', '#44403C',
]

const onHexInput = (event) => {
  let v = event.target.value.trim()
  if (v && !v.startsWith('#')) v = '#' + v
  if (/^#([0-9A-Fa-f]{6})$/.test(v)) {
    formProfesor.value.color_calendario = v.toUpperCase()
  }
  event.target.value = v.toUpperCase()
}

/* ============ FILTRADO ============ */
const profesoresFiltrados = computed(() => {
  let filtrados = [...profesores.value]

  if (tipoVista.value === 'profesores') filtrados = filtrados.filter(p => !p.es_psicologo)
  else if (tipoVista.value === 'psicologos') filtrados = filtrados.filter(p => p.es_psicologo)

  const q = terminoBusqueda.value.trim().toLowerCase()
  if (q) {
    filtrados = filtrados.filter(p => {
      const turnosTexto = p.turnos ? p.turnos.map(t => t.nombre).join(' ') : '';
      const campos = [
        p.usuario?.nombre,
        p.usuario?.apellido_paterno,
        p.usuario?.apellido_materno,
        p.usuario?.correo_electronico,
        p.titulo,
        p.division?.nombre,
        turnosTexto,
        p.color_calendario,
        p.telefono,
      ]
      return campos.some(v => (v || '').toString().toLowerCase().includes(q))
    })
  }

  return filtrados
})

/* ============ PAGINACIÓN ============ */
const totalRegistros = computed(() => profesoresFiltrados.value.length)
const totalPaginas = computed(() => Math.max(1, Math.ceil(totalRegistros.value / porPagina.value)))
const profesoresPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  return profesoresFiltrados.value.slice(inicio, inicio + porPagina.value)
})
const rangoInicio = computed(() =>
  totalRegistros.value === 0 ? 0 : (paginaActual.value - 1) * porPagina.value + 1
)
const rangoFin = computed(() =>
  Math.min(paginaActual.value * porPagina.value, totalRegistros.value)
)

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
  if (paginaActual.value > totalPaginas.value) paginaActual.value = totalPaginas.value
})

/* ============ API ============ */
const obtenerProfesores = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_URL)
    profesores.value = res.data
  } catch (err) {
    console.error(err)
    await alertaError('No se pudieron cargar los profesores')
  } finally {
    cargando.value = false
  }
}

const obtenerCatalogos = async () => {
  try {
    const [divs, turn] = await Promise.all([axios.get('/divisiones'), axios.get('/turnos')])
    divisiones.value = divs.data
    turnos.value = turn.data
  } catch (e) {
    console.warn('No se pudieron cargar catálogos:', e)
  }
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  profesorEditando.value = null
  formProfesor.value = {
    nombre: '', apellido_paterno: '', apellido_materno: '', correo_electronico: '',
    telefono: '', titulo: '', es_psicologo: tipoVista.value === 'psicologos',
    id_division: bloqueaDivisionTurno.value ? idDivisionActual.value : null,
    id_turnos: bloqueaDivisionTurno.value ? [idTurnoActual.value] : [], 
    color_calendario: '#3ABEF9'
  }
  mostrarFormulario.value = true
}

const triggerFileInput = () => fileInputRef.value.click()

const descargarPlantilla = async () => {
  cargandoAccion.value = true
  try {
    const res = await axios.get(`${API_URL}/plantilla`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_profesores.xlsx'
    a.click()
    URL.revokeObjectURL(url)
    alertaExito('Plantilla descargada')
  } catch {
    await alertaError('No se pudo descargar la plantilla')
  } finally {
    cargandoAccion.value = false
  }
}

const procesarArchivoExcel = async (event) => {
  const archivo = event.target.files[0]
  if (!archivo) return
  const fd = new FormData()
  fd.append('file', archivo)
  cargandoAccion.value = true
  try {
    const res = await axios.post(`${API_URL}/importar`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const info = res.data.data

    let htmlErrores = ''
    if (info.detallesErrores && info.detallesErrores.length > 0) {
      htmlErrores = `
        <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 15px; max-height: 250px; overflow-y: auto;">
          <h4 style="color: #ef4444; margin-bottom: 10px; font-size: 0.9rem; text-align: left;">Registros fallidos (${info.detallesErrores.length}):</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
            <thead>
              <tr style="background: var(--bg-hover); color: var(--text-muted);">
                <th style="padding: 8px; border: 1px solid var(--border-color);">Fila</th>
                <th style="padding: 8px; border: 1px solid var(--border-color);">Nombre</th>
                <th style="padding: 8px; border: 1px solid var(--border-color);">Correo</th>
                <th style="padding: 8px; border: 1px solid var(--border-color);">Motivo</th>
              </tr>
            </thead>
            <tbody>
              ${info.detallesErrores.map(err => `
                <tr>
                  <td style="padding: 8px; border: 1px solid var(--border-color); color: var(--text-muted);">${err.fila}</td>
                  <td style="padding: 8px; border: 1px solid var(--border-color); color: var(--text-main); font-weight: 500;">${err.nombre}</td>
                  <td style="padding: 8px; border: 1px solid var(--border-color); color: var(--text-main);">${err.correo}</td>
                  <td style="padding: 8px; border: 1px solid var(--border-color); color: #ef4444;">${err.motivo}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
    }

    await Swal.fire({
      ...swalBase,
      icon: info.detallesErrores && info.detallesErrores.length > 0 ? 'warning' : 'success',
      title: 'Resumen de importación',
      html: `
        <div style="text-align:left; font-size:0.93rem; line-height:1.9;">
          <p>Filas leídas: <b>${info.totalFilasLeidas}</b></p>
          <p>Agregados con éxito: <b style="color: #16a34a;">${info.totalInsertados}</b></p>
          <p>Duplicados omitidos: <b>${info.omitidosPorCorreoDuplicado}</b></p>
          <p>Fuera de tu división/turno: <b>${info.omitidosPorPermiso}</b></p>
          <p>Inválidos: <b style="color: #ef4444;">${info.omitidosPorDatosInvalidos}</b></p>
          ${htmlErrores}
        </div>
      `,
      confirmButtonText: 'Entendido',
      width: '650px',
    })
    await obtenerProfesores()
  } catch (err) {
    await alertaError(mensajeDeError(err, 'No se pudo procesar el archivo.'), 'Error de importación')
  } finally {
    cargandoAccion.value = false
    event.target.value = ''
  }
}

const editarProfesor = (profesor) => {
  modoEdicion.value = true
  profesorEditando.value = profesor.id
  formProfesor.value = {
    nombre: profesor.usuario?.nombre || '',
    apellido_paterno: profesor.usuario?.apellido_paterno || '',
    apellido_materno: profesor.usuario?.apellido_materno || '',
    correo_electronico: profesor.usuario?.correo_electronico || '',
    telefono: profesor.telefono || '',
    titulo: profesor.titulo || '',
    es_psicologo: profesor.es_psicologo || false,
    id_division: profesor.id_division ?? null,
    id_turnos: profesor.turnos ? profesor.turnos.map(t => t.id) : [],
    color_calendario: profesor.color_calendario || '#3ABEF9'
  }
  mostrarFormulario.value = true
}

const verDisponibilidad = (profesor) => router.push(`/horarios-profesor/${profesor.id}`)

const guardarProfesor = async () => {
  cargandoAccion.value = true
  const eraEdicion = modoEdicion.value
  try {
    if (eraEdicion) {
      await axios.patch(`${API_URL}/${profesorEditando.value}`, formProfesor.value)
    } else {
      await axios.post(API_URL, formProfesor.value)
    }
    cerrarFormulario()

    if (!eraEdicion) {
      await Swal.fire({
        ...swalBase,
        icon: 'success',
        title: '¡Profesor creado!',
        html: `
          <div style="text-align:center;">
            <p>El profesor ha sido registrado exitosamente.</p>
            <p style="margin-top: 10px;">Su contraseña temporal es:</p>
            <h2 style="color: #3ABEF9; letter-spacing: 2px; margin: 8px 0;">12345678</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 10px;">
              Pídele que la cambie al iniciar sesión.
            </p>
          </div>
        `,
        confirmButtonText: 'Entendido',
      })
    } else {
      alertaExito('Actualizado')
    }
    await obtenerProfesores()
  } catch (err) {
    await alertaError(mensajeDeError(err, 'Error al guardar'))
  } finally {
    cargandoAccion.value = false
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  profesorEditando.value = null
}

const eliminarProfesor = async (id) => {
  const profesor = profesores.value.find(p => p.id === id)
  const tipo = profesor?.es_psicologo ? 'psicólogo' : 'profesor'
  const confirm = await alertaConfirmar(`¿Eliminar ${tipo}?`, 'También se eliminará su usuario.')
  if (!confirm.isConfirmed) return
  cargandoAccion.value = true
  try {
    await axios.delete(`${API_URL}/${id}`)
    alertaExito('Eliminado')
    await obtenerProfesores()
  } catch (err) {
    await alertaError(mensajeDeError(err, 'No se pudo eliminar'))
  } finally {
    cargandoAccion.value = false
  }
}

onMounted(async () => {
  await obtenerCatalogos()
  await obtenerProfesores()
})
</script>

<style>
.cronos-loading { position: fixed; inset: 0; background: var(--bg-body); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2000; color: var(--text-main); font-weight: 600; backdrop-filter: blur(4px); opacity: 0.9; }
.cronos-spinner { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: #3ABEF9; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style scoped>
.profesores-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
.btn-back-icon { width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; transition: all 0.15s ease; flex-shrink: 0; }
.btn-back-icon:hover { color: #0284c7; border-color: #3ABEF9; }
.header-text { flex: 1; text-align: center; }
.header-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 700; color: #3ABEF9; letter-spacing: 0.12em; margin-bottom: 10px; }
.header-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.2); }
.header-text h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-main); margin: 0 0 6px; line-height: 1.1; }
.header-text p { color: var(--text-muted); font-size: 0.92rem; margin: 0; }
.header-spacer { width: 40px; flex-shrink: 0; }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; box-shadow: var(--shadow-card); transition: background-color 0.3s, border-color 0.3s; }
.tabs { display: flex; gap: 2px; padding: 4px; background: var(--bg-tab); border-radius: 9px; }
.tab { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border: none; background: transparent; border-radius: 6px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.tab:hover { color: var(--text-main); }
.tab.active { background: var(--bg-card); color: var(--text-main); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); font-weight: 600; }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 18px; padding: 0 6px; background: #dbeafe; color: #1e40af; font-size: 0.7rem; font-weight: 700; border-radius: 5px; font-variant-numeric: tabular-nums; }
[data-theme="dark"] .tab-count { background: #1e3a8a; color: #bfdbfe; }
.tab.active .tab-count { background: rgba(58, 190, 249, 0.15); color: #0284c7; }
[data-theme="dark"] .tab.active .tab-count { background: rgba(58, 190, 249, 0.3); color: #7dd3fc; }

.toolbar-actions { display: flex; align-items: center; gap: 6px; padding-right: 4px; }
.btn-icon { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 8px; cursor: pointer; transition: all 0.15s ease; }
.btn-icon:hover { background: var(--bg-hover); color: #0284c7; border-color: #3ABEF9; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; background: #3ABEF9; color: #ffffff; border: 1px solid #3ABEF9; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-primary:hover { background: #0284c7; border-color: #0284c7; }
.btn-secondary { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color); padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-secondary:hover { background: var(--bg-hover); color: var(--text-main); border-color: #3ABEF9; }

.search-bar { position: relative; margin-bottom: 20px; }
.search-bar i { position: absolute; top: 50%; left: 16px; transform: translateY(-50%); color: var(--text-light); font-size: 0.9rem; pointer-events: none; }
.search-bar input { width: 100%; padding: 12px 44px 12px 44px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 0.9rem; background: var(--bg-input); color: var(--text-main); outline: none; transition: all 0.15s ease; font-family: inherit; box-shadow: var(--shadow-card); }
.search-bar input::placeholder { color: var(--text-light); }
.search-bar input:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12); }
.clear-search { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); background: transparent; border: none; color: var(--text-light); cursor: pointer; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.clear-search:hover { background: var(--bg-hover); color: var(--text-main); }

.tabla-wrap { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-card); transition: background-color 0.3s, border-color 0.3s; }
.tabla { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.tabla thead { background: var(--bg-hover); color: var(--text-muted); }
.tabla th { text-align: left; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 14px 20px; border-bottom: 1px solid var(--border-color); }
.tabla td { padding: 16px 20px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
.tabla tbody tr:last-child td { border-bottom: none; }
.tabla tbody tr { transition: background 0.12s ease; }
.tabla tbody tr:hover { background: var(--bg-hover); }

.persona { display: flex; align-items: center; gap: 12px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #ffffff; flex-shrink: 0; letter-spacing: 0.03em; }
.av-prof { background: #3ABEF9; }
.av-psi  { background: #0369a1; }

.persona-info { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.persona-nombre { font-weight: 600; color: var(--text-main); font-size: 0.9rem; }
.persona-titulo { font-size: 0.76rem; color: var(--text-muted); }

.contacto { display: flex; flex-direction: column; gap: 3px; }
.contacto-mail { color: var(--text-muted); font-size: 0.85rem; }
.contacto-tel { color: var(--text-light); font-size: 0.78rem; display: inline-flex; align-items: center; gap: 5px; }
.contacto-tel i { font-size: 0.65rem; }

.chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.chip-division { background: #eff6ff; color: #1d4ed8; }
[data-theme="dark"] .chip-division { background: #1e3a8a; color: #bfdbfe; }
.chip-dot { width: 6px; height: 6px; border-radius: 50%; background: #3ABEF9; flex-shrink: 0; }
.chip-turno { background: #e0f2fe; color: #075985; }
[data-theme="dark"] .chip-turno { background: #0c4a6e; color: #bae6fd; }
.chip-prof { background: #f1f5f9; color: #334155; }
[data-theme="dark"] .chip-prof { background: #334155; color: #e2e8f0; }
.chip-psi  { background: #dbeafe; color: #1e40af; }
[data-theme="dark"] .chip-psi { background: #1e3a8a; color: #bfdbfe; }
.chip i { font-size: 0.7rem; }

.turnos-container { display: flex; flex-wrap: wrap; gap: 4px; }

.color-cell { display: inline-flex; align-items: center; gap: 8px; }
.color-box { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(0, 0, 0, 0.15); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2); flex-shrink: 0; }
.color-hex { font-family: ui-monospace, monospace; font-size: 0.78rem; color: var(--text-muted); letter-spacing: 0.02em; }

.col-acciones { text-align: right; }
.acciones { display: inline-flex; gap: 2px; opacity: 0.5; transition: opacity 0.15s ease; }
.tabla tbody tr:hover .acciones { opacity: 1; }
.acciones button { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); border-radius: 6px; cursor: pointer; transition: all 0.15s ease; font-size: 0.78rem; }
.acciones button:hover { background: var(--bg-hover); color: #0284c7; }
.acciones button.danger:hover { background: var(--bg-hover); color: #ef4444; }

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

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 80px 24px; box-shadow: var(--shadow-card); }
.empty-icon { width: 64px; height: 64px; margin-bottom: 20px; background: var(--bg-hover); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #3ABEF9; font-size: 1.6rem; }
.empty-state h3 { font-size: 1.15rem; color: var(--text-main); margin: 0 0 8px; font-weight: 700; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; margin: 0 0 24px; max-width: 400px; }

.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: var(--text-muted); font-weight: 500; }
.spinner-modern { width: 34px; height: 34px; border: 3px solid var(--border-color); border-top-color: #3ABEF9; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }

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
.field { display: flex; flex-direction: column; min-width: 0; }
.field.full-width { grid-column: 1 / -1; }
.field label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
.field input, .field select { width: 100%; padding: 10px 13px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.88rem; outline: none; background: var(--bg-input); color: var(--text-main); font-family: inherit; box-sizing: border-box; }
.field input:focus, .field select:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12); }
.field select:disabled { background: var(--bg-hover); cursor: not-allowed; opacity: 0.7; }
.field .hint { font-size: 0.72rem; color: var(--text-light); margin-top: 5px; }

.checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px; }
.checkbox-card { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.15s ease; font-size: 0.85rem; font-weight: 500; color: var(--text-main); user-select: none; }
.checkbox-card:hover { border-color: #3ABEF9; background: var(--bg-hover); }
.checkbox-card:has(input:checked) { border-color: #3ABEF9; background: rgba(58, 190, 249, 0.1); color: #0284c7; }
.checkbox-card input[type="checkbox"] { width: 16px; height: 16px; accent-color: #3ABEF9; cursor: pointer; margin: 0; }

.color-picker-wrapper { display: flex; align-items: center; gap: 10px; background: var(--bg-input); padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 8px; flex-wrap: wrap; }
.color-pointer { width: 44px; height: 36px; cursor: pointer; border: none; background: none; border-radius: 6px; padding: 0; flex-shrink: 0; }
.color-preview { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); flex-shrink: 0; }
.color-hex-text { font-weight: 700; font-size: 0.85rem; color: var(--text-main); font-family: ui-monospace, monospace; }
.color-hex-input { flex: 1; min-width: 100px; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-card); color: var(--text-main); font-family: ui-monospace, monospace; font-size: 0.82rem; text-transform: uppercase; outline: none; box-sizing: border-box; }
.color-hex-input:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.15); }

.palette-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(28px, 1fr)); gap: 6px; margin-top: 10px; padding: 10px; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 10px; max-height: 160px; overflow-y: auto; }
.palette-swatch { width: 28px; height: 28px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: transform 0.1s ease, border-color 0.15s ease; padding: 0; outline: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }
.palette-swatch:hover { transform: scale(1.12); }
.palette-swatch.selected { border-color: #0F172A; box-shadow: 0 0 0 2px #3ABEF9, inset 0 0 0 1px rgba(255,255,255,0.5); transform: scale(1.08); }

.toggle-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.15s ease; }
.toggle-card:hover { background: var(--bg-card); border-color: #3ABEF9; }
.toggle-card.disabled { opacity: 0.6; cursor: not-allowed; }
.toggle-card input[type="checkbox"] { width: 18px; height: 18px; accent-color: #3ABEF9; cursor: pointer; flex-shrink: 0; }
.toggle-content { display: flex; flex-direction: column; }
.toggle-title { font-size: 0.88rem; font-weight: 600; color: var(--text-main); }
.toggle-desc { font-size: 0.76rem; color: var(--text-muted); }

.modal-footer { padding: 14px 24px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); background: var(--bg-card); margin: 22px -24px -22px; }

@media (max-width: 900px) {
  .profesores-main { padding: 24px 16px 48px; }
  .header-text h1 { font-size: 1.5rem; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-actions { justify-content: flex-end; flex-wrap: wrap; }

  .tabla thead { display: none; }
  .tabla, .tabla tbody, .tabla tr, .tabla td { display: block; width: 100%; }
  .tabla tr { margin-bottom: 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 16px; box-shadow: var(--shadow-card); }
  .tabla td { padding: 8px 0; border-bottom: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; text-align: right; gap: 12px; }
  .tabla td:last-child { border-bottom: none; padding-top: 14px; justify-content: flex-end; }
  .tabla td::before { content: attr(data-label); font-weight: 600; color: var(--text-muted); font-size: 0.8rem; text-align: left; flex-shrink: 0; }

  .persona { justify-content: flex-end; }
  .persona-info { align-items: flex-end; text-align: right; }
  .contacto { align-items: flex-end; text-align: right; }
  .chip { max-width: 65vw; }
  .turnos-container { justify-content: flex-end; }

  .col-acciones { text-align: right; }
  .acciones { opacity: 1; gap: 10px; }
  .acciones button { width: 38px; height: 38px; background: var(--bg-hover); border: 1px solid var(--border-color); border-radius: 10px; font-size: 0.9rem; }
  .pagination { flex-direction: column; align-items: stretch; }
  .pagination-controls { justify-content: center; }
}

@media (max-width: 768px) {
  .form-modal { max-width: 95%; margin: 10px auto; max-height: 95vh; display: flex; flex-direction: column; }
  .modal-body { padding: 16px; overflow-y: auto; flex: 1; }
  .form-grid { grid-template-columns: 1fr; gap: 12px; }
  .modal-footer { padding: 16px; margin: 16px -16px -16px; flex-direction: column; }
  .modal-footer button { width: 100%; justify-content: center; }
  .toggle-card { flex-direction: column; align-items: flex-start; gap: 8px; }
}

@media (max-width: 480px) {
  .header-text h1 { font-size: 1.3rem; }
  .toolbar-actions .btn-primary { flex: 1; justify-content: center; }
  .tab { padding: 8px 10px; font-size: 0.8rem; }
  .tab span:not(.tab-count) { display: none; }
  .tab i { font-size: 0.95rem; }
}
</style>