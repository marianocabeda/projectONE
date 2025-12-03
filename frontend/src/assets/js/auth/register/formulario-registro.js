
document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.getElementById('progress-bar');
    const registroContent = document.getElementById('registro-content');
    const stepNavigationList = document.getElementById('step-navigation-list');
    const hamburgerButton = document.getElementById('hamburger-button');
    const registroNav = document.getElementById('registro-nav');

    const steps = [
        { title: 'Credenciales', file: 'registro-paso1.js' },
        { title: 'Datos Personales', file: 'registro-paso2.js' },
        { title: 'Datos de Contacto', file: 'registro-paso3.js' },
        { title: 'Domicilio', file: 'registro-paso4.js' }
    ];

    let currentStep = 0;
    let maxStepReached = 0; // Nuevo: Rastrea el paso más avanzado alcanzado
    let formData = {};

    const loadStep = async (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return;

        currentStep = stepIndex;
        maxStepReached = Math.max(maxStepReached, currentStep); // Actualiza el paso más avanzado
        const step = steps[currentStep];

        try {
            const { content, init } = await import(`./${step.file}`);
            registroContent.innerHTML = content;
            if (init) {
                init(navigate, formData, populateForm); // Pasa populateForm a init
            }
        } catch (error) {
            console.error(`Error loading step ${currentStep + 1}:`, error);
            registroContent.innerHTML = `<p class="text-red-500">Error al cargar este paso. Por favor, intente de nuevo más tarde.</p>`;
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
        // Realiza la limpieza/formateo final de los datos para la DB
        const finalOutput = {
            persona: {},
            direccion: {}
        };

        // Mapeo de campos a la estructura final
        // Datos de Persona
        if (formData.email) finalOutput.persona.email = formData.email;
        // La contraseña no debe ser parte del JSON final enviado/mostrado por seguridad
        // if (formData.password) finalOutput.persona.password = formData.password;
        if (formData.nombre) finalOutput.persona.nombre = formData.nombre;
        if (formData.apellido) finalOutput.persona.apellido = formData.apellido;
        if (formData.cuil) finalOutput.persona.cuil = formData.cuil.replace(/-/g, ''); // Envía solo números
        if (formData.dni) finalOutput.persona.dni = formData.dni;
        if (formData.fecha_nacimiento) finalOutput.persona.fecha_nacimiento = formData.fecha_nacimiento;
        if (formData.sexo) finalOutput.persona.sexo = formData.sexo;

        // Datos de Contacto para Persona (aplicando renombres de corregir.txt)
        if (formData.telefono) finalOutput.persona.telefono = formData.telefono;
        if (formData['alt-telefono']) finalOutput.persona.telefono_alternativo = formData['alt-telefono'];

        // Datos de Domicilio (aplicando renombres de corregir.txt)
        if (formData.calle) finalOutput.direccion.calle = formData.calle;
        if (formData.numero) finalOutput.direccion.numero = formData.numero;
        if (formData.piso) finalOutput.direccion.piso = formData.piso;
        if (formData.depto) finalOutput.direccion.depto = formData.depto;
        if (formData.codigo_postal) finalOutput.direccion.codigo_postal = formData.codigo_postal;
        if (formData.provincia) finalOutput.direccion.provincia = formData.provincia;
        if (formData.municipio) finalOutput.direccion.municipio = formData.municipio;
        // Para distrito, se envía el nombre como está en formData. Si se requiere el ID,
        // se necesitaría una modificación en step4.js para almacenar el ID o una lógica de búsqueda aquí.
        if (formData.distrito) finalOutput.direccion.distrito = formData.distrito;

        // Elimina campos auxiliares o sensibles que no deben ir en el JSON final
        // La contraseña se maneja por separado y no se incluye en el JSON de salida
        // El campo 'sin-numero' es un helper de UI y no es parte de la estructura final

        // Oculta la navegación de progreso y el contenedor del formulario
        if (registroNav) registroNav.style.display = 'none';
        if (hamburgerButton) hamburgerButton.style.display = 'none'; // Oculta el botón de hamburguesa en móvil
        if (registroContent) registroContent.style.display = 'none';
        // Cambia el título y la descripción principal de la página
        document.getElementById('page-title').textContent = '¡Felicitaciones!';
        const pageDesc = document.getElementById('page-desc');
        pageDesc.innerHTML = `
            Tu cuenta ha sido creada con éxito. <br>
            Por favor, revisa tu correo electrónico para verificar tu cuenta y comenzar.
            <div class="mt-8 text-center">
                <a href="/login" class="boton-cta text-white bg-principal-500 hover:bg-principal-400 transition-colors duration-300">
                    Ir a Autogestión
                </a>
            </div>
        `;
        // Centra el texto de la descripción
        pageDesc.classList.add('text-center');

        // Muestra el JSON con los datos finales
        const jsonDataContainer = document.createElement('div');
        jsonDataContainer.className = 'mt-8 p-4 bg-gray-800 text-white rounded-lg text-left text-sm overflow-x-auto';
        jsonDataContainer.innerHTML = `
            <h3 class="font-bold mb-2">Datos de Registro (JSON):</h3>
            <pre><code>${JSON.stringify(finalOutput, null, 2)}</code></pre>
        `;
        pageDesc.parentNode.appendChild(jsonDataContainer);

        // Opcional: podrías mostrar un mensaje de confirmación en el contenedor del formulario si prefieres
        /*
        registroContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-4 text-gray-800 text-center">¡Registro Exitoso!</h2>
            <p class="text-center">Revisa tu correo electrónico para verificar tu cuenta.</p>
        `;
        */
    };

    const navigate = (direction) => {
        const nextStep = currentStep + direction;
        if (nextStep === steps.length) { // Si es el último paso y se avanza
            handleFinalSubmission();
        } else {
            loadStep(nextStep);
        }
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
                if (index <= maxStepReached) { // Permite navegar a cualquier paso visitado
                    // Los datos ya deberían haber sido guardados por el manejador de submit del paso
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

        // Añadir botón de cerrar en móvil y cancelar registro
        const cancelLink = document.createElement('a');
        cancelLink.href = "/"; // Redirige a la página de inicio
        cancelLink.className = "flex items-center p-3 mt-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors";
        cancelLink.innerHTML = `
            <i class="fas fa-times-circle mr-3"></i>
            <span>Cancelar Registro</span>
        `;
        stepNavigationList.appendChild(cancelLink);
    };
    
    hamburgerButton.addEventListener('click', () => {
        registroNav.classList.toggle('hidden');
    });

    // Cerrar el menú desplegable si se hace clic fuera de él en móvil
    document.addEventListener('click', (event) => {
        if (window.innerWidth < 768 && !registroNav.contains(event.target) && !hamburgerButton.contains(event.target)) {
            registroNav.classList.add('hidden');
        }
    });

    // Cargar el primer paso inicial
    loadStep(0);
});
