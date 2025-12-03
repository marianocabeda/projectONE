/**
 * UI de Dropdown de Notificaciones
 * Componente visual para mostrar notificaciones en un menú desplegable
 * @module notificationDropdown
 */

(function() {
  'use strict';

  let dropdownElement = null;
  let buttonElement = null;
  let badgeElement = null;
  let isOpen = false;

  // ==================== RENDERIZADO ====================

  /**
   * Renderiza el dropdown de notificaciones
   * @returns {string} HTML del dropdown
   */
  function renderDropdown() {
    const notifications = window.NotificationSystem?.getNotifications() || [];
    const unreadCount = window.NotificationSystem?.getUnreadCount() || 0;
    const maxDisplay = window.AppConfig?.notifications?.maxNotifications || 10;

    if (notifications.length === 0) {
      return `
        <div class="p-8 text-center text-gray-500 dark:text-dark-text-secondary">
          <svg class="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <p class="font-medium text-gray-700 dark:text-dark-text-primary">No hay notificaciones</p>
          <p class="text-sm mt-1 text-gray-500 dark:text-dark-text-secondary">Te avisaremos cuando tengas algo nuevo</p>
        </div>
      `;
    }

    const displayNotifications = notifications.slice(0, maxDisplay);
    const hasMore = notifications.length > maxDisplay;

    const notificationsHTML = displayNotifications.map(renderNotificationItem).join('');

    return `
      <div class="notification-dropdown-content">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-tertiary">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
            Notificaciones
            ${unreadCount > 0 ? `<span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-principal-100 dark:bg-principal-900/30 text-principal-800 dark:text-principal-300">${unreadCount}</span>` : ''}
          </h3>
        </div>

        <!-- Lista de notificaciones -->
        <div class="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-border-primary">
          ${notificationsHTML}
        </div>


        <!-- Footer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-tertiary">
          ${hasMore ? `
            <p class="text-xs text-gray-500 dark:text-dark-text-secondary text-center mb-2">
              Mostrando ${maxDisplay} de ${notifications.length} notificaciones
            </p>
          ` : ''}
          <button 
            id="footer-view-all-btn"
            class="text-sm text-principal-600 dark:text-dark-principal-600 hover:text-principal-800 dark:hover:text-dark-principal-700 font-medium transition-colors flex items-center gap-1 mx-auto"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
            Ver todas
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza un item de notificación
   * @param {Object} notification - Notificación
   * @returns {string} HTML del item
   */
  function renderNotificationItem(notification) {
    const icon = window.NotificationSystem?.getNotificationIcon(notification.tipo) || '';
    const timeAgo = window.NotificationSystem?.formatRelativeTime(notification.fecha) || '';
    const unreadClass = !notification.leida ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-principal-500 dark:border-l-dark-principal-600' : 'bg-white dark:bg-dark-bg-card';
    const unreadDot = !notification.leida ? '<span class="w-2 h-2 bg-principal-500 dark:bg-dark-principal-600 rounded-full"></span>' : '';

    // SEGURIDAD: No sanitizar aquí - el contenido ya viene sanitizado del backend
    // El mensaje puede contener HTML seguro (como saltos de línea)
    const safeTitle = notification.titulo || '';
    const safeMessage = notification.mensaje || '';
    const safeTipo = notification.tipo || '';

    // Formatear fecha completa para el tooltip
    const fullDate = new Date(notification.fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div 
        class="notification-item px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-bg-hover cursor-pointer transition-all duration-200 ${unreadClass}"
        data-notification-id="${notification.id}"
        data-notification-read="${notification.leida}"
        data-id-conexion="${notification.id_conexion || ''}"
      >
        <div class="flex items-start space-x-3">
          <!-- Icono -->
          <div class="flex-shrink-0 mt-0.5">
            ${icon}
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="flex items-center gap-2">
                <span class="inline-block px-2 py-0.5 text-xs font-semibold uppercase rounded bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary">
                  ${safeTipo}
                </span>
                ${unreadDot}
              </div>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
              ${safeTitle}
            </p>
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary line-clamp-2">
              ${safeMessage}
            </p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-400 dark:text-dark-text-muted" title="${fullDate}">${timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==================== EVENTOS ====================

  /**
   * Maneja el click en una notificación
   * @param {Event} event - Evento de click
   */
  async function handleNotificationClick(event) {
    const item = event.target.closest('.notification-item');
    if (!item) return;

    const notificationId = parseInt(item.dataset.notificationId);
    const isRead = item.dataset.notificationRead === 'true';
    const idConexionRaw = item.dataset.idConexion;
    // Convertir string vacío o undefined a null
    const idConexion = (idConexionRaw && idConexionRaw !== '' && idConexionRaw !== 'undefined') ? idConexionRaw : null;

    console.log('[NotificationDropdown] Click en notificación:', {
      notificationId,
      idConexionRaw,
      idConexion,
      pathname: window.location.pathname,
      dataset: item.dataset
    });

    // Marcar como leída ANTES de abrir el modal
    if (!isRead && window.NotificationSystem) {
      await window.NotificationSystem.markAsRead(notificationId);
      // Esperar un momento para que el sistema actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cerrar dropdown
    closeDropdown();
    
    // VERIFICAR SI ESTAMOS EN EL PANEL DE VERIFICADOR
    // El sistema usa hash navigation, no pathname
    const currentHash = window.location.hash.replace('#', ''); // Ej: "solicitudes-cola"
    const currentPath = window.location.pathname; // Fallback por si cambian a pathname
    const isVerificadorPanel = currentHash === 'solicitudes-cola' || 
                               currentHash.includes('verificador') ||
                               currentPath.includes('/verificador') || 
                               currentPath.includes('solicitudes-cola');
    
    console.log('[NotificationDropdown] Verificación panel:', {
      hash: currentHash,
      pathname: currentPath,
      isVerificadorPanel,
      hasIdConexion: !!idConexion,
      hasModalProcessor: !!window.ModalProcessor,
      hasRequestsManager: !!window.RequestsManager
    });
    
    // Si estamos en el panel de verificador Y la notificación tiene id_conexion
    if (isVerificadorPanel && idConexion && window.ModalProcessor && window.RequestsManager) {
      console.log('[NotificationDropdown] Abriendo modal de verificación para conexión:', idConexion);
      
      // Buscar la solicitud correspondiente en la lista cargada
      const solicitudes = window.RequestsManager.getSolicitudes();
      console.log('[NotificationDropdown] Solicitudes disponibles:', solicitudes.length);
      
      const solicitud = solicitudes.find(s => {
        const match = s.nro_conexion === idConexion || 
                     String(s.id) === String(idConexion) || 
                     String(s.id_conexion_notificacion) === String(idConexion);
        if (match) {
          console.log('[NotificationDropdown] Solicitud encontrada:', s);
        }
        return match;
      });
      
      if (solicitud) {
        console.log('[NotificationDropdown] ✅ Abriendo modal de procesamiento');
        // Abrir modal de procesamiento con la solicitud
        window.ModalProcessor.openModal(solicitud);
      } else {
        console.warn('[NotificationDropdown] ❌ No se encontró solicitud con id_conexion:', idConexion);
        console.log('[NotificationDropdown] Solicitudes disponibles:', solicitudes.map(s => ({
          id: s.id,
          nro_conexion: s.nro_conexion,
          id_conexion_notificacion: s.id_conexion_notificacion
        })));
        // Fallback: abrir modal de notificación normal
        if (window.NotificationModal) {
          window.NotificationModal.openModalWithNotification(notificationId);
        }
      }
    } else {
      console.log('[NotificationDropdown] Abriendo modal de notificaciones normal');
      // Comportamiento normal: abrir el modal de notificaciones
      if (window.NotificationModal) {
        window.NotificationModal.openModalWithNotification(notificationId);
      }
    }
  }

  /**
   * Maneja marcar como leída
   * @param {Event} event - Evento de click
   */
  async function handleMarkAsRead(event) {
    event.stopPropagation();
    const button = event.target.closest('.mark-read-btn');
    if (!button) return;

    const notificationId = parseInt(button.dataset.notificationId);
    
    if (window.NotificationSystem) {
      const success = await window.NotificationSystem.markAsRead(notificationId);
      if (success) {
        // Actualizar UI
        updateDropdownContent();
      }
    }
  }

  // ==================== CONTROL DEL DROPDOWN ====================

  /**
   * Abre el dropdown con animación Tailwind
   */
  function openDropdown() {
    if (!dropdownElement) {
      console.error('❌ No se puede abrir dropdown: elemento no existe');
      return;
    }
    
    console.log('🔔 Abriendo dropdown de notificaciones');
    isOpen = true;
    
    // Mostrar elemento y activar animación con Tailwind
    dropdownElement.classList.remove('hidden');
    
    // Forzar reflow para que la animación funcione
    dropdownElement.offsetHeight;
    
    // Activar animación (opacity y translate)
    dropdownElement.classList.remove('opacity-0', '-translate-y-2');
    dropdownElement.classList.add('opacity-100', 'translate-y-0');
    
    // Actualizar contenido
    updateDropdownContent();
    
    // Agregar evento para cerrar al hacer click fuera
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }

  /**
   * Cierra el dropdown con animación Tailwind
   */
  function closeDropdown() {
    if (!dropdownElement) return;
    
    isOpen = false;
    
    // Animar salida
    dropdownElement.classList.remove('opacity-100', 'translate-y-0');
    dropdownElement.classList.add('opacity-0', '-translate-y-2');
    
    // Ocultar después de la animación (200ms según duration-200)
    setTimeout(() => {
      dropdownElement.classList.add('hidden');
    }, 200);
    
    // Remover evento de click fuera
    document.removeEventListener('click', handleClickOutside);
  }

  /**
   * Toggle del dropdown
   */
  function toggleDropdown() {
    console.log('🔔 Toggle dropdown, estado actual:', isOpen ? 'abierto' : 'cerrado');
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  /**
   * Maneja click fuera del dropdown
   * @param {Event} event - Evento de click
   */
  function handleClickOutside(event) {
    if (!dropdownElement || !buttonElement) return;
    
    if (!dropdownElement.contains(event.target) && !buttonElement.contains(event.target)) {
      closeDropdown();
    }
  }

  /**
   * Actualiza el contenido del dropdown
   */
  function updateDropdownContent() {
    if (!dropdownElement) return;
    
    // NOTA: renderDropdown() debe sanitizar contenido de notificaciones
    // si proviene del backend sin sanitizar
    dropdownElement.innerHTML = renderDropdown();
    
    // Re-attachear eventos
    attachEventListeners();
  }

  /**
   * Actualiza el badge de contador
   * Sistema simplificado: muestra badge SOLO si hay notificaciones sin leer
   */
  function updateBadge() {
    if (!badgeElement) {
      console.warn('⚠️ updateBadge: badgeElement no existe');
      return;
    }
    
    // Obtener contador de no leídas desde el sistema
    const unreadCount = window.NotificationSystem?.getUnreadCount() || 0;
    
    console.log('🔔 updateBadge:', {
      unreadCount,
      badgeExists: !!badgeElement,
      systemReady: !!window.NotificationSystem
    });
    
    // Resetear todas las clases y contenido
    badgeElement.className = 'notification-badge absolute -top-1 -right-1 items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full';
    badgeElement.textContent = '';
    
    // Mostrar SOLO si hay notificaciones no leídas
    if (unreadCount > 0) {
      badgeElement.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
      badgeElement.classList.add('inline-flex', 'animate-pulse');
      console.log('✅ Badge visible:', unreadCount, 'notificaciones no leídas');
    } else {
      badgeElement.classList.add('hidden');
      console.log('✅ Badge oculto: 0 notificaciones no leídas');
    }
  }

  /**
   * Attachea event listeners al contenido del dropdown
   */
  function attachEventListeners() {
    if (!dropdownElement) return;

    // Click en items de notificación
    const items = dropdownElement.querySelectorAll('.notification-item');
    items.forEach(item => {
      item.addEventListener('click', handleNotificationClick);
    });

    // Botón de ver todas en modal
    const viewAllBtn = dropdownElement.querySelector('#footer-view-all-btn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        closeDropdown();
        if (window.NotificationModal) {
          window.NotificationModal.openModal();
        } else {
          console.warn('⚠️ NotificationModal no está disponible');
        }
      });
    }
  }

  // ==================== INICIALIZACIÓN ====================

  /**
   * Inicializa el dropdown de notificaciones
   * @param {string|HTMLElement} buttonSelector - Selector o elemento del botón
   * @param {string|HTMLElement} dropdownSelector - Selector o elemento del dropdown
   * @param {boolean} skipButtonEvent - Si true, no agrega evento click al botón (se maneja externamente)
   */
  function init(buttonSelector = '#notifications-button', dropdownSelector = null, skipButtonEvent = false) {
    // Encontrar botón
    buttonElement = typeof buttonSelector === 'string' 
      ? document.querySelector(buttonSelector)
      : buttonSelector;

    if (!buttonElement) {
      console.error('❌ NotificationDropdown: botón no encontrado', buttonSelector);
      return;
    }

    console.log('🔔 NotificationDropdown: Botón encontrado', buttonElement);

    // Crear o encontrar dropdown
    if (dropdownSelector) {
      dropdownElement = typeof dropdownSelector === 'string'
        ? document.querySelector(dropdownSelector)
        : dropdownSelector;
    } else {
      // Crear dropdown si no existe
      dropdownElement = document.createElement('div');
      dropdownElement.id = 'notifications-dropdown';
      // Usar clases Tailwind completas (animación con transition y transform) con dark mode
      dropdownElement.className = 'absolute right-0 md:right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-dark-bg-card rounded-lg shadow-xl dark:shadow-black/50 border border-gray-200 dark:border-dark-border-primary hidden z-50 transition-all duration-200 ease-out opacity-0 -translate-y-2';
      
      // Insertar después del botón en el contenedor
      const container = buttonElement.closest('#notifications-container') || buttonElement.parentElement;
      
      if (!container) {
        console.error('❌ NotificationDropdown: No se encontró contenedor para el botón');
        return;
      }
      
      // Asegurar que el contenedor tenga posición relativa
      if (window.getComputedStyle(container).position === 'static') {
        if (!container.classList.contains('relative')) {
          container.classList.add('relative');
        }
      }
      
      container.appendChild(dropdownElement);
      console.log('🔔 NotificationDropdown: Dropdown creado y agregado al DOM');
    }

    // Limpiar y crear badge desde cero
    badgeElement = buttonElement.querySelector('.notification-badge');
    if (badgeElement) {
      // Remover badge existente para empezar limpio
      badgeElement.remove();
      console.log('🧹 Badge existente removido');
    }
    
    // Crear badge nuevo completamente oculto
    badgeElement = document.createElement('span');
    badgeElement.className = 'notification-badge absolute -top-1 -right-1 items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full hidden';
    badgeElement.textContent = '';
    
    // Asegurar que el botón tenga posición relativa
    if (!buttonElement.classList.contains('relative')) {
      buttonElement.classList.add('relative');
    }
    
    buttonElement.appendChild(badgeElement);
    console.log('🔔 Badge creado (oculto inicialmente)');

    // Evento de click en botón (solo si no se maneja externamente)
    if (!skipButtonEvent) {
      buttonElement.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔔 Click en botón de notificaciones');
        toggleDropdown();
      });
    }

    // Escuchar actualizaciones de notificaciones
    window.addEventListener('notificationsUpdated', (event) => {
      console.log('🔔 [NotificationDropdown] Evento notificationsUpdated recibido:', event.detail);
      console.log('🔔 [NotificationDropdown] Actualizando badge y dropdown...');
      updateBadge();
      if (isOpen) {
        console.log('🔔 [NotificationDropdown] Dropdown abierto - actualizando contenido');
        updateDropdownContent();
      }
    });

    // Actualización inicial después de que NotificationSystem cargue datos
    // Esperar a que se complete el primer fetch de notificaciones
    const initBadge = () => {
      if (window.NotificationSystem) {
        console.log('🔄 Actualizando badge inicial...');
        updateBadge();
        console.log('✅ NotificationDropdown inicializado correctamente');
      } else {
        console.warn('⚠️ NotificationSystem no disponible todavía, reintentando...');
        setTimeout(initBadge, 200);
      }
    };
    
    setTimeout(initBadge, 100);
    
    // Debug: verificar si el sistema de notificaciones está activo
    // Si no está disponible, se cargará después y actualizará vía evento
    if (window.NotificationSystem) {
      console.log('✅ NotificationSystem disponible -', window.NotificationSystem.unreadCount || 0, 'no leídas');
    }
    // Nota: NotificationSystem se carga después, actualizará vía evento 'notificationsUpdated'
  }

  /**
   * Destruye el dropdown
   */
  function destroy() {
    closeDropdown();
    
    if (buttonElement) {
      buttonElement.removeEventListener('click', toggleDropdown);
    }
    
    if (dropdownElement && dropdownElement.parentElement) {
      dropdownElement.remove();
    }
    
    window.removeEventListener('notificationsUpdated', updateBadge);
    
    buttonElement = null;
    dropdownElement = null;
    badgeElement = null;
  }

  // ==================== ESTILOS CSS ====================

  // Todos los estilos usan Tailwind CSS nativo
  // Animaciones: transition-all, duration-200, opacity-0, -translate-y-2
  // line-clamp-1 y line-clamp-2 son clases nativas de Tailwind CSS
  // animate-pulse es una animación nativa de Tailwind para el badge

  // ==================== EXPORTAR API ====================

  window.NotificationDropdown = {
    init,
    destroy,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    updateDropdownContent,
    updateBadge,
  };
})();
