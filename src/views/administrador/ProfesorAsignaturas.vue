<template>
  <div class="asignaciones-layout-full">
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/dashboard" class="nav-figure">
          <img src="../../imagenes/logo.png" class="nav-logo" alt="Logo Cronos" />
        </router-link>

        <label class="nav-toggle" for="menu-input">
          <input type="checkbox" id="menu-input" class="nav-input" />
        </label>

        <ul class="nav-list">
          <li class="nav-item"><router-link to="/dashboard" class="nav-link">Panel de control</router-link></li>
          <li class="nav-item"><router-link :to="{ name: 'perfil-admin' }" class="nav-link">Perfil</router-link></li>
        </ul>
      </div>
    </nav>

    <div v-if="cargandoAccion" class="action-loading">
      <div class="spinner-modern"></div>
      <p>Procesando solicitud...</p>
    </div>

    <main class="asignaciones-main">
      <!-- HEADER CON DISEÑO MODERNIZADO -->
      <div class="asignaciones-header">
        <button @click="goBack" class="btn-back-icon" title="Volver al Dashboard">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-text">
          <h1>Asignación Académica</h1>
          <p>Gestión avanzada de profesores, materias, aulas y grupos institucionales</p>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div v-if="cargando" class="loading-container">
        <div class="spinner-modern"></div>
        <p>Cargando asignaciones...</p>
      </div>

      <div class="asignaciones-card" v-else>
        <!-- 🚀 CONTROLES SUPERIORES: ACCIONES Y BÚSQUEDA -->
        <div class="top-controls-container">
          <div class="btn-actions-group">
            <button class="btn-primary" @click="abrirFormularioNuevo">
              <i class="fas fa-plus"></i> Nueva Asignación
            </button>

            <button class="btn-danger" @click="eliminarTodasAsignaciones">
              <i class="fas fa-trash-alt"></i> Eliminar Todo
            </button>
          </div>

          <!-- 🔍 BARRA DE BÚSQUEDA -->
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              v-model="filtroBusqueda" 
              placeholder="Buscar profesor, asignatura, aula, grupo..." 
              class="busqueda-input"
            />
            <button v-if="filtroBusqueda" @click="filtroBusqueda = ''" class="limpiar-busqueda" title="Limpiar búsqueda">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- 📋 LISTA COMPLETA EN TABLA CON SCROLL -->
        <div v-if="asignaciones.length > 0" class="table-container list-view-container">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Profesor</th>
                <th>Asignatura</th>
                <th>División</th>
                <th>Aula</th>
                <th>Edificio</th>
                <th>Periodo</th>
                <th>Grupos</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asig in asignacionesFiltradas" :key="'asig-' + asig.id">
                <td :data-label="'Profesor'">
                  <span class="font-weight-semibold">{{ asig.nombreProfesor }}</span>
                </td>
                <td :data-label="'Asignatura'">{{ asig.asignatura || '-' }}</td>
                <td :data-label="'División'">{{ asig.division || '-' }}</td>
                <td :data-label="'Aula'">
                  <span class="aula-badge">{{ asig.aula || '-' }}</span>
                </td>
                <td :data-label="'Edificio'">{{ asig.edificio || '-' }}</td>
                <td :data-label="'Periodo'">
                  <span class="periodo-tag">{{ asig.periodo || '-' }}</span>
                </td>
                <td :data-label="'Grupos'">
                  <span class="grupo-tag">{{ asig.grupos || '-' }}</span>
                </td>
                <td :data-label="'Acciones'" class="acciones-cell">
                  <button class="btn-action-icon btn-edit" @click="editarAsignacion(asig)" title="Editar">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button class="btn-action-icon btn-delete" @click="eliminarAsignacion(asig)" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="asignacionesFiltradas.length === 0">
                <td colspan="8" class="no-results">No se encontraron resultados para "{{ filtroBusqueda }}"</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state">
          <div class="empty-content">
            <i class="fas fa-chalkboard-user"></i>
            <h3>No hay asignaciones registradas</h3>
            <p>Comienza agregando tu primera asignación académica al sistema</p>
            <button class="btn-primary mt-3" @click="abrirFormularioNuevo">
              <i class="fas fa-plus"></i> Nueva Asignación
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL PREMIUM -->
    <div v-if="mostrarFormulario" class="form-overlay" @click.self="cerrarFormulario">
      <div class="form-modal animate-modal">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <div class="modal-icon-badge">
              <i class="fas fa-chalkboard-user"></i>
            </div>
            <h2>{{ modoEdicion ? 'Editar Asignación' : 'Registrar Asignatura a Profesor' }}</h2>
          </div>
          <button class="close-btn" @click="cerrarFormulario">&times;</button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="guardarAsignacion">
            <div class="form-grid-layout">
              <!-- 🖊️ AUTORELLENO / BUSCADOR DE PROFESOR -->
              <div class="input-group">
                <label>Profesor *</label>
                <input 
                  type="text" 
                  v-model="busquedaProfesor" 
                  placeholder="Escribe para buscar profesor..." 
                  class="autocomplete-input"
                  @focus="mostrarDropdownProfesor = true"
                  required
                />
                <div v-if="mostrarDropdownProfesor && profesoresFiltrados.length > 0" class="dropdown-list">
                  <div 
                    v-for="prof in profesoresFiltrados" 
                    :key="prof.id" 
                    class="dropdown-item"
                    @click="seleccionarProfesor(prof)"
                  >
                    {{ prof.usuario?.nombre }} {{ prof.usuario?.apellido_paterno }} {{ prof.usuario?.apellido_materno || '' }}
                  </div>
                </div>
              </div>

              <!-- 🖊️ AUTORELLENO Y FILTRADO DE ASIGNATURA -->
              <div class="input-group">
                <label>Asignatura *</label>
                <input 
                  type="text" 
                  v-model="busquedaAsignatura" 
                  :placeholder="form.id_profesor ? 'Busca materia relacionada...' : 'Primero selecciona un profesor...'" 
                  :disabled="!form.id_profesor"
                  class="autocomplete-input"
                  @focus="mostrarDropdownAsignatura = true"
                  required
                />
                <div v-if="mostrarDropdownAsignatura && asignaturasFiltradasPorProfesor.length > 0" class="dropdown-list">
                  <div 
                    v-for="asig in asignaturasFiltradasPorProfesor" 
                    :key="asig.id" 
                    class="dropdown-item"
                    @click="seleccionarAsignatura(asig)"
                  >
                    {{ asig.nombre }}
                  </div>
                </div>
              </div>

              <div class="input-group">
                <label>Aula (opcional)</label>
                <select v-model="form.id_aula" class="styled-select">
                  <option value="">Sin aula asignada</option>
                  <option v-for="aula in aulas" :key="aula.id" :value="aula.id">
                    {{ aula.nombre }} - {{ aula.edificio?.nombre || 'Sin edificio' }}
                  </option>
                </select>
              </div>

              <div class="input-group">
                <label>Periodo *</label>
                <select v-model="form.id_periodo" required class="styled-select">
                  <option disabled value="">Selecciona un periodo</option>
                  <option v-for="per in periodos" :key="per.id" :value="per.id">
                    {{ per.nombre }}
                  </option>
                </select>
              </div>

              <div class="input-group full-width">
                <label>Grupos Asociados (Múltiples) *</label>
                <div class="checkbox-group">
                  <div v-for="grupo in grupos" :key="grupo.id" class="checkbox-item">
                    <input 
                      type="checkbox" 
                      :id="'grupo-' + grupo.id"
                      :value="grupo.id"
                      v-model="form.id_grupos"
                    />
                    <label :for="'grupo-' + grupo.id">{{ grupo.nombre }}</label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="cerrarFormulario">Cancelar</button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-check"></i> {{ modoEdicion ? 'Guardar Cambios' : 'Crear Asignación' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import '../../assets/styles.css'
