<template>
  <div class="app-container">
    <!-- NAVBAR GLOBAL -->
    <nav class="navbar">
      <div class="nav-content">
        
        <!-- BOTÓN HAMBURGUESA -->
        <button 
          v-if="isLoggedIn && !esVistaLanding" 
          class="mobile-menu-btn" 
          @click="toggleMobileMenu"
        >
          <i class="fas fa-bars"></i>
        </button>

        <!-- Logo -->
        <router-link to="/" class="nav-brand" @click="closeMobileMenu">
          <img src="./imagenes/logo.png" alt="Cronos" class="nav-logo" />
        </router-link>

        <!-- MENÚ ESCRITORIO DINÁMICO POR ROL -->
        <div class="nav-desktop-menu" v-if="isLoggedIn">
          <router-link to="/dashboard" class="nav-item" v-if="esAdminOCoordinador">Inicio</router-link>
          <router-link to="/profesor" class="nav-item" v-if="userRol === 'profesor'">Inicio</router-link>
          <router-link to="/alumno" class="nav-item" v-if="userRol === 'estudiante'">Inicio</router-link>
          
          <!-- MENÚS DE ADMIN / COORDINADOR -->
          <template v-if="esAdminOCoordinador">
            <div class="nav-dropdown-wrapper">
              <span class="nav-item">Personas <i class="fas fa-chevron-down"></i></span>
              <div class="dropdown-panel">
                <router-link to="/alumnos" class="dropdown-link">Alumnos</router-link>
                <router-link to="/profesores" class="dropdown-link">Profesores</router-link>
              </div>
            </div>

            <div class="nav-dropdown-wrapper">
              <span class="nav-item">Académico <i class="fas fa-chevron-down"></i></span>
              <div class="dropdown-panel">
                <router-link to="/materias" class="dropdown-link">Materias</router-link>
                <router-link to="/divisiones" class="dropdown-link">Divisiones</router-link>
                <router-link to="/grupos" class="dropdown-link">Grupos</router-link>
                <router-link to="/periodo" class="dropdown-link">Periodo</router-link>
                <router-link to="/turno" class="dropdown-link">Turnos</router-link>
              </div>
            </div>

            <div class="nav-dropdown-wrapper">
              <span class="nav-item">Infraestructura <i class="fas fa-chevron-down"></i></span>
              <div class="dropdown-panel">
                <router-link to="/edificios" class="dropdown-link">Edificios</router-link>
                <router-link to="/aulas" class="dropdown-link">Aulas</router-link>
              </div>
            </div>
          </template>
        </div>

        <!-- CONTROLES DE USUARIO Y TEMA -->
        <div class="nav-user">
          <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Modo Claro' : 'Modo Oscuro'">
            <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
          </button>

          <!-- Avatar del usuario -->
          <div v-if="isLoggedIn" class="user-profile" @click="toggleUserMenu">
            <div class="avatar-circle" :style="userAvatar > 0 ? { backgroundImage: `url(/avatares/${userAvatar}.jpg)` } : {}">
              <span v-if="!userAvatar || userAvatar === 0">{{ userName.charAt(0).toUpperCase() }}</span>
            </div>
          </div>
        </div>

      </div>
    </nav>

    <!-- OVERLAY -->
    <div v-if="mobileMenuOpen" class="menu-overlay" @click="closeMobileMenu"></div>

    <!-- MENÚ DRAWER MÓVIL -->
    <div :class="['mobile-drawer', { 'is-open': mobileMenuOpen }]">
      <div class="drawer-header">
        <img src="./imagenes/logo.png" alt="Cronos" class="drawer-logo" />
        <button class="close-drawer-btn" @click="closeMobileMenu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="drawer-links">
        <!-- Inicio (Depende del rol) -->
        <router-link to="/dashboard" class="drawer-item" @click="closeMobileMenu" v-if="esAdminOCoordinador">
          <div class="item-content">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
          </div>
        </router-link>
        <router-link to="/profesor" class="drawer-item" @click="closeMobileMenu" v-if="userRol === 'profesor'">
          <div class="item-content">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
          </div>
        </router-link>
        <router-link to="/alumno" class="drawer-item" @click="closeMobileMenu" v-if="userRol === 'estudiante'">
          <div class="item-content">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
          </div>
        </router-link>
        
        <!-- Acordeones para Admin/Coordinador -->
        <template v-if="esAdminOCoordinador">
          <div class="drawer-accordion">
            <div class="drawer-item" @click="toggleAccordion('personas')">
              <div class="item-content">
                <i class="fas fa-users"></i>
                <span>Personas</span>
              </div>
              <i :class="['fas fa-chevron-down', { 'rotate': openAccordion === 'personas' }]"></i>
            </div>
            <div v-show="openAccordion === 'personas'" class="drawer-sub-menu">
              <router-link to="/alumnos" class="drawer-sub-link" @click="closeMobileMenu">Alumnos</router-link>
              <router-link to="/profesores" class="drawer-sub-link" @click="closeMobileMenu">Profesores</router-link>
            </div>
          </div>

          <div class="drawer-accordion">
            <div class="drawer-item" @click="toggleAccordion('academico')">
              <div class="item-content">
                <i class="fas fa-graduation-cap"></i>
                <span>Académico</span>
              </div>
              <i :class="['fas fa-chevron-down', { 'rotate': openAccordion === 'academico' }]"></i>
            </div>
            <div v-show="openAccordion === 'academico'" class="drawer-sub-menu">
              <router-link to="/materias" class="drawer-sub-link" @click="closeMobileMenu">Materias</router-link>
              <router-link to="/divisiones" class="drawer-sub-link" @click="closeMobileMenu">Divisiones</router-link>
              <router-link to="/grupos" class="drawer-sub-link" @click="closeMobileMenu">Grupos</router-link>
              <router-link to="/periodo" class="drawer-sub-link" @click="closeMobileMenu">Periodos</router-link>
              <router-link to="/turno" class="drawer-sub-link" @click="closeMobileMenu">Turnos</router-link>
            </div>
          </div>

          <div class="drawer-accordion">
            <div class="drawer-item" @click="toggleAccordion('infra')">
              <div class="item-content">
                <i class="fas fa-building"></i>
                <span>Infraestructura</span>
              </div>
              <i :class="['fas fa-chevron-down', { 'rotate': openAccordion === 'infra' }]"></i>
            </div>
            <div v-show="openAccordion === 'infra'" class="drawer-sub-menu">
              <router-link to="/edificios" class="drawer-sub-link" @click="closeMobileMenu">Edificios</router-link>
              <router-link to="/aulas" class="drawer-sub-link" @click="closeMobileMenu">Aulas</router-link>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- MENÚ DE USUARIO -->
    <transition name="fade">
      <div v-if="userMenuOpen && isLoggedIn" class="user-dropdown" v-click-outside="closeUserMenu">
        <div class="user-info">
          <strong>{{ userName }}</strong>
          <span>{{ textoRol }}</span>
        </div>
        <hr class="dropdown-divider" />
        <router-link :to="rutaPerfil" class="user-option">
          <i class="fas fa-user"></i> Mi Perfil
        </router-link>
        <button @click="cerrarSesion" class="user-option logout">
          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </div>
    </transition>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const userMenuOpen = ref(false)
