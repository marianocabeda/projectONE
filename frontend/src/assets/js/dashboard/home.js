/**
 * Home Dinámico - Sistema de Dashboard Personalizado por Rol
 * Detecta el rol del usuario y renderiza un home específico
 */

(function () {
    'use strict';

    // Configuración de contenido por rol
    const ROLE_CONFIGS = {
        admin: {
            title: '¡Bienvenido, Administrador!',
            subtitle: 'Panel de control y administración del sistema',
            showViewSwitcher: false,
            cards: [
                {
                    title: 'Usuarios',
                    icon: 'fa-users',
                    count: '0',
                    label: 'Usuarios registrados',
                    gradient: 'from-principal-500 to-principal-600',
                    endpoint: 'adminStatsUsuarios'
                },
                {
                    title: 'Solicitudes',
                    icon: 'fa-clipboard-list',
                    count: '0',
                    label: 'Pendientes de revisión',
                    gradient: 'from-tarjeta-amarillo-400 to-tarjeta-amarillo-500',
                    endpoint: 'adminStatsSolicitudes'
                },
                {
                    title: 'Conexiones',
                    icon: 'fa-wifi',
                    count: '0',
                    label: 'Activas en el sistema',
                    gradient: 'from-tarjeta-verde-400 to-tarjeta-verde-500',
                    endpoint: 'adminStatsConexiones'
                },
                {
                    title: 'Ingresos del Mes',
                    icon: 'fa-dollar-sign',
                    count: '$0',
                    label: 'Facturación mensual',
                    gradient: 'from-tarjeta-azul-400 to-tarjeta-azul-500',
                    endpoint: 'adminStatsIngresos'
                }
            ],
            quickActions: [
                { title: 'Panel de Administración', url: '/admin-panel', icon: 'fa-cogs' },
                { title: 'Gestionar Usuarios', url: '/admin-panel', icon: 'fa-users-cog' },
                { title: 'Ver Solicitudes', url: '/historial-solicitudes', icon: 'fa-history' }
            ]
        },
        verificador: {
            title: '¡Bienvenido, Verificador!',
            subtitle: 'Gestiona y verifica solicitudes de conexión',
            showViewSwitcher: false,
            cards: [
                {
                    title: 'En Cola',
                    icon: 'fa-clock',
                    count: '0',
                    label: 'Solicitudes pendientes',
                    gradient: 'from-tarjeta-amarillo-400 to-tarjeta-amarillo-500',
                    endpoint: 'verificadorStatsPendientes'
                },
                {
                    title: 'Verificadas Hoy',
                    icon: 'fa-check-circle',
                    count: '0',
                    label: 'Aprobadas',
                    gradient: 'from-tarjeta-verde-400 to-tarjeta-verde-500',
                    endpoint: 'verificadorStatsAprobadas'
                },
                {
                    title: 'Rechazadas',
                    icon: 'fa-times-circle',
                    count: '0',
                    label: 'Con observaciones',
                    gradient: 'from-red-400 to-red-500',
                    endpoint: 'verificadorStatsRechazadas'
                },
                {
                    title: 'Total Procesadas',
                    icon: 'fa-list-check',
                    count: '0',
                    label: 'Este mes',
                    gradient: 'from-tarjeta-azul-400 to-tarjeta-azul-500',
                    endpoint: 'verificadorStatsTotales'
                }
            ],
            quickActions: [
                { title: 'Cola de Solicitudes', url: '/solicitudes-cola', icon: 'fa-clipboard-list' },
                { title: 'Historial', url: '/historial-solicitudes', icon: 'fa-history' },
                { title: 'Reportes', url: '/admin-panel', icon: 'fa-chart-line' }
            ]
        },
        atencion: {
            title: '¡Bienvenido, Atención al Público!',
            subtitle: 'Asiste a clientes y gestiona servicios',
            showViewSwitcher: false,
            cards: [
                {
                    title: 'Atenciones Hoy',
                    icon: 'fa-users',
                    count: '0',
                    label: 'Clientes atendidos',
                    gradient: 'from-principal-500 to-principal-600',
                    endpoint: 'atencionStatsAtenciones'
                },
                {
                    title: 'Nuevas Conexiones',
                    icon: 'fa-user-plus',
                    count: '0',
                    label: 'Registradas hoy',
                    gradient: 'from-tarjeta-verde-400 to-tarjeta-verde-500',
                    endpoint: 'atencionStatsNuevas'
                },
                {
                    title: 'Cambios de Plan',
                    icon: 'fa-exchange-alt',
                    count: '0',
                    label: 'Procesados hoy',
                    gradient: 'from-tarjeta-azul-400 to-tarjeta-azul-500',
                    endpoint: 'atencionStatsCambios'
                },
                {
                    title: 'Soporte',
                    icon: 'fa-headset',
                    count: '0',
                    label: 'Tickets gestionados',
                    gradient: 'from-tarjeta-amarillo-400 to-tarjeta-amarillo-500',
                    endpoint: 'atencionStatsSoporte'
                }
            ],
            quickActions: [
                { title: 'Panel de Atención', url: '/atencion-panel', icon: 'fa-user-tie' },
                { title: 'Nueva Conexión', url: '/atencion-nuevas-conexiones', icon: 'fa-user-plus' }
            ]
        },
        cliente: {
            title: '¡Bienvenido a tu Dashboard!',
            subtitle: 'Desde acá podés gestionar tus servicios.',
            showViewSwitcher: true,
            cards: [
                {
                    title: 'Mis Conexiones',
                    icon: 'fa-wifi',
                    count: '2',
                    label: 'Conexiones activas',
                    gradient: 'from-tarjeta-amarillo-400 to-tarjeta-amarillo-500',
                    endpoint: null // Hardcoded para cliente
                },
                {
                    title: 'Facturas',
                    icon: 'fa-file-invoice-dollar',
                    count: '1',
                    label: 'Factura pendiente',
                    gradient: 'from-tarjeta-verde-400 to-tarjeta-verde-500',
                    endpoint: null
                },
                {
                    title: 'Soporte',
                    icon: 'fa-headset',
                    count: '0',
                    label: 'Tickets abiertos',
                    gradient: 'from-tarjeta-azul-400 to-tarjeta-azul-500',
                    endpoint: null
                }
            ],
            quickActions: [
                { title: 'Mis Conexiones', url: '/conexiones', icon: 'fa-wifi' },
                { title: 'Ver Facturas', url: '/facturas', icon: 'fa-file-invoice' },
                { title: 'Soporte', url: '/soporte', icon: 'fa-life-ring' }
            ]
        }
    };

    /**
     * Inicializa el home dinámico
     */
    async function init(retries = 3) {
        console.log('🏠 Inicializando Home Dinámico...');

        const container = document.getElementById('page-content');
        if (!container) {
            if (retries > 0) {
                console.warn(`⚠️ #page-content no encontrado, reintentando (${retries} restantes)...`);
                setTimeout(() => init(retries - 1), 100);
                return;
            }
            console.error('❌ No se encontró el contenedor #page-content después de varios intentos');
            return;
        }

        try {
            // Detectar rol del usuario
            const role = detectUserRole();

            // Si es null (atencion), ya se redirigió, no hacer nada más
            if (role === null) {
                return;
            }

            console.log(`📋 Rol detectado: ${role}`);

            // Obtener configuración del rol
            const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.cliente;

            // Renderizar el home
            renderHome(config, role);

            // Cargar nombre de usuario
            loadUserName();

            console.log('✅ Home Dinámico inicializado');
        } catch (error) {
            console.error('❌ Error fatal en init de Home:', error);
            container.innerHTML = `<div class="text-center text-red-500 p-4">Error al cargar el dashboard: ${error.message}</div>`;
        }
    }

    /**
     * Detecta el rol del usuario desde RoleManager
     * Nota: Atención no usa home dinámico, redirige a su panel
     */
    function detectUserRole() {
        if (!window.RoleManager) {
            console.warn('RoleManager no disponible, usando rol cliente por defecto');
            return 'cliente';
        }

        window.RoleManager.init();

        // Si es atención, redirigir a su panel
        if (window.RoleManager.isAtencionPublico()) {
            console.log('👔 Rol atención detectado, redirigiendo a panel...');
            if (window.loadContent) {
                window.loadContent('/atencion-panel');
            } else {
                window.location.href = '/dashboard';
            }
            return null; // No renderizar home
        }

        if (window.RoleManager.isAdmin()) return 'admin';
        if (window.RoleManager.isVerificador()) return 'verificador';

        return 'cliente';
    }

    /**
     * Renderiza el home según la configuración
     */
    function renderHome(config, role) {
        const container = document.getElementById('page-content');
        if (!container) {
            console.error('No se encontró el contenedor #page-content');
            return;
        }

        // Construir HTML
        let html = `
            <section class="md:bg-white md:dark:bg-dark-bg-card md:p-4 sm:md:p-6 lg:p-8 md:rounded-xl md:border md:border-gray-200 md:dark:border-dark-border-primary md:shadow-sm md:transition-colors">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-dark-text-primary mb-2">${config.title}</h1>
                        <p class="text-sm sm:text-base md:text-lg text-gray-600 dark:text-dark-text-secondary">Hola, <span data-user-name aria-live="polite"></span>. ${config.subtitle}</p>
                    </div>
                    ${config.showViewSwitcher ? renderViewSwitcher() : ''}
                </div>

                <!-- Contenido Principal -->
                <div id="main-content">
                    ${renderCards(config.cards)}
                </div>

                <!-- Acciones Rápidas -->
                ${config.quickActions ? renderQuickActions(config.quickActions) : ''}
            </section>
        `;

        container.innerHTML = html;

        // Si es cliente, inicializar view switcher
        if (config.showViewSwitcher) {
            initializeViewSwitcher();
        }

        // Cargar estadísticas dinámicas
        loadStats(config.cards);

        // Agregar event listeners a las acciones rápidas
        setupQuickActionsListeners();
    }

    /**
     * Renderiza el view switcher (solo para clientes)
     */
    function renderViewSwitcher() {
        return `
            <div class="relative inline-block text-left w-full sm:w-auto mt-4 sm:mt-0">
                <div>
                    <button type="button" class="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-dark-border-primary shadow-sm px-3 sm:px-4 py-2 bg-white dark:bg-dark-bg-card text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-dark-bg-primary focus:ring-principal-500 dark:focus:ring-dark-principal-600 transition-colors" id="menu-button" aria-expanded="false" aria-haspopup="true">
                        <span id="current-view-label">Vista: Particular</span>
                        <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div id="view-switcher-options" class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg dark:shadow-black/50 bg-white dark:bg-dark-bg-card ring-1 ring-black ring-opacity-5 dark:ring-dark-border-primary border border-transparent dark:border-dark-border-primary focus:outline-none hidden z-50 transition-colors" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
                    <div class="py-1" role="none">
                        <a href="#" data-view="particular" class="text-gray-700 dark:text-dark-text-primary block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors view-option" role="menuitem" tabindex="-1">
                            <i class="fas fa-user mr-2"></i>Vista: Particular
                        </a>
                        <a href="#" data-view="empresa" class="text-gray-700 dark:text-dark-text-primary block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors view-option" role="menuitem" tabindex="-1">
                            <i class="fas fa-building mr-2"></i>Vista: Empresa
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza las tarjetas de estadísticas
     */
    function renderCards(cards) {
        const cardsHtml = cards.map(card => `
            <div class="bg-gradient-to-br ${card.gradient} rounded-xl p-4 sm:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 class="text-base sm:text-lg font-semibold">${card.title}</h3>
                    <i class="fas ${card.icon} text-xl sm:text-2xl opacity-75"></i>
                </div>
                <p class="text-2xl sm:text-3xl font-bold mb-2" data-stat="${card.title}">${card.count}</p>
                <p class="text-white text-opacity-90 text-xs sm:text-sm">${card.label}</p>
            </div>
        `).join('');

        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(cards.length, 4)} gap-4 sm:gap-6 mt-4 sm:mt-6">
                ${cardsHtml}
            </div>
        `;
    }

    /**
     * Renderiza las acciones rápidas
     */
    function renderQuickActions(actions) {
        if (!actions || actions.length === 0) return '';

        const actionsHtml = actions.map(action => {
            const page = (action.url || '').split('/').filter(Boolean).pop() || '';
            return `
            <a href="${action.url}" data-page="${page}" class="quick-action-link flex items-center p-3 sm:p-4 bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-hover hover:border-principal-500 dark:hover:border-dark-principal-600 transition-all active:scale-95">
                <div class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-principal-100 dark:bg-dark-principal-900/20 rounded-full flex items-center justify-center mr-3">
                    <i class="fas ${action.icon} text-sm sm:text-base text-principal-600 dark:text-dark-principal-600"></i>
                </div>
                <span class="text-sm sm:text-base text-gray-800 dark:text-dark-text-primary font-medium">${action.title}</span>
            </a>
        `}).join('');

        return `
            <div class="mt-6 sm:mt-8">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-3 sm:mb-4">Acciones Rápidas</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Carga el nombre del usuario (solo si no está en caché)
     */
    async function loadUserName() {
        const elements = document.querySelectorAll('[data-user-name]');
        if (elements.length === 0) return;

        // SOLO usar caché - NO hacer llamadas al backend
        // El caché se pobla desde inicio-usuario.js o usuario.js
        if (window.CacheManager) {
            const cachedData = window.CacheManager.get('user:profile');
            if (cachedData) {
                console.log('✅ home.js: Usando datos cacheados');
                const displayName = [cachedData.nombre, cachedData.apellido].filter(Boolean).join(' ') ||
                    cachedData.email || 'Usuario';
                elements.forEach(el => el.textContent = displayName);
                return;
            }
        }

        // Si no hay caché, mostrar placeholder
        // Los datos se cargarán desde inicio-usuario.js
        console.log('⚠️ home.js: No hay datos en caché, mostrando placeholder');
        elements.forEach(el => el.textContent = 'Usuario');
    }

    /**
     * Carga las estadísticas dinámicas desde los endpoints
     */
    async function loadStats(cards) {
        // Obtener token para Authorization header
        const token = window.AuthToken?.getToken?.() || null;

        for (const card of cards) {
            if (!card.endpoint) continue; // Skip hardcoded values

            try {
                // Usar AppConfig para obtener la URL completa
                const url = window.AppConfig?.getUrl(card.endpoint) || card.endpoint;

                const headers = {
                    'Accept': 'application/json'
                };
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: headers
                });

                if (!response.ok) continue;

                const data = await response.json();
                const value = data.success ? data.data : data.count || data.total || '0';

                // Actualizar el elemento
                const element = document.querySelector(`[data-stat="${card.title}"]`);
                if (element) {
                    element.textContent = value;
                }
            } catch (error) {
                console.warn(`Error al cargar estadística "${card.title}":`, error);
            }
        }
    }

    /**
     * Inicializa el view switcher para clientes
     */
    function initializeViewSwitcher() {
        const menuButton = document.getElementById('menu-button');
        const dropdown = document.getElementById('view-switcher-options');
        const currentViewLabel = document.getElementById('current-view-label');

        if (!menuButton || !dropdown) return;

        // Cargar vista guardada
        const currentView = window.ViewManager?.init() || 'particular';
        updateViewLabel(currentView, currentViewLabel);

        // Toggle dropdown
        menuButton.addEventListener('click', () => {
            dropdown.classList.toggle('hidden');
        });

        // Cambiar vista
        document.querySelectorAll('.view-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const viewType = option.getAttribute('data-view');
                window.ViewManager?.setView(viewType);
                updateViewLabel(viewType, currentViewLabel);
                dropdown.classList.add('hidden');

                // TODO: Implementar cambio de contenido entre particular y empresa
                console.log(`Vista cambiada a: ${viewType}`);
            });
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (!menuButton.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    /**
     * Actualiza el label del view switcher
     */
    function updateViewLabel(viewType, labelElement) {
        if (!labelElement) return;

        if (viewType === 'empresa') {
            labelElement.innerHTML = '<i class="fas fa-building mr-2"></i>Vista: Empresa';
        } else {
            labelElement.innerHTML = '<i class="fas fa-user mr-2"></i>Vista: Particular';
        }
    }

    /**
     * Configura listeners para las acciones rápidas
     */
    function setupQuickActionsListeners() {
        const quickActionLinks = document.querySelectorAll('.quick-action-link');
        if (quickActionLinks.length === 0) return;

        quickActionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const page = link.getAttribute('data-page');

                console.log('🔗 Click en acción rápida:', { href, page });

                if (!href) return;

                // Usar window.loadContent si está disponible
                if (window.loadContent && typeof window.loadContent === 'function') {
                    window.loadContent(href);

                    // Actualizar el estado activo del menú lateral
                    setTimeout(() => {
                        updateSidebarActiveState(href, page);
                    }, 100);
                } else {
                    console.warn('⚠️ window.loadContent no disponible, usando navegación normal');
                    window.location.href = href;
                }
            });
        });
    }

    /**
     * Actualiza el estado activo del menú lateral
     */
    function updateSidebarActiveState(href, page) {
        try {
            const aside = document.querySelector('aside');
            if (!aside) return;

            // Desactivar todos los enlaces
            const allLinks = aside.querySelectorAll('a');
            allLinks.forEach(link => {
                link.classList.remove('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                link.classList.add('text-gray-500', 'font-medium');
            });

            // Buscar y activar el enlace correspondiente
            let targetLink = null;

            // Primero intentar por data-page
            if (page) {
                targetLink = aside.querySelector(`a[data-page="${page}"]`);
            }

            // Si no se encuentra, buscar por href
            if (!targetLink && href) {
                targetLink = aside.querySelector(`a[href="${href}"]`);
            }

            if (targetLink) {
                console.log('✅ Activando enlace del sidebar:', targetLink.textContent.trim());
                targetLink.classList.add('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                targetLink.classList.remove('text-gray-500', 'font-medium');

                // Si está en un submenú de ajustes, abrirlo
                const parentGroup = targetLink.closest('li[data-group]');
                if (parentGroup && parentGroup.getAttribute('data-group').startsWith('ajustes')) {
                    const mainButton = parentGroup.querySelector('button');
                    const submenu = parentGroup.querySelector('ul');
                    const arrow = parentGroup.querySelector('svg');

                    if (mainButton) {
                        mainButton.classList.add('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                        mainButton.classList.remove('text-gray-500', 'font-medium');
                    }
                    if (submenu) {
                        submenu.classList.remove('hidden');
                    }
                    if (arrow) {
                        arrow.classList.add('rotate-180');
                    }
                }
            } else {
                console.warn('⚠️ No se encontró enlace en el sidebar para:', { href, page });
            }
        } catch (error) {
            console.error('❌ Error actualizando estado del sidebar:', error);
        }
    }

    // Exponer API pública
    window.HomeManager = {
        init,
        detectUserRole
    };

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