import Swal from 'sweetalert2'

const router = useRouter()

const goBack = () => {
  router.back()
}

const API_ASIGNACIONES = `http://localhost:3000/profesor-asignatura`
const API_ASIGNACIONES_AULAS = `http://localhost:3000/profesor-aula`
const API_PROFESORES = `http://localhost:3000/profesores`
const API_ASIGNATURAS = `http://localhost:3000/asignaturas`
const API_PERIODOS = `http://localhost:3000/periodos`
const API_GRUPOS = `http://localhost:3000/grupos`
const API_AULAS = `http://localhost:3000/aulas`

const asignaciones = ref([])
const profesores = ref([])
const asignaturas = ref([])
const periodos = ref([])
const grupos = ref([])
const aulas = ref([])

const filtroBusqueda = ref('')

const busquedaProfesor = ref('')
const busquedaAsignatura = ref('')
const mostrarDropdownProfesor = ref(false)
const mostrarDropdownAsignatura = ref(false)

const mostrarFormulario = ref(false)
const modoEdicion = ref(false)
const itemEditando = ref(null)

const cargando = ref(false)
const cargandoAccion = ref(false)

const form = ref({
  id_profesor: '',
  id_asignatura: '',
  id_aula: '',
  id_periodo: '',
  id_grupos: []
})

