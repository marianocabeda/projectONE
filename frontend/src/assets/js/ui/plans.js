/**
 * PlansRenderer - Renderizador configurable de tarjetas de planes
 * 
 * Uso:
 * 1. En HTML, crear un contenedor: <div id="plans-container"></div>
 * 2. Configurar antes de cargar: window.PLANS_CONFIG = { ... }
 * 3. El script cargará planes automáticamente desde la API
 * 
 * Configuración disponible (window.PLANS_CONFIG):
 * - containerId: ID del contenedor (default: "plans-container")
 * - useMockData: Si es true, usa datos mock en lugar de API (solo development)
 * - mockData: Array de planes mock (solo si useMockData = true en development)
 * - endpoint: Endpoint personalizado (default: usa config.js)
 * - idTipoPlan: Filtrar por tipo de plan específico
 * - styles: Objeto con clases CSS personalizadas
 * - mapPlanData: Función para mapear datos de la API a formato interno
 * - onPlanClick: Callback cuando se hace click en un plan
 * - showButton: Mostrar botón de acción (default: true)
 * - buttonText: Texto del botón (default: "Contratar")
 * - buttonLink: Función o string para generar link del botón
 */

// PlansRenderer (módulo ES)
// Sigue el patrón de los módulos en `forms/contract/*`: exportar una función `init(container, options)`
// y exponer utilidades para re-renderizar. No incluye soporte a mocks; siempre usa el backend
// definido en `AppConfig` o en `options.endpoint`.

// Configuración por defecto
const DEFAULT_CONFIG = {
  containerId: 'plans-container',
  endpoint: null, // Si es null, usa AppConfig.getUrl('planes')
  idTipoPlan: null, // Filtrar por tipo de plan
  showButton: true,
  buttonText: 'Contratar',
  buttonLink: (plan) => `/contrato?plan=${plan.id}`,
  styles: {
    card: 'plan-card flex flex-col bg-white dark:bg-dark-bg-secondary text-center overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-border-primary transition-colors duration-200',
    cardInner: 'p-6 lg:p-8 flex flex-col h-full bg-white dark:bg-dark-bg-secondary shadow-md dark:shadow-black/50 hover:shadow-xl dark:hover:shadow-black/60 transition-shadow duration-300',
    title: 'font-black text-3xl lg:text-4xl uppercase tracking-widest text-gray-900 dark:text-dark-text-primary mb-2 text-center leading-none [text-shadow:_0_2px_6px_rgba(0,0,0,0.15)] dark:[text-shadow:_0_2px_6px_rgba(0,0,0,0.5)] drop-shadow-md w-full max-w-xs mx-auto',
    line: 'h-1 w-full max-w-xs mx-auto mb-5 rounded-full',
    speed: 'text-5xl lg:text-6xl font-black text-gray-900 dark:text-dark-text-primary mb-2 text-center tracking-tight w-full max-w-xs mx-auto',
    speedSpacer: 'h-4',
    precio_ar: 'w-full max-w-xs mx-auto text-white text-2xl font-black py-3 px-6 rounded-xl mb-4 text-center shadow-sm dark:shadow-black/50',
    precio_arLabel: 'text-gray-500 dark:text-dark-text-secondary text-base font-bold uppercase tracking-widest text-center mb-1 w-full max-w-xs mx-auto',
    description: 'text-gray-500 dark:text-dark-text-secondary text-base font-medium text-center mb-6 w-full max-w-xs mx-auto',
    button: 'block w-full max-w-xs mx-auto p-4 mt-auto text-white font-bold text-lg text-center rounded-xl transition-all duration-300 ease-out hover:shadow-lg dark:hover:shadow-black/60 transform hover:scale-105 hover:bg-opacity-90'
  },
  colorMap: {
    'hogar': 'azul',
    'pyme': 'verde',
    'empresarial': 'amarillo',
    'default': 'azul'
  },
  planColors: null,
  // función para mapear datos del backend al formato usado por la UI
  mapPlanData: (plan, tipoPlan, config) => {
    return {
      id: plan.id_plan || plan.id,
      title: plan.nombre || plan.title || 'Sin título',
      speed: plan.velocidad_mbps ? `${plan.velocidad_mbps} Mbps` : (plan.velocidad || plan.speed || ''),
      precio_ar: plan.precio_ar ? `$${plan.precio_ar}` : (plan.precio ? String(plan.precio) : ''),
      installation: plan.descripcion || plan.instalacion || 'Instalación gratuita',
      color: plan.color || determineColor(tipoPlan, plan, config),
      buttonLink: plan.buttonLink || null,
      buttonText: plan.buttonText || null,
      rawData: plan
    };
  },
  onPlanClick: null
};

function determineColor(tipoPlan, plan, config) {
  const userConfig = window.PLANS_CONFIG || {};
  const colorMap = userConfig.colorMap || config?.colorMap || DEFAULT_CONFIG.colorMap;
  const planColors = userConfig.planColors || config?.planColors;

  if (planColors && plan && (plan.id_plan || plan.id)) {
    const planId = plan.id_plan || plan.id;
    if (planColors[planId]) return planColors[planId];
  }

  if (!tipoPlan || !tipoPlan.nombre) return colorMap.default;
  const nombreLower = tipoPlan.nombre.toLowerCase();
  for (const [key, color] of Object.entries(colorMap)) {
    if (nombreLower.includes(key)) return color;
  }
  return colorMap.default;
}

