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
            <span class="dot"></span> GESTIÓN ACADÉMICA
          </div>
          <h1>Directorio de Grupos</h1>
          <p>Administración de secciones y grupos académicos</p>
        </div>
        <div class="header-spacer"></div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="tabs">
          <button
            @click="turnoFiltroSeleccionado = 'todos'"
            :class="['tab', { active: turnoFiltroSeleccionado === 'todos' }]"
          >
            <i class="fas fa-users"></i>
            <span>Todos</span>
          </button>
          <button
            v-for="turno in turnos"
            :key="turno.id"
            @click="turnoFiltroSeleccionado = turno.id"
            :class="['tab', { active: turnoFiltroSeleccionado === turno.id }]"
          >
            <i class="fas fa-clock"></i>
            <span>{{ turno.nombre }}</span>
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
            <i class="fas fa-plus"></i> Nuevo grupo
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
          placeholder="Buscar por nombre, abreviatura o división…"
        />
        <button v-if="terminoBusqueda" @click="limpiarBusqueda" class="clear-search">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="cargando" class="loading-container">
        <div class="spinner-modern"></div>
        <p>Cargando grupos…</p>
      </div>

      <!-- TABLA -->
      <div class="tabla-wrap" v-else-if="gruposFiltrados.length > 0">
        <table class="tabla">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Grado</th>
              <th>División</th>
              <th>Turno</th>
              <th>Tutor</th>
              <th class="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="grupo in gruposPaginados" :key="grupo.id">
              <td>
                <div class="persona">
                  <div class="avatar" :style="{ backgroundColor: grupo.color_identificador || '#3ABEF9' }">
                    {{ grupo.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div class="persona-info">
                    <span class="persona-nombre">{{ grupo.nombre }}</span>
                    <span class="persona-titulo">{{ grupo.abreviatura || 'Sin abreviatura' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="chip chip-turno">{{ grupo.grado }}°</span>
              </td>
              <td>
                <span class="chip chip-prof">{{ grupo.division?.nombre || '—' }}</span>
              </td>
              <td>
                <span class="chip chip-division">
                  <span class="chip-dot"></span>
                  {{ grupo.turno?.nombre || '—' }}
                </span>
              </td>
              <td>
                <span class="texto-secundario">
                  {{ grupo.tutor?.usuario?.nombre || 'Sin tutor' }}
                  {{ grupo.tutor?.usuario?.apellido_paterno || '' }}
                </span>
              </td>
              <td class="col-acciones">
                <div class="acciones">
                  <button @click="editarGrupo(grupo)" title="Editar">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="eliminarGrupo(grupo.id)" title="Eliminar" class="danger">
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
            {{ totalRegistros === 1 ? 'grupo' : 'grupos' }}
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
          <i class="fas fa-folder-open"></i>
        </div>
        <h3>Sin registros aún</h3>
        <p>No se encontraron grupos que coincidan con la búsqueda o filtros.</p>
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
          <h2>{{ modoEdicion ? 'Actualizar' : 'Registrar' }} grupo</h2>
          <button class="close-btn" @click="cerrarFormulario">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="guardarGrupo">
            <div class="form-grid">
              <div class="field">
                <label>Nombre del Grupo *</label>
                <input v-model="formGrupo.nombre" type="text" placeholder="Ej. IDGS14" required />
              </div>
              <div class="field">
                <label>Abreviatura *</label>
                <input v-model="formGrupo.abreviatura" type="text" placeholder="Ej. IDGS" maxlength="10" required />
              </div>
              <div class="field">
                <label>Grado *</label>
                <input v-model="formGrupo.grado" type="number" placeholder="Ej. 10" min="1" max="12" required />
              </div>
              <div class="field">
                <label>División Académica *</label>
                <select v-model.number="formGrupo.id_division" required>
                  <option value="" disabled>Seleccione una división</option>
                  <option v-for="division in divisiones" :key="division.id" :value="division.id">
                    {{ division.nombre }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Turno *</label>
                <select v-model.number="formGrupo.id_turno" required>
                  <option value="" disabled>Seleccione un turno</option>
                  <option v-for="turno in turnos" :key="turno.id" :value="turno.id">
                    {{ turno.nombre }}
                  </option>
                </select>
              </div>
              <div class="field">
                <label>Tutor Asignado *</label>
                <select v-model.number="formGrupo.tutor_id" required>
                  <option value="" disabled>Seleccione un tutor</option>
                  <option v-for="profesor in profesores" :key="profesor.id" :value="profesor.id">
                    {{ profesor.usuario?.nombre }} {{ profesor.usuario?.apellido_paterno }}
                  </option>
                </select>
              </div>
              <div class="field full-width">
                <label>Color Identificador</label>
                <div class="color-picker-wrapper">
                  <input v-model="formGrupo.color_identificador" type="color" class="color-pointer" />
                  <span class="color-hex-text">{{ formGrupo.color_identificador }}</span>
                </div>
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

const API_GRUPOS = `/grupos`
const API_DIVISIONES = `/divisiones`
const API_TURNOS = `/turnos`
const API_PROFESORES = `/profesores`

/* ============ ESTADO ============ */
const grupos = ref([])
const divisiones = ref([])
const turnos = ref([])
const profesores = ref([])

const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const grupoEditando = ref(null)
const terminoBusqueda = ref('')
const turnoFiltroSeleccionado = ref('todos')
const cargando = ref(false)
const cargandoAccion = ref(false)
const fileInputRef = ref(null)

/* ============ PAGINACIÓN ============ */
const paginaActual = ref(1)
const porPagina = ref(15)

const formGrupo = ref({
  nombre: '',
  abreviatura: '',
  grado: '',          
  id_division: '',
  id_turno: '',
  tutor_id: '',
  color_identificador: '#88B7F3'
})

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

/* ============ FILTRADO Y PAGINACIÓN ============ */
const gruposFiltrados = computed(() => {
  let filtrados = grupos.value

  if (turnoFiltroSeleccionado.value !== 'todos') {
    filtrados = filtrados.filter(g => {
      const gTurnoId = g.id_turno || g.turno?.id
      return gTurnoId === turnoFiltroSeleccionado.value
    })
  }

  if (terminoBusqueda.value.trim()) {
    const q = terminoBusqueda.value.toLowerCase().trim()
    filtrados = filtrados.filter(g => {
      const nombreMatch = g.nombre?.toLowerCase().includes(q)
      const abrevMatch = g.abreviatura?.toLowerCase().includes(q)
      const divisionMatch = g.division?.nombre?.toLowerCase().includes(q)
      return nombreMatch || abrevMatch || divisionMatch
    })
  }

  return filtrados
})

const totalRegistros = computed(() => gruposFiltrados.value.length)
const totalPaginas = computed(() => Math.max(1, Math.ceil(totalRegistros.value / porPagina.value)))
const gruposPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value
  return gruposFiltrados.value.slice(inicio, inicio + porPagina.value)
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
const obtenerGrupos = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_GRUPOS)
    grupos.value = res.data
  } catch (error) {
    console.error(error)
    await alertaError('No se pudieron cargar los grupos')
  } finally {
    cargando.value = false
  }
}

const obtenerDivisiones = async () => {
  try {
    const res = await axios.get(API_DIVISIONES)
    divisiones.value = res.data
  } catch (error) {
    console.warn('No se pudieron cargar las divisiones')
  }
}

const obtenerTurnos = async () => {
  try {
    const res = await axios.get(API_TURNOS)
    turnos.value = res.data
  } catch (error) {
    console.warn('No se pudieron cargar los turnos')
  }
}

const obtenerProfesores = async () => {
  try {
    const res = await axios.get(API_PROFESORES)
    profesores.value = res.data
  } catch (error) {
    console.warn('No se pudieron cargar los profesores')
  }
}

/* ============ EXCEL ============ */
const triggerFileInput = () => fileInputRef.value.click()

const descargarPlantilla = () => {
  const csvContent = "Nombre,Abreviatura,Grado,Division ID,Turno ID,Tutor ID,Color\nIDGS16,IDGS16,10,1,1,1,#3ABEF9\nIDGS17,IDGS17,9,2,2,2,#88B7F3";
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "plantilla_grupos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const procesarArchivoExcel = async (event) => {
  const archivo = event.target.files[0]
  if (!archivo) return
  const formData = new FormData()
  formData.append('file', archivo)
  cargandoAccion.value = true
  try {
    const res = await axios.post(`${API_GRUPOS}/importar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const info = res.data.data
    await Swal.fire({
      ...swalBase,
      icon: 'success',
      title: 'Importación exitosa',
      html: `
        <div style="text-align:left; font-size:0.93rem; line-height:1.9;">
          <p>Filas leídas: <b>${info.totalFilasLeidas}</b></p>
          <p>Grupos agregados: <b>${info.totalInsertados}</b></p>
          <p>Omitidos: <b>${info.omitidos}</b></p>
        </div>
      `,
      confirmButtonText: 'OK',
    })
    await obtenerGrupos()
  } catch (err) {
    await alertaError(mensajeDeError(err, 'No se pudo procesar el archivo.'), 'Error de importación')
  } finally {
    cargandoAccion.value = false
    event.target.value = ''
  }
}

/* ============ ACCIONES ============ */
const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  grupoEditando.value = null
  formGrupo.value = {
    nombre: '',
    abreviatura: '',
    grado: '',
    id_division: '',
    id_turno: '',
    tutor_id: '',
    color_identificador: '#88B7F3'
  }
  mostrarFormulario.value = true
}

const editarGrupo = (grupo) => {
  modoEdicion.value = true
  grupoEditando.value = grupo.id
  formGrupo.value = {
    nombre: grupo.nombre || '',
    abreviatura: grupo.abreviatura || '',
    grado: String(grupo.grado || ''),        
    id_division: grupo.id_division || grupo.division?.id || '',
    id_turno: grupo.id_turno || grupo.turno?.id || '',
    tutor_id: grupo.tutor_id || grupo.tutor?.id || '',
    color_identificador: grupo.color_identificador || '#88B7F3'
  }
  mostrarFormulario.value = true
}

const guardarGrupo = async () => {
  const nombreTrim = formGrupo.value.nombre.trim().toLowerCase()
  const duplicado = grupos.value.some(g => {
    const mismoNombre = g.nombre.trim().toLowerCase() === nombreTrim
    if (modoEdicion.value) {
      return mismoNombre && g.id !== grupoEditando.value
    }
    return mismoNombre
  })

  if (duplicado) {
    await Swal.fire({ ...swalBase, icon: 'warning', title: '¡Grupo ya registrado!', text: 'Ya existe un grupo con este nombre.' })
    return
  }

  cargandoAccion.value = true
  const eraEdicion = modoEdicion.value
  try {
    formGrupo.value.grado = String(formGrupo.value.grado)
    if (eraEdicion) {
      await axios.patch(`${API_GRUPOS}/${grupoEditando.value}`, formGrupo.value)
    } else {
      await axios.post(API_GRUPOS, formGrupo.value)
    }
    cerrarFormulario()
    alertaExito(eraEdicion ? 'Actualizado' : 'Agregado')
    await obtenerGrupos()
  } catch (error) {
    await alertaError(mensajeDeError(error, 'Error al guardar el grupo'))
  } finally {
    cargandoAccion.value = false
  }
}

const eliminarGrupo = async (id) => {
  const confirm = await alertaConfirmar('¿Eliminar grupo?', 'Esto podría afectar a los alumnos asociados.')
  if (!confirm.isConfirmed) return
  cargandoAccion.value = true
  try {
    await axios.delete(`${API_GRUPOS}/${id}`)
    alertaExito('Eliminado')
    await obtenerGrupos()
  } catch (error) {
    await alertaError(mensajeDeError(error, 'No se pudo eliminar el grupo. Puede estar asociado a otras entidades.'))
  } finally {
    cargandoAccion.value = false
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  grupoEditando.value = null
}

onMounted(async () => {
  await Promise.all([obtenerDivisiones(), obtenerTurnos(), obtenerProfesores()])
  await obtenerGrupos()
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
.tabs { display: flex; gap: 2px; padding: 4px; background: var(--bg-tab); border-radius: 9px; overflow-x: auto; }
.tab { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border: none; background: transparent; border-radius: 6px; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); cursor: pointer; transition: all 0.15s ease; font-family: inherit; white-space: nowrap; }
.tab:hover { color: var(--text-main); }
.tab.active { background: var(--bg-card); color: var(--text-main); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06); font-weight: 600; }

.toolbar-actions { display: flex; align-items: center; gap: 6px; padding-right: 4px; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; background: #3ABEF9; color: #ffffff; border: 1px solid #3ABEF9; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-primary:hover { background: #0284c7; border-color: #0284c7; }
.btn-secondary { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border-color); padding: 9px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-secondary:hover { background: var(--bg-hover); color: var(--text-main); border-color: #3ABEF9; }

.btn-icon {
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-muted);
  border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
}
.btn-icon:hover { background: var(--bg-hover); color: #0284c7; border-color: #3ABEF9; }

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
.avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: #ffffff; flex-shrink: 0; letter-spacing: 0.03em; }

.persona-info { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.persona-nombre { font-weight: 600; color: var(--text-main); font-size: 0.9rem; }
.persona-titulo { font-size: 0.76rem; color: var(--text-muted); }

.texto-secundario { color: var(--text-muted); font-size: 0.85rem; }

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

.color-picker-wrapper {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-input); padding: 6px 12px;
  border: 1px solid var(--border-color); border-radius: 8px;
}
.color-pointer { width: 40px; height: 32px; cursor: pointer; border: none; background: none; }
.color-hex-text { font-weight: 600; font-size: 0.85rem; color: var(--text-muted); font-family: monospace; }

.modal-footer { padding: 14px 24px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); background: var(--bg-card); margin: 22px -24px -22px; }

/* ============ RESPONSIVE ============ */
@media (max-width: 800px) {
  .profesores-main { padding: 24px 16px 48px; }
  .form-grid { grid-template-columns: 1fr; }
  .header-text h1 { font-size: 1.5rem; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-actions { justify-content: flex-end; }
  .tabla th:nth-child(3),
  .tabla td:nth-child(3) { display: none; }
  .tabla th, .tabla td { padding: 12px 14px; }
  .pagination { flex-direction: column; align-items: stretch; }
  .pagination-controls { justify-content: center; }
}
</style>