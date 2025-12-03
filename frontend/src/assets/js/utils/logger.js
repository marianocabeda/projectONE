/**
 * Sistema de logging seguro
 * Deshabilita logs sensibles en producción automáticamente
 */
(function() {
  'use strict';

  // Detección dinámica del entorno: preferir `window.ENV` (establecido por `env.js`),
  // luego `process.env.NODE_ENV`, y finalmente inferir por hostname.
  function getDetectedEnvironment() {
    try {
      if (window && window.ENV && window.ENV.environment) {
        return window.ENV.environment;
      }
    } catch (e) {}

    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }

    try {
      const host = (location && location.hostname) || '';
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'development';
      }
    } catch (e) {}

    return 'production';
  }

  function isProduction() { return getDetectedEnvironment() === 'production'; }
  function isDevelopment() { return getDetectedEnvironment() === 'development'; }
  function isStaging() { try { return !!(window && window.ENV && window.ENV.isStaging); } catch (e) { return false; } }

  // Mensaje genérico profesional para entornos donde no se deben exponer datos
  const GENERIC_PROD_MESSAGE = 'Ha ocurrido un error. No comparta información técnica; contacte al soporte.';

  // Guardar referencia al `console` original INMEDIATAMENTE antes de cualquier modificación
  const _originalConsole = (typeof console !== 'undefined') ? {
    log: console.log.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    trace: console.trace ? console.trace.bind(console) : null,
    table: console.table ? console.table.bind(console) : null
  } : null;

  // Silenciar `console` en producción (solo si se detecta producción).
  // Preserva `console.error` pero muestra un mensaje genérico.
  let __consoleSilenced = false;
  function silenceConsoleForProduction() {
    if (__consoleSilenced) return;
    if (!_originalConsole) return;
    if (!isProduction()) return;

    const noop = function() {};
    const errorOverride = function() {
      _originalConsole.error(GENERIC_PROD_MESSAGE);
    };
    
    try {
      // Estrategia 1: Object.defineProperty (más segura pero puede fallar en algunos navegadores)
      const defineMethod = (method, fn) => {
        try {
          Object.defineProperty(console, method, {
            value: fn,
            writable: true,
            enumerable: true,
            configurable: true
          });
        } catch (e) {
          // Si falla, intentar asignación directa
          console[method] = fn;
        }
      };

      defineMethod('log', noop);
      defineMethod('debug', noop);
      defineMethod('info', noop);
      defineMethod('warn', noop);
      defineMethod('error', errorOverride);
      defineMethod('trace', noop);
      defineMethod('table', noop);
      defineMethod('dir', noop);
      defineMethod('dirxml', noop);
      defineMethod('group', noop);
      defineMethod('groupCollapsed', noop);
      defineMethod('groupEnd', noop);
      
      __consoleSilenced = true;
    } catch (e) {
      // Estrategia 2: Asignación directa masiva
      try {
        console.log = noop;
        console.debug = noop;
        console.info = noop;
        console.warn = noop;
        console.error = errorOverride;
        console.trace = noop;
        console.table = noop;
        console.dir = noop;
        console.dirxml = noop;
        console.group = noop;
        console.groupCollapsed = noop;
        console.groupEnd = noop;
        __consoleSilenced = true;
      } catch (e2) {
        // En caso de fallar ambas estrategias, no romper la app
      }
    }
  }

  // Si `env.js` se carga después de este fichero, hacemos un polling corto
  // para detectar `production` y silenciar el console si procede.
  function startConsoleGuardPolling(attempts = 10, interval = 100) {
    let tried = 0;
    const id = setInterval(function() {
      tried += 1;
      if (isProduction()) {
        silenceConsoleForProduction();
        clearInterval(id);
        return;
      }
      if (tried >= attempts) {
        clearInterval(id);
      }
    }, interval);
  }
  // Lanzar comprobación inmediata y polling
  try { silenceConsoleForProduction(); } catch (e) {}
  startConsoleGuardPolling();

  // Logger seguro que respeta el entorno
  const Logger = {
    /**
     * Log de información (solo en desarrollo)
     */
    info: function(...args) {
      if (isDevelopment() && console && console.info) {
        console.info(...args);
      }
    },

    /**
     * Log de debug (solo en desarrollo)
     */
    debug: function(...args) {
      if (isDevelopment() && console && console.debug) {
        console.debug(...args);
      }
    },

    /**
     * Warnings - mostrar en desarrollo y staging
     */
    warn: function(...args) {
      if ((!isProduction() || isStaging()) && console && console.warn) {
        console.warn(...args);
      }
    },

    /**
     * Errores críticos - en producción mostrar mensaje genérico profesional
     */
    error: function(...args) {
      if (!console || !console.error) return;
      if (isProduction()) {
        console.error(GENERIC_PROD_MESSAGE);
      } else {
        console.error(...args);
      }
    },

    /**
     * Log de seguridad - en producción NO exponer detalles, solo mensaje mínimo
     */
    security: function(message, data = {}) {
      if (!console || !console.error) return;
      if (isProduction()) {
        console.error('🔒 [SECURITY] Evento de seguridad registrado. No comparta información; contacte al equipo de seguridad.');
      } else {
        console.error(`🔒 [SECURITY] ${message}`, data);
      }
    },

    /**
     * Performance logging (solo en desarrollo)
     */
    performance: function(label, startTime) {
      if (isDevelopment() && console && console.log && typeof performance !== 'undefined') {
        const duration = performance.now() - startTime;
        console.log(`⏱️ [PERF] ${label}: ${duration.toFixed(2)}ms`);
      }
    },

    /**
     * Obtener el entorno detectado (útil para pruebas)
     */
    get _env() { return getDetectedEnvironment(); }
  };

  // Exportar globalmente
  window.Logger = Logger;

  // Mostrar advertencia de seguridad contra Self-XSS
  function showSecurityWarning() {
    // Usar el console original guardado al inicio del script
    if (!_originalConsole || !_originalConsole.log) return;
    
    // Detectar si el tema es oscuro para ajustar colores
    let isDarkTheme = false;
    try {
      isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {}
    
    // Función auxiliar para llamadas seguras
    const safelog = function() {
      try {
        _originalConsole.log.apply(console, arguments);
      } catch (e) {
        // Fallback silencioso
      }
    };
    
    try {
      // Título principal
      safelog(
        '%cAVISO DE SEGURIDAD',
        'color: #d32f2f; font-size: 24px; font-weight: bold; padding: 10px 0;'
      );
      
      // Mensaje informativo
      safelog(
        '%cEsta consola está diseñada exclusivamente para desarrolladores.',
        `font-size: 14px; color: ${isDarkTheme ? '#e0e0e0' : '#2c3e50'}; line-height: 1.6; margin: 8px 0;`
      );
      
      // Advertencia específica
      safelog(
        '%cSi alguien le ha solicitado copiar y pegar código aquí, no lo haga.\nEsto podría comprometer la seguridad de su cuenta.',
        `font-size: 13px; color: ${isDarkTheme ? '#ffd700' : '#856404'}; background: ${isDarkTheme ? 'rgba(255,215,0,0.1)' : '#fff3cd'}; padding: 8px; border-left: 3px solid ${isDarkTheme ? '#ffd700' : '#856404'}; line-height: 1.6;`
      );
      
      // Información de riesgos
      safelog(
        '%cEjecutar código no autorizado puede permitir a terceros:\n' +
        '  • Acceder a su cuenta\n' +
        '  • Obtener información personal\n' +
        '  • Realizar acciones en su nombre',
        `font-size: 12px; color: ${isDarkTheme ? '#b0b0b0' : '#495057'}; line-height: 1.8; margin: 8px 0;`
      );
      
      // Separador
      safelog(
        '%c' + '─'.repeat(60),
        `color: ${isDarkTheme ? '#4a4a4a' : '#dee2e6'};`
      );
      
      // Footer
      safelog(
        '%cOneInternet © ' + new Date().getFullYear(),
        `font-size: 10px; color: ${isDarkTheme ? '#7a7a7a' : '#868e96'}; font-style: italic;`
      );
      
    } catch (e) {
      // Fallback simple
      try {
        _originalConsole.log('AVISO: Esta consola es solo para desarrolladores. No ejecute código de terceros.');
      } catch (e2) {
        // Si todo falla, no romper
      }
    }
  }

  // Mostrar advertencia con múltiples estrategias de timing
  if (typeof window !== 'undefined') {
    // Estrategia 1: Inmediato (antes de DOMContentLoaded)
    try { showSecurityWarning(); } catch (e) {}
    
    // Estrategia 2: En el próximo tick del event loop
    setTimeout(showSecurityWarning, 0);
    
    // Estrategia 3: Después de 100ms (por si el console no está listo)
    setTimeout(showSecurityWarning, 100);
    
    // Estrategia 4: Cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showSecurityWarning);
    }
    
    // Estrategia 5: Cuando la ventana cargue completamente
    window.addEventListener('load', showSecurityWarning);
  }

})();
