/**
 * Manejo de eventos para las tarjetas de conexión
 * Gestiona los clicks en botones de Pagar, Cuenta Corriente, etc.
 */
(function() {
    'use strict';

    console.log('📋 Inicializando eventos de tarjetas de conexión...');

    // Flag para evitar inicialización duplicada
    let listenersAttached = false;

    /**
     * Configurar event listeners en las tarjetas
     */
    function setupEventListeners() {
        // Evitar agregar listeners duplicados
        if (listenersAttached) {
            console.log('ℹ️ Event listeners ya configurados, omitiendo...');
            return;
        }

        // Usar delegación de eventos en el contenedor de tarjetas
        const container = document.getElementById('conexiones-lista') || 
                         document.getElementById('main-content') || 
                         document.body;
        
        console.log('🎯 Contenedor para delegación:', container.id || 'body');

        // Botón Pagar
        container.addEventListener('click', async (e) => {
            const btnPagar = e.target.closest('.btn-pagar');
            if (!btnPagar) return;

            console.log('👆 Click detectado en botón Pagar');

            e.preventDefault();
            e.stopPropagation();

            const personaId = btnPagar.dataset.personaId;
            const contratoId = btnPagar.dataset.contratoId;
            const conexionId = btnPagar.dataset.conexionId;

            console.log('💳 Botón Pagar clickeado:', { personaId, contratoId, conexionId });

            // Llamar a simularPago (la función se encargará de obtener IDs faltantes)
            try {
                await simularPago(personaId, contratoId, conexionId);
            } catch (error) {
                console.error('❌ Error en el flujo de pago:', error);
                hideLoading();
                showError('Ocurrió un error inesperado. Por favor, intente nuevamente.');
            }
        }, { once: false }); // Asegurarse de que no sea once
        
        listenersAttached = true;
        console.log('✅ Event listeners configurados');
    }

    /**
     * Simular pago de contrato
     */
    async function simularPago(personaId, contratoId, conexionId) {
        try {
            console.log('🔍 Iniciando simularPago con:', { personaId, contratoId, conexionId });
            
            // Validar que tengamos los IDs necesarios
            if (!personaId) {
                showError('No se pudo obtener el ID de persona. Por favor, recargue la página.');
                return;
            }
            
            if (!contratoId) {
                showError('No se pudo obtener el ID de contrato. Esta conexión podría no tener un contrato asociado.');
                return;
            }
            
            if (!conexionId) {
                showError('No se pudo obtener el ID de conexión.');
                return;
            }
            // Mostrar confirmación
            if (!await showConfirmModal('¿Desea proceder con el pago?')) {
                return;
            }

            // Mostrar loading
            showLoading('Procesando pago...');

            // Construir URL del endpoint
            const pagoUrl = window.AppConfig.getUrl('simularPago')
                .replace(':id_persona', personaId)
                .replace(':id_contrato', contratoId);

            console.log('🔗 URL de pago:', pagoUrl);

            // Realizar petición
            const response = await fetch(pagoUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            hideLoading();

            const result = await response.json();

            if (!response.ok) {
                // Manejar específicamente el error 409 (Conflict - Ya pagado)
                if (response.status === 409) {
                    console.log('ℹ️ Contrato ya fue pagado anteriormente');
                    
                    // Capturar id_contrato_firma si viene en la respuesta
                    const idContratoFirma = result.data?.id_contrato_firma;
                    console.log('📋 ID Contrato Firma (409):', idContratoFirma);
                    
                    // Ocultar botón pagar
                    const btnPagar = document.querySelector(`.btn-pagar[data-conexion-id="${conexionId}"]`);
                    if (btnPagar) {
                        btnPagar.style.display = 'none';
                    }
                    
                    // Habilitar botón Ver Contrato
                    habilitarBotonVerContrato(conexionId, idContratoFirma);
                    
                    // Mostrar mensaje amigable
                    showSuccess('Este contrato ya fue pagado anteriormente. Puede proceder a verlo y firmarlo.');
                    
                    return;
                }
                
                // Otros errores
                const errorData = result;
                throw new Error(errorData.message || 'Error al procesar el pago');
            }
            console.log('✅ Respuesta de pago:', result);

            // Capturar id_contrato_firma de la respuesta
            const idContratoFirma = result.data?.id_contrato_firma;
            console.log('📋 ID Contrato Firma capturado:', idContratoFirma);

            // Ocultar el botón de pagar de esta tarjeta específica
            const btnPagar = document.querySelector(`.btn-pagar[data-conexion-id="${conexionId}"]`);
            if (btnPagar) {
                btnPagar.style.display = 'none';
                console.log('🚫 Botón Pagar oculto para conexión', conexionId);
            }

            // Habilitar inmediatamente el botón "Ver Contrato" con el id_contrato_firma
            habilitarBotonVerContrato(conexionId, idContratoFirma);

            // Mostrar éxito
            showSuccess('Pago procesado exitosamente. Ahora puede ver y firmar el contrato.');

            // NO recargar conexiones para preservar el estado del botón
            console.log('ℹ️ Las conexiones se actualizarán en la próxima carga de página');

        } catch (error) {
            hideLoading();
            console.error('❌ Error en simulación de pago:', error);
            showError(error.message || 'No se pudo procesar el pago. Por favor, intente nuevamente.');
        }
    }

    /**
     * Habilitar el botón "Ver Contrato" para una conexión específica
     * @param {number|string} conexionId - ID de la conexión
     * @param {number|string} idContratoFirma - ID del contrato firma (opcional)
     */
    function habilitarBotonVerContrato(conexionId, idContratoFirma = null) {
        console.log('🔓 Habilitando botón Ver Contrato para conexión:', conexionId, 'con id_contrato_firma:', idContratoFirma);
        
        // Buscar el botón, puede estar habilitado o deshabilitado
        let btnVerContrato = document.querySelector(`.btn-ver-contrato[data-conexion-id="${conexionId}"]`);
        
        // Si no se encuentra con la clase específica, buscar cualquier botón con el data attribute en la tarjeta
        if (!btnVerContrato) {
            const allButtons = document.querySelectorAll(`[data-conexion-id="${conexionId}"]`);
            console.log(`🔍 Buscando botón Ver Contrato entre ${allButtons.length} elementos con conexionId ${conexionId}`);
            
            for (const btn of allButtons) {
                if (btn.textContent.includes('Ver Contrato') || btn.classList.contains('btn-ver-contrato')) {
                    btnVerContrato = btn;
                    console.log('✅ Botón Ver Contrato encontrado');
                    break;
                }
            }
        }
        
        if (!btnVerContrato) {
            console.warn('⚠️ No se encontró el botón Ver Contrato para conexión', conexionId);
            console.log('Intentando crear el botón...');
            
            // Intentar encontrar el contenedor de botones y agregar el botón
            const btnPagar = document.querySelector(`.btn-pagar[data-conexion-id="${conexionId}"]`);
            if (btnPagar && btnPagar.parentElement) {
                const container = btnPagar.parentElement;
                const newBtn = document.createElement('button');
                newBtn.className = 'btn-ver-contrato px-4 py-2 rounded-lg bg-white dark:bg-dark-bg-card border-2 border-gray-300 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-primary text-sm font-semibold hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg transform hover:scale-105 transition-all cursor-pointer whitespace-nowrap';
                newBtn.dataset.conexionId = conexionId;
                newBtn.textContent = 'Ver Contrato';
                newBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const urlParams = idContratoFirma 
                        ? `/ver-contrato?conexionId=${conexionId}&idContratoFirma=${idContratoFirma}`
                        : `/ver-contrato?conexionId=${conexionId}`;
                    if (window.loadContent) {
                        window.loadContent(urlParams);
                    } else {
                        window.location.href = urlParams;
                    }
                };
                container.appendChild(newBtn);
                console.log('✅ Botón Ver Contrato creado dinámicamente');
                return;
            }
            return;
        }
        
        // Si el botón está deshabilitado, habilitarlo
        btnVerContrato.disabled = false;
        btnVerContrato.removeAttribute('disabled');
        
        // Remover clases de deshabilitado
        btnVerContrato.classList.remove(
            'opacity-50', 
            'cursor-not-allowed', 
            'bg-gray-200', 
            'dark:bg-gray-700', 
            'text-gray-400', 
            'dark:text-gray-500'
        );
        
        // Asegurar que tiene las clases correctas
        if (!btnVerContrato.classList.contains('bg-white')) {
            btnVerContrato.classList.add('bg-white', 'dark:bg-dark-bg-card');
        }
        
        // Agregar clases de interactividad
        btnVerContrato.classList.add(
            'hover:border-gray-400', 
            'dark:hover:border-gray-600', 
            'hover:shadow-lg', 
            'transform', 
            'hover:scale-105', 
            'transition-all', 
            'cursor-pointer'
        );
        
        // Asegurar colores de texto correctos
        btnVerContrato.classList.add('text-gray-700', 'dark:text-dark-text-primary');
        
        btnVerContrato.title = 'Ver Contrato';
        
        // Agregar o reemplazar el evento onclick
        btnVerContrato.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const urlParams = idContratoFirma 
                ? `/ver-contrato?conexionId=${conexionId}&idContratoFirma=${idContratoFirma}`
                : `/ver-contrato?conexionId=${conexionId}`;
            if (window.loadContent) {
                window.loadContent(urlParams);
            } else {
                window.location.href = urlParams;
            }
        };
        
        console.log('✅ Botón Ver Contrato habilitado para conexión', conexionId);
    }

    /**
     * Mostrar modal de confirmación
     */
    function showConfirmModal(message) {
        console.log('💬 Mostrando modal de confirmación');
        
        return new Promise((resolve) => {
            // Verificar si FloatingModal está disponible
            if (!window.FloatingModal) {
                console.warn('⚠️ FloatingModal no disponible, usando confirm nativo');
                const resultado = confirm(message);
                console.log('✅ Confirmación (nativo):', resultado);
                resolve(resultado);
                return;
            }

            console.log('🌐 Creando FloatingModal');
            
            try {
                const modal = new window.FloatingModal({
                    title: 'Confirmar Acción',
                    html: `<p class="text-gray-700 dark:text-dark-text-primary">${message}</p>`,
                    buttons: [
                        {
                            label: 'Cancelar',
                            onClick: (ev, modalInstance) => {
                                console.log('❌ Pago cancelado por el usuario');
                                modalInstance.close();
                                resolve(false);
                            }
                        },
                        {
                            label: 'Confirmar',
                            primary: true,
                            onClick: (ev, modalInstance) => {
                                console.log('✅ Pago confirmado por el usuario');
                                modalInstance.close();
                                resolve(true);
                            }
                        }
                    ]
                });

                modal.show();
                console.log('👁️ Modal mostrado');
            } catch (error) {
                console.error('❌ Error al crear modal:', error);
                // Fallback a confirm nativo si hay error
                const resultado = confirm(message);
                console.log('✅ Confirmación (fallback):', resultado);
                resolve(resultado);
            }
        });
    }

    /**
     * Mostrar loading overlay
     */
    function showLoading(message = 'Procesando...') {
        // Crear overlay si no existe
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 z-[9998] backdrop-blur-sm flex items-center justify-center';
            overlay.innerHTML = `
                <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-8 shadow-2xl text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-principal-500 dark:border-dark-principal-600 mx-auto mb-4"></div>
                    <p class="text-gray-700 dark:text-dark-text-primary font-medium">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    /**
     * Ocultar loading overlay
     */
    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Mostrar error
     */
    function showError(message) {
        if (window.ErrorModal) {
            window.ErrorModal.show(message);
        } else {
            alert(message);
        }
    }

    /**
     * Mostrar éxito
     */
    function showSuccess(message) {
        if (window.SuccessModal) {
            window.SuccessModal.show(message);
        } else if (window.ErrorModal) {
            window.ErrorModal.show(message, 'success');
        } else {
            alert(message);
        }
    }

    /**
     * Mostrar información
     */
    function showInfo(message) {
        if (window.ErrorModal) {
            window.ErrorModal.show(message, 'info');
        } else {
            alert(message);
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }

    console.log('✅ Módulo tarjeta-conexion-eventos.js cargado');

})();
