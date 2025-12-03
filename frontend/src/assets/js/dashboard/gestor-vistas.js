/**
 * ViewManager - Gestión de vistas Empresa/Particular
 * Maneja el cambio entre vistas y la persistencia de preferencias
 */

const ViewManager = (() => {
    const STORAGE_KEY = 'dashboard_view_type';
    const VIEW_TYPES = {
        PARTICULAR: 'particular',
        EMPRESA: 'empresa'
    };

    let currentView = VIEW_TYPES.PARTICULAR;
    let viewChangeCallbacks = [];

    /**
     * Inicializa el ViewManager
     * Carga la vista guardada en localStorage
     */
    function init() {
        const savedView = localStorage.getItem(STORAGE_KEY);
        if (savedView && Object.values(VIEW_TYPES).includes(savedView)) {
            currentView = savedView;
        }
        
        console.log('[ViewManager] Inicializado con vista:', currentView);
        return currentView;
    }

    /**
     * Obtiene la vista actual
     * @returns {string} Vista actual (particular|empresa)
     */
    function getCurrentView() {
        return currentView;
    }

    /**
     * Cambia la vista actual
     * @param {string} viewType - Tipo de vista (particular|empresa)
     */
    function setView(viewType) {
        if (!Object.values(VIEW_TYPES).includes(viewType)) {
            console.error('[ViewManager] Tipo de vista inválido:', viewType);
            return;
        }

        const previousView = currentView;
        currentView = viewType;
        
        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEY, viewType);
        
        console.log('[ViewManager] Vista cambiada:', previousView, '→', currentView);

        // Notificar a los callbacks registrados
        notifyViewChange(viewType, previousView);
    }

    /**
     * Registra un callback que se ejecuta cuando cambia la vista
     * @param {Function} callback - Función a ejecutar (recibe viewType y previousView)
     */
    function onViewChange(callback) {
        if (typeof callback === 'function') {
            viewChangeCallbacks.push(callback);
        }
    }

    /**
     * Notifica a todos los callbacks registrados
     * @param {string} newView - Nueva vista
     * @param {string} previousView - Vista anterior
     */
    function notifyViewChange(newView, previousView) {
        viewChangeCallbacks.forEach(callback => {
            try {
                callback(newView, previousView);
            } catch (error) {
                console.error('[ViewManager] Error en callback de cambio de vista:', error);
            }
        });
    }

    /**
     * Verifica si la vista actual es de empresa
     * @returns {boolean}
     */
    function isEmpresaView() {
        return currentView === VIEW_TYPES.EMPRESA;
    }

    /**
     * Verifica si la vista actual es particular
     * @returns {boolean}
     */
    function isParticularView() {
        return currentView === VIEW_TYPES.PARTICULAR;
    }

    /**
     * Resetea la vista a particular
     */
    function reset() {
        setView(VIEW_TYPES.PARTICULAR);
    }

    // Interfaz pública
    return {
        init,
        getCurrentView,
        setView,
        onViewChange,
        isEmpresaView,
        isParticularView,
        reset,
        VIEW_TYPES
    };
})();

// Hacer disponible globalmente
window.ViewManager = ViewManager;

// Auto-inicializar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ViewManager.init());
} else {
    ViewManager.init();
}
