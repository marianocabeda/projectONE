// Redirect if Authenticated - Redirige al dashboard si el usuario ya está autenticado
// Incluir este script en páginas públicas de login (login, registro)

(function () {
  'use strict';

  // Evitar inicialización múltiple si el script se ejecuta varias veces
  if (window.__redirectIfAuthenticatedInitialized) {
    return;
  }
  window.__redirectIfAuthenticatedInitialized = true;

  // 🔓 MODO DESARROLLO: No redirigir automáticamente
  if (window.ENV && window.ENV.isDevelopment) {
    console.log('🔓 Modo desarrollo: Redirección automática deshabilitada');
    return;
  }

  // Solo redirigir desde páginas de autenticación (login, registro)
  const currentPath = window.location.pathname;
  const authPages = ['/login', '/registro'];
  const isAuthPage = authPages.some(page => currentPath === page || currentPath.endsWith(page + '.html'));
  
  if (!isAuthPage) {
    console.log('📄 No es página de login/registro, omitiendo redirección automática');
    return;
  }

  console.log('🔍 Página de autenticación detectada:', currentPath);

  // Configuración
  const dashboardRoute = window.AppConfig?.routes?.dashboard || '/dashboard';

  /**
   * Espera a que la sesión se restaure y luego verifica si debe redirigir
   */
  async function checkAndRedirect() {
    // Esperar a que AuthToken esté disponible
    if (!window.AuthToken || typeof window.AuthToken.isAuthenticated !== 'function') {
      console.log('⏳ Esperando a que AuthToken esté disponible...');
      
      await new Promise(resolve => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
            clearInterval(interval);
            resolve();
          } else if (attempts >= 30) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    // Esperar a que SessionRestore complete (si está disponible)
    if (window.SessionRestore && typeof window.SessionRestore.isRestoring === 'function') {
      let waitCount = 0;
      while (window.SessionRestore.isRestoring() && waitCount < 30) {
        console.log('⏳ Esperando a que se restaure la sesión...');
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
    }

    // Verificar si el usuario está autenticado
    try {
      const isAuthenticated = await window.AuthToken.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('✅ Usuario ya autenticado, redirigiendo al dashboard...');
        
        // Pequeña pausa para que Session Manager termine de inicializar
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Redirigir al dashboard
        window.location.href = dashboardRoute;
      } else {
        console.log('👤 Usuario no autenticado, permaneciendo en página de login');
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
    }
  }

  /**
   * Inicializar verificación después de que la sesión se restaure
   */
  function initialize() {
    // Escuchar evento de sesión restaurada
    window.addEventListener('auth:restored', async (event) => {
      const authenticated = event.detail?.authenticated;
      
      if (authenticated) {
        console.log('✅ Sesión restaurada exitosamente');
        
        // Esperar un poco para que Session Manager complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirigir al dashboard
        window.location.href = dashboardRoute;
      } else {
        console.log('👤 No se pudo restaurar la sesión');
      }
    });

    // Si la sesión ya se restauró antes de este script, verificar inmediatamente
    if (window.isUserAuthenticated !== undefined) {
      if (window.isUserAuthenticated === true) {
        console.log('✅ Sesión ya estaba activa');
        setTimeout(() => {
          window.location.href = dashboardRoute;
        }, 200);
      }
    } else {
      // La sesión no se ha restaurado aún, esperar a que lo haga
      setTimeout(checkAndRedirect, 1000);
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // También verificar cuando la ventana recupera el foco (por si inició sesión en otra pestaña)
  window.addEventListener('focus', async () => {
    console.log('🔄 Ventana recuperó el foco - Verificando autenticación');
    
    try {
      if (window.AuthToken && typeof window.AuthToken.isAuthenticated === 'function') {
        const isAuth = await window.AuthToken.isAuthenticated();
        if (isAuth) {
          console.log('✅ Usuario autenticado en otra pestaña, redirigiendo...');
          window.location.href = dashboardRoute;
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    }
  });

})();
