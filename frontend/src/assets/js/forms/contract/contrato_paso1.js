export const content = `
    <form id="contract-step1-form" class="space-y-4 sm:space-y-6">
        <div class="mb-4 flex items-center">
            <input id="use-registered-address" name="use-registered-address" type="checkbox" class="h-4 w-4 text-principal-600 dark:text-dark-principal-600 border-gray-300 dark:border-dark-border-primary rounded dark:bg-dark-bg-tertiary">
            <label for="use-registered-address" class="ml-2 block text-sm text-gray-900 dark:text-dark-text-primary">Utilizar dirección Registrada previamente</label>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-dark-text-primary">Paso 1: Domicilio de Instalación</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div class="col-span-1 sm:col-span-2">
                <label for="calle" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Calle *</label>
                <input type="text" id="calle" name="calle" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base dark:text-dark-text-primary" required>
            </div>
            <div class="col-span-1">
                <label for="numero" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Número *</label>
                <input type="text" id="numero" name="numero" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base dark:text-dark-text-primary">
            </div>
            <div class="col-span-1">
                <label for="codigo_postal" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Código Postal *</label>
                <input type="text" id="codigo_postal" name="codigo_postal" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base dark:text-dark-text-primary" required>
            </div>
            <div class="col-span-1 sm:col-span-2">
                <div class="flex items-center">
                    <input id="sin-numero" name="sin-numero" type="checkbox" class="h-4 w-4 text-principal-600 dark:text-dark-principal-600 border-gray-300 dark:border-dark-border-primary rounded dark:bg-dark-bg-tertiary">
                    <label for="sin-numero" class="ml-2 block text-sm text-gray-900 dark:text-dark-text-primary">Sin número</label>
                </div>
            </div>
            <div class="col-span-1">
                <label for="piso" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Piso</label>
                <input type="text" id="piso" name="piso" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base dark:text-dark-text-primary">
            </div>
            <div class="col-span-1">
                <label for="depto" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Depto.</label>
                <input type="text" id="depto" name="depto" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base dark:text-dark-text-primary">
            </div>
            <div class="col-span-1 sm:col-span-2">
                <label for="provincia-btn" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Provincia *</label>
                <div class="relative">
                    <button type="button" id="provincia-btn"
                            class="flex items-center justify-between w-full text-left px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base" 
                            aria-haspopup="listbox" aria-expanded="false"> 
                        <span class="provincia-label text-gray-900 dark:text-dark-text-primary truncate">Seleccione provincia...</span>
                        <span class="provincia-chevron text-gray-400 dark:text-dark-text-muted ml-2">⌄</span>
                    </button>
                    <div id="provincia-overlay" class="hidden"></div>
                </div>
            </div>
            <div class="col-span-1 sm:col-span-2">
                <label for="municipio-btn" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Municipio *</label>
                <div class="relative">
                    <button type="button" id="municipio-btn"
                            class="flex items-center justify-between w-full text-left px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base" 
                            aria-haspopup="listbox" aria-expanded="false" disabled> 
                        <span class="municipio-label text-gray-900 dark:text-dark-text-primary truncate">Seleccione provincia primero...</span>
                        <span class="municipio-chevron text-gray-400 dark:text-dark-text-muted ml-2">⌄</span>
                    </button>
                    <div id="municipio-overlay" class="hidden"></div>
                </div>
            </div>
            <div class="col-span-1 sm:col-span-2"> 
                <label for="distrito-btn" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Distrito *</label>
                <div class="relative">
                    <button type="button" id="distrito-btn"
                            class="flex items-center justify-between w-full text-left px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 text-sm sm:text-base" 
                            aria-haspopup="listbox" aria-expanded="false" disabled> 
                        <span class="distrito-label text-gray-900 dark:text-dark-text-primary truncate">Seleccione municipio primero...</span>
                        <span class="distrito-chevron text-gray-400 dark:text-dark-text-muted ml-2">⌄</span>
                    </button>
                    <div id="distrito-overlay" class="hidden"></div>
                </div>
            </div>
        </div>
        <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
            <button type="button" id="prev-btn" class="boton boton-gris-discreto w-full sm:w-auto">Anterior</button>
            <button type="submit" class="boton boton-principal w-full sm:w-auto">Siguiente</button>
        </div>
    </form>
`;

