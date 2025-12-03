/**
 * PASO 5: Factibilidad Inmediata
 * Módulo para que usuarios tipo "atención" seleccionen si requieren verificación inmediata
 * y capturen datos técnicos necesarios (NAP, VLAN, puerto, observaciones)
 */

export const content = `
<div class="space-y-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            <i class="fas fa-network-wired mr-2"></i>
            Factibilidad de Instalación
        </h3>
        <p class="text-sm text-blue-800 dark:text-blue-200">
            Selecciona si es posible verificar la factibilidad inmediatamente o si se debe derivar al equipo técnico.
        </p>
    </div>

    <form id="contract-step5-form" class="space-y-6">
        <!-- Selector de Factibilidad -->
        <div class="space-y-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-3">
                ¿Se puede verificar la factibilidad inmediatamente? *
            </label>

            <div class="space-y-3">
                <!-- Opción: Factibilidad Inmediata -->
                <label class="flex items-start p-4 border-2 border-gray-300 dark:border-dark-border-primary rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-all bg-white dark:bg-dark-bg-card" id="label-factibilidad-si">
                    <input type="radio" name="factibilidad_inmediata" value="true" id="factibilidad-si" class="mt-1 h-4 w-4 text-principal-600 dark:text-dark-principal-600 focus:ring-principal-500 dark:focus:ring-dark-principal-600 dark:bg-dark-bg-tertiary dark:border-dark-border-primary" required>
                    <div class="ml-3 flex-1">
                        <span class="block font-semibold text-gray-900 dark:text-dark-text-primary">Sí, verificar ahora</span>
                        <span class="block text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                            Se cuenta con los datos técnicos necesarios para instalación inmediata
                        </span>
                    </div>
                </label>

                <!-- Opción: Derivar -->
                <label class="flex items-start p-4 border-2 border-gray-300 dark:border-dark-border-primary rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-all bg-white dark:bg-dark-bg-card" id="label-factibilidad-no">
                    <input type="radio" name="factibilidad_inmediata" value="false" id="factibilidad-no" class="mt-1 h-4 w-4 text-principal-600 dark:text-dark-principal-600 focus:ring-principal-500 dark:focus:ring-dark-principal-600 dark:bg-dark-bg-tertiary dark:border-dark-border-primary" required>
                    <div class="ml-3 flex-1">
                        <span class="block font-semibold text-gray-900 dark:text-dark-text-primary">No, derivar al equipo técnico</span>
                        <span class="block text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                            Se requiere verificación técnica en campo
                        </span>
                    </div>
                </label>
            </div>
        </div>

        <!-- Campos Técnicos (se muestran solo si factibilidad_inmediata = true) -->
        <div id="campos-tecnicos" class="hidden space-y-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">
                <i class="fas fa-tools mr-2"></i>
                Datos Técnicos de Instalación
            </h4>
            <p class="text-sm text-green-800 dark:text-green-200 mb-4">
                Los siguientes campos son <strong>obligatorios</strong> cuando se verifica factibilidad inmediata:
            </p>

            <!-- NAP -->
            <div>
                <label for="nap" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    NAP (Network Access Point) *
                </label>
                <input type="text" id="nap" name="nap" 
                    class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-transparent bg-white dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                    placeholder="Ej: NAP-Centro-04"
                    maxlength="100">
                <p class="text-xs text-gray-500 dark:text-dark-text-muted mt-1">Identificador del punto de acceso de red</p>
            </div>

            <!-- VLAN -->
            <div>
                <label for="vlan" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    VLAN *
                </label>
                <input type="number" id="vlan" name="vlan" 
                    class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-transparent bg-white dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                    placeholder="Ej: 2150"
                    min="1" max="4094">
                <p class="text-xs text-gray-500 dark:text-dark-text-muted mt-1">Número de VLAN (1-4094)</p>
            </div>

            <!-- Puerto (Opcional) -->
            <div>
                <label for="puerto" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                    Puerto <span class="text-gray-500 dark:text-dark-text-muted font-normal">(Opcional)</span>
                </label>
                <input type="number" id="puerto" name="puerto" 
                    class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-transparent bg-white dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                    placeholder="Ej: 4"
                    min="1" max="48">
                <p class="text-xs text-gray-500 dark:text-dark-text-muted mt-1">Número de puerto del switch/OLT</p>
            </div>
        </div>

        <!-- Observaciones (solo visible cuando se deriva) -->
        <div id="campos-observaciones" class="hidden">
            <label for="observaciones" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">
                Observaciones <span class="text-gray-500 dark:text-dark-text-muted font-normal">(Opcional)</span>
            </label>
            <textarea id="observaciones" name="observaciones" rows="4"
                class="w-full px-4 py-2 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-transparent bg-white dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                placeholder="Agrega cualquier observación relevante sobre la derivación..."></textarea>
            <p class="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                Ejemplo: "Requiere verificación de cobertura en zona rural" o "Cliente solicita visita técnica programada".
            </p>
        </div>

        <!-- Botones de navegación -->
        <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-dark-border-primary">
            <button type="button" id="btn-back" class="w-full sm:w-auto px-6 py-2.5 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors">
                <i class="fas fa-arrow-left mr-2"></i>
                Volver
            </button>
            <button type="submit" id="btn-next" class="w-full sm:flex-1 px-6 py-2.5 bg-principal-600 dark:bg-dark-principal-600 text-white rounded-lg hover:bg-principal-700 dark:hover:bg-dark-principal-700 transition-colors">
                Finalizar Solicitud
                <i class="fas fa-check ml-2"></i>
            </button>
        </div>
    </form>
</div>
`;

