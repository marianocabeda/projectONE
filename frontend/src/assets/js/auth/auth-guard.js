// Auth Guard - Protección de páginas que requieren autenticación
// Incluir este script al inicio de páginas protegidas (dashboard, etc.)

(function() {
  // 🔓 MODO DESARROLLO: Sin protección de autenticación
  if (window.ENV && window.ENV.isDevelopment) {
    console.log('🔓 Modo desarrollo: Auth guard deshabilitado');
    return; // Salir sin verificar autenticación
  }

  // Esperar a que la sesión se restaure antes de verificar autenticación
  async function checkAuth() {
    if (window.AuthToken && typeof window.AuthToken.requireAuth === 'function') {
      await window.AuthToken.requireAuth();
    } else {
      // Fallback si AuthToken no está cargado aún: delegar a ErrorHandler o mostrar alert
      if (window.ErrorHandler) {
        try {
          const err = new Error('AuthToken no está disponible. Redirigiendo a login...');
          err.status = 401;
          window.ErrorHandler.handleHTTPError(err, 'login', false);
        } catch (e) { /* swallow */ }
      }
      // Si estamos en proceso de logout, no agregar parámetros de error
      const logoutInProgress = window.AuthToken && typeof window.AuthToken.isLogoutInProgress === 'function'
        ? window.AuthToken.isLogoutInProgress()
        : (window.isLoggingOut === true || !!localStorage.getItem('logout_in_progress'));

      if (logoutInProgress) {
        window.location.href = '/login';
      } else {
        window.location.href = '/login?status=error&msg=' + 
          encodeURIComponent('Debes iniciar sesión para acceder a esta página.');
      }
    }
  }

  // Escuchar el evento de restauración de sesión
  window.addEventListener('auth:restored', async (event) => {
    const authenticated = event.detail.authenticated;
    if (!authenticated) {
      await checkAuth();
    }
  });

  // Si la sesión ya se restauró antes de que este script se ejecute, verificar inmediatamente
  if (window.isUserAuthenticated !== undefined) {
    if (!window.isUserAuthenticated) {
      checkAuth();
    }
  } else {
    // Si no se ha restaurado aún, esperar un poco y luego verificar (fallback)
    setTimeout(async () => {
      if (window.isUserAuthenticated === false) {
        await checkAuth();
      }
    }, 1000);
  }

  // Verificar periódicamente la validez del token (cada 60 segundos)
  // 🔓 Solo en staging/production
  // 🔥 NOTA: No verificamos aquí, dejamos que el HTTP interceptor maneje el refresh
  // Este intervalo solo sirve para detectar si el token fue removido manualmente
  if (!window.ENV || !window.ENV.isDevelopment) {
    setInterval(async () => {
      if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
        const authenticated = await window.AuthToken.isAuthenticated();
        
        // Solo redirigir si NO está autenticado
        const logoutInProgress = window.AuthToken && typeof window.AuthToken.isLogoutInProgress === 'function'
          ? window.AuthToken.isLogoutInProgress()
          : (window.isLoggingOut === true || !!localStorage.getItem('logout_in_progress'));

        if (!authenticated && !logoutInProgress) {
          const config = window.AppConfig || { routes: { login: '/login' } };
          console.log('⚠️ Usuario no autenticado, redirigiendo a login...');
          window.location.href = config.routes.login + '?status=error&msg=' + 
            encodeURIComponent('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
      }
    }, 60000); // 60 segundos
  }

  // Exponer información del usuario actual en la página
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.AuthToken && typeof window.AuthToken.getUser === 'function') {
      const user = await window.AuthToken.getUser();
      
      // Actualizar elementos que muestran info del usuario
      const userNameElements = document.querySelectorAll('[data-user-name]');
      const userEmailElements = document.querySelectorAll('[data-user-email]');
      const userRoleElements = document.querySelectorAll('[data-user-role]');
      
      if (user) {
        userNameElements.forEach(el => {
          el.textContent = user.nombre || user.name || 'Usuario';
        });
        
        userEmailElements.forEach(el => {
          el.textContent = user.email || '';
        });
        
        userRoleElements.forEach(el => {
          el.textContent = user.rol || user.role || '';
        });
      }
    }
  });
})();
