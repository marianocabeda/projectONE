export const content = `
    <form id="contract-step3-form">
        <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-dark-text-primary">Paso 3: Seleccione un Plan</h2>
        
        <!-- Selector de tipo de plan -->
        <div id="plan-type-section" class="mb-6">
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">Primero, elija el tipo de plan:</p>
            <div id="plan-types-container" class="flex gap-4 justify-center"></div>
        </div>

        <!-- Contenedor de planes (se muestra después de seleccionar tipo) -->
        <div id="plans-section" class="hidden">
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">Seleccione un plan:</p>
            <div id="plans-container" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
        </div>

        <input type="hidden" id="selected-plan" name="selected-plan">
        <input type="hidden" id="selected-plan-type" name="selected-plan-type">

        <div class="mt-8 flex justify-between">
            <button type="button" id="prev-btn" class="bg-gray-300 dark:bg-dark-bg-tertiary text-gray-800 dark:text-dark-text-primary px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-hover transition">Anterior</button>
            <button type="submit" class="bg-principal-500 dark:bg-dark-principal-600 text-white px-6 py-2 rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition">Siguiente</button>
        </div>
    </form>
`;

export async function init(navigate, formData, populateForm) {
    const form = document.getElementById('contract-step3-form');
    const prevBtn = document.getElementById('prev-btn');
    const planTypesContainer = document.getElementById('plan-types-container');
    const plansContainer = document.getElementById('plans-container');
    const plansSection = document.getElementById('plans-section');
    const selectedPlanInput = document.getElementById('selected-plan');
    const selectedPlanTypeInput = document.getElementById('selected-plan-type');

    // Configuración de URLs
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        const API_BASE_URL = window.AppConfig?.API_BASE_URL || '';
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
    });

    let currentPlanType = null;
    let planTypes = [];
    let plans = [];

    // Cargar tipos de planes desde el backend
    async function loadPlanTypes() {
        try {
            const url = getUrl('tipoPlanes');
            console.log('📤 Cargando tipos de planes desde:', url);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Tipos de planes recibidos:', result);

            planTypes = result.data?.tipos || result.tipos || [];
            renderPlanTypes(planTypes);

        } catch (error) {
            console.error('❌ Error al cargar tipos de planes:', error);
            if (window.ErrorModal) {
                window.ErrorModal.show('No se pudieron cargar los tipos de planes', 'Error');
            }
        }
    }

    // Renderizar switch de tipos de planes
    function renderPlanTypes(types) {
        planTypesContainer.innerHTML = '';
        
        // Verificar si hay exactamente 2 tipos de planes para usar el switch
        if (types.length === 2 && typeof window.createSwitch === 'function') {
            // Identificar cuál es Hogar y cuál es PyME
            const hogarType = types.find(t => t.nombre?.toLowerCase().includes('hogar'));
            const pymeType = types.find(t => t.nombre?.toLowerCase().includes('pyme'));
            
            if (hogarType && pymeType) {
                // Crear el switch usando boton-switch.js
                const switchComponent = window.createSwitch({
                    switchOptions: {
                        left: { 
                            text: hogarType.nombre, 
                            value: hogarType.id_tipo_plan.toString()
                        },
                        right: { 
                            text: pymeType.nombre, 
                            value: pymeType.id_tipo_plan.toString()
                        }
                    },
                    switchValue: null, // Sin selección inicial
                    onSwitchChange: async (value) => {
                        const selectedType = types.find(t => t.id_tipo_plan.toString() === value);
                        if (selectedType) {
                            currentPlanType = selectedType;
                            selectedPlanTypeInput.value = selectedType.id_tipo_plan;
                            
                            // Cargar planes de este tipo
                            await loadPlans(selectedType.id_tipo_plan);
                        }
                    }
                });
                
                const switchElement = switchComponent.getElement();
                switchElement.classList.add('mx-auto');
                planTypesContainer.appendChild(switchElement);
                
                // Si ya había un tipo seleccionado, restaurarlo
                if (formData.plan_type && formData.plan_type.id_tipo_plan) {
                    switchComponent.setValue(formData.plan_type.id_tipo_plan.toString());
                    // Cargar los planes del tipo seleccionado
                    loadPlans(formData.plan_type.id_tipo_plan);
                }
                
                return;
            }
        }
        
        // Si no hay exactamente 2 tipos o no son Hogar/PyME, usar botones tradicionales
        types.forEach(tipo => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'px-6 py-3 bg-white dark:bg-dark-bg-secondary border-2 border-gray-300 dark:border-dark-border-primary rounded-lg hover:border-principal-500 dark:hover:border-dark-principal-600 hover:bg-principal-50 dark:hover:bg-dark-bg-hover transition font-medium text-base text-gray-800 dark:text-dark-text-primary';
            button.textContent = tipo.nombre;
            button.dataset.typeId = tipo.id_tipo_plan;
            
            button.addEventListener('click', async () => {
                // Deseleccionar otros
                planTypesContainer.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('border-principal-500', 'dark:border-dark-principal-600', 'bg-principal-100', 'dark:bg-dark-principal-900/30', 'ring-4', 'ring-principal-300', 'dark:ring-dark-principal-600');
                    btn.classList.add('border-gray-300', 'dark:border-dark-border-primary');
                });
                
                // Seleccionar este
                button.classList.remove('border-gray-300', 'dark:border-dark-border-primary');
                button.classList.add('border-principal-500', 'dark:border-dark-principal-600', 'bg-principal-100', 'dark:bg-dark-principal-900/30', 'ring-4', 'ring-principal-300', 'dark:ring-dark-principal-600');
                
                currentPlanType = tipo;
                selectedPlanTypeInput.value = tipo.id_tipo_plan;
                
                // Cargar planes de este tipo
                await loadPlans(tipo.id_tipo_plan);
            });

            planTypesContainer.appendChild(button);
        });

        // Si ya había un tipo seleccionado, restaurarlo
        if (formData.plan_type && formData.plan_type.id_tipo_plan) {
            const btn = planTypesContainer.querySelector(`[data-type-id="${formData.plan_type.id_tipo_plan}"]`);
            if (btn) {
                btn.click();
            }
        }
    }

    // Cargar planes de un tipo específico
    async function loadPlans(tipoPlanId) {
        try {
            const url = getUrl('planes') + `?id_tipo_plan=${tipoPlanId}`;
            console.log('📤 Cargando planes desde:', url);

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Planes recibidos:', result);

            plans = result.data?.planes || result.planes || result.data || [];
            renderPlans(plans);

            // Mostrar sección de planes
            plansSection.classList.remove('hidden');

        } catch (error) {
            console.error('❌ Error al cargar planes:', error);
            if (window.ErrorModal) {
                window.ErrorModal.show('No se pudieron cargar los planes', 'Error');
            }
        }
    }

    // Renderizar cards de planes (usando los colores personalizados de input.css)
    function renderPlans(planesData) {
        plansContainer.innerHTML = '';

        // Definir colores de tarjeta según input.css
        const planColors = {
            'hogar': ['amarillo', 'verde', 'azul'],  // Para planes Hogar
            'pyme': ['verde', 'azul', 'amarillo']    // Para planes PyME
        };
        
        // Obtener array de colores según tipo de plan
        const tipoPlanKey = currentPlanType?.nombre?.toLowerCase().includes('hogar') ? 'hogar' : 
                           currentPlanType?.nombre?.toLowerCase().includes('pyme') ? 'pyme' : 
                           'hogar';
        const colorsArray = planColors[tipoPlanKey];

        planesData.forEach((plan, index) => {
            const card = document.createElement('div');
            card.className = 'plan-card flex flex-col bg-white dark:bg-dark-bg-secondary text-center overflow-hidden border-4 border-transparent transition-all duration-300';
            card.dataset.planId = plan.id_plan || plan.id;

            // Asignar color ciclando por el array de colores
            const colorClass = colorsArray[index % colorsArray.length];
            
            card.dataset.color = colorClass;

            // Formatear velocidad desde velocidad_mbps
            const velocidadText = plan.velocidad_mbps ? `${plan.velocidad_mbps} Mbps` : (plan.velocidad || plan.speed || 'N/A');
            
            // Formatear precio
            const precioText = plan.precio || plan.price || '0';

            card.innerHTML = `
                <div class="p-6 lg:p-8 flex flex-col h-full bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-md dark:shadow-black/50 hover:shadow-xl dark:hover:shadow-black/60 transition-shadow duration-300 cursor-pointer border border-gray-200 dark:border-dark-border-primary">
                
                    <!-- Título -->
                    <h3 class="font-bold text-xl lg:text-2xl uppercase tracking-widest text-gray-900 dark:text-dark-text-primary mb-2 text-center 
                               leading-none 
                               [text-shadow:_0_2px_6px_rgba(0,0,0,0.15)] dark:[text-shadow:_0_2px_6px_rgba(0,0,0,0.5)]
                               drop-shadow-md">
                        ${plan.nombre || plan.title}
                    </h3>
                
                    <!-- Línea de color (usando data-line-color para aplicar el color dinámico) -->
                    <div data-line-color class="h-1 w-full max-w-xs mx-auto mb-5 rounded-full"></div>
                
                    <!-- Velocidad -->
                    <p class="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-dark-text-primary mb-2 text-center tracking-tight">
                        ${velocidadText}
                    </p>
                    <div class="h-4"></div>
                
                    <!-- Precio (usando data-bg-color para aplicar el color dinámico) -->
                    <div data-bg-color class="w-full max-w-xs mx-auto text-white text-lg font-bold py-2 px-4 rounded-xl mb-3 text-center shadow-sm dark:shadow-black/50">
                        $${precioText}
                    </div>
                
                    <!-- Textos pequeños -->
                    <p class="text-gray-500 dark:text-dark-text-secondary text-sm font-semibold uppercase tracking-wide text-center mb-1">
                        Precio final / mes
                    </p>
                    <p class="text-gray-500 dark:text-dark-text-secondary text-sm font-medium text-center mb-5">
                        ${plan.descripcion || plan.instalacion || plan.installation || 'Instalación gratuita'}
                    </p>
                
                    <!-- Badge de selección (oculto inicialmente) -->
                    <div class="selected-badge hidden mt-auto pt-4">
                        <div class="bg-exito-500 dark:bg-green-600 text-white font-semibold py-1 px-3 rounded-md text-center shadow-sm dark:shadow-black/50">
                            ✓ Plan seleccionado
                        </div>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                // Deseleccionar otros
                plansContainer.querySelectorAll('.plan-card').forEach(c => {
                    c.classList.remove('ring-4', 'ring-principal-500', 'dark:ring-dark-principal-600');
                    c.querySelector('.selected-badge')?.classList.add('hidden');
                });
                
                // Seleccionar este
                card.classList.add('ring-4', 'ring-principal-500', 'dark:ring-dark-principal-600');
                card.querySelector('.selected-badge')?.classList.remove('hidden');
                
                selectedPlanInput.value = plan.id_plan || plan.id;
                formData.plan = plan;
                formData.plan_type = currentPlanType;
                
                console.log('✅ Plan seleccionado:', plan);
            });

            plansContainer.appendChild(card);
        });

        // Si ya había un plan seleccionado, restaurarlo
        if (formData.plan && formData.plan.id_plan) {
            const card = plansContainer.querySelector(`[data-plan-id="${formData.plan.id_plan}"]`);
            if (card) {
                card.click();
            }
        }
    }

    // Manejar envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentPlanType) {
            alert('Por favor, seleccione un tipo de plan.');
            return;
        }
        
        if (!formData.plan) {
            alert('Por favor, seleccione un plan para continuar.');
            return;
        }
        
        // LOGGING: Estado de formData después del Paso 3
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 PASO 3 COMPLETADO - Selección de Plan');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📱 Plan seleccionado:', formData.plan);
        console.log('📱 Tipo de plan:', formData.plan_type);
        console.log('📦 FormData completo:', JSON.stringify(formData, null, 2));
        console.log('═══════════════════════════════════════════════════════');
        
        navigate(1);
    });

    prevBtn.addEventListener('click', () => navigate(-1));

    // Inicializar: cargar tipos de planes
    await loadPlanTypes();
}
