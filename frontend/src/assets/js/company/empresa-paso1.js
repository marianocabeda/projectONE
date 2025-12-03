/**
 * Formulario de Registro de Empresa - Paso 1: Datos Básicos
 * Nombre comercial, Razón Social, CUIT, Tipo de sociedad
 */

export const content = `
    <form id="empresa-step1-form" novalidate>
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Paso 1: Datos Básicos de la Empresa</h2>
        <div class="space-y-4">
            <div>
                <label for="nombre_comercial" class="block text-sm font-medium text-gray-700">
                    Nombre Comercial *
                </label>
                <input 
                    type="text" 
                    id="nombre_comercial" 
                    name="nombre_comercial" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-sanitize="text"
                    maxlength="100"
                    placeholder="Ej: Mi Empresa Tech"
                    aria-label="Nombre comercial de la empresa"
                    aria-describedby="nombre-comercial-help"
                >
                <p id="nombre-comercial-help" class="mt-1 text-xs text-gray-500">
                    El nombre con el que se conoce tu empresa.
                </p>
            </div>

            <div>
                <label for="razon_social" class="block text-sm font-medium text-gray-700">
                    Razón Social *
                </label>
                <input 
                    type="text" 
                    id="razon_social" 
                    name="razon_social" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-sanitize="text"
                    maxlength="150"
                    placeholder="Ej: Mi Empresa Tech S.R.L."
                    aria-label="Razón social de la empresa"
                    aria-describedby="razon-social-help"
                >
                <p id="razon-social-help" class="mt-1 text-xs text-gray-500">
                    El nombre legal registrado de tu empresa.
                </p>
            </div>

            <div>
                <label for="cuit" class="block text-sm font-medium text-gray-700">
                    CUIT *
                </label>
                <input 
                    type="text" 
                    id="cuit" 
                    name="cuit" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm font-mono" 
                    required
                    data-validate="cuit"
                    pattern="\\d{2}-\\d{8}-\\d{1}"
                    maxlength="13"
                    placeholder="XX-XXXXXXXX-X"
                    aria-label="CUIT de la empresa"
                    aria-describedby="cuit-help"
                >
                <p id="cuit-help" class="mt-1 text-xs text-gray-500">
                    Formato: XX-XXXXXXXX-X (se auto-formatea mientras escribís).
                </p>
            </div>

            <div>
                <label for="tipo_sociedad" class="block text-sm font-medium text-gray-700">
                    Tipo de Sociedad *
                </label>
                <select 
                    id="tipo_sociedad" 
                    name="tipo_sociedad" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm"
                    required
                    aria-label="Tipo de sociedad"
                >
                    <option value="">Seleccionar tipo de sociedad</option>
                    <option value="S.A.">Sociedad Anónima (S.A.)</option>
                    <option value="S.R.L.">Sociedad de Responsabilidad Limitada (S.R.L.)</option>
                    <option value="S.A.S.">Sociedad por Acciones Simplificada (S.A.S.)</option>
                    <option value="S.C.">Sociedad Colectiva (S.C.)</option>
                    <option value="S.C.S.">Sociedad en Comandita Simple (S.C.S.)</option>
                    <option value="S.C.A.">Sociedad en Comandita por Acciones (S.C.A.)</option>
                    <option value="S.H.">Sociedad de Hecho (S.H.)</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Autónomo">Autónomo</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>
        </div>
        
        <div class="mt-8 flex justify-between items-center">
            <p class="text-xs text-gray-500">* Campos obligatorios</p>
            <button 
                type="submit" 
                id="submit-btn"
                disabled
                class="bg-principal-500 text-white px-6 py-2 rounded-lg hover:bg-principal-600 transition focus:outline-none focus:ring-2 focus:ring-principal-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
            >
                Siguiente
            </button>
        </div>
    </form>
`;

