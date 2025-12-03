/**
 * Gestión del Historial de Solicitudes
 * Para verificadores - visualizar todas las solicitudes procesadas
 */

const HistorialManager = (() => {
    // Estado de la aplicación
    let solicitudes = [];
    let filteredSolicitudes = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // Elementos del DOM
    const elementos = {
        loading: null,
        vacio: null,
        lista: null,
        pagination: null
    };

    // API helper
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl || function(endpoint) {
        if (!endpoint) return API_BASE_URL;
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + endpoint;
        if (window.AppConfig?.endpoints && window.AppConfig.endpoints[endpoint]) {
            return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + window.AppConfig.endpoints[endpoint];
        }
        return endpoint;
    };

    // Estadísticas
    const estadisticas = {
        factibles: 0,
        noFactibles: 0,
        total: 0
    };

    /**
     * Carga scripts necesarios para UI y validación
     */
    async function cargarScriptsNecesarios() {
        const scripts = [
            { src: '/js/utils/sanitizer.js', global: 'Sanitizer' },
            { src: '/js/utils/validators.js', global: 'Validators' },
            { src: '/js/utils/errorHandler.js', global: 'ErrorHandler' },
            { src: '/js/ui/error-modal.js', global: 'ErrorModal' },
            { src: '/js/ui/success-modal.js', global: 'SuccessModal' },
            { src: '/js/ui/spinner-carga.js', global: 'LoadingSpinner' }
        ];

        const promises = scripts.map(({ src, global }) => {
            if (window[global]) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        });

        try {
            await Promise.all(promises);
            console.log('✅ Scripts UI cargados correctamente');
        } catch (error) {
            console.warn('⚠️ Error cargando scripts UI:', error);
        }
    }

    /**
     * Inicializa el módulo
     */
    async function init() {
        console.log('[HistorialManager] Inicializando...');
        
        // Cargar scripts UI
        await cargarScriptsNecesarios();
        
        // Obtener elementos del DOM
        elementos.loading = document.getElementById('historial-loading');
        elementos.vacio = document.getElementById('historial-vacio');
        elementos.lista = document.getElementById('historial-lista');
        elementos.pagination = document.getElementById('historial-pagination');

        if (!elementos.lista) {
            console.error('[HistorialManager] Elemento lista no encontrado');
            return;
        }

        // Inicializar eventos
        initEventListeners();

        // Cargar historial
        loadHistorial();
    }

    /**
     * Inicializa los event listeners
     */
    function initEventListeners() {
        // Filtros
        const filterEstado = document.getElementById('filter-estado-historial');
        const filterTipo = document.getElementById('filter-tipo-historial');
        const filterRango = document.getElementById('filter-rango-historial');
        const filterBuscar = document.getElementById('filter-buscar-historial');
        const btnLimpiar = document.getElementById('btn-limpiar-filtros-historial');
        const btnExportar = document.getElementById('btn-exportar-historial');

        if (filterEstado) filterEstado.addEventListener('change', applyFilters);
        if (filterTipo) filterTipo.addEventListener('change', applyFilters);
        if (filterRango) filterRango.addEventListener('change', applyFilters);
        if (filterBuscar) filterBuscar.addEventListener('input', applyFilters);
        if (btnLimpiar) btnLimpiar.addEventListener('click', clearFilters);
        if (btnExportar) btnExportar.addEventListener('click', exportarExcel);

        // Paginación
        const btnPrev = document.getElementById('btn-prev-page-historial');
        const btnNext = document.getElementById('btn-next-page-historial');
        
        if (btnPrev) btnPrev.addEventListener('click', () => changePage(-1));
        if (btnNext) btnNext.addEventListener('click', () => changePage(1));
    }

    /**
     * Carga el historial desde el backend o mocks
     */
    async function loadHistorial() {
        try {
            showLoading(true);

            // Verificar si estamos en modo mock/desarrollo (por defecto false)
            const useMock = window.ENV?.isDevelopment === true;

            console.log('[HistorialManager] Modo Mock:', useMock);

            if (useMock) {
                // Simular latencia de red
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Generar datos mock dinámicos
                solicitudes = generarHistorialMock();
                console.log('[HistorialManager] 🎭 Datos mock generados:', solicitudes.length);
            } else {
                // Llamar al backend real
                // Preferir endpoint explícito 'historialSolicitudes' si está definido en config
                const endpointKey = 'historialSolicitudes';
                let url = null;
                if (window.AppConfig?.endpoints && window.AppConfig.endpoints[endpointKey]) {
                    url = getUrl(endpointKey);
                } else {
                    // Fallback: usar revisacionSolicitudesPendientes y filtrar localmente (si el backend retorna procesadas)
                    url = getUrl('revisacionSolicitudesPendientes');
                }

                const response = await fetch(url + window.location.search, {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    solicitudes = data.data || [];
                    // Si estamos usando revisacionSolicitudesPendientes como fallback, quedarnos sólo con procesadas
                    if (!window.AppConfig?.endpoints?.[endpointKey]) {
                        solicitudes = solicitudes.filter(s => s.estado && s.estado !== 'pendiente');
                    }
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            }

            actualizarEstadisticas();
            applyFilters();
            showLoading(false);

        } catch (error) {
            console.error('[HistorialManager] Error al cargar historial:', error);
            // Fallback a datos mock en caso de error
            solicitudes = generarHistorialMock();
            actualizarEstadisticas();
            applyFilters();
            showLoading(false);
        }
    }

    /**
     * Genera datos mock de historial
     */
    function generarHistorialMock() {
        return [
                {
                    id: 3,
                    cliente: {
                        nombre: 'María González',
                        tipo: 'particular',
                        email: 'maria.g@email.com',
                        telefono: '2634555123'
                    },
                    direccion: {
                        calle: 'Los Álamos',
                        numero: '89',
                        codigo_postal: '5570',
                        provincia: 'Mendoza',
                        municipio: 'Rivadavia',
                        distrito: 'Ciudad'
                    },
                    plan: {
                        title: 'Hogar 100 Mbps',
                        price: '$1.200'
                    },
                    estado: 'factible',
                    fecha_solicitud: '2025-11-08T09:15:00',
                    fecha_procesado: '2025-11-08T14:30:00',
                    vlan: 'VLAN150',
                    nap: 'NAP-003-B',
                    observaciones: 'Cliente cerca del nodo principal',
                    procesado_por: 'Juan Verificador'
                },
                {
                    id: 4,
                    cliente: {
                        nombre: 'Carlos Rodríguez',
                        tipo: 'particular',
                        email: 'carlos.r@email.com',
                        telefono: '2634888999'
                    },
                    direccion: {
                        calle: 'San Martín',
                        numero: '234',
                        codigo_postal: '5570',
                        provincia: 'Mendoza',
                        municipio: 'Rivadavia',
                        distrito: 'Centro'
                    },
                    plan: {
                        title: 'Hogar 50 Mbps',
                        price: '$800'
                    },
                    estado: 'no_factible',
                    fecha_solicitud: '2025-11-07T16:20:00',
                    fecha_procesado: '2025-11-07T18:45:00',
                    vlan: null,
                    nap: null,
                    observaciones: 'Zona sin cobertura de fibra óptica. Se requiere inversión en infraestructura.',
                    procesado_por: 'Ana Verificador'
                },
                {
                    id: 5,
                    cliente: {
                        nombre: 'Empresa Logística SRL',
                        tipo: 'empresa',
                        email: 'contacto@logistica.com',
                        telefono: '2634777888'
                    },
                    direccion: {
                        calle: 'Ruta Provincial 50',
                        numero: 'KM 5',
                        codigo_postal: '5570',
                        provincia: 'Mendoza',
                        municipio: 'Rivadavia',
                        distrito: 'Parque Industrial'
                    },
                    plan: {
                        title: 'Empresarial 500 Mbps',
                        price: '$12.000'
                    },
                    estado: 'factible',
                    fecha_solicitud: '2025-11-06T10:00:00',
                    fecha_procesado: '2025-11-06T16:15:00',
                    vlan: 'VLAN200',
                    nap: 'NAP-010-A',
                    observaciones: 'Instalación empresarial prioritaria. Cliente requiere IP fija.',
                    procesado_por: 'Pedro Técnico'
                }
            ];
    }

    /**
     * Actualiza las estadísticas
     */
    function actualizarEstadisticas() {
        estadisticas.factibles = solicitudes.filter(s => s.estado === 'factible').length;
        estadisticas.noFactibles = solicitudes.filter(s => s.estado === 'no_factible').length;
        estadisticas.total = solicitudes.length;

        // Actualizar UI
        const elFactibles = document.getElementById('total-factibles-historial');
        const elNoFactibles = document.getElementById('total-no-factibles-historial');
        const elTotal = document.getElementById('total-procesadas-historial');

        if (elFactibles) elFactibles.textContent = estadisticas.factibles;
        if (elNoFactibles) elNoFactibles.textContent = estadisticas.noFactibles;
        if (elTotal) elTotal.textContent = estadisticas.total;
    }

    /**
     * Aplica los filtros seleccionados
     */
    function applyFilters() {
        const estado = document.getElementById('filter-estado-historial')?.value || 'todos';
        const tipo = document.getElementById('filter-tipo-historial')?.value || 'todos';
        const rango = document.getElementById('filter-rango-historial')?.value || 'todos';
        const rawBusqueda = document.getElementById('filter-buscar-historial')?.value || '';
        const busqueda = window.Sanitizer ? window.Sanitizer.sanitizeString(rawBusqueda).toLowerCase() : rawBusqueda.toLowerCase();

        filteredSolicitudes = solicitudes.filter(s => {
            // Filtro de estado
            if (estado !== 'todos' && s.estado !== estado) return false;
            
            // Filtro de tipo cliente
            if (tipo !== 'todos' && s.cliente.tipo !== tipo) return false;
            
            // Filtro de rango de fechas
            if (rango !== 'todos') {
                const fecha = new Date(s.fecha_procesado);
                const hoy = new Date();
                
                switch(rango) {
                    case 'hoy':
                        if (fecha.toDateString() !== hoy.toDateString()) return false;
                        break;
                    case 'semana':
                        const semanaAtras = new Date(hoy);
                        semanaAtras.setDate(semanaAtras.getDate() - 7);
                        if (fecha < semanaAtras) return false;
                        break;
                    case 'mes':
                        const mesAtras = new Date(hoy);
                        mesAtras.setMonth(mesAtras.getMonth() - 1);
                        if (fecha < mesAtras) return false;
                        break;
                    case 'trimestre':
                        const trimestreAtras = new Date(hoy);
                        trimestreAtras.setMonth(trimestreAtras.getMonth() - 3);
                        if (fecha < trimestreAtras) return false;
                        break;
                }
            }
            
            // Filtro de búsqueda
            if (busqueda) {
                const searchText = `
                    ${s.cliente.nombre}
                    ${s.cliente.email}
                    ${s.direccion.calle}
                    ${s.plan.title}
                    ${s.observaciones || ''}
                `.toLowerCase();
                
                if (!searchText.includes(busqueda)) return false;
            }
            
            return true;
        });

        currentPage = 1;
        renderHistorial();
    }

    /**
     * Limpia todos los filtros
     */
    function clearFilters() {
        const filterEstado = document.getElementById('filter-estado-historial');
        const filterTipo = document.getElementById('filter-tipo-historial');
        const filterRango = document.getElementById('filter-rango-historial');
        const filterBuscar = document.getElementById('filter-buscar-historial');

        if (filterEstado) filterEstado.value = 'todos';
        if (filterTipo) filterTipo.value = 'todos';
        if (filterRango) filterRango.value = 'todos';
        if (filterBuscar) filterBuscar.value = '';

        applyFilters();
    }

    /**
     * Renderiza la lista del historial
     */
    function renderHistorial() {
        if (filteredSolicitudes.length === 0) {
            elementos.lista.classList.add('hidden');
            elementos.vacio.classList.remove('hidden');
            elementos.pagination.classList.add('hidden');
            return;
        }

        elementos.lista.classList.remove('hidden');
        elementos.vacio.classList.add('hidden');

        // Calcular paginación
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedSolicitudes = filteredSolicitudes.slice(start, end);

        // Renderizar solicitudes
        elementos.lista.innerHTML = paginatedSolicitudes.map(solicitud => 
            createHistorialCard(solicitud)
        ).join('');

        // Actualizar paginación
        updatePagination();
    }

    /**
     * Crea el HTML de una tarjeta del historial
     */
    function createHistorialCard(solicitud) {
        const estadoClass = {
            'factible': 'bg-green-100 text-green-800',
            'no_factible': 'bg-red-100 text-red-800'
        }[solicitud.estado] || 'bg-gray-100 text-gray-800';

        const estadoIcon = {
            'factible': 'fa-check-circle',
            'no_factible': 'fa-times-circle'
        }[solicitud.estado] || 'fa-question-circle';

        const estadoTexto = {
            'factible': 'Factible',
            'no_factible': 'No Factible'
        }[solicitud.estado] || 'Desconocido';

        const tipoIcon = solicitud.cliente.tipo === 'empresa' ? 'fa-building' : 'fa-user';

        // Formatear dirección
        const dir = solicitud.direccion;
        const direccionCompleta = `${dir.calle} ${dir.numero}, ${dir.distrito}, ${dir.municipio}`;

        return `
            <div class="bg-white rounded-lg p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow">
                <div class="flex flex-col lg:flex-row justify-between gap-3 sm:gap-4">
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2 sm:gap-3 mb-3">
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-principal-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas ${tipoIcon} text-principal-600 text-lg sm:text-xl"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="font-bold text-base sm:text-lg text-gray-800 truncate">${solicitud.cliente.nombre}</h3>
                                <span class="text-xs sm:text-sm text-gray-500 truncate block">${solicitud.cliente.email}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div>
                                <span class="text-gray-600"><i class="fas fa-map-marker-alt mr-1"></i>Dirección:</span>
                                <span class="font-medium ml-1 break-words">${direccionCompleta}</span>
                            </div>
                            <div>
                                <span class="text-gray-600"><i class="fas fa-wifi mr-1"></i>Plan:</span>
                                <span class="font-medium ml-1 break-words">${solicitud.plan.title} - ${solicitud.plan.price}</span>
                            </div>
                            <div>
                                <span class="text-gray-600"><i class="fas fa-calendar mr-1"></i>Solicitado:</span>
                                <span class="font-medium ml-1">${formatFecha(solicitud.fecha_solicitud)}</span>
                            </div>
                            <div>
                                <span class="text-gray-600"><i class="fas fa-check mr-1"></i>Procesado:</span>
                                <span class="font-medium ml-1">${formatFecha(solicitud.fecha_procesado)}</span>
                            </div>
                            ${solicitud.vlan ? `
                                <div>
                                    <span class="text-gray-600">VLAN:</span>
                                    <span class="font-medium ml-1">${solicitud.vlan}</span>
                                </div>
                            ` : ''}
                            ${solicitud.nap ? `
                                <div>
                                    <span class="text-gray-600">NAP:</span>
                                    <span class="font-medium ml-1">${solicitud.nap}</span>
                                </div>
                            ` : ''}
                            <div class="sm:col-span-2">
                                <span class="text-gray-600"><i class="fas fa-user-check mr-1"></i>Procesado por:</span>
                                <span class="font-medium ml-1 break-words">${solicitud.procesado_por}</span>
                            </div>
                        </div>

                        ${solicitud.observaciones ? `
                            <div class="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">
                                <span class="text-gray-600 font-medium">
                                    <i class="fas fa-comment-alt mr-1"></i>Observaciones:
                                </span>
                                <p class="text-gray-700 mt-1 break-words">${solicitud.observaciones}</p>
                            </div>
                        ` : ''}
                    </div>

                    <div class="flex flex-row sm:flex-col items-center sm:items-end justify-start gap-2 sm:gap-3 sm:min-w-[150px]">
                        <span class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${estadoClass} whitespace-nowrap">
                            <i class="fas ${estadoIcon} mr-1"></i>${estadoTexto}
                        </span>
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
        return date.toLocaleDateString('es-AR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Actualiza la paginación
     */
    function updatePagination() {
        const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
        
        if (totalPages <= 1) {
            elementos.pagination.classList.add('hidden');
            return;
        }

        elementos.pagination.classList.remove('hidden');

        const pageInfo = document.getElementById('page-info-historial');
        const btnPrev = document.getElementById('btn-prev-page-historial');
        const btnNext = document.getElementById('btn-next-page-historial');

        if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        if (btnPrev) btnPrev.disabled = currentPage === 1;
        if (btnNext) btnNext.disabled = currentPage === totalPages;
    }

    /**
     * Cambia de página
     */
    function changePage(direction) {
        const totalPages = Math.ceil(filteredSolicitudes.length / itemsPerPage);
        const newPage = currentPage + direction;

        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderHistorial();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Exporta el historial a Excel
     */
    function exportarExcel() {
        // TODO: Implementar exportación real
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Exportar a Excel',
                message: 'La función de exportación estará disponible próximamente.',
                type: 'info'
            });
        }
    }

    /**
     * Muestra/oculta el loading
     */
    function showLoading(show) {
        if (elementos.loading) {
            elementos.loading.classList.toggle('hidden', !show);
        }
        if (elementos.lista) {
            elementos.lista.classList.toggle('hidden', show);
        }
        if (elementos.vacio) {
            elementos.vacio.classList.add('hidden');
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API pública
    return {
        refresh: loadHistorial,
        getHistorial: () => solicitudes,
        getEstadisticas: () => estadisticas,
        cleanup: () => {
            console.log('[HistorialManager] Limpiando estado...');
            solicitudes = [];
            filteredSolicitudes = [];
            currentPage = 1;
        }
    };
})();

// Exponer globalmente
window.HistorialManager = HistorialManager;
