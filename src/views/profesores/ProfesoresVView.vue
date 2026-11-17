<template>
  <div class="profesores-main">
    <Teleport to="body">
      <div v-if="cargandoAccion" class="cronos-loading">
        <div class="cronos-spinner"></div>
        <p>Procesando solicitud...</p>
      </div>
    </Teleport>

    <!-- HEADER -->
    <div class="profesores-header">
      <div class="header-text">
        <div class="header-eyebrow">
          <span class="dot"></span> MI ESPACIO
        </div>
        <h1>Mi Horario</h1>
        <p>Consulta tu horario de clases y gestiona tus servicios</p>
      </div>
    </div>

    <!-- ACCESOS DIRECTOS -->
    <div class="accesos-directos">
      <router-link to="/profesor/asesorias" class="btn-acceso-card">
        <div class="acceso-icon"><i class="fas fa-chalkboard-teacher"></i></div>
        <span>Ver Asesorías</span>
      </router-link>

      <router-link v-if="esPsicologo" to="/profesor/psicologia" class="btn-acceso-card">
        <div class="acceso-icon"><i class="fas fa-brain"></i></div>
        <span>Citas Psicología</span>
      </router-link>

      <router-link to="/profesor/disponibilidad" class="btn-acceso-card">
        <div class="acceso-icon"><i class="fas fa-calendar-alt"></i></div>
        <span>Disponibilidad</span>
      </router-link>
    </div>

    <!-- ESTADOS DEL HORARIO -->
    <div v-if="isLoading" class="empty-state-container">
      <div class="empty-card">
        <div class="spinner"></div>
        <p>Cargando horario...</p>
      </div>
    </div>

    <div v-else-if="error" class="empty-state-container">
      <div class="empty-card error-card">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar</h3>
        <p>{{ error }}</p>
        <button @click="cargarHorario" class="btn-primary">Reintentar</button>
      </div>
    </div>

    <div v-else-if="!horarioProfesor" class="empty-state-container">
      <div class="empty-card">
        <i class="fas fa-calendar-times"></i>
        <h3>Horario no disponible</h3>
        <p>Tu horario aún no ha sido generado.</p>
        <p class="text-muted">Por favor, contacta con el coordinador académico.</p>
      </div>
    </div>

    <!-- LA TABLA DEL HORARIO -->
    <div v-else-if="horarioProfesor && !isLoading && !error" class="tabla-wrap" :id="`horario-card-${horarioProfesor.id}`">
      <div class="horario-header" style="padding: 20px; border-bottom: 1px solid var(--border-color);">
        <div class="horario-info">
          <p class="school-info">
            <b>{{ nombreEscuela }}</b> | Período: <b>{{ periodoCuatrimestral }}</b>
          </p>
          <h2 class="horario-title">Profesor: {{ horarioProfesor.nombre }}</h2>
          <p class="division-info">{{ divisionUniforme }}</p>
        </div>

        <div class="horario-actions">
          <button @click="generarPDFIndividual(horarioProfesor.id, horarioProfesor.nombre)" class="btn-primary" style="background: #ef4444; border-color: #ef4444;">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
        </div>
      </div>

      <div class="leyenda-colores" style="padding: 16px 20px; background: var(--bg-hover); border-bottom: 1px solid var(--border-color);">
        <span class="leyenda-label">Grupos:</span>
        <div class="leyenda-items">
          <div v-for="leyendaItem in getLeyendaIndividual(horarioProfesor)" :key="leyendaItem.nombre" class="leyenda-item">
            <div class="leyenda-color" :style="{ backgroundColor: leyendaItem.color }"></div>
            <span>{{ leyendaItem.nombre }}</span>
          </div>
        </div>
      </div>

      <div class="horario-tabla-wrapper" style="overflow-x: auto;">
        <table class="tabla">
          <thead>
            <tr>
              <th class="hora-col">Hora</th>
              <th v-for="dia in dias" :key="dia">{{ dia.substring(0, 3) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="hora in horas" :key="hora">
              <td class="hora-cell">{{ formatTimeRange(hora) }}</td>
              <td v-for="dia in dias" :key="dia" class="clase-cell" :style="getCeldaStyle(horarioProfesor, dia, hora)">
                <template v-if="horarioProfesor.data[dia] && horarioProfesor.data[dia][hora]">
                  <div v-for="(clase, idx) in horarioProfesor.data[dia][hora]" :key="idx" class="clase-content" :class="{ 'clase-multiple': idx > 0 }">
                    <div class="clase-materia">{{ clase.materia }}</div>
                    <div class="clase-grupo">{{ clase.grupo }}</div>
                    <div class="clase-aula">{{ clase.aula }}</div>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 👇 MODAL DE CONTRASEÑA CON TUS ESTILOS EXACTOS 👇 -->
    <div v-if="mostrarCambioContrasena" class="form-overlay">
      <div class="form-modal" style="max-width: 440px;">
        <div class="modal-header">
          <div class="modal-eyebrow">SEGURIDAD</div>
          <h2>Cambio de Contraseña</h2>
        </div>

        <div class="modal-body">
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
            Hola <b>{{ nombreProfesor }}</b>, por motivos de seguridad debes cambiar tu contraseña temporal antes de acceder al sistema.
          </p>

          <form @submit.prevent="guardarNuevaContrasena">
            <div class="form-grid" style="grid-template-columns: 1fr;">
              <div class="field">
                <label>Nueva Contraseña *</label>
                <input v-model="nuevaContrasena" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
              </div>
              <div class="field">
                <label>Confirmar Contraseña *</label>
                <input v-model="confirmarContrasena" type="password" required minlength="6" placeholder="Repite tu contraseña" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="submit" class="btn-primary" :disabled="cargandoPassword" style="width: 100%; justify-content: center;">
                <span v-if="!cargandoPassword">Actualizar Contraseña <i class="fas fa-check"></i></span>
                <span v-else><i class="fas fa-spinner fa-spin"></i> Guardando...</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from '../../utils/axios-config';
import Swal from 'sweetalert2';
import '../../assets/styles.css';

const router = useRouter();
const nombreEscuela = ref('UTEQ');
const periodoCuatrimestral = ref('AGO-DIC 2025');
const divisionUniforme = ref('INGENIERÍA');
const dias = ref(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
const horas = ref(['17:00', '18:00', '19:00', '20:00', '21:00']);

const isLoading = ref(false);
const error = ref(null);
const horarioProfesor = ref(null);
const esPsicologoReal = ref(false);
const esPsicologo = computed(() => esPsicologoReal.value === true);
const cargandoAccion = ref(false);

/* ============ VARIABLES DEL MODAL ============ */
const mostrarCambioContrasena = ref(false);
const nuevaContrasena = ref('');
const confirmarContrasena = ref('');
const cargandoPassword = ref(false);
const nombreProfesor = ref(localStorage.getItem('nombre') || 'Profesor');

const NESTJS_API = `http://localhost:3000`;

const obtenerIdProfesor = () => {
  const idRol = localStorage.getItem('id_rol');
  if (idRol) return idRol;
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.sub) return payload.sub;
    } catch (e) {}
  }
  return localStorage.getItem('id');
};

