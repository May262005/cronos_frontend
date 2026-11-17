<template>
  <div class="login-wrapper">
    <div class="login-container-card">
      <div class="logo-section">
        <img src="../../imagenes/logo1.png" class="img-lo-reg" alt="Logo Cronos" />
        <h2 class="welcome-text">Bienvenido de nuevo</h2>
        <p class="subtitle-text">Ingresa tus credenciales para acceder al sistema.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form-lg">
        <div class="input-group">
          <label>Correo Electrónico</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope"></i>
            <input v-model="correo_electronico" type="email" placeholder="correo@institucion.edu" required />
          </div>
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <div class="input-wrapper">
            <i class="fas fa-lock"></i>
            <input v-model="contrasena" type="password" placeholder="••••••••" required />
          </div>
        </div>

        <div class="btn-container">
          <button type="submit" class="btn-primary-login">
            Iniciar Sesión <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import axios from '../../utils/axios-config'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()
const correo_electronico = ref('')
const contrasena = ref('')

const handleSubmit = () => {
  login()
}

const login = async () => {
  if (!correo_electronico.value || !contrasena.value) {
    Swal.fire({
      icon: 'error',
      title: 'Campos incompletos',
      text: 'Por favor, ingresa tu correo y contraseña.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3ABEF9',
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      iconColor: '#E54848',
      width: '400px',
    })
    return
  }

  try {
    const res = await axios.post('/auth/login', {
      correo_electronico: correo_electronico.value,
      contrasena: contrasena.value
    })

    // Guardamos los datos en localStorage
    localStorage.setItem('access_token', res.data.token)
    localStorage.setItem('id', res.data.id)
    localStorage.setItem('id_rol', res.data.id_rol)
    localStorage.setItem('nombre', res.data.nombre)
    localStorage.setItem('rol', res.data.rol)
    localStorage.setItem('id_avatar', res.data.id_avatar || 1)
    localStorage.setItem('debe_cambiar_contrasena', res.data.debe_cambiar_contrasena ? 'true' : 'false')
    
    // División y turno para cualquier rol
    localStorage.setItem('id_division', res.data.id_division ?? '')
    localStorage.setItem('id_turno', res.data.id_turno ?? '')
    localStorage.setItem('nombre_division', res.data.nombre_division ?? '')
    localStorage.setItem('abreviatura_division', res.data.abreviatura_division ?? '')
    localStorage.setItem('nombre_turno', res.data.nombre_turno ?? '')

    await Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Hola ${res.data.nombre}`,
      showConfirmButton: false,
      timer: 1500,
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      iconColor: '#3ABEF9',
      width: '400px'
    })

    switch (res.data.rol) {
      case 'estudiante': router.push({ name: 'alumno-home' }); break
      case 'admin': router.push({ name: 'dashboard' }); break
      case 'coordinador': router.push({ name: 'dashboard' }); break
      case 'profesor': router.push({ name: 'profesor-home' }); break
      default: router.push({ name: 'login' })
    }

  } catch (err) {
    let mensajeError = 'Error al iniciar sesión'
    if (err.response?.data?.message) {
      mensajeError = err.response.data.message
    }
    Swal.fire({
      icon: 'error',
      title: 'Error de inicio de sesión',
      text: mensajeError,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3ABEF9',
      background: 'var(--bg-card)',
      color: 'var(--text-main)',
      iconColor: '#E54848',
      width: '400px',
    })
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-body);
  padding: 40px 20px;
  transition: background-color 0.3s ease;
}

.login-container-card {
  background: var(--bg-card);
  padding: 48px;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
  transition: background-color 0.3s, border-color 0.3s;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.img-lo-reg {
  height: 80px;
  margin-bottom: 16px;
  filter: brightness(0) saturate(100%) invert(18%) sepia(60%) saturate(2000%) hue-rotate(190deg) brightness(90%) contrast(90%);
  transition: filter 0.3s ease;
}

[data-theme="dark"] .img-lo-reg {
  filter: brightness(0) invert(1);
}

.welcome-text {
  color: var(--text-main);
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.subtitle-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
}

.form-lg {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 16px;
  color: var(--text-light);
  font-size: 0.95rem;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 0.95rem;
  background: var(--bg-input);
  color: var(--text-main);
  transition: all 0.2s ease;
  outline: none;
}

.input-wrapper input::placeholder {
  color: var(--text-light);
}

.input-wrapper input:focus {
  border-color: #3ABEF9;
  box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.12);
}

.btn-container {
  margin-top: 10px;
}

.btn-primary-login {
  width: 100%;
  background: #3ABEF9;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
}

.btn-primary-login:hover {
  background: #0284c7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(58, 190, 249, 0.3);
}

@media (max-width: 480px) {
  .login-container-card {
    padding: 32px 24px;
  }
  .welcome-text {
    font-size: 1.3rem;
  }
}
</style>