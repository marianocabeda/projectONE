/**
 * Panel de Administración - Recursos Humanos
 * Gestión de usuarios, planes, roles y reportes
 */

const AdminPanel = (() => {
    let currentSection = 'dashboard';
    
    // Datos en cache
    let usuarios = [];
    let usuariosOriginal = []; // Para filtrado
    let planes = [];
    let roles = [];
    let estadisticas = {
        usuariosActivos: 0,
        solicitudesHoy: 0,
        ingresosMes: 0
    };

    // API Configuration
    const API_BASE_URL = window.AppConfig?.API_BASE_URL || window.ENV?.API_BASE_URL || '/v1';

    // Helper para construir URLs con la configuración centralizada (compatible con AppConfig.getUrl)
    const getUrl = window.AppConfig?.getUrl || function(endpoint) {
        if (!endpoint) return API_BASE_URL;
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + endpoint;
        // Si se pasa una clave de endpoints, intentar resolverla
        if (window.AppConfig?.endpoints && window.AppConfig.endpoints[endpoint]) {
            return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + window.AppConfig.endpoints[endpoint];
        }
        return endpoint;
    };

    // Modo mock para desarrollo/pruebas
    const USE_MOCK_DATA = window.ENV?.isDevelopment !== false; // Por defecto true si no está definido

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
     * Inicializa el panel de administración
     */
    async function init() {
        console.log('[AdminPanel] Inicializando...');
        console.log('[AdminPanel] Modo Mock:', USE_MOCK_DATA);
        
        // Cargar scripts UI primero
        await cargarScriptsNecesarios();
        
        initEventListeners();
        loadInitialData();
    }

    /**
     * Inicializa los event listeners
     */
    function initEventListeners() {
        // Navegación de secciones
        document.querySelectorAll('[data-section]').forEach(card => {
            card.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                showSection(section);
            });
        });

        // Botones de nueva entidad
        const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
        const btnNuevoPlan = document.getElementById('btn-nuevo-plan');
        const btnNuevoRol = document.getElementById('btn-nuevo-rol');

        if (btnNuevoUsuario) btnNuevoUsuario.addEventListener('click', () => crearUsuario());
        if (btnNuevoPlan) btnNuevoPlan.addEventListener('click', () => crearPlan());
        if (btnNuevoRol) btnNuevoRol.addEventListener('click', () => crearRol());

        // Filtros de usuarios
        const filterUsuarioBuscar = document.getElementById('filter-usuario-buscar');
        const filterUsuarioRol = document.getElementById('filter-usuario-rol');
        const filterUsuarioEstado = document.getElementById('filter-usuario-estado');
        const btnLimpiarFiltrosUsuarios = document.getElementById('btn-limpiar-filtros-usuarios');

        if (filterUsuarioBuscar) filterUsuarioBuscar.addEventListener('input', filtrarUsuarios);
        if (filterUsuarioRol) filterUsuarioRol.addEventListener('change', filtrarUsuarios);
        if (filterUsuarioEstado) filterUsuarioEstado.addEventListener('change', filtrarUsuarios);
        if (btnLimpiarFiltrosUsuarios) btnLimpiarFiltrosUsuarios.addEventListener('click', limpiarFiltrosUsuarios);
    }

    /**
     * Carga los datos iniciales
     */
    async function loadInitialData() {
        try {
            // Cargar usuarios desde el backend
            await cargarUsuarios();

            // Cargar planes desde el backend
            planes = [
                { id: 'hogar-50', title: 'Hogar 50 Mbps', speed: '50 Mbps', price: '800', type: 'HOGAR' },
                { id: 'hogar-100', title: 'Hogar 100 Mbps', speed: '100 Mbps', price: '1200', type: 'HOGAR' },
                { id: 'pyme-100', title: 'Pyme 100 Mbps', speed: '100 Mbps', price: '4500', type: 'PYME' },
                { id: 'empresarial-500', title: 'Empresarial 500 Mbps', speed: '500 Mbps', price: '12000', type: 'EMPRESARIAL' }
            ];

            roles = [
                { id: 'cliente', nombre: 'Cliente', descripcion: 'Usuario final que solicita servicios', usuarios: 45 },
                { id: 'empresa', nombre: 'Empresa', descripcion: 'Usuario corporativo', usuarios: 12 },
                { id: 'verificador', nombre: 'Verificador', descripcion: 'Personal que verifica factibilidad', usuarios: 3 },
                { id: 'admin', nombre: 'Administrador', descripcion: 'Acceso total al sistema', usuarios: 2 }
            ];

            estadisticas = {
                usuariosActivos: usuarios.filter(u => u.estado === 'activo').length,
                solicitudesHoy: 5,
                ingresosMes: 156000
            };

            // Actualizar contadores
            actualizarContadores();
            actualizarEstadisticas();

        } catch (error) {
            console.error('[AdminPanel] Error al cargar datos:', error);
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error al cargar datos',
                    message: 'No se pudieron cargar los datos del panel. Intente nuevamente.',
                    type: 'error'
                });
            }
        }
    }

    /**
     * Genera datos mock de usuarios
     */
    function generarUsuariosMock() {
        const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofía', 'Diego', 'Valentina', 'Martín', 'Camila', 'Andrés', 'Lucía', 'Gabriel'];
        const apellidos = ['Pérez', 'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Fernández', 'Díaz', 'Torres', 'Sánchez', 'Romero', 'Silva', 'Castro', 'Álvarez'];
        const roles_lista = ['cliente', 'cliente', 'cliente', 'cliente', 'empresa', 'empresa', 'verificador', 'verificador', 'atencion_publico'];
        const estados = ['activo', 'activo', 'activo', 'activo', 'inactivo'];
        
        const mockUsuarios = [];
        const numUsuarios = 25;
        
        for (let i = 1; i <= numUsuarios; i++) {
            const nombre = nombres[Math.floor(Math.random() * nombres.length)];
            const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
            const rol = roles_lista[Math.floor(Math.random() * roles_lista.length)];
            const estado = estados[Math.floor(Math.random() * estados.length)];
            const dni = String(20000000 + Math.floor(Math.random() * 25000000)).padStart(8, '0');
            const cuil = `20${dni}${Math.floor(Math.random() * 10)}`;
            const telefono = `+54 9 11 ${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
            const mesAtras = Math.floor(Math.random() * 6);
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - mesAtras);
            
            mockUsuarios.push({
                id: i,
                nombre: nombre,
                apellido: apellido,
                email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.com`,
                dni: dni,
                cuil: cuil,
                telefono: telefono,
                rol: rol,
                roles: [rol],
                estado: estado,
                fecha_registro: fecha.toISOString()
            });
        }
        
        // Agregar algunos usuarios específicos de ejemplo
        mockUsuarios.unshift({
            id: 100,
            nombre: 'María',
            apellido: 'Verificadora',
            email: 'maria.verificadora@empresa.com',
            dni: '35123456',
            cuil: '27351234567',
            telefono: '+54 9 11 5555-1234',
            rol: 'verificador',
            roles: ['verificador'],
            estado: 'activo',
            fecha_registro: '2025-01-15T09:00:00'
        });
        
        mockUsuarios.unshift({
            id: 101,
            nombre: 'Carlos',
            apellido: 'Atención',
            email: 'carlos.atencion@empresa.com',
            dni: '38654321',
            cuil: '20386543219',
            telefono: '+54 9 11 5555-4321',
            rol: 'atencion_publico',
            roles: ['atencion_publico'],
            estado: 'activo',
            fecha_registro: '2025-02-20T10:30:00'
        });
        
        return mockUsuarios;
    }

    /**
     * Carga usuarios desde el backend o usa datos mock
     */
    async function cargarUsuarios() {
        try {
            // Si está en modo mock, usar datos de ejemplo
            if (USE_MOCK_DATA) {
                console.log('[AdminPanel] 🎭 Usando datos MOCK');
                await new Promise(resolve => setTimeout(resolve, 500)); // Simular latencia
                usuarios = generarUsuariosMock();
                usuariosOriginal = [...usuarios];
                console.log('[AdminPanel] Usuarios mock cargados:', usuarios.length);
                return;
            }

            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(getUrl('usuarios') + '?limit=100', {
                method: 'GET',
                credentials: 'include',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                usuarios = data.data.map(u => ({
                    id: u.id_usuario || u.id,
                    nombre: u.nombre || '',
                    apellido: u.apellido || '',
                    email: u.email || '',
                    dni: u.dni || '',
                    cuil: u.cuil || '',
                    telefono: u.telefono || '',
                    rol: u.rol || 'cliente',
                    roles: u.roles || [],
                    estado: u.activo ? 'activo' : 'inactivo',
                    fecha_registro: u.creado || u.fecha_registro || new Date().toISOString()
                }));
                usuariosOriginal = [...usuarios];
                console.log('[AdminPanel] Usuarios cargados desde API:', usuarios.length);
            }
        } catch (error) {
            console.error('[AdminPanel] Error al cargar usuarios, usando datos mock:', error);
            // Usar datos de ejemplo en caso de error
            usuarios = generarUsuariosMock();
            usuariosOriginal = [...usuarios];
            console.log('[AdminPanel] Usuarios mock cargados (fallback):', usuarios.length);
        }
    }

    /**
     * Actualiza los contadores de las tarjetas principales
     */
    function actualizarContadores() {
        const totalUsuarios = document.getElementById('total-usuarios');
        const totalPlanes = document.getElementById('total-planes');
        const totalRoles = document.getElementById('total-roles');

        if (totalUsuarios) totalUsuarios.textContent = usuarios.length;
        if (totalPlanes) totalPlanes.textContent = planes.length;
        if (totalRoles) totalRoles.textContent = roles.length;

        // Mostrar indicador de modo mock
        if (USE_MOCK_DATA) {
            mostrarIndicadorMock();
        }
    }

    /**
     * Muestra un indicador visual de que se está usando datos mock
     */
    function mostrarIndicadorMock() {
        // Evitar duplicados
        if (document.getElementById('mock-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'mock-indicator';
        indicator.className = 'fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg z-[10000] flex items-center gap-2 animate-pulse';
        indicator.innerHTML = `
            <i class="fas fa-flask text-lg"></i>
            <div>
                <div class="font-bold text-sm">MODO DEMO</div>
                <div class="text-xs">Usando datos de prueba</div>
            </div>
            <button onclick="document.getElementById('mock-indicator').remove()" class="ml-2 text-white hover:text-yellow-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(indicator);

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.classList.add('opacity-0', 'transition-opacity', 'duration-500');
                setTimeout(() => indicator.remove(), 500);
            }
        }, 10000);
    }

    /**
     * Actualiza las estadísticas del dashboard
     */
    function actualizarEstadisticas() {
        const statUsuariosActivos = document.getElementById('stat-usuarios-activos');
        const statSolicitudesHoy = document.getElementById('stat-solicitudes-hoy');
        const statIngresosMes = document.getElementById('stat-ingresos-mes');

        if (statUsuariosActivos) statUsuariosActivos.textContent = estadisticas.usuariosActivos;
        if (statSolicitudesHoy) statSolicitudesHoy.textContent = estadisticas.solicitudesHoy;
        if (statIngresosMes) statIngresosMes.textContent = `$${estadisticas.ingresosMes.toLocaleString('es-AR')}`;
    }

    /**
     * Muestra una sección específica
     */
    function showSection(section) {
        currentSection = section;

        // Ocultar todas las secciones
        document.querySelectorAll('.section-view').forEach(view => {
            view.classList.add('hidden');
        });

        // Mostrar la sección seleccionada
        const sectionElement = document.getElementById(`section-${section}`);
        if (sectionElement) {
            sectionElement.classList.remove('hidden');
            
            // Cargar datos según la sección
            switch(section) {
                case 'usuarios':
                    renderUsuarios();
                    break;
                case 'planes':
                    renderPlanes();
                    break;
                case 'roles':
                    renderRoles();
                    break;
            }
        }

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Renderiza la lista de usuarios
     */
    function renderUsuarios() {
        const tbody = document.getElementById('usuarios-tbody');
        if (!tbody) return;

        // Actualizar contador
        const countElement = document.getElementById('usuarios-count');
        if (countElement) {
            if (usuarios.length === usuariosOriginal.length) {
                countElement.innerHTML = `Mostrando <strong>${usuarios.length}</strong> usuario${usuarios.length !== 1 ? 's' : ''} en total`;
            } else {
                countElement.innerHTML = `Mostrando <strong>${usuarios.length}</strong> de <strong>${usuariosOriginal.length}</strong> usuarios`;
            }
        }

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500"><i class="fas fa-users text-3xl mb-2 block"></i>No hay usuarios que coincidan con los filtros</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => {
            const estadoClass = usuario.estado === 'activo' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800';
            
            const estadoIcon = usuario.estado === 'activo'
                ? '<i class="fas fa-check-circle mr-1"></i>'
                : '<i class="fas fa-times-circle mr-1"></i>';
            
            const rolBadgeColors = {
                'cliente': 'bg-blue-100 text-blue-800',
                'empresa': 'bg-purple-100 text-purple-800',
                'verificador': 'bg-yellow-100 text-yellow-800',
                'atencion_publico': 'bg-green-100 text-green-800',
                'admin': 'bg-red-100 text-red-800'
            };
            const rolClass = rolBadgeColors[usuario.rol] || 'bg-gray-100 text-gray-800';

            const rolIcons = {
                'cliente': '<i class="fas fa-user mr-1"></i>',
                'empresa': '<i class="fas fa-building mr-1"></i>',
                'verificador': '<i class="fas fa-user-check mr-1"></i>',
                'atencion_publico': '<i class="fas fa-headset mr-1"></i>',
                'admin': '<i class="fas fa-user-shield mr-1"></i>'
            };
            const rolIcon = rolIcons[usuario.rol] || '<i class="fas fa-user mr-1"></i>';

            const rolNames = {
                'cliente': 'Cliente',
                'empresa': 'Empresa',
                'verificador': 'Verificador',
                'atencion_publico': 'Atención Público',
                'admin': 'Administrador'
            };
            const rolName = rolNames[usuario.rol] || usuario.rol;

            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-3 sm:px-4 py-2 sm:py-3">
                        <div class="flex items-center">
                            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-principal-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <span class="text-xs sm:text-sm text-principal-600 font-semibold">${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}</span>
                            </div>
                            <div class="min-w-0">
                                <div class="text-sm sm:text-base font-medium text-gray-900 truncate">${usuario.nombre} ${usuario.apellido}</div>
                                ${usuario.dni ? `<div class="text-xs text-gray-500 truncate">DNI: ${usuario.dni}</div>` : ''}
                            </div>
                        </div>
                    </td>
                    <td class="px-3 sm:px-4 py-2 sm:py-3">
                        <div class="text-xs sm:text-sm text-gray-900 truncate">${usuario.email}</div>
                        ${usuario.telefono ? `<div class="text-xs text-gray-500 truncate"><i class="fas fa-phone mr-1"></i>${usuario.telefono}</div>` : ''}
                    </td>
                    <td class="px-3 sm:px-4 py-2 sm:py-3">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${rolClass} whitespace-nowrap">
                            ${rolIcon}${rolName}
                        </span>
                    </td>
                    <td class="px-3 sm:px-4 py-2 sm:py-3">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${estadoClass} whitespace-nowrap">
                            ${estadoIcon}${usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}
                        </span>
                    </td>
                    <td class="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600">${formatFecha(usuario.fecha_registro)}</td>
                    <td class="px-3 sm:px-4 py-2 sm:py-3 text-center">-3 text-center">
                        <div class="flex items-center justify-center gap-1 sm:gap-2">
                            <button onclick="AdminPanel.editarUsuario(${usuario.id})" 
                                class="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Editar usuario">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button onclick="AdminPanel.eliminarUsuario(${usuario.id})" 
                                class="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                title="Eliminar usuario">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Filtra los usuarios según los criterios seleccionados
     */
    function filtrarUsuarios() {
        const buscar = document.getElementById('filter-usuario-buscar')?.value.toLowerCase() || '';
        const rolFiltro = document.getElementById('filter-usuario-rol')?.value || 'todos';
        const estadoFiltro = document.getElementById('filter-usuario-estado')?.value || 'todos';

        usuarios = usuariosOriginal.filter(usuario => {
            // Filtro de búsqueda (nombre, apellido, email)
            const matchBuscar = !buscar || 
                usuario.nombre.toLowerCase().includes(buscar) ||
                usuario.apellido.toLowerCase().includes(buscar) ||
                usuario.email.toLowerCase().includes(buscar);

            // Filtro de rol
            const matchRol = rolFiltro === 'todos' || usuario.rol === rolFiltro;

            // Filtro de estado
            const matchEstado = estadoFiltro === 'todos' || usuario.estado === estadoFiltro;

            return matchBuscar && matchRol && matchEstado;
        });

        renderUsuarios();
    }

    /**
     * Limpia los filtros de usuarios
     */
    function limpiarFiltrosUsuarios() {
        const filterUsuarioBuscar = document.getElementById('filter-usuario-buscar');
        const filterUsuarioRol = document.getElementById('filter-usuario-rol');
        const filterUsuarioEstado = document.getElementById('filter-usuario-estado');

        if (filterUsuarioBuscar) filterUsuarioBuscar.value = '';
        if (filterUsuarioRol) filterUsuarioRol.value = 'todos';
        if (filterUsuarioEstado) filterUsuarioEstado.value = 'todos';

        usuarios = [...usuariosOriginal];
        renderUsuarios();
    }

    /**
     * Filtra usuarios por rol (para botones rápidos)
     */
    function filtrarPorRol(rol) {
        const filterUsuarioRol = document.getElementById('filter-usuario-rol');
        if (filterUsuarioRol) {
            filterUsuarioRol.value = rol;
            filtrarUsuarios();
        }
    }

    /**
     * Renderiza la lista de planes
     */
    function renderPlanes() {
        const container = document.getElementById('planes-grid');
        if (!container) return;

        if (planes.length === 0) {
            container.innerHTML = '<p class="text-center col-span-3 py-8 text-gray-500">No hay planes configurados</p>';
            return;
        }

        container.innerHTML = planes.map(plan => {
            const typeColors = {
                'HOGAR': 'from-blue-500 to-blue-600',
                'PYME': 'from-green-500 to-green-600',
                'EMPRESARIAL': 'from-purple-500 to-purple-600'
            };
            const gradient = typeColors[plan.type] || 'from-gray-500 to-gray-600';

            return `
                <div class="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${plan.title}</h3>
                        <span class="px-3 py-1 bg-gradient-to-r ${gradient} text-white text-xs font-semibold rounded-full">
                            ${plan.type}
                        </span>
                    </div>
                    
                    <div class="mb-4">
                        <div class="text-3xl font-bold text-principal-600">$${plan.price}</div>
                        <div class="text-sm text-gray-500">por mes</div>
                    </div>
                    
                    <div class="mb-6">
                        <div class="flex items-center text-gray-700">
                            <i class="fas fa-tachometer-alt mr-2 text-principal-600"></i>
                            <span class="font-medium">${plan.speed}</span>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button onclick="AdminPanel.editarPlan('${plan.id}')" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button onclick="AdminPanel.eliminarPlan('${plan.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza la lista de roles
     */
    function renderRoles() {
        const container = document.getElementById('roles-container');
        if (!container) return;

        if (roles.length === 0) {
            container.innerHTML = '<p class="text-center py-8 text-gray-500">No hay roles configurados</p>';
            return;
        }

        container.innerHTML = roles.map(rol => `
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${rol.nombre}</h3>
                        <p class="text-gray-600 mb-4">${rol.descripcion}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-users mr-2"></i>
                            <span>${rol.usuarios} usuario${rol.usuarios !== 1 ? 's' : ''} con este rol</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="AdminPanel.editarRol('${rol.id}')" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${rol.id !== 'admin' ? `
                            <button onclick="AdminPanel.eliminarRol('${rol.id}')" class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Formatea una fecha
     */
    function formatFecha(fecha) {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-AR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric'
        });
    }

    /**
     * Funciones públicas de CRUD de Usuarios
     */
    async function crearUsuario() {
        // Importar FloatingModal dinámicamente
        const { default: FloatingModal } = await import('/js/ui/modal-flotante.js');

        const formHTML = `
            <form id="form-crear-usuario" class="space-y-3 sm:space-y-4">
                <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo de Usuario *</label>
                    <select id="tipo-usuario" name="tipo_usuario" required class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                        <option value="">Seleccionar tipo</option>
                        <option value="cliente">Cliente</option>
                        <option value="verificador">Verificador</option>
                        <option value="atencion_publico">Atención al Público</option>
                    </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" id="crear-nombre" name="nombre" required 
                            class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                    <div>
                        <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input type="text" id="crear-apellido" name="apellido" required 
                            class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                </div>

                <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" id="crear-email" name="email" required 
                        class="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                        <input type="text" id="crear-dni" name="dni" required pattern="[0-9]{7,8}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CUIL</label>
                        <input type="text" id="crear-cuil" name="cuil" pattern="[0-9]{11}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="tel" id="crear-telefono" name="telefono" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                    <input type="password" id="crear-password" name="password" required minlength="8"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    <p class="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                </div>

                <div class="text-xs text-gray-500">
                    * Campos obligatorios
                </div>
            </form>
        `;

        const modal = new FloatingModal({
            title: 'Crear Nuevo Usuario',
            html: formHTML,
            closeOnOverlayClick: false,
            buttons: [
                {
                    label: 'Cancelar',
                    onClick: (ev, modal) => modal.close()
                },
                {
                    label: 'Crear Usuario',
                    primary: true,
                    onClick: async (ev, modal) => {
                        const form = document.getElementById('form-crear-usuario');
                        if (!form.checkValidity()) {
                            form.reportValidity();
                            return;
                        }

                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData);

                        // Sanitizar datos
                        if (window.Sanitizer) {
                            data.nombre = window.Sanitizer.sanitizeName(data.nombre);
                            data.apellido = window.Sanitizer.sanitizeName(data.apellido);
                            data.email = window.Sanitizer.sanitizeEmail(data.email);
                            data.dni = window.Sanitizer.sanitizeDNI(data.dni);
                            if (data.cuil) data.cuil = window.Sanitizer.sanitizeCUIT(data.cuil);
                            if (data.telefono) data.telefono = window.Sanitizer.sanitizePhone(data.telefono);
                        }

                        // Validaciones con Validators
                        if (window.Validators) {
                            const emailRes = window.Validators.validateEmail(data.email);
                            if (!emailRes.valid) {
                                if (window.ErrorModal) {
                                    window.ErrorModal.show(emailRes.message);
                                } else {
                                    alert(emailRes.message);
                                }
                                return;
                            }

                            const dniRes = window.Validators.validateDNI(data.dni);
                            if (!dniRes.valid) {
                                if (window.ErrorModal) {
                                    window.ErrorModal.show(dniRes.message);
                                } else {
                                    alert(dniRes.message);
                                }
                                return;
                            }

                            if (data.cuil) {
                                const cuilRes = window.Validators.validateCUIT(data.cuil);
                                if (!cuilRes.valid) {
                                    if (window.ErrorModal) {
                                        window.ErrorModal.show(cuilRes.message);
                                    } else {
                                        alert(cuilRes.message);
                                    }
                                    return;
                                }
                            }

                            const passRes = window.Validators.validatePassword(data.password);
                            if (!passRes.valid) {
                                if (window.ErrorModal) {
                                    window.ErrorModal.show(passRes.message);
                                } else {
                                    alert(passRes.message);
                                }
                                return;
                            }
                        }

                        // Crear usuario
                        await guardarNuevoUsuario(data, modal);
                    }
                }
            ]
        });

        modal.show();
    }

    /**
     * Guarda un nuevo usuario en el backend o mock
     */
    async function guardarNuevoUsuario(data, modal) {
        try {
            // Mostrar loader
            if (window.LoadingSpinner) {
                window.LoadingSpinner.show();
            }

            // MODO MOCK: Simular creación de usuario
            if (USE_MOCK_DATA) {
                console.log('[AdminPanel] 🎭 MOCK: Creando usuario', data);
                await new Promise(resolve => setTimeout(resolve, 800)); // Simular latencia
                
                // Crear nuevo usuario mock
                const nuevoUsuario = {
                    id: Math.max(...usuarios.map(u => u.id), 0) + 1,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.email,
                    dni: data.dni,
                    cuil: data.cuil || '',
                    telefono: data.telefono || '',
                    rol: data.tipo_usuario,
                    roles: [data.tipo_usuario],
                    estado: 'activo',
                    fecha_registro: new Date().toISOString()
                };
                
                usuarios.push(nuevoUsuario);
                usuariosOriginal.push(nuevoUsuario);
                
                if (window.LoadingSpinner) {
                    window.LoadingSpinner.hide();
                }
                
                modal.close();
                
                if (window.SuccessModal) {
                    window.SuccessModal.show({
                        title: '✅ Usuario creado (MOCK)',
                        message: `El usuario ${data.nombre} ${data.apellido} ha sido creado exitosamente en modo demo.`
                    });
                } else {
                    alert(`✅ Usuario creado: ${data.nombre} ${data.apellido} (MOCK)`);
                }
                
                // Actualizar vista
                if (currentSection === 'usuarios') {
                    renderUsuarios();
                }
                actualizarContadores();
                actualizarEstadisticas();
                return;
            }

            // MODO REAL: Llamar al backend
            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;

            // Preparar datos para el backend
            const payload = {
                nombre: data.nombre,
                apellido: data.apellido,
                email: data.email,
                dni: data.dni,
                cuil: data.cuil || null,
                telefono: data.telefono || null,
                password: data.password,
                rol: data.tipo_usuario,
                activo: true
            };
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(getUrl('usuarios'), {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear usuario');
            }

            const result = await response.json();

            modal.close();

            if (window.SuccessModal) {
                window.SuccessModal.show({
                    title: 'Usuario creado',
                    message: `El usuario ${data.nombre} ${data.apellido} ha sido creado exitosamente.`
                });
            }

            // Recargar lista de usuarios
            await cargarUsuarios();
            if (currentSection === 'usuarios') {
                renderUsuarios();
            }
            actualizarContadores();

        } catch (error) {
            console.error('[AdminPanel] Error al crear usuario:', error);
            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error al crear usuario',
                    message: error.message || 'No se pudo crear el usuario. Intente nuevamente.',
                    type: 'error'
                });
            }
        }
    }

    async function editarUsuario(id) {
        // Buscar usuario
        const usuario = usuarios.find(u => u.id === id);
        if (!usuario) {
            console.error('[AdminPanel] Usuario no encontrado:', id);
            return;
        }

        // Importar FloatingModal dinámicamente
        const { default: FloatingModal } = await import('/js/ui/modal-flotante.js');

        const formHTML = `
            <form id="form-editar-usuario" class="space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-1"></i>
                        Editando: <strong>${usuario.email}</strong>
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" id="editar-nombre" name="nombre" value="${usuario.nombre}" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input type="text" id="editar-apellido" name="apellido" value="${usuario.apellido}" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" id="editar-email" name="email" value="${usuario.email}" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                        <input type="text" id="editar-dni" name="dni" value="${usuario.dni || ''}" pattern="[0-9]{7,8}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">CUIL</label>
                        <input type="text" id="editar-cuil" name="cuil" value="${usuario.cuil || ''}" pattern="[0-9]{11}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="tel" id="editar-telefono" name="telefono" value="${usuario.telefono || ''}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                    <select id="editar-rol" name="rol" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                        <option value="cliente" ${usuario.rol === 'cliente' ? 'selected' : ''}>Cliente</option>
                        <option value="empresa" ${usuario.rol === 'empresa' ? 'selected' : ''}>Empresa</option>
                        <option value="verificador" ${usuario.rol === 'verificador' ? 'selected' : ''}>Verificador</option>
                        <option value="atencion_publico" ${usuario.rol === 'atencion_publico' ? 'selected' : ''}>Atención al Público</option>
                        <option value="admin" ${usuario.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                    <select id="editar-estado" name="estado" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500">
                        <option value="activo" ${usuario.estado === 'activo' ? 'selected' : ''}>Activo</option>
                        <option value="inactivo" ${usuario.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>

                <div class="text-xs text-gray-500">
                    * Campos obligatorios
                </div>
            </form>
        `;

        const modal = new FloatingModal({
            title: 'Editar Usuario',
            html: formHTML,
            closeOnOverlayClick: false,
            buttons: [
                {
                    label: 'Cancelar',
                    onClick: (ev, modal) => modal.close()
                },
                {
                    label: 'Guardar Cambios',
                    primary: true,
                    onClick: async (ev, modal) => {
                        const form = document.getElementById('form-editar-usuario');
                        if (!form.checkValidity()) {
                            form.reportValidity();
                            return;
                        }

                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData);

                        // Sanitizar datos
                        if (window.Sanitizer) {
                            data.nombre = window.Sanitizer.sanitizeName(data.nombre);
                            data.apellido = window.Sanitizer.sanitizeName(data.apellido);
                            data.email = window.Sanitizer.sanitizeEmail(data.email);
                            if (data.dni) data.dni = window.Sanitizer.sanitizeDNI(data.dni);
                            if (data.cuil) data.cuil = window.Sanitizer.sanitizeCUIT(data.cuil);
                            if (data.telefono) data.telefono = window.Sanitizer.sanitizePhone(data.telefono);
                        }

                        // Validar con Validators
                        if (window.Validators) {
                            const emailRes = window.Validators.validateEmail(data.email);
                            if (!emailRes.valid) {
                                if (window.ErrorModal) {
                                    window.ErrorModal.show(emailRes.message);
                                } else {
                                    alert(emailRes.message);
                                }
                                return;
                            }

                            if (data.dni) {
                                const dniRes = window.Validators.validateDNI(data.dni);
                                if (!dniRes.valid) {
                                    if (window.ErrorModal) {
                                        window.ErrorModal.show(dniRes.message);
                                    } else {
                                        alert(dniRes.message);
                                    }
                                    return;
                                }
                            }

                            if (data.cuil) {
                                const cuilRes = window.Validators.validateCUIT(data.cuil);
                                if (!cuilRes.valid) {
                                    if (window.ErrorModal) {
                                        window.ErrorModal.show(cuilRes.message);
                                    } else {
                                        alert(cuilRes.message);
                                    }
                                    return;
                                }
                            }
                        }

                        // Actualizar usuario
                        await actualizarUsuario(id, data, modal);
                    }
                }
            ]
        });

        modal.show();
    }

    /**
     * Actualiza un usuario en el backend o mock
     */
    async function actualizarUsuario(id, data, modal) {
        try {
            // Mostrar loader
            if (window.LoadingSpinner) {
                window.LoadingSpinner.show();
            }

            // MODO MOCK: Simular actualización
            if (USE_MOCK_DATA) {
                console.log('[AdminPanel] 🎭 MOCK: Actualizando usuario', id, data);
                await new Promise(resolve => setTimeout(resolve, 600)); // Simular latencia
                
                // Buscar y actualizar usuario en arrays
                const index = usuarios.findIndex(u => u.id === id);
                const indexOriginal = usuariosOriginal.findIndex(u => u.id === id);
                
                if (index !== -1) {
                    usuarios[index] = {
                        ...usuarios[index],
                        nombre: data.nombre,
                        apellido: data.apellido,
                        email: data.email,
                        dni: data.dni || usuarios[index].dni,
                        cuil: data.cuil || usuarios[index].cuil,
                        telefono: data.telefono || usuarios[index].telefono,
                        rol: data.rol,
                        estado: data.estado
                    };
                }
                
                if (indexOriginal !== -1) {
                    usuariosOriginal[indexOriginal] = {
                        ...usuariosOriginal[indexOriginal],
                        nombre: data.nombre,
                        apellido: data.apellido,
                        email: data.email,
                        dni: data.dni || usuariosOriginal[indexOriginal].dni,
                        cuil: data.cuil || usuariosOriginal[indexOriginal].cuil,
                        telefono: data.telefono || usuariosOriginal[indexOriginal].telefono,
                        rol: data.rol,
                        estado: data.estado
                    };
                }
                
                if (window.LoadingSpinner) {
                    window.LoadingSpinner.hide();
                }
                
                modal.close();
                
                if (window.SuccessModal) {
                    window.SuccessModal.show({
                        title: '✅ Usuario actualizado (MOCK)',
                        message: `Los datos de ${data.nombre} ${data.apellido} han sido actualizados exitosamente en modo demo.`
                    });
                } else {
                    alert(`✅ Usuario actualizado: ${data.nombre} ${data.apellido} (MOCK)`);
                }
                
                // Actualizar vista
                if (currentSection === 'usuarios') {
                    renderUsuarios();
                }
                actualizarContadores();
                actualizarEstadisticas();
                return;
            }

            // MODO REAL: Llamar al backend
            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;

            // Preparar datos para el backend
            const payload = {
                nombre: data.nombre,
                apellido: data.apellido,
                email: data.email,
                dni: data.dni || null,
                cuil: data.cuil || null,
                telefono: data.telefono || null,
                rol: data.rol,
                activo: data.estado === 'activo'
            };
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(getUrl('usuarioById').replace(':id', id), {
                method: 'PUT',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar usuario');
            }

            modal.close();

            if (window.SuccessModal) {
                window.SuccessModal.show({
                    title: 'Usuario actualizado',
                    message: `Los datos de ${data.nombre} ${data.apellido} han sido actualizados exitosamente.`
                });
            }

            // Recargar lista de usuarios
            await cargarUsuarios();
            if (currentSection === 'usuarios') {
                renderUsuarios();
            }
            actualizarContadores();

        } catch (error) {
            console.error('[AdminPanel] Error al actualizar usuario:', error);
            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error al actualizar usuario',
                    message: error.message || 'No se pudo actualizar el usuario. Intente nuevamente.',
                    type: 'error'
                });
            }
        }
    }

    async function eliminarUsuario(id) {
        // Buscar usuario
        const usuario = usuarios.find(u => u.id === id);
        if (!usuario) {
            console.error('[AdminPanel] Usuario no encontrado:', id);
            return;
        }

        // Importar FloatingModal dinámicamente
        const { default: FloatingModal } = await import('/js/ui/modal-flotante.js');

        const confirmHTML = `
            <div class="text-center py-4">
                <div class="mb-4">
                    <i class="fas fa-exclamation-triangle text-5xl text-red-500"></i>
                </div>
                <p class="text-gray-700 mb-2">¿Está seguro de eliminar al usuario:</p>
                <p class="font-bold text-gray-900 text-lg">${usuario.nombre} ${usuario.apellido}</p>
                <p class="text-gray-600 text-sm">${usuario.email}</p>
                <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-sm text-red-800">
                        <i class="fas fa-warning mr-1"></i>
                        Esta acción no se puede deshacer
                    </p>
                </div>
            </div>
        `;

        const modal = new FloatingModal({
            title: 'Confirmar Eliminación',
            html: confirmHTML,
            closeOnOverlayClick: false,
            buttons: [
                {
                    label: 'Cancelar',
                    onClick: (ev, modal) => modal.close()
                },
                {
                    label: 'Eliminar Usuario',
                    className: 'flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                    onClick: async (ev, modal) => {
                        await ejecutarEliminacionUsuario(id, modal);
                    }
                }
            ]
        });

        modal.show();
    }

    /**
     * Ejecuta la eliminación de un usuario (backend o mock)
     */
    async function ejecutarEliminacionUsuario(id, modal) {
        try {
            // Mostrar loader
            if (window.LoadingSpinner) {
                window.LoadingSpinner.show();
            }

            // MODO MOCK: Simular eliminación
            if (USE_MOCK_DATA) {
                console.log('[AdminPanel] 🎭 MOCK: Eliminando usuario', id);
                await new Promise(resolve => setTimeout(resolve, 500)); // Simular latencia
                
                // Eliminar de ambos arrays
                usuarios = usuarios.filter(u => u.id !== id);
                usuariosOriginal = usuariosOriginal.filter(u => u.id !== id);
                
                if (window.LoadingSpinner) {
                    window.LoadingSpinner.hide();
                }
                
                modal.close();
                
                if (window.SuccessModal) {
                    window.SuccessModal.show({
                        title: '🗑️ Usuario eliminado (MOCK)',
                        message: 'El usuario ha sido eliminado exitosamente del modo demo.'
                    });
                } else {
                    alert('🗑️ Usuario eliminado exitosamente (MOCK)');
                }
                
                // Actualizar vista
                if (currentSection === 'usuarios') {
                    renderUsuarios();
                }
                actualizarContadores();
                actualizarEstadisticas();
                return;
            }

            // MODO REAL: Llamar al backend
            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(getUrl('usuarioById').replace(':id', id), {
                method: 'DELETE',
                credentials: 'include',
                headers: headers
            });

            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar usuario');
            }

            modal.close();

            if (window.SuccessModal) {
                window.SuccessModal.show({
                    title: 'Usuario eliminado',
                    message: 'El usuario ha sido eliminado exitosamente.'
                });
            }

            // Recargar lista de usuarios
            await cargarUsuarios();
            if (currentSection === 'usuarios') {
                renderUsuarios();
            }
            actualizarContadores();

        } catch (error) {
            console.error('[AdminPanel] Error al eliminar usuario:', error);
            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error al eliminar usuario',
                    message: error.message || 'No se pudo eliminar el usuario. Intente nuevamente.',
                    type: 'error'
                });
            }
        }
    }

    function crearPlan() {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Crear Plan',
                message: 'La función de crear plan estará disponible próximamente.',
                type: 'info'
            });
        }
    }

    function editarPlan(id) {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Editar Plan',
                message: `Editando plan: ${id}. Esta función estará disponible próximamente.`,
                type: 'info'
            });
        }
    }

    function eliminarPlan(id) {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Eliminar Plan',
                message: `¿Está seguro de eliminar el plan: ${id}?`,
                type: 'warning'
            });
        }
    }

    function crearRol() {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Crear Rol',
                message: 'La función de crear rol estará disponible próximamente.',
                type: 'info'
            });
        }
    }

    function editarRol(id) {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Editar Rol',
                message: `Editando rol: ${id}. Esta función estará disponible próximamente.`,
                type: 'info'
            });
        }
    }

    function eliminarRol(id) {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                title: 'Eliminar Rol',
                message: `¿Está seguro de eliminar el rol: ${id}?`,
                type: 'warning'
            });
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
        init,
        showSection,
        crearUsuario,
        editarUsuario,
        eliminarUsuario,
        filtrarPorRol,
        crearPlan,
        editarPlan,
        eliminarPlan,
        crearRol,
        editarRol,
        eliminarRol,
        // Debug helpers
        _getMockStatus: () => USE_MOCK_DATA,
        _getUsuarios: () => usuarios,
        _recargarUsuarios: cargarUsuarios
    };
})();

// Exponer globalmente
window.AdminPanel = AdminPanel;

// Console helpers para desarrollo
console.log('%c[AdminPanel] 🎭 Modo Mock disponible', 'color: #f59e0b; font-weight: bold');
console.log('%cPara verificar el modo mock actual:', 'color: #8b5cf6');
console.log('  AdminPanel._getMockStatus()');
console.log('%cPara ver usuarios cargados:', 'color: #8b5cf6');
console.log('  AdminPanel._getUsuarios()');
console.log('%cPara recargar usuarios:', 'color: #8b5cf6');
console.log('  AdminPanel._recargarUsuarios()');