const isDark = ref(false)
const isLoggedIn = ref(false)
const userName = ref('Usuario')
const userRol = ref('')
const userAvatar = ref('')

const mobileMenuOpen = ref(false)
const openAccordion = ref(null)

// Computados
const esVistaLanding = computed(() => {
  return route.path === '/' || route.path === '/inicio' || route.path === '/landing' || route.path === '/inicio-sesion'
})

const esAdminOCoordinador = computed(() => {
  return userRol.value === 'admin' || userRol.value === 'coordinador'
})

const rutaPerfil = computed(() => {
  if (userRol.value === 'profesor') return '/profesor/perfil'
  if (userRol.value === 'estudiante') return '/alumno/perfil'
  return '/perfil'
})

const textoRol = computed(() => {
  switch (userRol.value) {
    case 'admin': return 'Administrador'
    case 'coordinador': return 'Coordinador'
    case 'profesor': return 'Profesor'
    case 'estudiante': return 'Estudiante'
    default: return 'Usuario'
  }
})

const checkSession = () => {
  const token = localStorage.getItem('access_token')
  const nombre = localStorage.getItem('nombre')
  const rol = localStorage.getItem('rol')
  const avatar = localStorage.getItem('id_avatar')
  
  if (token) {
    isLoggedIn.value = true
    if (nombre) userName.value = nombre
    if (rol) userRol.value = rol
    if (avatar) userAvatar.value = parseInt(avatar)
  } else {
    isLoggedIn.value = false
    userRol.value = ''
    userAvatar.value = ''
  }
}

const applyTheme = (dark) => {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme', 'light')
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
}

const toggleUserMenu = () => { userMenuOpen.value = !userMenuOpen.value }
const closeUserMenu = () => { userMenuOpen.value = false }
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (!mobileMenuOpen.value) openAccordion.value = null
}
const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  openAccordion.value = null
}

const toggleAccordion = (menu) => {
  openAccordion.value = openAccordion.value === menu ? null : menu
}

const cerrarSesion = () => {
  localStorage.clear() 
  isLoggedIn.value = false
  userRol.value = ''
  userAvatar.value = ''
  userMenuOpen.value = false
  closeMobileMenu()
  router.push('/inicio-sesion')
}

// Escuchar cambios de ruta
watch(() => route.path, () => {
  checkSession()
  closeMobileMenu()
  closeUserMenu()
})

// Lógica para escuchar el evento de cambio de avatar en tiempo real
const actualizarAvatarGlobal = () => {
  const avatar = localStorage.getItem('id_avatar')
  if (avatar) {
    userAvatar.value = parseInt(avatar)
  }
}

