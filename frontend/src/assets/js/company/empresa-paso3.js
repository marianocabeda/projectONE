/**
 * Formulario de Registro de Empresa - Paso 3: Domicilio Fiscal
 * Dirección completa del domicilio fiscal de la empresa
 */

export const content = `
    <form id="empresa-step3-form" novalidate>
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Paso 3: Domicilio Fiscal</h2>
        <div class="space-y-4">
            <!-- Provincia -->
            <div>
                <label for="provincia" class="block text-sm font-medium text-gray-700">
                    Provincia *
                </label>
                <select 
                    id="provincia" 
                    name="provincia" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm"
                    required
                    aria-label="Provincia"
                >
                    <option value="">Cargando provincias...</option>
                </select>
            </div>

            <!-- Departamento/Municipio -->
            <div>
                <label for="municipio" class="block text-sm font-medium text-gray-700">
                    Departamento *
                </label>
                <select 
                    id="municipio" 
                    name="municipio" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm"
                    required
                    disabled
                    aria-label="Departamento"
                >
                    <option value="">Selecciona una provincia primero</option>
                </select>
            </div>

            <!-- Distrito -->
            <div>
                <label for="distrito" class="block text-sm font-medium text-gray-700">
                    Distrito *
                </label>
                <select 
                    id="distrito" 
                    name="distrito" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm"
                    required
                    disabled
                    aria-label="Distrito"
                >
                    <option value="">Selecciona un departamento primero</option>
                </select>
            </div>

            <!-- Calle -->
            <div>
                <label for="calle" class="block text-sm font-medium text-gray-700">
                    Calle *
                </label>
                <input 
                    type="text" 
                    id="calle" 
                    name="calle" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-sanitize="text"
                    maxlength="100"
                    placeholder="Nombre de la calle"
                    aria-label="Calle"
                >
            </div>

            <!-- Número y Sin número -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="numero" class="block text-sm font-medium text-gray-700">
                        Número
                    </label>
                    <input 
                        type="text" 
                        id="numero" 
                        name="numero" 
                        class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                        data-sanitize="text"
                        maxlength="10"
                        placeholder="1234"
                        aria-label="Número"
                    >
                </div>
                <div class="flex items-end">
                    <label class="flex items-center h-12 px-4 py-3">
                        <input 
                            type="checkbox" 
                            id="sin-numero" 
                            name="sin-numero"
                            class="h-4 w-4 text-principal-600 focus:ring-principal-500 border-gray-300 rounded"
                        >
                        <span class="ml-2 text-sm text-gray-700">Sin número</span>
                    </label>
                </div>
            </div>

            <!-- Piso y Depto -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="piso" class="block text-sm font-medium text-gray-700">
                        Piso
                    </label>
                    <input 
                        type="text" 
                        id="piso" 
                        name="piso" 
                        class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                        data-sanitize="text"
                        maxlength="5"
                        placeholder="PB, 1, 2..."
                        aria-label="Piso"
                    >
                </div>
                <div>
                    <label for="depto" class="block text-sm font-medium text-gray-700">
                        Departamento
                    </label>
                    <input 
                        type="text" 
                        id="depto" 
                        name="depto" 
                        class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                        data-sanitize="text"
                        maxlength="10"
                        placeholder="A, B, 1..."
                        aria-label="Departamento"
                    >
                </div>
            </div>

            <!-- Código Postal -->
            <div>
                <label for="codigo_postal" class="block text-sm font-medium text-gray-700">
                    Código Postal *
                </label>
                <input 
                    type="text" 
                    id="codigo_postal" 
                    name="codigo_postal" 
                    class="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-sanitize="text"
                    maxlength="10"
                    placeholder="5600"
                    aria-label="Código postal"
                >
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
                Registrar Empresa
            </button>
        </div>
    </form>
`;

