/**
 * Inicializa el switch para alternar entre planes HOGAR y PYME
 */
(function() {
  'use strict';
  
  document.addEventListener('DOMContentLoaded', function() {
    const switchElement = document.getElementById('plan-type-switch');
    
    if (!switchElement) {
      console.warn('⚠️ Elemento plan-type-switch no encontrado');
      return;
    }
    
    // Verificar que createSwitch esté disponible
    if (typeof createSwitch !== 'function') {
      console.error('❌ createSwitch no está definido');
      return;
    }
    
    try {
      const planSwitch = createSwitch({
        switchOptions: {
          left: { text: 'Plan HOGAR', value: 1 },
          right: { text: 'Plan PYME', value: 2 }
        },
        switchValue: 1, // default hogar
        onSwitchChange: (value) => {
          if (window.PLANS_CONFIG) {
            window.PLANS_CONFIG.idTipoPlan = value;
          }
          
          if (window.PlansRenderer && typeof window.PlansRenderer.render === 'function') {
            window.PlansRenderer.render('plans-container');
          } else {
            console.warn('⚠️ PlansRenderer no disponible');
          }
        }
      });
      
      switchElement.appendChild(planSwitch.getElement());
      console.log('✅ Switch de planes inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando switch de planes:', error);
    }
  });
})();
