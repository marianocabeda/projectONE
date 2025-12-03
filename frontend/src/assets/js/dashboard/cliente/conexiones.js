/**
 * connections.js
 * Lógica para renderizar y gestionar las conexiones del usuario
 */

/**
 * Carga scripts necesarios para UI y validación
 */
async function cargarScriptsNecesarios() {
    const scripts = [
        { src: '/js/utils/gestor-cache.js', global: 'CacheManager' },
        { src: '/js/utils/sanitizer.js', global: 'Sanitizer' },
        { src: '/js/utils/validators.js', global: 'Validators' },
        { src: '/js/utils/errorHandler.js', global: 'ErrorHandler' },
        { src: '/js/ui/error-modal.js', global: 'ErrorModal' },
        { src: '/js/ui/success-modal.js', global: 'SuccessModal' },
        { src: '/js/ui/spinner-carga.js', global: 'LoadingSpinner' }
    ];

    const promises = scripts.map(({ src, global }) => {
        if (window[global]) {
            return Promise.resolve();
        }
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
 * Transforma los datos de la API al formato esperado por la UI
 */
function transformApiDataToUI(apiData) {
    if (!apiData || !apiData.conexiones || !Array.isArray(apiData.conexiones)) {
        return [];
    }
    
    return apiData.conexiones.map(conn => {
        // DEBUG: Log de la estructura de datos recibida
        if (apiData.conexiones.indexOf(conn) === 0) {
            console.log('📊 Estructura de datos de conexión (primera):', {
                id_conexion: conn.id_conexion,
                id_contrato: conn.id_contrato,
                contrato: conn.contrato,
                contrato_id: conn.contrato_id,
                estado_conexion: conn.estado_conexion,
                plan: conn.plan?.nombre,
                completo: conn
            });
        }
        // Función helper para capitalizar palabras (maneja correctamente acentos)
        const capitalize = (str) => {
            return str.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
        };
        
        // Construir dirección completa con formato capitalizado
        const dir = conn.direccion;
        let direccionCompleta = `${capitalize(dir.calle)} ${dir.numero}`;
        if (dir.piso) direccionCompleta += `, Piso ${dir.piso}`;
        if (dir.depto) direccionCompleta += `, Depto ${dir.depto}`;
        direccionCompleta += `, ${capitalize(dir.distrito)}, ${capitalize(dir.departamento)}, ${capitalize(dir.provincia)}`;
        
        // Mapear tipo de conexión a nombre legible
        const tipoConexionMap = {
            'FTTH': 'Fibra Óptica',
            'WISP': 'Inalámbrico',
            'ADSL': 'ADSL',
            'Coaxial': 'Cable Coaxial'
        };
        
        // Mapear estados y colores usando input.css
        const estadoColorMap = {
            'Activo': { color: 'exito', bgClass: 'bg-exito-50', textClass: 'text-exito-700', borderClass: 'border-exito-200' },
            'Suspendido': { color: 'error', bgClass: 'bg-error-50', textClass: 'text-error-700', borderClass: 'border-error-200' },
            'En verificacion': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' },
            'En verificación': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' },
            'Pendiente': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' },
            'Pendiente de Verificacion': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' },
            'Pendiente de Verificación': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' },
            'No factible': { color: 'error', bgClass: 'bg-error-50', textClass: 'text-error-700', borderClass: 'border-error-200' },
            'Inactivo': { color: 'gray', bgClass: 'bg-gray-50', textClass: 'text-gray-700', borderClass: 'border-gray-200' },
            'Baja': { color: 'gray', bgClass: 'bg-gray-50', textClass: 'text-gray-700', borderClass: 'border-gray-200' },
            'Pendiente verificacion tecnica': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' },
            'Pendiente verificación técnica': { color: 'advertencia', bgClass: 'bg-advertencia-50', textClass: 'text-advertencia-700', borderClass: 'border-advertencia-200' }
        };
        
        // Normalizar el estado (remover acentos y convertir a minúsculas para el mapeo)
        const estadoNormalizado = conn.estado_conexion
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
        
        // Buscar en el mapa con estado original primero, luego normalizado
        let estadoInfo = estadoColorMap[conn.estado_conexion];
        if (!estadoInfo) {
            // Intentar con normalización
            const mappedKey = Object.keys(estadoColorMap).find(key => 
                key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim() === estadoNormalizado
            );
            estadoInfo = mappedKey ? estadoColorMap[mappedKey] : { color: 'info', bgClass: 'bg-info-50', textClass: 'text-info-700', borderClass: 'border-info-200' };
        }
        
        const tipo = tipoConexionMap[conn.tipo_conexion] || conn.tipo_conexion;
        
        // Extraer tipo de plan del nombre (Hogar, Empresarial, etc.)
        const planNombreParts = conn.plan.nombre.match(/Plan\s+(\w+)/);
        const tipoPlanExtraido = planNombreParts ? planNombreParts[1] : '';
        
        const result = {
            id: conn.id_conexion,
            nroConexion: conn.nro_conexion,
            tipo: tipo,
            direccion: direccionCompleta,
            tipoPlan: tipoPlanExtraido,
            plan: `${conn.plan.velocidad_mbps} Mbps`,
            planId: conn.plan.id_plan,
            planNombre: conn.plan.nombre,
            velocidad: conn.plan.velocidad_mbps,
            estado: conn.estado_conexion,
            estadoInfo: estadoInfo,
            fechaInstalacion: conn.fecha_instalacion,
            fechaBaja: conn.fecha_baja,
            latitud: conn.latitud,
            longitud: conn.longitud,
            // Datos adicionales para funcionalidad de pago y firma
            personaId: usuarioPersonaId, // Usar el id_persona obtenido del perfil
            contratoId: conn.id_contrato || conn.contrato?.id_contrato || conn.contrato_id, // Buscar en varios lugares
            idContratoFirma: conn.id_contrato_firma || null, // ID de contrato_firma si existe
            titular: conn.titular || '',
            pagado: conn.pagado || (conn.id_contrato_firma ? true : false) // Si tiene id_contrato_firma, ya fue pagado
        };
        
        // DEBUG: Log de IDs al transformar (solo primera conexión)
        if (apiData.conexiones.indexOf(conn) === 0) {
            console.log('🔑 IDs extraídos:', {
                conexionId: conn.id_conexion,
                personaId: usuarioPersonaId || 'NO DISPONIBLE (del perfil)',
                contratoId: result.contratoId || 'NO DISPONIBLE',
                idContratoFirma: result.idContratoFirma || 'NO DISPONIBLE',
                fuente_contratoId: conn.id_contrato ? 'id_contrato' : 
                                   conn.contrato?.id_contrato ? 'contrato.id_contrato' : 
                                   conn.contrato_id ? 'contrato_id' : 'NINGUNA'
            });
        }
        
        return result;
    }).filter(Boolean); // Filtrar cualquier null/undefined
}

// Variable global para almacenar todas las conexiones
let allConexiones = [];

// Variable global para almacenar el id_persona del usuario autenticado
let usuarioPersonaId = null;

// Variable para controlar si ya se hizo el fetch inicial en esta sesión de vista
let initialFetchDone = false;

/**
 * Filtra y ordena las conexiones según los criterios seleccionados
 */
function filterAndSortConexiones(conexiones) {
    let filtered = [...conexiones];

    // Filtrar por número de conexión
    const nroConexionFilter = document.getElementById('filter-nro-conexion')?.value;
    if (nroConexionFilter) {
        const nro = parseInt(nroConexionFilter);
        filtered = filtered.filter(conn => conn.nroConexion === nro);
    }

    // Ordenar
    const ordenFilter = document.getElementById('filter-orden')?.value || 'nro_conexion_desc';
    switch(ordenFilter) {
        case 'nro_conexion_asc':
            filtered.sort((a, b) => a.nroConexion - b.nroConexion);
            break;
        case 'nro_conexion_desc':
            filtered.sort((a, b) => b.nroConexion - a.nroConexion);
            break;
    }

    return filtered;
}

/**
 * Renderiza las conexiones usando componente de tarjetas
 */
function renderConexiones(conexiones, applyFilters = false) {
    const loadingElement = document.getElementById('conexiones-loading');
    const emptyElement = document.getElementById('conexiones-vacio');
    const listaContainer = document.getElementById('conexiones-lista');
    
    if (!listaContainer) {
        console.warn('No se encontró el contenedor de lista de conexiones');
        return;
    }

    // Guardar todas las conexiones si es la carga inicial
    if (!applyFilters) {
        allConexiones = conexiones;
    }

    // Aplicar filtros si es necesario
    const conexionesAMostrar = applyFilters ? filterAndSortConexiones(allConexiones) : conexiones;

    // Ocultar loading
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }

    // Si no hay conexiones, mostrar mensaje vacío
    if (!conexionesAMostrar || conexionesAMostrar.length === 0) {
        if (emptyElement) {
            emptyElement.classList.remove('hidden');
        }
        listaContainer.classList.add('hidden');
        return;
    }

    // Mostrar lista y ocultar mensaje vacío
    listaContainer.classList.remove('hidden');
    if (emptyElement) {
        emptyElement.classList.add('hidden');
    }

    // Limpiar contenedor
    listaContainer.innerHTML = '';

    // Renderizar cada conexión usando el componente de tarjeta
    conexionesAMostrar.forEach(conn => {
        // Sanitizar valores antes de renderizar (protección contra XSS)
        const sanitizedConn = {
            id: conn.id,
            nroConexion: conn.nroConexion,
            tipoConexion: window.Sanitizer ? window.Sanitizer.sanitizeString(conn.tipo) : conn.tipo,
            direccion: window.Sanitizer ? window.Sanitizer.sanitizeAddress(conn.direccion) : conn.direccion,
            tipoPlan: conn.tipoPlan ? (window.Sanitizer ? window.Sanitizer.sanitizeString(conn.tipoPlan) : conn.tipoPlan) : '-',
            plan: window.Sanitizer ? window.Sanitizer.sanitizeString(conn.plan) : conn.plan,
            estado: window.Sanitizer ? window.Sanitizer.sanitizeString(conn.estado) : conn.estado,
            // Datos adicionales para funcionalidad de pago y firma
            personaId: conn.personaId,
            contratoId: conn.contratoId,
            idContratoFirma: conn.idContratoFirma, // ID de contrato_firma si existe
            titular: window.Sanitizer ? window.Sanitizer.sanitizeString(conn.titular) : conn.titular,
            pagado: conn.pagado
        };

        // Usar el componente de tarjeta para generar el HTML
        if (window.ConexionCard) {
            listaContainer.innerHTML += window.ConexionCard.create(sanitizedConn);
        } else {
            console.warn('⚠️ ConexionCard no está disponible');
        }
    });

    // Attach event listeners para botones
    attachActionListeners();
}

/**
 * Adjunta event listeners a los botones de acción
 */
function attachActionListeners() {
    // Botón de boleto de pago
    document.querySelectorAll('.boton-azul').forEach(btn => {
        btn.addEventListener('click', handleBoletoPago);
    });
    
    // Botón de cuenta corriente
    document.querySelectorAll('.btn-cuenta-corriente').forEach(btn => {
        btn.addEventListener('click', handleCuentaCorriente);
    });
}

/**
 * Configura los event listeners para los filtros
 */
function setupFilterListeners() {
    const filterNroConexion = document.getElementById('filter-nro-conexion');
    const filterOrden = document.getElementById('filter-orden');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

    // Aplicar filtros al cambiar cualquier campo
    if (filterNroConexion) {
        filterNroConexion.addEventListener('input', () => {
            renderConexiones(allConexiones, true);
        });
    }

    if (filterOrden) {
        filterOrden.addEventListener('change', () => {
            renderConexiones(allConexiones, true);
        });
    }

    // Limpiar filtros
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', () => {
            if (filterNroConexion) filterNroConexion.value = '';
            if (filterOrden) filterOrden.value = 'nro_conexion_desc';
            renderConexiones(allConexiones, true);
        });
    }
}

