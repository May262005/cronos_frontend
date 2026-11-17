<template>
  <div class="app-layout">
    <!-- SPINNER GLOBAL AL GUARDAR AVATAR -->
    <Teleport to="body">
      <div v-if="cargandoAccion" class="cronos-loading">
        <div class="cronos-spinner"></div>
        <p>Procesando solicitud...</p>
      </div>
    </Teleport>

    <main class="profesores-main">
      <div class="profesores-header">
        <div class="header-text">
          <div class="header-eyebrow">
            <span class="dot"></span> MI CUENTA
          </div>
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información personal y seguridad</p>
        </div>
      </div>

      <div class="perfil-layout">
        <!-- TARJETA DE INFORMACIÓN Y AVATAR -->
        <div class="perfil-card info-card">
          <div class="avatar-large" :style="{ backgroundImage: `url(/avatares/${usuario.id_avatar || 1}.jpg)` }"></div>
          
          <h2 class="perfil-nombre">{{ usuario.nombre }} {{ usuario.apellido_paterno }}</h2>
          <p class="perfil-rol">{{ tituloRol }}</p>
          <p class="perfil-correo">{{ usuario.correo_electronico }}</p>
          
          <div class="info-divider"></div>
          
          <div v-if="nombreDivision" class="info-row">
            <span class="info-label">División</span>
            <span class="info-value">{{ nombreDivision }}</span>
          </div>
          <div v-if="nombreTurno" class="info-row">
            <span class="info-label">Turno Principal</span>
            <span class="info-value">{{ nombreTurno }}</span>
          </div>

          <div class="info-divider"></div>
          
          <div class="avatar-selector">
            <p class="selector-title">Elige tu avatar</p>
            <div class="avatar-grid">
              <button 
                v-for="i in 8" 
                :key="i" 
                @click="cambiarAvatar(i)"
                :class="['avatar-option', { active: usuario.id_avatar === i }]"
                :style="{ backgroundImage: `url(/avatares/${i}.jpg)` }"
              ></button>
            </div>
          </div>
        </div>

        <!-- TARJETA DE CAMBIO DE CONTRASEÑA -->
        <div class="perfil-card form-card">
          <h3 class="form-title">Seguridad</h3>
          <p class="form-desc">Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>

          <div v-if="requiereCambioObligatorio" class="alerta-seguridad">
            <i class="fas fa-shield-alt"></i>
            <span>Debes cambiar tu contraseña temporal para poder usar el sistema.</span>
          </div>

          <form @submit.prevent="cambiarContrasena" class="form-pass">
            <div class="field">
              <label>Nueva Contraseña *</label>
              <input v-model="nuevaContrasena" type="password" required minlength="6" placeholder="Mínimo 6 caracteres" />
            </div>
            <div class="field">
              <label>Confirmar Contraseña *</label>
              <input v-model="confirmarContrasena" type="password" required minlength="6" placeholder="Repite tu contraseña" />
            </div>
            <button type="submit" class="btn-primary" :disabled="cargandoPassword" style="margin-top: 10px;">
              <span v-if="!cargandoPassword"><i class="fas fa-save"></i> Guardar Contraseña</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i> Guardando...</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '../../utils/axios-config'
import Swal from 'sweetalert2'
import '../../assets/styles.css'

const router = useRouter()

const usuario = ref({
  nombre: localStorage.getItem('nombre') || 'Usuario',
  apellido_paterno: '',
  correo_electronico: localStorage.getItem('correo') || 'correo@institucion.edu',
  id_avatar: parseInt(localStorage.getItem('id_avatar')) || 1
})
const rol = ref(localStorage.getItem('rol') || 'usuario')
const nombreDivision = ref(localStorage.getItem('nombre_division') || '')
const nombreTurno = ref(localStorage.getItem('nombre_turno') || '')

const nuevaContrasena = ref('')
const confirmarContrasena = ref('')
const cargandoPassword = ref(false)
const cargandoAccion = ref(false)
const requiereCambioObligatorio = ref(localStorage.getItem('debe_cambiar_contrasena') === 'true')

const tituloRol = computed(() => {
  switch (rol.value) {
    case 'admin': return 'Administrador'
    case 'coordinador': return 'Coordinador'
    case 'profesor': return 'Profesor'
    case 'estudiante': return 'Estudiante'
    default: return 'Usuario'
  }
})

const swalBase = {
  position: 'center',
  heightAuto: false,
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  backdrop: 'rgba(15, 23, 42, 0.45)',
  confirmButtonColor: '#3ABEF9',
  cancelButtonColor: '#94a3b8',
}

onMounted(async () => {
  const userId = localStorage.getItem('id')
  if (userId) {
    try {
      const res = await axios.get(`/usuario/perfil/${userId}`)
      if (res.data && res.data.usuario) {
        usuario.value.nombre = res.data.usuario.nombre
        usuario.value.apellido_paterno = res.data.usuario.apellido_paterno || ''
        usuario.value.correo_electronico = res.data.usuario.correo_electronico
        usuario.value.id_avatar = res.data.usuario.id_avatar || 1
      }
    } catch (error) {
      console.warn('No se pudo cargar el perfil completo', error)
    }
  }
})

