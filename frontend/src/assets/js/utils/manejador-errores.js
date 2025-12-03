/**
 * Sistema de Manejo de Errores HTTP
 * Proporciona manejo centralizado y consistente de errores HTTP
 * 
 * IMPORTANTE: Los mensajes de error NO deben exponer:
 * - Detalles técnicos del backend
 * - Stack traces
 * - Información de configuración
 * - Nombres de archivos o rutas del servidor
 * 
 * @module errorHandler
 */

(function() {
  'use strict';

  // ==================== CONFIGURACIÓN ====================
  
  const ERROR_CONFIG = {
    showNotifications: true,
    logErrors: true,
    defaultTimeout: 5000,
  };

  // ==================== MENSAJES DE ERROR ====================
  
  const HTTP_MESSAGES = {
    // 4xx - Errores del cliente
    400: 'Solicitud inválida. Por favor, revise los datos ingresados.',
    401: 'No autorizado. Por favor, inicie sesión nuevamente.',
    403: 'Acceso prohibido. No tiene permisos para realizar esta acción.',
    404: 'Recurso no encontrado. La página o dato solicitado no existe.',
    405: 'Método no permitido.',
    408: 'Tiempo de espera agotado. Por favor, intente nuevamente.',
    409: 'Conflicto. El recurso ya existe o hay un conflicto con el estado actual.',
    410: 'El recurso ya no está disponible.',
    413: 'Archivo demasiado grande.',
    415: 'Tipo de archivo no soportado.',
    422: 'Los datos enviados no pudieron ser procesados.',
    429: 'Demasiadas solicitudes. Por favor, espere un momento e intente nuevamente.',
    
    // 5xx - Errores del servidor
    500: 'Error interno del servidor. Por favor, intente más tarde.',
    501: 'Funcionalidad no implementada.',
    502: 'Puerta de enlace incorrecta. El servidor está experimentando problemas.',
    503: 'Servicio no disponible temporalmente. Por favor, intente más tarde.',
    504: 'Tiempo de espera del servidor agotado.',
    
    // Errores de red
    networkError: 'Error de conexión. Verifique su conexión a Internet.',
    timeout: 'La solicitud tardó demasiado tiempo. Por favor, intente nuevamente.',
    aborted: 'La solicitud fue cancelada.',
    unknown: 'Ocurrió un error inesperado. Por favor, intente nuevamente.',
  };

  const FRIENDLY_MESSAGES = {
    login: {
      401: 'Correo o contraseña incorrectos.',
      403: 'Tu cuenta está pendiente de verificación. Revisa tu correo electrónico.',
      429: 'Demasiados intentos de inicio de sesión. Espera unos minutos.',
    },
    register: {
      409: 'Este correo electrónico ya está registrado.',
      422: 'Los datos ingresados no son válidos. Revisa el formulario.',
    },
    solicitud: {
      400: 'Los datos de la solicitud no son válidos. Por favor, revisa la información.',
      401: 'Debes iniciar sesión para enviar una solicitud.',
      403: 'No tienes permisos para crear solicitudes de contrato.',
      409: 'Ya existe una solicitud pendiente para esta dirección. Por favor, espera a que sea procesada o contacta con soporte.',
      422: 'Los datos de la solicitud contienen errores. Verifica todos los campos.',
      429: 'Has enviado demasiadas solicitudes. Por favor, espera un momento.',
    },
    password: {
      400: 'La contraseña no cumple con los requisitos mínimos.',
      401: 'La contraseña actual es incorrecta.',
    },
    upload: {
      413: 'El archivo es demasiado grande. El tamaño máximo es 5MB.',
      415: 'Tipo de archivo no permitido. Solo se aceptan imágenes.',
    },
  };

  // ==================== CLASES DE ERROR ====================

  class HTTPError extends Error {
    constructor(status, message, details = null) {
      super(message);
      this.name = 'HTTPError';
      this.status = status;
      this.details = details;
      this.timestamp = new Date().toISOString();
    }
  }

  class NetworkError extends Error {
    constructor(message, originalError = null) {
      super(message);
      this.name = 'NetworkError';
      this.originalError = originalError;
      this.timestamp = new Date().toISOString();
    }
  }

  // ==================== FUNCIONES DE MANEJO DE ERRORES ====================

  /**
   * Parsea la respuesta del backend y extrae errores
   * @param {Object} data - Datos JSON del backend
   * @returns {Object} { message: string, errors: Object|null, isValidation: boolean }
   */
  function parseBackendResponse(data) {
    const result = {
      message: null,
      errors: null,
      isValidation: false
    };

    // Caso 1: { error: "mensaje" } - Error general del backend
    if (data.error && typeof data.error === 'string') {
      result.message = data.error;
      return result;
    }

    // Caso 2: { message: "mensaje" } - Mensaje general
    if (data.message && typeof data.message === 'string') {
      result.message = data.message;
      // Si menciona "validación", parsear como errores de campos
      if (/errores de validaci/i.test(data.message)) {
        result.isValidation = true;
        result.errors = parseValidationString(data.message);
      }
      return result;
    }

    // Caso 3: { msg: "mensaje" } - Alternativa común
    if (data.msg && typeof data.msg === 'string') {
      result.message = data.msg;
      return result;
    }

    // Caso 4: { errors: { campo: "mensaje", ... } } - Errores de validación estructurados
    if (data.errors && typeof data.errors === 'object') {
      result.isValidation = true;
      result.errors = data.errors;
      result.message = 'Hay errores en los datos ingresados';
      return result;
    }

    // Caso 5: { success: false } sin mensaje explícito
    if (data.success === false && !result.message) {
      result.message = 'La operación no pudo completarse';
      return result;
    }

    return result;
  }

  /**
   * Parsea strings de error de validación del formato del backend
   * @param {string} str - String con mensajes de error
   * @returns {Object} Objeto con campos y mensajes de error
   */
  function parseValidationString(str) {
    const errors = {};
    if (!str || typeof str !== 'string') return errors;

    // Normalizar separadores
    const parts = str.split(/;|\n/).map(p => p.trim()).filter(Boolean);
    const fieldRegex = /el campo\s+'?([a-zA-Z0-9_]+)'?\s*(.*)/i;

    parts.forEach(p => {
      const m = fieldRegex.exec(p);
      if (m) {
        const field = m[1];
        let message = m[2] || p;
        message = message.replace(/^(:|,)?\s*/, '').replace(/^es\s*/i, '');
        errors[field] = message.trim();
      }
    });

    // Si no se pudo parsear ningún campo específico, error general
    if (Object.keys(errors).length === 0) {
      errors._general = str;
    }

    return errors;
  }

  /**
   * Obtiene mensaje de error apropiado para un código HTTP
   * @param {number} status - Código de estado HTTP
   * @param {string} context - Contexto de la operación (login, register, etc)
   * @param {string} serverMessage - Mensaje del servidor (IGNORADO por seguridad)
   * 
   * NOTA DE SEGURIDAD: serverMessage NO se usa para evitar exponer información
   * sensible del backend. Solo se usan mensajes predefinidos del frontend.
   * Esto previene que errores del servidor expongan:
   * - Rutas de archivos
   * - Stack traces
   * - Detalles de configuración
   * - Información de la base de datos
   * 
   * @returns {string} Mensaje de error amigable
   */
  function getErrorMessage(status, context = null, serverMessage = null) {
    // Prioridad 1: Buscar mensaje específico del contexto
    if (context && FRIENDLY_MESSAGES[context] && FRIENDLY_MESSAGES[context][status]) {
      return FRIENDLY_MESSAGES[context][status];
    }

    // Prioridad 2: Usar mensaje genérico del código HTTP
    if (status && HTTP_MESSAGES[status]) {
      return HTTP_MESSAGES[status];
    }

    // Prioridad 3: Mensaje desconocido
    return HTTP_MESSAGES.unknown;
  }

  /**
   * Maneja errores de fetch/HTTP
   * @param {Response|Error} error - Error o respuesta HTTP
   * @param {string} context - Contexto de la operación
   * @param {boolean} showModal - Si debe mostrar el modal automáticamente (default: true)
   * @returns {Promise<Object>} Objeto con información del error estructurada
   */
  async function handleHTTPError(error, context = null, showModal = true) {
    const errorInfo = {
      type: 'http',
      status: null,
      message: '',
      errors: null,
      isValidation: false,
      context,
      timestamp: new Date().toISOString(),
    };

    try {
      // Si es una Response de fetch directa
      if (error instanceof Response) {
        errorInfo.status = error.status;
        
        // Intentar parsear el body como JSON
        try {
          const data = await error.json();
          
          // Parsear respuesta del backend usando función centralizada
          const parsed = parseBackendResponse(data);
          
          // Si hay errores de validación estructurados
          if (parsed.isValidation && parsed.errors) {
            errorInfo.isValidation = true;
            errorInfo.errors = parsed.errors;
            errorInfo.message = parsed.message || 'Hay errores en los datos ingresados';
          } else {
            // Error general del servidor
            errorInfo.message = getErrorMessage(error.status, context, parsed.message);
          }
        } catch (e) {
          // Si no es JSON, usar mensaje genérico basado en status
          errorInfo.message = getErrorMessage(error.status, context);
        }
      }
      // Si es un Error lanzado por http.js con data adjunta
      else if (error instanceof Error && error.status && error.data) {
        errorInfo.status = error.status;
        
        // Parsear la data que ya viene del backend
        const parsed = parseBackendResponse(error.data);
        
        if (parsed.isValidation && parsed.errors) {
          errorInfo.isValidation = true;
          errorInfo.errors = parsed.errors;
          errorInfo.message = parsed.message || 'Hay errores en los datos ingresados';
        } else {
          errorInfo.message = getErrorMessage(error.status, context, parsed.message);
        }
      }
      // Si es un Error nativo de JavaScript (red, timeout, etc)
      else if (error instanceof Error) {
        if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
          errorInfo.type = 'network';
          errorInfo.message = HTTP_MESSAGES.networkError;
        } else if (error.name === 'AbortError') {
          errorInfo.type = 'aborted';
          errorInfo.message = HTTP_MESSAGES.aborted;
        } else {
          errorInfo.type = 'unknown';
          errorInfo.message = HTTP_MESSAGES.unknown;
        }
      }
      // Si es un objeto plano con datos de error
      else if (error && typeof error === 'object') {
        errorInfo.status = error.status || null;
        const parsed = parseBackendResponse(error);
        
        if (parsed.isValidation && parsed.errors) {
          errorInfo.isValidation = true;
          errorInfo.errors = parsed.errors;
          errorInfo.message = parsed.message;
        } else {
          errorInfo.message = getErrorMessage(errorInfo.status, context, parsed.message);
        }
      }

      // Mostrar modal de error solo si se solicita explícitamente
      if (showModal && window.ErrorModal && ERROR_CONFIG.showNotifications) {
        // Si hay errores de validación, pasarlos al modal
        if (errorInfo.isValidation && errorInfo.errors) {
          window.ErrorModal.show(errorInfo.errors, 'Errores de Validación');
        } else {
          // Error simple
          window.ErrorModal.show(errorInfo.message, 'Error');
        }
      }

      return errorInfo;
    } catch (e) {
      // Error al procesar el error (fallback)
      const fallbackError = {
        type: 'unknown',
        status: null,
        message: HTTP_MESSAGES.unknown,
        errors: null,
        isValidation: false,
        context,
        timestamp: new Date().toISOString(),
      };
      
      if (showModal && window.ErrorModal && ERROR_CONFIG.showNotifications) {
        window.ErrorModal.show(fallbackError.message, 'Error');
      }
      
      return fallbackError;
    }
  }

  /**
   * Maneja errores de validación de formularios
   * @param {Object} validationErrors - Objeto con errores de validación
   * @param {HTMLFormElement} form - Formulario donde mostrar errores
   */
  function handleValidationErrors(validationErrors, form = null) {
    if (!validationErrors || typeof validationErrors !== 'object') return;

    // Usar error-modal.js si está disponible
    if (window.ErrorModal) {
      window.ErrorModal.show(validationErrors, 'Errores de Validación');
    }

    // También marcar campos en el formulario si está disponible
    if (form) {
      Object.keys(validationErrors).forEach(fieldName => {
        const message = validationErrors[fieldName];
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input && window.Validators) {
          window.Validators.showError(input, message);
        }
      });
    }
  }

  /**
   * Muestra notificación de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms
   */
  function showSuccessNotification(message, duration = ERROR_CONFIG.defaultTimeout) {
    let container = document.getElementById('error-notifications');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-notifications';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = 'bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-lg max-w-md transition-all duration-300 ease-out opacity-0 translate-x-full';
    notification.setAttribute('role', 'alert');
    
    // Activar animación de entrada después del render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.classList.remove('opacity-0', 'translate-x-full');
        notification.classList.add('opacity-100', 'translate-x-0');
      });
    });
    
    // Activar animación de entrada
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notification.classList.remove('opacity-0', 'translate-x-full');
        notification.classList.add('opacity-100', 'translate-x-0');
      });
    });
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm text-green-800">${window.Sanitizer ? window.Sanitizer.escapeHTML(message) : escapeHTML(message)}</p>
        </div>
        <button class="ml-3 flex-shrink-0 text-green-400 hover:text-green-600 focus:outline-none close-notification-btn">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;

    // Agregar event listener al botón de cerrar
    const closeBtn = notification.querySelector('.close-notification-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        notification.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
          notification.remove();
          if (container.children.length === 0) {
            container.remove();
          }
        }, 300);
      });
    }

    container.appendChild(notification);

    setTimeout(() => {
      // Usar clases Tailwind para animación de salida
      notification.classList.add('opacity-0', 'translate-x-full');
      
      setTimeout(() => {
        notification.remove();
        if (container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }, duration);
  }

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado
   */
  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Wrapper para try-catch con manejo automático de errores
   * @param {Function} fn - Función async a ejecutar
   * @param {string} context - Contexto de la operación
   * @returns {Promise<{success: boolean, data?: any, error?: Object}>}
   */
  async function tryCatch(fn, context = null) {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const errorInfo = await handleHTTPError(error, context);
      return { success: false, error: errorInfo };
    }
  }

  /**
   * Configura manejo global de errores no capturados
   */
  function setupGlobalErrorHandling() {
    // Manejar errores de JavaScript no capturados
    window.addEventListener('error', (event) => {
      if (ERROR_CONFIG.logErrors && window.ErrorModal) {
        window.ErrorModal.show('Ha ocurrido un error inesperado en la aplicación.', 'Error de Sistema');
      }
    });

    // Manejar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      if (ERROR_CONFIG.logErrors && window.ErrorModal) {
        window.ErrorModal.show('Ha ocurrido un error no manejado.', 'Error');
      }
      
      // Prevenir el error por defecto del navegador
      event.preventDefault();
    });
  }

  // ==================== UTILIDADES ====================

  /**
   * Determina si un error es recuperable
   * @param {number} status - Código de estado HTTP
   * @returns {boolean}
   */
  function isRecoverableError(status) {
    // Errores 5xx y algunos 4xx son recuperables con retry
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Calcula tiempo de espera para retry exponencial
   * @param {number} attempt - Número de intento (1-based)
   * @param {number} baseDelay - Delay base en ms
   * @returns {number} Tiempo de espera en ms
   */
  function calculateBackoff(attempt, baseDelay = 1000) {
    return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
  }

  // ==================== EXPORTAR API ====================

  window.ErrorHandler = {
    // Clases
    HTTPError,
    NetworkError,
    
    // Funciones principales
    handleHTTPError,
    handleValidationErrors,
    parseBackendResponse,
    parseValidationString,
    getErrorMessage,
    
    // Notificaciones
    showSuccessNotification,
    
    // Utilidades
    tryCatch,
    setupGlobalErrorHandling,
    isRecoverableError,
    calculateBackoff,
    
    // Configuración
    config: ERROR_CONFIG,
    
    // Constantes
    HTTP_MESSAGES,
    FRIENDLY_MESSAGES,
  };

  // Todas las animaciones usan clases nativas de Tailwind CSS
  // No se requiere inyección de CSS personalizado
})();
