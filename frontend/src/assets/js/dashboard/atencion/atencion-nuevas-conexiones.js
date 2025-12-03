/* ACTUALIZADO: 2025-11-23 08:10:38 - Cache Bust */
/**
 * Módulo: Nuevas Conexiones y Usuarios
 * Gestiona el flujo completo de registro de clientes y contratación
 */

(function() {
    'use strict';

    let currentStep = 1;
    let clienteData = null;
    let contratoData = null;

    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = (endpoint) => {
        // CRÍTICO: Siempre usar AppConfig.getUrl si está disponible
        if (window.AppConfig && typeof window.AppConfig.getUrl === 'function') {
            const url = window.AppConfig.getUrl(endpoint);
            console.log(`🔧 getUrl("${endpoint}") => ${url}`);
            return url;
        }
        
        // Fallback solo si AppConfig no está disponible (no debería pasar)
        console.warn('⚠️ AppConfig.getUrl no disponible, usando fallback');
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
    };

    // Variable para almacenar la instancia del buscador
    let buscadorInstance = null;

    function init() {
        console.log('🎯 Inicializando Módulo de Nuevas Conexiones...');

        // Cargar scripts necesarios primero
        cargarScriptsNecesarios()
            .then(() => {
                console.log('✅ Scripts cargados, configurando interfaz');
                setupEventListeners();
                inicializarBuscador();
                updateProgress();
                console.log('✅ Módulo de Nuevas Conexiones inicializado');
            })
            .catch(error => {
                console.error('❌ Error al inicializar módulo:', error);
                // Continuar con funcionalidad básica aunque fallen algunos scripts
                setupEventListeners();
                updateProgress();
            });
    }

    /**
     * Inicializa el componente buscador de usuario
     */
    function inicializarBuscador() {
        if (!window.BuscadorUsuario) {
            console.warn('⚠️ BuscadorUsuario no disponible');
            return;
        }

        console.log('🔍 Inicializando Buscador de Usuario...');

        buscadorInstance = new window.BuscadorUsuario({
            containerId: 'buscador-nuevas-conexiones-container',
            theme: 'principal',
            placeholder: 'Buscar por DNI, Email, Nombre o Apellido...',
            autoFocus: true,
            animated: true,
            onSelect: (usuario) => {
                console.log('👤 Usuario seleccionado:', usuario);
                seleccionarUsuario(usuario);
            },
            onClear: () => {
                console.log('🧹 Búsqueda limpiada');
                clienteNuevo = null;
            }
        });

        console.log('✅ Buscador inicializado');
    }

    function isSmallScreen() {
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    }

    /**
     * Configura los event listeners
     */
    function setupEventListeners() {
        // Botón volver
        document.getElementById('btn-volver')?.addEventListener('click', volverAlPanel);

        // Búsqueda de clientes
        document.getElementById('btn-buscar-documento')?.addEventListener('click', buscarPorDocumento);
        document.getElementById('btn-buscar-email')?.addEventListener('click', buscarPorEmail);
        
        // Enter en los campos de búsqueda
        const documentoInput = document.getElementById('buscar-documento');
        const emailInput = document.getElementById('buscar-email');
        
        if (documentoInput) {
            // Crear contenedor de sugerencias si no existe
            if (!document.getElementById('sugerencias-documento')) {
                const sugContainer = document.createElement('div');
                sugContainer.id = 'sugerencias-documento';
                sugContainer.className = 'absolute z-50 w-full bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto hidden';
                documentoInput.parentElement.style.position = 'relative';
                documentoInput.parentElement.appendChild(sugContainer);
            }
            
            documentoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarPorDocumento();
                }
            });
            
            // Búsqueda en tiempo real mientras escribe
            let debounceTimer;
            documentoInput.addEventListener('input', (e) => {
                if (window.Sanitizer) {
                    const sanitized = window.Sanitizer.sanitizeDNI(e.target.value);
                    if (e.target.value !== sanitized) {
                        e.target.value = sanitized;
                    }
                }
                if (window.Validators) {
                    window.Validators.removeError(e.target);
                }
                
                // Búsqueda con debounce
                clearTimeout(debounceTimer);
                const valor = e.target.value.trim();
                if (valor.length >= 3) {
                    debounceTimer = setTimeout(() => {
                        buscarEnTiempoReal('dni', valor, 'sugerencias-documento');
                    }, 500);
                } else {
                    ocultarSugerencias('sugerencias-documento');
                }
            });
        }
        
        if (emailInput) {
            // Crear contenedor de sugerencias si no existe
            if (!document.getElementById('sugerencias-email')) {
                const sugContainer = document.createElement('div');
                sugContainer.id = 'sugerencias-email';
                sugContainer.className = 'absolute z-50 w-full bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto hidden';
                emailInput.parentElement.style.position = 'relative';
                emailInput.parentElement.appendChild(sugContainer);
            }
            
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarPorEmail();
                }
            });
            
            emailInput.addEventListener('blur', (e) => {
                if (window.Sanitizer) {
                    const sanitized = window.Sanitizer.sanitizeEmail(e.target.value);
                    if (e.target.value !== sanitized) {
                        e.target.value = sanitized;
                    }
                }
            });
            
            // Búsqueda en tiempo real mientras escribe
            let debounceTimer;
            emailInput.addEventListener('input', (e) => {
                if (window.Validators) {
                    window.Validators.removeError(e.target);
                }
                
                // Búsqueda con debounce
                clearTimeout(debounceTimer);
                const valor = e.target.value.trim();
                if (valor.length >= 3) {
                    debounceTimer = setTimeout(() => {
                        buscarEnTiempoReal('email', valor, 'sugerencias-email');
                    }, 500);
                } else {
                    ocultarSugerencias('sugerencias-email');
                }
            });
        }

        // Crear nuevo cliente
        document.getElementById('btn-crear-nuevo')?.addEventListener('click', () => {
            currentStep = 2;
            updateProgress();
            cargarFormularioRegistro();
        });

        // Botón alternativo para crear nuevo cliente (con buscador)
        document.getElementById('btn-crear-nuevo-alt')?.addEventListener('click', () => {
            currentStep = 2;
            updateProgress();
            cargarFormularioRegistro();
        });
    }

    /**
     * Busca cliente por documento
     * NOTA: El backend no tiene endpoint de búsqueda de clientes implementado.
     * Por ahora solo muestra mensaje para crear nuevo cliente.
     */
    async function buscarPorDocumento() {
        const input = document.getElementById('buscar-documento');
        const raw = input?.value || '';
        
        // Validar campo vacío
        if (!raw.trim()) {
            if (window.Validators) {
                window.Validators.showError(input, 'Por favor, ingresa un número de documento');
            }
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    message: 'Por favor, ingresa un número de documento'
                });
            }
            return;
        }
        
        // Sanitizar documento
        const documento = window.Sanitizer ? window.Sanitizer.sanitizeDNI(raw) : raw.trim();
        
        // Validar formato de DNI
        if (window.Validators) {
            const validation = window.Validators.validateDNI(documento);
            if (!validation.valid) {
                window.Validators.showError(input, validation.message);
                if (window.ErrorModal) {
                    window.ErrorModal.show({
                        message: validation.message
                    });
                }
                return;
            }
            window.Validators.removeError(input);
        }

        // Buscar cliente en el backend
        await buscarClienteEnBackend({ dni: documento });
    }

    /**
     * Busca cliente por email
     * NOTA: El backend no tiene endpoint de búsqueda de clientes implementado.
     * Por ahora solo muestra mensaje para crear nuevo cliente.
     */
    async function buscarPorEmail() {
        const input = document.getElementById('buscar-email');
        const raw = input?.value || '';
        
        // Validar campo vacío
        if (!raw.trim()) {
            if (window.Validators) {
                window.Validators.showError(input, 'Por favor, ingresa un email');
            }
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    message: 'Por favor, ingresa un email'
                });
            }
            return;
        }
        
        // Sanitizar email
        const email = window.Sanitizer ? window.Sanitizer.sanitizeEmail(raw) : raw.trim();
        
        // Validar formato de email
        if (window.Validators) {
            const validation = window.Validators.validateEmail(email);
            if (!validation.valid) {
                window.Validators.showError(input, validation.message);
                if (window.ErrorModal) {
                    window.ErrorModal.show({
                        message: validation.message
                    });
                }
                return;
            }
            window.Validators.removeError(input);
        }

        // Buscar cliente en el backend
        await buscarClienteEnBackend({ email: email });
    }

    /**
     * Búsqueda en tiempo real mientras el usuario escribe
     */
    async function buscarEnTiempoReal(tipo, valor, containerId) {
        try {
            const params = new URLSearchParams();
            
            // Determinar tipo de búsqueda
            if (tipo === 'dni') {
                params.append('dni', valor);
            } else if (tipo === 'email') {
                params.append('email', valor);
            } else if (tipo === 'apellido') {
                params.append('apellido', valor);
            } else if (tipo === 'nombre') {
                params.append('nombre', valor);
            }

            const token = window.AuthToken?.getToken?.() || null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const url = getUrl('usuariobuscar') + '?' + params.toString();
            
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                const usuarios = result.data?.data || [];
                
                if (usuarios.length > 0) {
                    mostrarSugerencias(usuarios, containerId);
                } else {
                    ocultarSugerencias(containerId);
                }
            } else {
                ocultarSugerencias(containerId);
            }
        } catch (error) {
            console.error('[AtencionNuevasConexiones] Error en búsqueda tiempo real:', error);
            ocultarSugerencias(containerId);
        }
    }

    /**
     * Muestra las sugerencias de búsqueda (máximo 5 resultados)
     */
    function mostrarSugerencias(usuarios, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Limitar a 5 resultados
        const usuariosLimitados = usuarios.slice(0, 5);

        const escape = window.Sanitizer?.escapeHTML || (str => String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));

        container.innerHTML = usuariosLimitados.map(usuario => `
            <div class="sugerencia-item p-4 hover:bg-principal-50 dark:hover:bg-dark-bg-hover cursor-pointer border-b border-gray-200 dark:border-dark-border-primary last:border-b-0 transition-all duration-200 hover:pl-6" data-usuario='${JSON.stringify(usuario)}'>
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-principal-400 to-principal-600 dark:from-dark-principal-500 dark:to-dark-principal-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <i class="fas fa-user text-white text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-gray-900 dark:text-dark-text-primary truncate text-base">${escape(usuario.nombre)} ${escape(usuario.apellido)}</p>
                        <p class="text-sm text-principal-700 dark:text-dark-principal-400 font-medium mt-0.5">DNI: ${escape(usuario.dni)}</p>
                        <p class="text-xs text-gray-500 dark:text-dark-text-tertiary truncate mt-0.5">${escape(usuario.email)}</p>
                    </div>
                    <div class="flex-shrink-0">
                        <i class="fas fa-chevron-right text-principal-400 dark:text-dark-principal-500"></i>
                    </div>
                </div>
            </div>
        `).join('');

        // Agregar event listeners a cada sugerencia
        container.querySelectorAll('.sugerencia-item').forEach(item => {
            item.addEventListener('click', () => {
                const usuarioData = JSON.parse(item.getAttribute('data-usuario'));
                seleccionarUsuario(usuarioData);
                ocultarSugerencias(containerId);
            });
        });

        container.classList.remove('hidden');
    }

    /**
     * Oculta las sugerencias
     */
    function ocultarSugerencias(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
            container.innerHTML = '';
        }
    }

    /**
     * Cuando se selecciona un usuario de las sugerencias
     */
    function seleccionarUsuario(usuario) {
        console.log('═══════════════════════════════════════════════════════');
        console.log('👤 USUARIO SELECCIONADO DESDE BÚSQUEDA');
        console.log('═══════════════════════════════════════════════════════');
        console.log('Usuario completo:', JSON.stringify(usuario, null, 2));
        console.log('id_persona:', usuario.id_persona);
        console.log('═══════════════════════════════════════════════════════');

        // CRÍTICO: Guardar el usuario completo en clienteNuevo con id_persona
        clienteNuevo = {
            persona: {
                id_persona: usuario.id_persona, // CRÍTICO: Capturar id_persona del backend
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                dni: usuario.dni,
                cuil: usuario.cuil,
                fecha_nacimiento: usuario.fecha_nacimiento,
                sexo: usuario.sexo,
                telefono: usuario.telefono,
                telefono_alternativo: usuario.telefono_alternativo
            },
            direccion: usuario.direccion ? {
                id_direccion: usuario.direccion.id_direccion || null,
                calle: usuario.direccion.calle,
                numero: usuario.direccion.numero,
                piso: usuario.direccion.piso,
                depto: usuario.direccion.depto,
                codigo_postal: usuario.direccion.codigo_postal,
                provincia: usuario.direccion.provincia,
                municipio: usuario.direccion.departamento,
                distrito: usuario.direccion.distrito
            } : null
        };

        console.log('✅ clienteNuevo configurado:', JSON.stringify(clienteNuevo, null, 2));
        console.log('✅ id_persona guardado:', clienteNuevo.persona.id_persona);

        // Redirigir DIRECTAMENTE al formulario de contratación (paso 3)
        // Saltar el paso de registro ya que el usuario ya existe
        currentStep = 3;
        updateProgress();
        showStep(3);
        cargarFormularioContratacion();
    }

    /**
     * Busca cliente en el backend
     */
    async function buscarClienteEnBackend(criterio) {
        showLoading('Buscando cliente...');

        try {
            // Construir query params
            const params = new URLSearchParams();
            if (criterio.dni) params.append('dni', criterio.dni);
            if (criterio.email) params.append('email', criterio.email);

            const token = window.AuthToken?.getToken?.() || null;
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = getUrl('usuariobuscar') + '?' + params.toString();
            console.log('[AtencionNuevasConexiones] Buscando usuario:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            hideLoading();

            if (response.ok) {
                const data = await response.json();
                console.log('[AtencionNuevasConexiones] Usuario encontrado:', data);
                
                // El backend devuelve array en data.data
                const usuarios = data.data?.data || [];
                
                if (usuarios.length === 1) {
                    // Un solo resultado, seleccionar automáticamente y redirigir a contratación
                    console.log('[AtencionNuevasConexiones] Un usuario encontrado, redirigiendo a contratación');
                    seleccionarUsuario(usuarios[0]);
                } else if (usuarios.length > 1) {
                    // Múltiples resultados, mostrar los primeros 5 para que elija
                    console.log('[AtencionNuevasConexiones] Múltiples usuarios encontrados:', usuarios.length);
                    const containerId = criterio.dni ? 'sugerencias-documento' : 'sugerencias-email';
                    mostrarSugerencias(usuarios, containerId);
                } else {
                    const criterioTexto = criterio.dni ? `documento ${criterio.dni}` : `email ${criterio.email}`;
                    mostrarClienteNoEncontrado(criterio.dni ? 'documento' : 'email', criterioTexto);
                }
            } else if (response.status === 404) {
                const criterioTexto = criterio.dni || criterio.email;
                mostrarClienteNoEncontrado(criterio.dni ? 'documento' : 'email', criterioTexto);
            } else {
                const errorText = await response.text();
                console.error('[AtencionNuevasConexiones] Error:', errorText);
                if (window.ErrorHandler) {
                    const newResponse = new Response(errorText, { status: response.status, statusText: response.statusText });
                    await window.ErrorHandler.handleHTTPError(newResponse, 'usuariobuscar', true);
                } else {
                    mostrarError('Error al buscar el cliente');
                }
            }
        } catch (error) {
            console.error('[AtencionNuevasConexiones] Error en búsqueda:', error);
            hideLoading();
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'Error al buscar cliente');
            } else {
                mostrarError('Error al buscar el cliente. Por favor, intenta nuevamente.');
            }
        }
    }

    /**
     * Muestra información de cliente encontrado
     * NOTA: Esta función ya no se usa con el flujo de búsqueda en tiempo real
     * El usuario se selecciona directamente desde las sugerencias
     */
    function mostrarClienteEncontrado(cliente) {
        console.log('[AtencionNuevasConexiones] mostrarClienteEncontrado (método legacy):', cliente);
        
        // Ya no mostramos tarjeta de confirmación, redirigimos directamente
        // Esta función se mantiene por compatibilidad pero el flujo normal es:
        // búsqueda → selección → redirección directa a contratación
        
        clienteData = cliente;
        
        const resultadoDiv = document.getElementById('resultado-busqueda');
        resultadoDiv.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div class="flex items-start gap-2 sm:gap-3">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-green-900 mb-2 text-sm sm:text-base">Cliente Encontrado</h4>
                        <div class="text-xs sm:text-sm text-green-800 space-y-1">
                            <p class="break-words"><strong>Nombre:</strong> ${cliente.nombre} ${cliente.apellido || ''}</p>
                            <p class="break-all"><strong>Email:</strong> ${cliente.email}</p>
                            <p><strong>Documento:</strong> ${cliente.documento || cliente.dni}</p>
                            <p><strong>Teléfono:</strong> ${cliente.telefono || 'No registrado'}</p>
                        </div>
                        <button id="btn-continuar-cliente" class="mt-3 sm:mt-4 w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                            Continuar con este Cliente
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        resultadoDiv.classList.remove('hidden');
        
        document.getElementById('btn-continuar-cliente')?.addEventListener('click', () => {
            // Guardar datos en clienteNuevo antes de continuar
            clienteNuevo = {
                persona: {
                    id_persona: cliente.id_persona,
                    email: cliente.email,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido,
                    dni: cliente.dni || cliente.documento,
                    cuil: cliente.cuil,
                    fecha_nacimiento: cliente.fecha_nacimiento,
                    sexo: cliente.sexo,
                    telefono: cliente.telefono,
                    telefono_alternativo: cliente.telefono_alternativo
                },
                direccion: cliente.direccion
            };
            
            currentStep = 3;
            updateProgress();
            showStep(3);
            cargarFormularioContratacion();
        });
    }

    /**
     * Muestra mensaje de cliente no encontrado
     */
    function mostrarClienteNoEncontrado(tipo, valor) {
        const resultadoDiv = document.getElementById('resultado-busqueda');
        resultadoDiv.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div class="flex items-start gap-2 sm:gap-3">
                    <svg class="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">Cliente No Encontrado</h4>
                        <p class="text-xs sm:text-sm text-yellow-800 break-words">No se encontró ningún cliente con ${tipo === 'documento' ? 'el documento' : 'el email'}: <strong>${valor}</strong></p>
                        <p class="text-xs sm:text-sm text-yellow-800 mt-2">Puedes crear una nueva cuenta haciendo clic en "Cliente Nuevo".</p>
                    </div>
                </div>
            </div>
        `;
        resultadoDiv.classList.remove('hidden');
    }

    /**
     * Variables para el gestor de formularios
     */
    let registerFormData = {};
    let contractFormData = {};
    let registerStepManager = null;
    let contractStepManager = null;
    let clienteNuevo = null;

    /**
     * Carga el formulario de registro (orden: datos personales primero)
     */
    function cargarFormularioRegistro() {
        showStep(2);
        
        const container = document.getElementById('registro-container');
        container.innerHTML = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p class="text-xs sm:text-sm text-blue-800">
                    <i class="fas fa-user-plus mr-2"></i>
                    <strong>Paso 1 de 2:</strong> Completa los datos personales del cliente. La contraseña será generada aleatoriamente y enviada al email proporcionado.
                </p>
            </div>
            
            <!-- Barra de progreso del sub-formulario -->
            <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700">Datos del Cliente</span>
                    <span class="text-sm text-gray-500" id="sub-progress-text">Paso 1 de 4</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div id="sub-progress-bar" class="bg-principal-500 h-2 rounded-full transition-all duration-300 w-0"></div>
                </div>
            </div>

            <!-- Navegación de pasos -->
            <nav id="registro-nav" class="mb-6">
                <ul id="step-navigation-list" class="flex flex-wrap gap-2"></ul>
            </nav>

            <!-- Contenedor del formulario -->
            <div id="registro-content" class="space-y-6"></div>
        `;

        cargarScriptsRegistro();
    }

    /**
     * Carga todos los scripts necesarios para el módulo de atención
     */
    function cargarScriptsNecesarios() {
        // Lista completa de scripts necesarios
        const scriptsNecesarios = [
            // Buscador Reutilizable
            { 
                nombre: 'BuscadorUsuario', 
                url: '/js/utils/buscador-usuario.js',
                check: () => window.BuscadorUsuario
            },
            // Utilidades
            { 
                nombre: 'Sanitizer', 
                url: '/js/utils/sanitizer.js',
                check: () => window.Sanitizer
            },
            { 
                nombre: 'Validators', 
                url: '/js/utils/validators.js',
                check: () => window.Validators
            },
            { 
                nombre: 'ErrorHandler', 
                url: '/js/utils/manejador-errores.js',
                check: () => window.ErrorHandler
            },
            // UI Components
            { 
                nombre: 'ErrorModal', 
                url: '/js/ui/modal-error.js',
                check: () => window.ErrorModal
            },
            { 
                nombre: 'SuccessModal', 
                url: '/js/ui/modal-exito.js',
                check: () => window.SuccessModal
            },
            { 
                nombre: 'LoadingSpinner', 
                url: '/js/ui/spinner-carga.js',
                check: () => window.LoadingSpinner
            },
            // Componentes específicos
            { 
                nombre: 'DocumentCalculator', 
                url: '/js/utils/calculadora-documento.js',
                check: () => window.DocumentCalculator
            },
            { 
                nombre: 'PhoneInput', 
                url: '/js/utils/entrada-telefono.js',
                check: () => window.PhoneInput
            },
            { 
                nombre: 'PasswordGenerator', 
                url: '/js/utils/generador-contrasena.js',
                check: () => window.PasswordGenerator
            },
            { 
                nombre: 'CustomSelect', 
                url: '/js/utils/selector-personalizado.js',
                check: () => window.CustomSelect
            }
        ];
        
        return new Promise((resolve, reject) => {
            // Función para cargar un script
            const cargarScript = (scriptInfo) => {
                return new Promise((resolveScript, rejectScript) => {
                    if (scriptInfo.check()) {
                        console.log(`✅ ${scriptInfo.nombre} ya disponible`);
                        resolveScript();
                        return;
                    }
                    
                    console.log(`📦 Cargando ${scriptInfo.nombre}...`);
                    const script = document.createElement('script');
                    script.src = scriptInfo.url;
                    script.onload = () => {
                        console.log(`✅ ${scriptInfo.nombre} cargado`);
                        resolveScript();
                    };
                    script.onerror = () => {
                        console.error(`❌ Error al cargar ${scriptInfo.nombre}`);
                        rejectScript(new Error(`No se pudo cargar ${scriptInfo.nombre}`));
                    };
                    document.head.appendChild(script);
                });
            };
            
            // Cargar todos los scripts necesarios en secuencia
            Promise.all(scriptsNecesarios.map(cargarScript))
                .then(() => {
                    console.log('✅ Todos los scripts cargados correctamente');
                    resolve();
                })
                .catch(error => {
                    console.error('❌ Error al cargar scripts:', error);
                    reject(error);
                });
        });
    }

    /**
     * Carga los scripts del formulario de registro
     */
    function cargarScriptsRegistro() {
        cargarScriptsNecesarios()
            .then(() => {
                console.log('✅ Iniciando módulos de registro');
                cargarModulosRegistro();
            })
            .catch(error => {
                console.error('❌ Error al cargar componentes:', error);
                if (window.ErrorModal) {
                    window.ErrorModal.show({
                        message: 'Error al cargar componentes necesarios. Por favor, recarga la página.'
                    });
                } else {
                    alert('Error al cargar componentes necesarios. Por favor, recarga la página.');
                }
            });
    }
    
    /**
     * Carga los módulos del formulario de registro
     */
    function cargarModulosRegistro() {
        // Cargar módulos usando import dinámico
        Promise.all([
            import('/js/auth/register/registro-paso2.js'),
            import('/js/auth/register/registro-paso3.js'),
            import('/js/auth/register/registro-paso4.js'),
            import('/js/auth/register/registro-paso1.js')
        ]).then(modules => {
            // Asignar a window para compatibilidad
            window.RegisterStep2 = modules[0];
            window.RegisterStep3 = modules[1];
            window.RegisterStep4 = modules[2];
            window.RegisterStep1 = modules[3];
            
            inicializarFormularioRegistroAtencion();
        }).catch(error => {
            console.error('Error al cargar módulos de registro:', error);
            mostrarError('Error al cargar el formulario. Por favor, recarga la página.');
        });
    }

    /**
     * Inicializa el formulario de registro adaptado para atención
     */
    async function inicializarFormularioRegistroAtencion() {
        const registroContent = document.getElementById('registro-content');
        const stepNavigationList = document.getElementById('step-navigation-list');
        const subProgressBar = document.getElementById('sub-progress-bar');
        const subProgressText = document.getElementById('sub-progress-text');

        // Orden personalizado para atención: Email+Datos Personales, Contacto, Domicilio
        // NO incluimos el paso de credenciales, se genera automáticamente
        const steps = [
            { title: 'Email y Datos Personales', module: window.RegisterStep2, isEmailAndPersonal: true },
            { title: 'Contacto', module: window.RegisterStep3 },
            { title: 'Domicilio', module: window.RegisterStep4 }
        ];

        let currentRegisterStep = 0;
        let maxRegisterStepReached = 0;
        
        // Inicializar progress bar
        if (subProgressBar) {
            subProgressBar.style.width = '33.33%';
        }

        const navigate = async (direction) => {
            // Soportar tanto navegación numérica (1, -1) como texto ('next', 'back')
            const isNext = (direction === 'next' || direction === 1);
            const isBack = (direction === 'back' || direction === -1);
            
            if (isNext) {
                if (currentRegisterStep < steps.length - 1) {
                    currentRegisterStep++;
                    maxRegisterStepReached = Math.max(maxRegisterStepReached, currentRegisterStep);
                    loadRegisterStep(currentRegisterStep);
                } else {
                    // Último paso completado (domicilio), registrar usuario y continuar
                    await registrarUsuarioYContinuar();
                }
            } else if (isBack) {
                if (currentRegisterStep > 0) {
                    currentRegisterStep--;
                    loadRegisterStep(currentRegisterStep);
                } else {
                    // Volver a búsqueda
                    currentStep = 1;
                    updateProgress();
                    showStep(1);
                }
            }
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

        const loadRegisterStep = (stepIndex) => {
            const step = steps[stepIndex];
            if (!step || !step.module) return;

            // Actualizar contenido
            registroContent.innerHTML = step.module.content;
            
            // Si es el primer paso (Email y Datos Personales), agregar campo de email
            if (step.isEmailAndPersonal) {
                // Insertar campo de email al inicio del formulario
                const form = registroContent.querySelector('form');
                if (form) {
                    const emailField = `
                        <div class="mb-4">
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input type="email" id="email" name="email" required
                                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 sm:text-sm"
                                placeholder="correo@ejemplo.com"
                                value="${registerFormData.email || ''}">
                            <p class="text-xs text-gray-500 mt-1">El email será usado para notificaciones y acceso al sistema</p>
                        </div>
                    `;
                    form.insertAdjacentHTML('afterbegin', emailField);
                    
                    // Agregar validación de email existente usando módulo centralizado
                    setTimeout(async () => {
                        const emailInput = document.getElementById('email');
                        if (emailInput) {
                            // Cargar módulo de validación de email dinámicamente
                            try {
                                const { setupEmailValidation } = await import('/js/utils/verificar-email.js');
                                
                                // Configurar validación sin modal (contexto dashboard)
                                setupEmailValidation(emailInput, {
                                    debounceTime: 800,
                                    showModal: false, // No mostrar modal en dashboard
                                    onResult: (exists) => {
                                        // Actualizar formData cuando cambie el email
                                        registerFormData.email = emailInput.value.trim();
                                    }
                                });
                            } catch (error) {
                                console.error('Error cargando módulo de validación de email:', error);
                            }
                            
                            // Mantener sincronización con formData
                            emailInput.addEventListener('input', () => {
                                registerFormData.email = emailInput.value.trim();
                            });
                        }
                    }, 100);
                }
            }
            
            if (step.module.init) {
                step.module.init(navigate, registerFormData, populateForm);
            }

            // El checkbox de autocompletar funciona normalmente en el formulario de contratación

            // Actualizar progreso
            const progress = ((stepIndex + 1) / steps.length) * 100;
            if (subProgressBar) subProgressBar.style.width = `${progress}%`;
            if (subProgressText) subProgressText.textContent = `Paso ${stepIndex + 1} de ${steps.length}`;

            // Actualizar navegación
            stepNavigationList.innerHTML = steps.map((s, idx) => {
                let classes = 'px-4 py-2 rounded-lg text-sm transition-colors';
                if (idx === stepIndex) {
                    classes += ' nav-item-actual';
                } else if (idx <= maxRegisterStepReached) {
                    classes += ' nav-item-done cursor-pointer';
                } else {
                    classes += ' nav-item cursor-not-allowed opacity-50';
                }
                
                return `<li><button type="button" class="${classes}" ${idx <= maxRegisterStepReached ? '' : 'disabled'} data-step="${idx}">${s.title}</button></li>`;
            }).join('');

            // Listeners de navegación
            stepNavigationList.querySelectorAll('button[data-step]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetStep = parseInt(btn.dataset.step);
                    if (targetStep <= maxRegisterStepReached) {
                        currentRegisterStep = targetStep;
                        loadRegisterStep(currentRegisterStep);
                    }
                });
            });
        };

        // Cargar primer paso
        loadRegisterStep(0);
    }

    /**
     * Registra el usuario en el sistema y continúa con contratación
     */
    async function registrarUsuarioYContinuar() {
        try {
            // DEBUG COMPLETO: Verificar todo registerFormData
            console.log('📋 RegisterFormData completo:', registerFormData);
            console.log('📋 DNI específico:', registerFormData.dni);

            // Validar campos requeridos
            if (!registerFormData.email || !registerFormData.dni || !registerFormData.nombre) {
                const mensajeError = `Faltan datos obligatorios:\n` +
                    `- Email: ${registerFormData.email || 'FALTA'}\n` +
                    `- DNI: ${registerFormData.dni || 'FALTA'}\n` +
                    `- Nombre: ${registerFormData.nombre || 'FALTA'}`;
                console.error('❌ Validación fallida:', mensajeError);
                if (window.ErrorModal) {
                    window.ErrorModal.show(mensajeError, 'Error de Validación');
                }
                return;
            }

            // Mostrar loading
            if (window.LoadingSpinner) {
                window.LoadingSpinner.show('Creando usuario...');
            }

            // Sanitizar el DNI antes de usarlo (CRÍTICO: esto será la contraseña)
            const dniSanitizado = window.Sanitizer ? window.Sanitizer.sanitizeDNI(registerFormData.dni) : registerFormData.dni;
            
            // VALIDACIÓN CRÍTICA: Verificar que el DNI no esté vacío ANTES de construir el payload
            if (!dniSanitizado || dniSanitizado.trim() === '') {
                console.error('❌ ERROR CRÍTICO: DNI está vacío, no se puede generar contraseña');
                if (window.LoadingSpinner) window.LoadingSpinner.hide();
                if (window.ErrorModal) {
                    window.ErrorModal.show('El DNI es obligatorio para generar la contraseña.', 'Error Crítico');
                }
                return;
            }

            // Helper para sanitizar y convertir a mayúsculas (requerido por backend)
            const cleanUpper = (val, type = 'string') => {
                if (!val) return '';
                let sanitized = val;
                if (window.Sanitizer) {
                    if (type === 'address' && window.Sanitizer.sanitizeAddress) sanitized = window.Sanitizer.sanitizeAddress(val);
                    else if (type === 'email' && window.Sanitizer.sanitizeEmail) return window.Sanitizer.sanitizeEmail(val);
                    else if (window.Sanitizer.sanitizeString) sanitized = window.Sanitizer.sanitizeString(val);
                }
                return String(sanitized).toUpperCase();
            };

            // Armar payload con la estructura IDÉNTICA al registro normal
            const payload = {
                persona: {
                    nombre: cleanUpper(registerFormData.nombre),
                    apellido: cleanUpper(registerFormData.apellido),
                    email: window.Sanitizer ? window.Sanitizer.sanitizeEmail(registerFormData.email) : registerFormData.email.toLowerCase(),
                    dni: dniSanitizado,
                    fecha_nacimiento: registerFormData.fecha_nacimiento,
                    sexo: registerFormData.sexo,
                    telefono: window.Sanitizer ? window.Sanitizer.sanitizePhone(registerFormData.telefono) : registerFormData.telefono
                },
                direccion: {
                    calle: cleanUpper(registerFormData.calle, 'address'),
                    numero: cleanUpper(registerFormData.numero || ''),
                    codigo_postal: window.Sanitizer ? window.Sanitizer.sanitizePostalCode(registerFormData.codigo_postal) : registerFormData.codigo_postal,
                    id_distrito: Number(registerFormData.distrito_id)
                },
                password: dniSanitizado // PASSWORD EXPLÍCITO
            };

            // Agregar campos opcionales
            if (registerFormData.cuil && registerFormData.cuil.trim() !== '') {
                payload.persona.cuil = window.Sanitizer ? window.Sanitizer.sanitizeCUIT(registerFormData.cuil) : registerFormData.cuil;
            }
            if (registerFormData['alt-telefono'] && registerFormData['alt-telefono'].trim() !== '') {
                payload.persona.telefono_alternativo = window.Sanitizer ? window.Sanitizer.sanitizePhone(registerFormData['alt-telefono']) : registerFormData['alt-telefono'];
            }
            if (registerFormData.piso && registerFormData.piso.trim() !== '') {
                payload.direccion.piso = cleanUpper(registerFormData.piso);
            }
            if (registerFormData.depto && registerFormData.depto.trim() !== '') {
                payload.direccion.depto = cleanUpper(registerFormData.depto);
            }

            // VERIFICACIÓN FINAL CRÍTICA - DEBUGGING
            console.log('═══════════════════════════════════════════════════════');
            console.log('📤 PAYLOAD COMPLETO:', payload);
            console.log('🔑 PASSWORD:', payload.password);
            console.log('🔑 PASSWORD TIPO:', typeof payload.password);
            console.log('🔑 PASSWORD VACÍO?:', !payload.password || payload.password === '');
            console.log('🔍 CLAVES ROOT DEL PAYLOAD:', Object.keys(payload));
            console.log('📋 DNI SANITIZADO:', dniSanitizado);
            console.log('📋 DNI ORIGINAL:', registerFormData.dni);
            
            const payloadString = JSON.stringify(payload);
            console.log('📦 JSON STRINGIFICADO COMPLETO:');
            console.log(payloadString);
            console.log('═══════════════════════════════════════════════════════');

            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // IMPORTANTE: Usar endpoint /api/usuarios (protegido) para contexto de atención
            // Este endpoint requiere autenticación y es diferente del registro público (/registro)
            const endpointUrl = getUrl('usuarios'); // /api/usuarios
            
            // LOGS DE DEBUGGING DETALLADOS
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 CREACIÓN DE USUARIO DESDE PANEL DE ATENCIÓN');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📡 Endpoint key usado: usuarios');
            console.log('📡 URL completa:', endpointUrl);
            console.log('📡 API_BASE_URL:', API_BASE_URL);
            console.log('🔑 Token disponible:', token ? `Sí (${token.substring(0, 20)}...)` : '❌ NO - CRÍTICO: Se requiere token');
            console.log('🔑 window.AuthToken existe:', typeof window.AuthToken !== 'undefined');
            console.log('🔑 window.AuthToken.getToken existe:', typeof window.AuthToken?.getToken === 'function');
            console.log('📋 Headers completos:', JSON.stringify(headers, null, 2));
            console.log('📤 Payload (primeros 500 chars):', payloadString.substring(0, 500));
            console.log('═══════════════════════════════════════════════════════');
            
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: headers,
                body: payloadString,
                credentials: 'include'
            });
            
            console.log('📨 Response status:', response.status, response.statusText);
            console.log('📨 Response URL real:', response.url);

            if (window.LoadingSpinner) {
                window.LoadingSpinner.hide();
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error del backend:', errorText);
                
                if (window.ErrorHandler) {
                    const newResponse = new Response(errorText, { status: response.status, statusText: response.statusText });
                    await window.ErrorHandler.handleHTTPError(newResponse, 'usuarios', true);
                } else {
                    if (window.ErrorModal) window.ErrorModal.show('Error al crear el usuario', 'Error');
                }
                return;
            }

            const data = await response.json();
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ RESPUESTA DEL BACKEND - REGISTRO EXITOSO');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Response completo:', JSON.stringify(data, null, 2));
            console.log('═══════════════════════════════════════════════════════');

            // Capturar id_persona de la respuesta
            const idPersona = data.data?.id_persona || data.id_persona;
            
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔑 CAPTURANDO DATOS DE LA RESPUESTA DEL BACKEND');
            console.log('═══════════════════════════════════════════════════════');
            console.log('data.data?.id_persona:', data.data?.id_persona);
            console.log('data.id_persona:', data.id_persona);
            console.log('data.data?.id_direccion:', data.data?.id_direccion);
            console.log('data.id_direccion:', data.id_direccion);
            console.log('ID Persona capturado:', idPersona);
            console.log('Tipo:', typeof idPersona);
            
            if (idPersona) {
                // Guardar en clienteNuevo para usar en la solicitud de conexión
                if (!clienteNuevo) clienteNuevo = {};
                if (!clienteNuevo.persona) clienteNuevo.persona = {};
                clienteNuevo.persona.id_persona = idPersona;
                
                console.log('✅ id_persona guardado en clienteNuevo.persona.id_persona:', clienteNuevo.persona.id_persona);
                
                // IMPORTANTE: Capturar id_direccion si el backend lo devuelve
                const idDireccion = data.data?.id_direccion || data.id_direccion;
                if (idDireccion) {
                    if (!clienteNuevo.direccion) clienteNuevo.direccion = {};
                    clienteNuevo.direccion.id_direccion = idDireccion;
                    console.log('✅ id_direccion capturado del backend:', idDireccion);
                } else {
                    console.log('ℹ️  Backend no devolvió id_direccion (se creará dirección nueva)');
                }
                
                console.log('✅ clienteNuevo completo:', JSON.stringify(clienteNuevo, null, 2));
            } else {
                console.error('❌ CRÍTICO: No se pudo capturar id_persona de la respuesta');
                console.error('❌ Estructura de data recibida:', Object.keys(data));
                if (data.data) console.error('❌ Estructura de data.data:', Object.keys(data.data));
            }
            console.log('═══════════════════════════════════════════════════════');

            // Mostrar éxito
            if (window.SuccessModal) {
                window.SuccessModal.show(
                    'Usuario Creado Exitosamente',
                    `El usuario ha sido creado correctamente.<br><br>
                    <strong>Credenciales de acceso:</strong><br>
                    Email: <strong>${payload.persona.email}</strong><br>
                    Contraseña: <strong>${payload.password}</strong>`
                );
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            finalizarRegistroYContinuar();

        } catch (error) {
            console.error('Error al registrar usuario:', error);
            if (window.LoadingSpinner) window.LoadingSpinner.hide();
            if (window.ErrorHandler) {
                await window.ErrorHandler.handleHTTPError(error, 'register', true);
            } else if (window.ErrorModal) {
                window.ErrorModal.show(error.message, 'Error');
            }
        }
    }

    /**
     * Finaliza el registro y continúa con contratación
     */
    function finalizarRegistroYContinuar() {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🚀 FINALIZANDO REGISTRO Y CONTINUANDO A CONTRATACIÓN');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 registerFormData:', registerFormData);
        
        // CRÍTICO: Preservar id_persona y id_direccion si existen
        const existingIdPersona = clienteNuevo?.persona?.id_persona;
        const existingIdDireccion = clienteNuevo?.direccion?.id_direccion;
        
        console.log('🔑 Preservando datos existentes:');
        console.log('  - id_persona:', existingIdPersona);
        console.log('  - id_direccion:', existingIdDireccion);
        console.log('🔑 clienteNuevo actual ANTES de reconstruir:', JSON.stringify(clienteNuevo, null, 2));
        console.log('📋 registerFormData completo:', JSON.stringify(registerFormData, null, 2));
        
        // VALIDACIÓN CRÍTICA: Verificar que tenemos id_persona
        if (!existingIdPersona) {
            console.error('❌ CRÍTICO: No hay id_persona para preservar');
            console.error('❌ Esto indica que el registro no se completó correctamente');
            console.error('❌ clienteNuevo:', clienteNuevo);
        }
        
        // Reconstruir clienteNuevo preservando SIEMPRE el id_persona y id_direccion
        clienteNuevo = {
            persona: {
                id_persona: existingIdPersona, // CRÍTICO: Preservar id_persona capturado del backend
                email: registerFormData.email,
                nombre: registerFormData.nombre,
                apellido: registerFormData.apellido,
                dni: registerFormData.dni,
                cuil: registerFormData.cuil,
                fecha_nacimiento: registerFormData.fecha_nacimiento,
                sexo: registerFormData.sexo,
                telefono: registerFormData.telefono,
                telefono_alternativo: registerFormData['alt-telefono'] || registerFormData.telefono_alternativo
            },
            direccion: {
                id_direccion: existingIdDireccion, // CRÍTICO: Preservar id_direccion si existe
                calle: registerFormData.calle,
                numero: registerFormData.numero,
                piso: registerFormData.piso,
                depto: registerFormData.depto,
                codigo_postal: registerFormData.codigo_postal,
                provincia: registerFormData.provincia,
                municipio: registerFormData.municipio,
                distrito: registerFormData.distrito,
                id_distrito: registerFormData.distrito_id
            }
        };

        console.log('✅ clienteNuevo reconstruido:', JSON.stringify(clienteNuevo, null, 2));
        console.log('🔑 VERIFICACIÓN CRÍTICA: id_persona preservado:', clienteNuevo.persona.id_persona);
        console.log('🔑 ¿id_persona es válido?:', !!clienteNuevo.persona.id_persona);
        console.log('🔑 Tipo de id_persona:', typeof clienteNuevo.persona.id_persona);
        
        if (!clienteNuevo.persona.id_persona) {
            console.error('❌❌❌ ERROR FATAL: id_persona se perdió durante la reconstrucción');
            console.error('❌ existingIdPersona era:', existingIdPersona);
        }
        
        console.log('═══════════════════════════════════════════════════════');

        // Continuar al paso 3: Contratación
        currentStep = 3;
        updateProgress();
        showStep(3);
        cargarFormularioContratacion();
    }

    /**
     * Carga el formulario de contratación
     */
    function cargarFormularioContratacion() {
        showStep(3);

        // CRÍTICO: Limpiar formulario de registro para evitar conflictos de IDs duplicados
        const registroContainer = document.getElementById('registro-container');
        if (registroContainer) {
            registroContainer.innerHTML = '';
            console.log('🧹 Formulario de registro limpiado para evitar IDs duplicados');
        }

        const container = document.getElementById('contratacion-container');
        container.innerHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p class="text-xs sm:text-sm text-green-800">
                    <i class="fas fa-check-circle mr-2"></i>
                    <strong>Paso 2 de 2:</strong> Configura la conexión de internet para <strong>${clienteNuevo.persona.nombre} ${clienteNuevo.persona.apellido}</strong>
                </p>
            </div>

            <!-- Barra de progreso del sub-formulario -->
            <div class="mb-6" style="position: relative; z-index: 1;">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700">Datos de Conexión</span>
                    <span class="text-sm text-gray-500" id="contract-progress-text">Paso 1 de 5</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div id="contract-progress-bar" class="bg-logo-verde-500 h-2 rounded-full transition-all duration-300 w-0"></div>
                </div>
            </div>

            <!-- Navegación de pasos -->
            <nav id="contract-nav" class="mb-6">
                <ul id="contract-step-navigation-list" class="flex flex-wrap gap-2"></ul>
            </nav>

            <!-- Contenedor del formulario -->
            <div id="contract-content" class="space-y-6"></div>
        `;

        cargarScriptsContrato();
    }

    /**
     * Carga los scripts del formulario de contrato
     */
    function cargarScriptsContrato() {
        // Cargar módulos usando import dinámico
        Promise.all([
            import('/js/forms/contract/contrato_paso1.js'),
            import('/js/forms/contract/contrato_paso2.js'),
            import('/js/forms/contract/contrato_paso3.js'),
            import('/js/forms/contract/contrato_paso4.js'),
            import('/js/forms/contract/contrato_paso5.js')
        ]).then(modules => {
            // Asignar a window para compatibilidad
            window.ContractStep1 = modules[0];
            window.ContractStep2 = modules[1];
            window.ContractStep3 = modules[2];
            window.ContractStep4 = modules[3];
            window.ContractStep5 = modules[4];
            
            inicializarFormularioContratacionAtencion();
        }).catch(error => {
            console.error('Error al cargar módulos de contrato:', error);
            mostrarError('Error al cargar el formulario. Por favor, recarga la página.');
        });
    }

    /**
     * Inicializa el formulario de contratación adaptado para atención
     */
    async function inicializarFormularioContratacionAtencion() {
        console.log('🚀 Inicializando formulario de contratación en contexto atención');
        
        // CRÍTICO: Verificar que CustomSelect esté disponible
        if (!window.CustomSelect) {
            console.error('❌ CustomSelect NO está disponible');
            mostrarError('Error: No se pudo cargar el selector de provincias. Por favor, recarga la página.');
            return;
        }
        
        console.log('✅ CustomSelect está disponible');
        
        const contractContent = document.getElementById('contract-content');
        const contractStepNavigationList = document.getElementById('contract-step-navigation-list');
        const contractProgressBar = document.getElementById('contract-progress-bar');
        const contractProgressText = document.getElementById('contract-progress-text');

        const steps = [
            { title: 'Domicilio de Instalación', module: window.ContractStep1 },
            { title: 'Ubicación (Mapa)', module: window.ContractStep2 },
            { title: 'Seleccionar Plan', module: window.ContractStep3 },
            { title: 'Revisar y Confirmar', module: window.ContractStep4 },
            { title: 'Factibilidad Inmediata', module: window.ContractStep5 }
        ];

        let currentContractStep = 0;
        let maxContractStepReached = 0;
        
        // Inicializar progress bar (ahora 5 pasos)
        if (contractProgressBar) {
            contractProgressBar.style.width = '20%';
        }

        const navigate = (direction) => {
            // Soportar tanto navegación numérica (1, -1) como texto ('next', 'back')
            const isNext = (direction === 'next' || direction === 1);
            const isBack = (direction === 'back' || direction === -1);
            
            if (isNext) {
                if (currentContractStep < steps.length - 1) {
                    currentContractStep++;
                    maxContractStepReached = Math.max(maxContractStepReached, currentContractStep);
                    loadContractStep(currentContractStep);
                } else {
                    // Último paso completado, finalizar
                    finalizarContratacionCompleta();
                }
            } else if (isBack) {
                if (currentContractStep > 0) {
                    currentContractStep--;
                    loadContractStep(currentContractStep);
                } else {
                    // Volver al registro
                    currentStep = 2;
                    updateProgress();
                    cargarFormularioRegistro();
                }
            }
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

        const loadContractStep = async (stepIndex) => {
            const step = steps[stepIndex];
            if (!step || !step.module) return;

            console.log(`📄 Cargando paso ${stepIndex + 1} del contrato`);

            // Actualizar contenido
            contractContent.innerHTML = step.module.content;
            
            // Esperar a que el DOM se renderice y el layout se compute
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Forzar reflow para asegurar que el layout se compute
            if (contractContent) {
                contractContent.offsetHeight; // Trigger reflow
            }
            
            // El checkbox de "usar dirección registrada" ahora está disponible en contexto de atención
            // para autocompletar con la dirección del cliente recién creado
            if (stepIndex === 0) {
                console.log('═══════════════════════════════════════════════════════');
                console.log('✅ PASO 1: Checkbox "usar dirección registrada" disponible');
                console.log('═══════════════════════════════════════════════════════');
                console.log('🔍 Verificando disponibilidad de clienteNuevo:');
                console.log('  - window.AtencionNuevasConexiones:', typeof window.AtencionNuevasConexiones);
                console.log('  - window.AtencionNuevasConexiones.clienteNuevo:', window.AtencionNuevasConexiones?.clienteNuevo);
                console.log('  - clienteNuevo local:', clienteNuevo);
                
                if (clienteNuevo?.direccion) {
                    console.log('✅ Dirección disponible:', JSON.stringify(clienteNuevo.direccion, null, 2));
                } else {
                    console.warn('⚠️ No hay dirección disponible en clienteNuevo');
                }
                console.log('═══════════════════════════════════════════════════════');
            }
            
            // Verificar que los elementos existan antes de inicializar
            if (stepIndex === 0) {
                // CRÍTICO: Buscar en el contenedor de contrato, no en todo el documento
                const sinNumero = contractContent.querySelector('#sin-numero');
                const numeroInput = contractContent.querySelector('#numero');
                const provinciaBtn = contractContent.querySelector('#provincia-btn');
                
                console.log('🔍 Verificando elementos del DOM (en contract-content):');
                console.log('  - sin-numero:', sinNumero ? '✅' : '❌');
                console.log('  - numero:', numeroInput ? '✅' : '❌');
                console.log('  - provincia-btn:', provinciaBtn ? '✅' : '❌');
                console.log('  - CustomSelect disponible:', window.CustomSelect ? '✅' : '❌');
            }
            
            // Inicializar el módulo normalmente
            if (step.module.init) {
                console.log('🎬 Inicializando módulo del paso', stepIndex + 1);
                step.module.init(navigate, contractFormData, populateForm);
                
                // Esperar a que el módulo termine de inicializar completamente
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Forzar otro reflow después de la inicialización
                if (contractContent) {
                    contractContent.offsetHeight;
                }
                
                // DIAGNÓSTICO: Verificar por qué los elementos tienen tamaño 0
                if (stepIndex === 0) {
                    const contractContent = document.getElementById('contract-content');
                    const contractForm = document.getElementById('contract-step1-form');
                    const sinNumero = document.getElementById('sin-numero');
                    const provinciaBtn = document.getElementById('provincia-btn');
                    
                    if (contractContent) {
                        const rect = contractContent.getBoundingClientRect();
                        const style = window.getComputedStyle(contractContent);
                        console.log('📐 CONTRACT-CONTENT (contenedor):');
                        console.log('   - rect:', {left: rect.left, top: rect.top, width: rect.width, height: rect.height});
                        console.log('   - display:', style.display);
                        console.log('   - visibility:', style.visibility);
                        console.log('   - height:', style.height);
                    }
                    
                    if (contractForm) {
                        const rect = contractForm.getBoundingClientRect();
                        const style = window.getComputedStyle(contractForm);
                        console.log('📐 CONTRACT-FORM:');
                        console.log('   - rect:', {left: rect.left, top: rect.top, width: rect.width, height: rect.height});
                        console.log('   - display:', style.display);
                        console.log('   - visibility:', style.visibility);
                    }
                    
                    if (sinNumero) {
                        // Subir por la jerarquía para encontrar el elemento colapsado
                        let current = sinNumero;
                        let level = 0;
                        console.log('🔍 JERARQUÍA DEL CHECKBOX:');
                        while (current && level < 5) {
                            const rect = current.getBoundingClientRect();
                            const style = window.getComputedStyle(current);
                            console.log(`   Nivel ${level} (${current.tagName}#${current.id || 'no-id'}.${current.className}):`, {
                                rect: {width: rect.width, height: rect.height},
                                display: style.display,
                                visibility: style.visibility,
                                position: style.position,
                                overflow: style.overflow
                            });
                            current = current.parentElement;
                            level++;
                        }
                    }
                }
                
                console.log('✅ Módulo inicializado y listo');
            }

            // Actualizar progreso
            const progress = ((stepIndex + 1) / steps.length) * 100;
            if (contractProgressBar) contractProgressBar.style.width = `${progress}%`;
            if (contractProgressText) contractProgressText.textContent = `Paso ${stepIndex + 1} de ${steps.length}`;

            // Actualizar navegación
            contractStepNavigationList.innerHTML = steps.map((s, idx) => {
                let classes = 'px-4 py-2 rounded-lg text-sm transition-colors';
                if (idx === stepIndex) {
                    classes += ' nav-item-actual';
                } else if (idx <= maxContractStepReached) {
                    classes += ' nav-item-done cursor-pointer';
                } else {
                    classes += ' nav-item cursor-not-allowed opacity-50';
                }
                
                return `<li><button type="button" class="${classes}" ${idx <= maxContractStepReached ? '' : 'disabled'} data-step="${idx}">${s.title}</button></li>`;
            }).join('');

            // Listeners de navegación
            contractStepNavigationList.querySelectorAll('button[data-step]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetStep = parseInt(btn.dataset.step);
                    if (targetStep <= maxContractStepReached) {
                        currentContractStep = targetStep;
                        loadContractStep(currentContractStep);
                    }
                });
            });
        };

        // Cargar primer paso
        loadContractStep(0);
    }

    /**
     * Finaliza todo el proceso y envía la solicitud de conexión al backend
     */
    async function finalizarContratacionCompleta() {
        showLoading('Enviando solicitud de conexión...');

        try {
            // Verificar que tenemos el id_persona_cliente
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 VERIFICANDO ID_PERSONA_CLIENTE PARA PAYLOAD FINAL');
            console.log('═══════════════════════════════════════════════════════');
            console.log('clienteNuevo completo:', JSON.stringify(clienteNuevo, null, 2));
            console.log('clienteNuevo?.persona?.id_persona:', clienteNuevo?.persona?.id_persona);
            
            const idPersonaCliente = clienteNuevo?.persona?.id_persona;
            
            console.log('idPersonaCliente capturado:', idPersonaCliente);
            console.log('Tipo:', typeof idPersonaCliente);
            console.log('═══════════════════════════════════════════════════════');
            
            if (!idPersonaCliente) {
                console.error('❌ CRÍTICO: idPersonaCliente es null/undefined');
                console.error('❌ clienteNuevo completo:', JSON.stringify(clienteNuevo, null, 2));
                console.error('❌ clienteNuevo.persona:', JSON.stringify(clienteNuevo?.persona, null, 2));
                console.error('❌ Propiedades de clienteNuevo.persona:', clienteNuevo?.persona ? Object.keys(clienteNuevo.persona) : 'persona es null/undefined');
                console.error('❌ ¿Tiene id_persona?:', 'id_persona' in (clienteNuevo?.persona || {}));
                throw new Error('No se pudo obtener el ID de la persona creada. Por favor, intenta nuevamente.');
            }

            // LOGGING COMPLETO de contractFormData
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 INSPECCIONANDO contractFormData COMPLETO');
            console.log('═══════════════════════════════════════════════════════');
            console.log('contractFormData completo:', JSON.stringify(contractFormData, null, 2));
            console.log('contractFormData._finalPayload:', JSON.stringify(contractFormData._finalPayload, null, 2));
            console.log('Propiedades de contractFormData:', Object.keys(contractFormData));
            console.log('═══════════════════════════════════════════════════════');

            // Obtener datos del formulario de contrato
            const ubicacion = contractFormData._finalPayload?.ubicacion || contractFormData.ubicacion;
            const idPlan = contractFormData._finalPayload?.plan_id || contractFormData.plan_id;
            const idDireccion = contractFormData._finalPayload?.direccion_id || contractFormData.direccion_id;
            
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔧 CONSTRUYENDO PAYLOAD FINAL');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 Extrayendo valores:');
            console.log('  - contractFormData._finalPayload?.ubicacion:', contractFormData._finalPayload?.ubicacion);
            console.log('  - contractFormData.ubicacion:', contractFormData.ubicacion);
            console.log('  → ubicacion final:', ubicacion);
            console.log('');
            console.log('  - contractFormData._finalPayload?.plan_id:', contractFormData._finalPayload?.plan_id);
            console.log('  - contractFormData.plan_id:', contractFormData.plan_id);
            console.log('  → idPlan final:', idPlan);
            console.log('');
            console.log('  - contractFormData._finalPayload?.direccion_id:', contractFormData._finalPayload?.direccion_id);
            console.log('  - contractFormData.direccion_id:', contractFormData.direccion_id);
            console.log('  → idDireccion final:', idDireccion);
            console.log('  → ❌ PROBLEMA: idDireccion es', idDireccion === null ? 'NULL' : idDireccion === undefined ? 'UNDEFINED' : idDireccion);
            console.log('  - idPersonaCliente:', idPersonaCliente, '(tipo:', typeof idPersonaCliente, ')');
            console.log('  - factibilidad_inmediata:', contractFormData.factibilidad_inmediata);
            if (contractFormData.factibilidad_inmediata) {
                console.log('  - nap:', contractFormData.nap);
                console.log('  - vlan:', contractFormData.vlan);
                console.log('  - puerto:', contractFormData.puerto || 'N/A');
                console.log('  - observaciones:', contractFormData.observaciones || 'N/A');
            } else {
                console.log('  - Derivación: Sin datos técnicos');
            }
            console.log('═══════════════════════════════════════════════════════');
            
            // VALIDACIÓN: Verificar que tenemos id_direccion o direccion
            if (!idDireccion && !contractFormData.direccion) {
                console.error('❌ CRÍTICO: No hay id_direccion ni objeto direccion');
                console.error('❌ contractFormData.direccion:', contractFormData.direccion);
                console.error('❌ clienteNuevo.direccion:', clienteNuevo?.direccion);
                throw new Error('No se pudo obtener la dirección de instalación. Por favor, verifica los datos.');
            }
            
            // Construir payload base para solicitud de conexión
            const payload = {
                id_plan: parseInt(idPlan),
                latitud: parseFloat(ubicacion?.lat || ubicacion?.latitud),
                longitud: parseFloat(ubicacion?.lng || ubicacion?.longitud),
                id_persona_cliente: parseInt(idPersonaCliente),
                factibilidad_inmediata: contractFormData.factibilidad_inmediata === true || contractFormData.factibilidad_inmediata === 'true'
            };
            
            // CRÍTICO: Verificar si tenemos id_persona
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 VERIFICACIÓN FINAL DE id_persona ANTES DE ENVIAR');
            console.log('═══════════════════════════════════════════════════════');
            console.log('payload.id_persona_cliente:', payload.id_persona_cliente);
            console.log('clienteNuevo:', JSON.stringify(clienteNuevo, null, 2));
            console.log('═══════════════════════════════════════════════════════');

            // CRÍTICO: Agregar SOLO id_direccion O direccion (nunca ambos)
            if (idDireccion && idDireccion !== null && !isNaN(idDireccion)) {
                // Caso 1: Usar dirección registrada (solo ID)
                payload.id_direccion = parseInt(idDireccion);
                console.log('✅ Usando id_direccion (dirección registrada):', payload.id_direccion);
            } else if (contractFormData.direccion) {
                // Caso 2: Usar dirección nueva (objeto completo)
                payload.direccion = {
                    calle: contractFormData.direccion.calle,
                    numero: contractFormData.direccion.numero,
                    codigo_postal: contractFormData.direccion.codigo_postal,
                    id_distrito: contractFormData.direccion.id_distrito || contractFormData.direccion.distrito_id
                };
                
                // Agregar piso y depto solo si tienen valor
                if (contractFormData.direccion.piso) {
                    payload.direccion.piso = contractFormData.direccion.piso;
                }
                if (contractFormData.direccion.depto) {
                    payload.direccion.depto = contractFormData.direccion.depto;
                }
                
                console.log('✅ Usando direccion (dirección nueva):', JSON.stringify(payload.direccion, null, 2));
            } else {
                // Caso 3: Fallback - usar dirección de clienteNuevo (del registro)
                console.warn('⚠️ No hay direccion en contractFormData, usando clienteNuevo.direccion');
                if (clienteNuevo?.direccion) {
                    payload.direccion = {
                        calle: clienteNuevo.direccion.calle,
                        numero: clienteNuevo.direccion.numero,
                        codigo_postal: clienteNuevo.direccion.codigo_postal,
                        id_distrito: clienteNuevo.direccion.id_distrito
                    };
                    
                    if (clienteNuevo.direccion.piso) {
                        payload.direccion.piso = clienteNuevo.direccion.piso;
                    }
                    if (clienteNuevo.direccion.depto) {
                        payload.direccion.depto = clienteNuevo.direccion.depto;
                    }
                    
                    console.log('✅ Usando direccion de clienteNuevo:', JSON.stringify(payload.direccion, null, 2));
                } else {
                    console.error('❌ CRÍTICO: No se encontró ninguna dirección válida');
                    throw new Error('No se pudo obtener la dirección de instalación');
                }
            }

            // Si factibilidad_inmediata es true, agregar datos técnicos OBLIGATORIOS
            if (payload.factibilidad_inmediata) {
                payload.nap = contractFormData.nap;
                payload.vlan = parseInt(contractFormData.vlan);
                
                // Puerto es opcional
                if (contractFormData.puerto) {
                    payload.puerto = parseInt(contractFormData.puerto);
                }
                
                // Observaciones NO se incluyen en verificación inmediata
            } else {
                // Para derivación (factibilidad_inmediata = false), incluir observaciones si existen
                if (contractFormData.observaciones && contractFormData.observaciones.trim() !== '') {
                    payload.observaciones = contractFormData.observaciones;
                    console.log('✅ Observaciones incluidas en payload (derivación):', payload.observaciones);
                } else {
                    console.log('ℹ️  Sin observaciones en derivación (campo vacío o no completado)');
                }
            }

            // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
            const token = window.AuthToken?.getToken?.() || null;

            // LOGGING: Payload final completo antes de enviar
            console.log('═══════════════════════════════════════════════════════');
            console.log('🚀 ENVIANDO SOLICITUD DE CONEXIÓN AL BACKEND');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📤 Payload completo:', JSON.stringify(payload, null, 2));
            console.log('📡 Endpoint:', getUrl('crearSolicitud'));
            console.log('🔐 Auth Token presente:', token ? 'SÍ (' + token.substring(0, 20) + '...)' : 'NO');
            console.log('🍪 Credentials mode:', 'include (cookies enabled)');
            console.log('═══════════════════════════════════════════════════════');
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Endpoint: /api/cliente-particular/solicitar-conexion (ya configurado en config.js)
            const response = await fetch(getUrl('crearSolicitud'), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('═══════════════════════════════════════════════════════');
                console.error('❌ ERROR EN LA RESPUESTA DEL BACKEND');
                console.error('═══════════════════════════════════════════════════════');
                console.error('Status:', response.status);
                console.error('Status Text:', response.statusText);
                console.error('Response:', errorText);
                console.error('═══════════════════════════════════════════════════════');
                
                if (window.ErrorHandler) {
                    const newResponse = new Response(errorText, { status: response.status, statusText: response.statusText });
                    await window.ErrorHandler.handleHTTPError(newResponse, 'crearSolicitud', true);
                } else {
                    throw new Error(`Error al crear solicitud: ${response.status}`);
                }
                hideLoading();
                return;
            }

            const result = await response.json();
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ SOLICITUD CREADA EXITOSAMENTE');
            console.log('═══════════════════════════════════════════════════════');
            console.log('Response:', JSON.stringify(result, null, 2));
            console.log('═══════════════════════════════════════════════════════');

            // Mostrar éxito
            hideLoading();
            
            // Construir mensaje de éxito
            const nombreCompleto = window.Sanitizer 
                ? window.Sanitizer.escapeHTML(clienteNuevo.persona.nombre + ' ' + clienteNuevo.persona.apellido) 
                : clienteNuevo.persona.nombre + ' ' + clienteNuevo.persona.apellido;
            
            const email = window.Sanitizer 
                ? window.Sanitizer.escapeHTML(clienteNuevo.persona.email) 
                : clienteNuevo.persona.email;
            
            const dni = window.Sanitizer 
                ? window.Sanitizer.escapeHTML(clienteNuevo.persona.dni) 
                : clienteNuevo.persona.dni;
            
            const tipoFactibilidad = payload.factibilidad_inmediata 
                ? '<span class="text-green-700 font-semibold">✓ Verificación Inmediata</span>' 
                : '<span class="text-blue-700 font-semibold">→ Derivación al Equipo Técnico</span>';
            
            let datosTecnicos = '';
            if (payload.factibilidad_inmediata) {
                datosTecnicos = `
                    <div class="mt-2 space-y-1">
                        <p class="text-sm text-gray-700"><strong>NAP:</strong> ${payload.nap}</p>
                        <p class="text-sm text-gray-700"><strong>VLAN:</strong> ${payload.vlan}</p>
                        ${payload.puerto ? `<p class="text-sm text-gray-700"><strong>Puerto:</strong> ${payload.puerto}</p>` : ''}
                    </div>
                `;
            }
            
            const mensajeExito = `
                <div style="text-align: left;">
                    <p class="mb-4">Se ha creado la solicitud de conexión para <strong>${nombreCompleto}</strong>.</p>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p class="text-sm mb-1"><strong>Tipo de Solicitud:</strong></p>
                        <p class="text-sm">${tipoFactibilidad}</p>
                        ${datosTecnicos}
                    </div>
                    
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-bell mr-1"></i>
                        El cliente recibirá notificaciones sobre el estado de su solicitud.
                    </p>
                </div>
            `;
            
            if (window.SuccessModal) {
                // Mostrar modal con contenido HTML
                window.SuccessModal.show(
                    mensajeExito, // El mensaje HTML completo
                    '¡Solicitud Creada Exitosamente!' // El título
                );
                
                // Volver al panel después de 3 segundos
                setTimeout(() => {
                    volverAlPanel();
                }, 3000);
            } else {
                alert('Solicitud creada exitosamente');
                volverAlPanel();
            }

        } catch (error) {
            console.error('═══════════════════════════════════════════════════════');
            console.error('❌ ERROR CRÍTICO EN finalizarContratacionCompleta()');
            console.error('═══════════════════════════════════════════════════════');
            console.error('Error:', error);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            console.error('═══════════════════════════════════════════════════════');
            hideLoading();
            
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'Error al crear solicitud');
            } else if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error al Crear Solicitud',
                    message: error.message || 'No se pudo completar el proceso. Por favor, intenta nuevamente.'
                });
            } else {
                mostrarError(error.message || 'Error al crear solicitud');
            }
        }
    }



    /**
     * Actualiza la barra de progreso
     */
    function updateProgress() {
        const stepDescriptions = {
            1: 'Búsqueda de Cliente',
            2: 'Registro de Cliente',
            3: 'Configurar Conexión'
        };

        document.getElementById('current-step').textContent = currentStep;
        document.getElementById('step-description').textContent = stepDescriptions[currentStep];
        document.getElementById('progress-bar').style.width = `${(currentStep / 3) * 100}%`;
    }

    /**
     * Muestra un paso específico
     */
    function showStep(step) {
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`step-${step}`)?.classList.remove('hidden');
        // If on small screen make sure the visible content scrolls into view
        if (isSmallScreen()) {
            const el = document.getElementById(`step-${step}`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Vuelve al panel principal
     */
    function volverAlPanel() {
        if (window.loadContent && typeof window.loadContent === 'function') {
            window.loadContent('/atencion-panel');
        }
    }

    /**
     * Utilidades de UI
     */
    function showLoading(text = 'Procesando...') {
        if (window.LoadingSpinner) {
            window.LoadingSpinner.show(text);
        } else {
            // Fallback al overlay básico
            const loadingText = document.getElementById('loading-text');
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingText) loadingText.textContent = text;
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');
        }
    }

    function hideLoading() {
        if (window.LoadingSpinner) {
            window.LoadingSpinner.hide();
        } else {
            // Fallback al overlay básico
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        }
    }

    function mostrarError(mensaje) {
        if (window.ErrorModal) {
            window.ErrorModal.show({
                message: mensaje
            });
        } else if (window.ErrorHandler) {
            window.ErrorHandler.showError(mensaje);
        } else {
            alert(mensaje);
        }
    }

    function mostrarExito(mensaje, opciones = {}) {
        if (window.SuccessModal) {
            window.SuccessModal.show({
                message: mensaje,
                ...opciones
            });
        } else {
            alert(mensaje);
        }
    }

    /**
     * Cleanup
     */
    function cleanup() {
        console.log('🧹 Limpiando módulo de Nuevas Conexiones');
    }

    // Exponer funciones públicas y datos
    window.AtencionNuevasConexiones = {
        init,
        cleanup,
        // Exponer clienteNuevo como getter para acceso desde otros módulos
        get clienteNuevo() {
            return clienteNuevo;
        },
        onRegistroCompleto: (data, formData) => {
            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 CALLBACK onRegistroCompleto LLAMADO');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📦 data recibido:', JSON.stringify(data, null, 2));
            console.log('📦 formData recibido:', formData);
            console.log('═══════════════════════════════════════════════════════');
            
            // CRÍTICO: Capturar id_persona del data antes de continuar
            const idPersona = data?.data?.id_persona || data?.id_persona;
            
            console.log('🔑 Intentando capturar id_persona...');
            console.log('🔑 data.data?.id_persona:', data?.data?.id_persona);
            console.log('🔑 data.id_persona:', data?.id_persona);
            console.log('🔑 idPersona capturado:', idPersona);
            
            if (idPersona) {
                // Inicializar clienteNuevo si no existe y guardar id_persona
                if (!clienteNuevo) clienteNuevo = {};
                if (!clienteNuevo.persona) clienteNuevo.persona = {};
                clienteNuevo.persona.id_persona = idPersona;
                
                console.log('✅ id_persona guardado en clienteNuevo:', idPersona);
                
                // IMPORTANTE: Capturar id_direccion si el backend lo devuelve
                const idDireccion = data?.data?.id_direccion || data?.id_direccion;
                if (idDireccion) {
                    if (!clienteNuevo.direccion) clienteNuevo.direccion = {};
                    clienteNuevo.direccion.id_direccion = idDireccion;
                    console.log('✅ id_direccion capturado del callback:', idDireccion);
                }
                
                console.log('✅ clienteNuevo completo:', JSON.stringify(clienteNuevo, null, 2));
            } else {
                console.error('❌ CRÍTICO: No se pudo capturar id_persona del callback');
                console.error('❌ Estructura de data:', Object.keys(data || {}));
                if (data?.data) console.error('❌ Estructura de data.data:', Object.keys(data.data));
            }
            
            // Guardar formData del registro
            if (formData) {
                Object.assign(registerFormData, formData);
                console.log('✅ registerFormData actualizado');
            }
            
            console.log('═══════════════════════════════════════════════════════');
            
            finalizarRegistroYContinuar();
        }
    };

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
