/**
 * Inicializador de Scripts para la Cola de Solicitudes
 * Carga los scripts necesarios en el orden correcto
 */
(function() {
    'use strict';

    // Load scripts dynamically to ensure they are executed
    const scriptCard = document.createElement('script');
    scriptCard.src = '/js/dashboard/verificador/tarjeta.js';
    document.head.appendChild(scriptCard);
    
    scriptCard.onload = () => {
        const script1 = document.createElement('script');
        script1.src = '/js/dashboard/verificador/solicitudes.js';
        document.head.appendChild(script1);
        
        script1.onload = () => {
            // Cargar boton-switch.js ANTES que procesador-modal.js
            const scriptButton = document.createElement('script');
            scriptButton.src = '/js/ui/boton-switch.js';
            document.head.appendChild(scriptButton);
            
            scriptButton.onload = () => {
                // Cargar modal-exito.js antes que procesador-modal.js
                const scriptSuccess = document.createElement('script');
                scriptSuccess.src = '/js/ui/modal-exito.js';
                document.head.appendChild(scriptSuccess);
                
                scriptSuccess.onload = () => {
                    const script2 = document.createElement('script');
                    script2.src = '/js/dashboard/verificador/procesador-modal.js';
                    document.head.appendChild(script2);
                    
                    script2.onload = () => {
                        const script3 = document.createElement('script');
                        script3.src = '/js/utils/selector-personalizado.js';
                        document.head.appendChild(script3);
                        
                        script3.onload = () => {
                            if (window.RequestsManager) {
                                window.RequestsManager.init();
                            }
                        };
                    };
                };
            };
        };
    };
    
    console.log('✅ Inicializador de solicitudes cargado');
})();
