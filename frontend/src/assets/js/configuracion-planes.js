/**
 * Configuración para PlansRenderer en la página principal
 */
(function() {
  'use strict';
  
  // Configuración para el renderizador de planes (página pública)
  window.PLANS_CONFIG = {
    containerId: 'plans-container',
    endpoint: null, // Dejar null para usar `AppConfig.getUrl('planes')` (no hardcodear aquí)
    idTipoPlan: 1, // Filtrar solo planes tipo "Hogar"
    showButton: true,
    buttonText: 'Contratar',
    buttonLink: '/registro',

    // Colores específicos por ID de plan (usa colores de tarjeta de input.css)
    // Ajusta estos IDs según los planes reales que devuelva tu API
    planColors: {
      1: 'amarillo',
      2: 'verde',
      3: 'azul',
      4: 'amarillo',
      5: 'verde',
      6: 'azul'
    },

    // Estilos personalizados
    styles: {
      card: 'plan-card flex flex-col bg-white text-center overflow-hidden rounded-2xl',
      cardInner: 'p-6 lg:p-8 flex flex-col h-full bg-white shadow-md hover:shadow-xl transition-shadow duration-300',
      title: 'font-black text-3xl lg:text-4xl uppercase tracking-widest text-gray-900 mb-2 text-center leading-none [text-shadow:_0_2px_6px_rgba(0,0,0,0.15)] drop-shadow-md w-full max-w-xs mx-auto',
      line: 'h-1 w-full max-w-xs mx-auto mb-5 rounded-full',
      speed: 'text-5xl lg:text-6xl font-black text-gray-900 mb-2 text-center tracking-tight w-full max-w-xs mx-auto',
      speedSpacer: 'h-4',
      price: 'w-full max-w-xs mx-auto text-white text-2xl font-black py-3 px-6 rounded-xl mb-4 text-center shadow-sm',
      priceLabel: 'text-gray-500 text-base font-bold uppercase tracking-widest text-center mb-1 w-full max-w-xs mx-auto',
      description: 'text-gray-500 text-base font-medium text-center mb-6 w-full max-w-xs mx-auto',
      button: 'block w-full max-w-xs mx-auto p-4 mt-auto text-white font-bold text-lg text-center rounded-xl transition-all duration-300 ease-out hover:shadow-lg transform hover:scale-105 hover:bg-opacity-90'
    },

    // Fallbacks si la API falla (opcional, para demo/desarrollo)
    fallbackPlans: null // Dejar null para no usar mock; el componente ya tiene lógica de error
  };
})();
