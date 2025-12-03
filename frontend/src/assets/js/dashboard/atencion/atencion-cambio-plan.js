/**
 * Módulo: Cambio de Plan
 * Gestiona el upgrade/downgrade de planes de clientes existentes
 */

(function() {
    'use strict';

    let clienteActual = null;
    let conexionSeleccionada = null;
    let planNuevo = null;
    let planesDisponibles = [];

    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
    });

    /**
     * Carga scripts necesarios para UI y validación
     */
    async function cargarScriptsNecesarios() {
        const scripts = [
            { src: '/js/utils/buscador-usuario.js', global: 'BuscadorUsuario' },
            { src: '/js/utils/sanitizer.js', global: 'Sanitizer' },
            { src: '/js/utils/validators.js', global: 'Validators' },
            { src: '/js/utils/errorHandler.js', global: 'ErrorHandler' },
            { src: '/js/ui/error-modal.js', global: 'ErrorModal' },
            { src: '/js/ui/success-modal.js', global: 'SuccessModal' },
            { src: '/js/ui/spinner-carga.js', global: 'LoadingSpinner' }
        ];

        const promises = scripts.map(({ src, global }) => {
            if (window[global]) {
                return Promise.resolve();
            }
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        });

        try {
            await Promise.all(promises);
            console.log('✅ Scripts UI cargados correctamente');
        } catch (error) {
            console.warn('⚠️ Error cargando scripts UI:', error);
        }
    }

    let buscadorInstance = null;

    async function init() {
        console.log('🎯 Inicializando Módulo de Cambio de Plan...');

        await cargarScriptsNecesarios();
        setupEventListeners();
        inicializarBuscador();

        console.log('✅ Módulo de Cambio de Plan inicializado');
    }

    function inicializarBuscador() {
        if (!window.BuscadorUsuario) return;

        buscadorInstance = new window.BuscadorUsuario({
            containerId: 'buscador-cambio-plan-container',
            theme: 'principal',
            placeholder: 'Buscar cliente por DNI, Email, Nombre o Apellido...',
            autoFocus: true,
            animated: true,
            onSelect: (usuario) => {
                clienteActual = usuario;
                mostrarCliente();
            },
            onClear: () => {
                clienteActual = null;
            }
        });
    }

    function isSmallScreen() {
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    }

    /**
     * Configura event listeners
     */
    function setupEventListeners() {
        // Navegación
        document.getElementById('btn-volver')?.addEventListener('click', volverAlPanel);
        document.getElementById('btn-nueva-busqueda')?.addEventListener('click', nuevaBusqueda);

        // Búsqueda
        document.getElementById('btn-buscar-documento')?.addEventListener('click', buscarPorDocumento);
        document.getElementById('btn-buscar-email')?.addEventListener('click', buscarPorEmail);

        // Enter en búsqueda y sanitización en tiempo real
        const docInput = document.getElementById('buscar-documento');
        if (docInput) {
            docInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarPorDocumento();
                }
            });
            docInput.addEventListener('input', function() {
                if (window.Sanitizer) {
                    const sanitized = window.Sanitizer.sanitizeDNI(this.value);
                    if (sanitized !== this.value) this.value = sanitized;
                }
                if (window.Validators) {
                    window.Validators.removeError(this);
                }
            });
        }

        const emailInput = document.getElementById('buscar-email');
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarPorEmail();
                }
            });
            emailInput.addEventListener('input', function() {
                if (window.Sanitizer) {
                    const sanitized = window.Sanitizer.sanitizeEmail(this.value);
                    if (sanitized !== this.value) this.value = sanitized;
                }
                if (window.Validators) {
                    window.Validators.removeError(this);
                }
            });
        }

        // Cambio de plan
        document.getElementById('btn-cancelar-cambio')?.addEventListener('click', () => {
            document.getElementById('seccion-nuevo-plan')?.classList.add('hidden');
            conexionSeleccionada = null;
            planNuevo = null;
        });

        document.getElementById('btn-confirmar-cambio')?.addEventListener('click', mostrarModalConfirmacion);

        // Modal
        document.getElementById('btn-modal-cancelar')?.addEventListener('click', cerrarModal);
        document.getElementById('btn-modal-confirmar')?.addEventListener('click', procesarCambioPlan);
    }

    /**
     * Busca cliente por documento
     */
    async function buscarPorDocumento() {
        const input = document.getElementById('buscar-documento');
        const raw = input?.value || '';

        // Sanitizar con helper central
        const documento = window.Sanitizer ? window.Sanitizer.sanitizeDNI(raw) : raw.trim();

        // Validar
        if (window.Validators) {
            const res = window.Validators.validateDNI(documento);
            if (!res.valid) {
                if (window.Validators.showError && input) window.Validators.showError(input, res.message);
                return mostrarError(res.message);
            } else if (input) {
                window.Validators.removeError(input);
            }
        }

        await buscarCliente({ documento });
    }

    /**
     * Busca cliente por email
     */
    async function buscarPorEmail() {
        const input = document.getElementById('buscar-email');
        const raw = input?.value || '';

        // Sanitizar
        const email = window.Sanitizer ? window.Sanitizer.sanitizeEmail(raw) : raw.trim();

        // Validar
        if (window.Validators) {
            const res = window.Validators.validateEmail(email);
            if (!res.valid) {
                if (window.Validators.showError && input) window.Validators.showError(input, res.message);
                return mostrarError(res.message);
            } else if (input) {
                window.Validators.removeError(input);
            }
        }

        await buscarCliente({ email });
    }

    /**
     * Búsqueda en tiempo real
     */
    async function buscarEnTiempoReal(tipo, valor, containerId) {
        try {
            const params = new URLSearchParams();
            params.append(tipo, valor);
            const token = window.AuthToken?.getToken?.() || null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const url = getUrl('usuariobuscar') + '?' + params.toString();
            const response = await fetch(url, { method: 'GET', headers: headers, credentials: 'include' });
            if (response.ok) {
                const result = await response.json();
                const usuarios = result.data?.data || [];
                if (usuarios.length > 0) mostrarSugerencias(usuarios, containerId);
                else ocultarSugerencias(containerId);
            } else ocultarSugerencias(containerId);
        } catch (error) {
            console.error('[AtencionCambioPlan] Error búsqueda tiempo real:', error);
            ocultarSugerencias(containerId);
        }
    }

    function mostrarSugerencias(usuarios, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const escape = window.Sanitizer?.escapeHTML || (str => String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
        container.innerHTML = usuarios.map(u => `<div class="sugerencia-item p-4 hover:bg-principal-50 dark:hover:bg-dark-bg-hover cursor-pointer border-b border-gray-200 dark:border-dark-border-primary last:border-b-0 transition-all duration-200 hover:pl-6" data-usuario='${JSON.stringify(u)}'><div class="flex items-center gap-4"><div class="w-12 h-12 bg-gradient-to-br from-principal-400 to-principal-600 dark:from-dark-principal-500 dark:to-dark-principal-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"><i class="fas fa-user text-white text-lg"></i></div><div class="flex-1 min-w-0"><p class="font-bold text-gray-900 dark:text-dark-text-primary truncate text-base">${escape(u.nombre)} ${escape(u.apellido)}</p><p class="text-sm text-principal-700 dark:text-dark-principal-400 font-medium mt-0.5">DNI: ${escape(u.dni)}</p><p class="text-xs text-gray-500 dark:text-dark-text-tertiary truncate mt-0.5">${escape(u.email)}</p></div><div class="flex-shrink-0"><i class="fas fa-chevron-right text-principal-400 dark:text-dark-principal-500"></i></div></div></div>`).join('');
        container.querySelectorAll('.sugerencia-item').forEach(item => {
            item.addEventListener('click', () => {
                clienteActual = JSON.parse(item.getAttribute('data-usuario'));
                mostrarCliente();
                ocultarSugerencias(containerId);
            });
        });
        container.classList.remove('hidden');
    }

    function ocultarSugerencias(containerId) {
        const container = document.getElementById(containerId);
        if (container) { container.classList.add('hidden'); container.innerHTML = ''; }
    }

    /**
     * Busca cliente en la base de datos
     */
    async function buscarCliente(criterio) {
        showLoading('Buscando cliente...');

        try {
            // Construir query params
            const params = new URLSearchParams();
            if (criterio.documento) params.append('dni', criterio.documento);
            if (criterio.email) params.append('email', criterio.email);

            const token = window.AuthToken?.getToken?.() || null;
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const url = getUrl('usuariobuscar') + '?' + params.toString();
            console.log('[AtencionCambioPlan] Buscando usuario:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[AtencionCambioPlan] Usuario encontrado:', data);
                const usuarios = data.data?.data || [];
                
                if (usuarios.length === 1) {
                    clienteActual = usuarios[0];
                    await mostrarCliente();
                } else if (usuarios.length > 1) {
                    const containerId = criterio.documento ? 'sugerencias-documento' : 'sugerencias-email';
                    mostrarSugerencias(usuarios, containerId);
                } else {
                    mostrarError('No se encontró ningún cliente con ese criterio de búsqueda');
                }
            } else if (response.status === 404) {
                mostrarError('No se encontró ningún cliente con ese criterio de búsqueda');
            } else {
                const errorText = await response.text();
                console.error('[AtencionCambioPlan] Error:', errorText);
                if (window.ErrorHandler) {
                    const newResponse = new Response(errorText, { status: response.status, statusText: response.statusText });
                    await window.ErrorHandler.handleHTTPError(newResponse, 'usuariobuscar', true);
                } else {
                    throw new Error('Error al buscar cliente');
                }
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            mostrarError('Error al buscar el cliente. Por favor, intenta nuevamente.');
        } finally {
            hideLoading();
        }
    }

    /**
     * Muestra información del cliente encontrado
     */
    async function mostrarCliente() {
        // Ocultar búsqueda, mostrar cliente
        document.getElementById('seccion-busqueda')?.classList.add('hidden');
        document.getElementById('seccion-cliente')?.classList.remove('hidden');

        // Llenar información del cliente con escapado HTML
        const infoDiv = document.getElementById('info-cliente');
        const escape = window.Sanitizer?.escapeHTML || ((str) => String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
        infoDiv.innerHTML = `
            <div>
                <p class="text-xs text-gray-600 mb-1">Nombre</p>
                <p class="font-semibold text-gray-800">${escape(clienteActual.nombre)} ${escape(clienteActual.apellido || '')}</p>
            </div>
            <div>
                <p class="text-xs text-gray-600 mb-1">Email</p>
                <p class="font-semibold text-gray-800">${escape(clienteActual.email)}</p>
            </div>
            <div>
                <p class="text-xs text-gray-600 mb-1">Documento</p>
                <p class="font-semibold text-gray-800">${escape(clienteActual.documento)}</p>
            </div>
        `;

        // Cargar conexiones
        await cargarConexiones();
    }

    /**
     * Carga las conexiones activas del cliente
     */
    async function cargarConexiones() {
        showLoading('Cargando conexiones...');

        try {
            const url = getUrl('conexiones') + `?cliente_id=${clienteActual.id}&estado=activo`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const conexiones = await response.json();
                mostrarConexiones(conexiones);
            } else {
                throw new Error('Error al cargar conexiones');
            }
        } catch (error) {
            console.error('Error al cargar conexiones:', error);
            mostrarError('Error al cargar las conexiones del cliente');
        } finally {
            hideLoading();
        }
    }

    /**
     * Muestra las conexiones en la interfaz
     */
    function mostrarConexiones(conexiones) {
        const container = document.getElementById('conexiones-container');

        if (!conexiones || conexiones.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 sm:py-8 text-gray-500">
                    <svg class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                        <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                    <p class="text-sm sm:text-base">Este cliente no tiene conexiones activas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conexiones.map(conexion => `
            <div class="border border-gray-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 hover:border-blue-500 hover:shadow-md transition-all">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                <line x1="12" y1="20" x2="12.01" y2="20"></line>
                            </svg>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm sm:text-base truncate">${conexion.plan_nombre || 'Plan'}</h4>
                            <p class="text-xs sm:text-sm text-gray-600 truncate">${conexion.direccion || 'Sin dirección'}</p>
                        </div>
                    </div>
                    <button class="btn-cambiar-plan w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap" data-conexion-id="${conexion.id}">
                        Cambiar Plan
                    </button>
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                        <p class="text-gray-600 text-xs">Velocidad</p>
                        <p class="font-semibold text-gray-800 text-xs sm:text-sm">${conexion.plan_velocidad || '-'} Mbps</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-xs">Precio</p>
                        <p class="font-semibold text-gray-800 text-xs sm:text-sm">S/ ${conexion.plan_precio || '0'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-xs">Estado</p>
                        <p class="font-semibold text-green-600 text-xs sm:text-sm">${conexion.estado || 'Activo'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-xs">Contrato</p>
                        <p class="font-semibold text-gray-800 text-xs sm:text-sm">#${conexion.contrato_id || '-'}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Agregar listeners a los botones de cambiar plan
        document.querySelectorAll('.btn-cambiar-plan').forEach(btn => {
            btn.addEventListener('click', function() {
                const conexionId = this.getAttribute('data-conexion-id');
                const conexion = conexiones.find(c => c.id == conexionId);
                if (conexion) {
                    seleccionarConexion(conexion);
                }
            });
        });
    }

    /**
     * Selecciona una conexión para cambiar de plan
     */
    async function seleccionarConexion(conexion) {
        conexionSeleccionada = conexion;

        // Mostrar sección de nuevo plan
        document.getElementById('seccion-nuevo-plan')?.classList.remove('hidden');

        // Scroll suave
        document.getElementById('seccion-nuevo-plan')?.scrollIntoView({ behavior: 'smooth' });

        // Mostrar plan actual
        const planActualDiv = document.getElementById('plan-actual');
        planActualDiv.innerHTML = `
            <div class="bg-gray-100 border border-gray-300 rounded-lg p-3 sm:p-4">
                <h4 class="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Plan Actual</h4>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                        <p class="text-gray-600 text-xs">Nombre</p>
                        <p class="font-semibold text-gray-800 break-words">${conexion.plan_nombre || '-'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-xs">Velocidad</p>
                        <p class="font-semibold text-gray-800">${conexion.plan_velocidad || '-'} Mbps</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-xs">Precio</p>
                        <p class="font-semibold text-gray-800">S/ ${conexion.plan_precio || '0'}</p>
                    </div>
                    <div>
                        <p class="text-gray-600 text-xs">Contrato</p>
                        <p class="font-semibold text-gray-800">#${conexion.contrato_id || '-'}</p>
                    </div>
                </div>
            </div>
        `;

        // For small screens show the nuevo-plan section inside a focused overlay
        if (isSmallScreen()) {
            showMobileOverlayCambioPlan();
        }

        // Cargar planes disponibles
        await cargarPlanesDisponibles();
    }

    function showMobileOverlayCambioPlan() {
        cleanupMobileOverlayCambioPlan();

        const overlay = document.createElement('div');
        overlay.id = 'atencion-cambio-plan-overlay';
        overlay.className = 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute right-4 top-4 text-gray-600 bg-gray-100 rounded-full p-2';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            cleanupMobileOverlayCambioPlan();
            // hide nuevo plan
            document.getElementById('seccion-nuevo-plan')?.classList.add('hidden');
            conexionSeleccionada = null;
        });

        overlay.appendChild(closeBtn);

        const src = document.getElementById('seccion-nuevo-plan');
        if (src) {
            const clone = src.cloneNode(true);
            clone.classList.remove('hidden');
            overlay.appendChild(clone);
        }

        document.body.appendChild(overlay);
        document.documentElement.classList.add('overflow-hidden');
    }

    function cleanupMobileOverlayCambioPlan() {
        const el = document.getElementById('atencion-cambio-plan-overlay');
        if (el) el.remove();
        document.documentElement.classList.remove('overflow-hidden');
    }

    /**
     * Carga los planes disponibles
     */
    async function cargarPlanesDisponibles() {
        showLoading('Cargando planes...');

        try {
            const url = getUrl('planesProtected');
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                planesDisponibles = await response.json();
                mostrarPlanesDisponibles();
            } else {
                throw new Error('Error al cargar planes');
            }
        } catch (error) {
            console.error('Error al cargar planes:', error);
            mostrarError('Error al cargar los planes disponibles');
        } finally {
            hideLoading();
        }
    }

    /**
     * Muestra los planes disponibles
     */
    function mostrarPlanesDisponibles() {
        const container = document.getElementById('planes-disponibles');

        if (!planesDisponibles || planesDisponibles.length === 0) {
            container.innerHTML = '<p class="text-gray-500 col-span-3">No hay planes disponibles</p>';
            return;
        }

        // Filtrar el plan actual
        const planesFiltrados = planesDisponibles.filter(p => p.id != conexionSeleccionada.plan_id);

        container.innerHTML = planesFiltrados.map(plan => {
            const esUpgrade = plan.precio > (conexionSeleccionada.plan_precio || 0);
            const tipo = esUpgrade ? 'Upgrade' : 'Downgrade';
            const colorTipo = esUpgrade ? 'text-green-600' : 'text-blue-600';

            return `
                <div class="border border-gray-300 rounded-lg p-3 sm:p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer plan-card" data-plan-id="${plan.id}">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-gray-800 text-sm sm:text-base truncate">${plan.nombre}</h4>
                        <span class="text-xs font-semibold ${colorTipo} whitespace-nowrap ml-2">${tipo}</span>
                    </div>
                    <p class="text-xl sm:text-2xl font-bold text-blue-600 mb-2">S/ ${plan.precio}</p>
                    <p class="text-xs sm:text-sm text-gray-600 mb-2">${plan.velocidad} Mbps</p>
                    <p class="text-xs text-gray-500 mb-3 line-clamp-2">${plan.descripcion || ''}</p>
                    <div class="mt-3">
                        <input type="radio" name="plan-nuevo" value="${plan.id}" id="plan-nuevo-${plan.id}" class="mr-2">
                        <label for="plan-nuevo-${plan.id}" class="text-xs sm:text-sm text-gray-700">Seleccionar</label>
                    </div>
                </div>
            `;
        }).join('');

        // Hacer que al hacer clic en la tarjeta se seleccione el radio
        document.querySelectorAll('.plan-card').forEach(card => {
            card.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                habilitarBotonConfirmar();
            });
        });

        // Listener para los radios
        document.querySelectorAll('input[name="plan-nuevo"]').forEach(radio => {
            radio.addEventListener('change', habilitarBotonConfirmar);
        });
    }

    /**
     * Habilita el botón de confirmar cambio
     */
    function habilitarBotonConfirmar() {
        const planSeleccionado = document.querySelector('input[name="plan-nuevo"]:checked');
        const btn = document.getElementById('btn-confirmar-cambio');
        
        if (planSeleccionado && btn) {
            btn.disabled = false;
            planNuevo = planesDisponibles.find(p => p.id == planSeleccionado.value);
        }
    }

    /**
     * Muestra modal de confirmación
     */
    function mostrarModalConfirmacion() {
        if (!planNuevo) {
            mostrarError('Por favor, selecciona un plan');
            return;
        }

        // Llenar información del modal
        document.getElementById('modal-plan-anterior').innerHTML = `
            <p class="text-xs sm:text-sm break-words"><strong>Plan:</strong> ${conexionSeleccionada.plan_nombre}</p>
            <p class="text-xs sm:text-sm"><strong>Velocidad:</strong> ${conexionSeleccionada.plan_velocidad} Mbps</p>
            <p class="text-xs sm:text-sm"><strong>Precio:</strong> S/ ${conexionSeleccionada.plan_precio}</p>
        `;

        document.getElementById('modal-plan-nuevo').innerHTML = `
            <p class="text-xs sm:text-sm break-words"><strong>Plan:</strong> ${planNuevo.nombre}</p>
            <p class="text-xs sm:text-sm"><strong>Velocidad:</strong> ${planNuevo.velocidad} Mbps</p>
            <p class="text-xs sm:text-sm"><strong>Precio:</strong> S/ ${planNuevo.precio}</p>
        `;

        // Mostrar modal
        document.getElementById('modal-confirmacion')?.classList.remove('hidden');
    }

    /**
     * Cierra el modal
     */
    function cerrarModal() {
        document.getElementById('modal-confirmacion')?.classList.add('hidden');
    }

    /**
     * Procesa el cambio de plan
     */
    async function procesarCambioPlan() {
        cerrarModal();
        showLoading('Procesando cambio de plan...');

        try {
            // 1. Dar de baja el contrato actual
            const urlBaja = getUrl('contratoBaja').replace(':id', conexionSeleccionada.contrato_id);
            const responseBaja = await fetch(urlBaja, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    motivo: 'Cambio de plan',
                    fecha_baja: new Date().toISOString()
                })
            });

            if (!responseBaja.ok) {
                throw new Error('Error al dar de baja el contrato actual');
            }

            // 2. Crear nuevo contrato
            const urlNuevo = getUrl('contratos');
            // Preparar y sanitizar payload
            const payload = {
                cliente_id: clienteActual.id,
                plan_id: window.Sanitizer ? window.Sanitizer.sanitizeString(planNuevo.id) : planNuevo.id,
                direccion: window.Sanitizer ? window.Sanitizer.sanitizeAddress(conexionSeleccionada.direccion) : conexionSeleccionada.direccion,
                latitud: window.Sanitizer ? window.Sanitizer.sanitizeNumber(conexionSeleccionada.latitud) : conexionSeleccionada.latitud,
                longitud: window.Sanitizer ? window.Sanitizer.sanitizeNumber(conexionSeleccionada.longitud) : conexionSeleccionada.longitud,
                puerto: window.Sanitizer ? window.Sanitizer.sanitizeString(conexionSeleccionada.puerto) : conexionSeleccionada.puerto,
                nap: window.Sanitizer ? window.Sanitizer.sanitizeString(conexionSeleccionada.nap) : conexionSeleccionada.nap,
                vlan: window.Sanitizer ? window.Sanitizer.sanitizeString(conexionSeleccionada.vlan) : conexionSeleccionada.vlan,
                estado: 'activo',
                es_upgrade: planNuevo.precio > (conexionSeleccionada.plan_precio || 0)
            };

            const responseNuevo = await fetch(urlNuevo, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!responseNuevo.ok) {
                throw new Error('Error al crear el nuevo contrato');
            }

            const nuevoContrato = await responseNuevo.json();

            // 3. Generar PDF (simulado por ahora)
            mostrarExito('¡Cambio de plan realizado exitosamente! El nuevo contrato ha sido generado.');

            // Notificar al panel principal
            window.dispatchEvent(new Event('atencion:cambio-plan'));

            // TODO: Implementar generación de PDF cuando esté disponible
            console.log('TODO: Generar PDF del contrato', nuevoContrato);

            // Volver al panel después de 2 segundos
            setTimeout(() => {
                volverAlPanel();
            }, 2000);

        } catch (error) {
            console.error('Error al procesar cambio de plan:', error);
            mostrarError(error.message || 'Error al procesar el cambio de plan');
        } finally {
            hideLoading();
        }
    }

    /**
     * Nueva búsqueda
     */
    function nuevaBusqueda() {
        clienteActual = null;
        conexionSeleccionada = null;
        planNuevo = null;

        document.getElementById('seccion-busqueda')?.classList.remove('hidden');
        document.getElementById('seccion-cliente')?.classList.add('hidden');
        document.getElementById('seccion-nuevo-plan')?.classList.add('hidden');

        // Limpiar campos
        document.getElementById('buscar-documento').value = '';
        document.getElementById('buscar-email').value = '';
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
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.textContent = text;
            document.getElementById('loading-overlay')?.classList.remove('hidden');
        }
    }

    function hideLoading() {
        if (window.LoadingSpinner) {
            window.LoadingSpinner.hide();
        } else {
            document.getElementById('loading-overlay')?.classList.add('hidden');
        }
    }

    function mostrarError(mensaje) {
        if (window.ErrorModal) {
            window.ErrorModal.show(mensaje);
        } else if (window.ErrorHandler) {
            window.ErrorHandler.showError(mensaje);
        } else {
            alert(mensaje);
        }
    }

    function mostrarExito(mensaje) {
        if (window.SuccessModal) {
            window.SuccessModal.show(mensaje, {
                duration: 3000,
                showIcon: true
            });
        } else {
            alert(mensaje);
        }
    }

    /**
     * Cleanup
     */
    function cleanup() {
        console.log('🧹 Limpiando módulo de Cambio de Plan');
    }

    // Exponer funciones públicas
    window.AtencionCambioPlan = {
        init,
        cleanup
    };

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
