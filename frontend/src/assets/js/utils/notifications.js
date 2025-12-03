/**
 * Sistema de Notificaciones
 * Gestiona notificaciones del usuario con seguridad, sanitización y polling
 * @module notifications
 */

(function() {
  'use strict';

  // ==================== CONFIGURACIÓN ====================
  
  // Usar configuración centralizada
  const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    if (endpoint.startsWith('http')) return endpoint;
    if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
    return endpoint;
  });
  
  let config = {
    pollInterval: 5000,
    maxNotifications: 10,
    autoMarkReadDelay: 3000,
  };

  // Estado del sistema
  let pollingInterval = null;
  let notifications = [];
  let unreadCount = 0;
  let isLoading = false;
  let lastFetchTime = 0;
  const MIN_FETCH_INTERVAL = 5000; // Rate limiting: mínimo 5 seg entre requests

  // ==================== RATE LIMITING ====================

  /**
   * Verifica si puede hacer un fetch (rate limiting)
   * @returns {boolean}
   */
  function canFetch() {
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      if (window.ENV?.isDevelopment) {
        console.warn('⚠️ Rate limit: esperando antes de hacer otro fetch');
      }
      return false;
    }
    return true;
  }

  /**
   * Actualiza el timestamp del último fetch
   */
  function updateFetchTime() {
    lastFetchTime = Date.now();
  }

  // ==================== SANITIZACIÓN Y VALIDACIÓN ====================

  /**
   * Sanitiza una notificación del backend
   * @param {Object} notification - Notificación cruda
   * @returns {Object} Notificación sanitizada
   */
  function sanitizeNotification(notification) {
    if (!notification || typeof notification !== 'object') {
      return null;
    }

    const sanitized = {
      id: parseInt(notification.id_notificacion) || 0,
      titulo: window.Sanitizer 
        ? window.Sanitizer.escapeHTML(notification.titulo || '')
        : String(notification.titulo || '').substring(0, 200),
      mensaje: window.Sanitizer 
        ? window.Sanitizer.escapeHTML(notification.mensaje || '')
        : String(notification.mensaje || '').substring(0, 1000),
      tipo: notification.tipo ? notification.tipo.toLowerCase() : 'info',
      // Backend: leido = 0 (no leída), leido = 1 (leída)
      // Convertir explícitamente a número para evitar problemas con strings
      leida: parseInt(notification.leido) === 1,
      fecha: validateDate(notification.creado),
      // Datos adicionales del backend
      id_conexion: notification.id_conexion || null,
      id_contrato: notification.id_contrato || null,
      id_pago: notification.id_pago || null,
      rol_destino: notification.rol_destino || null,
      // Observación técnica/operativa (opcional)
      observacion: notification.observacion 
        ? (window.Sanitizer 
          ? window.Sanitizer.escapeHTML(notification.observacion)
          : String(notification.observacion).substring(0, 500))
        : null,
    };

    // Validar que tenga al menos ID y mensaje
    if (!sanitized.id || !sanitized.mensaje) {
      return null;
    }

    return sanitized;
  }

  /**
   * Valida el tipo de notificación
   * @param {string} type - Tipo a validar
   * @returns {string} Tipo válido
   */
  function validateNotificationType(type) {
    // Tipos del backend: SOLICITUD, FACTIBILIDAD, PAGO, CONTRATO, INSTALACION, etc.
    // Mapear a tipos de UI
    const typeMap = {
      'solicitud': 'info',
      'factibilidad': 'success',
      'pago': 'warning',
      'contrato': 'info',
      'instalacion': 'info',
      'rechazo': 'error',
      'error': 'error',
      'info': 'info',
      'success': 'success',
      'warning': 'warning',
    };
    const normalizedType = String(type).toLowerCase();
    return typeMap[normalizedType] || 'info';
  }

  /**
   * Valida y parsea fecha
   * @param {string|Date} date - Fecha a validar
   * @returns {Date} Fecha válida
   */
  function validateDate(date) {
    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return new Date();
      }
      // Verificar que no sea fecha futura (posible manipulación)
      if (parsed > new Date()) {
        return new Date();
      }
      // Verificar que no sea muy antigua (más de 1 año)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (parsed < oneYearAgo) {
        return oneYearAgo;
      }
      return parsed;
    } catch (e) {
      return new Date();
    }
  }

  /**
   * Sanitiza URL (reutiliza del Sanitizer si existe)
   * @param {string} url - URL a sanitizar
   * @returns {string|null} URL segura o null
   */
  function sanitizeURL(url) {
    if (!url) return null;
    
    if (window.Sanitizer && typeof window.Sanitizer.sanitizeURL === 'function') {
      return window.Sanitizer.sanitizeURL(url);
    }

    // Fallback básico
    const trimmed = String(url).trim();
    if (/^(javascript|data):/i.test(trimmed)) {
      return null;
    }
    
    try {
      const urlObj = new URL(trimmed, window.location.origin);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return null;
      }
      return urlObj.href;
    } catch (e) {
      return null;
    }
  }

  /**
   * Sanitiza un array de notificaciones
   * @param {Array} rawNotifications - Notificaciones crudas
   * @returns {Array} Notificaciones sanitizadas
   */
  function sanitizeNotifications(rawNotifications) {
    if (!Array.isArray(rawNotifications)) {
      console.error('❌ sanitizeNotifications: esperaba array, recibió', typeof rawNotifications);
      return [];
    }

    return rawNotifications
      .map(sanitizeNotification)
      .filter(n => n !== null) // Remover notificaciones inválidas
      .slice(0, 50); // Límite de seguridad: máximo 50 notificaciones
  }

  // ==================== API CALLS ====================

  /**
   * Obtiene todas las notificaciones del usuario
   * @returns {Promise<Array>} Array de notificaciones
   */
  async function fetchNotifications() {
    if (isLoading) {
      if (window.ENV?.isDevelopment) {
        console.log('⏳ Ya hay un fetch en curso');
      }
      return notifications;
    }

    if (!canFetch()) {
      return notifications;
    }

    isLoading = true;
    updateFetchTime();

    try {
      const url = window.AppConfig?.getUrl('notifications');
      if (!url) {
        throw new Error('URL de notificaciones no configurada');
      }

      let result;
      
      // Usar AuthToken.authenticatedFetch si está disponible
      if (window.AuthToken && typeof window.AuthToken.authenticatedFetch === 'function') {
        const response = await window.AuthToken.authenticatedFetch(url, {
          method: 'GET',
          timeout: 10000, // 10 segundos máximo
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        result = await response.json();
      } 
      // Fallback a HTTP module
      else if (window.HTTP && typeof window.HTTP.get === 'function') {
        const httpResult = await window.HTTP.get(url);
        result = httpResult.data;
      } 
      else {
        throw new Error('No hay módulo HTTP disponible');
      }

      // Extraer array de notificaciones - el backend retorna { data: { notificaciones: [...] } }
      const rawNotifications = result.data?.notificaciones || result.notificaciones || result.notifications || result.data || result;
      
      // Sanitizar
      const sanitized = sanitizeNotifications(rawNotifications);
      
      // Actualizar estado
      notifications = sanitized;
      unreadCount = sanitized.filter(n => !n.leida).length;

      console.log('✅ Notificaciones obtenidas:', sanitized.length, 'No leídas:', unreadCount);
      if (window.ENV?.isDevelopment) {
        console.log('📊 Debug notificaciones:', sanitized.map(n => ({ 
          id: n.id, 
          titulo: n.titulo, 
          leida: n.leida,
          leido_raw: rawNotifications.find(r => r.id_notificacion === n.id)?.leido
        })));
      }

      // Disparar evento personalizado
      dispatchNotificationsUpdated();

      return sanitized;
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      
      // Manejar error con ErrorHandler si está disponible
      if (window.ErrorHandler && typeof window.ErrorHandler.handleHTTPError === 'function') {
        await window.ErrorHandler.handleHTTPError(error, 'notifications', false);
      }

      return notifications; // Retornar cache en caso de error
    } finally {
      isLoading = false;
    }
  }

  /**
   * Marca una notificación como leída
   * @param {number} notificationId - ID de la notificación
   * @returns {Promise<boolean>} Éxito
   */
  async function markAsRead(notificationId) {
    const id = parseInt(notificationId);
    if (!id || id <= 0) {
      console.error('❌ ID de notificación inválido:', notificationId);
      return false;
    }

    try {
      const endpoint = window.AppConfig?.endpoints?.notificationMarkRead;
      if (!endpoint) {
        throw new Error('Endpoint de marcar leída no configurado');
      }

      // Construir URL completa
      const url = window.AppConfig.API_BASE_URL + endpoint;

      // Usar AuthToken.authenticatedFetch
      if (window.AuthToken && typeof window.AuthToken.authenticatedFetch === 'function') {
        const response = await window.AuthToken.authenticatedFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_notificacion: id }),
        });

        if (response.ok) {
          // Actualizar cache local
          const notification = notifications.find(n => n.id === id);
          if (notification) {
            notification.leida = true;
            unreadCount = notifications.filter(n => !n.leida).length;
            dispatchNotificationsUpdated();
          }
          
          if (window.ENV?.isDevelopment) {
            console.log('✅ Notificación', id, 'marcada como leída');
          }
          
          return true;
        } else {
          console.error('❌ Error HTTP al marcar como leída:', response.status);
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
      return false;
    }
  }

  // Métodos markAllAsRead y deleteNotification eliminados - no existen en el backend

  // ==================== POLLING ====================

  /**
   * Inicia el polling automático de notificaciones
   */
  function startPolling() {
    // Actualizar configuración desde AppConfig si existe
    if (window.AppConfig?.notifications) {
      config = { ...config, ...window.AppConfig.notifications };
    }

    console.log('🔔 Iniciando polling de notificaciones con intervalo:', config.pollInterval / 1000, 'seg');

    // Fetch inicial
    fetchNotifications();

    // Limpiar polling anterior si existe
    if (pollingInterval) {
      clearInterval(pollingInterval);
      console.log('🔄 Limpiando intervalo anterior de polling');
    }

    // Iniciar nuevo polling
    pollingInterval = setInterval(async () => {
      console.log('⏰ Tick del polling - verificando autenticación');
      if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
        const authenticated = await window.AuthToken.isAuthenticated();
        console.log('🔐 Estado de autenticación:', authenticated);
        if (authenticated) {
          console.log('📡 Fetching notificaciones...');
          await fetchNotifications();
        } else {
          console.log('❌ Usuario no autenticado - deteniendo polling');
          stopPolling();
        }
      } else {
        console.warn('⚠️ AuthToken no disponible en el polling');
      }
    }, config.pollInterval);

    console.log('✅ Polling de notificaciones iniciado (cada', config.pollInterval / 1000, 'seg, ID:', pollingInterval, ')');
  }

  /**
   * Detiene el polling automático
   */
  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      if (window.ENV?.isDevelopment) {
        console.log('🔕 Polling de notificaciones detenido');
      }
    }
  }

  // ==================== EVENTOS PERSONALIZADOS ====================

  /**
   * Dispara evento de notificaciones actualizadas
   */
  function dispatchNotificationsUpdated() {
    const event = new CustomEvent('notificationsUpdated', {
      detail: {
        notifications,
        unreadCount,
        timestamp: Date.now(),
      }
    });
    window.dispatchEvent(event);
    console.log('📢 Evento notificationsUpdated disparado - No leídas:', unreadCount);
  }

  // ==================== GETTERS ====================

  /**
   * Obtiene todas las notificaciones (del cache)
   * @returns {Array}
   */
  function getNotifications() {
    return [...notifications];
  }

  /**
   * Obtiene solo notificaciones no leídas
   * @returns {Array}
   */
  function getUnreadNotifications() {
    return notifications.filter(n => !n.leida);
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   * @returns {number}
   */
  function getUnreadCount() {
    return unreadCount;
  }

  /**
   * Obtiene una notificación por ID
   * @param {number} id - ID de la notificación
   * @returns {Object|null}
   */
  function getNotificationById(id) {
    return notifications.find(n => n.id === parseInt(id)) || null;
  }

  // ==================== HELPERS DE UI ====================

  /**
   * Obtiene icono según el tipo de notificación
   * @param {string} type - Tipo de notificación
   * @returns {string} HTML del icono
   */
  function getNotificationIcon(type) {
    // Mapear tipos del backend a íconos
    const normalizedType = String(type).toLowerCase();
    const typeToIcon = {
      'solicitud': 'info',
      'factibilidad': 'success',
      'pago': 'warning',
      'contrato': 'info',
      'instalacion': 'info',
      'rechazo': 'error',
      'no_aprobada': 'error',
      'rechazada': 'error',
      'denegada': 'error',
    };
    
    const iconType = typeToIcon[normalizedType] || 'info';
    
    const icons = {
      success: `<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>`,
      error: `<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>`,
      warning: `<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>`,
      info: `<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>`,
    };
    return icons[iconType] || icons.info;
  }

  /**
   * Formatea fecha relativa (ej: "hace 5 min")
   * @param {Date} date - Fecha a formatear
   * @returns {string} Texto relativo
   */
  function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffHour < 24) return `hace ${diffHour}h`;
    if (diffDay < 7) return `hace ${diffDay}d`;
    
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  // ==================== EXPORTAR API ====================

  window.NotificationSystem = {
    // Gestión de notificaciones
    fetchNotifications,
    markAsRead,
    
    // Polling
    startPolling,
    stopPolling,
    
    // Getters
    getNotifications,
    getUnreadNotifications,
    getUnreadCount,
    getNotificationById,
    
    // Helpers UI
    getNotificationIcon,
    formatRelativeTime,
    
    // Estado (read-only)
    get isLoading() { return isLoading; },
    get notifications() { return [...notifications]; },
    get unreadCount() { return unreadCount; },
  };

  // Auto-iniciar polling si el usuario está autenticado
  // Solo en páginas protegidas, no en páginas públicas
  const currentPath = window.location.pathname;
  const publicPages = ['/', '/index.html', '/contacto', '/acercade', '/contrato', '/login', '/registro', '/forgot-password', '/cambiar-password', '/verificar-email'];
  const isPublicPage = publicPages.some(page => currentPath === page || currentPath.endsWith(page));
  
  if (!isPublicPage && window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
    (async () => {
      const authenticated = await window.AuthToken.isAuthenticated();
      if (authenticated) {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startPolling);
        } else {
          startPolling();
        }
      }
    })();
  }
})();
