/**
 * Módulo de gestión de perfil de usuario
 * Se ejecuta cuando se carga la página de usuario en el dashboard
 */

// Guard global: si el módulo ya está cargado, solo ejecutar init
if (window.UsuarioModule) {
    window.UsuarioModule.init();
} else {
    (function() {
        'use strict';

        // Verificar dependencias requeridas
        const requiredModules = ['CacheManager', 'HTTP', 'DomHelpers', 'GeoDataLoader', 'Validators', 'Sanitizer'];
        const missingModules = requiredModules.filter(mod => !window[mod]);
        
        if (missingModules.length > 0) {
            console.error(`❌ user.js requiere: ${missingModules.join(', ')}`);
            return;
        }

    // Estado del módulo
    const CACHE_KEY = 'user:profile';
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas
    const state = {
        userData: null,
        originalData: {},
        isInitializing: false,
        selectors: {
            provincia: null,
            municipio: null,
            distrito: null
        },
        phoneWidgets: {
            telefono: null,
            telefono_alternativo: null
        }
    };

    /**
     * Inicialización del módulo
     */
    async function init() {
        // Prevenir múltiples inicializaciones simultáneas
        if (state.isInitializing) {
            console.log('⏳ Init ya en progreso, esperando...');
            return;
        }
        
        // Esperar a que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar que estamos en la página correcta
        if (!document.getElementById('user-name')) {
            return;
        }
        
        // Marcar que estamos inicializando
        state.isInitializing = true;
        
        try {
            // Primero intentar cargar desde caché
            const cachedData = window.CacheManager?.get(CACHE_KEY);
            
            if (cachedData) {
                console.log('✅ Usando datos cacheados');
                state.userData = cachedData;
                mostrarDatos();
                inicializarSelectores();
                configurarEdicion();
            } else {
                // Si no hay caché, cargar desde backend (solo una vez)
                console.log('📡 Cargando datos del backend...');
                await cargarDatos();
                inicializarSelectores();
                configurarEdicion();
            }
        } catch (error) {
            console.error('❌ Error en init:', error);
            mostrarError('Error al cargar el perfil');
        } finally {
            state.isInitializing = false;
        }
    }

    /**
     * Carga datos del backend (sin verificar caché, ya lo hace init())
     */
    async function cargarDatos() {
        if (window.ENV?.isDevelopment && window.DevMock?.user) {
            state.userData = window.DevMock.user;
            window.CacheManager.set(CACHE_KEY, state.userData, CACHE_TTL);
            mostrarDatos();
            return;
        }
        
        try {
            const url = window.AppConfig.getUrl('getUserProfile');
            console.log('🌐 Llamando al endpoint:', url);
            const response = await window.HTTP.get(url);
            
            if (!response.ok || !response.data?.success || !response.data?.data) {
                throw new Error('Respuesta inválida del servidor');
            }
            
            state.userData = response.data.data;
            // Guardar en caché con TTL de 24 horas
            console.log('💾 Guardando en caché por 24 horas');
            window.CacheManager.set(CACHE_KEY, state.userData, CACHE_TTL);
            mostrarDatos();
            
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            throw error;
        }
    }

    /**
     * Muestra los datos en el DOM
     */
    function mostrarDatos() {
        if (!state.userData) return;
        
        const { userData } = state;
        
        // Encabezado
        // Sanitizar antes de mostrar en el DOM
        const safeName = window.Sanitizer ? window.Sanitizer.sanitizeString(`${userData.nombre || ''} ${userData.apellido || ''}`) : `${userData.nombre || ''} ${userData.apellido || ''}`;
        const safeEmail = window.Sanitizer ? window.Sanitizer.sanitizeEmail(userData.email || '') : (userData.email || '');
        const safeId = window.Sanitizer ? window.Sanitizer.sanitizeNumber(String(userData.id_persona || '')) : String(userData.id_persona || '');

        // Usar la imagen por defecto si no hay foto de perfil
        const profilePicSrc = userData.foto_perfil || '/images/decoration/default.png';
        
        window.DomHelpers.setAttr('profile-picture', 'src', profilePicSrc);
        window.DomHelpers.setText('user-name', safeName);
        window.DomHelpers.setText('user-email', safeEmail);

        
        // Información Personal
        ['nombre', 'apellido', 'dni', 'cuil', 'fecha_nacimiento', 'sexo'].forEach(field => {
                const rawVal = userData[field] !== undefined && userData[field] !== null ? String(userData[field]) : '';
                const safeVal = window.Sanitizer ? window.Sanitizer.sanitizeString(rawVal) : rawVal;
                window.DomHelpers.setValue(field, safeVal);
        });
        
        // Contacto
        ['email', 'telefono', 'telefono_alternativo'].forEach(field => {
                const rawVal = userData[field] !== undefined && userData[field] !== null ? String(userData[field]) : '';
                const safeVal = window.Sanitizer ? window.Sanitizer.sanitizeString(rawVal) : rawVal;
                window.DomHelpers.setValue(field, safeVal);
        });
        
        // Domicilio
        if (userData.direccion) {
            ['calle', 'numero', 'codigo_postal', 'piso', 'depto'].forEach(field => {
                window.DomHelpers.setValue(field, userData.direccion[field]);
            });
            
            // Actualizar labels de selectores geográficos
            const geoLabels = [
                { id: 'provincia-btn', class: 'provincia-label', value: userData.direccion.provincia },
                { id: 'municipio-btn', class: 'municipio-label', value: userData.direccion.departamento },
                { id: 'distrito-btn', class: 'distrito-label', value: userData.direccion.distrito }
            ];
            
            geoLabels.forEach(({ id, class: labelClass, value }) => {
                const btn = document.getElementById(id);
                const label = btn?.querySelector(`.${labelClass}`);
                if (label) label.textContent = value || '-';
            });
        }
    }

    /**
     * Inicializa los selectores geográficos
     */
    function inicializarSelectores() {
        if (!window.CustomSelect) {
            console.error('❌ CustomSelect no está disponible');
            return;
        }

        // Configuración de selectores
        const selectorsConfig = [
            {
                key: 'provincia',
                buttonId: 'provincia-btn',
                overlayId: 'provincia-overlay',
                placeholder: 'Seleccione provincia...',
                labelClass: 'provincia-label',
                chevronClass: 'provincia-chevron',
                onSelect: async (item) => {
                    state.selectors.municipio?.reset();
                    state.selectors.municipio?.populate([], null);
                    state.selectors.distrito?.reset();
                    state.selectors.distrito?.populate([], null);
                    await cargarMunicipios(item.id);
                    actualizarBotonGuardar('domicilio');
                }
            },
            {
                key: 'municipio',
                buttonId: 'municipio-btn',
                overlayId: 'municipio-overlay',
                placeholder: 'Seleccione municipio...',
                labelClass: 'municipio-label',
                chevronClass: 'municipio-chevron',
                onSelect: async (item) => {
                    state.selectors.distrito?.reset();
                    state.selectors.distrito?.populate([], null);
                    await cargarDistritos(item.id);
                    actualizarBotonGuardar('domicilio');
                }
            },
            {
                key: 'distrito',
                buttonId: 'distrito-btn',
                overlayId: 'distrito-overlay',
                placeholder: 'Seleccione distrito...',
                labelClass: 'distrito-label',
                chevronClass: 'distrito-chevron',
                onSelect: () => actualizarBotonGuardar('domicilio')
            }
        ];

        selectorsConfig.forEach(config => {
            const { key, ...options } = config;
            state.selectors[key] = window.CustomSelect.create(options);
        });
    }

    /**
     * Carga provincias desde la API
     */
    async function cargarProvincias() {
        if (!state.selectors.provincia) return;
        await window.GeoDataLoader.loadProvincias(
            state.selectors.provincia, 
            state.userData?.direccion?.provincia_id
        );
    }

    /**
     * Carga municipios de una provincia
     */
    async function cargarMunicipios(provinciaId) {
        if (!state.selectors.municipio) return;
        state.selectors.distrito?.setDisabled(true);
        await window.GeoDataLoader.loadMunicipios(
            provinciaId, 
            state.selectors.municipio, 
            state.userData?.direccion?.municipio_id
        );
    }

    /**
     * Carga distritos de un municipio
     */
    async function cargarDistritos(municipioId) {
        if (!state.selectors.distrito) return;
        await window.GeoDataLoader.loadDistritos(
            municipioId, 
            state.selectors.distrito, 
            state.userData?.direccion?.distrito_id
        );
    }

    /**
     * Guarda el estado original de los datos para restauración
     */
    function guardarDatosOriginales(section) {
        const form = document.querySelector(`form[data-section="${section}"]`);
        if (!form) return;

        state.originalData[section] = {};
        
        // Guardar valores de inputs editables
        form.querySelectorAll('input[data-editable="true"]').forEach(input => {
            state.originalData[section][input.name] = input.value;
        });
        
        // Guardar selectores geográficos para domicilio
        if (section === 'domicilio') {
            Object.entries(state.selectors).forEach(([key, selector]) => {
                if (selector) {
                    state.originalData[section][`_${key}_id`] = selector.getValue();
                    state.originalData[section][`_${key}_item`] = selector.getSelectedItem();
                }
            });
        }
    }

    /**
     * Verifica si hay cambios en la sección
     */
    function hayaCambiosEnSeccion(section) {
        if (!state.originalData[section]) return false;

        const form = document.querySelector(`form[data-section="${section}"]`);
        if (!form) return false;

        // Verificar cambios en inputs
        const inputs = form.querySelectorAll('input[data-editable="true"]');
        for (const input of inputs) {
            const valorOriginal = state.originalData[section][input.name] || '';
            let valorActual = '';
            
            // Para teléfonos, obtener valor del widget si existe
            if (input.type === 'tel' && state.phoneWidgets[input.name]) {
                valorActual = state.phoneWidgets[input.name].getValue() || '';
            } else {
                valorActual = input.value || '';
            }
            
            if (valorOriginal !== valorActual) return true;
        }

        // Verificar cambios en selectores geográficos
        if (section === 'domicilio') {
            for (const [key, selector] of Object.entries(state.selectors)) {
                if (selector) {
                    const originalId = state.originalData[section][`_${key}_id`];
                    const currentId = selector.getValue();
                    if (originalId !== currentId) return true;
                }
            }
        }

        return false;
    }

    /**
     * Actualiza el estado del botón guardar
     */
    function actualizarBotonGuardar(section) {
        const form = document.querySelector(`form[data-section="${section}"]`);
        const saveBtn = form?.querySelector('[data-action="save"]');
        if (!saveBtn) return;

        const hayCambios = hayaCambiosEnSeccion(section);
        saveBtn.disabled = !hayCambios;
        saveBtn.classList.toggle('opacity-50', !hayCambios);
        saveBtn.classList.toggle('cursor-not-allowed', !hayCambios);
    }

    /**
     * Restaura los valores originales de la sección
     */
    function restaurarDatosOriginales(section) {
        if (!state.originalData[section]) return;

        // Restaurar inputs
        Object.entries(state.originalData[section]).forEach(([fieldName, value]) => {
            if (!fieldName.startsWith('_')) {
                window.DomHelpers.setValue(fieldName, value);
                
                // Si es un campo de teléfono con widget, actualizar también el widget
                if (state.phoneWidgets[fieldName]) {
                    state.phoneWidgets[fieldName].setValue(value);
                }
            }
        });
        
        // Restaurar selectores geográficos
        if (section === 'domicilio') {
            Object.entries(state.selectors).forEach(([key, selector]) => {
                const itemKey = `_${key}_item`;
                if (selector && state.originalData[section][itemKey]) {
                    selector.selectItem(state.originalData[section][itemKey], true);
                }
            });
        }
    }

    /**
     * Valida los campos de una sección usando Validators
     */
    function validarSeccion(section) {
        const form = document.querySelector(`form[data-section="${section}"]`);
        if (!form) return { valid: false, errors: [] };

        const errors = [];
        const validators = window.Validators;

        // Configuración de validaciones por sección
        const validationRules = {
            personal: [
                { name: 'nombre', validate: (v) => validators.validateName(v, true) },
                { name: 'apellido', validate: (v) => validators.validateName(v, true) }
            ],
            contacto: [
                { name: 'email', validate: (v) => validators.validateEmail(v, true) },
                { name: 'telefono', validate: (v) => validators.validatePhone(v, true) },
                { name: 'telefono_alternativo', validate: (v) => validators.validatePhone(v, false), optional: true }
            ],
            domicilio: [
                { name: 'calle', validate: (v) => validators.validateStreet(v, true, 3) },
                { name: 'numero', validate: (v) => validators.validateAddressNumber(v, true, 10) },
                { name: 'codigo_postal', validate: (v) => validators.validatePostalCode(v, true) },
                { name: 'piso', validate: (v) => validators.validateFloorDept(v, false, 1, 5), optional: true },
                { name: 'depto', validate: (v) => validators.validateFloorDept(v, false, 1, 5), optional: true }
            ]
        };

        // Validar campos del formulario
        const rules = validationRules[section] || [];
        rules.forEach(rule => {
            const field = form.querySelector(`[name="${rule.name}"]`);
            if (!field) return;
            
            // Para campos de teléfono, obtener valor del widget si existe
            let value;
            if (field.type === 'tel' && state.phoneWidgets[field.name]) {
                value = state.phoneWidgets[field.name].getValue();
            } else {
                value = field.value;
            }
            
            if (rule.optional && !value?.trim()) return;
            
            const result = rule.validate(value);
            if (!result.valid) {
                errors.push({ field, message: result.message });
            }
        });

        // Validar selectores geográficos para domicilio
        if (section === 'domicilio') {
            const geoSelectors = [
                { key: 'provincia', id: 'provincia-btn', message: 'Debe seleccionar una provincia' },
                { key: 'municipio', id: 'municipio-btn', message: 'Debe seleccionar un municipio' },
                { key: 'distrito', id: 'distrito-btn', message: 'Debe seleccionar un distrito' }
            ];

            geoSelectors.forEach(({ key, id, message }) => {
                if (!state.selectors[key]?.getValue()) {
                    errors.push({ field: document.getElementById(id), message });
                }
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Sanitiza datos de una sección usando Sanitizer
     * Solo incluye campos que cambiaron
     */
    function sanitizarDatosSeccion(section, formData) {
        const sanitizer = window.Sanitizer;
        const payload = {};

        // Función auxiliar para verificar si un campo cambió
        const cambio = (field) => {
            const original = state.originalData[section]?.[field] || '';
            const actual = formData[field] || '';
            return original !== actual;
        };

        // Configuración de sanitización por sección
        const sanitizeRules = {
            personal: {
                nombre: { sanitize: sanitizer.sanitizeName, changed: cambio('nombre') },
                apellido: { sanitize: sanitizer.sanitizeName, changed: cambio('apellido') }
            },
            contacto: {
                email: { sanitize: sanitizer.sanitizeEmail, changed: cambio('email') },
                telefono: { sanitize: sanitizer.sanitizePhone, changed: cambio('telefono') },
                telefono_alternativo: { 
                    sanitize: (v) => v.trim() ? sanitizer.sanitizePhone(v) : null, 
                    changed: cambio('telefono_alternativo') 
                }
            }
        };

        // Aplicar sanitización para personal y contacto
        if (section in sanitizeRules) {
            Object.entries(sanitizeRules[section]).forEach(([field, config]) => {
                if (formData[field] !== undefined && config.changed) {
                    payload[field] = config.sanitize(formData[field]);
                }
            });
        }

        // Sanitización especial para domicilio
        if (section === 'domicilio') {
            payload.direccion = {
                calle: sanitizer.sanitizeStreet(formData.calle),
                numero: sanitizer.sanitizeAddressNumber(formData.numero),
                codigo_postal: sanitizer.sanitizePostalCode(formData.codigo_postal),
                piso: formData.piso?.trim() ? sanitizer.sanitizeFloor(formData.piso) : null,
                depto: formData.depto?.trim() ? sanitizer.sanitizeDept(formData.depto) : null,
                id_distrito: Number(state.selectors.distrito?.getValue())
            };
        }

        return payload;
    }

    /**
     * Actualiza los datos en el backend
     */
    async function actualizarDatosBackend(section, data) {
        const url = window.AppConfig.getUrl('updateUserProfile');
        const response = await window.HTTP.patch(url, data);

        if (!response.ok || !response.data?.success) {
            throw new Error(response.data?.message || response.data?.error || 'Error al actualizar datos');
        }

        return response.data;
    }

    /**
     * Muestra error en el encabezado
     */
    function mostrarError(mensaje) {
        window.DomHelpers.setText('user-name', 'Error al cargar');
        document.getElementById('user-name')?.classList.add('text-red-600');
        console.error('❌', mensaje);
    }

    /**
     * Habilita campos editables y configura formateo
     */
    function habilitarCampos(form, sectionName) {
        form.querySelectorAll('input, button[type="button"][id$="-btn"]').forEach(input => {
            if (input.dataset.editable === 'true') {
                // Para campos de teléfono en contacto, usar PhoneInput widget
                if (sectionName === 'contacto' && input.type === 'tel') {
                    // Ocultar input normal y mostrar widget
                    input.classList.add('hidden');
                    const containerId = `${input.id}-widget-container`;
                    const container = document.getElementById(containerId);
                    
                    if (container && window.PhoneInput) {
                        container.classList.remove('hidden');
                        
                        // Crear widget si no existe
                        if (!state.phoneWidgets[input.name]) {
                            state.phoneWidgets[input.name] = window.PhoneInput.create({
                                containerId: containerId,
                                required: input.name === 'telefono', // Teléfono principal es requerido
                                initialValue: input.value,
                                onChange: () => actualizarBotonGuardar(sectionName),
                                onValidation: (valid, message) => {
                                    if (!valid && message) {
                                        window.Validators?.showError(input, message);
                                    } else {
                                        window.Validators?.removeError(input);
                                    }
                                    actualizarBotonGuardar(sectionName);
                                }
                            });
                        } else {
                            // Si ya existe, habilitar el widget y restaurar el valor original
                            state.phoneWidgets[input.name].setDisabled(false);
                            // No llamar setValue para no perder el valor actual
                        }
                    }
                } else {
                    // Para otros campos, habilitar normalmente
                    input.disabled = false;
                    input.classList.remove('bg-gray-100', 'cursor-not-allowed');
                    input.classList.add('bg-white');
                }
            }
        });
    }

    /**
     * Deshabilita campos editables
     */
    function deshabilitarCampos(form) {
        form.querySelectorAll('input, button[type="button"][id$="-btn"]').forEach(input => {
            window.Validators?.removeError(input);
            
            // Para campos de teléfono, deshabilitar widget y mostrar input normal
            if (input.type === 'tel' && input.dataset.editable === 'true') {
                const containerId = `${input.id}-widget-container`;
                const container = document.getElementById(containerId);
                
                if (container) {
                    container.classList.add('hidden');
                }
                
                // Deshabilitar el widget si existe
                if (state.phoneWidgets[input.name]) {
                    state.phoneWidgets[input.name].setDisabled(true);
                }
                
                input.classList.remove('hidden');
            }
            
            input.disabled = true;
            
            if (input.dataset.editable === 'false') {
                input.classList.add('bg-gray-100', 'cursor-not-allowed');
                input.classList.remove('bg-white');
            }
        });
    }

    /**
     * Carga selectores geográficos con datos guardados
     */
    async function cargarSelectoresGuardados() {
        const { direccion } = state.userData || {};
        if (!direccion) return;

        const delay = () => new Promise(resolve => setTimeout(resolve, 100));
        
        // Cargar y seleccionar provincia
        await cargarProvincias();
        await delay();
        
        if (direccion.provincia && state.selectors.provincia) {
            const provincia = state.selectors.provincia.items?.find(p => 
                p.nombre.toLowerCase() === direccion.provincia.toLowerCase()
            );
            
            if (provincia) {
                state.selectors.provincia.selectItem(provincia, true);
                await cargarMunicipios(provincia.id);
                await delay();
                
                // Cargar y seleccionar municipio
                if (direccion.departamento && state.selectors.municipio) {
                    const municipio = state.selectors.municipio.items?.find(m => 
                        m.nombre.toLowerCase() === direccion.departamento.toLowerCase()
                    );
                    
                    if (municipio) {
                        state.selectors.municipio.selectItem(municipio, true);
                        await cargarDistritos(municipio.id);
                        await delay();
                        
                        // Cargar y seleccionar distrito
                        if (direccion.distrito && state.selectors.distrito) {
                            const distrito = state.selectors.distrito.items?.find(d => 
                                d.nombre.toLowerCase() === direccion.distrito.toLowerCase()
                            );
                            
                            if (distrito) {
                                state.selectors.distrito.selectItem(distrito, true);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Muestra errores de validación
     */
    function mostrarErroresValidacion(errors) {
        errors.forEach(error => {
            if (window.Validators?.showError && error.field) {
                window.Validators.showError(error.field, error.message);
            }
        });
        
        // Scroll al primer error
        if (errors[0]?.field) {
            errors[0].field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errors[0].field.focus?.();
        }
    }

    /**
     * Recopila datos del formulario
     */
    function recopilarDatosFormulario(form) {
        const formData = {};
        form.querySelectorAll('input[data-editable="true"]').forEach(input => {
            if (!input.name) return;
            
            // Para campos de teléfono, obtener valor del widget si existe
            if (input.type === 'tel' && state.phoneWidgets[input.name]) {
                formData[input.name] = state.phoneWidgets[input.name].getValue();
            } else {
                formData[input.name] = input.value;
            }
        });
        return formData;
    }

    /**
     * Maneja el guardado exitoso
     */
    async function manejarGuardadoExitoso(form, editBtn, actions) {
        // Invalidar caché SOLO después de guardar cambios
        console.log('🔄 Invalidando caché después de guardar cambios');
        window.CacheManager.invalidate(CACHE_KEY);
        
        // Recargar datos actualizados del backend
        await cargarDatos();
        
        // Deshabilitar campos
        deshabilitarCampos(form);
        actions?.classList.add('hidden');
        editBtn.classList.remove('hidden');
        
        // Mostrar mensaje
        if (window.SuccessModal) {
            window.SuccessModal.show('Los cambios se guardaron correctamente.');
        } else {
            alert('✅ Datos actualizados correctamente');
        }
    }

    /**
     * Configurar edición de formularios
     */
    function configurarEdicion() {
        document.querySelectorAll('form[data-section]').forEach(form => {
            const sectionName = form.dataset.section;
            const editBtn = form.querySelector('[data-action="edit"]');
            const cancelBtn = form.querySelector('[data-action="cancel"]');
            const saveBtn = form.querySelector('[data-action="save"]');
            const actions = form.querySelector('[data-view="actions"]');
            
            if (!editBtn) return;
            
            // Detectar cambios en inputs
            const configurarDeteccionCambios = () => {
                form.querySelectorAll('input[data-editable="true"]').forEach(input => {
                    input.addEventListener('input', () => actualizarBotonGuardar(sectionName));
                });
            };

            // Botón EDITAR
            editBtn.addEventListener('click', async () => {
                guardarDatosOriginales(sectionName);
                habilitarCampos(form, sectionName);
                
                if (sectionName === 'domicilio') {
                    try {
                        await cargarSelectoresGuardados();
                    } catch (error) {
                        console.error('❌ Error al cargar selectores:', error);
                    }
                }
                
                actions?.classList.remove('hidden');
                editBtn.classList.add('hidden');
                configurarDeteccionCambios();
                actualizarBotonGuardar(sectionName);
            });
            
            // Botón CANCELAR
            cancelBtn?.addEventListener('click', () => {
                restaurarDatosOriginales(sectionName);
                deshabilitarCampos(form);
                actions?.classList.add('hidden');
                editBtn.classList.remove('hidden');
            });
            
            // Formulario SUBMIT (GUARDAR)
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Guardando...';
                }
                
                try {
                    // Validar
                    const validation = validarSeccion(sectionName);
                    if (!validation.valid) {
                        mostrarErroresValidacion(validation.errors);
                        return;
                    }
                    
                    // Limpiar errores previos
                    form.querySelectorAll('input, button[type="button"][id$="-btn"]').forEach(input => {
                        window.Validators?.removeError(input);
                    });
                    
                    // Recopilar y sanitizar datos
                    const formData = recopilarDatosFormulario(form);
                    const sanitizedData = sanitizarDatosSeccion(sectionName, formData);
                    
                    if (!sanitizedData || Object.keys(sanitizedData).length === 0) {
                        throw new Error('No hay datos para guardar');
                    }
                    
                    // Enviar al backend
                    await actualizarDatosBackend(sectionName, sanitizedData);
                    
                    // Guardar exitoso
                    await manejarGuardadoExitoso(form, editBtn, actions);
                    
                } catch (error) {
                    console.error('❌ Error al guardar:', error);
                    
                    if (window.ErrorModal) {
                        window.ErrorModal.show(
                            error.message || 'No se pudieron guardar los cambios. Por favor, intente nuevamente.', 
                            'Error al guardar'
                        );
                    } else {
                        alert(`❌ Error: ${error.message || 'No se pudo guardar'}`);
                    }
                    
                } finally {
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Guardar';
                    }
                }
            });
        });
    }

    // Exponer módulo globalmente
    window.UsuarioModule = {
        init: init,
        state: state,
        CACHE_KEY: CACHE_KEY
    };
    
    // Iniciar módulo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    })();
}