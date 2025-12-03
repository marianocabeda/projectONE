/**
 * Actualiza el año en el footer automáticamente
 */
(function() {
  'use strict';
  
  function updateYear() {
    try {
      const yearElement = document.getElementById('year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    } catch (e) {
      // Ignorar errores silenciosamente
    }
  }
  
  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateYear);
  } else {
    updateYear();
  }
})();