const profesoresFiltrados = computed(() => {
  if (!busquedaProfesor.value) return profesores.value
  const query = busquedaProfesor.value.toLowerCase().trim()
  return profesores.value.filter(p => {
    const nombreCompleto = `${p.usuario?.nombre || ''} ${p.usuario?.apellido_paterno || ''} ${p.usuario?.apellido_materno || ''}`.toLowerCase()
    return nombreCompleto.includes(query)
  })
})

const asignaturasFiltradasPorProfesor = computed(() => {
  let lista = asignaturas.value
  if (busquedaAsignatura.value) {
    const query = busquedaAsignatura.value.toLowerCase().trim()
    lista = lista.filter(asig => asig.nombre.toLowerCase().includes(query))
  }
  return lista
})

const seleccionarProfesor = (prof) => {
  form.value.id_profesor = prof.id
  busquedaProfesor.value = `${prof.usuario?.nombre || ''} ${prof.usuario?.apellido_paterno || ''}`
  mostrarDropdownProfesor.value = false
  form.value.id_asignatura = ''
  busquedaAsignatura.value = ''
}

const seleccionarAsignatura = (asig) => {
  form.value.id_asignatura = asig.id
  busquedaAsignatura.value = asig.nombre
  mostrarDropdownAsignatura.value = false
}

const asignacionesFiltradas = computed(() => {
  if (!filtroBusqueda.value) return asignaciones.value
  const query = filtroBusqueda.value.toLowerCase().trim()
  return asignaciones.value.filter(asig => {
    return (
      asig.nombreProfesor.toLowerCase().includes(query) ||
      asig.asignatura.toLowerCase().includes(query) ||
      asig.division.toLowerCase().includes(query) ||
      asig.aula.toLowerCase().includes(query) ||
      asig.edificio.toLowerCase().includes(query) ||
      asig.periodo.toLowerCase().includes(query) ||
      asig.grupos.toLowerCase().includes(query)
    )
  })
})

const cargarCatalogos = async () => {
  try {
    const [profRes, asigRes, perRes, gruposRes, aulasRes] = await Promise.all([
      axios.get(API_PROFESORES),
      axios.get(API_ASIGNATURAS),
      axios.get(API_PERIODOS),
      axios.get(API_GRUPOS),
      axios.get(API_AULAS)
    ])
    profesores.value = profRes.data
    asignaturas.value = asigRes.data
    periodos.value = perRes.data
    grupos.value = gruposRes.data
    aulas.value = aulasRes.data
  } catch (err) {
    console.error('Error cargando catálogos:', err)
  }
}