async function renderPlanCard(plan, config) {
  const styles = config.styles;
  const card = document.createElement('div');
  card.className = styles.card;
  card.setAttribute('data-color', plan.color);
  card.setAttribute('data-plan-id', plan.id);

  let buttonLink = '';
  if (config.showButton) {
    let isAuthenticated = false;
    
    // 🔓 En páginas públicas, asumir no autenticado sin hacer peticiones
    const currentPath = window.location.pathname;
    const publicPages = ['/', '/index.html', '/contacto', '/acercade', '/contrato', '/login', '/registro', '/forgot-password', '/cambiar-password', '/verificar-email'];
    const isPublicPage = publicPages.some(page => currentPath === page || currentPath.endsWith(page));
    
    if (isPublicPage) {
      // En páginas públicas, no verificar autenticación - asumir false
      isAuthenticated = false;
    } else {
      // En páginas protegidas, verificar autenticación
      try {
        if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
          isAuthenticated = await window.AuthToken.isAuthenticated();
        } else {
          // Fallback: verificar con endpoint básico
          try {
            const response = await fetch('/api/user/profile', { credentials: 'include' });
            isAuthenticated = response.ok;
          } catch (e) {
            isAuthenticated = false;
          }
        }
      } catch (e) {
        isAuthenticated = false;
      }
    }

    buttonLink = isAuthenticated ? '/conexiones' : '/login';
  }

  const buttonHtml = config.showButton ? `
    <a href="${buttonLink}" class="${styles.button}" data-bg-color>
      ${plan.buttonText || config.buttonText}
    </a>
  ` : '';

  card.innerHTML = `
    <div class="${styles.cardInner}">
      <h3 class="${styles.title}">${plan.title}</h3>
      <div data-line-color class="${styles.line}"></div>
      <p class="${styles.speed}" data-speed>${plan.speed}</p>
      <div class="${styles.speedSpacer}"></div>
      <div data-precio_ar data-bg-color class="${styles.precio_ar}">${plan.precio_ar}</div>
      <p class="${styles.precio_arLabel}">Precio final / mes</p>
      <p class="${styles.description}">Instalación $7.000 o </br>3 cuotas de $3.500</p>
      ${buttonHtml}
    </div>
  `;

  if (config.onPlanClick) {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('a')) config.onPlanClick(plan, card, e);
    });
  }

  return card;
}

async function loadPlansFromAPI(config) {
  try {
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
      const API_BASE_URL = window.AppConfig?.API_BASE_URL || window.ENV?.API_BASE_URL || '';
      if (endpoint && endpoint.startsWith('http')) return endpoint;
      if (endpoint && endpoint.startsWith('/')) return API_BASE_URL + endpoint;
      return endpoint;
    });

    let url = null;
    if (config.endpoint) {
      url = config.endpoint;
    } else if (window.AppConfig && typeof window.AppConfig.getUrl === 'function') {
      url = window.AppConfig.getUrl('planes');
    } else if (window.AppConfig && window.AppConfig.endpoints && window.AppConfig.endpoints.planes) {
      url = window.AppConfig.endpoints.planes;
    } else {
      console.error('No se encontró un endpoint para planes. Configura `AppConfig.getUrl("planes")` o `AppConfig.endpoints.planes` o pasa `endpoint` en PLANS_CONFIG.');
      return [];
    }

    if (config.idTipoPlan) {
      url += (url.includes('?') ? '&' : '?') + `id_tipo_plan=${config.idTipoPlan}`;
    }

    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    const planesData = result.data?.planes || result.planes || result.data || result || [];
    const tipoPlan = result.data?.tipo_plan || result.tipo_plan || null;
    return planesData.map(plan => config.mapPlanData(plan, tipoPlan, config));
  } catch (error) {
    console.error('Error al cargar planes:', error);
    if (window.ErrorModal) window.ErrorModal.show('No se pudieron cargar los planes', 'Error');
    return [];
  }
}

// Renderizar planes en el contenedor
export async function render(containerIdOrElement, options = {}) {
  const userConfig = window.PLANS_CONFIG || {};
  const config = { ...DEFAULT_CONFIG, ...userConfig, ...options };
  if (userConfig.styles) config.styles = { ...DEFAULT_CONFIG.styles, ...userConfig.styles };

  const container = typeof containerIdOrElement === 'string' ? document.getElementById(containerIdOrElement) : containerIdOrElement;
  if (!container) {
    console.error('Contenedor de planes no encontrado');
    return;
  }

  const plansData = await loadPlansFromAPI(config);
  container.innerHTML = '';
  for (const plan of plansData) {
    const card = await renderPlanCard(plan, config);
    container.appendChild(card);
  }
  console.log(`✅ ${plansData.length} planes renderizados`);
}

// Función init (patrón similar a contract/*)
export async function init(container) {
  const containerId = (typeof container === 'string') ? container : (container?.id || DEFAULT_CONFIG.containerId);
  await render(containerId);
  // Return a cleanup function if needed in the future
  return () => { /* placeholder cleanup */ };
}

// Auto-inicializar si hay configuración global y el DOM ya está listo
if (window.PLANS_CONFIG) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { render(window.PLANS_CONFIG.containerId || DEFAULT_CONFIG.containerId); });
  } else {
    render(window.PLANS_CONFIG.containerId || DEFAULT_CONFIG.containerId);
  }
}

// Export helper for backward compatibility
window.PlansRenderer = window.PlansRenderer || {
  render: (c, o) => render(c, o),
  renderCard: async (p, c) => await renderPlanCard(p, c)
};

