/**
 * Componente reutilizable para tarjetas de solicitud
 */

(function() {
    /**
     * Crea el HTML de una tarjeta de solicitud mejorada
     */
    function createSolicitudCard(solicitud) {
        const estadoClass = {
            'pendiente': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
            'factible': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800',
            'no_factible': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
        }[solicitud.estado] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';

        const estadoIcon = {
            'pendiente': 'fa-clock',
            'factible': 'fa-check-circle',
            'no_factible': 'fa-times-circle'
        }[solicitud.estado] || 'fa-question-circle';

        // Usar el estado original del backend si existe, sino usar el normalizado
        const estadoTexto = solicitud.estado_original || {
            'pendiente': 'Pendiente Verificación',
            'factible': 'Factible',
            'no_factible': 'No Factible'
        }[solicitud.estado] || 'Desconocido';

        const tipoIcon = solicitud.cliente.tipo === 'empresa' ? 'fa-building' : 'fa-user';
        const tipoTexto = solicitud.cliente.tipo === 'empresa' ? 'Empresa' : 'Particular';

        // Formatear dirección completa
        const dir = solicitud.direccion;
        let direccionCompleta = `${dir.calle} ${dir.numero}`;
        if (dir.piso) direccionCompleta += `, Piso ${dir.piso}`;
        if (dir.depto) direccionCompleta += ` ${dir.depto}`;
        direccionCompleta += `, ${dir.distrito}, ${dir.municipio}, ${dir.provincia}`;

        // Información del plan
        const planInfo = solicitud.plan
            ? `${solicitud.plan.title}`
            : 'Sin plan asignado';

        return `
            <div class="dashboard-card hover-scale fade-in visible">
                <div class="flex flex-col lg:flex-row justify-between gap-4">
                    <!-- Información del cliente -->
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-principal-100 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-user text-principal-600 dark:text-dark-principal-600 text-xl"></i>
                            </div>
                            <div class="min-w-0 flex-grow">
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="font-bold text-lg text-gray-800 dark:text-dark-text-primary truncate">${solicitud.cliente.nombre}</h3>
                                    ${solicitud.origen === 'atencion' ? `
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                                            <i class="fas fa-headset mr-1"></i>Derivada
                                        </span>
                                    ` : ''}
                                </div>
                                <div class="flex items-center flex-wrap gap-2 text-sm text-gray-500 dark:text-dark-text-secondary">
                                    <span class="flex items-center">
                                        <i class="fas fa-user mr-1"></i>Cliente
                                    </span>
                                    <span>•</span>
                                    <span>${formatFecha(solicitud.fecha_solicitud)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="info-item">
                                    <div class="label text-gray-500 dark:text-dark-text-secondary">Dirección</div>
                                    <div class="value break-words text-gray-800 dark:text-dark-text-primary">${direccionCompleta}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label text-gray-500 dark:text-dark-text-secondary">Latitud</div>
                                    <div class="value text-gray-800 dark:text-dark-text-primary">${solicitud.ubicacion.lat.toFixed(4)}</div>
                                </div>
                            ${solicitud.ubicacion ? `
                                <div class="info-item">
                                    <div class="label text-gray-500 dark:text-dark-text-secondary">Plan solicitado</div>
                                    <div class="value break-words text-gray-800 dark:text-dark-text-primary">${planInfo}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label text-gray-500 dark:text-dark-text-secondary">Longitud</div>
                                    <div class="value text-gray-800 dark:text-dark-text-primary">${solicitud.ubicacion.lng.toFixed(4)}</div>
                                </div>
                            ` : ''}
                        </div>

                        ${solicitud.observaciones ? `
                            <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400 dark:border-blue-500">
                                <div class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                                    <i class="fas fa-comment-alt mr-1"></i>Observaciones
                                </div>
                                <p class="text-blue-700 dark:text-blue-200 break-words">${solicitud.observaciones}</p>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Estado y acciones -->
                    <div class="flex flex-col items-end justify-between gap-3 lg:min-w-[200px]">
                        <span class="px-4 py-2 rounded-full text-sm font-semibold ${estadoClass} text-center whitespace-nowrap shadow-sm">
                            <i class="fas ${estadoIcon} mr-1"></i>${estadoTexto}
                        </span>

                        ${solicitud.estado === 'pendiente' ? `
                            <button
                                id="btn-procesar-${solicitud.id}"
                                class="w-full px-4 py-3 bg-principal-500 dark:bg-dark-principal-600 text-white rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition-all transform hover:scale-105 font-medium shadow-lg text-sm"
                            >
                                <i class="fas fa-tasks mr-2"></i>Procesar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Formatea una fecha
     */
    function formatFecha(fecha) {
        const date = new Date(fecha);
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);

        if (date.toDateString() === hoy.toDateString()) {
            return `Hoy ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === ayer.toDateString()) {
            return `Ayer ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    // Exponer globalmente
    window.SolicitudCard = {
        create: createSolicitudCard
    };
})();