onMounted(() => {
  checkSession()
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    applyTheme(true)
  }
  
  // 👇 Escuchamos el evento personalizado que se disparará desde PerfilView
  window.addEventListener('avatar-actualizado', actualizarAvatarGlobal)

  // Escuchar cambios en el localStorage para otras pestañas
  window.addEventListener('storage', (event) => {
    if (event.key === 'id_avatar' || event.key === 'access_token') {
      checkSession()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('avatar-actualizado', actualizarAvatarGlobal)
})
</script>

<style scoped>
/* Tus estilos se mantienen exactamente iguales */
.app-container {
  min-height: 100vh;
  background-color: var(--bg-body);
  transition: background-color 0.3s ease;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.navbar {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.nav-content {
  max-width: 1300px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between; 
  padding: 0 24px;
  position: relative;
}

.mobile-menu-btn {
  display: none;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-main);
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
}

.nav-brand {
  display: flex;
  align-items: center;
  margin-left: 16px; 
}  

.nav-logo {
  height: 40px;
  filter: brightness(0) saturate(100%) invert(18%) sepia(60%) saturate(2000%) hue-rotate(190deg) brightness(90%) contrast(90%);
  transition: filter 0.3s ease;
}
[data-theme="dark"] .nav-logo { filter: brightness(0) invert(1); }

.nav-desktop-menu {
  display: flex;
  gap: 8px;
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nav-item {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item:hover, .nav-item.router-link-active {
  color: #3ABEF9;
  background: var(--bg-hover);
}

.nav-dropdown-wrapper { position: relative; }

.dropdown-panel {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-modal);
  min-width: 200px;
  display: none;
  flex-direction: column;
  padding: 8px;
  z-index: 1002;
}

.nav-dropdown-wrapper:hover .dropdown-panel { display: flex; }

.dropdown-link {
  padding: 10px 16px;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
}
.dropdown-link:hover { background: var(--bg-hover); color: var(--text-main); }

.nav-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.theme-toggle:hover { background: var(--bg-hover); color: var(--text-main); }

.user-profile { cursor: pointer; }
.avatar-circle {
  width: 38px;
  height: 38px;
  background: #1e293b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  transition: background 0.2s;
  background-size: cover;
  background-position: center;
  border: 2px solid transparent; 
}
[data-theme="dark"] .avatar-circle { background: #3ABEF9; }

.user-dropdown {
  position: absolute;
  top: 70px;
  right: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-modal);
  width: 220px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  z-index: 1005;
}

.user-info { padding: 12px; display: flex; flex-direction: column; }
.user-info strong { font-size: 0.95rem; color: var(--text-main); }
.user-info span { font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize; }
.dropdown-divider { margin: 4px 0; border: none; border-top: 1px solid var(--border-color); }
.user-option { display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-decoration: none; color: var(--text-muted); font-size: 14px; font-weight: 500; border-radius: 6px; border: none; background: transparent; cursor: pointer; text-align: left; width: 100%; }
.user-option:hover { background: var(--bg-hover); color: var(--text-main); }
.user-option.logout { color: #ef4444; }
.user-option.logout:hover { background: rgba(239, 68, 68, 0.1); }

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.mobile-drawer {
  position: fixed;
  top: 0;
  left: -100%;
  width: 290px;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-card);
  z-index: 10000;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  display: flex;
  flex-direction: column;
}
.mobile-drawer.is-open { left: 0; }

.drawer-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.drawer-logo {
  height: 32px;
  filter: brightness(0) saturate(100%) invert(18%) sepia(60%) saturate(2000%) hue-rotate(190deg) brightness(90%) contrast(90%);
}
[data-theme="dark"] .drawer-logo { filter: brightness(0) invert(1); }

.close-drawer-btn {
  background: var(--bg-hover);
  border: none;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.close-drawer-btn:hover { background: var(--border-color); color: var(--text-main); }

.drawer-links {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
}

.drawer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-content i {
  color: var(--text-muted);
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.drawer-item:hover, .drawer-item.router-link-active {
  background: var(--bg-hover);
  color: #3ABEF9;
}
.drawer-item:hover .item-content i, .drawer-item.router-link-active .item-content i {
  color: #3ABEF9;
}

.drawer-accordion { display: flex; flex-direction: column; }
.drawer-accordion .drawer-item i.fa-chevron-down { 
  font-size: 0.8rem; 
  transition: transform 0.3s ease; 
  color: var(--text-muted);
}
.drawer-accordion .drawer-item i.rotate { transform: rotate(180deg); }

.drawer-sub-menu { 
  display: flex; 
  flex-direction: column; 
  padding-left: 48px;
  margin-top: 2px;
  margin-bottom: 8px;
}
.drawer-sub-link { 
  padding: 10px 16px; 
  text-decoration: none; 
  color: var(--text-muted); 
  font-size: 0.9rem; 
  font-weight: 500; 
  border-radius: 6px; 
  transition: all 0.2s;
}
.drawer-sub-link:hover { 
  background: var(--bg-hover); 
  color: var(--text-main); 
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .mobile-menu-btn { display: block; }
  .nav-desktop-menu { display: none; }
  .nav-content { padding: 0 16px; }
  
  .nav-brand { margin-right: auto; }
  .main-content { padding: 20px 16px; }
}
</style>