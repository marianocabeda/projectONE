/**
 * Gestión de Solicitudes de Contrato
 * Para personal de verificación y atención al público
 */

if (!window.RequestsManager) {
const RequestsManager = (() => {
    // Estado de la aplicación
    let solicitudes = [];
    let filteredSolicitudes = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentQueue = 'autogestion'; // 'autogestion' o 'atencion'

    // Elementos del DOM
    const elementos = {
        loading: null,
        vacio: null,
        lista: null,
        pagination: null
    };

    // API helper
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl || function (endpoint) {
        if (!endpoint) return API_BASE_URL;
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + endpoint;
        if (window.AppConfig?.endpoints && window.AppConfig.endpoints[endpoint]) {
            return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + window.AppConfig.endpoints[endpoint];
        }
        // Fallback: assume endpoint is a path under /api/revisacion/
        const path = endpoint.replace('revisacion', 'revisacion/').toLowerCase().replace('factibilidad', '-factibilidad').replace('solicitudespendientes', 'solicitudes-pendientes');
        return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + '/api/' + path;
    };

    // Estadísticas
    const estadisticas = {
        pendientes: 0,
        factibles: 0,
        noFactibles: 0,
        autogestion: 0,
        atencion: 0
    };

    /**
     * Carga scripts necesarios para UI y validación
     */
    async function cargarScriptsNecesarios() {
        const scripts = [
            { src: '/js/utils/gestor-cache.js', global: 'CacheManager' },
            { src: '/js/utils/sanitizer.js', global: 'Sanitizer' },
            { src: '/js/utils/validators.js', global: 'Validators' },
            { src: '/js/utils/manejador-errores.js', global: 'ErrorHandler' },
            { src: '/js/ui/modal-error.js', global: 'ErrorModal' },
            { src: '/js/ui/modal-exito.js', global: 'SuccessModal' },
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
        console.log('[SolicitudesManager] Inicializando...');

        // Cargar scripts UI
        await cargarScriptsNecesarios();

        // Obtener elementos del DOM
        elementos.loading = document.getElementById('solicitudes-loading');
        elementos.vacio = document.getElementById('solicitudes-vacio');
        elementos.lista = document.getElementById('solicitudes-lista');
        elementos.pagination = document.getElementById('solicitudes-pagination');

        if (!elementos.lista) {
            console.error('[SolicitudesManager] Elemento lista no encontrado');
            return;
        }

        // Inicializar eventos
        initEventListeners();

        // Limpiar cache para cargar datos frescos al iniciar
        window.CacheManager?.invalidate('solicitudes_pendientes');

        // Cargar solicitudes
        loadSolicitudes();

        // Auto-refresh cada 15 minutos (solo una vez)
        if (!window.requestsManagerAutoRefreshStarted) {
            setInterval(() => {
                console.log('[RequestsManager] Auto-refreshing solicitudes...');
                loadSolicitudes();
            }, 900000);
            window.requestsManagerAutoRefreshStarted = true;
        }
    }

    /**
     * Inicializa los event listeners
     */
    function initEventListeners() {
        // Pestañas
        const tabAutogestion = document.getElementById('tab-autogestion');
        const tabAtencion = document.getElementById('tab-atencion');

        if (tabAutogestion) tabAutogestion.addEventListener('click', () => switchQueue('autogestion'));
        if (tabAtencion) tabAtencion.addEventListener('click', () => switchQueue('atencion'));

        // Filtros
        const filterEstado = document.getElementById('filter-estado');
        const filterBuscar = document.getElementById('filter-buscar');
        const btnLimpiar = document.getElementById('btn-limpiar-filtros');
        const btnRefresh = document.getElementById('btn-refresh');

        if (filterEstado) filterEstado.addEventListener('change', applyFilters);
        if (filterBuscar) filterBuscar.addEventListener('input', applyFilters);
        if (btnLimpiar) btnLimpiar.addEventListener('click', clearFilters);
        if (btnRefresh) btnRefresh.addEventListener('click', () => loadSolicitudes(true));

        // Paginación
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if (btnPrev) btnPrev.addEventListener('click', () => changePage(-1));
        if (btnNext) btnNext.addEventListener('click', () => changePage(1));
    }

    /**
     * Cambia entre colas de solicitudes
     */
    function switchQueue(queue) {
        console.log('[RequestsManager] Cambiando a cola:', queue);
        currentQueue = queue;
        currentPage = 1;

        // Actualizar estilos de pestañas
        const tabAutogestion = document.getElementById('tab-autogestion');
        const tabAtencion = document.getElementById('tab-atencion');
        const badgeAutogestion = document.getElementById('badge-autogestion');
        const badgeAtencion = document.getElementById('badge-atencion');

        if (queue === 'autogestion') {
            if (tabAutogestion) {
                tabAutogestion.classList.add('border-principal-500', 'text-principal-600');
                tabAutogestion.classList.remove('border-transparent', 'text-gray-500');
            }
            if (tabAtencion) {
                tabAtencion.classList.remove('border-principal-500', 'text-principal-600');
                tabAtencion.classList.add('border-transparent', 'text-gray-500');
            }
            if (badgeAutogestion) {
                badgeAutogestion.classList.remove('bg-gray-100', 'text-gray-600');
                badgeAutogestion.classList.add('bg-principal-100', 'text-principal-700');
            }
            if (badgeAtencion) {
                badgeAtencion.classList.add('bg-gray-100', 'text-gray-600');
                badgeAtencion.classList.remove('bg-principal-100', 'text-principal-700');
            }
        } else {
            if (tabAtencion) {
                tabAtencion.classList.add('border-principal-500', 'text-principal-600');
                tabAtencion.classList.remove('border-transparent', 'text-gray-500');
            }
            if (tabAutogestion) {
                tabAutogestion.classList.remove('border-principal-500', 'text-principal-600');
                tabAutogestion.classList.add('border-transparent', 'text-gray-500');
            }
            if (badgeAtencion) {
                badgeAtencion.classList.remove('bg-gray-100', 'text-gray-600');
                badgeAtencion.classList.add('bg-principal-100', 'text-principal-700');
            }
            if (badgeAutogestion) {
                badgeAutogestion.classList.add('bg-gray-100', 'text-gray-600');
                badgeAutogestion.classList.remove('bg-principal-100', 'text-principal-700');
            }
        }

        // Aplicar filtros con la nueva cola
        applyFilters();
    }

    /**
     * Carga las solicitudes desde el backend
     */
    async function loadSolicitudes(isManual = false) {
        const cacheKey = 'solicitudes_pendientes';
        const cached = window.CacheManager?.get(cacheKey);

        // For manual refresh, always fetch fresh data
        if (isManual) {
            window.CacheManager?.invalidate(cacheKey);
        }

        if (cached && !isManual) {
            console.log('[SolicitudesManager] Usando datos en caché');
            solicitudes = cached;
            actualizarEstadisticas();
            applyFilters();
            showLoading(false);
            if (isManual) showRefreshSpinner(false);
            return;
        }

        try {
            showLoading(true);
            if (isManual) showRefreshSpinner(true);

            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;

            const baseUrl = getUrl('revisacionSolicitudesPendientes');
            console.log('[SolicitudesManager] API_BASE_URL:', API_BASE_URL);
            console.log('[SolicitudesManager] endpoints:', window.AppConfig?.endpoints);
            console.log('[SolicitudesManager] Base URL:', baseUrl);
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // FETCH ALL PAGES: Primero obtener la primera página para saber cuántas páginas hay
            let allSolicitudes = [];
            let currentPage = 1;
            let totalPages = 1;
            
            do {
                const url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + `page=${currentPage}&limit=20`;
                console.log(`[SolicitudesManager] Fetching page ${currentPage} of ${totalPages}:`, url);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers,
                    credentials: 'include',
                    mode: 'cors'
                });
                
                console.log(`[SolicitudesManager] Page ${currentPage} response status:`, response.status);
                
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('Acceso denegado. Verifique sus permisos o inicie sesión nuevamente.');
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                }
                
                const data = await response.json();
                const pageSolicitudes = data.data.solicitudes || [];
                
                // Agregar solicitudes de esta página
                allSolicitudes = allSolicitudes.concat(pageSolicitudes);
                
                // Actualizar total de páginas (solo en la primera iteración)
                if (currentPage === 1) {
                    totalPages = data.data.total_pages || 1;
                    console.log(`[SolicitudesManager] Total pages: ${totalPages}, Total solicitudes: ${data.data.total || 0}`);
                }
                
                console.log(`[SolicitudesManager] Page ${currentPage}: ${pageSolicitudes.length} solicitudes loaded`);
                currentPage++;
                
            } while (currentPage <= totalPages);
            
            console.log(`[SolicitudesManager] Total solicitudes loaded from all pages: ${allSolicitudes.length}`);
            
            // Mapear la estructura de la API al formato esperado
            solicitudes = allSolicitudes.map(item => {
                    // Determinar origen basándose en el estado_conexion:
                    // - "En verificacion" = autogestión (solicitud directa del cliente)
                    // - "Pendiente verificación técnica" = derivada desde panel de atención
                    let origen = 'autogestion';
                    if (item.estado_conexion) {
                        const estadoTexto = item.estado_conexion.toLowerCase().trim();
                        if (estadoTexto.includes('pendiente') && estadoTexto.includes('verificación') && estadoTexto.includes('técnica')) {
                            origen = 'atencion';
                        }
                    }
                    
                    // Normalizar estado para filtros: todas las solicitudes pendientes de verificación
                    // (tanto de autogestión como derivadas) se consideran "pendiente"
                    let estadoNormalizado = 'pendiente';
                    if (item.estado_conexion) {
                        const estado = item.estado_conexion.toLowerCase().trim();
                        if (estado.includes('factible') && !estado.includes('no')) {
                            estadoNormalizado = 'factible';
                        } else if (estado.includes('no') && estado.includes('factible')) {
                            estadoNormalizado = 'no_factible';
                        } else if (estado.includes('verificacion') || estado.includes('verificación') || estado.includes('pendiente')) {
                            estadoNormalizado = 'pendiente';
                        }
                    }
                    
                    return {
                        id: item.id_conexion,
                        nro_conexion: item.nro_conexion,
                        cliente: {
                            nombre: item.cliente,
                            tipo: 'particular', // Asumir particular por defecto
                            email: '', // No proporcionado en lista
                            telefono: '' // No proporcionado en lista
                        },
                        direccion: {
                            calle: item.direccion.split(',')[0]?.trim() || '',
                            numero: '',
                            piso: null,
                            depto: null,
                            codigo_postal: '',
                            provincia: item.direccion.split(',')[2]?.trim() || '',
                            municipio: item.direccion.split(',')[1]?.trim() || '',
                            distrito: item.direccion.split(',')[0]?.trim() || ''
                        },
                        ubicacion: {
                            lat: item.latitud,
                            lng: item.longitud
                        },
                        plan: {
                            title: item.plan,
                            speed: item.plan.match(/(\d+)\s*Mbps/)?.[1] + ' Mbps' || '',
                            price: '', // No proporcionado
                            type: item.plan.includes('PyME') ? 'PYME' : 'HOGAR'
                        },
                        estado: estadoNormalizado,
                        estado_original: item.estado_conexion, // Preservar estado original del backend
                        id_estado_conexion: item.id_estado_conexion,
                        fecha_solicitud: item.fecha_solicitud,
                        vlan: null,
                        nap: null,
                        observaciones: null,
                        origen: origen, // 'autogestion' o 'atencion'
                        id_conexion_notificacion: item.id_conexion // Para marcar notificaciones
                    };
                });

                // Log de resumen de mapeo
                console.log('[RequestsManager] Solicitudes cargadas y mapeadas:', {
                    total: solicitudes.length,
                    por_origen: {
                        autogestion: solicitudes.filter(s => s.origen === 'autogestion').length,
                        atencion: solicitudes.filter(s => s.origen === 'atencion').length
                    },
                    por_estado: {
                        pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
                        factible: solicitudes.filter(s => s.estado === 'factible').length,
                        no_factible: solicitudes.filter(s => s.estado === 'no_factible').length
                    }
                });

                // Mostrar ejemplo de mapeo (primera solicitud de cada tipo)
                const ejemploAutogest = solicitudes.find(s => s.origen === 'autogestion');
                const ejemploAtencion = solicitudes.find(s => s.origen === 'atencion');
                if (ejemploAutogest) {
                    console.log('[RequestsManager] Ejemplo autogestión:', {
                        id: ejemploAutogest.id,
                        estado_original: ejemploAutogest.estado_original,
                        estado_normalizado: ejemploAutogest.estado,
                        origen: ejemploAutogest.origen
                    });
                }
                if (ejemploAtencion) {
                    console.log('[RequestsManager] Ejemplo derivada (atención):', {
                        id: ejemploAtencion.id,
                        estado_original: ejemploAtencion.estado_original,
                        estado_normalizado: ejemploAtencion.estado,
                        origen: ejemploAtencion.origen
                    });
                }

            // Cachear por 5 minutos
            window.CacheManager?.set(cacheKey, solicitudes, 300000);

            actualizarEstadisticas();
            applyFilters();
            showLoading(false);
            if (isManual) showRefreshSpinner(false);

        } catch (error) {
            console.error('[SolicitudesManager] Error al cargar solicitudes:', error);
            solicitudes = [];
            actualizarEstadisticas();
            applyFilters();
            showLoading(false);
            if (isManual) showRefreshSpinner(false);
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error al cargar solicitudes',
                    message: error.message || 'No se pudieron cargar las solicitudes desde el servidor.',
                    type: 'error'
                });
            }
        }
    }



    /**
     * Actualiza las estadísticas
     */
    function actualizarEstadisticas() {
        estadisticas.pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
        estadisticas.factibles = solicitudes.filter(s => s.estado === 'factible').length;
        estadisticas.noFactibles = solicitudes.filter(s => s.estado === 'no_factible').length;
        estadisticas.autogestion = solicitudes.filter(s => s.origen === 'autogestion' && s.estado === 'pendiente').length;
        estadisticas.atencion = solicitudes.filter(s => s.origen === 'atencion' && s.estado === 'pendiente').length;

        // Log para debugging
        console.log('[RequestsManager] Estadísticas actualizadas:', {
            total_pendientes: estadisticas.pendientes,
            autogestion: estadisticas.autogestion,
            atencion: estadisticas.atencion,
            factibles: estadisticas.factibles,
            no_factibles: estadisticas.noFactibles,
            total_solicitudes: solicitudes.length
        });

        // Actualizar UI
        const elPendientes = document.getElementById('total-pendientes');
        const elFactibles = document.getElementById('total-factibles');
        const elNoFactibles = document.getElementById('total-no-factibles');
        const badgeAutogestion = document.getElementById('badge-autogestion');
        const badgeAtencion = document.getElementById('badge-atencion');

        if (elPendientes) elPendientes.textContent = estadisticas.pendientes;
        if (elFactibles) elFactibles.textContent = estadisticas.factibles;
        if (elNoFactibles) elNoFactibles.textContent = estadisticas.noFactibles;
        if (badgeAutogestion) badgeAutogestion.textContent = estadisticas.autogestion;
        if (badgeAtencion) badgeAtencion.textContent = estadisticas.atencion;
    }

    /**
     * Aplica los filtros seleccionados
     */
    function applyFilters() {
        const estado = document.getElementById('filter-estado')?.value || 'todos';
        const rawBusqueda = document.getElementById('filter-buscar')?.value || '';
        const busqueda = window.Sanitizer ? window.Sanitizer.sanitizeString(rawBusqueda).toLowerCase() : rawBusqueda.toLowerCase();

        filteredSolicitudes = solicitudes.filter(s => {
            // Filtro de origen (cola actual)
            if (s.origen !== currentQueue) return false;

            // Filtro de estado
            if (estado !== 'todos' && s.estado !== estado) return false;

            // Filtro de búsqueda
            if (busqueda) {
                const searchText = `
                    ${s.cliente.nombre}
                    ${s.cliente.email}
                    ${s.cliente.direccion}
                    ${s.plan}
                `.toLowerCase();

                if (!searchText.includes(busqueda)) return false;
            }

            return true;
        });

        console.log('[RequestsManager] Filtros aplicados:', {
            cola: currentQueue,
            estado_filtro: estado,
            busqueda: busqueda,
            total_solicitudes: solicitudes.length,
            solicitudes_filtradas: filteredSolicitudes.length,
            por_origen: {
                autogestion: solicitudes.filter(s => s.origen === 'autogestion').length,
                atencion: solicitudes.filter(s => s.origen === 'atencion').length
            }
        });

        currentPage = 1;
        renderSolicitudes();
    }

    /**
     * Limpia todos los filtros
     */
    function clearFilters() {
        const filterEstado = document.getElementById('filter-estado');
        const filterBuscar = document.getElementById('filter-buscar');

        if (filterEstado) filterEstado.value = 'pendiente';
        if (filterBuscar) filterBuscar.value = '';

        applyFilters();
    }

    /**
     * Renderiza la lista de solicitudes
     */
    function renderSolicitudes() {
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
            window.SolicitudCard.create(solicitud)
        ).join('');

        // Agregar event listeners a los botones
        paginatedSolicitudes.forEach(solicitud => {
            const btn = document.getElementById(`btn-procesar-${solicitud.id}`);
            if (btn) {
                btn.addEventListener('click', () => window.ModalProcessor.openModal(solicitud));
            }
        });

        // Actualizar paginación
        updatePagination();
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

        const pageInfo = document.getElementById('page-info');
        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

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
            renderSolicitudes();
            // Scroll hacia arriba
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Muestra/oculta el spinner en el botón refresh
     */
    function showRefreshSpinner(show) {
        const btn = document.getElementById('btn-refresh');
        if (!btn) return;

        const icon = btn.querySelector('i');
        if (!icon) return;

        if (show) {
            icon.className = 'fas fa-spinner fa-spin mr-2';
            btn.disabled = true;
        } else {
            icon.className = 'fas fa-sync-alt mr-2';
            btn.disabled = false;
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
    // Nota: Ahora se inicializa desde dashboard.js para evitar conflictos

    // API pública
    return {
        init: init,
        refresh: () => loadSolicitudes(true),
        getSolicitudes: () => solicitudes,
        getEstadisticas: () => estadisticas,
        cleanup: () => {
            console.log('[RequestsManager] Limpiando estado...');
            solicitudes = [];
            filteredSolicitudes = [];
            currentPage = 1;
            // Limpiar elementos DOM si es necesario
            const modal = document.getElementById('modal-procesar');
            if (modal) modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    };
})();

// Exponer globalmente
window.RequestsManager = RequestsManager;
}
