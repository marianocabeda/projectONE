
export const content = `
    <form id="step2-form">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Paso 2: Datos Personales</h2>
        <div class="grid grid-cols-1 gap-4">
            <div>
                <label for="nombre" class="block text-sm font-medium text-gray-700">Nombre*</label>
                <input 
                    type="text" 
                    id="nombre" 
                    name="nombre" 
                    class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-sanitize="name"
                    minlength="2"
                    maxlength="100"
                    placeholder="Ej: Juan"
                >
            </div>
            <div>
                <label for="apellido" class="block text-sm font-medium text-gray-700">Apellido*</label>
                <input 
                    type="text" 
                    id="apellido" 
                    name="apellido" 
                    class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    required
                    data-sanitize="name"
                    minlength="2"
                    maxlength="100"
                    placeholder="Ej: Pérez"
                >
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Fecha de Nacimiento*</label>
                <div class="flex space-x-2">
                    <input 
                        type="text" 
                        id="dia" 
                        name="dia" 
                        class="mt-1 block w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                        required 
                        placeholder="Día" 
                        maxlength="2"
                        inputmode="numeric"
                        pattern="[0-9]{1,2}"
                    >
                    <div class="relative w-1/3">
                        <input 
                            type="text" 
                            id="mes-input" 
                            name="mes-text" 
                            class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm text-left" 
                            required 
                            placeholder="Mes" 
                            autocomplete="off"
                        >
                        <div id="mes-dropdown" class="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1 shadow-lg hidden max-h-60 overflow-y-auto"></div>
                    </div>
                    <input 
                        type="text" 
                        id="anio" 
                        name="anio" 
                        class="mt-1 block w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                        required 
                        placeholder="Año" 
                        maxlength="4"
                        inputmode="numeric"
                        pattern="[0-9]{4}"
                    >
                </div>
                <p class="text-xs text-gray-500 mt-1">Formato: DD-MES-AAAA</p>
            </div>
            <div class="relative z-10">
                <label for="sexo" class="block text-sm font-medium text-gray-700">Sexo*</label>
                <!-- Desktop: native select. Hidden on small screens. -->
                <select id="sexo" name="sexo" class="mt-1 hidden sm:block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm" required>
                    <option value="">Seleccione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                </select>
                <!-- Mobile: button that opens a dropdown picker. Visible only on small screens. -->
                <div class="relative sm:hidden">
                    <button type="button" id="sexo-mobile-btn" class="mt-1 flex items-center justify-between w-full text-left px-3 py-2 pr-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500" aria-haspopup="listbox" aria-expanded="false">
                        <span class="sexo-mobile-label">Seleccione...</span>
                        <span class="sexo-mobile-chevron text-gray-400">⌄</span>
                    </button>
                </div>
                <!-- Overlay container for mobile picker (initially empty, injected/controlled via JS) -->
                <div id="sexo-mobile-overlay" class="hidden"></div>
            </div>
            <div>
                <label for="dni" class="block text-sm font-medium text-gray-700">DNI*</label>
                <input 
                    type="text" 
                    id="dni" 
                    name="dni" 
                    class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm" 
                    placeholder="12345678" 
                    maxlength="8" 
                    required
                    data-sanitize="dni"
                    inputmode="numeric"
                    pattern="[0-9]{7,8}"
                >
                <p class="text-xs text-gray-500 mt-1">7 u 8 dígitos</p>
            </div>
            <div>
                <label for="cuil" class="block text-sm font-medium text-gray-700">CUIL*</label>
                <div class="flex items-center gap-1 sm:gap-2">
                    <input 
                        type="text" 
                        id="cuil-prefijo" 
                        name="cuil-prefijo" 
                        class="mt-1 block w-12 sm:w-20 px-1 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 text-xs sm:text-sm text-center" 
                        placeholder="xx" 
                        maxlength="2"
                        inputmode="numeric"
                        pattern="[0-9]{2}"
                        readonly
                    >
                    <span class="mt-1 text-gray-500 text-xs sm:text-base">-</span>
                    <input 
                        type="text" 
                        id="cuil-dni" 
                        name="cuil-dni" 
                        class="mt-1 block flex-1 px-1 sm:px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm text-center cursor-not-allowed" 
                        placeholder="xxxxxxxx" 
                        maxlength="8"
                        readonly
                        disabled
                    >
                    <span class="mt-1 text-gray-500 text-xs sm:text-base">-</span>
                    <input 
                        type="text" 
                        id="cuil-verificador" 
                        name="cuil-verificador" 
                        class="mt-1 block w-10 sm:w-16 px-1 sm:px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 text-xs sm:text-sm text-center" 
                        placeholder="x" 
                        maxlength="1"
                        inputmode="numeric"
                        pattern="[0-9]{1}"
                        readonly
                    >
                </div>
                <p class="text-xs text-gray-500 mt-1">Calculado automáticamente. El DNI está bloqueado, pero puede editar el prefijo y el dígito verificador</p>
                
                <!-- Mensaje de advertencia -->
                <div id="cuil-advertencia" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md hidden">
                    <div class="flex items-start gap-2">
                        <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        <p class="text-sm text-amber-800">
                            <strong>Por favor, verifique que el CUIL sea correcto</strong> antes de continuar. El DNI no puede modificarse, pero puede ajustar el prefijo y el dígito verificador si es necesario.
                        </p>
                    </div>
                </div>
                
                <div class="mt-2 flex items-center">
                    <input 
                        type="checkbox" 
                        id="cuil-confirmado" 
                        name="cuil-confirmado"
                        class="h-4 w-4 text-principal-600 focus:ring-principal-500 border-gray-300 rounded"
                    >
                    <label for="cuil-confirmado" class="ml-2 block text-sm text-gray-700">
                        He verificado y confirmo que el CUIL es correcto
                    </label>
                </div>
                
                <!-- Menú desplegable "Opciones del CUIL" -->
                <div class="mt-3 relative">
                    <button 
                        type="button" 
                        id="opciones-cuil-btn"
                        class="flex items-center gap-1 text-sm text-principal-600 hover:text-principal-700"
                    >
                        <span>Opciones del CUIL</span>
                        <svg id="opciones-cuil-chevron" class="w-4 h-4 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                    
                    <div id="opciones-cuil-menu" class="hidden absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <div class="py-1">
                            <button 
                                type="button" 
                                id="editar-cuil-btn"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                <span>Editar CUIL</span>
                            </button>
                            <button 
                                type="button" 
                                id="restablecer-cuil-btn"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                disabled
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                <span>Restablecer CUIL</span>
                            </button>
                            <button 
                                type="button" 
                                id="no-tengo-cuil-btn"
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                                <span>No tengo CUIL</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-8 flex justify-between">
            <button type="button" id="prev-btn" class="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition">Anterior</button>
            <button type="submit" id="submit-btn" class="bg-principal-500 text-white px-6 py-2 rounded-lg hover:bg-principal-600 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled>Siguiente</button>
        </div>
    </form>
`;export function init(navigate, formData, populateForm) {
    const form = document.getElementById('step2-form');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const mesInput = document.getElementById('mes-input');
    const mesDropdown = document.getElementById('mes-dropdown');
    const dniInput = document.getElementById('dni');
    const cuilPrefijoInput = document.getElementById('cuil-prefijo');
    const cuilDniInput = document.getElementById('cuil-dni');
    const cuilVerificadorInput = document.getElementById('cuil-verificador');
    const cuilConfirmado = document.getElementById('cuil-confirmado');
    const editarCuilBtn = document.getElementById('editar-cuil-btn');
    const cuilAdvertencia = document.getElementById('cuil-advertencia');
    const opcionesCuilBtn = document.getElementById('opciones-cuil-btn');
    const opcionesCuilMenu = document.getElementById('opciones-cuil-menu');
    const opcionesCuilChevron = document.getElementById('opciones-cuil-chevron');
    const noTengoCuilBtn = document.getElementById('no-tengo-cuil-btn');
    const restablecerCuilBtn = document.getElementById('restablecer-cuil-btn');

    const meses = [
        { value: '01', name: 'Enero' }, { value: '02', name: 'Febrero' },
        { value: '03', name: 'Marzo' }, { value: '04', name: 'Abril' },
        { value: '05', name: 'Mayo' }, { value: '06', name: 'Junio' },
        { value: '07', name: 'Julio' }, { value: '08', name: 'Agosto' },
        { value: '09', name: 'Septiembre' }, { value: '10', name: 'Octubre' },
        { value: '11', name: 'Noviembre' }, { value: '12', name: 'Diciembre' }
    ];

    // Almacenará el valor numérico del mes (ej: '03')
    let selectedMesValue = '';

    // Para la navegación con teclado en el dropdown
    let highlightedIndex = -1;

    // Elementos relacionados con sexo (mobile picker)
    const sexoSelect = document.getElementById('sexo');
    const sexoMobileBtn = document.getElementById('sexo-mobile-btn');
    const sexoOverlayContainer = document.getElementById('sexo-mobile-overlay');

    populateForm(form, formData); // Rellena los campos simples desde formData
    // Query the label span after populateForm in case populateForm replaced innerHTML
    let sexoMobileLabel = sexoMobileBtn ? sexoMobileBtn.querySelector('.sexo-mobile-label') : null;

    // Sync sexo initial value between select and mobile button (if any)
    if (formData.sexo) {
        // Try to find matching option and set both select and button
        if (sexoSelect) {
            const opt = Array.from(sexoSelect.options).find(o => o.value === formData.sexo || o.textContent.toLowerCase() === String(formData.sexo).toLowerCase());
            if (opt) sexoSelect.value = opt.value;
        }
            if (sexoMobileBtn) {
                const label = sexoSelect.options[sexoSelect.selectedIndex].textContent;
                if (sexoMobileLabel) sexoMobileLabel.textContent = label;
                else {
                    sexoMobileBtn.innerHTML = `<span class="sexo-mobile-label">${label}</span><span class="sexo-mobile-chevron text-gray-400">⌄</span>`;
                    sexoMobileLabel = sexoMobileBtn.querySelector('.sexo-mobile-label');
                }
        }
    } else {
        // Ensure no pre-selected value when formData.sexo is empty
        if (sexoSelect) {
            sexoSelect.value = '';
        }
        if (sexoMobileBtn) {
            if (sexoMobileLabel) sexoMobileLabel.textContent = 'Seleccione...';
            else {
                sexoMobileBtn.innerHTML = `<span class="sexo-mobile-label">Seleccione...</span><span class="sexo-mobile-chevron text-gray-400">⌄</span>`;
                sexoMobileLabel = sexoMobileBtn.querySelector('.sexo-mobile-label');
            }
        }
    }

    // Configurar sanitización automática si está disponible
    if (window.Sanitizer) {
        window.Sanitizer.setupAutoSanitize(form);
    }

    // Variable para controlar si el CUIL fue editado manualmente
    let cuilEditadoManualmente = formData.cuil_editado_manualmente || false;
    
    // Variables para guardar valores previos al editar
    let cuilPrefijoAnterior = '';
    let cuilVerificadorAnterior = '';
    
    // Función para actualizar el estado del botón "Restablecer CUIL"
    const actualizarBotonRestablecer = () => {
        // Habilitar solo si el usuario editó o eliminó el CUIL
        const cuilFueModificado = cuilEditadoManualmente || formData.no_tengo_cuil;
        restablecerCuilBtn.disabled = !cuilFueModificado;
    };
    
    // Rellenar DNI desde formData si existe
    if (formData.dni) {
        dniInput.value = formData.dni;
        // Sincronizar el DNI con el campo CUIL-DNI (siempre bloqueado)
        cuilDniInput.value = formData.dni;
    }
    
    // Rellenar los componentes del CUIL desde formData si existen
    if (formData.cuil) {
        const cuilDigits = formData.cuil.replace(/\D/g, '');
        if (cuilDigits.length === 11) {
            cuilPrefijoInput.value = cuilDigits.substring(0, 2);
            cuilDniInput.value = cuilDigits.substring(2, 10);
            cuilVerificadorInput.value = cuilDigits.substring(10, 11);
        }
        
        // Si el CUIL fue editado manualmente, habilitar edición de prefijo y verificador
        if (cuilEditadoManualmente) {
            cuilPrefijoInput.readOnly = false;
            cuilPrefijoInput.classList.remove('bg-gray-50');
            cuilPrefijoInput.classList.add('bg-white');
            cuilVerificadorInput.readOnly = false;
            cuilVerificadorInput.classList.remove('bg-gray-50');
            cuilVerificadorInput.classList.add('bg-white');
        }
        
        // Si hay CUIL pero no está confirmado, mostrar advertencia
        if (!formData.cuil_confirmado && cuilAdvertencia) {
            cuilAdvertencia.classList.remove('hidden');
        }
    }
    
    if (formData.cuil_confirmado) {
        cuilConfirmado.checked = true;
        // Ocultar advertencia si ya está confirmado
        if (cuilAdvertencia) {
            cuilAdvertencia.classList.add('hidden');
        }
    }
    
    // Restaurar estado de "No tengo CUIL" si existe
    if (formData.no_tengo_cuil) {
        // Limpiar todos los campos del CUIL
        cuilPrefijoInput.value = '';
        cuilDniInput.value = '';
        cuilVerificadorInput.value = '';
        // Ocultar advertencia
        if (cuilAdvertencia) {
            cuilAdvertencia.classList.add('hidden');
        }
    }
    
    // Función para calcular CUIL automáticamente
    const calcularCUIL = () => {
        if (cuilEditadoManualmente) return; // No recalcular si fue editado manualmente
        if (formData.no_tengo_cuil) return; // No recalcular si marcó "No tengo CUIL"
        
        const dni = dniInput.value.trim();
        const sexo = sexoSelect ? sexoSelect.value : '';
        
        if (dni && sexo && window.DocumentCalculator) {
            const resultado = window.DocumentCalculator.calculateCUIL(dni, sexo);
            if (resultado) {
                // Extraer los componentes del CUIL calculado
                const cuilDigits = resultado.cuil.replace(/\D/g, '');
                if (cuilDigits.length === 11) {
                    cuilPrefijoInput.value = cuilDigits.substring(0, 2);
                    cuilDniInput.value = cuilDigits.substring(2, 10);
                    cuilVerificadorInput.value = cuilDigits.substring(10, 11);
                    
                    // Quitar bordes de error
                    cuilPrefijoInput.classList.remove('border-red-500');
                    cuilVerificadorInput.classList.remove('border-red-500');
                }
                
                // Desmarcar el checkbox al recalcular
                cuilConfirmado.checked = false;
                // Mostrar advertencia cuando se calcula un nuevo CUIL
                if (cuilAdvertencia) {
                    cuilAdvertencia.classList.remove('hidden');
                }
                updateSubmitButton();
            }
        } else {
            if (!cuilEditadoManualmente && !formData.no_tengo_cuil) {
                cuilPrefijoInput.value = '';
                cuilDniInput.value = '';
                cuilVerificadorInput.value = '';
                cuilConfirmado.checked = false;
                // Ocultar advertencia si no hay CUIL
                if (cuilAdvertencia) {
                    cuilAdvertencia.classList.add('hidden');
                }
            }
            updateSubmitButton();
        }
    };
    
    // Función para actualizar el estado del botón de envío
    const updateSubmitButton = () => {
        // Si marcó "No tengo CUIL", habilitar el botón directamente
        if (formData.no_tengo_cuil) {
            submitBtn.disabled = false;
            return;
        }
        
        // Si no, validar que el CUIL esté completo y confirmado
        const prefijoValido = cuilPrefijoInput.value.trim().length === 2;
        const dniValido = cuilDniInput.value.trim().length === 8;
        const verificadorValido = cuilVerificadorInput.value.trim().length === 1;
        const cuilValido = prefijoValido && dniValido && verificadorValido;
        const confirmado = cuilConfirmado.checked;
        submitBtn.disabled = !(cuilValido && confirmado);
    };
    
    // Evento para el checkbox de confirmación
    cuilConfirmado.addEventListener('change', () => {
        updateSubmitButton();
        // Ocultar advertencia cuando se marca el checkbox
        if (cuilConfirmado.checked && cuilAdvertencia) {
            cuilAdvertencia.classList.add('hidden');
        }
        
        // Si confirma el CUIL editado, guardar los nuevos valores y bloquear campos
        if (cuilConfirmado.checked && !cuilPrefijoInput.readOnly) {
            cuilPrefijoAnterior = cuilPrefijoInput.value;
            cuilVerificadorAnterior = cuilVerificadorInput.value;
            
            cuilPrefijoInput.readOnly = true;
            cuilPrefijoInput.classList.remove('bg-white');
            cuilPrefijoInput.classList.add('bg-gray-50');
            cuilVerificadorInput.readOnly = true;
            cuilVerificadorInput.classList.remove('bg-white');
            cuilVerificadorInput.classList.add('bg-gray-50');
        }
    });
    
    // Toggle del menú desplegable "Opciones del CUIL"
    let opcionesMenuAbierto = false;
    const toggleOpcionesMenu = () => {
        opcionesMenuAbierto = !opcionesMenuAbierto;
        if (opcionesMenuAbierto) {
            opcionesCuilMenu.classList.remove('hidden');
            opcionesCuilChevron.classList.add('rotate-180');
        } else {
            opcionesCuilMenu.classList.add('hidden');
            opcionesCuilChevron.classList.remove('rotate-180');
        }
    };
    
    opcionesCuilBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOpcionesMenu();
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (opcionesMenuAbierto && !opcionesCuilBtn.contains(e.target) && !opcionesCuilMenu.contains(e.target)) {
            toggleOpcionesMenu();
        }
    });
    
    // Evento para el botón "No tengo CUIL"
    noTengoCuilBtn.addEventListener('click', () => {
        // Cerrar el menú
        toggleOpcionesMenu();
        
        // Limpiar todos los campos del CUIL (incluyendo DNI visual)
        cuilPrefijoInput.value = '';
        cuilDniInput.value = '';
        cuilVerificadorInput.value = '';
        
        // Desmarcar y deshabilitar el checkbox de confirmación
        cuilConfirmado.checked = false;
        cuilConfirmado.disabled = true;
        
        // Ocultar advertencia
        if (cuilAdvertencia) {
            cuilAdvertencia.classList.add('hidden');
        }
        
        // Asegurar que los campos estén en modo solo lectura
        cuilPrefijoInput.readOnly = true;
        cuilPrefijoInput.classList.remove('bg-white');
        cuilPrefijoInput.classList.add('bg-gray-50');
        cuilVerificadorInput.readOnly = true;
        cuilVerificadorInput.classList.remove('bg-white');
        cuilVerificadorInput.classList.add('bg-gray-50');
        
        // Resetear estado de edición manual
        cuilEditadoManualmente = false;
        
        // Marcar en formData que no tiene CUIL
        formData.no_tengo_cuil = true;
        
        // Actualizar estado del botón restablecer
        actualizarBotonRestablecer();
        
        // Habilitar el botón de siguiente
        updateSubmitButton();
    });
    
    // Evento para restablecer CUIL (recalcular)
    restablecerCuilBtn.addEventListener('click', () => {
        // Cerrar el menú
        toggleOpcionesMenu();
        
        // Resetear estados
        cuilEditadoManualmente = false;
        formData.cuil_editado_manualmente = false;
        formData.no_tengo_cuil = false;
        
        // Rehabilitar checkbox si estaba deshabilitado
        cuilConfirmado.disabled = false;
        cuilConfirmado.checked = false;
        
        // Volver campos a modo solo lectura
        cuilPrefijoInput.readOnly = true;
        cuilPrefijoInput.classList.remove('bg-white');
        cuilPrefijoInput.classList.add('bg-gray-50');
        cuilVerificadorInput.readOnly = true;
        cuilVerificadorInput.classList.remove('bg-white');
        cuilVerificadorInput.classList.add('bg-gray-50');
        
        // Sincronizar DNI y recalcular CUIL
        sincronizarDniEnCuil();
        calcularCUIL();
        
        // Actualizar estado del botón restablecer (debería deshabilitarse)
        actualizarBotonRestablecer();
        
        // Mostrar advertencia para que confirme el CUIL recalculado
        if (cuilAdvertencia) {
            cuilAdvertencia.classList.remove('hidden');
        }
        
        updateSubmitButton();
    });
    
    // Evento para editar CUIL manualmente
    editarCuilBtn.addEventListener('click', () => {
        // Cerrar el menú
        toggleOpcionesMenu();
        
        // Guardar valores previos para poder restaurarlos
        cuilPrefijoAnterior = cuilPrefijoInput.value;
        cuilVerificadorAnterior = cuilVerificadorInput.value;
        
        // Habilitar edición solo del prefijo y verificador
        cuilPrefijoInput.readOnly = false;
        cuilPrefijoInput.classList.remove('bg-gray-50');
        cuilPrefijoInput.classList.add('bg-white');
        
        cuilVerificadorInput.readOnly = false;
        cuilVerificadorInput.classList.remove('bg-gray-50');
        cuilVerificadorInput.classList.add('bg-white');
        
        // Desmarcar "No tengo CUIL" si estaba marcado y rehabilitar checkbox
        if (formData.no_tengo_cuil) {
            formData.no_tengo_cuil = false;
            cuilConfirmado.disabled = false;
        }
        
        cuilPrefijoInput.focus();
        
        // Desmarcar checkbox de confirmación al editar
        cuilConfirmado.checked = false;
        updateSubmitButton();
    });
    
    // Restaurar valores previos al perder el foco (blur) si no se confirmó el cambio
    const restaurarCuilAlPerderFoco = () => {
        // Usar setTimeout para dar tiempo a que se procesen otros eventos (como hacer clic en el checkbox)
        setTimeout(() => {
            // Solo restaurar si:
            // 1. Los campos están en modo edición (no readOnly)
            // 2. El checkbox de confirmación no está marcado
            // 3. No tiene el foco ninguno de los campos editables
            const prefijoTieneFoco = document.activeElement === cuilPrefijoInput;
            const verificadorTieneFoco = document.activeElement === cuilVerificadorInput;
            const confirmacionTieneFoco = document.activeElement === cuilConfirmado;
            
            if (!cuilPrefijoInput.readOnly && !prefijoTieneFoco && !verificadorTieneFoco && !confirmacionTieneFoco && !cuilConfirmado.checked) {
                // Restaurar valores anteriores
                cuilPrefijoInput.value = cuilPrefijoAnterior;
                cuilVerificadorInput.value = cuilVerificadorAnterior;
                
                // Volver a modo solo lectura
                cuilPrefijoInput.readOnly = true;
                cuilPrefijoInput.classList.remove('bg-white');
                cuilPrefijoInput.classList.add('bg-gray-50');
                cuilVerificadorInput.readOnly = true;
                cuilVerificadorInput.classList.remove('bg-white');
                cuilVerificadorInput.classList.add('bg-gray-50');
                
                // Quitar bordes de error
                cuilPrefijoInput.classList.remove('border-red-500');
                cuilVerificadorInput.classList.remove('border-red-500');
            }
        }, 200);
    };
    
    cuilPrefijoInput.addEventListener('blur', restaurarCuilAlPerderFoco);
    cuilVerificadorInput.addEventListener('blur', restaurarCuilAlPerderFoco);
    
    // Eventos cuando el usuario modifica el prefijo o verificador manualmente
    const handleCuilManualEdit = () => {
        if (!cuilPrefijoInput.readOnly || !cuilVerificadorInput.readOnly) {
            cuilEditadoManualmente = true;
            formData.cuil_editado_manualmente = true; // Persistir el estado
            cuilConfirmado.checked = false;
            actualizarBotonRestablecer(); // Habilitar botón restablecer
            updateSubmitButton();
        }
    };
    
    cuilPrefijoInput.addEventListener('input', () => {
        // Permitir solo números
        cuilPrefijoInput.value = cuilPrefijoInput.value.replace(/\D/g, '').substring(0, 2);
        handleCuilManualEdit();
    });
    
    cuilVerificadorInput.addEventListener('input', () => {
        // Permitir solo números
        cuilVerificadorInput.value = cuilVerificadorInput.value.replace(/\D/g, '').substring(0, 1);
        handleCuilManualEdit();
    });


    // Lógica específica para rellenar Fecha de Nacimiento
    if (formData.fecha_nacimiento) {
        const dateParts = formData.fecha_nacimiento.split('-'); // Formato DD-MM-AAAA
        if (dateParts.length === 3) {
            const [day, month, year] = dateParts;
            document.getElementById('dia').value = day;
            document.getElementById('anio').value = year;
            const mesObj = meses.find(m => m.value === month);
            if (mesObj) {
                mesInput.value = mesObj.name;
                selectedMesValue = mesObj.value;
            }
        }
    }

    const updateMesDropdown = (filter = '') => {
        mesDropdown.innerHTML = '';
        const filteredMeses = meses.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));

        if (filteredMeses.length === 0) {
            mesDropdown.classList.add('hidden');
            return;
        }

        highlightedIndex = -1; // Resetea el índice al actualizar

        filteredMeses.forEach((mes, index) => {
            const option = document.createElement('div');
            option.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer month-option';
            option.textContent = mes.name;
            option.dataset.value = mes.value;
            option.id = `mes-option-${index}`;
            option.addEventListener('click', () => {
                mesInput.value = mes.name;
                selectedMesValue = mes.value;
                mesDropdown.classList.add('hidden');
                // Quitar borde de error si lo tuviera
                mesInput.classList.remove('border-red-500');
            });
            mesDropdown.appendChild(option);
        });
        mesDropdown.classList.remove('hidden');
    };

    // --- Mobile sexo picker setup ---
    // Create a dropdown panel positioned under the button
    const createSexoMobileOverlay = () => {
        // Clear container
        sexoOverlayContainer.innerHTML = '';

        // Panel (absolute, positioned directly under the button, full width)
        const panel = document.createElement('div');
        // start hidden and slightly translated to animate in
        panel.className = 'absolute left-0 right-0 w-full mt-1 bg-white rounded-md shadow-lg z-[60] border border-gray-200 opacity-0 translate-y-1 transition-all duration-150';
        panel.setAttribute('role', 'listbox');

    // Options list
    const list = document.createElement('div');
    list.className = 'py-1 w-full';

        // Build options from the select options
        Array.from(sexoSelect.options).forEach(opt => {
            if (!opt.value) return; // skip placeholder
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-gray-200 transition-colors block';
            item.textContent = opt.textContent;
            item.dataset.value = opt.value;
            item.addEventListener('click', (ev) => {
                ev.stopPropagation();
                // set both the hidden select and update the button label
                sexoSelect.value = opt.value;
                if (sexoMobileLabel) sexoMobileLabel.textContent = opt.textContent;
                else {
                    sexoMobileBtn.innerHTML = `<span class="sexo-mobile-label">${opt.textContent}</span><span class="sexo-mobile-chevron text-gray-400">⌄</span>`;
                    sexoMobileLabel = sexoMobileBtn.querySelector('.sexo-mobile-label');
                }
                sexoMobileBtn.classList.remove('border-red-500');
                closeSexoOverlay();
            });
            list.appendChild(item);
        });

        panel.appendChild(list);
        sexoOverlayContainer.appendChild(panel);

        // animate panel into view
        requestAnimationFrame(() => {
            panel.classList.remove('opacity-0', 'translate-y-1');
            panel.classList.add('opacity-100', 'translate-y-0');
        });
    };

    // helpers to open/close overlay and manage outside clicks
    let _sexoOutsideHandler = null;
    const sexoWrapper = sexoMobileBtn ? sexoMobileBtn.parentElement : null;
    const openSexoOverlay = () => {
        if (!sexoOverlayContainer.classList.contains('hidden')) return;
        createSexoMobileOverlay();
        sexoOverlayContainer.classList.remove('hidden');
        sexoMobileBtn.setAttribute('aria-expanded', 'true');

        // Add outside click listener
        _sexoOutsideHandler = (e) => {
            if (!sexoWrapper) return;
            if (!sexoWrapper.contains(e.target)) {
                closeSexoOverlay();
            }
        };
        document.addEventListener('click', _sexoOutsideHandler);
    };

    const closeSexoOverlay = () => {
        sexoOverlayContainer.classList.add('hidden');
        sexoMobileBtn && sexoMobileBtn.setAttribute('aria-expanded', 'false');
        // rotate back chevron
        const che = sexoMobileBtn ? sexoMobileBtn.querySelector('.sexo-mobile-chevron') : null;
        if (che) che.classList.remove('rotate-180');
        if (_sexoOutsideHandler) {
            document.removeEventListener('click', _sexoOutsideHandler);
            _sexoOutsideHandler = null;
        }
    };

    // If the mobile button exists, wire it
    if (sexoMobileBtn) {
        // Ensure overlay container sits at the right stacking context and takes full width
        sexoOverlayContainer.classList.add('absolute', 'left-0', 'right-0', 'w-full', 'mt-1');

        sexoMobileBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (sexoOverlayContainer.classList.contains('hidden')) {
                openSexoOverlay();
                // rotate chevron
                const che = sexoMobileBtn.querySelector('.sexo-mobile-chevron');
                if (che) {
                    che.classList.add('transition-transform', 'duration-150', 'rotate-180');
                }
            } else {
                closeSexoOverlay();
            }
        });
    }

    mesInput.addEventListener('focus', () => {
        updateMesDropdown(mesInput.value);
    });

    mesInput.addEventListener('input', () => {
        const inputValue = mesInput.value;
        const lowerInputValue = inputValue.toLowerCase();
        selectedMesValue = ''; // Limpia la selección mientras se escribe

        updateMesDropdown(inputValue);

        // Autocompletado solo en desktop para evitar problemas con teclados móviles
        if (window.innerWidth >= 768) {
            const match = meses.find(m => m.name.toLowerCase().startsWith(lowerInputValue));
            if (match && inputValue.length > 0) {
                const originalValue = mesInput.value;
                const matchName = match.name;
                // Evita el bucle infinito de eventos 'input'
                if (originalValue.toLowerCase() !== matchName.toLowerCase() && mesInput.value.toLowerCase() !== matchName.toLowerCase()) {
                    mesInput.value = matchName;
                    try { mesInput.setSelectionRange(originalValue.length, matchName.length); } catch (e) { /* setSelectionRange puede fallar en algunos navegadores móviles */ }
                }
            }
        }
    });

    mesInput.addEventListener('keydown', (e) => {
        const options = mesDropdown.querySelectorAll('.month-option');
        if (mesDropdown.classList.contains('hidden') || options.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex + 1) % options.length;
            updateHighlight(options);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
            updateHighlight(options);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex > -1) {
                options[highlightedIndex].click();
            }
        } else if (e.key === 'Escape') {
            mesDropdown.classList.add('hidden');
        }
    });

    const updateHighlight = (options) => {
        options.forEach((option, index) => {
          if (index === highlightedIndex) {
            option.classList.add('bg-gray-200');
            option.scrollIntoView({ block: 'nearest' });
          } else {
            option.classList.remove('bg-gray-200');
          }
        });
    };

    // Cerrar dropdown si se hace clic fuera
    document.addEventListener('click', (e) => {
        if (!mesInput.contains(e.target) && !mesDropdown.contains(e.target)) {
            mesDropdown.classList.add('hidden');
            // Validar si el texto es un mes válido al perder el foco
            const inputVal = mesInput.value.trim();
            
            // Buscar por nombre de mes
            let mesObj = meses.find(m => m.name.toLowerCase() === inputVal.toLowerCase());
            
            // Si no se encuentra, intentar buscar por número (1-12 o 01-12)
            if (!mesObj && /^\d{1,2}$/.test(inputVal)) {
                const numMes = parseInt(inputVal, 10);
                if (numMes >= 1 && numMes <= 12) {
                    const mesValue = String(numMes).padStart(2, '0');
                    mesObj = meses.find(m => m.value === mesValue);
                    if (mesObj) {
                        // Actualizar el input con el nombre del mes
                        mesInput.value = mesObj.name;
                    }
                }
            }
            
            if (mesObj) {
                selectedMesValue = mesObj.value;
                mesInput.classList.remove('border-red-500');
            } else if (inputVal !== '') {
                // Si no es válido, no limpiamos, pero el submit fallará
                selectedMesValue = '';
            }
        }
    });

    // Sincronizar el DNI con el campo CUIL-DNI (siempre bloqueado)
    const sincronizarDniEnCuil = () => {
        // No sincronizar si "No tengo CUIL" está activado
        if (formData.no_tengo_cuil) return;
        
        const dniVal = dniInput.value.trim().replace(/\D/g, '');
        cuilDniInput.value = dniVal;
    };
    
    // Escuchar cambios en DNI para recalcular CUIL y sincronizar
    dniInput.addEventListener('input', () => {
        // Si cambia el DNI y tiene "No tengo CUIL", desactivar esa opción y recalcular
        if (formData.no_tengo_cuil) {
            formData.no_tengo_cuil = false;
            // Rehabilitar el checkbox de confirmación
            cuilConfirmado.disabled = false;
        }
        
        // Si había edición manual, resetear al cambiar el DNI
        if (cuilEditadoManualmente) {
            cuilEditadoManualmente = false;
            formData.cuil_editado_manualmente = false;
        }
        
        sincronizarDniEnCuil();
        calcularCUIL();
        actualizarBotonRestablecer(); // Actualizar estado del botón
    });
    
    // Escuchar cambios en Sexo para recalcular CUIL
    if (sexoSelect) {
        sexoSelect.addEventListener('change', () => {
            calcularCUIL();
            // Si se cambia el sexo, resetear el estado de edición manual
            if (!cuilEditadoManualmente && formData.cuil_editado_manualmente) {
                delete formData.cuil_editado_manualmente;
            }
        });
    }
    
    // Escuchar cambios en el selector móvil de sexo
    if (sexoMobileBtn) {
        const observerCallback = () => {
            calcularCUIL();
            // Si se cambia el sexo, resetear el estado de edición manual
            if (!cuilEditadoManualmente && formData.cuil_editado_manualmente) {
                delete formData.cuil_editado_manualmente;
            }
        };
        
        // Observar cambios en el select oculto que actualiza el mobile picker
        const observer = new MutationObserver(observerCallback);
        if (sexoSelect) {
            observer.observe(sexoSelect, { attributes: true, attributeFilter: ['value'] });
        }
    }
    
    // Calcular CUIL inicial si hay datos pero no hay CUIL previo
    // Usar setTimeout para asegurar que el DOM esté completamente actualizado
    setTimeout(() => {
        // Verificar tanto en formData como en los inputs del DOM
        const dniValue = formData.dni || dniInput.value.trim();
        const sexoValue = formData.sexo || (sexoSelect ? sexoSelect.value : '');
        
        console.log('🔍 Verificando datos para CUIL automático:', { dniValue, sexoValue, hasCuil: !!formData.cuil, editado: cuilEditadoManualmente, noTengo: formData.no_tengo_cuil });
        
        if (dniValue && sexoValue && !formData.cuil && !cuilEditadoManualmente && !formData.no_tengo_cuil) {
            // Asegurarse de que los valores estén sincronizados
            if (!formData.dni) formData.dni = dniValue;
            if (!formData.sexo) formData.sexo = sexoValue;
            
            // Sincronizar DNI en el campo visual del CUIL
            sincronizarDniEnCuil();
            
            console.log('✅ Calculando CUIL automáticamente...');
            calcularCUIL();
        }
        
        // Actualizar estado inicial de los botones
        updateSubmitButton();
        actualizarBotonRestablecer();
    }, 150);
    

    // Validación en tiempo real de la fecha de nacimiento
    const validateDateInRealTime = () => {
        const diaInput = document.getElementById('dia');
        const anioInput = document.getElementById('anio');
        
        const diaVal = diaInput.value.trim().replace(/\D/g, '');
        const anioVal = anioInput.value.trim().replace(/\D/g, '');
        
        // Si no están completos todos los campos, retornar false
        if (!diaVal || !selectedMesValue || !anioVal || anioVal.length !== 4) {
            return false;
        }
        
        const dayNum = parseInt(diaVal, 10);
        const yearNum = parseInt(anioVal, 10);
        const monthNum = parseInt(selectedMesValue, 10);
        
        // Obtener año actual de forma segura
        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Validar rangos básicos - día limitado a 31
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || 
            yearNum < 1900 || yearNum > currentYear) {
            return false;
        }
        
        // Crear string de fecha (sin usar Date para evitar problemas de zona horaria)
        const pad2 = (v) => String(v).padStart(2, '0');
        const fechaFormateada = `${pad2(dayNum)}-${pad2(monthNum)}-${yearNum}`;
        
        // Validar que la fecha sea válida usando el validador
        if (window.Validators && window.Validators.validateDateStructure) {
            const resultStructure = window.Validators.validateDateStructure(fechaFormateada);
            if (!resultStructure.valid) {
                return false;
            }
        }
        
        // Validar que no sea futura
        if (window.Validators && window.Validators.validateDateNotFuture) {
            const resultFuture = window.Validators.validateDateNotFuture(fechaFormateada);
            if (!resultFuture.valid) {
                return false;
            }
        }
        
        // Validar edad mínima
        if (window.Validators && window.Validators.validateMinimumAge) {
            const resultAge = window.Validators.validateMinimumAge(fechaFormateada, 18);
            if (!resultAge.valid) {
                return false;
            }
        }
        
        return true;
    };

    // Agregar validación en tiempo real a los campos de fecha
    const diaInput = document.getElementById('dia');
    const anioInput = document.getElementById('anio');
    
    diaInput.addEventListener('input', validateDateInRealTime);
    anioInput.addEventListener('input', validateDateInRealTime);
    mesInput.addEventListener('input', validateDateInRealTime);
    
    // Validar al cargar por si hay datos previos
    setTimeout(validateDateInRealTime, 100);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validación del campo mes
        const mesTexto = mesInput.value.trim();
        let mesValido = meses.find(m => m.name.toLowerCase() === mesTexto.toLowerCase());

        // Si no se encuentra por nombre, intentar buscar por número (1-12 o 01-12)
        if (!mesValido && /^\d{1,2}$/.test(mesTexto)) {
            const numMes = parseInt(mesTexto, 10);
            if (numMes >= 1 && numMes <= 12) {
                const mesValue = String(numMes).padStart(2, '0');
                mesValido = meses.find(m => m.value === mesValue);
                if (mesValido) {
                    // Actualizar el input con el nombre del mes para consistencia
                    mesInput.value = mesValido.name;
                }
            }
        }

        if (!mesValido) {
            mesInput.classList.add('border-red-500');
            mesInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ mes: 'Por favor, ingrese un mes válido (nombre o número del 1 al 12).' }, 'Error de Validación');
            }
            return;
        }
    // Si es válido, nos aseguramos de que el valor numérico esté guardado
    selectedMesValue = mesValido.value;
    mesInput.classList.remove('border-red-500');

        // Sanitizar y validar nombre y apellido (solo letras y espacios)
        const nombreInput = document.getElementById('nombre');
        const apellidoInput = document.getElementById('apellido');
        
        let nombreVal = nombreInput.value ? nombreInput.value.trim() : '';
        let apellidoVal = apellidoInput.value ? apellidoInput.value.trim() : '';

        // Sanitizar nombres (solo letras, espacios y acentos)
        if (window.Sanitizer) {
            nombreVal = window.Sanitizer.sanitizeName(nombreVal);
            apellidoVal = window.Sanitizer.sanitizeName(apellidoVal);
        }

        // Validar que no estén vacíos después de sanitizar
        if (!nombreVal || nombreVal.length < 2) {
            const msg = 'El nombre debe tener al menos 2 caracteres y solo puede contener letras.';
            nombreInput.classList.add('border-red-500');
            nombreInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ nombre: msg }, 'Error de Validación');
            }
            return;
        }

        if (!apellidoVal || apellidoVal.length < 2) {
            const msg = 'El apellido debe tener al menos 2 caracteres y solo puede contener letras.';
            apellidoInput.classList.add('border-red-500');
            apellidoInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ apellido: msg }, 'Error de Validación');
            }
            return;
        }

        // Actualiza formData con los datos sanitizados del paso actual
        formData.nombre = nombreVal;
        formData.apellido = apellidoVal;
        // Sexo: prefer select value; on mobile the select is hidden but is updated by the mobile picker.
        const sexoVal = (sexoSelect && sexoSelect.value) ? sexoSelect.value : '';
        if (!sexoVal) {
            const msg = 'Por favor, seleccione el sexo.';
            if (sexoMobileBtn) {
                sexoMobileBtn.classList.add('border-red-500');
                sexoMobileBtn.focus();
            } else if (sexoSelect) {
                sexoSelect.classList.add('border-red-500');
                sexoSelect.focus();
            }
            if (window.ErrorModal) {
                window.ErrorModal.show({ sexo: msg }, 'Error de Validación');
            }
            return;
        }
        formData.sexo = sexoVal;

        // Validar DNI (obligatorio)
        const dniVal = dniInput.value && dniInput.value.trim();
        if (!dniVal) {
            dniInput.classList.add('border-red-500');
            dniInput.focus();
            const msg = 'El DNI es obligatorio.';
            if (window.ErrorModal) {
                window.ErrorModal.show({ dni: msg }, 'Error de Validación');
            }
            return;
        }

        // Normalizar DNI a sólo dígitos y validar longitud
        let dniDigits = dniVal.replace(/\D/g, '');
        if (dniDigits.length === 7) {
            dniDigits = dniDigits.padStart(8, '0');
        } else if (dniDigits.length !== 8) {
            const msg = 'El DNI debe tener 7 u 8 dígitos.';
            dniInput.classList.add('border-red-500');
            dniInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ dni: msg }, 'Error de Validación');
            }
            return;
        }
        formData.dni = dniDigits;

        // Validar componentes del CUIL (si aplica)
        // Si marcó "No tengo CUIL", omitir validación del CUIL
        if (formData.no_tengo_cuil) {
            formData.cuil = null;
            formData.cuil_confirmado = false;
            if (formData.cuil_editado_manualmente) {
                delete formData.cuil_editado_manualmente;
            }
        } else {
            // Validar componentes del CUIL (obligatorios)
            const prefijoVal = cuilPrefijoInput.value.trim().replace(/\D/g, '');
            const dniCuilVal = cuilDniInput.value.trim().replace(/\D/g, '');
            const verificadorVal = cuilVerificadorInput.value.trim().replace(/\D/g, '');
            
            if (!prefijoVal || prefijoVal.length !== 2) {
                const msg = 'El prefijo del CUIL debe tener 2 dígitos.';
                cuilPrefijoInput.classList.add('border-red-500');
                cuilPrefijoInput.focus();
                if (window.ErrorModal) {
                    window.ErrorModal.show({ cuil: msg }, 'Error de Validación');
                }
                return;
            }
            
            if (!dniCuilVal || dniCuilVal.length !== 8) {
                const msg = 'El DNI del CUIL debe tener 8 dígitos.';
                cuilDniInput.classList.add('border-red-500');
                if (window.ErrorModal) {
                    window.ErrorModal.show({ cuil: msg }, 'Error de Validación');
                }
                return;
            }
            
            if (!verificadorVal || verificadorVal.length !== 1) {
                const msg = 'El dígito verificador del CUIL es obligatorio.';
                cuilVerificadorInput.classList.add('border-red-500');
                cuilVerificadorInput.focus();
                if (window.ErrorModal) {
                    window.ErrorModal.show({ cuil: msg }, 'Error de Validación');
                }
                return;
            }
            
            // Validar que el DNI del CUIL coincida con el DNI ingresado
            if (dniCuilVal !== dniDigits) {
                const msg = 'El DNI del CUIL debe coincidir con el DNI ingresado.';
                cuilDniInput.classList.add('border-red-500');
                if (window.ErrorModal) {
                    window.ErrorModal.show({ cuil: msg }, 'Error de Validación');
                }
                return;
            }
            
            // Construir CUIL completo
            const cuilCompleto = `${prefijoVal}${dniCuilVal}${verificadorVal}`;
            const cuilFormateado = `${prefijoVal}-${dniCuilVal}-${verificadorVal}`;

            // Validar CUIL con el algoritmo de AFIP
            if (window.DocumentCalculator && !window.DocumentCalculator.validateCUIL(cuilFormateado)) {
                const msg = 'El CUIL ingresado no es válido según el algoritmo de AFIP. Verifique el prefijo y el dígito verificador.';
                cuilPrefijoInput.classList.add('border-red-500');
                cuilVerificadorInput.classList.add('border-red-500');
                cuilPrefijoInput.focus();
                if (window.ErrorModal) {
                    window.ErrorModal.show({ cuil: msg }, 'Error de Validación');
                }
                return;
            }

            // Verificar que el checkbox esté marcado
            if (!cuilConfirmado.checked) {
                const msg = 'Debe verificar y confirmar que el CUIL es correcto antes de continuar.';
                cuilConfirmado.parentElement.classList.add('text-red-600');
                // Mostrar la advertencia si estaba oculta
                if (cuilAdvertencia) {
                    cuilAdvertencia.classList.remove('hidden');
                }
                if (window.ErrorModal) {
                    window.ErrorModal.show({ cuil: msg }, 'Error de Validación');
                }
                return;
            }

            formData.cuil = cuilCompleto;
            formData.cuil_confirmado = true;
            formData.no_tengo_cuil = false;
            // Mantener el estado de edición manual si existe
            if (cuilEditadoManualmente) {
                formData.cuil_editado_manualmente = true;
            }
        }

        // Validar y formatear fecha en formato DD-MM-YYYY (requerido por backend)
        const diaInput = document.getElementById('dia');
        const anioInput = document.getElementById('anio');
        
        // Sanitizar valores (solo dígitos)
        let diaVal = diaInput.value ? diaInput.value.trim().replace(/\D/g, '') : '';
        let anioVal = anioInput.value ? anioInput.value.trim().replace(/\D/g, '') : '';
        
        const pad2 = (v) => String(v).padStart(2, '0');
        const pad4 = (v) => String(v).padStart(4, '0');

        // Validaciones básicas con conversión a número
        const dayNum = parseInt(diaVal, 10);
        const yearNum = parseInt(anioVal, 10);
        const monthNum = parseInt(selectedMesValue, 10);
        const currentYear = new Date().getFullYear();

        // Validar día (1-31)
        if (!diaVal || isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
            const msg = 'El día debe ser un número entre 1 y 31.';
            diaInput.classList.add('border-red-500');
            diaInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ dia: msg }, 'Error de Fecha');
            }
            return;
        }

        // Validar mes seleccionado (debe estar entre 01 y 12)
        if (!selectedMesValue || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            const msg = 'Por favor, seleccione un mes válido.';
            mesInput.classList.add('border-red-500');
            mesInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ mes: msg }, 'Error de Fecha');
            }
            return;
        }

        // Validar año (4 dígitos, entre 1900 y año actual)
        if (!anioVal || isNaN(yearNum) || anioVal.length !== 4 || yearNum < 1900 || yearNum > currentYear) {
            const msg = `El año debe tener 4 dígitos y estar entre 1900 y ${currentYear}.`;
            anioInput.classList.add('border-red-500');
            anioInput.focus();
            if (window.ErrorModal) {
                window.ErrorModal.show({ anio: msg }, 'Error de Fecha');
            }
            return;
        }

        // Formatear en formato DD-MM-YYYY (exactamente como espera el backend)
        const diaStr = pad2(dayNum);
        const mesStr = pad2(monthNum);
        const anioStr = String(yearNum); // año ya validado como 4 dígitos
        const fechaFormateada = `${diaStr}-${mesStr}-${anioStr}`;

        // Validar estructura de la fecha (días válidos por mes, años bisiestos, etc.)
        if (window.Validators && window.Validators.validateDateStructure) {
            const resultStructure = window.Validators.validateDateStructure(fechaFormateada);
            if (!resultStructure.valid) {
                diaInput.classList.add('border-red-500');
                diaInput.focus();
                if (window.ErrorModal) {
                    window.ErrorModal.show({ fecha: resultStructure.message }, 'Error de Fecha');
                }
                return;
            }
        }

        // Validar que la fecha no sea futura
        if (window.Validators && window.Validators.validateDateNotFuture) {
            const resultFuture = window.Validators.validateDateNotFuture(fechaFormateada);
            if (!resultFuture.valid) {
                diaInput.classList.add('border-red-500');
                diaInput.focus();
                if (window.ErrorModal) {
                    window.ErrorModal.show({ fecha: resultFuture.message }, 'Error de Fecha');
                }
                return;
            }
        }

        // Validar que el usuario sea mayor de 18 años
        if (window.Validators && window.Validators.validateMinimumAge) {
            const resultAge = window.Validators.validateMinimumAge(fechaFormateada, 18);
            if (!resultAge.valid) {
                diaInput.classList.add('border-red-500');
                diaInput.focus();
                if (window.ErrorModal) {
                    window.ErrorModal.show({ fecha: resultAge.message }, 'Error de Edad');
                }
                return;
            }
        }

        formData.fecha_nacimiento = fechaFormateada;

        // Avanzar al siguiente paso
        navigate(1);
    });

    prevBtn.addEventListener('click', () => {
        navigate(-1);
    });
}
