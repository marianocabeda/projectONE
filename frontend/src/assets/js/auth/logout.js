/**
 * Módulo de Logout
 * Maneja el cierre de sesión del usuario de forma segura
 */
(function() {
  'use strict';

  // Usar configuración centralizada
  const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
    const API_BASE_URL = window.ENV?.API_BASE_URL || window.AppConfig?.API_BASE_URL;
    const endpoints = window.AppConfig?.endpoints || {};
    
    if (endpoint.startsWith('http')) return endpoint;
    if (endpoints[endpoint]) return API_BASE_URL + endpoints[endpoint];
    if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
    return endpoint;
  });

  const loginRoute = window.AppConfig?.routes?.login || '/login';

  /**
   * Realiza el logout del usuario
   * @returns {Promise<void>}
   */
  async function handleLogout() {
    try {
      // Usar el método de logout de AuthToken que maneja cookies httpOnly
      if (window.AuthToken && typeof window.AuthToken.logout === 'function') {
        await window.AuthToken.logout();
      } else {
        // Fallback manual si AuthToken no está disponible
        console.log('🔓 AuthToken.logout() no disponible, usando fallback manual');
        
        // Marcar logout en progreso
        window.isLoggingOut = true;
        window._suppressAuthRedirect = true;
        try {
          localStorage.setItem('logout_in_progress', String(Date.now()));
        } catch (e) {
          // ignore
        }

        // Llamar al endpoint de logout
        const logoutUrl = getUrl('logout');
        const response = await fetch(logoutUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('✅ Logout exitoso en servidor');
        } else {
          console.warn('⚠️ Logout falló en servidor, status:', response.status);
        }

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
        
        // Limpiar cualquier storage residual
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // ignore
        }
        
        // 🎨 Restaurar temas de todos los usuarios
        try {
          Object.entries(themesToPreserve).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        } catch (e) {
          // ignore
        }
        
        // 🔄 Resetear tema al del sistema después del logout
        if (window.ThemeManager) {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          console.log('🎨 Reseteando tema al del sistema:', systemTheme);
          const htmlElement = document.documentElement;
          if (systemTheme === 'dark') {
            htmlElement.classList.add('dark');
          } else {
            htmlElement.classList.remove('dark');
          }
        }

        // Redirigir a login
        const loginRoute = window.AppConfig?.routes?.login || '/login';
        window.location.href = loginRoute + '?status=success&msg=' + 
          encodeURIComponent('Has cerrado sesión correctamente.');
      }
    } catch (error) {
      console.error('❌ Error en logout:', error);
      
      // Fallback: forzar recarga
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
   * Configura listeners para elementos de logout
   */
  function setupLogoutListeners() {
    const logoutElements = document.querySelectorAll('[data-logout], .logout-btn, #logout-btn, #logout-link');
    
    logoutElements.forEach(element => {
      // Verificar si ya tiene el listener para evitar duplicados
      if (element.dataset.logoutListenerAttached === 'true') {
        return;
      }
      
      element.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const shouldLogout = confirm('¿Estás seguro que deseas cerrar sesión?');
        if (shouldLogout) {
          await handleLogout();
        }
      });
      
      element.dataset.logoutListenerAttached = 'true';
    });
  }

  // Configurar listeners cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogoutListeners);
  } else {
    // DOM ya está listo, configurar inmediatamente
    setupLogoutListeners();
  }

  // También usar MutationObserver para detectar elementos de logout agregados dinámicamente
  function initMutationObserver() {
    if (!document.body) {
      setTimeout(initMutationObserver, 100);
      return;
    }
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Es un elemento
            // Verificar si el nodo agregado es un elemento de logout
            if (node.matches && (
              node.matches('[data-logout]') || 
              node.matches('.logout-btn') || 
              node.id === 'logout-btn' || 
              node.id === 'logout-link'
            )) {
              // Verificar si ya tiene listener
              if (node.dataset.logoutListenerAttached === 'true') {
                return;
              }
              
              node.addEventListener('click', async (e) => {
                e.preventDefault();
                const shouldLogout = confirm('¿Estás seguro que deseas cerrar sesión?');
                if (shouldLogout) {
                  await handleLogout();
                }
              });
              
              node.dataset.logoutListenerAttached = 'true';
            }
            
            // Verificar si el nodo contiene elementos de logout
            const logoutChildren = node.querySelectorAll && node.querySelectorAll('[data-logout], .logout-btn, #logout-btn, #logout-link');
            if (logoutChildren && logoutChildren.length > 0) {
              logoutChildren.forEach(child => {
                // Verificar si ya tiene listener
                if (child.dataset.logoutListenerAttached === 'true') {
                  return;
                }
                
                child.addEventListener('click', async (e) => {
                  e.preventDefault();
                  const shouldLogout = confirm('¿Estás seguro que deseas cerrar sesión?');
                  if (shouldLogout) {
                    await handleLogout();
                  }
                });
                
                child.dataset.logoutListenerAttached = 'true';
              });
            }
          }
        });
      });
    });

    // Observar cambios en el body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Iniciar observer
  initMutationObserver();

  // Exportar función para uso manual
  window.performLogout = handleLogout;
})();
