/**
 * Componente reutilizable para tarjetas de conexión
 */
(function() {
    function createConexionCard(conexion) {
        // Colores usando el sistema de diseño de input.css
        const estadoConfig = {
            'En verificacion': {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300',
                dot: 'bg-yellow-500 dark:bg-yellow-400',
                stateClass: 'state-en-verificacion',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>' // info
            },
            'En verificación': {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300',
                dot: 'bg-yellow-500 dark:bg-yellow-400',
                stateClass: 'state-en-verificacion',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>' // info
            },
            'Pendiente de Verificacion': {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300',
                dot: 'bg-yellow-500 dark:bg-yellow-400',
                stateClass: 'state-pendiente-verificacion',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>' // info
            },
            'Pendiente de Verificación': {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300',
                dot: 'bg-yellow-500 dark:bg-yellow-400',
                stateClass: 'state-pendiente-verificacion',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>' // info
            },
            'Factible': {
                bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-300',
                dot: 'bg-blue-500 dark:bg-blue-400',
                stateClass: 'state-factible',
                innerIcon: '<path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>' // checkmark
            },
            'Activa': {
                bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300',
                dot: 'bg-green-500 dark:bg-green-400',
                stateClass: 'state-activa',
                innerIcon: '<path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>' // checkmark
            },
            'Suspendida': {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40 text-yellow-800 dark:text-yellow-300',
                dot: 'bg-yellow-500 dark:bg-yellow-400',
                stateClass: 'state-suspendida',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>' // alert
            },
            'De baja': {
                bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400',
                dot: 'bg-red-500 dark:bg-red-400',
                stateClass: 'state-de-baja',
                innerIcon: '<path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>' // X
            },
            'Para instalar': {
                bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30 text-purple-800 dark:text-purple-300',
                dot: 'bg-purple-500 dark:bg-purple-400',
                stateClass: 'state-para-instalar',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/>' // tools
            },
            'Por configurar': {
                bg: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/30 text-cyan-800 dark:text-cyan-300',
                dot: 'bg-cyan-500 dark:bg-cyan-400',
                stateClass: 'state-por-configurar',
                innerIcon: '<path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' // settings
            },
            'No factible': {
                bg: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800/30 text-red-900 dark:text-red-400',
                dot: 'bg-red-700 dark:bg-red-500',
                stateClass: 'state-no-factible',
                innerIcon: '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>' // X circle
            }
        };

        const config = estadoConfig[conexion.estado] || {
            bg: 'bg-gray-50 border-gray-200 text-gray-700',
            dot: 'bg-gray-500',
            stateClass: 'state-inactivo',
            innerIcon: '<circle fill="currentColor" cx="12" cy="12" r="3"/>' // dot
        };

        // Iconos SVG para botones de acción
        const iconoCambiarPlan = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
        `;

        const iconoBoletoPago = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        `;

        const iconoCuentaCorriente = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
        `;

        // Generar SVG de WiFi con ícono de estado
        const wifiSvg = `
              <svg
              width="48"
              height="48"
              class="wifi-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
        `;

        return `
            <div class="dashboard-card hover-scale fade-in visible p-4 rounded-xl shadow-2xl shadow-black/30 dark:shadow-black/60">
                <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    
                    <!-- Información principal -->
                    <div class="flex-1 min-w-0 flex-col items-justify">
                        <!-- Grid 2x2 (1 columna en móvil, 2 en desktop) -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Fila 1, Col 1: Conexión -->
                            <div class="flex items-start gap-4">
                                <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 dark:bg-dark-bg-tertiary rounded-xl flex items-center justify-center ${config.stateClass}">
                                    ${wifiSvg}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Nro de Conexión: ${conexion.nroConexion}</h3>
                                    <div class="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500 dark:text-dark-text-secondary">
                                        <span>${conexion.tipoConexion}</span>
                                        <span class="text-gray-400 dark:text-dark-text-tertiary">•</span>
                                        <span>${conexion.plan}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Fila 1, Col 2: Tipo de Plan -->
                            <div class="info-item flex flex-col items-center justify-center">
                                <div class="label text-sm sm:text-base">Tipo de Plan</div>
                                <div class="value text-base sm:text-lg">${conexion.tipoPlan}</div>
                            </div>

                            <!-- Fila 2, Col 1: Dirección -->
                            <div class="info-item">
                                <div class="label">Dirección</div>
                                <div class="value line-clamp-2">${conexion.direccion}</div>
                            </div>

                            <!-- Fila 2, Col 2: Estado -->
                            <div class="info-item flex flex-col items-center justify-center">
                                <div class="label text-sm sm:text-base">Estado</div>

                                <div class="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border 
                                            ${config.bg} text-xs sm:text-sm font-bold whitespace-nowrap shadow-sm">
                                    <div class="w-2 h-2 ${config.dot} rounded-full animate-pulse"></div>
                                    <span>${conexion.estado}</span>
                                </div>
                            </div>
                        </div>
                    </div>


                    <!-- Columna derecha: Acciones -->
                    <div class="flex flex-col items-stretch gap-3">
                        <!-- Botones grandes superiores -->
                        <div class="flex flex-col gap-2">
                            ${conexion.estado === 'Factible' && !conexion.idContratoFirma ? `
                                <!-- Botón Pagar habilitado solo en estado Factible y sin id_contrato_firma -->
                                <button
                                    class="btn-pagar px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 hover:shadow-lg transform hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                                    data-conexion-id="${conexion.id}"
                                    data-persona-id="${conexion.personaId || ''}"
                                    data-contrato-id="${conexion.contratoId || ''}"
                                    title="Pagar"
                                >
                                    Pagar
                                </button>
                            ` : ''}
                            
                            ${conexion.idContratoFirma ? `
                                <!-- Ver Contrato habilitado solo si existe id_contrato_firma -->
                                <button
                                    class="btn-ver-contrato px-4 py-2 rounded-lg bg-white dark:bg-dark-bg-card border-2 border-gray-300 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-primary text-sm font-semibold hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg transform hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                                    data-conexion-id="${conexion.id}"
                                    data-contrato-firma-id="${conexion.idContratoFirma}"
                                    title="Ver Contrato"
                                    onclick="(function(btn) { const idContratoFirma = btn.dataset.contratoFirmaId; const url = '/ver-contrato?conexionId=${conexion.id}&idContratoFirma=' + idContratoFirma; if (window.loadContent) { window.loadContent(url); } else { window.location.href = url; } })(this)"
                                >
                                    Ver Contrato
                                </button>
                            ` : conexion.estado === 'Factible' ? '' : `
                                <!-- Ver Contrato deshabilitado para estados que no son Factible y no tienen id_contrato_firma -->
                                <button
                                    class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-sm font-semibold cursor-not-allowed whitespace-nowrap opacity-50"
                                    disabled
                                    title="Contrato no disponible"
                                >
                                    Ver Contrato
                                </button>
                            `}
                        </div>

                        <!-- Botones de iconos -->
                        <div class="flex flex-row justify-center items-center gap-3">
                        ${conexion.estado === 'Activa' ? `
                            <!-- Iconos activos solo para conexiones Activas -->
                            <div
                                class="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary text-gray-400 dark:text-dark-text-tertiary cursor-not-allowed transition-all"
                                title="Cambiar Plan - Función no implementada"
                            >
                                ${iconoCambiarPlan}
                                <span class="text-xs font-medium">Cambiar Plan</span>
                            </div>
                            
                            <button
                                class="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 hover:shadow-lg transform hover:scale-110 transition-all cursor-pointer"
                                data-conexion-id="${conexion.id}"
                                title="Boleto de Pago"
                            >
                                ${iconoBoletoPago}
                                <span class="text-xs font-medium">Boleto</span>
                            </button>

                            <button
                                class="btn-cuenta-corriente flex flex-col items-center gap-1 p-3 rounded-lg bg-white dark:bg-dark-bg-card border-2 border-gray-300 dark:border-dark-border-primary text-gray-700 dark:text-dark-text-primary hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg transform hover:scale-110 transition-all cursor-pointer"
                                data-conexion-id="${conexion.id}"
                                title="Cuenta Corriente"
                            >
                                ${iconoCuentaCorriente}
                                <span class="text-xs font-medium">Cuenta</span>
                            </button>
                        ` : `
                            <!-- Todos los iconos desactivados si no está Activa -->
                            <div
                                class="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary text-gray-300 dark:text-dark-text-tertiary cursor-not-allowed transition-all"
                                title="Cambiar Plan - Solo disponible para conexiones activas"
                            >
                                ${iconoCambiarPlan}
                                <span class="text-xs font-medium">Cambiar Plan</span>
                            </div>
                            
                            <div
                                class="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary text-gray-300 dark:text-dark-text-tertiary cursor-not-allowed transition-all"
                                title="Boleto de Pago - Solo disponible para conexiones activas"
                            >
                                ${iconoBoletoPago}
                                <span class="text-xs font-medium">Boleto</span>
                            </div>

                            <div
                                class="flex flex-col items-center gap-1 p-3 rounded-lg bg-gray-100 dark:bg-dark-bg-tertiary text-gray-300 dark:text-dark-text-tertiary cursor-not-allowed transition-all"
                                title="Cuenta Corriente - Solo disponible para conexiones activas"
                            >
                                ${iconoCuentaCorriente}
                                <span class="text-xs font-medium">Cuenta</span>
                            </div>
                        `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Exponer globalmente
    window.ConexionCard = {
        create: createConexionCard
    };

    console.log('✅ ConexionCard cargado correctamente');
})();