const cargarHorario = async () => {
  isLoading.value = true;
  error.value = null;
  const idProfesor = obtenerIdProfesor();

  if (!idProfesor) {
    error.value = "No se pudo identificar al profesor.";
    isLoading.value = false;
    return;
  }

  try {
    const response = await fetch(`${NESTJS_API}/horario-profesor-asignatura/profesor/${idProfesor}/publicado`);

    if (!response.ok) {
      if (response.status === 404) {
        horarioProfesor.value = null;
        esPsicologoReal.value = false;
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return;
    }

    const data = await response.json();
    esPsicologoReal.value = data.es_psicologo || false;

    horarioProfesor.value = {
      id: data.id,
      nombre: data.nombre,
      data: {}
    };

    dias.value.forEach(d => horarioProfesor.value.data[d] = {});

    if (data.data) {
      Object.keys(data.data).forEach(d => {
        Object.keys(data.data[d]).forEach(h => {
          horarioProfesor.value.data[d][h] = Array.isArray(data.data[d][h])
            ? data.data[d][h]
            : [data.data[d][h]];
        });
      });
    }
  } catch (e) {
    console.error('Error al cargar horario:', e);
    error.value = "Error al conectar con el servidor";
    esPsicologoReal.value = false;
  } finally {
    isLoading.value = false;
  }
};

const getCeldaStyle = (item, dia, hora) => {
  const clase = item?.data?.[dia]?.[hora];
  if (!clase || !clase.length) return {};
  const c = clase[0];
  const bgColor = c.colorGrupo || '#88B7F3';
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return {
    backgroundColor: bgColor,
    borderLeft: `4px solid ${c.colorMateria || '#e2e8f0'}`,
    color: brightness > 125 ? '#1e293b' : '#ffffff'
  };
};

const getLeyendaIndividual = (item) => {
  if (!item || !item.data) return [];
  const itemsMap = new Map();
  Object.values(item.data).forEach(dia => {
    if (dia) {
      Object.values(dia).forEach(clases => {
        if (Array.isArray(clases)) {
          clases.forEach(clase => {
            if (clase && clase.grupo) {
              itemsMap.set(clase.grupo, {
                nombre: clase.grupo,
                color: clase.colorGrupo
              });
            }
          });
        }
      });
    }
  });
  return Array.from(itemsMap.values());
};

const formatTimeRange = (startHour) => {
  if (!startHour || !startHour.includes(':')) return startHour;
  const [h, m] = startHour.split(':').map(Number);
  const end = h * 60 + m + 60;
  const eh = String(Math.floor(end / 60) % 24).padStart(2, '0');
  const em = String(end % 60).padStart(2, '0');
  return `${startHour} - ${eh}:${em}`;
};

const generarPDFIndividual = async (id, nombre) => {
  const el = document.getElementById(`horario-card-${id}`);
  if (!el) return;
  const actions = el.querySelector('.horario-actions');
  if (actions) actions.style.visibility = 'hidden';
  try {
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
    pdf.save(`Horario_Profesor_${nombre}.pdf`);
  } finally {
    if (actions) actions.style.visibility = 'visible';
  }
};

/* ============ LOGICA DEL MODAL ============ */
const verificarCambioContrasena = () => {
  // Lee el localStorage. Si dice 'true', salta el modal.
  const requiereCambio = localStorage.getItem('debe_cambiar_contrasena');
  
  if (requiereCambio === 'true') {
    mostrarCambioContrasena.value = true;
  }
};

const guardarNuevaContrasena = async () => {
  if (nuevaContrasena.value !== confirmarContrasena.value) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Las contraseñas no coinciden',
      confirmButtonColor: '#3ABEF9',
      background: 'var(--bg-card)',
      color: 'var(--text-main)'
    });
    return;
  }

  cargandoPassword.value = true;
  try {
    await axios.patch('/auth/cambiar-contrasena', {
      nueva_contrasena: nuevaContrasena.value
    });

    localStorage.removeItem('debe_cambiar_contrasena');
    mostrarCambioContrasena.value = false;

    await Swal.fire({
      icon: 'success',
      title: '¡Contraseña actualizada!',
      text: 'Tu nueva contraseña ha sido guardada con éxito.',
      confirmButtonColor: '#3ABEF9',
      background: 'var(--bg-card)',
      color: 'var(--text-main)'
    });

  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || 'No se pudo cambiar la contraseña',
      confirmButtonColor: '#3ABEF9',
      background: 'var(--bg-card)',
      color: 'var(--text-main)'
    });
  } finally {
    cargandoPassword.value = false;
  }
};

