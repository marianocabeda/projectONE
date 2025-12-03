/**
 * Formulario de Registro de Empresa - Paso 2: Datos Fiscales y Contacto
 * Condición IVA, Email, Teléfono, Sitio web
 */

export const content = `
    <form id="empresa-step2-form" novalidate>
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Paso 2: Datos Fiscales y Contacto</h2>
        <div class="space-y-4">
            <div>
                <label for="condicion_iva" class="block text-sm font-medium text-gray-700">
                    Condición ante IVA *
                </label>
                <select 
                    id="condicion_iva" 
                    name="condicion_iva" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm"
                    required
                    aria-label="Condición ante IVA"
                >
                    <option value="">Seleccionar condición</option>
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Exento">Exento</option>
                    <option value="No Responsable">No Responsable</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                </select>
            </div>

            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                    Email de la Empresa *
                </label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-validate="email"
                    data-sanitize="email"
                    maxlength="254"
                    placeholder="contacto@empresa.com.ar"
                    aria-label="Email de la empresa"
                    aria-describedby="email-help"
                >
                <p id="email-help" class="mt-1 text-xs text-gray-500">
                    Email principal de contacto de la empresa.
                </p>
            </div>

            <div>
                <label for="telefono" class="block text-sm font-medium text-gray-700">
                    Teléfono *
                </label>
                <input 
                    type="tel" 
                    id="telefono" 
                    name="telefono" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-validate="telefono"
                    maxlength="20"
                    placeholder="2634123456"
                    aria-label="Teléfono de la empresa"
                    aria-describedby="telefono-help"
                >
                <p id="telefono-help" class="mt-1 text-xs text-gray-500">
                    Teléfono de contacto (código de área + número).
                </p>
            </div>

            <div>
                <label for="telefono_alternativo" class="block text-sm font-medium text-gray-700">
                    Teléfono Alternativo
                </label>
                <input 
                    type="tel" 
                    id="telefono_alternativo" 
                    name="telefono_alternativo" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    data-validate="telefono"
                    maxlength="20"
                    placeholder="2634987654"
                    aria-label="Teléfono alternativo de la empresa"
                >
            </div>

            <div>
                <label for="sitio_web" class="block text-sm font-medium text-gray-700">
                    Sitio Web
                </label>
                <input 
                    type="url" 
                    id="sitio_web" 
                    name="sitio_web" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    data-sanitize="text"
                    maxlength="255"
                    placeholder="https://www.miempresa.com.ar"
                    aria-label="Sitio web de la empresa"
                    aria-describedby="sitio-web-help"
                >
                <p id="sitio-web-help" class="mt-1 text-xs text-gray-500">
                    URL completa del sitio web (opcional).
                </p>
            </div>
        </div>
        
        <div class="mt-8 flex justify-between items-center">
            <button 
                type="button" 
                id="back-btn"
                class="text-gray-600 px-6 py-2 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
                ← Atrás
            </button>
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
    const form = document.getElementById('empresa-step2-form');
    if (!form) return;

    const condicionIvaSelect = document.getElementById('condicion_iva');
    const emailInput = document.getElementById('email');
    const telefonoInput = document.getElementById('telefono');
    const telefonoAlternativoInput = document.getElementById('telefono_alternativo');
    const sitioWebInput = document.getElementById('sitio_web');
    const submitBtn = document.getElementById('submit-btn');
    const backBtn = document.getElementById('back-btn');

    // Rellenar campos con datos previos si existen
    populateForm(form, formData);

    // Validar estado inicial del botón si hay datos previos
    if (formData.email) {
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

    // Validar campos cuando cambian
    [condicionIvaSelect, emailInput, telefonoInput, telefonoAlternativoInput, sitioWebInput].forEach(input => {
        input.addEventListener('input', () => validateFormFields());
        input.addEventListener('blur', () => validateFormFields());
    });

    /**
     * Valida todos los campos y habilita/deshabilita el botón Siguiente
     */
    function validateFormFields() {
        const condicionIva = condicionIvaSelect.value;
        const email = emailInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const telefonoAlternativo = telefonoAlternativoInput.value.trim();

        let canSubmit = true;

        // Validar campos requeridos
        if (!condicionIva || !email || !telefono) {
            canSubmit = false;
        }

        // Validar email
        if (window.Validators) {
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid && email) {
                canSubmit = false;
            }
        }

        // Validar teléfono
        if (window.Validators) {
            const telefonoResult = window.Validators.validateTelefono(telefono);
            if (!telefonoResult.valid && telefono) {
                canSubmit = false;
            }

            // Validar teléfono alternativo si tiene valor
            if (telefonoAlternativo) {
                const telefonoAltResult = window.Validators.validateTelefono(telefonoAlternativo);
                if (!telefonoAltResult.valid) {
                    canSubmit = false;
                }
            }
        }

        // Habilitar/deshabilitar botón
        submitBtn.disabled = !canSubmit;
    }

    // Botón atrás
    backBtn.addEventListener('click', () => {
        navigate(-1);
    });

    // Manejar envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obtener valores actuales
        const condicionIva = condicionIvaSelect.value;
        const email = emailInput.value.trim();
        const telefono = telefonoInput.value.trim();
        const telefonoAlternativo = telefonoAlternativoInput.value.trim();
        const sitioWeb = sitioWebInput.value.trim();

        // Validación final
        let isValid = true;

        if (!condicionIva || !email || !telefono) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (window.Validators) {
            // Validar email
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid) {
                window.Validators.showError(emailInput, emailResult.message);
                isValid = false;
            }

            // Validar teléfono
            const telefonoResult = window.Validators.validateTelefono(telefono);
            if (!telefonoResult.valid) {
                window.Validators.showError(telefonoInput, telefonoResult.message);
                isValid = false;
            }

            // Validar teléfono alternativo si tiene valor
            if (telefonoAlternativo) {
                const telefonoAltResult = window.Validators.validateTelefono(telefonoAlternativo);
                if (!telefonoAltResult.valid) {
                    window.Validators.showError(telefonoAlternativoInput, telefonoAltResult.message);
                    isValid = false;
                }
            }
        }

        if (!isValid) {
            return;
        }

        // Sanitizar valores antes de guardar
        let sanitizedData = {
            condicion_iva: condicionIva,
            email: email,
            telefono: telefono,
            telefono_alternativo: telefonoAlternativo || null,
            sitio_web: sitioWeb || null
        };

        if (window.Sanitizer) {
            sanitizedData = window.Sanitizer.sanitizeObject(sanitizedData);
        }

        // Actualizar formData
        Object.assign(formData, sanitizedData);

        // Navegar al siguiente paso
        navigate(1);
    });
}
