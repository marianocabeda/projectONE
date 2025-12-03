// Export an init function so the dashboard loader can import and run it after
// injecting the HTML into the dashboard. This avoids DOMContentLoaded issues
// when the page is fetched and injected dynamically.
export async function init(container) {
    const progressBar = container.querySelector('#progress-bar');
    const registroContent = container.querySelector('#registro-content');
    const stepNavigationList = container.querySelector('#step-navigation-list');
    const hamburgerButton = container.querySelector('#hamburger-button');
    const registroNav = container.querySelector('#registro-nav');

    const steps = [
        { title: 'Domicilio de Instalación', file: 'contrato_paso1.js' },
        { title: 'Ubicación (Mapa)', file: 'contrato_paso2.js' },
        { title: 'Seleccionar Plan', file: 'contrato_paso3.js' },
        { title: 'Revisar y Confirmar', file: 'contrato_paso4.js' }
    ];

    let currentStep = 0;
    let maxStepReached = 0;
    let formData = {};

    const loadStep = async (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return;

        currentStep = stepIndex;
        maxStepReached = Math.max(maxStepReached, currentStep);
        const step = steps[currentStep];

        try {
            const { content, init } = await import(`./${step.file}`);
            // NOTA DE SEGURIDAD: innerHTML se usa aquí para cargar módulos locales
            // Los archivos son de confianza (misma app). Para HTML externo usar DOMPurify
            registroContent.innerHTML = content;
            if (init) {
                init(navigate, formData, populateForm);
            }
        } catch (error) {
            registroContent.innerHTML = `<p class="text-red-500">Error al cargar este paso. Por favor, intente de nuevo más tarde.</p>`;
            if (window.ErrorHandler) {
                try { await window.ErrorHandler.handleHTTPError(error, 'contract', true); } catch (e) { /* swallow */ }
            } else if (window.ErrorModal) {
                try { window.ErrorModal.show(error && error.message ? error.message : String(error), 'Error cargando paso'); } catch (e) { /* swallow */ }
            }
        }

        updateProgress();
        updateNavigation();
    };

    const populateForm = (form, data) => {
        if (!form || !data) return;
        const elements = form.elements;
        for (const element of elements) {
            if (element.name && data[element.name]) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = element.value === data[element.name];
                } else {
                    element.value = data[element.name];
                }
            }
        }
    };

    const handleFinalSubmission = () => {
        // Usar el payload ya construido en el paso 4, o construirlo aquí si no existe
        let finalOutput = formData._finalPayload || {};

        // Si no hay _finalPayload, construir el JSON final según el tipo de dirección usada
        if (!formData._finalPayload) {
            console.warn('⚠️ No se encontró _finalPayload, construyendo desde formData...');
            
            // 1. Dirección: enviar ID si se usó registrada, o datos completos si fue manual
            if (formData.direccion_id) {
                // Usando dirección registrada: solo enviar el ID
                finalOutput.direccion_id = formData.direccion_id;
            } else if (formData.direccion) {
                // Dirección manual: enviar solo los campos requeridos por el backend
                finalOutput.direccion = {
                    calle: formData.direccion.calle,
                    numero: formData.direccion.numero,
                    codigo_postal: formData.direccion.codigo_postal,
                    piso: formData.direccion.piso || null,
                    depto: formData.direccion.depto || null,
                    provincia_id: formData.direccion.provincia_id,
                    municipio_id: formData.direccion.municipio_id,
                    distrito_id: formData.direccion.distrito_id
                };
            }

            // 2. Ubicación: solo lat y lon (sin display_name)
            if (formData.coordinates) {
                finalOutput.ubicacion = {
                    lat: formData.coordinates.lat,
                    lon: formData.coordinates.lon
                };
            }

            // 3. Plan: solo el ID
            if (formData.plan && formData.plan.id_plan) {
                finalOutput.id_plan = formData.plan.id_plan;
            } else if (formData.plan && formData.plan.id) {
                finalOutput.id_plan = formData.plan.id;
            }
        }

        console.log('📤 Payload final generado:', finalOutput);
        console.log('📋 FormData completo (debug):', formData);

        // Oculta navegación y contenido del formulario
        if (registroNav) registroNav.style.display = 'none';
        if (hamburgerButton) hamburgerButton.style.display = 'none';
        if (registroContent) registroContent.style.display = 'none';

        document.getElementById('page-title').textContent = 'Solicitud Enviada';
        const pageDesc = document.getElementById('page-desc');
        pageDesc.classList.add('text-center');
        pageDesc.innerHTML = `
            Tu solicitud de conexión ha sido generada correctamente. <br>
            Nuestro equipo te contactará para confirmar la instalación.
        `;

        const jsonDataContainer = document.createElement('div');
        jsonDataContainer.className = 'mt-8 p-4 bg-gray-800 text-white rounded-lg text-left text-sm overflow-x-auto';
        jsonDataContainer.innerHTML = `
            <h3 class="font-bold mb-2">Datos de la Solicitud (JSON):</h3>
            <pre><code>${JSON.stringify(finalOutput, null, 2)}</code></pre>
        `;
        pageDesc.parentNode.appendChild(jsonDataContainer);
    };

    const navigate = (direction) => {
        const nextStep = currentStep + direction;
        if (nextStep === steps.length) {
            handleFinalSubmission();
        } else {
            loadStep(nextStep);
        }
    };

    const updateProgress = () => {
        const progressPercentage = ((currentStep + 1) / steps.length) * 100;
        if (progressBar) progressBar.style.width = `${progressPercentage}%`;
    };

    const updateNavigation = () => {
        if (!stepNavigationList) return;
        stepNavigationList.innerHTML = '';
        steps.forEach((step, index) => {
            const isActive = index === currentStep;
            const link = document.createElement('a');
            link.href = '#';
            link.className = `flex items-center justify-between p-3 rounded-lg transition-colors ${isActive ? 'bg-principal-100 dark:bg-dark-principal-900/30 text-principal-700 dark:text-dark-principal-600 font-bold' : 'hover:bg-gray-100 dark:hover:bg-dark-bg-hover text-gray-600 dark:text-dark-text-secondary'}`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (index <= maxStepReached) {
                    loadStep(index);
                    if (window.innerWidth < 768) registroNav.classList.add('hidden');
                }
            });

            link.innerHTML = `
                <div class="flex items-center">
                    <i class="far fa-circle text-gray-300 dark:text-dark-text-muted mr-3"></i>
                    <span>${step.title}</span>
                </div>
                ${isActive ? '<span class="text-principal-500 dark:text-dark-principal-600 font-bold">&lt;</span>' : ''}
            `;
            stepNavigationList.appendChild(link);
        });

        const cancelLink = document.createElement('a');
        cancelLink.href = "/dashboard";
        cancelLink.className = "flex items-center p-3 mt-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors";
        cancelLink.innerHTML = `
            <i class="fas fa-times-circle mr-3"></i>
            <span>Cancelar</span>
        `;
        stepNavigationList.appendChild(cancelLink);
    };

    // Guardar listeners references to be able to remove later if needed
    if (hamburgerButton) {
        hamburgerButton.addEventListener('click', () => {
            if (registroNav) registroNav.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking outside (scoped to container)
    const outsideClickHandler = (event) => {
        if (window.innerWidth < 768) {
            if (registroNav && !registroNav.contains(event.target) && hamburgerButton && !hamburgerButton.contains(event.target)) {
                registroNav.classList.add('hidden');
            }
        }
    };
    document.addEventListener('click', outsideClickHandler);

    // Cargar el primer paso inicial
    loadStep(0);

    // Return a cleanup function in case the caller wants to remove listeners later
    return () => {
        if (hamburgerButton) hamburgerButton.removeEventListener('click', () => {});
        document.removeEventListener('click', outsideClickHandler);
    };
}