export function init(navigate, formData, populateForm) {
    const form = document.getElementById('contract-step1-form');
    const prevBtn = document.getElementById('prev-btn');
    const sinNumero = document.getElementById('sin-numero');
    const numeroInput = document.getElementById('numero');
    const useRegisteredAddress = document.getElementById('use-registered-address');

    // Ocultar botón "Anterior" en el primer paso
    if (prevBtn) {
        prevBtn.style.display = 'none';
    }

    // Selectores personalizados
    let provinciaSelector = null;
    let municipioSelector = null;
    let distritoSelector = null;

    // ID de dirección registrada (si se usa)
    let direccionRegistradaId = null;
    
    // Caché para evitar llamadas duplicadas a la API
    let provinciasCache = null;
    let provinciasLoading = false;
    let municipiosCache = {}; // key: provincia_id
    let municipiosLoading = {};
    let distritosCache = {}; // key: municipio_id
    let distritosLoading = {};

    // Verificar que los módulos necesarios estén disponibles
    if (!window.Validators) {
        console.error('❌ Módulo Validators no está disponible');
    }
    if (!window.Sanitizer) {
        console.error('❌ Módulo Sanitizer no está disponible');
    }
    if (!window.CustomSelect) {
        console.error('❌ Módulo CustomSelect no está disponible');
    }

    // Configuración de URLs
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        const API_BASE_URL = window.AppConfig?.API_BASE_URL || '';
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
    });

    // Inicializar selectores personalizados
    function initCustomSelects() {
        if (!window.CustomSelect) {
            console.warn('⚠️ CustomSelect no disponible, reintentando en 100ms...');
            setTimeout(initCustomSelects, 100);
            return;
        }
        console.log('✅ Inicializando CustomSelect para contract_step1');

        // Verificar que los botones existan antes de crear CustomSelect
        const provinciaBtnCheck = document.getElementById('provincia-btn');
        const municipioBtnCheck = document.getElementById('municipio-btn');
        const distritoBtnCheck = document.getElementById('distrito-btn');
        console.log('🔍 Botones antes de CustomSelect.create:');
        console.log('  - provincia-btn:', provinciaBtnCheck ? '✅' : '❌ NULL');
        console.log('  - municipio-btn:', municipioBtnCheck ? '✅' : '❌ NULL');
        console.log('  - distrito-btn:', distritoBtnCheck ? '✅' : '❌ NULL');

        // Crear selector de provincia
        provinciaSelector = window.CustomSelect.create({
            buttonId: 'provincia-btn',
            overlayId: 'provincia-overlay',
            placeholder: 'Seleccione provincia...',
            labelClass: 'provincia-label',
            chevronClass: 'provincia-chevron',
            onSelect: async (item) => {
                console.log('🔥🔥🔥 CALLBACK PROVINCIA DISPARADO - Provincia seleccionada:', item);
                // Resetear municipio y distrito
                if (municipioSelector) {
                    municipioSelector.reset();
                    municipioSelector.populate([], null);
                }
                if (distritoSelector) {
                    distritoSelector.reset();
                    distritoSelector.populate([], null);
                }
                // Cargar municipios de la provincia seleccionada
                await loadMunicipios(item.id);
            }
        });

        // Crear selector de municipio
        municipioSelector = window.CustomSelect.create({
            buttonId: 'municipio-btn',
            overlayId: 'municipio-overlay',
            placeholder: 'Seleccione municipio...',
            labelClass: 'municipio-label',
            chevronClass: 'municipio-chevron',
            onSelect: async (item) => {
                console.log('Municipio seleccionado:', item);
                // Resetear distrito
                if (distritoSelector) {
                    distritoSelector.reset();
                    distritoSelector.populate([], null);
                }
                // Cargar distritos del municipio seleccionado
                await loadDistritos(item.id);
            }
        });

        // Crear selector de distrito
        distritoSelector = window.CustomSelect.create({
            buttonId: 'distrito-btn',
            overlayId: 'distrito-overlay',
            placeholder: 'Seleccione distrito...',
            labelClass: 'distrito-label',
            chevronClass: 'distrito-chevron',
            onSelect: (item) => {
                console.log('Distrito seleccionado:', item);
            }
        });
        
        // Verificar que los selectores se crearon correctamente
        console.log('📊 Resultado de CustomSelect.create:');
        console.log('  - provinciaSelector:', provinciaSelector ? '✅ CREADO' : '❌ NULL');
        console.log('  - municipioSelector:', municipioSelector ? '✅ CREADO' : '❌ NULL');
        console.log('  - distritoSelector:', distritoSelector ? '✅ CREADO' : '❌ NULL');
    }

    // Cargar provincias desde la API
    async function loadProvincias() {
        if (!provinciaSelector) return;
        
        // Si ya tenemos provincias en caché, usarlas
        if (provinciasCache) {
            provinciaSelector.populate(provinciasCache, formData?.provincia_id);
            return;
        }
        
        // Si ya está cargando, esperar
        if (provinciasLoading) {
            // Esperar un momento y reintentar
            await new Promise(resolve => setTimeout(resolve, 100));
            if (provinciasCache) {
                provinciaSelector.populate(provinciasCache, formData?.provincia_id);
            }
            return;
        }
        
        provinciasLoading = true;

        try {
            const url = getUrl('provincias');
            console.log('📤 Cargando provincias desde:', url);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Provincias recibidas:', result);

            const provincias = result.data || result || [];
            provinciasCache = provincias; // Guardar en caché
            provinciaSelector.populate(provincias, formData?.provincia_id);

        } catch (error) {
            console.error('❌ Error al cargar provincias:', error);
            if (window.ErrorModal) {
                window.ErrorModal.show('No se pudieron cargar las provincias', 'Error');
            }
        } finally {
            provinciasLoading = false;
        }
    }

    // Función auxiliar para obtener provincias (retorna array)
    async function fetchProvincias() {
        try {
            const url = getUrl('provincias');
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            return result.data || result || [];
        } catch (error) {
            console.error('❌ Error al obtener provincias:', error);
            return [];
        }
    }

    // Cargar municipios de una provincia
    async function loadMunicipios(provinciaId) {
        if (!municipioSelector || !provinciaId) return;
        
        // Si ya tenemos municipios en caché para esta provincia, usarlos
        if (municipiosCache[provinciaId]) {
            municipioSelector.populate(municipiosCache[provinciaId], formData?.municipio_id);
            municipioSelector.setDisabled(false);
            return;
        }
        
        // Si ya está cargando para esta provincia, esperar
        if (municipiosLoading[provinciaId]) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (municipiosCache[provinciaId]) {
                municipioSelector.populate(municipiosCache[provinciaId], formData?.municipio_id);
                municipioSelector.setDisabled(false);
            }
            return;
        }
        
        municipiosLoading[provinciaId] = true;

        try {
            municipioSelector.setDisabled(true);
            if (distritoSelector) distritoSelector.setDisabled(true);

            const url = getUrl('departamentos') + `?provincia_id=${provinciaId}`;
            console.log('📤 Cargando municipios desde:', url);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Municipios recibidos:', result);

            const municipios = result.data || result || [];
            municipiosCache[provinciaId] = municipios; // Guardar en caché
            municipioSelector.populate(municipios, formData?.municipio_id);
            municipioSelector.setDisabled(false);

        } catch (error) {
            console.error('❌ Error al cargar municipios:', error);
            if (window.ErrorModal) {
                window.ErrorModal.show('No se pudieron cargar los municipios', 'Error');
            }
        } finally {
            municipiosLoading[provinciaId] = false;
        }
    }

    // Función auxiliar para obtener municipios (retorna array)
    async function fetchMunicipios(provinciaId) {
        try {
            const url = getUrl('departamentos') + `?provincia_id=${provinciaId}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            return result.data || result || [];
        } catch (error) {
            console.error('❌ Error al obtener municipios:', error);
            return [];
        }
    }

    // Cargar distritos de un municipio
    async function loadDistritos(municipioId) {
        if (!distritoSelector || !municipioId) return;
        
        // Si ya tenemos distritos en caché para este municipio, usarlos
        if (distritosCache[municipioId]) {
            distritoSelector.populate(distritosCache[municipioId], formData?.distrito_id);
            distritoSelector.setDisabled(false);
            return;
        }
        
        // Si ya está cargando para este municipio, esperar
        if (distritosLoading[municipioId]) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (distritosCache[municipioId]) {
                distritoSelector.populate(distritosCache[municipioId], formData?.distrito_id);
                distritoSelector.setDisabled(false);
            }
            return;
        }
        
        distritosLoading[municipioId] = true;

        try {
            distritoSelector.setDisabled(true);

            const url = getUrl('distritos') + `?departamento_id=${municipioId}`;
            console.log('📤 Cargando distritos desde:', url);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Distritos recibidos:', result);

            const distritos = result.data || result || [];
            distritosCache[municipioId] = distritos; // Guardar en caché
            distritoSelector.populate(distritos, formData?.distrito_id);
            distritoSelector.setDisabled(false);

        } catch (error) {
            console.error('❌ Error al cargar distritos:', error);
            if (window.ErrorModal) {
                window.ErrorModal.show('No se pudieron cargar los distritos', 'Error');
            }
        } finally {
            distritosLoading[municipioId] = false;
        }
    }

    // Función auxiliar para obtener distritos (retorna array)
    async function fetchDistritos(municipioId) {
        try {
            const url = getUrl('distritos') + `?departamento_id=${municipioId}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            return result.data || result || [];
        } catch (error) {
            console.error('❌ Error al obtener distritos:', error);
            return [];
        }
    }

    // Validar formulario
    function validateForm() {
        if (!window.Validators) {
            console.error('❌ Validators no disponible');
            return false;
        }

        let isValid = true;
        const fields = [];

        // Validar calle
        const calle = document.getElementById('calle');
        fields.push({ element: calle, validator: () => window.Validators.validateStreet(calle.value, true, 3) });

        // Validar número (si no está marcado "sin número")
        if (!sinNumero.checked) {
            fields.push({ element: numeroInput, validator: () => window.Validators.validateAddressNumber(numeroInput.value, true, 10) });
        }

        // Validar código postal
        const codigoPostal = document.getElementById('codigo_postal');
        fields.push({ element: codigoPostal, validator: () => window.Validators.validatePostalCode(codigoPostal.value, true) });

        // Validar piso (opcional, solo si tiene valor)
        const piso = document.getElementById('piso');
        if (piso.value.trim()) {
            fields.push({ element: piso, validator: () => window.Validators.validateFloorDept(piso.value, false, 1, 5) });
        }

        // Validar depto (opcional, solo si tiene valor)
        const depto = document.getElementById('depto');
        if (depto.value.trim()) {
            fields.push({ element: depto, validator: () => window.Validators.validateFloorDept(depto.value, false, 1, 5) });
        }

        // Validar todos los campos
        fields.forEach(({ element, validator }) => {
            const result = validator();
            if (!result.valid) {
                window.Validators.showError(element, result.message);
                isValid = false;
            } else {
                window.Validators.removeError(element);
            }
        });

        // Validar selectores
        const selectorsToValidate = [
            { selector: provinciaSelector, btnId: 'provincia-btn', message: 'Debe seleccionar una provincia' },
            { selector: municipioSelector, btnId: 'municipio-btn', message: 'Debe seleccionar un municipio' },
            { selector: distritoSelector, btnId: 'distrito-btn', message: 'Debe seleccionar un distrito' }
        ];

        selectorsToValidate.forEach(({ selector, btnId, message }) => {
            if (!selector || !selector.getValue()) {
                const btn = document.getElementById(btnId);
                window.Validators.showError(btn, message);
                isValid = false;
            }
        });

        return isValid;
    }

    // Sanitizar datos del formulario
    function sanitizeFormData() {
        if (!window.Sanitizer) {
            console.error('❌ Sanitizer no disponible');
            return {};
        }

        const data = {};

        // Sanitizar campos de texto
        data.calle = window.Sanitizer.sanitizeStreet(document.getElementById('calle').value);
        data.codigo_postal = window.Sanitizer.sanitizePostalCode(document.getElementById('codigo_postal').value);
        
        const piso = document.getElementById('piso');
        data.piso = piso.value.trim() ? window.Sanitizer.sanitizeFloor(piso.value) : '';
        
        const depto = document.getElementById('depto');
        data.depto = depto.value.trim() ? window.Sanitizer.sanitizeDept(depto.value) : '';

        // Número de calle (puede ser S/N)
        if (sinNumero.checked) {
            data.numero = 'S/N';
            data['sin-numero'] = true;
        } else {
            data.numero = window.Sanitizer.sanitizeAddressNumber(numeroInput.value);
            data['sin-numero'] = false;
        }

        // IDs de selectores
        if (provinciaSelector) {
            data.provincia_id = provinciaSelector.getValue();
            const provinciaItem = provinciaSelector.getSelectedItem();
            data.provincia = provinciaItem ? provinciaItem.nombre : '';
        }

        if (municipioSelector) {
            data.municipio_id = municipioSelector.getValue();
            const municipioItem = municipioSelector.getSelectedItem();
            data.municipio = municipioItem ? municipioItem.nombre : '';
        }

        if (distritoSelector) {
            data.distrito_id = distritoSelector.getValue();
            const distritoItem = distritoSelector.getSelectedItem();
            data.distrito = distritoItem ? distritoItem.nombre : '';
        }

        return data;
    }

    // Función para restaurar datos previos del formulario
    async function restoreFormData() {
        // Si hay dirección_id, significa que se usó dirección registrada
        if (formData.direccion_id) {
            direccionRegistradaId = formData.direccion_id;
            
            // Rellenar campos con datos guardados
            document.getElementById('calle').value = formData.calle || '';
            document.getElementById('numero').value = formData.numero || '';
            document.getElementById('codigo_postal').value = formData.codigo_postal || '';
            document.getElementById('piso').value = formData.piso || '';
            document.getElementById('depto').value = formData.depto || '';
            
            // Cargar provincias y restaurar selección
            await loadProvincias();
            
            if (formData.provincia && provinciaSelector && provinciasCache) {
                const provinciaEncontrada = provinciasCache.find(p => 
                    p.nombre.toLowerCase() === formData.provincia.toLowerCase()
                );
                
                if (provinciaEncontrada) {
                    provinciaSelector.selectItem(provinciaEncontrada, true);
                    await loadMunicipios(provinciaEncontrada.id);
                    
                    if (formData.municipio && municipioSelector && municipiosCache[provinciaEncontrada.id]) {
                        const municipioEncontrado = municipiosCache[provinciaEncontrada.id].find(m => 
                            m.nombre.toLowerCase() === formData.municipio.toLowerCase()
                        );
                        
                        if (municipioEncontrado) {
                            municipioSelector.selectItem(municipioEncontrado, true);
                            await loadDistritos(municipioEncontrado.id);
                            
                            if (formData.distrito && distritoSelector && distritosCache[municipioEncontrado.id]) {
                                const distritoEncontrado = distritosCache[municipioEncontrado.id].find(d => 
                                    d.nombre.toLowerCase() === formData.distrito.toLowerCase()
                                );
                                
                                if (distritoEncontrado) {
                                    distritoSelector.selectItem(distritoEncontrado, true);
                                }
                            }
                        }
                    }
                }
            }
            
            // Marcar el checkbox DESPUÉS de cargar todo (para evitar trigger del evento)
            useRegisteredAddress.checked = true;
            
            // Deshabilitar campos porque se usa dirección registrada
            document.getElementById('calle').disabled = true;
            document.getElementById('numero').disabled = true;
            document.getElementById('codigo_postal').disabled = true;
            document.getElementById('piso').disabled = true;
            document.getElementById('depto').disabled = true;
            sinNumero.disabled = true;
            if (provinciaSelector) provinciaSelector.setDisabled(true);
            if (municipioSelector) municipioSelector.setDisabled(true);
            if (distritoSelector) distritoSelector.setDisabled(true);
            
        } else if (formData.direccion) {
            // Dirección manual: restaurar desde formData.direccion
            const dir = formData.direccion;
            
            document.getElementById('calle').value = dir.calle || '';
            document.getElementById('numero').value = dir.numero || '';
            document.getElementById('codigo_postal').value = dir.codigo_postal || '';
            document.getElementById('piso').value = dir.piso || '';
            document.getElementById('depto').value = dir.depto || '';
            
            // Configurar "sin número" si aplica
            if (dir.numero === 'S/N') {
                sinNumero.checked = true;
                numeroInput.disabled = true;
                numeroInput.classList.add('bg-gray-100', 'cursor-not-allowed');
            }
            
            // Cargar provincias y restaurar selección
            await loadProvincias();
            
            if (dir.provincia_id && provinciaSelector) {
                const provincias = await fetchProvincias();
                const provinciaEncontrada = provincias.find(p => p.id === dir.provincia_id);
                
                if (provinciaEncontrada) {
                    provinciaSelector.selectItem(provinciaEncontrada, false);
                    await loadMunicipios(provinciaEncontrada.id);
                    
                    if (dir.municipio_id && municipioSelector) {
                        const municipios = await fetchMunicipios(provinciaEncontrada.id);
                        const municipioEncontrado = municipios.find(m => m.id === dir.municipio_id);
                        
                        if (municipioEncontrado) {
                            municipioSelector.selectItem(municipioEncontrado, false);
                            await loadDistritos(municipioEncontrado.id);
                            
                            if (dir.distrito_id && distritoSelector) {
                                const distritos = await fetchDistritos(municipioEncontrado.id);
                                const distritoEncontrado = distritos.find(d => d.id === dir.distrito_id);
                                
                                if (distritoEncontrado) {
                                    distritoSelector.selectItem(distritoEncontrado, false);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // No hay datos previos: solo cargar provincias
            await loadProvincias();
        }
    }

    if (sinNumero && numeroInput) {
        console.log('✅ Checkbox "sin-numero" encontrado, agregando listener');
        console.log('🔧 Agregando event listener "change" al checkbox sin-numero');
        sinNumero.addEventListener('change', (e) => {
            console.log('🔥🔥🔥 EVENT LISTENER DISPARADO - Checkbox sin-numero cambiado:', e.target.checked);
            if (e.target.checked) {
                numeroInput.disabled = true;
                numeroInput.value = 'S/N';
                numeroInput.classList.add('bg-gray-100', 'cursor-not-allowed');
                if (window.Validators) {
                    window.Validators.removeError(numeroInput);
                }
            } else {
                numeroInput.disabled = false;
                numeroInput.value = '';
                numeroInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        });
    } else {
        console.error('❌ No se encontró el checkbox sin-numero o el input numero');
    }

    // Función auxiliar para buscar y seleccionar provincia/municipio/distrito por id_distrito
    async function buscarYSeleccionarPorIdDistrito(idDistrito) {
        console.log('🔍 Buscando ubicación por id_distrito:', idDistrito);
        
        try {
            // Cargar todas las provincias
            await loadProvincias();
            
            // Iterar por todas las provincias
            for (const provincia of provinciasCache) {
                // Cargar municipios de esta provincia
                await loadMunicipios(provincia.id);
                
                if (municipiosCache[provincia.id]) {
                    // Iterar por todos los municipios
                    for (const municipio of municipiosCache[provincia.id]) {
                        // Cargar distritos de este municipio
                        await loadDistritos(municipio.id);
                        
                        if (distritosCache[municipio.id]) {
                            // Buscar el distrito por ID
                            const distrito = distritosCache[municipio.id].find(d => d.id === idDistrito);
                            
                            if (distrito) {
                                console.log('✅ ¡Distrito encontrado!');
                                console.log('  - Provincia:', provincia.nombre);
                                console.log('  - Municipio:', municipio.nombre);
                                console.log('  - Distrito:', distrito.nombre);
                                
                                // Seleccionar en cascada
                                provinciaSelector.selectItem(provincia, false);
                                await loadMunicipios(provincia.id);
                                municipioSelector.selectItem(municipio, false);
                                await loadDistritos(municipio.id);
                                distritoSelector.selectItem(distrito, false);
                                
                                return true; // Encontrado
                            }
                        }
                    }
                }
            }
            
            console.warn('⚠️ No se encontró el distrito con ID:', idDistrito);
            return false;
            
        } catch (error) {
            console.error('❌ Error al buscar por id_distrito:', error);
            return false;
        }
    }
    
    // Adaptar texto del checkbox según el contexto
    if (useRegisteredAddress) {
        const isAtencionContext = window.location.pathname.includes('/atencion') || 
                                 window.AtencionNuevasConexiones !== undefined;
        
        if (isAtencionContext) {
            const label = document.querySelector('label[for="use-registered-address"]');
            if (label) {
                label.textContent = 'Utilizar dirección del cliente registrado';
                console.log('📝 Texto del checkbox adaptado para contexto de atención');
            }
        }
        
        useRegisteredAddress.addEventListener('change', async (e) => {
        // Si ya hay un direccionRegistradaId guardado, significa que estamos restaurando
        // y no debemos hacer el fetch nuevamente
        if (e.target.checked && direccionRegistradaId) {
            console.log('⚠️ Ya hay dirección registrada cargada, omitiendo fetch');
            return;
        }
        
        const calle = document.getElementById('calle');
        const numero = document.getElementById('numero');
        const codigo_postal = document.getElementById('codigo_postal');
        const piso = document.getElementById('piso');
        const depto = document.getElementById('depto');

        if (e.target.checked) {
            try {
                // DETECCIÓN DE CONTEXTO: Panel de atención vs flujo normal
                const isAtencionContext = window.location.pathname.includes('/atencion') || 
                                         window.AtencionNuevasConexiones !== undefined;
                
                let direccionData = null;
                
                if (isAtencionContext) {
                    // CONTEXTO ATENCIÓN: Usar dirección del cliente recién creado
                    console.log('🏢 Contexto: Panel de Atención');
                    console.log('📋 Buscando dirección en window.clienteNuevo...');
                    
                    // Intentar obtener clienteNuevo desde el scope del módulo de atención
                    const clienteNuevo = window.AtencionNuevasConexiones?.clienteNuevo || 
                                        formData?.clienteNuevo;
                    
                    if (clienteNuevo?.direccion) {
                        console.log('✅ Dirección encontrada en clienteNuevo:', JSON.stringify(clienteNuevo.direccion, null, 2));
                        
                        // SOLUCIÓN SIMPLE: Usar solo id_distrito y dejar que los selectores se carguen después
                        direccionData = {
                            id_direccion: clienteNuevo.direccion.id_direccion || null,
                            calle: clienteNuevo.direccion.calle,
                            numero: clienteNuevo.direccion.numero,
                            codigo_postal: clienteNuevo.direccion.codigo_postal,
                            piso: clienteNuevo.direccion.piso || '',
                            depto: clienteNuevo.direccion.depto || '',
                            // Usar nombres si existen, sino undefined (se buscarán por ID después)
                            provincia: clienteNuevo.direccion.provincia,
                            departamento: clienteNuevo.direccion.municipio,
                            distrito: clienteNuevo.direccion.distrito,
                            // CRÍTICO: Siempre incluir el id_distrito para búsqueda por ID
                            id_distrito: clienteNuevo.direccion.id_distrito
                        };
                        
                        console.log('📦 direccionData construido:', JSON.stringify(direccionData, null, 2));
                    } else {
                        console.error('❌ No se encontró dirección en clienteNuevo');
                        console.error('❌ clienteNuevo:', clienteNuevo);
                        throw new Error('No se encontró la dirección del cliente registrado');
                    }
                } else {
                    // CONTEXTO NORMAL: Hacer fetch al backend
                    console.log('👤 Contexto: Flujo Normal (Cliente Autenticado)');
                    
                    const token = window.AuthToken?.getToken();
                    
                    if (!token) {
                        throw new Error('No se encontró el token de autenticación');
                    }
                    
                    const endpoint = getUrl('usarDireccionRegistrada');
                    console.log('📤 Obteniendo dirección registrada desde:', endpoint);
                    
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });

                    console.log('📥 Respuesta recibida - Status:', response.status);

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => null);
                        console.error('❌ Error del servidor:', errorData);
                        throw new Error(errorData?.error || errorData?.message || `Error ${response.status}: No se pudo obtener la dirección registrada`);
                    }
                    
                    const result = await response.json();
                    console.log('📦 Datos del perfil recibidos:', result);
                    direccionData = result.data;
                }

                if (direccionData) {
                    // Guardar el ID de la dirección registrada
                    direccionRegistradaId = direccionData.id_direccion || null;
                    console.log('💾 ID de dirección registrada:', direccionRegistradaId);

                    // Rellenar campos de texto
                    calle.value = direccionData.calle || '';
                    numero.value = direccionData.numero || '';
                    codigo_postal.value = direccionData.codigo_postal || '';
                    piso.value = direccionData.piso || '';
                    depto.value = direccionData.depto || '';

                    // Cargar provincias primero
                    await loadProvincias();

                    // ESTRATEGIA: Si no hay nombres pero sí id_distrito, buscar por ID
                    const useIdSearch = !direccionData.provincia && direccionData.id_distrito;
                    
                    if (useIdSearch) {
                        console.log('🔍 Modo: Búsqueda por ID (id_distrito:', direccionData.id_distrito, ')');
                        // Buscar distrito por ID en todas las provincias/municipios
                        await buscarYSeleccionarPorIdDistrito(direccionData.id_distrito);
                    } else {
                        console.log('🔍 Modo: Búsqueda por nombres');
                        console.log('🔍 Buscando provincia:', direccionData.provincia);
                        console.log('🔍 provinciasCache disponible:', provinciasCache ? `Sí (${provinciasCache.length} items)` : 'No');
                    }
                    
                    // Solo ejecutar búsqueda por nombres si NO usamos búsqueda por ID
                    if (!useIdSearch) {
                    
                    if (direccionData.provincia && provinciaSelector && provinciasCache) {
                        const provinciaEncontrada = provinciasCache.find(p => 
                            p.nombre.toLowerCase() === direccionData.provincia.toLowerCase()
                        );
                        
                        if (provinciaEncontrada) {
                            console.log('✅ Provincia encontrada:', provinciaEncontrada);
                            // No disparar onChange (false) al seleccionar dirección registrada
                            provinciaSelector.selectItem(provinciaEncontrada, false);
                            await loadMunicipios(provinciaEncontrada.id);
                            
                            // Buscar y seleccionar municipio por nombre
                            console.log('🔍 Buscando municipio:', direccionData.departamento);
                            console.log('🔍 municipiosCache disponible para provincia', provinciaEncontrada.id, ':', municipiosCache[provinciaEncontrada.id] ? `Sí (${municipiosCache[provinciaEncontrada.id].length} items)` : 'No');
                            
                            if (direccionData.departamento && municipioSelector && municipiosCache[provinciaEncontrada.id]) {
                                const municipioEncontrado = municipiosCache[provinciaEncontrada.id].find(m => 
                                    m.nombre.toLowerCase() === direccionData.departamento.toLowerCase()
                                );
                                
                                if (municipioEncontrado) {
                                    console.log('✅ Municipio encontrado:', municipioEncontrado);
                                    // No disparar onChange (false) al seleccionar dirección registrada
                                    municipioSelector.selectItem(municipioEncontrado, false);
                                    await loadDistritos(municipioEncontrado.id);
                                    
                                    // Buscar y seleccionar distrito por nombre
                                    console.log('🔍 Buscando distrito:', direccionData.distrito);
                                    console.log('🔍 distritosCache disponible para municipio', municipioEncontrado.id, ':', distritosCache[municipioEncontrado.id] ? `Sí (${distritosCache[municipioEncontrado.id].length} items)` : 'No');
                                    
                                    if (direccionData.distrito && distritoSelector && distritosCache[municipioEncontrado.id]) {
                                        const distritoEncontrado = distritosCache[municipioEncontrado.id].find(d => 
                                            d.nombre.toLowerCase() === direccionData.distrito.toLowerCase()
                                        );
                                        
                                        if (distritoEncontrado) {
                                            console.log('✅ Distrito encontrado:', distritoEncontrado);
                                            // No disparar onChange (false) al seleccionar dirección registrada
                                            distritoSelector.selectItem(distritoEncontrado, false);
                                        } else {
                                            console.warn('⚠️ Distrito no encontrado:', direccionData.distrito);
                                            console.warn('⚠️ Distritos disponibles:', distritosCache[municipioEncontrado.id].map(d => d.nombre));
                                        }
                                    } else {
                                        console.warn('⚠️ No se puede buscar distrito - falta datos o cache');
                                    }
                                } else {
                                    console.warn('⚠️ Municipio no encontrado:', direccionData.departamento);
                                    console.warn('⚠️ Municipios disponibles:', municipiosCache[provinciaEncontrada.id].map(m => m.nombre));
                                }
                            } else {
                                console.warn('⚠️ No se puede buscar municipio - falta datos o cache');
                            }
                        } else {
                            console.warn('⚠️ Provincia no encontrada:', direccionData.provincia);
                            console.warn('⚠️ Provincias disponibles:', provinciasCache.map(p => p.nombre));
                        }
                    } else {
                        console.warn('⚠️ No se puede buscar provincia - falta datos o selectores');
                        console.warn('  - direccionData.provincia:', direccionData.provincia);
                        console.warn('  - provinciaSelector:', !!provinciaSelector);
                        console.warn('  - provinciasCache:', !!provinciasCache);
                    }
                    } // Cierre del if (!useIdSearch)

                    // Deshabilitar todos los campos
                    calle.disabled = true;
                    numero.disabled = true;
                    codigo_postal.disabled = true;
                    piso.disabled = true;
                    depto.disabled = true;
                    sinNumero.disabled = true;
                    if (provinciaSelector) provinciaSelector.setDisabled(true);
                    if (municipioSelector) municipioSelector.setDisabled(true);
                    if (distritoSelector) distritoSelector.setDisabled(true);
                } else {
                    throw new Error('No se encontraron datos de dirección');
                }
            } catch (err) {
                console.error('❌ Error al cargar dirección:', err);
                
                // Mostrar error más detallado
                let errorMessage = 'No se pudo autocompletar la dirección registrada.';
                
                if (err.message) {
                    errorMessage += '\n\nDetalle: ' + err.message;
                }
                
                if (window.ErrorModal) {
                    window.ErrorModal.show(errorMessage, 'Error al cargar dirección');
                } else {
                    alert(errorMessage);
                }
                
                // Desmarcar el checkbox en caso de error
                useRegisteredAddress.checked = false;
            }
        } else {
            // Limpiar y habilitar campos
            form.reset();
            direccionRegistradaId = null; // Limpiar ID guardado
            calle.disabled = false;
            numero.disabled = false;
            codigo_postal.disabled = false;
            piso.disabled = false;
            depto.disabled = false;
            sinNumero.disabled = false;
            if (provinciaSelector) {
                provinciaSelector.reset();
                provinciaSelector.setDisabled(false);
            }
            if (municipioSelector) {
                municipioSelector.reset();
                municipioSelector.setDisabled(false);
            }
            if (distritoSelector) {
                distritoSelector.reset();
                distritoSelector.setDisabled(false);
            }
            await loadProvincias();
        }
        });
    } else {
        console.warn('⚠️ Checkbox "use-registered-address" no encontrado (contexto de atención)');
    }

    // Manejar envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Preparar payload final
        let finalPayload = {};

        if (useRegisteredAddress && useRegisteredAddress.checked && direccionRegistradaId) {
            // Si usa dirección registrada, guardar el ID y también los datos para el resumen
            finalPayload.direccion_id = direccionRegistradaId;
            // Guardar también los datos en el nivel superior para el resumen
            finalPayload.calle = document.getElementById('calle').value;
            finalPayload.numero = document.getElementById('numero').value;
            finalPayload.codigo_postal = document.getElementById('codigo_postal').value;
            finalPayload.piso = document.getElementById('piso').value || '';
            finalPayload.depto = document.getElementById('depto').value || '';
            if (provinciaSelector) {
                const provinciaItem = provinciaSelector.getSelectedItem();
                finalPayload.provincia = provinciaItem ? provinciaItem.nombre : '';
            }
            if (municipioSelector) {
                const municipioItem = municipioSelector.getSelectedItem();
                finalPayload.municipio = municipioItem ? municipioItem.nombre : '';
            }
            if (distritoSelector) {
                const distritoItem = distritoSelector.getSelectedItem();
                finalPayload.distrito = distritoItem ? distritoItem.nombre : '';
            }
            console.log('📤 Usando dirección registrada con ID:', direccionRegistradaId);
        } else {
            // Si NO usa dirección registrada, validar y enviar todos los datos

            // Validar
            if (!validateForm()) {
                console.warn('⚠️ Validación fallida');
                // Hacer scroll al primer error
                const firstError = form.querySelector('.border-red-500');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
                return;
            }

            // Sanitizar y empaquetar datos en objeto "direccion"
            const sanitizedData = sanitizeFormData();
            console.log('✅ Datos sanitizados:', sanitizedData);
            
            finalPayload.direccion = {
                calle: sanitizedData.calle,
                numero: sanitizedData.numero,
                codigo_postal: sanitizedData.codigo_postal,
                piso: sanitizedData.piso || null,
                depto: sanitizedData.depto || null,
                provincia_id: sanitizedData.provincia_id,
                municipio_id: sanitizedData.municipio_id,
                distrito_id: sanitizedData.distrito_id
            };
            // Guardar también nombres para el resumen
            finalPayload.direccion.provincia = sanitizedData.provincia;
            finalPayload.direccion.municipio = sanitizedData.municipio;
            finalPayload.direccion.distrito = sanitizedData.distrito;
        }

        // Mostrar JSON final solo en development
        const isDevelopment = window.ENV?.MODE === 'development' || 
                              window.AppConfig?.ENV?.MODE === 'development';
        
        if (isDevelopment) {
            displayFinalJSON(finalPayload);
        }

        // Actualizar formData global con el payload completo (preservando datos anteriores)
        Object.assign(formData, finalPayload);

        // LOGGING: Estado de formData después del Paso 1
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 PASO 1 COMPLETADO - Domicilio de Instalación');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📍 Dirección registrada ID:', formData.direccion_id || 'N/A');
        console.log('📍 Datos de dirección:', formData.direccion);
        console.log('📦 FormData completo:', JSON.stringify(formData, null, 2));
        console.log('═══════════════════════════════════════════════════════');

        // Navegar al siguiente paso
        navigate(1);
    });

    // Botón anterior
    prevBtn.addEventListener('click', () => {
        navigate(-1);
    });

    // Función para mostrar JSON final (solo en development)
    function displayFinalJSON(payload) {
        // Remover panel anterior si existe
        const existingPanel = document.getElementById('dev-json-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Crear panel de desarrollo de forma segura
        const panel = document.createElement('div');
        panel.id = 'dev-json-panel';
        panel.className = 'mt-6 p-4 bg-gray-900 text-green-400 rounded-lg border-2 border-green-500 font-mono text-sm';
        
        // Header
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-2';
        
        const title = document.createElement('h3');
        title.className = 'text-green-300 font-bold flex items-center gap-2';
        const titleSpan = document.createElement('span');
        titleSpan.textContent = '🔧 DEV MODE - JSON Final';
        title.appendChild(titleSpan);
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.id = 'close-dev-panel';
        closeBtn.className = 'text-red-400 hover:text-red-300 font-bold text-lg';
        closeBtn.title = 'Cerrar panel';
        closeBtn.textContent = '✕';
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        
        // JSON Preview (usando textContent para prevenir XSS)
        const pre = document.createElement('pre');
        pre.className = 'overflow-x-auto whitespace-pre-wrap break-words max-h-96 overflow-y-auto';
        pre.textContent = JSON.stringify(payload, null, 2);
        panel.appendChild(pre);
        
        // Botones
        const btnContainer = document.createElement('div');
        btnContainer.className = 'mt-3 flex gap-2';
        
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.id = 'copy-json-btn';
        copyBtn.className = 'bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition';
        copyBtn.textContent = '📋 Copiar JSON';
        
        const logBtn = document.createElement('button');
        logBtn.type = 'button';
        logBtn.id = 'log-json-btn';
        logBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition';
        logBtn.textContent = '🖨️ Log a Console';
        
        btnContainer.appendChild(copyBtn);
        btnContainer.appendChild(logBtn);
        panel.appendChild(btnContainer);

        // Insertar antes de los botones de navegación
        const buttonsDiv = form.querySelector('.mt-8');
        form.insertBefore(panel, buttonsDiv);

        // Botón para cerrar el panel
        document.getElementById('close-dev-panel')?.addEventListener('click', () => {
            panel.remove();
        });

        // Botón para copiar JSON
        document.getElementById('copy-json-btn')?.addEventListener('click', () => {
            const jsonText = JSON.stringify(payload, null, 2);
            navigator.clipboard.writeText(jsonText).then(() => {
                const btn = document.getElementById('copy-json-btn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copiado!';
                btn.classList.add('bg-green-800');
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('bg-green-800');
                }, 2000);
            }).catch(err => {
                console.error('Error al copiar:', err);
                alert('No se pudo copiar al portapapeles');
            });
        });

        // Botón para log a consola
        document.getElementById('log-json-btn')?.addEventListener('click', () => {
            console.log('📤 JSON Final del Formulario:', payload);
            const btn = document.getElementById('log-json-btn');
            const originalText = btn.textContent;
            btn.textContent = '✅ Logged!';
            btn.classList.add('bg-blue-800');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-blue-800');
            }, 2000);
        });
    }

    // Inicializar selectores y restaurar datos
    initCustomSelects();
    restoreFormData();
}

/**
 * Reinicializa los CustomSelect (útil cuando se clonan los botones)
 */
export function reinitCustomSelects() {
    console.log('🔄 Reinicializando CustomSelect en contrato_paso1...');
    initCustomSelects();
}
