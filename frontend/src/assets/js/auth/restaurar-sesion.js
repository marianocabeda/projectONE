/**
 * Session Restore - Restaura automáticamente la sesión del usuario
 * usando el refresh token (cookie httpOnly) si no hay access token en localStorage.
 * 
 * Este módulo se ejecuta al cargar CUALQUIER página (pública o protegida)
 * y intenta restaurar la sesión silenciosamente en background.
 */
(function () {
  'use strict';

  // Flag global para indicar si la restauración está en progreso
  let isRestoring = false;
  let restorePromise = null;

  /**
   * Intenta restaurar la sesión usando el refresh token (cookie httpOnly)
   * @returns {Promise<boolean>} true si se restauró exitosamente, false si no
   */
  async function tryRestoreSession() {
    // Evitar múltiples intentos simultáneos
    if (isRestoring && restorePromise) {
      return restorePromise;
    }

    // MODO DESARROLLO: No restaurar sesión
    if (window.ENV && window.ENV.isDevelopment) {
      return true;
    }

    // EVITAR BUCLE DE REFRESH POST-LOGOUT
    const lastLogout = parseInt(localStorage.getItem('logout_complete') || '0', 10);
    if (Date.now() - lastLogout < 10000) {
      console.log('⏭️ Omitiendo restauración: logout reciente');
      return false;
    }

    // 🔒 SEGURIDAD: Verificar si hay access_token
    const hasToken = window.AuthToken?.getToken?.() !== null;
    
    if (hasToken) {
      // Verificar que el token sea válido con el backend
      console.log('🔍 Verificando token existente...');
      const isAuthenticated = await window.AuthToken?.isAuthenticated?.();
      
      if (isAuthenticated) {
        console.log('✅ Sesión activa detectada (access_token válido)');
        publishAuthEvent(true);
        return true;
      } else {
        console.log('⚠️ Token inválido, intentando refrescar...');
      }
    }
    
    // No hay token o token inválido, intentar refrescar con refresh_token (httpOnly cookie)
    console.log('🔄 No hay sesión activa, intentando restaurar con refresh_token (httpOnly cookie)...');

    // Marcar que estamos restaurando
    isRestoring = true;

    restorePromise = (async () => {
      try {
        if (!window.AuthToken || typeof window.AuthToken.refreshAccessToken !== 'function') {
          return false;
        }

        const refreshed = await window.AuthToken.refreshAccessToken();

        if (refreshed) {
          publishAuthEvent(true);
          return true;
        } else {
          publishAuthEvent(false);
          return false;
        }
      } catch (error) {
        publishAuthEvent(false);
        return false;
      } finally {
        isRestoring = false;
        restorePromise = null;
      }
    })();

    return restorePromise;
  }

  /**
   * Publica un evento personalizado para notificar el estado de autenticación
   * @param {boolean} authenticated - Si el usuario está autenticado
   */
  function publishAuthEvent(authenticated) {
    try {
      window.isUserAuthenticated = authenticated;
      const event = new CustomEvent('auth:restored', {
        detail: { authenticated }
      });
      window.dispatchEvent(event);
    } catch (e) {
      // Ignorar error
    }
  }

  /**
   * Espera a que AuthToken esté disponible antes de intentar restaurar
   */
  function waitForAuthToken() {
    return new Promise((resolve) => {
      if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 20;

      const interval = setInterval(() => {
        attempts++;

        if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
          clearInterval(interval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Inicializar restauración de sesión al cargar la página
   */
  async function initialize() {
    await waitForAuthToken();
    await tryRestoreSession();
  }

  // Ejecutar inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM ya está listo, ejecutar inmediatamente
    initialize();
  }

  // Exponer API pública
  window.SessionRestore = {
    tryRestoreSession,
    isRestoring: () => isRestoring,
  };
})();
