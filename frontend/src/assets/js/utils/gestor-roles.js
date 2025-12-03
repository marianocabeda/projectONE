/**
 * Role Manager - Gestión de Roles de Usuario
 * Determina qué tipo de interfaz debe ver el usuario según su rol
 */

const RoleManager = (() => {
    // Tipos de roles
    const ROLES = {
        CLIENTE: 'cliente',
        EMPRESA: 'empresa',
        VERIFICADOR: 'verificador',
        ATENCION_PUBLICO: 'atencion',
        ADMIN: 'admin'
    };

    // Roles que tienen acceso a la interfaz de verificación
    const ROLES_VERIFICACION = [
        ROLES.VERIFICADOR,
        ROLES.ATENCION_PUBLICO,
        ROLES.ADMIN
    ];

    // Roles de cliente normal
    const ROLES_CLIENTE = [
        ROLES.CLIENTE,
        ROLES.EMPRESA
    ];

    let userRoles = [];
    let isInitialized = false;

    /**
     * Inicializa el gestor de roles
     * Obtiene los roles del token JWT o del usuario actual
     */
    function init() {
        if (isInitialized) {
            return userRoles;
        }

        try {
            // Intentar obtener roles del token JWT
            if (window.AuthToken && typeof window.AuthToken.getToken === 'function') {
                const token = window.AuthToken.getToken();
                if (token) {
                    const payload = parseJWT(token);
                    if (payload && payload.roles) {
                        userRoles = Array.isArray(payload.roles) ? payload.roles : [payload.roles];
                        console.log('[RoleManager] Roles del usuario:', userRoles);
                    }
                }
            }

            // Si no hay roles en el token, usar valor por defecto
            if (userRoles.length === 0) {
                console.warn('[RoleManager] No se encontraron roles, usando rol cliente por defecto');
                userRoles = [ROLES.CLIENTE];
            }

            isInitialized = true;
            return userRoles;

        } catch (error) {
            console.error('[RoleManager] Error al inicializar roles:', error);
            userRoles = [ROLES.CLIENTE];
            isInitialized = true;
            return userRoles;
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
            console.error('[RoleManager] Error al parsear JWT:', error);
            return null;
        }
    }

    /**
     * Verifica si el usuario tiene un rol específico
     */
    function hasRole(role) {
        if (!isInitialized) init();
        return userRoles.includes(role);
    }

    /**
     * Verifica si el usuario tiene alguno de los roles especificados
     */
    function hasAnyRole(roles) {
        if (!isInitialized) init();
        return roles.some(role => userRoles.includes(role));
    }

    /**
     * Verifica si el usuario tiene todos los roles especificados
     */
    function hasAllRoles(roles) {
        if (!isInitialized) init();
        return roles.every(role => userRoles.includes(role));
    }

    /**
     * Verifica si el usuario es verificador o personal de atención
     * (pero NO admin, ya que admin tiene su propio panel)
     */
    function isVerificador() {
        // Si es admin, no es verificador (tienen paneles separados)
        if (hasRole(ROLES.ADMIN)) return false;
        return hasAnyRole(ROLES_VERIFICACION);
    }

    /**
     * Verifica si el usuario es cliente (particular o empresa)
     */
    function isCliente() {
        return hasAnyRole(ROLES_CLIENTE);
    }

    /**
     * Verifica si el usuario es administrador
     */
    function isAdmin() {
        return hasRole(ROLES.ADMIN);
    }

    /**
     * Obtiene todos los roles del usuario
     */
    function getRoles() {
        if (!isInitialized) init();
        return [...userRoles]; // Retornar copia
    }

    /**
     * Obtiene el rol principal (el primero o más prioritario)
     */
    function getPrimaryRole() {
        if (!isInitialized) init();

        // Prioridad: Admin > Verificador > Atención > Empresa > Cliente
        if (hasRole(ROLES.ADMIN)) return ROLES.ADMIN;
        if (hasRole(ROLES.VERIFICADOR)) return ROLES.VERIFICADOR;
        if (hasRole(ROLES.ATENCION_PUBLICO)) return ROLES.ATENCION_PUBLICO;
        if (hasRole(ROLES.EMPRESA)) return ROLES.EMPRESA;

        return ROLES.CLIENTE;
    }

    /**
     * Verifica si el usuario es personal de atención al público
     */
    function isAtencionPublico() {
        return hasRole(ROLES.ATENCION_PUBLICO);
    }

    /**
     * Determina qué página de inicio debe ver el usuario
     * Atención usa su panel específico, otros roles usan /home dinámico
     */
    function getHomePage() {
        if (isAtencionPublico()) {
            return '/atencion-panel';
        }
        if (isVerificador()) {
            return '/solicitudes-cola';
        }
        if (isCliente()) {
            return '/home';
        }
        if (isAdmin()) {
            return '/admin-panel';
        }
        return '/home';
    }

    /**
     * Verifica si el usuario puede acceder a una ruta específica
     */
    function canAccess(requiredRoles) {
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return hasAnyRole(requiredRoles);
    }

    /**
     * Establece roles manualmente (útil para testing o desarrollo)
     */
    function setRoles(roles) {
        userRoles = Array.isArray(roles) ? roles : [roles];
        isInitialized = true;
        console.log('[RoleManager] Roles actualizados manualmente:', userRoles);
    }

    /**
     * Resetea el gestor de roles
     */
    function reset() {
        userRoles = [];
        isInitialized = false;
    }

    /**
     * Obtiene un nombre descriptivo para un rol
     */
    function getRoleDisplayName(role) {
        const displayNames = {
            [ROLES.CLIENTE]: 'Cliente',
            [ROLES.EMPRESA]: 'Empresa',
            [ROLES.VERIFICADOR]: 'Verificador',
            [ROLES.ATENCION_PUBLICO]: 'Atención al Público',
            [ROLES.ADMIN]: 'Administrador'
        };
        return displayNames[role] || role;
    }

    // API pública
    return {
        ROLES,
        init,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isVerificador,
        isCliente,
        isAdmin,
        isAtencionPublico,
        getRoles,
        getPrimaryRole,
        getHomePage,
        canAccess,
        setRoles,
        reset,
        getRoleDisplayName
    };
})();

// Exponer globalmente
window.RoleManager = RoleManager;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        RoleManager.init();
    });
} else {
    RoleManager.init();
}
