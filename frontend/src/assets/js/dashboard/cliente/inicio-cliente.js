/**
 * Dashboard del Cliente
 * Gestiona la interfaz principal y navegación entre módulos
 */

(function() {
    'use strict';

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
            { src: '/js/ui/spinner-carga.js', global: 'LoadingSpinner' },
            { src: '/js/utils/selector-personalizado.js', global: 'CustomSelect' }
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

    async function init() {
        console.log('🎯 Inicializando Dashboard del Cliente...');

        // Cargar scripts de UI
        await cargarScriptsNecesarios();

        // Cargar nombre del cliente
        loadClientInfo();

        // Adjust UI for small screens (add a module select dropdown)
        setupMobileModuleSelector();

        // Configurar listeners de módulos
        setupModuleListeners();

        console.log('✅ Dashboard del Cliente inicializado correctamente');
    }

    /**
     * Return true when viewport is small (mobile)
     */
    function isSmallScreen() {
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    }

    /**
     * If we're on mobile, inject a custom select to allow choosing a module without scrolling
     */
    function setupMobileModuleSelector() {
        try {
            if (!isSmallScreen()) return;

            // avoid duplicate
            if (document.getElementById('cliente-module-select-btn')) return;

            const headerCard = document.querySelector('.dashboard-card');
            if (!headerCard) return;

            // Crear estructura para CustomSelect
            const selectWrap = document.createElement('div');
            selectWrap.className = 'block md:hidden mt-4';
            selectWrap.innerHTML = `
                <label class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    Acceso Rápido
                </label>
                <div class="relative">
                    <button type="button" id="cliente-module-select-btn"
                            class="flex items-center justify-between w-full text-left px-4 py-2.5 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 transition-colors" 
                            aria-haspopup="listbox" aria-expanded="false"> 
                        <span class="module-select-label text-gray-900 dark:text-dark-text-primary">Seleccione un módulo...</span>
                        <span class="module-select-chevron text-gray-400 dark:text-dark-text-tertiary">⌄</span>
                    </button>
                    <div id="cliente-module-select-overlay" class="hidden"></div>
                </div>
            `;

            headerCard.appendChild(selectWrap);

            // Esperar a que CustomSelect esté disponible
            const initCustomSelect = () => {
                if (!window.CustomSelect) {
                    console.warn('⚠️ CustomSelect no disponible aún, reintentando...');
                    setTimeout(initCustomSelect, 100);
                    return;
                }

                // Recolectar módulos desde las tarjetas
                const modules = [];
                document.querySelectorAll('[data-module]').forEach(card => {
                    const id = card.getAttribute('data-module') || card.dataset.module;
                    const nombre = card.querySelector('h3')?.textContent?.trim() || id;
                    if (id) {
                        modules.push({ id, nombre });
                    }
                });

                // Crear el selector personalizado
                const moduleSelect = window.CustomSelect.create({
                    buttonId: 'cliente-module-select-btn',
                    overlayId: 'cliente-module-select-overlay',
                    placeholder: 'Seleccione un módulo...',
                    labelClass: 'module-select-label',
                    chevronClass: 'module-select-chevron',
                    onSelect: (item) => {
                        console.log('📦 Módulo seleccionado:', item.id);
                        loadModule(item.id);
                        // Resetear el selector después de la navegación
                        setTimeout(() => {
                            moduleSelect.reset();
                        }, 300);
                    }
                });

                if (moduleSelect) {
                    moduleSelect.populate(modules);
                    console.log('✅ CustomSelect inicializado con', modules.length, 'módulos');
                } else {
                    console.error('❌ Error al crear CustomSelect');
                }
            };

            // Inicializar después de un pequeño delay para asegurar que el script esté cargado
            setTimeout(initCustomSelect, 200);
        } catch (err) {
            console.warn('setupMobileModuleSelector failed', err);
        }
    }

    /**
     * Carga información del cliente actual
     */
    function loadClientInfo() {
        try {
            // Intentar obtener datos del caché primero
            if (window.CacheManager) {
                const cachedData = window.CacheManager.get('user:profile');
                if (cachedData) {
                    const displayName = [cachedData.nombre, cachedData.apellido].filter(Boolean).join(' ') ||
                        cachedData.email || 'Cliente';
                    
                    const clientNameEl = document.getElementById('client-name');
                    if (clientNameEl) {
                        clientNameEl.textContent = displayName;
                    }
                    
                    console.log('✅ Información del cliente cargada desde caché');
                    return;
                }
            }

            // Fallback: intentar desde JWT
            if (window.AuthToken && typeof window.AuthToken.getToken === 'function') {
                const token = window.AuthToken.getToken();
                if (token) {
                    const payload = parseJWT(token);
                    if (payload) {
                        const clientName = payload.nombre || payload.email || 'Cliente';
                        const clientNameEl = document.getElementById('client-name');
                        if (clientNameEl) {
                            clientNameEl.textContent = clientName;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error al cargar información del cliente:', error);
        }
    }

    /**
     * Parsea un JWT y devuelve el payload
     */
    function parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error al parsear JWT:', error);
            return null;
        }
    }

    /**
     * Configura listeners para los módulos
     */
    function setupModuleListeners() {
        // Escuchar clics en las tarjetas de módulos
        document.querySelectorAll('[data-module]').forEach(card => {
            card.addEventListener('click', function() {
                const moduleName = this.getAttribute('data-module');
                loadModule(moduleName);
            });
        });
    }

    /**
     * Carga un módulo específico
     */
    function loadModule(moduleName) {
        console.log(`📦 Cargando módulo: ${moduleName}`);

        let url;
        let dataPage;
        
        switch (moduleName) {
            case 'perfil':
                url = '/usuario';
                dataPage = 'usuario';
                break;
            case 'conexiones':
                url = '/conexiones';
                dataPage = 'conexiones';
                break;
            case 'facturas':
                url = '/facturas';
                dataPage = 'facturas';
                break;
            case 'promociones':
                url = '/promociones';
                dataPage = 'promociones';
                break;
            case 'soporte':
                url = '/soporte';
                dataPage = 'soporte';
                break;
            case 'cambiar-contrasena':
                url = '/cambiar-contrasena';
                dataPage = 'cambiar-contrasena';
                break;
            default:
                console.error('Módulo no reconocido:', moduleName);
                if (window.ErrorModal) {
                    window.ErrorModal.show('Módulo no encontrado');
                }
                return;
        }

        // Usar loadContent si está disponible (desde dashboard.js)
        if (window.loadContent && typeof window.loadContent === 'function') {
            window.loadContent(url);
            
            // Actualizar el estado activo del menú lateral
            setTimeout(() => {
                updateSidebarActiveState(url, dataPage);
            }, 100);
        } else {
            console.error('loadContent no está disponible');
            if (window.ErrorModal) {
                window.ErrorModal.show('Error en el sistema de navegación');
            }
            // Fallback: navegar al shell del dashboard
            try {
                window.location.href = '/dashboard';
            } catch (err) {
                console.error('No se pudo navegar:', err);
                if (window.ErrorHandler) {
                    window.ErrorHandler.handleError(err, 'Error de navegación');
                }
            }
        }
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

    /**
     * Función de limpieza al salir del dashboard
     */
    function cleanup() {
        console.log('🧹 Limpiando Dashboard del Cliente...');
        // Limpiar listeners si es necesario
    }

    // Exponer funciones públicas
    window.HomeClient = {
        init,
        cleanup
    };

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();