const cargarAsignaciones = async () => {
  cargando.value = true
  try {
    const res = await axios.get(API_ASIGNACIONES)
    let aulasAsignadas = []
    try {
      const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
      aulasAsignadas = aulasRes.data
    } catch (e) {}
    
    const asignacionesConAulas = res.data.map(asig => {
      const profId = Number(asig.id_profesor || asig.profesor?.id)
      const asigId = Number(asig.id_asignatura || asig.asignatura?.id)
      const periodoId = Number(asig.id_periodo || asig.periodo?.id)

      let aulaAsignada = aulasAsignadas.find(
        a => Number(a.id_profesor_asignatura) === Number(asig.id)
      )

      if (!aulaAsignada) {
        aulaAsignada = aulasAsignadas.find(
          a => Number(a.id_profesor || a.profesor?.id) === profId &&
               Number(a.id_asignatura || a.asignatura?.id) === asigId &&
               Number(a.id_periodo || a.periodo?.id) === periodoId &&
               !a.id_profesor_asignatura
        )
      }

      const nombreAula = aulaAsignada?.aula?.nombre || '-'
      const nombreEdificio = aulaAsignada?.aula?.edificio?.nombre || '-'

      const divisionesTexto = asig.asignatura?.divisiones?.length > 0
        ? asig.asignatura.divisiones.map(d => d.nombre).join(', ')
        : (asig.asignatura?.division?.nombre || '-')

      return {
        id: asig.id,
        nombreProfesor: asig.profesor?.usuario 
          ? `${asig.profesor.usuario.nombre} ${asig.profesor.usuario.apellido_paterno}`
          : 'N/A',
        asignatura: asig.asignatura?.nombre || '-',
        division: divisionesTexto,
        aula: nombreAula,
        edificio: nombreEdificio,
        periodo: asig.periodo?.nombre || '-',
        grupos: asig.gruposAsignados?.length > 0
          ? asig.gruposAsignados.map(ga => ga.grupo?.nombre).filter(Boolean).join(', ')
          : '-',
        datosOriginales: asig
      }
    })
    
    asignaciones.value = asignacionesConAulas
  } catch (err) {
    console.error('Error cargando asignaciones:', err)
  } finally {
    cargando.value = false
  }
}

const abrirFormularioNuevo = () => {
  modoEdicion.value = false
  itemEditando.value = null
  form.value = { id_profesor: '', id_asignatura: '', id_aula: '', id_periodo: '', id_grupos: [] }
  busquedaProfesor.value = ''
  busquedaAsignatura.value = ''
  mostrarFormulario.value = true
}

const editarAsignacion = async (asig) => {
  modoEdicion.value = true
  itemEditando.value = asig.id
  
  let idAula = ''
  try {
    const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
    const aulaAsignada = aulasRes.data.find(
      a => Number(a.id_profesor_asignatura) === Number(asig.id)
    )
    if (aulaAsignada) {
      idAula = aulaAsignada.id_aula || aulaAsignada.aula?.id || ''
    }
  } catch (err) {
    console.error('Error al buscar el aula de la asignatura:', err)
  }

  const gruposExtraidos = asig.datosOriginales.gruposAsignados?.map(ga => {
    return ga.id_grupo || ga.grupoId || ga.grupo?.id
  }).filter(Boolean) || []

  form.value = {
    id_profesor: asig.datosOriginales.id_profesor,
    id_asignatura: asig.datosOriginales.id_asignatura,
    id_aula: idAula,
    id_periodo: asig.datosOriginales.id_periodo,
    id_grupos: gruposExtraidos
  }

  const profEncontrado = profesores.value.find(p => p.id === asig.datosOriginales.id_profesor)
  if (profEncontrado) {
    busquedaProfesor.value = `${profEncontrado.usuario?.nombre || ''} ${profEncontrado.usuario?.apellido_paterno || ''}`
  }
  const asigEncontrada = asignaturas.value.find(a => a.id === asig.datosOriginales.id_asignatura)
  if (asigEncontrada) {
    busquedaAsignatura.value = asigEncontrada.nombre
  }
  
  mostrarFormulario.value = true
}

const guardarAsignacion = async () => {
  cargandoAccion.value = true
  try {
    const payloadAsignatura = {
      id_profesor: Number(form.value.id_profesor),
      id_asignatura: Number(form.value.id_asignatura),
      id_periodo: Number(form.value.id_periodo),
      id_grupos: form.value.id_grupos.map(id => Number(id))
    }

    if (modoEdicion.value) {
      await axios.patch(`${API_ASIGNACIONES}/${itemEditando.value}`, payloadAsignatura)
    } else {
      await axios.post(API_ASIGNACIONES, payloadAsignatura)
    }

    if (form.value.id_aula !== '') {
      const asignacionId = modoEdicion.value ? itemEditando.value : null;
      
      const payloadAula = {
        id_profesor: Number(form.value.id_profesor),
        id_asignatura: Number(form.value.id_asignatura),
        id_periodo: Number(form.value.id_periodo),
        id_aula: Number(form.value.id_aula),
        id_profesor_asignatura: Number(asignacionId)
      }

      try {
        const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
        const aulaExistente = aulasRes.data.find(
          a => Number(a.id_profesor_asignatura) === Number(asignacionId)
        )

        if (aulaExistente) {
          await axios.patch(`${API_ASIGNACIONES_AULAS}/${aulaExistente.id}`, payloadAula)
        } else {
          await axios.post(API_ASIGNACIONES_AULAS, payloadAula)
        }
      } catch (errAula) {
        console.error('Error al gestionar el aula específica:', errAula)
      }
    }

    await cargarAsignaciones()
    cargandoAccion.value = false
    await Swal.fire({ icon: 'success', title: modoEdicion.value ? '¡Actualizado!' : '¡Agregado!', showConfirmButton: false, timer: 1500 })
    cerrarFormulario()
  } catch (err) {
    cargandoAccion.value = false
    await Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error guardando asignación' })
  } finally {
    cargandoAccion.value = false
  }
}

