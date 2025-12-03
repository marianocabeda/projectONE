/**
 * Cargador de Datos Geográficos
 * Maneja la carga de provincias, municipios y distritos con caché integrado
 * @module geo-data-loader
 */

(function() {
    'use strict';

    // Verificar dependencias
    if (!window.HTTP) {
        console.error('GeoDataLoader requiere el módulo HTTP');
        return;
    }

    if (!window.AppConfig || !window.AppConfig.getUrl) {
        console.error('GeoDataLoader requiere AppConfig con getUrl');
        return;
    }

    if (!window.CacheManager) {
        console.error('GeoDataLoader requiere CacheManager');
        return;
    }

    /**
     * Carga provincias y las asigna a un selector
     * @param {Object} selector - Selector personalizado (CustomSelect)
     * @param {number|null} preSelectedId - ID pre-seleccionado
     * @returns {Promise<Array>} - Array de provincias
     */
    async function loadProvincias(selector, preSelectedId = null) {
        if (!selector) {
            throw new Error('Selector es requerido');
        }

        try {
            // Verificar caché
            const cacheKey = 'geo:provincias';
            let provincias = window.CacheManager.get(cacheKey);

            if (!provincias) {
                console.log('📤 Cargando provincias desde API...');
                
                const url = window.AppConfig.getUrl('provincias');
                const response = await window.HTTP.get(url);

                if (!response.ok || !response.data || !response.data.data) {
                    throw new Error('Respuesta inválida al cargar provincias');
                }

                provincias = response.data.data;
                
                // Guardar en caché (1 hora)
                window.CacheManager.set(cacheKey, provincias, 60 * 60 * 1000);
            } else {
                console.log('✅ Usando provincias desde caché');
            }

            // Poblar selector
            selector.populate(provincias, preSelectedId);
            
            return provincias;

        } catch (error) {
            console.error('❌ Error al cargar provincias:', error);
            
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error',
                    message: 'No se pudieron cargar las provincias',
                    type: 'error'
                });
            }
            
            throw error;
        }
    }

    /**
     * Carga municipios/departamentos de una provincia
     * @param {number} provinciaId - ID de la provincia
     * @param {Object} selector - Selector personalizado (CustomSelect)
     * @param {number|null} preSelectedId - ID pre-seleccionado
     * @returns {Promise<Array>} - Array de municipios
     */
    async function loadMunicipios(provinciaId, selector, preSelectedId = null) {
        if (!provinciaId) {
            throw new Error('provinciaId es requerido');
        }

        if (!selector) {
            throw new Error('Selector es requerido');
        }

        try {
            selector.setDisabled(true);

            // Verificar caché
            const cacheKey = `geo:municipios:${provinciaId}`;
            let municipios = window.CacheManager.get(cacheKey);

            if (!municipios) {
                console.log(`📤 Cargando municipios de provincia ${provinciaId}...`);
                
                const url = window.AppConfig.getUrl('departamentos') + `?provincia_id=${provinciaId}`;
                const response = await window.HTTP.get(url);

                if (!response.ok || !response.data || !response.data.data) {
                    throw new Error('Respuesta inválida al cargar municipios');
                }

                municipios = response.data.data;
                
                // Guardar en caché (1 hora)
                window.CacheManager.set(cacheKey, municipios, 60 * 60 * 1000);
            } else {
                console.log('✅ Usando municipios desde caché');
            }

            // Poblar selector
            selector.populate(municipios, preSelectedId);
            selector.setDisabled(false);
            
            return municipios;

        } catch (error) {
            console.error('❌ Error al cargar municipios:', error);
            
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error',
                    message: 'No se pudieron cargar los municipios',
                    type: 'error'
                });
            }
            
            throw error;
        }
    }

    /**
     * Carga distritos de un municipio/departamento
     * @param {number} municipioId - ID del municipio
     * @param {Object} selector - Selector personalizado (CustomSelect)
     * @param {number|null} preSelectedId - ID pre-seleccionado
     * @returns {Promise<Array>} - Array de distritos
     */
    async function loadDistritos(municipioId, selector, preSelectedId = null) {
        if (!municipioId) {
            throw new Error('municipioId es requerido');
        }

        if (!selector) {
            throw new Error('Selector es requerido');
        }

        try {
            selector.setDisabled(true);

            // Verificar caché
            const cacheKey = `geo:distritos:${municipioId}`;
            let distritos = window.CacheManager.get(cacheKey);

            if (!distritos) {
                console.log(`📤 Cargando distritos de municipio ${municipioId}...`);
                
                const url = window.AppConfig.getUrl('distritos') + `?departamento_id=${municipioId}`;
                const response = await window.HTTP.get(url);

                if (!response.ok || !response.data || !response.data.data) {
                    throw new Error('Respuesta inválida al cargar distritos');
                }

                distritos = response.data.data;
                
                // Guardar en caché (1 hora)
                window.CacheManager.set(cacheKey, distritos, 60 * 60 * 1000);
            } else {
                console.log('✅ Usando distritos desde caché');
            }

            // Poblar selector
            selector.populate(distritos, preSelectedId);
            selector.setDisabled(false);
            
            return distritos;

        } catch (error) {
            console.error('❌ Error al cargar distritos:', error);
            
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error',
                    message: 'No se pudieron cargar los distritos',
                    type: 'error'
                });
            }
            
            throw error;
        }
    }

    /**
     * Carga la jerarquía completa (provincia → municipio → distrito)
     * @param {Object} selectors - Objeto con los selectores {provincia, municipio, distrito}
     * @param {Object} preSelected - IDs pre-seleccionados {provinciaId, municipioId, distritoId}
     * @returns {Promise<void>}
     */
    async function loadHierarchy(selectors, preSelected = {}) {
        const { provincia, municipio, distrito } = selectors;
        const { provinciaId, municipioId, distritoId } = preSelected;

        if (!provincia || !municipio || !distrito) {
            throw new Error('Se requieren todos los selectores (provincia, municipio, distrito)');
        }

        try {
            // 1. Cargar provincias
            await loadProvincias(provincia, provinciaId);
            
            // 2. Si hay provincia seleccionada, cargar municipios
            if (provinciaId) {
                await loadMunicipios(provinciaId, municipio, municipioId);
                
                // 3. Si hay municipio seleccionado, cargar distritos
                if (municipioId) {
                    await loadDistritos(municipioId, distrito, distritoId);
                }
            }

        } catch (error) {
            console.error('❌ Error al cargar jerarquía geográfica:', error);
            throw error;
        }
    }

    /**
     * Invalida caché de datos geográficos
     * @param {string} level - Nivel a invalidar ('all', 'provincias', 'municipios', 'distritos')
     */
    function invalidateCache(level = 'all') {
        if (level === 'all') {
            window.CacheManager.invalidatePrefix('geo:');
        } else if (level === 'provincias') {
            window.CacheManager.invalidate('geo:provincias');
        } else if (level === 'municipios') {
            window.CacheManager.invalidatePrefix('geo:municipios:');
        } else if (level === 'distritos') {
            window.CacheManager.invalidatePrefix('geo:distritos:');
        }
    }

    // Exportar API
    window.GeoDataLoader = {
        loadProvincias,
        loadMunicipios,
        loadDistritos,
        loadHierarchy,
        invalidateCache
    };

    console.log('✅ GeoDataLoader loaded');

})();