export function init(navigate, formData, populateForm) {
    // Usar configuración centralizada
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        const API_BASE_URL = window.AppConfig?.API_BASE_URL;
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
    });

    const form = document.getElementById('empresa-step3-form');
    if (!form) return;

    const provinciaSelect = document.getElementById('provincia');
    const municipioSelect = document.getElementById('municipio');
    const distritoSelect = document.getElementById('distrito');
    const calleInput = document.getElementById('calle');
    const numeroInput = document.getElementById('numero');
    const sinNumeroCheckbox = document.getElementById('sin-numero');
    const pisoInput = document.getElementById('piso');
    const deptoInput = document.getElementById('depto');
    const codigoPostalInput = document.getElementById('codigo_postal');
    const submitBtn = document.getElementById('submit-btn');
    const backBtn = document.getElementById('back-btn');

    let provinciasData = [];
    let departamentosData = [];
    let distritosData = [];

    // Cargar provincias al inicio
    loadProvincias();

    // Rellenar campos con datos previos si existen
    setTimeout(() => {
        populateForm(form, formData);
        // Si hay provincia previa, cargar departamentos
        if (formData.provincia) {
            loadDepartamentos(formData.provincia);
        }
        // Si hay municipio previo, cargar distritos
        if (formData.municipio) {
            setTimeout(() => loadDistritos(formData.municipio), 500);
        }
        validateFormFields();
    }, 500);

    // Configurar sanitización automática si está disponible
    if (window.Sanitizer) {
        window.Sanitizer.setupAutoSanitize(form);
    }

    // Manejar cambio de provincia
    provinciaSelect.addEventListener('change', async () => {
        const provinciaId = provinciaSelect.value;
        // Los textos de opciones son seguros (hardcoded), pero usamos createElement por consistencia
        municipioSelect.innerHTML = '';
        const optLoad = document.createElement('option');
        optLoad.value = '';
        optLoad.textContent = 'Cargando departamentos...';
        municipioSelect.appendChild(optLoad);
        municipioSelect.disabled = true;
        
        distritoSelect.innerHTML = '';
        const optDist = document.createElement('option');
        optDist.value = '';
        optDist.textContent = 'Selecciona un departamento primero';
        distritoSelect.appendChild(optDist);
        distritoSelect.disabled = true;

        if (provinciaId) {
            await loadDepartamentos(provinciaId);
        } else {
            municipioSelect.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Selecciona una provincia primero';
            municipioSelect.appendChild(opt);
        }
        validateFormFields();
    });

    // Manejar cambio de municipio
    municipioSelect.addEventListener('change', async () => {
        const municipioId = municipioSelect.value;
        distritoSelect.innerHTML = '';
        const optLoad = document.createElement('option');
        optLoad.value = '';
        optLoad.textContent = 'Cargando distritos...';
        distritoSelect.appendChild(optLoad);
        distritoSelect.disabled = true;

        if (municipioId) {
            await loadDistritos(municipioId);
        } else {
            distritoSelect.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Selecciona un departamento primero';
            distritoSelect.appendChild(opt);
        }
        validateFormFields();
    });

    // Validar cuando cambian los demás campos
    [distritoSelect, calleInput, numeroInput, codigoPostalInput].forEach(input => {
        input.addEventListener('input', () => validateFormFields());
        input.addEventListener('change', () => validateFormFields());
    });

    // Manejar checkbox "Sin número"
    sinNumeroCheckbox.addEventListener('change', () => {
        if (sinNumeroCheckbox.checked) {
            numeroInput.value = 'S/N';
            numeroInput.disabled = true;
        } else {
            if (numeroInput.value === 'S/N') {
                numeroInput.value = '';
            }
            numeroInput.disabled = false;
        }
        validateFormFields();
    });

    // Botón atrás
    backBtn.addEventListener('click', () => {
        navigate(-1);
    });

    /**
     * Carga las provincias desde la API
     */
    async function loadProvincias() {
        try {
            const url = getUrl('provincias');

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar provincias');

            const data = await response.json();
            provinciasData = data.provincias || data;

            provinciaSelect.innerHTML = '';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Seleccionar provincia';
            provinciaSelect.appendChild(defaultOpt);
            
            provinciasData.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.id;
                option.textContent = prov.nombre;
                provinciaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando provincias:', error);
            provinciaSelect.innerHTML = '';
            const errorOpt = document.createElement('option');
            errorOpt.value = '';
            errorOpt.textContent = 'Error al cargar provincias';
            provinciaSelect.appendChild(errorOpt);
        }
    }

    /**
     * Carga los departamentos de una provincia
     */
    async function loadDepartamentos(provinciaId) {
        try {
            const url = getUrl('departamentos') + `?provincia_id=${provinciaId}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar departamentos');

            const data = await response.json();
            departamentosData = data.departamentos || data;

            municipioSelect.innerHTML = '';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Seleccionar departamento';
            municipioSelect.appendChild(defaultOpt);
            
            departamentosData.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.nombre;
                municipioSelect.appendChild(option);
            });

            municipioSelect.disabled = false;

            // Si hay valor previo, seleccionarlo
            if (formData.municipio) {
                municipioSelect.value = formData.municipio;
            }
        } catch (error) {
            console.error('Error cargando departamentos:', error);
            municipioSelect.innerHTML = '';
            const errorOpt = document.createElement('option');
            errorOpt.value = '';
            errorOpt.textContent = 'Error al cargar departamentos';
            municipioSelect.appendChild(errorOpt);
        }
    }

    /**
     * Carga los distritos de un municipio
     */
    async function loadDistritos(municipioId) {
        try {
            const url = getUrl('distritos') + `?departamento_id=${municipioId}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Error al cargar distritos');

            const data = await response.json();
            distritosData = data.distritos || data;

            distritoSelect.innerHTML = '';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Seleccionar distrito';
            distritoSelect.appendChild(defaultOpt);
            
            distritosData.forEach(dist => {
                const option = document.createElement('option');
                option.value = dist.id;
                option.textContent = dist.nombre;
                distritoSelect.appendChild(option);
            });

            distritoSelect.disabled = false;

            // Si hay valor previo, seleccionarlo
            if (formData.distrito) {
                distritoSelect.value = formData.distrito;
            }
        } catch (error) {
            console.error('Error cargando distritos:', error);
            distritoSelect.innerHTML = '';
            const errorOpt = document.createElement('option');
            errorOpt.value = '';
            errorOpt.textContent = 'Error al cargar distritos';
            distritoSelect.appendChild(errorOpt);
        }
    }

    /**
     * Valida todos los campos y habilita/deshabilita el botón
     */
    function validateFormFields() {
        const provincia = provinciaSelect.value;
        const municipio = municipioSelect.value;
        const distrito = distritoSelect.value;
        const calle = calleInput.value.trim();
        const numero = numeroInput.value.trim();
        const codigoPostal = codigoPostalInput.value.trim();

        let canSubmit = true;

        // Validar campos requeridos
        if (!provincia || !municipio || !distrito || !calle || !numero || !codigoPostal) {
            canSubmit = false;
        }

        // Habilitar/deshabilitar botón
        submitBtn.disabled = !canSubmit;
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener valores actuales
        const provinciaId = provinciaSelect.value;
        const municipioId = municipioSelect.value;
        const distritoId = distritoSelect.value;
        const calle = calleInput.value.trim();
        const numero = numeroInput.value.trim();
        const piso = pisoInput.value.trim();
        const depto = deptoInput.value.trim();
        const codigoPostal = codigoPostalInput.value.trim();

        // Validación final
        if (!provinciaId || !municipioId || !distritoId || !calle || !numero || !codigoPostal) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        // Obtener nombres en lugar de IDs
        const provinciaNombre = provinciaSelect.options[provinciaSelect.selectedIndex]?.text || '';
        const municipioNombre = municipioSelect.options[municipioSelect.selectedIndex]?.text || '';
        const distritoNombre = distritoSelect.options[distritoSelect.selectedIndex]?.text || '';

        // Sanitizar valores antes de guardar
        let sanitizedData = {
            direccion: {
                provincia: provinciaNombre,
                provincia_id: provinciaId,
                municipio: municipioNombre,
                municipio_id: municipioId,
                distrito: distritoNombre,
                distrito_id: distritoId,
                calle: calle,
                numero: numero,
                piso: piso || null,
                depto: depto || null,
                codigo_postal: codigoPostal
            }
        };

        if (window.Sanitizer) {
            sanitizedData = window.Sanitizer.sanitizeObject(sanitizedData);
        }

        // Actualizar formData
        Object.assign(formData, sanitizedData);

        // Enviar datos al backend
        await submitCompanyRegistration(formData);
    });

    /**
     * Envía los datos completos de la empresa al backend
     */
    async function submitCompanyRegistration(data) {
        try {
            // Deshabilitar botón
            submitBtn.disabled = true;
            // Crear contenido del botón de forma segura
            submitBtn.innerHTML = '';
            const icon = document.createElement('i');
            icon.className = 'fas fa-spinner fa-spin mr-2';
            submitBtn.appendChild(icon);
            submitBtn.appendChild(document.createTextNode('Registrando...'));

            // Preparar payload
            const payload = {
                nombre_comercial: data.nombre_comercial,
                razon_social: data.razon_social,
                cuit: data.cuit,
                tipo_sociedad: data.tipo_sociedad,
                condicion_iva: data.condicion_iva,
                email: data.email,
                telefono: data.telefono,
                telefono_alternativo: data.telefono_alternativo,
                sitio_web: data.sitio_web,
                direccion: data.direccion
            };

            // Usar CompanyManager para registrar
            if (window.CompanyManager) {
                const result = await window.CompanyManager.registerCompany(payload);
                console.log('Empresa registrada:', result);

                // Mostrar éxito
                showSuccess();
            } else {
                throw new Error('CompanyManager no está disponible');
            }

        } catch (error) {
            console.error('Error al registrar empresa:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrar Empresa';

            if (window.ErrorModal) {
                window.ErrorModal.show(
                    error.message || 'Error al registrar la empresa. Por favor, intenta nuevamente.',
                    'Error de Registro'
                );
            } else {
                alert('Error al registrar la empresa. Por favor, intenta nuevamente.');
            }
        }
    }

    /**
     * Muestra mensaje de éxito y redirige
     */
    function showSuccess() {
        // Crear mensaje de éxito de forma segura
        form.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'text-center py-12';
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'mb-6';
        const icon = document.createElement('i');
        icon.className = 'fas fa-check-circle text-6xl text-green-500';
        iconDiv.appendChild(icon);
        container.appendChild(iconDiv);
        
        const h2 = document.createElement('h2');
        h2.className = 'text-3xl font-bold text-gray-800 mb-4';
        h2.textContent = '¡Empresa Registrada Exitosamente!';
        container.appendChild(h2);
        
        const p = document.createElement('p');
        p.className = 'text-gray-600 mb-8';
        p.textContent = 'Tu empresa ha sido registrada correctamente. Serás redirigido al dashboard en unos segundos...';
        container.appendChild(p);
        
        const spinner = document.createElement('div');
        spinner.className = 'inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-principal-500';
        container.appendChild(spinner);
        
        form.appendChild(container);

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
            const dashboardUrl = window.AppConfig?.routes.dashboard || '/dashboard';
            window.location.href = dashboardUrl;
        }, 3000);
    }
}