onMounted(() => {
  verificarCambioContrasena();
  cargarHorario();
});
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
.profesores-main { padding: 32px 24px; max-width: 1200px; margin: 0 auto; }
.profesores-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
.header-text { flex: 1; text-align: center; }
.header-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 700; color: #3ABEF9; letter-spacing: 0.12em; margin-bottom: 10px; }
.header-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.2); }
.header-text h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-main); margin: 0 0 6px; line-height: 1.1; }
.header-text p { color: var(--text-muted); font-size: 0.92rem; margin: 0; }

.accesos-directos { display: flex; gap: 20px; margin-bottom: 40px; justify-content: center; flex-wrap: wrap; }
.btn-acceso-card { display: flex; flex-direction: column; align-items: center; background: var(--bg-card); padding: 25px; border-radius: 20px; width: 180px; box-shadow: var(--shadow-card); text-decoration: none; border: 1px solid var(--border-color); transition: all 0.3s ease; }
.btn-acceso-card:hover { transform: translateY(-5px); box-shadow: 0 20px 30px rgba(58, 190, 249, 0.15); border-color: #3ABEF9; }
.acceso-icon { font-size: 2.5rem; color: #3abef9; margin-bottom: 12px; }
.btn-acceso-card span { font-weight: 700; color: var(--text-main); font-size: 0.9rem; }

.empty-state-container { display: flex; justify-content: center; align-items: center; min-height: 400px; }
.empty-card { background: var(--bg-card); border-radius: 24px; padding: 50px 40px; text-align: center; max-width: 450px; width: 90%; box-shadow: var(--shadow-card); border: 1px solid var(--border-color); }
.empty-card i { font-size: 4rem; color: var(--text-light); margin-bottom: 20px; }
.empty-card h3 { font-size: 1.5rem; color: var(--text-main); margin-bottom: 12px; font-weight: 700; }
.empty-card p { color: var(--text-muted); }
.empty-card .text-muted { font-size: 0.85rem; color: var(--text-light); }
.spinner { width: 50px; height: 50px; border: 4px solid var(--border-color); border-top-color: #3abef9; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px; }

.tabla-wrap { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-card); transition: background-color 0.3s, border-color 0.3s; }
.horario-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; }
.school-info { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }
.horario-title { font-size: 1.5rem; color: var(--text-main); margin: 5px 0; font-weight: 700; }
.leyenda-colores { display: flex; align-items: center; flex-wrap: wrap; gap: 15px; }
.leyenda-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.leyenda-items { display: flex; flex-wrap: wrap; gap: 12px; }
.leyenda-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-main); }
.leyenda-color { width: 14px; height: 14px; border-radius: 4px; }

