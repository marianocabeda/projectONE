/**
 * Gestor de Caché Persistente
 * Proporciona una capa de caché usando localStorage para mantener datos entre navegaciones
 * @module cache-manager
 */

(function() {
    'use strict';

    const STORAGE_PREFIX = 'app_cache_';
    const LOADING_PREFIX = 'loading_';

    /**
     * Guarda datos en caché con timestamp usando localStorage
     * @param {string} key - Clave del caché
     * @param {any} data - Datos a guardar
     * @param {number} maxAge - Tiempo máximo de vida en milisegundos (por defecto 5 minutos)
     */
    function set(key, data, maxAge = 5 * 60 * 1000) {
        try {
            const entry = {
                data,
                timestamp: Date.now(),
                maxAge
            };
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
            // Limpiar estado de loading al guardar
            sessionStorage.removeItem(LOADING_PREFIX + key);
        } catch (error) {
            console.warn('Error guardando en caché:', error);
        }
    }

    /**
     * Obtiene datos del caché si no han expirado
     * @param {string} key - Clave del caché
     * @returns {any|null} - Datos o null si no existe o expiró
     */
    function get(key) {
        try {
            const item = localStorage.getItem(STORAGE_PREFIX + key);
            
            if (!item) {
                return null;
            }

            const entry = JSON.parse(item);
            const age = Date.now() - entry.timestamp;
            
            if (age > entry.maxAge) {
                localStorage.removeItem(STORAGE_PREFIX + key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.warn('Error leyendo caché:', error);
            return null;
        }
    }

    /**
     * Verifica si existe una clave en caché y no ha expirado
     * @param {string} key - Clave del caché
     * @returns {boolean}
     */
    function has(key) {
        return get(key) !== null;
    }

    /**
     * Invalida (elimina) una entrada del caché
     * @param {string} key - Clave del caché
     */
    function invalidate(key) {
        try {
            localStorage.removeItem(STORAGE_PREFIX + key);
            sessionStorage.removeItem(LOADING_PREFIX + key);
        } catch (error) {
            console.warn('Error invalidando caché:', error);
        }
    }

    /**
     * Invalida todas las entradas que coincidan con un prefijo
     * @param {string} prefix - Prefijo de las claves a invalidar
     */
    function invalidatePrefix(prefix) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX + prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.warn('Error invalidando prefijo:', error);
        }
    }

    /**
     * Limpia todo el caché
     * NOTA: Preserva la preferencia de tema del usuario
     */
    function clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            // Limpiar también sessionStorage de estados de loading
            // NOTA: sessionStorage.clear() no afecta las preferencias de tema que están en localStorage
            sessionStorage.clear();
        } catch (error) {
            console.warn('Error limpiando caché:', error);
        }
    }

    /**
     * Verifica si hay una carga en progreso para una clave
     * @param {string} key - Clave del caché
     * @returns {boolean}
     */
    function isLoading(key) {
        try {
            return sessionStorage.getItem(LOADING_PREFIX + key) === 'true';
        } catch (error) {
            return false;
        }
    }

    /**
     * Marca una clave como "cargando" o no
     * @param {string} key - Clave del caché
     * @param {boolean} loading - Estado de carga
     */
    function setLoading(key, loading) {
        try {
            if (loading) {
                sessionStorage.setItem(LOADING_PREFIX + key, 'true');
            } else {
                sessionStorage.removeItem(LOADING_PREFIX + key);
            }
        } catch (error) {
            console.warn('Error estableciendo estado de carga:', error);
        }
    }

    /**
     * Espera hasta que una clave deje de estar en estado "loading"
     * @param {string} key - Clave del caché
     * @param {number} timeout - Timeout máximo en ms (por defecto 10 segundos)
     * @returns {Promise<any>} - Datos cuando estén disponibles
     */
    async function waitForLoading(key, timeout = 10000) {
        const startTime = Date.now();
        
        while (isLoading(key)) {
            if (Date.now() - startTime > timeout) {
                throw new Error(`Timeout esperando caché: ${key}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return get(key);
    }

    /**
     * Obtiene información sobre una entrada del caché
     * @param {string} key - Clave del caché
     * @returns {Object|null} - Info de la entrada o null
     */
    function getInfo(key) {
        try {
            const item = localStorage.getItem(STORAGE_PREFIX + key);
            
            if (!item) {
                return null;
            }

            const entry = JSON.parse(item);
            const age = Date.now() - entry.timestamp;
            
            return {
                key,
                hasData: entry.data !== null,
                age,
                maxAge: entry.maxAge,
                isExpired: age > entry.maxAge,
                isLoading: isLoading(key),
                ageInSeconds: Math.round(age / 1000)
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Lista todas las claves en caché
     * @returns {string[]}
     */
    function keys() {
        try {
            const cacheKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    cacheKeys.push(key.substring(STORAGE_PREFIX.length));
                }
            }
            return cacheKeys;
        } catch (error) {
            return [];
        }
    }

    /**
     * Obtiene el tamaño del caché
     * @returns {number}
     */
    function size() {
        return keys().length;
    }

    // Exportar API
    window.CacheManager = {
        set,
        get,
        has,
        invalidate,
        invalidatePrefix,
        clear,
        isLoading,
        setLoading,
        waitForLoading,
        getInfo,
        keys,
        size
    };

    console.log('✅ CacheManager loaded');

})();
