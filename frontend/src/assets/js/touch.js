/**
 * Variables de entorno
 * Configuración MANUAL del entorno de la aplicación
 * 
 * INSTRUCCIONES:
 * 1. Cambia CURRENT_ENVIRONMENT a 'development' o 'production' según necesites
 * 2. Actualiza las URLs correspondientes en ENVIRONMENTS
 * 3. Guarda el archivo
 * 
 * IMPORTANTE: No commitear con credenciales de producción si es un repo público
 */
(function() {
  'use strict';

  // Evitar logs/inicialización múltiple si el script se ejecuta varias veces
  if (window.__ENV_INITIALIZED) {
    return;
  }
  window.__ENV_INITIALIZED = true;

  // ============================================
  // ⚙️ CONFIGURACIÓN MANUAL - CAMBIAR AQUÍ ⚙️
  // ============================================
  // 
  // 🔓 'development' = Sin autenticación, acceso libre a todas las páginas
  // 🔒 'staging'     = Con autenticación completa (igual que producción)
  // 🔒 'production'  = Con autenticación completa
  // 
  // ⚠️ IMPORTANTE: Cambia esta línea según el entorno que necesites:
  
  const CURRENT_ENVIRONMENT = 'production'; // 👈 CAMBIADO: Para producción sin mocks

  // Configuración de URLs por entorno
  // IMPORTANTE: En producción, estas URLs deben ser inyectadas por el servidor
  // NO hardcodear URLs de desarrollo en el código fuente
  const ENVIRONMENTS = {
    development: {
      API_BASE_URL: window.ENV_API_URL || getApiBaseUrl(),
      isDevelopment: true,
      isProduction: false,
      isStaging: false,
    },
    staging: {
      API_BASE_URL: window.ENV_API_URL || getApiBaseUrl(),
      isDevelopment: false,
      isProduction: false,
      isStaging: true,
    },
    production: {
      API_BASE_URL: window.ENV_API_URL || getApiBaseUrl(),
      isDevelopment: false,
      isProduction: true,
      isStaging: false,
    }
  };

  // Función para determinar la URL base correcta de la API
  function getApiBaseUrl() {
    // Siempre usar URL absoluta para el backend para evitar problemas de proxy
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}/backend/v1`;
  }

  // ============================================
  // NO MODIFICAR DEBAJO DE ESTA LÍNEA
  // ============================================

  // Validar que el entorno configurado existe
  if (!ENVIRONMENTS[CURRENT_ENVIRONMENT]) {
    console.error(`❌ Entorno "${CURRENT_ENVIRONMENT}" no válido. Usar: development, staging o production`);
    throw new Error(`Entorno no válido: ${CURRENT_ENVIRONMENT}`);
  }

  // Obtener configuración del entorno actual
  const currentConfig = ENVIRONMENTS[CURRENT_ENVIRONMENT];

  // Exportar globalmente
  window.ENV = {
    ...currentConfig,
    environment: CURRENT_ENVIRONMENT,
  };

  // Log informativo del entorno (solo en desarrollo)
  if (currentConfig.isDevelopment) {
    console.log('='.repeat(50));
    console.log(`ENTORNO: ${CURRENT_ENVIRONMENT.toUpperCase()}`);
    console.log(`API: ${currentConfig.API_BASE_URL}`);
    console.log('MODO: Sin autenticación (desarrollo)');
    console.log('='.repeat(50));
    
    // Cargar scripts de mock de forma segura
    const mockConfigScript = document.createElement('script');
    mockConfigScript.src = '/js/utils/mock-config.js';
    document.head.appendChild(mockConfigScript);
    
    const devMockScript = document.createElement('script');
    devMockScript.src = '/js/utils/development-mock.js';
    document.head.appendChild(devMockScript);
  }

})();