const eliminarAsignacion = async (item) => {
  const idAsignacion = typeof item === 'object' ? item.id : item;
  const datosOriginales = typeof item === 'object' ? item.datosOriginales : null;

  const confirm = await Swal.fire({
    title: '¿Eliminar asignación?', 
    text: 'Se eliminará la asignación y su aula asociada de la base de datos', 
    icon: 'warning', 
    showCancelButton: true, 
    confirmButtonText: 'Sí, eliminar', 
    confirmButtonColor: '#E54848'
  })

  if (confirm.isConfirmed) {
    cargandoAccion.value = true
    try {
      await axios.delete(`${API_ASIGNACIONES}/${idAsignacion}`)

      try {
        const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
        
        if (datosOriginales) {
          const profId = Number(datosOriginales.id_profesor || datosOriginales.profesor?.id)
          const asigId = Number(datosOriginales.id_asignatura || datosOriginales.asignatura?.id)
          const periodoId = Number(datosOriginales.id_periodo || datosOriginales.periodo?.id)

          const aulaAsignada = aulasRes.data.find(
            a => Number(a.id_profesor || a.profesor?.id) === profId &&
                 Number(a.id_asignatura || a.asignatura?.id) === asigId &&
                 Number(a.id_periodo || a.periodo?.id) === periodoId
          )

          if (aulaAsignada) {
            await axios.delete(`${API_ASIGNACIONES_AULAS}/${aulaAsignada.id}`)
          }
        }
      } catch (errAula) {
        console.error('No se encontró aula asociada para eliminar en BD:', errAula)
      }

      await cargarAsignaciones()
      cargandoAccion.value = false
      await Swal.fire({ icon: 'success', title: 'Eliminado', showConfirmButton: false, timer: 1500 })
    } catch (err) {
      cargandoAccion.value = false
      await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar de la base de datos' })
    }
  }
}

const eliminarTodasAsignaciones = async () => {
  const confirm = await Swal.fire({
    title: '¿Estás completamente seguro?',
    text: 'Se eliminarán TODAS las asignaciones y aulas registradas de la base de datos. Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar todo',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#E54848',
    cancelButtonColor: '#88B7F3',
  })

  if (confirm.isConfirmed) {
    cargandoAccion.value = true
    try {
      await axios.delete(`${API_ASIGNACIONES}/eliminar/todos`).catch(() => {})
      
      try {
        const aulasRes = await axios.get(API_ASIGNACIONES_AULAS)
        for (const aulaItem of aulasRes.data) {
          await axios.delete(`${API_ASIGNACIONES_AULAS}/${aulaItem.id}`).catch(() => {})
        }
      } catch (e) {}

      await cargarAsignaciones()
      cargandoAccion.value = false
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado todo!',
        text: 'Se han borrado todos los registros de la base de datos correctamente.',
        showConfirmButton: false,
        timer: 2000,
      })
    } catch (err) {
      cargandoAccion.value = false
      console.error('Error al eliminar todo:', err)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron eliminar todos los registros.',
      })
    }
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  modoEdicion.value = false
  itemEditando.value = null
  busquedaProfesor.value = ''
  busquedaAsignatura.value = ''
  mostrarDropdownProfesor.value = false
  mostrarDropdownAsignatura.value = false
}

onMounted(async () => {
  await cargarCatalogos()
  await cargarAsignaciones()
})
</script>

