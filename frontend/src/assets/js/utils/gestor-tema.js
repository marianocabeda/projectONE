/**
 * gestor-tema.js
 * Gestor global de tema oscuro/claro para el dashboard
 * Almacena la preferencia del usuario en localStorage y aplica los estilos correspondientes
 */

(function() {
    'use strict';

    // Namespace para evitar conflictos
    window.ThemeManager = window.ThemeManager || {};

    // Constantes
    const STORAGE_KEY_PREFIX = 'user_theme_';
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };

    // Estado actual del tema y usuario
    let currentTheme = THEMES.LIGHT;
    let currentUserId = null;
    
    /**
     * Obtiene el ID del usuario actual de forma confiable
     * @returns {number|null} ID del usuario o null
     */
    function getUserId() {
        // Prioridad 1: Usuario en memoria
        if (currentUserId) {
            return currentUserId;
        }
        
        // Prioridad 2: AuthToken (solo si es confiable)
        const tokenUserId = window.AuthToken?.getUsuarioId?.();
        if (tokenUserId && typeof tokenUserId === 'number') {
            return tokenUserId;
        }
        
        return null;
    }
    
    /**
     * Obtiene la clave de almacenamiento específica del usuario
     * @param {number|null} userId - ID del usuario (opcional)
     * @returns {string} Clave de localStorage para el usuario
     */
    function getStorageKey(userId = null) {
        const id = userId || getUserId();
        if (id) {
            return `${STORAGE_KEY_PREFIX}${id}`;
        }
        // Fallback para usuario no autenticado
        return 'user_theme_preference';
    }

    /**
     * Inicializa el gestor de tema
     * Carga la preferencia guardada del usuario actual
     */
    function init() {
        console.log('🎨 Inicializando ThemeManager...');
        
        const storageKey = getStorageKey();
        const savedTheme = getSavedTheme();
        const systemTheme = getSystemTheme();
        
        // Prioridad: 1) Tema guardado del usuario, 2) Tema del sistema
        const themeToApply = savedTheme || systemTheme;
        
        const userId = window.AuthToken?.getUsuarioId?.();
        
        console.log('📊 Estado de temas:', {
            userId: userId || 'guest',
            storageKey: storageKey,
            saved: savedTheme,
            system: systemTheme,
            applying: themeToApply
        });

        // Aplicar tema sin transición inicial para evitar flash
        applyTheme(themeToApply, false);

        // Escuchar cambios en la preferencia del sistema solo si no hay tema guardado
        if (!savedTheme) {
            listenToSystemThemeChanges();
        }

        console.log('✅ ThemeManager inicializado con tema:', themeToApply);
    }

    /**
     * Obtiene el tema guardado en localStorage
     * @param {number|null} userId - ID del usuario (opcional)
     * @returns {string|null} 'light', 'dark' o null si no hay preferencia guardada
     */
    function getSavedTheme(userId = null) {
        try {
            const storageKey = getStorageKey(userId);
            const saved = localStorage.getItem(storageKey);
            if (saved && (saved === THEMES.LIGHT || saved === THEMES.DARK)) {
                console.log('📖 Tema cargado para usuario:', storageKey, '→', saved);
                return saved;
            }
        } catch (error) {
            console.warn('⚠️ Error al leer tema de localStorage:', error);
        }
        return null;
    }

    /**
     * Guarda el tema en localStorage
     * @param {string} theme - 'light' o 'dark'
     * @param {number|null} userId - ID del usuario (opcional)
     */
    function saveTheme(theme, userId = null) {
        try {
            const storageKey = getStorageKey(userId);
            localStorage.setItem(storageKey, theme);
            console.log('💾 Tema guardado para usuario:', storageKey, '→', theme);
        } catch (error) {
            console.error('❌ Error al guardar tema en localStorage:', error);
        }
    }

    /**
     * Detecta la preferencia de tema del sistema
     * @returns {string} 'light' o 'dark'
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEMES.DARK;
        }
        return THEMES.LIGHT;
    }

    /**
     * Aplica el tema al documento
     * @param {string} theme - 'light' o 'dark'
     * @param {boolean} withTransition - Si debe aplicar transición suave (default: true)
     */
    function applyTheme(theme, withTransition = true) {
        const html = document.documentElement;
        const body = document.body;

        // Validar tema
        if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
            console.warn('⚠️ Tema inválido:', theme, '- usando light');
            theme = THEMES.LIGHT;
        }

        // Si queremos transición suave, agregamos clase temporal
        if (withTransition) {
            html.classList.add('dark-mode-transition');
            body.classList.add('dark-mode-transition');
        }

        // Aplicar o remover clase 'dark'
        if (theme === THEMES.DARK) {
            html.classList.add('dark');
            body.classList.add('dark');
        } else {
            html.classList.remove('dark');
            body.classList.remove('dark');
        }

        // Actualizar estado interno
        currentTheme = theme;

        // Disparar evento personalizado para que otros componentes puedan reaccionar
        const event = new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        });
        window.dispatchEvent(event);

        console.log('🎨 Tema aplicado:', theme);

        // Remover clase de transición después de que termine
        if (withTransition) {
            setTimeout(() => {
                html.classList.remove('dark-mode-transition');
                body.classList.remove('dark-mode-transition');
            }, 300);
        }
    }

    /**
     * Cambia entre tema claro y oscuro
     */
    function toggleTheme() {
        const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
        setTheme(newTheme);
    }

    /**
     * Establece un tema específico
     * @param {string} theme - 'light' o 'dark'
     */
    function setTheme(theme) {
        if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
            console.error('❌ Tema inválido:', theme);
            return;
        }

        applyTheme(theme, true);
        saveTheme(theme);
    }

    /**
     * Obtiene el tema actual
     * @returns {string} 'light' o 'dark'
     */
    function getCurrentTheme() {
        return currentTheme;
    }

    /**
     * Verifica si está en modo oscuro
     * @returns {boolean}
     */
    function isDarkMode() {
        return currentTheme === THEMES.DARK;
    }

    /**
     * Escucha cambios en la preferencia del sistema (opcional)
     */
    function listenToSystemThemeChanges() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Listener para cambios en la preferencia del sistema
            const handleSystemThemeChange = (e) => {
                // Solo aplicar si el usuario no tiene preferencia guardada
                const savedTheme = getSavedTheme();
                if (!savedTheme) {
                    const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
                    console.log('🔄 Preferencia del sistema cambió a:', newTheme);
                    applyTheme(newTheme, true);
                }
            };

            // Usar el método correcto según el navegador
            if (darkModeQuery.addEventListener) {
                darkModeQuery.addEventListener('change', handleSystemThemeChange);
            } else if (darkModeQuery.addListener) {
                // Fallback para navegadores antiguos
                darkModeQuery.addListener(handleSystemThemeChange);
            }
        }
    }

    /**
     * Resetea el tema a la preferencia del sistema
     */
    function resetToSystemTheme() {
        const systemTheme = getSystemTheme();
        try {
            const storageKey = getStorageKey();
            localStorage.removeItem(storageKey);
            console.log('🔄 Preferencia de tema reseteada al sistema');
        } catch (error) {
            console.warn('⚠️ Error al eliminar preferencia de localStorage:', error);
        }
        applyTheme(systemTheme, true);
    }

    // Exponer API pública
    window.ThemeManager = {
        init,
        toggleTheme,
        setTheme,
        getCurrentTheme,
        isDarkMode,
        resetToSystemTheme,
        THEMES
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Escuchar evento de usuario cargado para cargar el tema específico del usuario
    window.addEventListener('userLoaded', (event) => {
        const userId = event.detail.userId;
        console.log('👤 ThemeManager: Usuario cargado (ID:', userId, '), cargando su tema...');
        
        // Actualizar el ID de usuario en memoria
        currentUserId = userId;
        
        // Obtener tema guardado del usuario específico
        const userTheme = getSavedTheme(userId);
        
        console.log('🔍 Buscando tema para usuario:', userId);
        console.log('🔍 Tema encontrado:', userTheme || 'ninguno');
        
        if (userTheme) {
            console.log('✅ Aplicando tema guardado del usuario:', userTheme);
            applyTheme(userTheme, true);
        } else {
            // Si el usuario no tiene tema guardado, usar el del sistema
            const systemTheme = getSystemTheme();
            console.log('ℹ️ Usuario sin tema guardado, aplicando tema del sistema:', systemTheme);
            applyTheme(systemTheme, true);
        }
    });
    
    // Escuchar evento de logout para limpiar estado
    window.addEventListener('userLogout', () => {
        console.log('👋 ThemeManager: Usuario cerró sesión, limpiando estado...');
        
        // Limpiar ID de usuario en memoria
        currentUserId = null;
        
        // Limpiar clase dark del DOM inmediatamente
        const html = document.documentElement;
        const body = document.body;
        html.classList.remove('dark');
        body.classList.remove('dark');
        
        console.log('🎨 Tema oscuro removido del DOM');
        
        // Aplicar tema del sistema sin guardar preferencia (sin transición)
        const systemTheme = getSystemTheme();
        console.log('🔄 Aplicando tema del sistema:', systemTheme);
        applyTheme(systemTheme, false);
    });

})();
