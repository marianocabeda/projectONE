/**
 * Session Manager - Gestión de sesión única activa
 * Similar a WhatsApp Web: solo permite una ventana/pestaña activa a la vez
 * 
 * Funcionalidad:
 * - Detecta cuando se abre una nueva ventana/pestaña con sesión iniciada
 * - Muestra modal "Usar aquí" para elegir qué ventana mantener activa
 * - Sincroniza entre ventanas usando BroadcastChannel y localStorage
 */

(function() {
  'use strict';

  // Generar ID único para esta ventana/pestaña
  const WINDOW_ID = 'window_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const STORAGE_KEY = 'active_session_window';
  const CHANNEL_NAME = 'session_sync_channel';
  const HEARTBEAT_INTERVAL = 3000; // 3 segundos
  const INACTIVE_THRESHOLD = 10000; // 10 segundos sin heartbeat = ventana cerrada

  let broadcastChannel = null;
  let heartbeatInterval = null;
  let isActiveWindow = false;
  let modal = null;

  /**
   * Verificar si estamos en una página privada/protegida (dashboard)
   */
  function isPrivatePage() {
    const path = window.location.pathname;
    // Solo aplicar en páginas del dashboard (privadas)
    return path.includes('/dashboard') || 
           path.includes('/ajustes') || 
           path.includes('/usuario') ||
           path.includes('/soporte') ||
           path.includes('/cambiar-contrasena') ||
           path.includes('/verificador') ||
           path.includes('/atencion') ||
           path.includes('/cliente');
  }

  /**
   * Inicializar el gestor de sesiones
   */
  function init() {
    // Solo funciona en páginas privadas (dashboard)
    if (!isPrivatePage()) {
      console.log('🔓 Session Manager: página pública, protección de ventanas deshabilitada');
      return;
    }

    // Solo funciona si el usuario está autenticado
    if (!isAuthenticated()) {
      return;
    }

    console.log('🪟 Session Manager iniciado - Window ID:', WINDOW_ID);

    // Crear canal de comunicación entre ventanas
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      setupBroadcastListeners();
    } catch (error) {
      console.warn('⚠️ BroadcastChannel no disponible, usando fallback con storage events');
      setupStorageListeners();
    }

    // IMPORTANTE: Esperar un poco antes de verificar ventanas activas
    // Esto permite que si venimos de un login reciente, el token se establezca primero
    const recentLogin = Date.now() - (parseInt(sessionStorage.getItem('login_timestamp')) || 0) < 2000;
    
    if (recentLogin) {
      console.log('🆕 Login reciente detectado, tomando control inmediatamente');
      becomeActiveWindow();
    } else {
      // Verificar si hay otra ventana activa después de un pequeño delay
      setTimeout(() => {
        checkForActiveWindow();
      }, 500);
    }

    // Cleanup al cerrar ventana
    window.addEventListener('beforeunload', cleanup);

    // Detectar cuando el usuario vuelve a esta pestaña
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  function isAuthenticated() {
    // Verificar token en localStorage o sessionStorage
    const token = localStorage.getItem('access_token') || 
                 sessionStorage.getItem('access_token');
    
    // También verificar si window.AuthToken indica autenticación
    if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
      return window.AuthToken.isAuthenticated();
    }
    
    return !!token;
  }

  /**
   * Verificar si hay otra ventana activa
   */
  function checkForActiveWindow() {
    try {
      const activeWindowData = localStorage.getItem(STORAGE_KEY);
      
      if (!activeWindowData) {
        // No hay otra ventana, esta es la activa
        becomeActiveWindow();
        return;
      }

      const data = JSON.parse(activeWindowData);
      const timeSinceHeartbeat = Date.now() - data.lastHeartbeat;

      if (timeSinceHeartbeat > INACTIVE_THRESHOLD) {
        // La otra ventana está inactiva, tomar control
        console.log('🪟 Ventana anterior inactiva, tomando control');
        becomeActiveWindow();
        return;
      }

      // Hay otra ventana activa, preguntar al usuario
      showUseHereModal();
      
      // Notificar a la otra ventana que hay una nueva ventana
      sendMessage({ type: 'NEW_WINDOW', windowId: WINDOW_ID });

    } catch (error) {
      console.error('Error verificando ventana activa:', error);
      becomeActiveWindow();
    }
  }

  /**
   * Convertir esta ventana en la activa
   */
  function becomeActiveWindow() {
    isActiveWindow = true;
    updateActiveWindow();
    startHeartbeat();
    console.log('✅ Esta ventana es ahora la activa');
  }

  /**
   * Actualizar información de ventana activa en localStorage
   */
  function updateActiveWindow() {
    try {
      const data = {
        windowId: WINDOW_ID,
        lastHeartbeat: Date.now(),
        userAgent: navigator.userAgent
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error actualizando ventana activa:', error);
    }
  }

  /**
   * Iniciar heartbeat para indicar que esta ventana está viva
   */
  function startHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(() => {
      if (isActiveWindow) {
        updateActiveWindow();
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Detener heartbeat
   */
  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  /**
   * Mostrar modal "Usar aquí"
   */
  function showUseHereModal() {
    // Prevenir múltiples modales
    if (modal) {
      return;
    }

    // Crear modal
    modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-fade-in">
        <div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
          <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-center text-gray-900 mb-2">
          ONE Internet ya está abierto
        </h2>
        
        <p class="text-center text-gray-600 mb-6">
          Tenés una sesión activa en otra ventana o pestaña. ¿Querés usar ONE Internet aquí?
        </p>
        
        <div class="space-y-3">
          <button id="use-here-btn" 
            class="w-full boton boton-principal px-6 py-3 rounded-lg font-medium transition">
            Usar aquí
          </button>
          
          <button id="cancel-btn" 
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition">
            Cancelar
          </button>
        </div>
        
        <p class="text-xs text-center text-gray-500 mt-4">
          Al hacer clic en "Usar aquí", tu sesión en la otra ventana se cerrará.
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const useHereBtn = modal.querySelector('#use-here-btn');
    const cancelBtn = modal.querySelector('#cancel-btn');

    useHereBtn.addEventListener('click', handleUseHere);
    cancelBtn.addEventListener('click', handleCancel);

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
  }

  /**
   * Cerrar modal
   */
  function closeModal() {
    if (modal) {
      modal.remove();
      modal = null;
      document.body.style.overflow = '';
    }
  }

  /**
   * Handler: Usuario elige usar esta ventana
   */
  async function handleUseHere() {
    console.log('✅ Usuario eligió usar esta ventana');
    
    // Notificar a otras ventanas que deben cerrarse
    sendMessage({ type: 'TAKE_OVER', windowId: WINDOW_ID });
    
    // Convertir esta en la ventana activa
    becomeActiveWindow();
    
    // Cerrar modal
    closeModal();
    
    // SIEMPRE redirigir al dashboard al usar aquí
    // Esto abandona cualquier progreso en formularios o flujos en curso
    console.log('🔄 Redirigiendo al dashboard (abandonando progreso actual)...');
    
    // Esperar un momento para que el modal se cierre
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verificar si hay sesión válida
    if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
      try {
        const isAuth = await window.AuthToken.isAuthenticated();
        
        if (isAuth) {
          console.log('✅ Sesión válida, redirigiendo al dashboard...');
          const dashboardRoute = window.AppConfig?.routes?.dashboard || '/dashboard';
          
          // Limpiar cualquier estado temporal de formularios
          // (los datos se pierden intencionalmente)
          sessionStorage.removeItem('form_progress');
          sessionStorage.removeItem('form_draft');
          
          window.location.href = dashboardRoute;
        } else {
          console.log('⚠️ No hay sesión válida, redirigiendo al login...');
          const loginRoute = window.AppConfig?.routes?.login || '/login';
          window.location.href = loginRoute;
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // En caso de error, redirigir al login por seguridad
        const loginRoute = window.AppConfig?.routes?.login || '/login';
        window.location.href = loginRoute;
      }
    } else {
      // Si AuthToken no está disponible, intentar redirigir al dashboard de todas formas
      console.warn('⚠️ AuthToken no disponible, redirigiendo al dashboard...');
      const dashboardRoute = window.AppConfig?.routes?.dashboard || '/dashboard';
      window.location.href = dashboardRoute;
    }
  }

  /**
   * Handler: Usuario cancela
   */
  function handleCancel() {
    console.log('❌ Usuario canceló, redirigiendo...');
    closeModal();
    
    // Redirigir a una página neutral o cerrar
    window.location.href = '/';
  }

  /**
   * Manejar cuando la ventana se vuelve invisible
   */
  function handleInactiveWindow() {
    console.log('🔒 Esta ventana ya no es la activa');
    isActiveWindow = false;
    stopHeartbeat();
    
    // Mostrar overlay indicando que la sesión está activa en otra ventana
    showInactiveOverlay();
  }

  /**
   * Mostrar overlay de sesión inactiva
   */
  function showInactiveOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'inactive-overlay';
    overlay.className = 'fixed inset-0 z-[9998] flex items-center justify-center bg-white';
    overlay.innerHTML = `
      <div class="text-center max-w-md mx-4">
        <div class="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-3">
          Sesión en uso
        </h2>
        
        <p class="text-gray-600 mb-6">
          Tu sesión de ONE Internet está activa en otra ventana o pestaña.
        </p>
        
        <button id="reactivate-btn" 
          class="boton boton-principal px-8 py-3 rounded-lg font-medium transition">
          Usar aquí
        </button>
        
        <p class="text-sm text-gray-500 mt-6">
          O cierra esta ventana si deseas continuar en la otra.
        </p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Event listener para reactivar
    const reactivateBtn = overlay.querySelector('#reactivate-btn');
    reactivateBtn.addEventListener('click', () => {
      overlay.remove();
      handleUseHere();
    });
  }

  /**
   * Configurar listeners del BroadcastChannel
   */
  function setupBroadcastListeners() {
    if (!broadcastChannel) return;

    broadcastChannel.addEventListener('message', (event) => {
      const { type, windowId } = event.data;

      // Ignorar mensajes de esta misma ventana
      if (windowId === WINDOW_ID) {
        return;
      }

      console.log('📨 Mensaje recibido:', type, 'de ventana:', windowId);

      switch (type) {
        case 'NEW_WINDOW':
          // Otra ventana se abrió
          if (isActiveWindow) {
            console.log('⚠️ Nueva ventana detectada mientras esta es activa');
          }
          break;

        case 'TAKE_OVER':
          // Otra ventana tomó el control
          if (isActiveWindow) {
            handleInactiveWindow();
          }
          break;

        case 'PING':
          // Otra ventana está verificando cuántas hay activas
          sendMessage({ type: 'PONG', windowId: WINDOW_ID });
          break;
      }
    });
  }

  /**
   * Configurar listeners de storage (fallback)
   */
  function setupStorageListeners() {
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      // Otra ventana actualizó el storage
      try {
        const newData = JSON.parse(event.newValue);
        if (newData.windowId !== WINDOW_ID && isActiveWindow) {
          // Otra ventana tomó el control
          handleInactiveWindow();
        }
      } catch (error) {
        console.error('Error procesando storage event:', error);
      }
    });
  }

  /**
   * Enviar mensaje a otras ventanas
   */
  function sendMessage(message) {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  }

  /**
   * Manejar cambio de visibilidad de la pestaña
   */
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible' && !isActiveWindow) {
      // Usuario volvió a esta pestaña pero no es la activa
      console.log('👁️ Usuario volvió a pestaña inactiva');
      
      // Verificar si la otra ventana sigue activa
      checkForActiveWindow();
    }
  }

  /**
   * Cleanup al cerrar ventana
   */
  function cleanup() {
    console.log('🧹 Limpiando Session Manager');
    
    stopHeartbeat();
    
    // Si esta era la ventana activa, limpiar el storage
    if (isActiveWindow) {
      try {
        const currentData = localStorage.getItem(STORAGE_KEY);
        if (currentData) {
          const data = JSON.parse(currentData);
          if (data.windowId === WINDOW_ID) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error en cleanup:', error);
      }
    }

    // Cerrar canal
    if (broadcastChannel) {
      broadcastChannel.close();
    }
  }

  // Exponer API pública
  window.SessionManager = {
    init,
    isActiveWindow: () => isActiveWindow,
    getWindowId: () => WINDOW_ID
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