<style scoped>
/* 🌟 ESTILOS PREMIUM PARA ASIGNACIONES */
.asignaciones-layout-full {
  min-height: 100vh;
  background-color: #f8fafc;
}

.asignaciones-main {
  max-width: 1320px;
  margin: 0 auto;
  padding: 35px 24px;
}

.asignaciones-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.btn-back-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: white;
  color: #3abef9;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.btn-back-icon:hover {
  background: #3abef9;
  color: white;
  border-color: #3abef9;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(58, 190, 249, 0.3);
}

.header-text {
  flex: 1;
  text-align: center;
}

.header-text h1 {
  font-size: 2.1rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.025em;
  margin-bottom: 6px;
}

.header-text p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

.header-spacer {
  width: 44px;
}

.asignaciones-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  padding: 30px;
}

.top-controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.btn-actions-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
  max-width: 340px;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.busqueda-input {
  width: 100%;
  padding: 12px 18px 12px 48px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.92rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.busqueda-input:focus {
  border-color: #3abef9;
  background: white;
  box-shadow: 0 0 0 4px rgba(58, 190, 249, 0.12);
}

.limpiar-busqueda {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.2s;
}

.limpiar-busqueda:hover {
  background: #f1f5f9;
  color: #ef4444;
}

.list-view-container {
  max-height: 580px;
  overflow-y: auto;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  text-align: left;
}

.styled-table thead tr {
  background-color: #88B7F3;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.03em;
}

.styled-table th, .styled-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f1f5f9;
}

.styled-table tbody tr:hover {
  background-color: #f8fafc;
}

.font-weight-semibold {
  font-weight: 600;
  color: #1e293b;
}

.aula-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
}

.periodo-tag, .grupo-tag {
  font-weight: 600;
  color: #475569;
}

.acciones-cell {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.btn-action-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.btn-edit {
  color: #0284c7;
}
.btn-edit:hover {
  background: #e0f2fe;
  border-color: #3abef9;
}

.btn-delete {
  color: #ef4444;
}
.btn-delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.no-results {
  text-align: center;
  padding: 30px;
  color: #64748b;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 24px;
}

.empty-content i {
  font-size: 3.5rem;
  color: #cbd5e1;
  margin-bottom: 16px;
}

.empty-content h3 {
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.empty-content p {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.mt-3 {
  margin-top: 15px;
}

/* MODAL PREMIUM */
.form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.form-modal {
  background: white;
  width: 100%;
  max-width: 720px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 24px 28px;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon-badge {
  width: 40px;
  height: 40px;
  background: #e0f2fe;
  color: #0284c7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 28px;
  max-height: 72vh;
  overflow-y: auto;
}

.form-grid-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  text-align: left;
  position: relative;
}

.input-group.full-width {
  grid-column: 1 / -1;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #475569;
}

.autocomplete-input, .styled-select {
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.92rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.2s ease;
  color: #1e293b;
}

.autocomplete-input:focus, .styled-select:focus {
  border-color: #3abef9;
  background: white;
  box-shadow: 0 0 0 4px rgba(58, 190, 249, 0.12);
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 0 0 12px 12px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 15px 30px -5px rgba(0,0,0,0.15);
  margin-top: 4px;
}

.dropdown-item {
  padding: 12px 16px;
  font-size: 0.88rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  transition: background 0.15s;
}

.dropdown-item:hover {
  background: #f0f9ff;
  color: #0284c7;
  font-weight: 600;
}

.checkbox-group {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 14px;
  background: #f8fafc;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3abef9;
}

.checkbox-item label {
  margin: 0;
  cursor: pointer;
  font-size: 0.88rem;
  color: #334155;
  font-weight: 500;
}

.modal-footer {
  padding: 20px 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  margin-top: 15px;
}

.btn-secondary {
  background: white;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 11px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #94a3b8;
}

.btn-primary {
  background: linear-gradient(135deg, #3abef9 0%, #0284c7 100%);
  color: white;
  border: none;
  padding: 11px 22px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(58, 190, 249, 0.25);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(58, 190, 249, 0.4);
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 11px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* SPINNER MODERNO */
.action-loading {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  color: #1e293b;
  font-weight: 600;
}

.spinner-modern {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #3abef9;
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>