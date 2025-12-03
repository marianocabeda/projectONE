/**
 * Script para la página Acerca de Nosotros
 */
(function() {
  'use strict';

  // Actualizar año en footer
  function updateYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  // Animación fade-in al hacer scroll
  function setupFadeInAnimation() {
    const elements = document.querySelectorAll('.fade-in');
    
    if (elements.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Opcional: dejar de observar después de animar
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elements.forEach(element => observer.observe(element));
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateYear();
      setupFadeInAnimation();
    });
  } else {
    // DOM ya está listo
    updateYear();
    setupFadeInAnimation();
  }

})();
