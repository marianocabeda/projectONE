/**
 * Panel de Atención al Público
 * Gestiona la interfaz principal y navegación entre módulos
 */

(function() {
    'use strict';

    let stats = {
        nuevas: 0,
        modificaciones: 0,
        soporte: 0,
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
        console.log('🎯 Inicializando Panel de Atención al Público...');

        // Cargar scripts de UI
        await cargarScriptsNecesarios();

        // Cargar nombre del operador
        loadOperatorInfo();

        // Cargar estadísticas de la sesión
        loadSessionStats();

        // Adjust UI for small screens (add a module select dropdown)
        setupMobileModuleSelector();

        // Configurar listeners de módulos
        setupModuleListeners();

        console.log('✅ Panel de Atención inicializado correctamente');
    }

    /**
     * Return true when viewport is small (mobile)
     */
    function isSmallScreen() {
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    }

    /**
     * If we're on mobile, inject a simple select to allow choosing a module without scrolling
     */
    function setupMobileModuleSelector() {
        try {
            if (!isSmallScreen()) return;

            // avoid duplicate
            if (document.getElementById('atencion-module-select')) return;

            const headerCard = document.querySelector('.dashboard-card');
            if (!headerCard) return;

            const selectWrap = document.createElement('div');
            selectWrap.className = 'block md:hidden mt-4';
            selectWrap.innerHTML = `<label class="sr-only" for="atencion-module-select">Seleccionar Módulo</label>
                <select id="atencion-module-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Ir a módulo...</option>
                </select>`;

            headerCard.appendChild(selectWrap);

            const select = selectWrap.querySelector('select');
            // collect module options from grid cards
            document.querySelectorAll('[data-module]').forEach(card => {
                const name = card.getAttribute('data-module') || card.dataset.module;
                const label = card.querySelector('h3')?.textContent?.trim() || name;
                if (name) select.appendChild(new Option(label, name));
            });

            select.addEventListener('change', () => {
                if (!select.value) return;
                loadModule(select.value);
            });
        } catch (err) {
            console.warn('setupMobileModuleSelector failed', err);
        }
    }

    /**
     * Carga información del operador actual
     */
    function loadOperatorInfo() {
        try {
            if (window.AuthToken && typeof window.AuthToken.getToken === 'function') {
                const token = window.AuthToken.getToken();
                if (token) {
                    const payload = parseJWT(token);
                    if (payload) {
                        const operatorName = payload.nombre || payload.email || 'Operador';
                        const operatorNameEl = document.getElementById('operator-name');
                        if (operatorNameEl) {
                            operatorNameEl.textContent = operatorName;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error al cargar información del operador:', error);
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
     * Carga estadísticas de la sesión desde sessionStorage
     */
    function loadSessionStats() {
        try {
            const savedStats = sessionStorage.getItem('atencion_session_stats');
            
            if (savedStats) {
                stats = JSON.parse(savedStats);
            } else {
                // Inicializar estadísticas para nueva sesión
                stats = { nuevas: 0, modificaciones: 0, soporte: 0, total: 0 };
                saveStats();
            }

            updateStatsDisplay();
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    }

    /**
     * Actualiza la visualización de estadísticas
     */
    function updateStatsDisplay() {
        const statsNuevas = document.getElementById('stats-nuevas');
        const statsModificaciones = document.getElementById('stats-modificaciones');
        const statsSoporte = document.getElementById('stats-soporte');
        const statsTotal = document.getElementById('stats-total');
        
        if (statsNuevas) statsNuevas.textContent = stats.nuevas;
        if (statsModificaciones) statsModificaciones.textContent = stats.modificaciones;
        if (statsSoporte) statsSoporte.textContent = stats.soporte;
        if (statsTotal) statsTotal.textContent = stats.total;
    }

    /**
     * Guarda estadísticas en sessionStorage
     */
    function saveStats() {
        try {
            sessionStorage.setItem('atencion_session_stats', JSON.stringify(stats));
        } catch (error) {
            console.error('Error al guardar estadísticas:', error);
        }
    }

    /**
     * Incrementa un contador de estadísticas
     */
    function incrementStat(type) {
        if (stats[type] !== undefined) {
            stats[type]++;
            stats.total++;
            saveStats();
            updateStatsDisplay();
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

        // Escuchar eventos de módulos completados
        window.addEventListener('atencion:nueva-conexion', () => {
            incrementStat('nuevas');
        });

        window.addEventListener('atencion:modificacion-datos', () => {
            incrementStat('modificaciones');
        });
        
        window.addEventListener('atencion:soporte-tecnico', () => {
            incrementStat('soporte');
        });
    }

    /**
     * Carga un módulo específico
     */
    function loadModule(moduleName) {
        console.log(`📦 Cargando módulo: ${moduleName}`);

        let url;
        switch (moduleName) {
            case 'nuevas-conexiones':
                url = '/atencion-nuevas-conexiones';
                break;
            case 'cambio-plan':
                url = '/atencion-cambio-plan';
                break;
            case 'modificar-datos':
                url = '/atencion-modificar-datos';
                break;
            case 'soporte':
                url = '/atencion-soporte';
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
        } else {
            console.error('loadContent no está disponible');
            if (window.ErrorModal) {
                window.ErrorModal.show('Error en el sistema de navegación');
            }
            // Fallback: navegar al shell del dashboard (no usamos ?panel) —
            // direct navigation to partial routes returns 404 on the server.
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
     * Función de limpieza al salir del panel
     */
    function cleanup() {
        console.log('🧹 Limpiando Panel de Atención...');
        // Limpiar listeners si es necesario
    }

    // Exponer funciones públicas
    window.AtencionPanel = {
        init,
        cleanup,
        incrementStat,
        getStats: () => ({ ...stats })
    };

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
