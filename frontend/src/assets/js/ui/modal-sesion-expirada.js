/**
 * Modal de Sesión Expirada
 * Muestra un modal flotante cuando la sesión expira, ofreciendo opciones para:
 * - Cerrar sesión
 * - Autenticarse nuevamente (redirige a login)
 */
(function() {
  'use strict';

  // Bandera para prevenir múltiples modales simultáneos
  let modalShown = false;

  /**
   * Muestra el modal de sesión expirada
   */
  function showSessionExpiredModal() {
    // Prevenir múltiples modales
    if (modalShown) {
      console.log('⚠️ Modal de sesión expirada ya está visible');
      return;
    }

    console.log('⏰ Mostrando modal de sesión expirada');
    modalShown = true;

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'session-expired-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 dark:bg-black/80 z-[9999] backdrop-blur-sm flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    // Crear panel del modal
    const panel = document.createElement('div');
    panel.className = 'bg-white dark:bg-dark-bg-secondary rounded-xl w-full max-w-md shadow-2xl dark:shadow-black/50 p-6 transform transition-all border border-gray-200 dark:border-dark-border-primary';
    panel.style.animation = 'slideIn 0.3s ease-out';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'session-expired-title');

    // Contenido del modal
    // SEGURIDAD: Contenido hardcoded seguro (no depende de input de usuario)
    panel.innerHTML = `
      <!-- Icono de alerta -->
      <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
        <svg class="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>

      <!-- Título -->
      <h2 id="session-expired-title" class="text-2xl font-bold text-gray-900 dark:text-dark-text-primary text-center mb-2">
        Sesión Expirada
      </h2>

      <!-- Mensaje -->
      <p class="text-gray-600 dark:text-dark-text-secondary text-center mb-6">
        Tu sesión ha expirado por inactividad. Por favor, elige una opción para continuar.
      </p>

      <!-- Botones de acción -->
      <div class="flex flex-col gap-3">
        <!-- Botón: Autenticarse nuevamente (principal) -->
        <button 
          id="session-reauth-btn" 
          class="w-full px-6 py-3 bg-principal-500 dark:bg-dark-principal-600 text-white font-semibold rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary focus:ring-principal-500 dark:focus:ring-dark-principal-600"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            <span>Iniciar Sesión Nuevamente</span>
          </div>
        </button>

        <!-- Botón: Cerrar sesión (secundario) -->
        <button 
          id="session-logout-btn" 
          class="w-full px-6 py-3 bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-hover transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary focus:ring-gray-300 dark:focus:ring-dark-border-primary"
        >
          <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Cerrar Sesión</span>
          </div>
        </button>
      </div>

      <!-- Información adicional -->
      <p class="text-xs text-gray-500 dark:text-dark-text-muted text-center mt-4">
        Por razones de seguridad, tu sesión expira después de un período de inactividad.
      </p>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Agregar animaciones CSS si no existen
    if (!document.getElementById('session-modal-animations')) {
      const style = document.createElement('style');
      style.id = 'session-modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Configurar event listeners
    const reauthBtn = document.getElementById('session-reauth-btn');
    const logoutBtn = document.getElementById('session-logout-btn');

    // Botón: Autenticarse nuevamente
    reauthBtn.addEventListener('click', async () => {
      console.log('🔄 Usuario eligió autenticarse nuevamente');
      
      // Mostrar indicador de carga
      reauthBtn.disabled = true;
      reauthBtn.innerHTML = `
        <div class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Redirigiendo...</span>
        </div>
      `;

      // Limpiar storage (mantener datos mínimos para evitar loops)
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        sessionStorage.clear();
      } catch (e) {
        console.warn('Error limpiando storage:', e);
      }

      // Redirigir a login con mensaje
      const loginRoute = window.AppConfig?.routes?.login || '/login';
      const redirectUrl = loginRoute + '?status=info&msg=' + 
        encodeURIComponent('Tu sesión expiró. Por favor, inicia sesión nuevamente.');
      
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    });

    // Botón: Cerrar sesión
    logoutBtn.addEventListener('click', async () => {
      console.log('🚪 Usuario eligió cerrar sesión');
      
      // Mostrar indicador de carga
      logoutBtn.disabled = true;
      logoutBtn.innerHTML = `
        <div class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cerrando sesión...</span>
        </div>
      `;

      // Usar la función de logout global si está disponible
      if (window.performLogout) {
        await window.performLogout();
      } else if (window.AuthToken && window.AuthToken.logout) {
        await window.AuthToken.logout();
      } else {
        // Fallback: limpiar y redirigir manualmente
        console.warn('⚠️ No se encontró función de logout, usando fallback');
        
        // 💾 Preservar temas de TODOS los usuarios antes de limpiar
        const themesToPreserve = {};
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('user_theme_')) {
              themesToPreserve[key] = localStorage.getItem(key);
            }
          }
        } catch (e) {
          // ignore
        }
        
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error('Error limpiando storage:', e);
        }
        
        // 🎨 Restaurar temas de todos los usuarios
        try {
          Object.entries(themesToPreserve).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        } catch (e) {
          // ignore
        }
        
        const loginRoute = window.AppConfig?.routes?.login || '/login';
        window.location.href = loginRoute;
      }
    });

    // Prevenir cierre con ESC o click fuera del modal (sesión expirada es crítica)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // No hacer nada - forzar que el usuario elija una opción
        panel.classList.add('animate-shake');
        setTimeout(() => {
          panel.classList.remove('animate-shake');
        }, 500);
      }
    });

    // Focus en el botón principal
    reauthBtn.focus();
  }

  /**
   * Cierra el modal (si está visible)
   */
  function hideSessionExpiredModal() {
    const overlay = document.getElementById('session-expired-overlay');
    if (overlay) {
      overlay.remove();
      modalShown = false;
      console.log('✅ Modal de sesión expirada cerrado');
    }
  }

  /**
   * Verifica si el modal está visible
   */
  function isModalVisible() {
    return modalShown;
  }

  // Exportar funciones globalmente
  window.SessionExpiredModal = {
    show: showSessionExpiredModal,
    hide: hideSessionExpiredModal,
    isVisible: isModalVisible,
  };

  console.log('✅ SessionExpiredModal cargado correctamente');
})();
