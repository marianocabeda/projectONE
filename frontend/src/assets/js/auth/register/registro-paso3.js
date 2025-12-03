
export const content = `
    <form id="step3-form">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Paso 3: Datos de Contacto</h2>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nro. Teléfono*</label>
                <div id="telefono-container"></div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nro. Teléfono Alternativo (opcional)</label>
                <div id="alt-telefono-container"></div>
            </div>
        </div>
        <div class="mt-8 flex justify-between">
            <button type="button" id="prev-btn" class="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition">Anterior</button>
            <button type="submit" id="submit-btn" class="bg-principal-500 text-white px-6 py-2 rounded-lg hover:bg-principal-600 transition disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
        </div>
    </form>
`;

export function init(navigate, formData, populateForm) {
    const form = document.getElementById('step3-form');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    // Verificar que PhoneInput esté disponible
    if (!window.PhoneInput) {
        console.error('PhoneInput no está disponible');
        return;
    }

    let telefonoWidget = null;
    let altTelefonoWidget = null;
    let telefonoValid = false;
    let altTelefonoValid = true; // Opcional, por defecto válido

    // Esperar a que el DOM esté listo
    setTimeout(() => {
        // Crear widgets de teléfono
        telefonoWidget = window.PhoneInput.create({
            containerId: 'telefono-container',
            inputId: 'telefono',
            name: 'telefono',
            required: true,
            placeholder: 'Ingrese su teléfono',
            initialValue: formData.telefono || '',
            onValidation: (valid, message) => {
                telefonoValid = valid;
                updateSubmitButton();
            }
        });
        
        altTelefonoWidget = window.PhoneInput.create({
            containerId: 'alt-telefono-container',
            inputId: 'alt-telefono',
            name: 'alt-telefono',
            required: false,
            placeholder: 'Ingrese teléfono alternativo (opcional)',
            initialValue: formData['alt-telefono'] || '',
            onValidation: (valid, message) => {
                altTelefonoValid = valid;
                updateSubmitButton();
            }
        });
        
        // Función para actualizar el estado del botón submit
        function updateSubmitButton() {
            if (submitBtn) {
                submitBtn.disabled = !telefonoValid || !altTelefonoValid;
            }
        }
        
        // Validación inicial
        setTimeout(() => {
            if (telefonoWidget) telefonoWidget.validate();
            if (altTelefonoWidget) altTelefonoWidget.validate();
        }, 100);
    }, 0);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validar ambos teléfonos
        if (!telefonoWidget) {
            console.error('Widget de teléfono no inicializado');
            return;
        }
        
        const telefonoIsValid = telefonoWidget.validate();
        const altTelefonoIsValid = altTelefonoWidget ? altTelefonoWidget.validate() : true;
        
        if (!telefonoIsValid || !altTelefonoIsValid) {
            if (window.ErrorModal) {
                window.ErrorModal.show('Por favor, corrija los errores en los campos de teléfono', 'Validación');
            }
            return;
        }
        
        // Obtener valores en formato internacional compacto (+5492615975657)
        formData.telefono = telefonoWidget.getValue();
        formData['alt-telefono'] = altTelefonoWidget ? altTelefonoWidget.getValue() : '';
        
        navigate(1);
    });

    prevBtn.addEventListener('click', () => {
        // Limpiar widgets antes de navegar
        if (telefonoWidget) telefonoWidget.destroy();
        if (altTelefonoWidget) altTelefonoWidget.destroy();
        navigate(-1);
    });
}