/**
 * Maneja la acción de boleto de pago
 */
function handleBoletoPago(e) {
    const id = e.currentTarget.dataset.conexionId;
    console.log(`Imprimir boleto de pago para conexión ${id}`);
    // TODO: Implementar impresión de boleto
    alert(`Generar boleto de pago para conexión ${id} (funcionalidad pendiente)`);
}

/**
 * Maneja la acción de cuenta corriente (redirige a Mis Facturas)
 */
function handleCuentaCorriente(e) {
    const id = e.currentTarget.dataset.conexionId;
    console.log(`Ver cuenta corriente para conexión ${id}`);
    // Redirigir a la página de facturas
    if (window.loadContent) {
        window.loadContent('facturas');
    } else {
        window.location.href = '/facturas';
    }
}

/**
 * Carga las conexiones desde la API
 * @param {boolean} forceRefresh - Si es true, fuerza la recarga desde el servidor ignorando caché
 */
async function loadConexiones(forceRefresh = false) {
    const CACHE_KEY = 'user:conexiones';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    try {
        // Obtener id_persona del perfil si no lo tenemos
        if (!usuarioPersonaId) {
            try {
                const perfilUrl = window.AppConfig.getUrl('getUserProfile');
                const perfilResponse = await fetch(perfilUrl, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (perfilResponse.ok) {
                    const perfilData = await perfilResponse.json();
                    if (perfilData.success && perfilData.data) {
                        usuarioPersonaId = perfilData.data.id_persona || perfilData.data.id;
                        console.log('👤 ID Persona obtenido del perfil:', usuarioPersonaId);
                    }
                }
            } catch (profileError) {
                console.error('❌ Error obteniendo perfil para id_persona:', profileError);
            }
        }
        // Verificar que AppConfig esté disponible
        if (!window.AppConfig || !window.AppConfig.endpoints || !window.AppConfig.endpoints.conexiones) {
            console.error('❌ AppConfig o endpoint de conexiones no disponible');
            if (window.ErrorModal) {
                window.ErrorModal.show('Configuración no disponible. Por favor, recargue la página.');
            }
            return [];
        }

        // IMPORTANTE: En la primera carga de la vista, siempre hacer fetch
        // Solo usar caché en cargas subsiguientes durante la misma sesión de vista
        
        // Verificar si hay datos en caché y no se solicita refresh forzado
        // Solo usar caché si NO es la primera carga (después del fetch inicial)
        if (!forceRefresh && initialFetchDone && window.CacheManager && window.CacheManager.has(CACHE_KEY)) {
            console.log('📦 Cargando conexiones desde caché (fetch inicial ya realizado)');
            const cachedData = window.CacheManager.get(CACHE_KEY);
            return cachedData;
        }
        
        // Primera carga o refresh forzado: hacer fetch
        if (!initialFetchDone) {
            console.log('🔄 Primera carga de conexiones - haciendo fetch desde el servidor');
        } else if (forceRefresh) {
            console.log('🔄 Refresh forzado - ignorando caché');
        }

        // Si hay una carga en progreso, esperar
        if (window.CacheManager && window.CacheManager.isLoading(CACHE_KEY)) {
            console.log('⏳ Esperando carga en progreso...');
            return await window.CacheManager.waitForLoading(CACHE_KEY);
        }

        // Marcar como cargando
        if (window.CacheManager) {
            window.CacheManager.setLoading(CACHE_KEY, true);
        }

        // Obtener token para Authorization header
        const token = window.AuthToken?.getToken?.() || null;
        
        if (!token) {
            console.warn('⚠️ No hay token de autenticación disponible');
            if (window.ErrorModal) {
                window.ErrorModal.show('Sesión no válida. Por favor, inicie sesión nuevamente.');
            }
            return [];
        }
        
        const headers = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        
        const url = window.AppConfig.getUrl('conexiones');
        console.log('🔄 Cargando conexiones desde:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ No autorizado - token inválido o expirado');
                if (window.ErrorModal) {
                    window.ErrorModal.show('Sesión expirada. Por favor, inicie sesión nuevamente.');
                }
                // Redirigir al login después de un momento
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return [];
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Conexiones recibidas:', result);
        
        // Verificar estructura de respuesta
        if (!result.success || !result.data) {
            console.error('❌ Respuesta inválida de la API:', result);
            throw new Error('Formato de respuesta inválido');
        }
        
        // Transformar datos de la API al formato de la UI
        const conexiones = transformApiDataToUI(result.data);
        console.log(`✅ ${conexiones.length} conexiones transformadas correctamente`);
        
        // Marcar que el fetch inicial se completó exitosamente
        initialFetchDone = true;
        
        // Guardar en caché
        if (window.CacheManager) {
            window.CacheManager.set(CACHE_KEY, conexiones, CACHE_DURATION);
            window.CacheManager.setLoading(CACHE_KEY, false);
            console.log('💾 Conexiones guardadas en caché (disponibles para próximas cargas)');
        }
        
        return conexiones;
    } catch (error) {
        console.error('❌ Error cargando conexiones:', error);
        
        // Limpiar estado de carga en caso de error
        if (window.CacheManager) {
            window.CacheManager.setLoading(CACHE_KEY, false);
        }
        if (window.ErrorModal) {
            window.ErrorModal.show('No se pudieron cargar las conexiones. Intente nuevamente.');
        } else if (window.ErrorHandler) {
            window.ErrorHandler.handleError(error, 'Error al cargar conexiones');
        }
        return [];
    }
}

/**
 * Configura el botón "Añadir Conexión"
 * NOTA: El botón ahora es un enlace <a> que el dashboard maneja automáticamente
 * Esta función se mantiene por compatibilidad pero ya no es necesaria
 */
function setupAddConexionButton() {
    console.log('ℹ️ El botón "Añadir Conexión" ahora es un enlace manejado por dashboard.js');
    return true;
}

/**
 * Refresca las conexiones forzando la recarga desde el servidor
 */
async function refreshConexiones() {
    console.log('🔄 Refrescando conexiones...');
    const conexiones = await loadConexiones(true);
    renderConexiones(conexiones);
    console.log('✅ Conexiones refrescadas');
}

/**
 * Inicializa la página de conexiones
 */
async function init() {
    console.log('🔌 Inicializando página de conexiones...');
    
    // Cargar scripts necesarios primero
    await cargarScriptsNecesarios();
    
    // Verificar que el contenedor de lista exista
    const listaContainer = document.getElementById('conexiones-lista');
    
    if (!listaContainer) {
        console.error('❌ No se encontró el contenedor de lista de conexiones en el DOM');
        return;
    }
    
    // Configurar event listeners para filtros
    setupFilterListeners();
    
    // Cargar y renderizar conexiones
    const conexiones = await loadConexiones();
    renderConexiones(conexiones);
    
    console.log('✅ Página de conexiones inicializada correctamente');
}

// Variable para evitar inicialización doble
let isInitialized = false;

// Función wrapper que previene doble inicialización en la misma vista
async function safeInit() {
    console.log(`🔍 ConnectionsManager.init() llamado. isInitialized=${isInitialized}`);
    
    // Si ya está inicializado en esta carga de vista, omitir
    if (isInitialized) {
        console.log('ℹ️ Connections ya inicializado en esta vista, omitiendo...');
        return;
    }
    
    isInitialized = true;
    await init();
}

// Exponer init globalmente para que dashboard.js pueda llamarlo
window.ConnectionsManager = {
    init: safeInit,
    loadConexiones,
    renderConexiones,
    refreshConexiones,
    reload: refreshConexiones, // Alias para compatibilidad
    clearCache: () => {
        if (window.CacheManager) {
            window.CacheManager.invalidate('user:conexiones');
            console.log('🗑️ Caché de conexiones limpiada');
        }
    },
    reset: () => {
        isInitialized = false;
        console.log('🔄 ConnectionsManager reseteado');
    },
    cleanup: () => {
        // Resetear el flag de inicialización al salir de la vista
        isInitialized = false;
        // Resetear el flag de fetch inicial para que la próxima vez se haga fetch de nuevo
        initialFetchDone = false;
        console.log('🧹 ConnectionsManager cleanup - listo para reinicializar (fetch inicial reseteado)');
    }
};

// Alias para compatibilidad con otros módulos
window.ConexionesModule = window.ConnectionsManager;

// También mantener la exportación anterior por compatibilidad
window.ConnectionsInit = safeInit;

// NO auto-inicializar aquí, dejar que dashboard.js lo maneje
console.log('📦 ConnectionsManager cargado y listo');
