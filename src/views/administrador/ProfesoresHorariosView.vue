<template>
  <div class="perfil-container-full">
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

    <main class="main-content">
      <!-- HEADER CON DISEÑO MODERNIZADO -->
      <div class="page-header">
        <div class="header-title-flex">
          <button @click="goBack" class="btn-back-icon" title="Volver a Profesores">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="header-text">
            <h1>Disponibilidad Horaria</h1>
            <p v-if="nombreProfesor">Gestionando agenda de <strong>{{ nombreProfesor }}</strong></p>
            <p v-else>Selecciona las horas disponibles en el calendario</p>
          </div>
          <div class="header-spacer"></div>
        </div>
      </div>

      <div v-if="cargando" class="loading-container">
        <div class="spinner-modern"></div>
        <p>Cargando información docente...</p>
      </div>

      <div v-else-if="profesorSeleccionado && horasMostradas.length" class="horario-card">
        <div class="card-header-flex">
          <div class="instr">
            <i class="fas fa-info-circle"></i>
            <span>Haz clic o arrastra sobre las celdas para alternar el estado de disponibilidad.</span>
          </div>
          <div class="actions">
            <button @click="guardarCambios" class="btn-primary-save" :disabled="cargandoAccion">
              <i class="fas fa-save"></i> {{ cargandoAccion ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>

        <!-- CONTROLES SUPERIORES: FILTROS Y PALETA -->
        <div class="controles-grid">
          <!-- Selector de turno -->
          <div class="turno-selector">
            <label for="turno"><i class="fas fa-clock"></i> Filtrar Turno:</label>
            <select id="turno" v-model="turnoSeleccionado" @change="filtrarHorasPorTurno" class="styled-select">
              <option value="">Jornada Completa (07:00 - 22:00)</option>
              <option v-for="turno in turnos" :key="turno.id" :value="turno.id">
                {{ turno.nombre }}
              </option>
            </select>
          </div>

          <!-- Selector de color / estado -->
          <div class="color-selector">
            <div
              v-for="color in colores"
              :key="color.estado"
              class="color-option"
              :class="{ active: color.estado === colorSeleccionado }"
              @click="seleccionarColor(color.estado)"
            >
              <div class="color-circle" :style="{ backgroundColor: color.color }"></div>
              <span>{{ color.nombre }}</span>
            </div>
          </div>
        </div>

        <!-- TABLA DE DISPONIBILIDAD ESTILIZADA -->
        <div class="tabla-disponibilidad-wrapper">
          <table class="tabla-dispo">
            <thead>
              <tr>
                <th class="hora-col">Horario</th>
                <th v-for="dia in diasSemana" :key="dia.valor">{{ dia.nombre }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="hora in horasMostradas" :key="hora">
                <td class="hora-label">{{ hora }}</td>
                <td
                  v-for="dia in diasSemana"
                  :key="dia.valor"
                  :class="['celda-dispo', getCeldaClase(dia.valor, hora)]"
                  @click="pintarCelda(dia.valor, hora)"
                >
                  <i v-if="estadoCelda(dia.valor, hora) === 'disponible'" class="fas fa-check"></i>
                  <i v-else-if="estadoCelda(dia.valor, hora) === 'no_disponible'" class="fas fa-times"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="btn-group">
          <router-link to="/profesores" style="text-decoration: none;">
            <button class="btn-secondary">Cancelar</button>
          </router-link>
          <button class="btn-primary" @click="guardarCambios">Guardar Cambios</button>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-content">
          <i class="fas fa-calendar-times"></i>
          <h3>No se pudo cargar la información</h3>
          <p>Verifica la conexión o selecciona un profesor válido</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import '../../assets/styles.css'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  router.back()
}

const API_HORARIOS = `http://localhost:3000/horario-profesor`
const API_PROFESORES = `http://localhost:3000/profesores`
const API_TURNOS = `http://localhost:3000/turnos`

const profesorSeleccionado = ref('')
const horariosProfesor = ref([])
const nombreProfesor = ref('')
const turnos = ref([])
const turnoSeleccionado = ref('')
const todasLasHoras = ref([])
const horasMostradas = ref([])
const cambiosPendientes = ref(new Set())

const cargando = ref(false)
const cargandoAccion = ref(false)

const diasSemana = [
  { valor: '1', nombre: 'Lunes' },
  { valor: '2', nombre: 'Martes' },
  { valor: '3', nombre: 'Miércoles' },
  { valor: '4', nombre: 'Jueves' },
  { valor: '5', nombre: 'Viernes' },
]

const colores = [
  { nombre: 'Disponible', estado: 'disponible', color: '#3ABEF9' },
  { nombre: 'No disponible', estado: 'no_disponible', color: '#E54848' },
]

const colorSeleccionado = ref('disponible')

const seleccionarColor = (estado) => {
  colorSeleccionado.value = estado
}

const normalizarHora = (hora) => hora.slice(0, 5)

const generarTodasLasHoras = () => {
  const horas = []
  for (let h = 7; h <= 22; h++) {
    horas.push(h.toString().padStart(2, '0') + ':00')
  }
  todasLasHoras.value = horas
  horasMostradas.value = horas
}

const getCeldaClase = (dia, hora) => {
  const estado = estadoCelda(dia, hora)
  if (estado === 'disponible') return 'disponible'
  if (estado === 'no_disponible') return 'no_disponible'
  return ''
}

const cargarDatosProfesor = async () => {
  const id = route.params.id
  if (!id) return

  cargando.value = true
  profesorSeleccionado.value = id
  
  generarTodasLasHoras()
  
  try {
    const resProf = await axios.get(`${API_PROFESORES}/${id}`)
    const prof = resProf.data
    nombreProfesor.value = `${prof.usuario?.nombre || ''} ${prof.usuario?.apellido_paterno || ''}`
    await cargarTurnos()
    await cargarHorarioProfesor()
  } catch (error) {
    console.error('Error al cargar datos del profesor:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar la información del profesor',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  } finally {
    cargando.value = false
  }
}

const cargarTurnos = async () => {
  try {
    const res = await axios.get(API_TURNOS)
    turnos.value = res.data
  } catch (error) {
    console.error('Error al cargar turnos:', error)
  }
}

const filtrarHorasPorTurno = () => {
  if (!turnoSeleccionado.value) {
    horasMostradas.value = todasLasHoras.value
    return
  }

  const turno = turnos.value.find((t) => t.id === turnoSeleccionado.value)
  if (!turno) {
    horasMostradas.value = todasLasHoras.value
    return
  }

  const horaInicioRaw = turno.horaInicio || turno.hora_inicio
  const horaFinRaw = turno.horaFin || turno.hora_fin

  if (!horaInicioRaw || !horaFinRaw) {
    horasMostradas.value = todasLasHoras.value
    return
  }

  const horaInicio = parseInt(horaInicioRaw.split(':')[0])
  const horaFin = parseInt(horaFinRaw.split(':')[0])

  const horasFiltradas = []
  for (let h = horaInicio; h <= horaFin; h++) {
    horasFiltradas.push(h.toString().padStart(2, '0') + ':00')
  }
  horasMostradas.value = horasFiltradas
}

const cargarHorarioProfesor = async () => {
  try {
    const res = await axios.get(`${API_HORARIOS}/profesor/${profesorSeleccionado.value}`)
    
    horariosProfesor.value = res.data.map((h) => ({
      id: h.id,
      dia: String(h.dia),
      hora: normalizarHora(h.hora),
      estado: h.disponible ? 'disponible' : 'no_disponible',
      disponible: h.disponible,
      id_profesor: h.id_profesor || Number(profesorSeleccionado.value),
    }))
  } catch (error) {
    console.error('Error al cargar horario del profesor:', error)
    horariosProfesor.value = []
  }
}

const marcarCambio = (dia, hora) => {
  const clave = `${dia}-${hora}`
  cambiosPendientes.value.add(clave)
}

const pintarCelda = (dia, hora) => {
  const index = horariosProfesor.value.findIndex(
    (h) => h.dia === String(dia) && h.hora === hora
  )

  if (index !== -1) {
    const celda = horariosProfesor.value[index]

    if (celda.estado === colorSeleccionado.value) {
      horariosProfesor.value.splice(index, 1)
      marcarCambio(dia, hora)
      return
    }

    celda.estado = colorSeleccionado.value
    celda.disponible = colorSeleccionado.value === 'disponible'
    marcarCambio(dia, hora)
    return
  }

  horariosProfesor.value.push({
    dia: String(dia),
    hora,
    estado: colorSeleccionado.value,
    disponible: colorSeleccionado.value === 'disponible',
    id_profesor: Number(profesorSeleccionado.value),
  })
  marcarCambio(dia, hora)
}

const estadoCelda = (dia, hora) => {
  const registro = horariosProfesor.value.find((h) => h.dia === String(dia) && h.hora === hora)
  return registro ? registro.estado : ''
}

const guardarCambios = async () => {
  if (cambiosPendientes.value.size === 0) {
    await Swal.fire({
      icon: 'info',
      title: 'Sin cambios',
      text: 'No hay modificaciones pendientes para guardar',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      width: '450px',
    })
    return
  }

  cargandoAccion.value = true
  try {
    const promesas = []

    for (const clave of cambiosPendientes.value) {
      const [dia, hora] = clave.split('-')
      const registro = horariosProfesor.value.find(
        (h) => h.dia === dia && h.hora === hora
      )

      if (registro) {
        if (registro.id) {
          promesas.push(
            axios.patch(`${API_HORARIOS}/${registro.id}`, {
              disponible: registro.disponible,
            })
          )
        } else {
          promesas.push(
            axios.post(API_HORARIOS, {
              dia: registro.dia,
              hora: registro.hora,
              disponible: registro.disponible,
              id_profesor: registro.id_profesor,
            })
          )
        }
      } else {
        const registroOriginal = horariosProfesor.value.find(
          (h) => h.dia === dia && h.hora === hora && h.id
        )
        if (registroOriginal?.id) {
          promesas.push(axios.delete(`${API_HORARIOS}/${registroOriginal.id}`))
        }
      }
    }

    await Promise.all(promesas)
    cargandoAccion.value = false
    
    await Swal.fire({
      icon: 'success',
      title: '¡Guardado con éxito!',
      text: 'La disponibilidad horaria ha sido actualizada',
      showConfirmButton: false,
      timer: 2000,
      background: '#ffffff',
      color: '#213547',
      iconColor: '#3ABEF9',
      width: '450px',
    })

    cambiosPendientes.value.clear()
    router.push('/profesores')

  } catch (error) {
    cargandoAccion.value = false
    console.error('Error al guardar cambios:', error)
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo guardar la disponibilidad',
      confirmButtonColor: '#3ABEF9',
      background: '#ffffff',
      color: '#213547',
      iconColor: '#E54848',
      width: '450px',
    })
  } finally {
    cargandoAccion.value = false
  }
}

onMounted(cargarDatosProfesor)
</script>

<style scoped>
.perfil-container-full {
  background-color: #f8fafc;
  min-height: 100vh;
  width: 100%;
}

.main-content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 35px 24px;
}