const cambiarAvatar = async (id) => {
  cargandoAccion.value = true
  try {
    const userId = localStorage.getItem('id')
    await axios.patch(`/usuario/avatar/${userId}`, { id_avatar: id })
    
    usuario.value.id_avatar = id
    localStorage.setItem('id_avatar', id)
    
    // 👇 ESTA ES LA LÍNEA MÁGICA QUE FALTABA 👇
    // Le avisa al App.vue que el avatar cambió para que se actualice al instante
    window.dispatchEvent(new Event('avatar-actualizado'))

    Swal.fire({
      ...swalBase,
      icon: 'success',
      title: 'Avatar actualizado',
      text: 'Tu foto de perfil se ha cambiado correctamente.',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (err) {
    Swal.fire({
      ...swalBase,
      icon: 'error',
      title: 'Error al cambiar avatar',
      text: err.response?.data?.message || 'Inténtalo de nuevo',
      confirmButtonText: 'Entendido'
    })
  } finally {
    cargandoAccion.value = false
  }
}

const cambiarContrasena = async () => {
  if (nuevaContrasena.value !== confirmarContrasena.value) {
    Swal.fire({
      ...swalBase,
      icon: 'error',
      title: 'Error',
      text: 'Las contraseñas no coinciden',
      confirmButtonText: 'Entendido'
    })
    return
  }

  cargandoPassword.value = true
  try {
    await axios.patch('/auth/cambiar-contrasena', { nueva_contrasena: nuevaContrasena.value })
    localStorage.removeItem('debe_cambiar_contrasena')
    requiereCambioObligatorio.value = false

    await Swal.fire({
      ...swalBase,
      icon: 'success',
      title: '¡Contraseña actualizada!',
      text: 'Tu contraseña ha sido guardada.',
      confirmButtonText: 'Entendido'
    })

    switch (rol.value) {
      case 'admin': router.push('/dashboard'); break
      case 'coordinador': router.push('/dashboard'); break
      case 'profesor': router.push('/profesor'); break
      case 'estudiante': router.push('/alumno'); break
      default: router.push('/'); break
    }

  } catch (err) {
    Swal.fire({
      ...swalBase,
      icon: 'error',
      title: 'Error',
      text: err.response?.data?.message || 'No se pudo cambiar la contraseña',
      confirmButtonText: 'Entendido'
    })
  } finally {
    cargandoPassword.value = false
  }
}
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
.profesores-main { padding: 40px 24px; max-width: 1000px; margin: 0 auto; }
.profesores-header { margin-bottom: 32px; text-align: center; }
.header-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 700; color: #3ABEF9; letter-spacing: 0.12em; margin-bottom: 10px; }
.header-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.2); }
.header-text h1 { font-size: 2rem; font-weight: 800; color: var(--text-main); margin: 0 0 6px; }
.header-text p { color: var(--text-muted); font-size: 0.92rem; margin: 0; }

.perfil-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; }
.perfil-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 32px; box-shadow: var(--shadow-card); }

.info-card { text-align: center; display: flex; flex-direction: column; align-items: center; }
.avatar-large { width: 100px; height: 100px; border-radius: 50%; background-color: var(--bg-hover); background-size: cover; background-position: center; border: 3px solid #3ABEF9; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(58, 190, 249, 0.2); }
.perfil-nombre { font-size: 1.4rem; color: var(--text-main); font-weight: 700; margin: 0 0 4px; }
.perfil-rol { font-size: 0.85rem; font-weight: 600; color: #3ABEF9; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.perfil-correo { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
.info-divider { width: 100%; height: 1px; background: var(--border-color); margin-bottom: 24px; }
.info-row { width: 100%; display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
.info-row:last-child { border-bottom: none; }
.info-label { font-weight: 600; color: var(--text-muted); font-size: 0.9rem; }
.info-value { color: var(--text-main); font-size: 0.9rem; text-align: right; }

.avatar-selector { width: 100%; }
.selector-title { font-size: 0.9rem; font-weight: 600; color: var(--text-main); margin-bottom: 12px; text-align: left; }
.avatar-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.avatar-option { width: 50px; height: 50px; border-radius: 50%; background-color: var(--bg-hover); background-size: cover; background-position: center; border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; padding: 0; }
.avatar-option:hover { transform: scale(1.1); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.avatar-option.active { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.3); transform: scale(1.05); }

.form-title { font-size: 1.2rem; color: var(--text-main); font-weight: 700; margin-bottom: 8px; }
.form-desc { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px; }
.alerta-seguridad { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-size: 0.85rem; font-weight: 500; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.2); }
.form-pass { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
.field input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; background: var(--bg-input); color: var(--text-main); outline: none; transition: all 0.2s; box-sizing: border-box; }
.field input:focus { border-color: #3ABEF9; box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.15); }

.btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; background: #3ABEF9; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
.btn-primary:hover:not(:disabled) { background: #0284c7; }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

@media (max-width: 800px) {
  .perfil-layout { grid-template-columns: 1fr; }
}
</style>