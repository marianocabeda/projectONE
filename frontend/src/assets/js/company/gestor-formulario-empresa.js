/**
 * FormManager para Registro de Empresa
 * Maneja la navegación entre pasos del formulario de registro de empresa
 */

document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('progress-bar');
    const registroContent = document.getElementById('registro-content');
    const stepNavigationList = document.getElementById('step-navigation-list');
    const hamburgerButton = document.getElementById('hamburger-button');
    const registroNav = document.getElementById('registro-nav');

    const steps = [
        { title: 'Datos Básicos', file: 'empresa-paso1.js' },
        { title: 'Datos Fiscales y Contacto', file: 'empresa-paso2.js' },
        { title: 'Domicilio Fiscal', file: 'empresa-paso3.js' }
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
            // Limpiar contenido anterior de forma segura
            registroContent.innerHTML = '';
            // El contenido del módulo es código interno confiable, no input de usuario
            registroContent.innerHTML = content;
            if (init) {
                init(navigate, formData, populateForm);
            }
        } catch (error) {
            console.error(`Error loading step ${currentStep + 1}:`, error);
            // Crear mensaje de error de forma segura con DOM API
            registroContent.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-center py-12';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-exclamation-triangle text-6xl text-red-500 mb-4';
            errorDiv.appendChild(icon);
            
            const p1 = document.createElement('p');
            p1.className = 'text-red-500 text-lg';
            p1.textContent = 'Error al cargar este paso.';
            errorDiv.appendChild(p1);
            
            const p2 = document.createElement('p');
            p2.className = 'text-gray-600 mt-2';
            p2.textContent = 'Por favor, intente de nuevo más tarde.';
            errorDiv.appendChild(p2);
            
            registroContent.appendChild(errorDiv);
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

    const navigate = (direction) => {
        const nextStep = currentStep + direction;
        loadStep(nextStep);
    };

    const updateProgress = () => {
        const progressPercentage = ((currentStep + 1) / steps.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    };

    const updateNavigation = () => {
        stepNavigationList.innerHTML = '';
        steps.forEach((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            const link = document.createElement('a');
            link.href = '#';
            link.className = `flex items-center justify-between p-3 rounded-lg transition-colors ${
                isActive 
                ? 'bg-principal-100 text-principal-700 font-bold' 
                : 'hover:bg-gray-100 text-gray-600'
            }`;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (index <= maxStepReached) {
                    loadStep(index);
                    // Ocultar el menú en móvil después de la selección
                    if (window.innerWidth < 768) {
                        registroNav.classList.add('hidden');
                    }
                }
            });

            let iconHtml = '';
            if (isCompleted) {
                iconHtml = '<i class="fas fa-check-circle text-green-500 mr-3"></i>';
            } else {
                iconHtml = '<i class="far fa-circle text-gray-300 mr-3"></i>';
            }

            link.innerHTML = `
                <div class="flex items-center">
                    ${iconHtml}
                    <span>${step.title}</span>
                </div>
                ${isActive ? '<span class="text-principal-500 font-bold">&lt;</span>' : ''}
            `;
            stepNavigationList.appendChild(link);
        });

        // Añadir botón de cancelar registro
        const cancelLink = document.createElement('a');
        cancelLink.href = "#";
        cancelLink.className = "flex items-center p-3 mt-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors";
        cancelLink.innerHTML = `
            <i class="fas fa-times-circle mr-3"></i>
            <span>Cancelar Registro</span>
        `;
        cancelLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro que deseas cancelar el registro de la empresa?')) {
                const dashboardUrl = window.AppConfig?.routes.dashboard || '/dashboard';
                window.location.href = dashboardUrl;
            }
        });
        stepNavigationList.appendChild(cancelLink);
    };

    // Toggle del menú hamburguesa en móvil
    if (hamburgerButton) {
        hamburgerButton.addEventListener('click', () => {
            registroNav.classList.toggle('hidden');
        });
    }

    // Cerrar el menú desplegable si se hace clic fuera de él en móvil
    document.addEventListener('click', (event) => {
        if (window.innerWidth < 768 && registroNav && hamburgerButton) {
            if (!registroNav.contains(event.target) && !hamburgerButton.contains(event.target)) {
                registroNav.classList.add('hidden');
            }
        }
    });

    // Cargar el primer paso inicial
    loadStep(0);
});
