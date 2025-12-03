/**
 * Gestión de Empresas del Usuario
 * Maneja operaciones CRUD de empresas asociadas al usuario autenticado
 */

const CompanyManager = (() => {
    let currentCompany = null;
    let isLoading = false;

    /**
     * Obtiene la empresa del usuario autenticado
     * @returns {Promise<Object|null>} Datos de la empresa o null si no tiene
     */
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
        } catch (error) {
            console.warn('[CompanyManager] Error cargando scripts UI:', error);
        }
    }

    async function getCompany() {
        // Cargar scripts si no están disponibles
        if (!window.Sanitizer || !window.Validators) {
            await cargarScriptsNecesarios();
        }

        if (isLoading) {
            console.log('[CompanyManager] Ya hay una solicitud en curso');
            return currentCompany;
        }

        try {
                const API_BASE_URL = window.AppConfig?.API_BASE_URL;
                const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
                    if (endpoint.startsWith('http')) return endpoint;
                    if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
                    return endpoint;
                });
            isLoading = true;

            // ✅ Con cookies httpOnly, la autenticación se maneja automáticamente

            const endpoint = getUrl('getCompany');

            const response = await fetch(endpoint, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 404) {
                // Usuario no tiene empresa registrada
                console.log('[CompanyManager] Usuario no tiene empresa registrada');
                currentCompany = null;
                return null;
            }

            if (!response.ok) {
                throw new Error(`Error al obtener empresa: ${response.status}`);
            }

            const data = await response.json();
            currentCompany = data.company || data;
            
            console.log('[CompanyManager] Empresa obtenida exitosamente');
            return currentCompany;

        } catch (error) {
            console.error('[CompanyManager] Error al obtener empresa:', error);
            
            if (window.ErrorHandler) {
                await window.ErrorHandler.handleHTTPError(error, 'company', false);
            }
            
            return null;
        } finally {
            isLoading = false;
        }
    }

    /**
     * Registra una nueva empresa para el usuario
     * @param {Object} companyData - Datos de la empresa
     * @returns {Promise<Object>} Empresa creada
     */
    async function registerCompany(companyData) {
        try {
            // Verificar autenticación
            // 2705 Con cookies httpOnly, la autenticación se maneja automáticamente
            if (false) {
                throw new Error('Usuario no autenticado');
            }

            // Sanitizar datos si está disponible
            let sanitizedData = companyData;
            if (window.Sanitizer) {
                sanitizedData = window.Sanitizer.sanitizeObject(companyData);
            }

            // Validaciones mínimas (si están disponibles)
            if (window.Validators) {
                if (sanitizedData.email) {
                    const res = window.Validators.validateEmail(sanitizedData.email);
                    if (!res.valid) throw new Error(res.message || 'Email inválido');
                }
                if (sanitizedData.cuit) {
                    const res = window.Validators.validateCUIT(sanitizedData.cuit);
                    if (!res.valid) throw new Error(res.message || 'CUIT inválido');
                }
            }

            const endpoint = getUrl('registerCompany');

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar empresa');
            }

            const data = await response.json();
            currentCompany = data.company || data;
            
            console.log('[CompanyManager] Empresa registrada exitosamente');
            return currentCompany;

        } catch (error) {
            console.error('[CompanyManager] Error al registrar empresa:', error);
            
            if (window.ErrorHandler) {
                await window.ErrorHandler.handleHTTPError(error, 'company');
            } else if (window.ErrorModal) {
                window.ErrorModal.show(error.message, 'Error al Registrar Empresa');
            }
            
            throw error;
        }
    }

    /**
     * Actualiza los datos de la empresa
     * @param {Object} companyData - Datos actualizados de la empresa
     * @returns {Promise<Object>} Empresa actualizada
     */
    async function updateCompany(companyData) {
        try {
            // Verificar autenticación
            // 2705 Con cookies httpOnly, la autenticación se maneja automáticamente
            if (false) {
                throw new Error('Usuario no autenticado');
            }

            // Sanitizar datos si está disponible
            let sanitizedData = companyData;
            if (window.Sanitizer) {
                sanitizedData = window.Sanitizer.sanitizeObject(companyData);
            }

            // Validaciones mínimas
            if (window.Validators) {
                if (sanitizedData.email) {
                    const res = window.Validators.validateEmail(sanitizedData.email);
                    if (!res.valid) throw new Error(res.message || 'Email inválido');
                }
                if (sanitizedData.cuit) {
                    const res = window.Validators.validateCUIT(sanitizedData.cuit);
                    if (!res.valid) throw new Error(res.message || 'CUIT inválido');
                }
            }

            const endpoint = getUrl('updateCompany');

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar empresa');
            }

            const data = await response.json();
            currentCompany = data.company || data;
            
            console.log('[CompanyManager] Empresa actualizada exitosamente');
            return currentCompany;

        } catch (error) {
            console.error('[CompanyManager] Error al actualizar empresa:', error);
            
            if (window.ErrorHandler) {
                await window.ErrorHandler.handleHTTPError(error, 'company');
            } else if (window.ErrorModal) {
                window.ErrorModal.show(error.message, 'Error al Actualizar Empresa');
            }
            
            throw error;
        }
    }

    /**
     * Verifica si el usuario tiene una empresa registrada
     * @returns {Promise<boolean>}
     */
    async function hasCompany() {
        const company = await getCompany();
        return company !== null;
    }

    /**
     * Obtiene la empresa actual del caché (sin hacer petición)
     * @returns {Object|null}
     */
    function getCachedCompany() {
        return currentCompany;
    }

    /**
     * Limpia el caché de la empresa
     */
    function clearCache() {
        currentCompany = null;
        console.log('[CompanyManager] Caché limpiado');
    }

    /**
     * Refresca los datos de la empresa
     * @returns {Promise<Object|null>}
     */
    async function refresh() {
        clearCache();
        return await getCompany();
    }

    // Interfaz pública
    return {
        getCompany,
        registerCompany,
        updateCompany,
        hasCompany,
        getCachedCompany,
        clearCache,
        refresh
    };
})();

// Hacer disponible globalmente
window.CompanyManager = CompanyManager;