.tabla { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.tabla thead { background: var(--bg-hover); color: var(--text-muted); }
.tabla th { text-align: left; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; padding: 14px 20px; border-bottom: 1px solid var(--border-color); text-align: center; }
.tabla td { padding: 10px; text-align: center; border-bottom: 1px solid var(--border-color); border-right: 1px solid var(--border-color); vertical-align: middle; }
.tabla td:last-child { border-right: none; }
.hora-cell { background: var(--bg-hover); font-weight: 600; color: var(--text-muted); font-size: 0.8rem; }
.clase-content { text-align: center; }
.clase-materia { font-weight: 700; font-size: 0.75rem; }
.clase-grupo, .clase-aula { font-size: 0.7rem; opacity: 0.8; }
.clase-multiple { margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0, 0, 0, 0.1); }

.form-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 20px; }
.form-modal { background: var(--bg-card); width: 100%; border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-modal); animation: pop 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-header { position: relative; padding: 22px 24px 18px; border-bottom: 1px solid var(--border-color); background: var(--bg-card); }
.modal-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #3ABEF9; }
.modal-eyebrow { font-size: 0.68rem; font-weight: 700; color: #3ABEF9; letter-spacing: 0.12em; margin-bottom: 6px; }
.modal-header h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main); }
.modal-body { padding: 22px 24px; }
.form-grid { display: grid; gap: 16px; }
.field { display: flex; flex-direction: column; }
.field label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
.field input { width: 100%; padding: 10px 13px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.88rem; outline: none; background: var(--bg-input); color: var(--text-main); font-family: inherit; box-sizing: border-box; }
.field input:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12); }
.modal-footer { padding: 14px 24px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-color); background: var(--bg-card); margin: 22px -24px -22px; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; background: #3ABEF9; color: #ffffff; border: 1px solid #3ABEF9; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
.btn-primary:hover:not(:disabled) { background: #0284c7; border-color: #0284c7; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

@media (max-width: 768px) {
  .profesores-main { padding: 20px 16px; }
  .header-text h1 { font-size: 1.5rem; }
  .btn-acceso-card { width: 100%; }
}
</style>