.page-header {
  margin-bottom: 25px;
}

.header-title-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

/* 📋 TARJETA PRINCIPAL DEL CALENDARIO */
.horario-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 15px;
}

.instr {
  color: #64748b;
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.instr i {
  color: #3abef9;
  font-size: 1.1rem;
}

/* 🎛️ CONTROLES Y FILTROS */
.controles-grid {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
  background: #f8fafc;
  padding: 18px 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.turno-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.turno-selector label {
  font-weight: 700;
  color: #475569;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.styled-select {
  padding: 10px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.styled-select:focus {
  border-color: #3abef9;
  box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.15);
}

/* Selector de colores / leyenda moderna */
.color-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s;
  background: white;
}

.color-option:hover {
  border-color: #cbd5e1;
}

.color-option.active {
  background: #e0f2fe;
  border-color: #3abef9;
}

.color-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.color-option span {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
}

/* 📅 TABLA DE DISPONIBILIDAD */
.tabla-disponibilidad-wrapper {
  overflow-x: auto;
  margin-bottom: 30px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.tabla-dispo {
  width: 100%;
  border-collapse: separate;
  border-spacing: 6px;
  background: white;
  padding: 10px;
}

.tabla-dispo th {
  background: #88B7F3;
  color: white;
  padding: 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-align: center;
}

.hora-label {
  background: #f1f5f9;
  color: #475569;
  font-weight: 700;
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  width: 110px;
  font-size: 0.88rem;
}

.celda-dispo {
  height: 50px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.celda-dispo:hover {
  border-color: #3abef9;
  background: #f0f9ff;
  transform: scale(1.02);
}

.celda-dispo.disponible {
  background: #3abef9 !important;
  border-style: solid;
  border-color: #0284c7;
  box-shadow: 0 4px 12px rgba(58, 190, 249, 0.3);
}

.celda-dispo.no_disponible {
  background: #ef4444 !important;
  border-style: solid;
  border-color: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.celda-dispo i {
  color: white;
  font-size: 1.1rem;
  font-weight: 900;
}

/* 🔘 BOTONES DE ACCIÓN INFERIORES */
.btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-primary-save {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
}

.btn-primary-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
}

.btn-primary-save:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3abef9 0%, #0284c7 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(58, 190, 249, 0.25);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(58, 190, 249, 0.4);
}

.btn-secondary {
  background: white;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #94a3b8;
}

/* ESTADOS DE CARGA Y VACÍO */
.loading-container {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

.spinner-modern {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #3abef9;
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
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
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px;
  }
  
  .horario-card {
    padding: 20px;
  }
  
  .controles-grid {
    flex-direction: column;
    align-items: stretch;
  }
  
  .color-selector {
    justify-content: center;
  }
  
  .btn-group {
    flex-direction: column-reverse;
  }
  
  .btn-group button, .btn-group a {
    width: 100%;
  }
  
  .btn-group a button {
    width: 100%;
  }
}

</style>