export function init(navigateCallback, formData = {}, populateFormCallback = null) {
    console.log('🚀 Inicializando Paso 5: Factibilidad Inmediata');
    
    const form = document.getElementById('contract-step5-form');
    if (!form) {
        console.error('❌ Formulario del paso 5 no encontrado');
        return;
    }

    // Referencias a elementos
    const factibilidadSi = document.getElementById('factibilidad-si');
    const factibilidadNo = document.getElementById('factibilidad-no');
    const camposTecnicos = document.getElementById('campos-tecnicos');
    const camposObservaciones = document.getElementById('campos-observaciones');
    const napInput = document.getElementById('nap');
    const vlanInput = document.getElementById('vlan');
    const puertoInput = document.getElementById('puerto');
    const labelFactibilidadSi = document.getElementById('label-factibilidad-si');
    const labelFactibilidadNo = document.getElementById('label-factibilidad-no');
    
    // Log para debug
    console.log('📋 Elementos encontrados:');
    console.log('  - factibilidadSi:', !!factibilidadSi);
    console.log('  - factibilidadNo:', !!factibilidadNo);
    console.log('  - camposTecnicos:', !!camposTecnicos);
    console.log('  - camposObservaciones:', !!camposObservaciones);
    console.log('  - observaciones textarea:', !!document.getElementById('observaciones'));

    // Poblar formulario con datos previos si existen
    if (populateFormCallback && formData) {
        populateFormCallback(form, formData);
    }
    
    // Función para mostrar/ocultar campos técnicos y observaciones
    const toggleCamposTecnicos = () => {
        const esInmediata = factibilidadSi.checked;
        
        if (esInmediata) {
            // Mostrar campos técnicos, OCULTAR observaciones
            camposTecnicos.classList.remove('hidden');
            camposObservaciones.classList.add('hidden');
            
            // Hacer campos técnicos obligatorios
            napInput.setAttribute('required', 'required');
            vlanInput.setAttribute('required', 'required');
            
            // Limpiar observaciones ya que no se usarán
            const obsInput = document.getElementById('observaciones');
            if (obsInput) obsInput.value = '';
            
            // Estilo del radio seleccionado
            labelFactibilidadSi.classList.add('border-green-500', 'bg-green-50', 'dark:border-green-600', 'dark:bg-green-900/20');
            labelFactibilidadSi.classList.remove('border-gray-300', 'dark:border-dark-border-primary');
            labelFactibilidadNo.classList.remove('border-principal-500', 'bg-blue-50', 'dark:border-principal-600', 'dark:bg-blue-900/20');
            labelFactibilidadNo.classList.add('border-gray-300', 'dark:border-dark-border-primary');
        } else {
            // Ocultar campos técnicos, MOSTRAR observaciones
            camposTecnicos.classList.add('hidden');
            camposObservaciones.classList.remove('hidden');
            
            // Hacer campos técnicos opcionales
            napInput.removeAttribute('required');
            vlanInput.removeAttribute('required');
            
            // Limpiar valores técnicos
            napInput.value = '';
            vlanInput.value = '';
            puertoInput.value = '';
            
            // Estilo del radio seleccionado
            labelFactibilidadNo.classList.add('border-principal-500', 'bg-blue-50', 'dark:border-principal-600', 'dark:bg-blue-900/20');
            labelFactibilidadNo.classList.remove('border-gray-300', 'dark:border-dark-border-primary');
            labelFactibilidadSi.classList.remove('border-green-500', 'bg-green-50', 'dark:border-green-600', 'dark:bg-green-900/20');
            labelFactibilidadSi.classList.add('border-gray-300', 'dark:border-dark-border-primary');
        }
    };
    
    // Listeners para cambios en radio buttons
    factibilidadSi.addEventListener('change', toggleCamposTecnicos);
    factibilidadNo.addEventListener('change', toggleCamposTecnicos);
    
    // Restaurar estado previo si existe
    if (formData.factibilidad_inmediata !== undefined) {
        if (formData.factibilidad_inmediata === true || formData.factibilidad_inmediata === 'true') {
            factibilidadSi.checked = true;
        } else {
            factibilidadNo.checked = true;
        }
        toggleCamposTecnicos();
    }

    // Sanitización de inputs
    if (window.Sanitizer) {
        napInput.addEventListener('blur', (e) => {
            e.target.value = window.Sanitizer.sanitizeString(e.target.value).toUpperCase();
        });
        
        // Sanitizar observaciones cuando pierda el foco
        const observacionesTextarea = document.getElementById('observaciones');
        if (observacionesTextarea) {
            observacionesTextarea.addEventListener('blur', (e) => {
                e.target.value = window.Sanitizer.sanitizeString(e.target.value);
            });
        }
    }
    
    // Validación de VLAN en tiempo real
    vlanInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value && (value < 1 || value > 4094)) {
            if (window.Validators) {
                window.Validators.showError(e.target, 'VLAN debe estar entre 1 y 4094');
            }
        } else {
            if (window.Validators) {
                window.Validators.removeError(e.target);
            }
        }
    });
    
    // Validación de puerto en tiempo real
    puertoInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (value && (value < 1 || value > 48)) {
            if (window.Validators) {
                window.Validators.showError(e.target, 'Puerto debe estar entre 1 y 48');
            }
        } else {
            if (window.Validators) {
                window.Validators.removeError(e.target);
            }
        }
    });

    // Botón volver
    const btnBack = document.getElementById('btn-back');
    btnBack?.addEventListener('click', () => {
        navigateCallback('back');
    });

    // Submit del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!factibilidadSi.checked && !factibilidadNo.checked) {
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    message: 'Por favor, selecciona una opción de factibilidad'
                });
            }
            return;
        }
        
        const esInmediata = factibilidadSi.checked;
        
        // Si es inmediata, validar campos técnicos
        if (esInmediata) {
            if (!napInput.value.trim()) {
                if (window.Validators) {
                    window.Validators.showError(napInput, 'El campo NAP es obligatorio');
                }
                napInput.focus();
                return;
            }
            
            const vlanValue = parseInt(vlanInput.value);
            if (!vlanValue || vlanValue < 1 || vlanValue > 4094) {
                if (window.Validators) {
                    window.Validators.showError(vlanInput, 'VLAN debe estar entre 1 y 4094');
                }
                vlanInput.focus();
                return;
            }
            
            const puertoValue = puertoInput.value ? parseInt(puertoInput.value) : null;
            if (puertoValue && (puertoValue < 1 || puertoValue > 48)) {
                if (window.Validators) {
                    window.Validators.showError(puertoInput, 'Puerto debe estar entre 1 y 48');
                }
                puertoInput.focus();
                return;
            }
        }
        
        // Guardar datos en formData
        formData.factibilidad_inmediata = esInmediata;
        
        if (esInmediata) {
            // Factibilidad inmediata: incluir datos técnicos, NO observaciones
            formData.nap = window.Sanitizer ? window.Sanitizer.sanitizeString(napInput.value).toUpperCase() : napInput.value.toUpperCase();
            formData.vlan = parseInt(vlanInput.value);
            formData.puerto = puertoInput.value ? parseInt(puertoInput.value) : null;
            // Eliminar observaciones en factibilidad inmediata
            delete formData.observaciones;
        } else {
            // Derivación: NO incluir datos técnicos, pero SÍ incluir observaciones si el usuario escribió algo
            delete formData.nap;
            delete formData.vlan;
            delete formData.puerto;
            
            // Incluir observaciones SOLO si el usuario escribió algo
            const observacionesInput = document.getElementById('observaciones');
            
            console.log('🔍 DEBUG - Verificando observaciones:');
            console.log('  - observacionesInput existe:', !!observacionesInput);
            console.log('  - observacionesInput.value:', observacionesInput ? observacionesInput.value : 'N/A');
            console.log('  - observacionesInput.value.trim():', observacionesInput ? observacionesInput.value.trim() : 'N/A');
            console.log('  - Longitud del valor:', observacionesInput ? observacionesInput.value.trim().length : 0);
            
            if (observacionesInput && observacionesInput.value.trim()) {
                // Solo incluir si hay contenido
                const valorSanitizado = window.Sanitizer 
                    ? window.Sanitizer.sanitizeString(observacionesInput.value) 
                    : observacionesInput.value;
                formData.observaciones = valorSanitizado;
                console.log('  ✅ Observaciones incluidas:', valorSanitizado);
            } else {
                // Si está vacío o no existe, NO incluir el campo
                delete formData.observaciones;
                console.log('  ℹ️  Observaciones NO incluidas (campo vacío o no encontrado)');
            }
        }
        
        // LOGGING: Estado de formData después del Paso 5
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 PASO 5 COMPLETADO - Factibilidad Inmediata');
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔧 Factibilidad inmediata:', formData.factibilidad_inmediata);
        if (formData.factibilidad_inmediata) {
            console.log('✅ Verificación inmediata - Datos técnicos capturados:');
            console.log('  🔧 NAP:', formData.nap);
            console.log('  🔧 VLAN:', formData.vlan);
            console.log('  🔧 Puerto:', formData.puerto || 'N/A (opcional)');
            console.log('  📝 Observaciones: NO (no aplica en verificación inmediata)');
        } else {
            console.log('⏸️  Derivación al equipo técnico');
            console.log('  ℹ️  Sin datos técnicos (requiere verificación)');
            console.log('  📝 Observaciones:', formData.observaciones || 'N/A (sin observaciones adicionales)');
        }
        console.log('📦 FormData completo:', JSON.stringify(formData, null, 2));
        console.log('🚀 Procediendo a enviar solicitud al backend...');
        console.log('═══════════════════════════════════════════════════════');
        
        // Continuar al siguiente paso (finalización)
        navigateCallback('next');
    });

    console.log('✅ Paso 5 inicializado correctamente');
}