export function init(navigate, formData, populateForm) {
    const form = document.getElementById('empresa-step1-form');
    if (!form) return;

    const nombreComercialInput = document.getElementById('nombre_comercial');
    const razonSocialInput = document.getElementById('razon_social');
    const cuitInput = document.getElementById('cuit');
    const tipoSociedadSelect = document.getElementById('tipo_sociedad');
    const submitBtn = document.getElementById('submit-btn');

    let cuitCheckInProgress = false;
    let cuitExists = false;

    // Rellenar campos con datos previos si existen
    populateForm(form, formData);

    // Validar estado inicial del botón si hay datos previos
    if (formData.cuit) {
        validateFormFields();
    }

    // Configurar validación en tiempo real si está disponible
    if (window.Validators) {
        window.Validators.setupRealtimeValidation(form);
    }

    // Configurar sanitización automática si está disponible
    if (window.Sanitizer) {
        window.Sanitizer.setupAutoSanitize(form);
    }

    // Auto-formatear CUIT mientras se escribe
    cuitInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Solo números
        
        if (value.length >= 2) {
            value = value.slice(0, 2) + '-' + value.slice(2);
        }
        if (value.length >= 12) {
            value = value.slice(0, 11) + '-' + value.slice(11, 12);
        }
        
        e.target.value = value;
        cuitExists = false; // Reset al modificar
        removeCuitExistsMessage(cuitInput);
        validateFormFields();
    });

    // Verificar CUIT al perder el foco
    cuitInput.addEventListener('blur', async () => {
        const cuit = cuitInput.value.replace(/-/g, ''); // Solo números

        if (window.Validators) {
            const cuitResult = window.Validators.validateCUIT(cuit);
            if (!cuitResult.valid) {
                window.Validators.showError(cuitInput, cuitResult.message);
                return;
            }
        }

        if (cuit.length === 11) {
            await checkCUITAvailability(cuit, cuitInput);
        }
    });

    // Validar campos cuando cambian
    [nombreComercialInput, razonSocialInput, tipoSociedadSelect].forEach(input => {
        input.addEventListener('input', () => validateFormFields());
        input.addEventListener('blur', () => validateFormFields());
    });

    /**
     * Valida todos los campos y habilita/deshabilita el botón Siguiente
     */
    function validateFormFields() {
        const nombreComercial = nombreComercialInput.value.trim();
        const razonSocial = razonSocialInput.value.trim();
        const cuit = cuitInput.value.replace(/-/g, '');
        const tipoSociedad = tipoSociedadSelect.value;

        let canSubmit = true;

        // Validar campos requeridos
        if (!nombreComercial || !razonSocial || !tipoSociedad) {
            canSubmit = false;
        }

        // Validar CUIT
        if (window.Validators) {
            const cuitResult = window.Validators.validateCUIT(cuit);
            if (!cuitResult.valid) {
                canSubmit = false;
            }
        } else if (cuit.length !== 11) {
            canSubmit = false;
        }

        // No permitir si el CUIT ya existe
        if (cuitExists) {
            canSubmit = false;
        }

        // Habilitar/deshabilitar botón
        submitBtn.disabled = !canSubmit;
    }

    // Manejar envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obtener valores actuales
        const nombreComercial = nombreComercialInput.value.trim();
        const razonSocial = razonSocialInput.value.trim();
        const cuit = cuitInput.value.replace(/-/g, '');
        const tipoSociedad = tipoSociedadSelect.value;

        // Validación final
        let isValid = true;

        if (!nombreComercial || !razonSocial || !cuit || !tipoSociedad) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (window.Validators) {
            const cuitResult = window.Validators.validateCUIT(cuit);
            if (!cuitResult.valid) {
                window.Validators.showError(cuitInput, cuitResult.message);
                isValid = false;
            }
        }

        if (!isValid || cuitExists) {
            return;
        }

        // Sanitizar valores antes de guardar
        let sanitizedData = {
            nombre_comercial: nombreComercial,
            razon_social: razonSocial,
            cuit: cuit,
            tipo_sociedad: tipoSociedad
        };

        if (window.Sanitizer) {
            sanitizedData = window.Sanitizer.sanitizeObject(sanitizedData);
        }

        // Actualizar formData
        Object.assign(formData, sanitizedData);

        // Navegar al siguiente paso
        navigate(1);
    });

    /**
     * Verifica si el CUIT ya existe en el sistema
     */
    async function checkCUITAvailability(cuit, inputElement) {
        if (cuitCheckInProgress) return;

        // Usar configuración centralizada
        const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
            const API_BASE_URL = window.AppConfig?.API_BASE_URL;
            if (endpoint.startsWith('http')) return endpoint;
            if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
            return endpoint;
        });

        try {
            cuitCheckInProgress = true;

            // Mostrar indicador de carga
            showCuitCheckLoading(inputElement);

            const apiUrl = getUrl('checkCUIT');

            const response = await fetch(`${apiUrl}?cuit=${encodeURIComponent(cuit)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            removeCuitCheckLoading(inputElement);

            if (response.ok) {
                const data = await response.json();

                if (data.exists) {
                    cuitExists = true;
                    showCuitExistsMessage(inputElement);
                    validateFormFields();
                } else {
                    cuitExists = false;
                    showCuitAvailableMessage(inputElement);
                    validateFormFields();
                }
            } else if (response.status === 404) {
                // CUIT no encontrado = disponible
                cuitExists = false;
                showCuitAvailableMessage(inputElement);
                validateFormFields();
            } else {
                if (window.ErrorHandler) {
                    const respErr = new Error('Error al verificar CUIT');
                    respErr.status = response.status;
                    await window.ErrorHandler.handleHTTPError(respErr, 'company', false);
                }
                removeCuitExistsMessage(inputElement);
            }
        } catch (error) {
            if (window.ErrorHandler) {
                await window.ErrorHandler.handleHTTPError(error, 'company', false);
            }
            removeCuitCheckLoading(inputElement);
            cuitExists = false;
        } finally {
            cuitCheckInProgress = false;
        }
    }

    function showCuitCheckLoading(inputElement) {
        removeCuitExistsMessage(inputElement);

        const loadingElement = document.createElement('p');
        loadingElement.className = 'text-blue-600 text-sm mt-1 cuit-check-message';
        loadingElement.textContent = '🔄 Verificando CUIT...';

        inputElement.parentElement.appendChild(loadingElement);
    }

    function removeCuitCheckLoading(inputElement) {
        const loadingElement = inputElement.parentElement.querySelector('.cuit-check-message');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    function showCuitExistsMessage(inputElement) {
        removeCuitExistsMessage(inputElement);

        const messageElement = document.createElement('div');
        messageElement.className = 'bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2 cuit-exists-message';
        
        // Crear mensaje de forma segura
        const p = document.createElement('p');
        p.className = 'text-sm text-yellow-800 mb-2';
        p.textContent = '⚠️ Este CUIT ya está registrado en el sistema.';
        messageElement.appendChild(p);
        
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'use-other-cuit-btn';
        button.className = 'text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition';
        button.textContent = 'Usar otro CUIT';
        messageElement.appendChild(button);

        inputElement.parentElement.appendChild(messageElement);
        inputElement.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500');

        document.getElementById('use-other-cuit-btn')?.addEventListener('click', () => {
            cuitInput.value = '';
            cuitInput.focus();
            removeCuitExistsMessage(inputElement);
        });
    }

    function showCuitAvailableMessage(inputElement) {
        removeCuitExistsMessage(inputElement);

        const messageElement = document.createElement('p');
        messageElement.className = 'text-green-600 text-sm mt-1 cuit-exists-message';
        messageElement.textContent = '✓ CUIT disponible';

        inputElement.parentElement.appendChild(messageElement);

        setTimeout(() => {
            removeCuitExistsMessage(inputElement);
        }, 3000);
    }

    function removeCuitExistsMessage(inputElement) {
        const existingMessage = inputElement.parentElement.querySelector('.cuit-exists-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const checkMessage = inputElement.parentElement.querySelector('.cuit-check-message');
        if (checkMessage) {
            checkMessage.remove();
        }

        inputElement.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500');
        if (!inputElement.classList.contains('border-red-500')) {
            inputElement.classList.add('border-gray-300');
        }
    }
}
