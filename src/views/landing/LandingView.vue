<template>
  <div v-if="showLanding" class="app-layout">
    <main class="profesores-main">
      
      <!-- HERO SECTION (Estilo Header limpio, sin logo gigante) -->
      <div class="hero-section">
        <div class="header-eyebrow">
          <span class="dot"></span> PLATAFORMA INSTITUCIONAL
        </div>
        <h1 class="hero-title">Domina tu tiempo académico.</h1>
        <p class="hero-description">
          Cronos es la plataforma inteligente diseñada para la UTEQ que organiza horarios, 
          aulas y asesorías en un solo lugar.
        </p>
        <div class="hero-buttons">
          <router-link to="/inicio-sesion" class="btn-primary">
            Iniciar Sesión <i class="fas fa-arrow-right"></i>
          </router-link>
          <a @click="scrollToFeatures" class="btn-secondary">
            Saber más <i class="fas fa-chevron-down"></i>
          </a>
        </div>
      </div>

      <!-- STATS SECTION -->
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-value">{{ stat.number }}</div>
          <div class="stat-desc">{{ stat.label }}</div>
        </div>
      </div>

      <!-- FEATURES SECTION -->
      <div class="section-header" id="features">
        <h2 class="section-title">Diseñado para la eficiencia</h2>
      </div>
      
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon"><i :class="['fas', feature.icon]"></i></div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>

      <!-- HOW IT WORKS -->
      <div class="section-header">
        <h2 class="section-title">¿Cómo funciona?</h2>
      </div>

      <div class="steps-container">
        <div v-for="(step, index) in steps" :key="index"
          :class="['step-card', { 'active': currentStep === index }]" @click="goToStep(index)">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <h4>{{ step.title }}</h4>
            <p v-if="currentStep === index">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <footer class="footer-landing">
        <div class="footer-content">
          <div class="footer-brand">
            <img src="../../imagenes/logo1.png" class="footer-logo" alt="Cronos" />
            <p>La revolución en gestión de horarios escolares.</p>
          </div>
          <div class="footer-contact">
            <h5>Contacto</h5>
            <a href="mailto:cronos.school2025@gmail.com">
              <i class="fas fa-envelope"></i> cronos.school2025@gmail.com
            </a>
            <span><i class="fas fa-map-marker-alt"></i> Querétaro, México</span>
          </div>
        </div>
        <div class="footer-copyright">
          &copy; 2026 CRONOS UTEQ. Todos los derechos reservados.
        </div>
      </footer>

    </main>
  </div>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showLanding = ref(true)
const currentStep = ref(0)
let intervalId = null

const stats = ref([
  { number: '+2k', label: 'Usuarios' },
  { number: '100%', label: 'Seguro' },
  { number: '24/7', label: 'Soporte' }
])

const features = ref([
  {
    icon: 'fa-magic',
    title: 'Auto-Generación',
    description: 'Algoritmos que crean horarios sin traslapes en segundos.'
  },
  {
    icon: 'fa-user-graduate',
    title: 'Vista Estudiante',
    description: 'Tu horario siempre a la mano, optimizado para móvil.'
  },
  {
    icon: 'fa-chalkboard-teacher',
    title: 'Gestión Docente',
    description: 'Control total sobre aulas y horas de asesoría.'
  },
  {
    icon: 'fa-file-export',
    title: 'Exportación Directa',
    description: 'Descarga reportes y horarios en PDF al instante.'
  }
])

const steps = ref([
  {
    title: 'Ingresa',
    description: 'Accede con tu cuenta institucional en segundos.'
  },
  {
    title: 'Personaliza',
    description: 'Agrega tus materias, grupos o consulta tu asignación.'
  },
  {
    title: 'Visualiza',
    description: 'Disfruta de tu horario organizado y limpio.'
  }
])

const goToStep = (i) => {
  currentStep.value = i
}

const nextStep = () => {
  currentStep.value = (currentStep.value + 1) % steps.value.length
}

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({
    behavior: 'smooth'
  })
}

onMounted(() => {
  intervalId = setInterval(nextStep, 5000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
/* ============ HERO SECTION ============ */
.hero-section {
  margin-top: -70px;
  padding: 60px 0 60px;
  margin-bottom: 40px;
  border-bottom: 1px solid var(--border-color);
  max-width: 800px;
}

.header-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.7rem; font-weight: 700;
  color: #3ABEF9;
  letter-spacing: 0.12em;
  margin-bottom: 16px;
}

.header-eyebrow .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #3ABEF9;
  box-shadow: 0 0 0 3px rgba(58, 190, 249, 0.2);
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-main);
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 32px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 24px; background: #3ABEF9; color: #ffffff;
  border: 1px solid #3ABEF9; border-radius: 8px;
  font-size: 0.95rem; font-weight: 600;
  text-decoration: none; cursor: pointer; transition: all 0.15s ease;
}

.btn-primary:hover {
  background: #0284c7; border-color: #0284c7;
}

.btn-secondary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 24px; background: var(--bg-card); color: var(--text-main);
  border: 1px solid var(--border-color); border-radius: 8px;
  font-size: 0.95rem; font-weight: 600;
  text-decoration: none; cursor: pointer; transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--bg-hover); border-color: #3ABEF9;
}

/* ============ STATS ============ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 60px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #3ABEF9;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* ============ SECCIONES ============ */
.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

/* ============ FEATURES ============ */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
}

.feature-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 32px;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border-color: #3ABEF9;
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  color: #0284c7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-bottom: 20px;
  transition: background 0.3s;
}

[data-theme="dark"] .feature-icon {
  background: rgba(2, 132, 199, 0.2);
  color: #38bdf8;
}

.feature-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

/* ============ STEPS ============ */
.steps-container {
  max-width: 700px;
  margin-bottom: 60px;
}

.step-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-card);
}

.step-card:hover {
  background: var(--bg-hover);
}

.step-card.active {
  border-left: 4px solid #3ABEF9;
  background: var(--bg-hover);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3ABEF9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.step-content p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 6px 0 0;
}

/* ============ FOOTER ============ */
.footer-landing {
  border-top: 1px solid var(--border-color);
  padding-top: 60px;
  margin-top: 40px;
  transition: border-color 0.3s;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 40px;
  padding-bottom: 40px;
}

.footer-brand { max-width: 300px; }

.footer-logo {
  height: 45px;
  margin-bottom: 16px;
  filter: brightness(0) saturate(100%) invert(18%) sepia(60%) saturate(2000%) hue-rotate(190deg) brightness(90%) contrast(90%);
  transition: filter 0.3s ease;
}

[data-theme="dark"] .footer-logo {
  filter: brightness(0) invert(1);
}

.footer-brand p { 
  color: var(--text-muted); 
  font-size: 0.9rem; 
  line-height: 1.6; 
}

.footer-contact h5 { 
  color: #3abef9; 
  font-size: 1rem; 
  margin: 0 0 20px; 
  text-transform: uppercase; 
  letter-spacing: 1px; 
}

.footer-contact a, .footer-contact span {
  display: flex; 
  align-items: center; 
  gap: 10px; 
  color: var(--text-muted);
  text-decoration: none; 
  font-size: 0.9rem; 
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.footer-contact a:hover { color: #3abef9; }
.footer-contact i { width: 20px; color: #3abef9; }

.footer-copyright { 
  text-align: center; 
  padding: 24px 0; 
  border-top: 1px solid var(--border-color);
  color: var(--text-light); 
  font-size: 0.8rem; 
}

/* ============ RESPONSIVE ============ */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }
}
</style>