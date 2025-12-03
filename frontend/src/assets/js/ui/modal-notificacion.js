/**
 * Modal de Notificaciones
 * Vista completa de notificaciones en modal overlay
 * @module notificationModal
 */

(function() {
  'use strict';

  let modalElement = null;
  let isOpen = false;
  let currentFilter = 'all'; // 'all', 'unread', 'read'

  // ==================== RENDERIZADO ====================

  /**
   * Renderiza el modal completo
   * @returns {string} HTML del modal
   */
  function renderModal() {
    return `
      <div id="notification-modal-overlay" class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[60] hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-2xl dark:shadow-black/50 w-full max-w-4xl max-h-[90vh] flex flex-col notification-modal-container opacity-0 scale-95 transition-all duration-200 ease-out border border-gray-200 dark:border-dark-border-primary">
            <!-- Header del Modal -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary flex items-center justify-between bg-gradient-to-r from-principal-500 to-principal-600 dark:from-dark-bg-tertiary dark:to-dark-bg-tertiary rounded-t-lg">
              <div>
                <h2 class="text-2xl font-bold text-white dark:text-dark-text-primary">
                  🔔 Notificaciones
                </h2>
                <p class="text-principal-100 dark:text-dark-text-secondary text-sm mt-1" id="modal-subtitle">
                  Todas tus comunicaciones importantes
                </p>
              </div>
              <button 
                id="close-modal-btn"
                class="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cerrar modal"
              >
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Filtros y Acciones -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-tertiary">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <!-- Filtros -->
                <div class="flex items-center gap-2">
                  <button 
                    class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-200 dark:bg-dark-bg-hover text-gray-700 dark:text-dark-text-primary hover:bg-principal-100 dark:hover:bg-dark-principal-900/30"
                    data-filter="all"
                  >
                    Todas
                  </button>
                  <button 
                    class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-200 dark:bg-dark-bg-hover text-gray-700 dark:text-dark-text-primary hover:bg-principal-100 dark:hover:bg-dark-principal-900/30"
                    data-filter="unread"
                  >
                    No leídas
                  </button>
                  <button 
                    class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-200 dark:bg-dark-bg-hover text-gray-700 dark:text-dark-text-primary hover:bg-principal-100 dark:hover:bg-dark-principal-900/30"
                    data-filter="read"
                  >
                    Leídas
                  </button>
                </div>

                <!-- Acciones -->
                <div class="flex items-center gap-2">
                  <button 
                    id="modal-refresh-btn"
                    class="p-2 text-gray-600 dark:text-dark-text-secondary hover:text-principal-600 dark:hover:text-dark-principal-600 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
                    aria-label="Actualizar"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Lista de Notificaciones con Scroll -->
            <div class="flex-1 overflow-y-auto p-6" id="modal-notifications-list">
              <!-- Las notificaciones se renderizarán aquí -->
            </div>
            >
            
            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-tertiary rounded-b-lg">
              <div class="flex items-center justify-between text-sm text-gray-600 dark:text-dark-text-secondary">
                <span id="modal-count-text">0 notificaciones</span>
                <button 
                  id="modal-close-footer-btn"
                  class="text-principal-600 dark:text-dark-principal-600 hover:text-principal-800 dark:hover:text-dark-principal-700 font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza una notificación específica
   * @param {number} notificationId - ID de la notificación
   */
  function renderSingleNotification(notificationId) {
    const container = document.getElementById('modal-notifications-list');
    if (!container) return;

    const allNotifications = window.NotificationSystem?.getNotifications() || [];
    const notification = allNotifications.find(n => n.id === notificationId);

    if (!notification) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <svg class="w-24 h-24 text-gray-300 dark:text-dark-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-dark-text-primary mb-2">Notificación no encontrada</h3>
          <p class="text-gray-500 dark:text-dark-text-secondary">Esta notificación ya no está disponible</p>
          <button onclick="window.NotificationModal.showAllNotifications()" class="mt-4 text-principal-600 dark:text-dark-principal-600 hover:text-principal-800 dark:hover:text-dark-principal-700 font-medium">
            Ver todas las notificaciones
          </button>
        </div>
      `;
      return;
    }

    // Actualizar subtítulo
    const subtitle = document.getElementById('modal-subtitle');
    if (subtitle) {
      subtitle.textContent = 'Detalle de notificación';
    }

    // Actualizar contador
    const countText = document.getElementById('modal-count-text');
    if (countText) {
      countText.innerHTML = `<button onclick="window.NotificationModal.showAllNotifications()" class="text-principal-600 dark:text-dark-principal-600 hover:text-principal-800 dark:hover:text-dark-principal-700 font-medium">
        ← Ver todas las notificaciones
      </button>`;
    }

    // Renderizar la notificación
    container.innerHTML = renderModalNotificationItem(notification);

    // Attachear eventos
    attachModalEventListeners();
  }

  /**
   * Muestra todas las notificaciones (volver a la vista normal)
   */
  function showAllNotifications() {
    currentFilter = 'all';
    renderNotificationsList();
  }

  /**
   * Renderiza la lista de notificaciones según el filtro
   */
  function renderNotificationsList() {
    const container = document.getElementById('modal-notifications-list');
    if (!container) return;

    // Actualizar subtítulo
    const subtitle = document.getElementById('modal-subtitle');
    if (subtitle) {
      subtitle.textContent = 'Todas tus comunicaciones importantes';
    }

    const allNotifications = window.NotificationSystem?.getNotifications() || [];
    
    // Filtrar notificaciones
    let notifications = allNotifications;
    if (currentFilter === 'unread') {
      notifications = allNotifications.filter(n => !n.leida);
    } else if (currentFilter === 'read') {
      notifications = allNotifications.filter(n => n.leida);
    }

    // Actualizar contador
    updateModalStats(notifications.length, allNotifications.length);

    // Empty state
    if (notifications.length === 0) {
      // SEGURIDAD: Contenido hardcoded seguro (no viene del backend)
      // Los textos de currentFilter son valores controlados ('unread', 'read', 'all')
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <svg class="w-24 h-24 text-gray-300 dark:text-dark-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-dark-text-primary mb-2">
            ${currentFilter === 'unread' ? 'No hay notificaciones sin leer' : 
              currentFilter === 'read' ? 'No hay notificaciones leídas' : 
              'No hay notificaciones'}
          </h3>
          <p class="text-gray-500 dark:text-dark-text-secondary">
            ${currentFilter === 'all' ? 'Te avisaremos cuando tengas algo nuevo' : 
              'Cambia el filtro para ver otras notificaciones'}
          </p>
        </div>
      `;
      return;
    }

    // Renderizar notificaciones
    const html = notifications.map(renderModalNotificationItem).join('');
    container.innerHTML = html;

    // Attachear eventos
    attachModalEventListeners();
  }

  /**
   * Renderiza un item de notificación para el modal
   * @param {Object} notification - Notificación
   * @returns {string} HTML del item
   */
  function renderModalNotificationItem(notification) {
    const icon = window.NotificationSystem?.getNotificationIcon(notification.tipo) || '';
    const timeAgo = window.NotificationSystem?.formatRelativeTime(notification.fecha) || '';
    const fullDate = new Date(notification.fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const unreadClass = !notification.leida ? 'border-l-4 border-l-principal-500 dark:border-l-dark-principal-600 bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-dark-bg-card';
    const unreadBadge = !notification.leida 
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-principal-100 dark:bg-dark-principal-900/30 text-principal-800 dark:text-dark-principal-600">Nueva</span>' 
      : '';

    // No sanitizar - el contenido ya viene del backend y puede contener HTML válido
    const safeTitulo = notification.titulo || '';
    const safeMensaje = notification.mensaje || '';
    const safeTipo = notification.tipo || '';

    return `
      <div 
        class="notification-modal-item mb-4 rounded-lg border border-gray-200 dark:border-dark-border-primary p-5 hover:shadow-md dark:hover:shadow-black/30 transition-all cursor-pointer ${unreadClass}"
        data-notification-id="${notification.id}"
        data-notification-read="${notification.leida}"
        data-id-conexion="${notification.id_conexion || ''}"
      >
        <div class="flex items-start gap-4">
          <!-- Icono -->
          <div class="flex-shrink-0 mt-1">
            ${icon}
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-3 flex-1">
                <span class="inline-block px-3 py-1 text-xs font-bold uppercase rounded bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary">
                  ${safeTipo}
                </span>
                ${unreadBadge}
              </div>
            </div>

            <h3 class="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-2">
              ${safeTitulo}
            </h3>

            <p class="text-gray-700 dark:text-dark-text-secondary mb-3">
              ${safeMensaje}
            </p>

            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400 dark:text-dark-text-muted" title="${fullDate}">${timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Actualiza las estadísticas del modal
   */
  function updateModalStats(filtered, total) {
    const countText = document.getElementById('modal-count-text');
    const subtitle = document.getElementById('modal-subtitle');
    
    if (countText) {
      if (currentFilter === 'all') {
        countText.textContent = `${total} ${total === 1 ? 'notificación' : 'notificaciones'}`;
      } else {
        countText.textContent = `${filtered} de ${total} notificaciones`;
      }
    }

    if (subtitle) {
      const unreadCount = window.NotificationSystem?.getUnreadCount() || 0;
      if (unreadCount > 0) {
        subtitle.textContent = `${unreadCount} sin leer`;
      } else {
        subtitle.textContent = 'Todas las notificaciones leídas';
      }
    }

    // Actualizar estilos de filtros
    updateFilterButtons();
  }

  /**
   * Actualiza los estilos de los botones de filtro
   */
  function updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const filter = btn.getAttribute('data-filter');
      if (filter === currentFilter) {
        btn.className = 'filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-principal-500 text-white';
      } else {
        btn.className = 'filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';
      }
    });
  }

  // ==================== EVENTOS ====================

  /**
   * Attachea eventos a los elementos del modal
   */
  function attachModalEventListeners() {
    // Click en notificación - marca como leída y actualiza visualmente
    document.querySelectorAll('.notification-modal-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const notificationId = parseInt(item.dataset.notificationId);
        const isRead = item.dataset.notificationRead === 'true';

        // Marcar como leída si no lo está
        if (!isRead && window.NotificationSystem) {
          const success = await window.NotificationSystem.markAsRead(notificationId);
          if (success) {
            // Si estamos en vista de una sola notificación, re-renderizarla
            const subtitle = document.getElementById('modal-subtitle');
            if (subtitle && subtitle.textContent === 'Detalle de notificación') {
              renderSingleNotification(notificationId);
            } else {
              // Si estamos en vista de todas, re-renderizar lista completa
              renderNotificationsList();
            }
          }
        }
      });
    });

    // Marcar como leída (botón)
    document.querySelectorAll('.modal-mark-read-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.notificationId);
        
        if (window.NotificationSystem) {
          const success = await window.NotificationSystem.markAsRead(id);
          if (success) {
            // Re-renderizar completamente para reflejar cambios
            const subtitle = document.getElementById('modal-subtitle');
            if (subtitle && subtitle.textContent === 'Detalle de notificación') {
              renderSingleNotification(id);
            } else {
              renderNotificationsList();
            }
          }
        }
      });
    });
  }

  // ==================== CONTROL DEL MODAL ====================

  /**
   * Abre el modal
   */
  function openModal() {
    if (!modalElement) {
      return;
    }

    isOpen = true;
    currentFilter = 'all';
    modalElement.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body

    // Renderizar contenido
    renderNotificationsList();

    // Animación de entrada
    setTimeout(() => {
      const container = modalElement.querySelector('.notification-modal-container');
      if (container) {
        container.classList.add('opacity-100', 'scale-100');
        container.classList.remove('opacity-0', 'scale-95');
      }
    }, 10);
  }

  /**
   * Abre el modal mostrando una notificación específica
   * @param {number} notificationId - ID de la notificación a mostrar
   */
  function openModalWithNotification(notificationId) {
    if (!modalElement) {
      return;
    }

    isOpen = true;
    currentFilter = 'all';
    modalElement.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Renderizar solo la notificación específica
    renderSingleNotification(notificationId);

    // Animación de entrada
    setTimeout(() => {
      const container = modalElement.querySelector('.notification-modal-container');
      if (container) {
        container.classList.add('opacity-100', 'scale-100');
        container.classList.remove('opacity-0', 'scale-95');
      }
    }, 10);
  }

  /**
   * Cierra el modal
   */
  function closeModal() {
    if (!modalElement) return;
    
    // Animación de salida
    const container = modalElement.querySelector('.notification-modal-container');
    if (container) {
      container.classList.add('opacity-0', 'scale-95');
      container.classList.remove('opacity-100', 'scale-100');
    }

    setTimeout(() => {
      isOpen = false;
      modalElement.classList.add('hidden');
      document.body.style.overflow = ''; // Restaurar scroll
    }, 200);
  }

  /**
   * Cambia el filtro de notificaciones
   */
  function changeFilter(filter) {
    currentFilter = filter;
    renderNotificationsList();
  }

  // ==================== INICIALIZACIÓN ====================

  /**
   * Inicializa el modal
   */
  function init() {
    // Crear modal si no existe
    if (!modalElement) {
      const div = document.createElement('div');
      div.innerHTML = renderModal();
      document.body.appendChild(div.firstElementChild);
      modalElement = document.getElementById('notification-modal-overlay');
    }

    // Eventos del modal
    const closeBtn = document.getElementById('close-modal-btn');
    const closeFooterBtn = document.getElementById('modal-close-footer-btn');
    const markAllBtn = document.getElementById('modal-mark-all-read-btn');
    const refreshBtn = document.getElementById('modal-refresh-btn');
    const overlay = modalElement;

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', closeModal);
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        if (window.NotificationSystem) {
          await window.NotificationSystem.fetchNotifications();
          renderNotificationsList();
        }
      });
    }

    // Cerrar al hacer click en el overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    });

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        changeFilter(filter);
      });
    });

    // Escuchar actualizaciones de notificaciones
    window.addEventListener('notificationsUpdated', () => {
      if (isOpen) {
        renderNotificationsList();
      }
    });
  }

  // ==================== EXPORTAR API ====================

  window.NotificationModal = {
    init,
    openModal,
    openModalWithNotification,
    showAllNotifications,
    closeModal,
    get isOpen() { return isOpen; },
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
