/**
 * Manejo del botón "Añadir Conexión"
 */
(function() {
  'use strict';
  
  let isSetup = false;
  
  function setupButton() {
    const btnAddConexion = document.getElementById('btn-add-conexion');
    if (!btnAddConexion) {
      console.log('⏳ Botón añadir conexión aún no está en el DOM');
      return false;
    }
    
    // Evitar setup duplicado
    if (btnAddConexion.dataset.listenerAttached === 'true') {
      console.log('ℹ️ Listener ya configurado en el botón');
      return true;
    }
    
    btnAddConexion.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('➕ Añadir Conexión clickeado');
      console.log('🔍 Verificando window.loadContent...', typeof window.loadContent);
      
      // Verificar que window.loadContent esté disponible
      if (typeof window.loadContent === 'function') {
        console.log('✅ window.loadContent disponible, cargando formulario...');
        try {
          await window.loadContent('/contrato');
          console.log('✅ Formulario cargado correctamente');
          
          // Desactivar todos los enlaces del menú
          document.querySelectorAll('aside nav a').forEach(link => {
            link.classList.remove('text-principal-600', 'bg-principal-100', 'font-semibold');
            link.classList.add('text-gray-500', 'font-medium');
          });
        } catch (error) {
          console.error('❌ Error al cargar formulario:', error);
          // Fallback a navegación normal
          window.location.href = '/contrato';
        }
      } else {
        console.warn('⚠️ window.loadContent no disponible, usando navegación normal');
        window.location.href = '/contrato';
      }
    });
    
    btnAddConexion.dataset.listenerAttached = 'true';
    console.log('✅ Listener de añadir conexión configurado');
    return true;
  }
  
  // Intentar setup inicial
  function trySetup() {
    if (setupButton()) {
      isSetup = true;
    }
  }
  
  // Setup en DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trySetup);
  } else {
    trySetup();
  }
  
  // Observar cambios en el DOM para detectar cuando se carga la página de conexiones
  const observer = new MutationObserver((mutations) => {
    if (isSetup) return; // Ya configurado
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Intentar configurar si encuentra el botón
        if (setupButton()) {
          isSetup = true;
          break;
        }
      }
    }
  });
  
  // Observar el contenedor principal del dashboard
  const observeTarget = () => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      observer.observe(mainContent, {
        childList: true,
        subtree: true
      });
      console.log('👀 Observer configurado para detectar botón de añadir conexión');
    } else {
      // Reintentar después de un momento
      setTimeout(observeTarget, 500);
    }
  };
  
  observeTarget();
})();
