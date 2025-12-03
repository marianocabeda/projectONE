/**
 * Módulo: Soporte Técnico
 * Gestiona la recuperación de contraseñas para clientes
 * Requiere autenticación del operador
 */

(function() {
    'use strict';

    let clienteActual = null;

    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        const API_BASE_URL = window.AppConfig?.API_BASE_URL || '';
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
        console.log('🎯 Inicializando Módulo de Soporte Técnico...');

        await cargarScriptsNecesarios();
        setupEventListeners();
        inicializarBuscador();

        console.log('✅ Módulo de Soporte Técnico inicializado');
    }

    function inicializarBuscador() {
        if (!window.BuscadorUsuario) return;

        buscadorInstance = new window.BuscadorUsuario({
            containerId: 'buscador-soporte-container',
            theme: 'principal',
            placeholder: 'Buscar cliente para recuperar contraseña...',
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
        document.getElementById('btn-cancelar')?.addEventListener('click', nuevaBusqueda);

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

        // Toggles de visibilidad de contraseñas
        setupPasswordToggles();

        // Formulario
        document.getElementById('form-cambio-password')?.addEventListener('submit', cambiarPassword);

        // Validaciones en tiempo real
        setupPasswordValidation();
    }

    /**
     * Configura los toggles de visibilidad de contraseñas
     */
    function setupPasswordToggles() {
        const toggles = [
            { btnId: 'toggle-password-operador', inputId: 'password-operador' },
            { btnId: 'toggle-nueva-password', inputId: 'nueva-password-cliente' },
            { btnId: 'toggle-confirmar-password', inputId: 'confirmar-password-cliente' }
        ];

        toggles.forEach(({ btnId, inputId }) => {
            const btn = document.getElementById(btnId);
            const input = document.getElementById(inputId);
            
            if (btn && input) {
                btn.addEventListener('click', () => {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                });
            }
        });
    }

    /**
     * Configura validación de contraseña en tiempo real
     */
    function setupPasswordValidation() {
        const nuevaPassword = document.getElementById('nueva-password-cliente');
        const confirmarPassword = document.getElementById('confirmar-password-cliente');

        if (nuevaPassword) {
            nuevaPassword.addEventListener('input', () => {
                updatePasswordStrength(nuevaPassword.value);
                
                if (window.Validators) {
                    window.Validators.removeError(nuevaPassword);
                }

                // Validar coincidencia si ya hay valor en confirmar
                if (confirmarPassword?.value) {
                    validatePasswordMatch();
                }
            });

            nuevaPassword.addEventListener('blur', () => {
                if (window.Validators && nuevaPassword.value) {
                    const result = window.Validators.validatePassword(nuevaPassword.value);
                    if (!result.valid) {
                        window.Validators.showError(nuevaPassword, result.message);
                    }
                }
            });
        }

        if (confirmarPassword) {
            confirmarPassword.addEventListener('input', validatePasswordMatch);
            confirmarPassword.addEventListener('blur', validatePasswordMatch);
        }
    }

    /**
     * Actualiza el indicador de fortaleza de contraseña
     */
    function updatePasswordStrength(password) {
        const strengthBar = document.getElementById('password-strength-bar');
        const strengthText = document.getElementById('password-strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let strengthLabel = '';
        let strengthColor = '';

        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[@$!%*?&#]/.test(password)) strength++;

        if (strength === 0) {
            strengthLabel = '-';
            strengthColor = 'bg-gray-300';
        } else if (strength <= 2) {
            strengthLabel = 'Débil';
            strengthColor = 'bg-red-500';
        } else if (strength <= 3) {
            strengthLabel = 'Media';
            strengthColor = 'bg-yellow-500';
        } else if (strength <= 4) {
            strengthLabel = 'Buena';
            strengthColor = 'bg-blue-500';
        } else {
            strengthLabel = 'Excelente';
            strengthColor = 'bg-green-500';
        }

        strengthText.textContent = strengthLabel;
        strengthBar.className = `h-full transition-all duration-300 ${strengthColor}`;
        strengthBar.style.width = `${(strength / 5) * 100}%`;
    }

    /**
     * Valida que las contraseñas coincidan
     */
    function validatePasswordMatch() {
        const nuevaPassword = document.getElementById('nueva-password-cliente');
        const confirmarPassword = document.getElementById('confirmar-password-cliente');

        if (!window.Validators || !nuevaPassword || !confirmarPassword) return;

        if (confirmarPassword.value && nuevaPassword.value !== confirmarPassword.value) {
            window.Validators.showError(confirmarPassword, 'Las contraseñas no coinciden');
        } else {
            window.Validators.removeError(confirmarPassword);
        }
    }

    /**
     * Busca cliente por documento
     */
    async function buscarPorDocumento() {
        const input = document.getElementById('buscar-documento');
        const raw = input?.value || '';
        const documento = window.Sanitizer ? window.Sanitizer.sanitizeDNI(raw) : raw.trim();

        if (!documento) {
            mostrarError('Por favor, ingresa un número de documento');
            return;
        }

        // Validar con Validators
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
        const email = window.Sanitizer ? window.Sanitizer.sanitizeEmail(raw) : raw.trim();

        if (!email) {
            mostrarError('Por favor, ingresa un email');
            return;
        }

        // Validar con Validators
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

    async function buscarEnTiempoReal(tipo, valor, containerId) {
        try {
            const params = new URLSearchParams();
            params.append(tipo, valor);
            const token = window.AuthToken?.getToken?.() || null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(getUrl('usuariobuscar') + '?' + params, { method: 'GET', headers, credentials: 'include' });
            if (response.ok) {
                const result = await response.json();
                const usuarios = result.data?.data || [];
                usuarios.length > 0 ? mostrarSugerencias(usuarios, containerId) : ocultarSugerencias(containerId);
            } else ocultarSugerencias(containerId);
        } catch (error) { ocultarSugerencias(containerId); }
    }

    function mostrarSugerencias(usuarios, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const escape = window.Sanitizer?.escapeHTML || (s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
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
            console.log('[AtencionSoporte] Buscando usuario:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[AtencionSoporte] Usuario encontrado:', data);
                
                // El backend puede devolver un array o un objeto
                const usuario = Array.isArray(data.data) ? data.data[0] : data.data;
                
                if (usuario) {
                    clienteActual = usuario;
                    mostrarCliente();
                } else {
                    mostrarError('No se encontró ningún cliente con ese criterio de búsqueda');
                }
            } else if (response.status === 404) {
                mostrarError('No se encontró ningún cliente con ese criterio de búsqueda');
            } else {
                const errorText = await response.text();
                console.error('[AtencionSoporte] Error:', errorText);
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
     * Muestra información del cliente
     */
    function mostrarCliente() {
        // Ocultar búsqueda, mostrar formulario
        document.getElementById('seccion-busqueda')?.classList.add('hidden');
        document.getElementById('seccion-cambio-password')?.classList.remove('hidden');

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

        // On small devices prefer a focused overlay for the password change
        if (isSmallScreen()) {
            showMobileOverlayCambioPassword();
        }
    }

    /**
     * Cambia la contraseña del cliente
     */
    async function cambiarPassword(event) {
        event.preventDefault();

        // Validar formulario
        if (!validarFormulario()) {
            return;
        }

        const passwordOperadorRaw = document.getElementById('password-operador').value;
        const nuevaPasswordClienteRaw = document.getElementById('nueva-password-cliente').value;

        showLoading('Verificando autenticación y cambiando contraseña...');

        try {
            // 1. Verificar contraseña del operador
            const urlVerificar = getUrl('authVerifyPassword');
            // Sanitizar inputs
            const passwordOperador = window.Sanitizer ? window.Sanitizer.sanitizeString(passwordOperadorRaw) : passwordOperadorRaw;

            const responseVerificar = await fetch(urlVerificar, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: passwordOperador
                })
            });

            if (!responseVerificar.ok) {
                throw new Error('Contraseña de operador incorrecta');
            }

            // 2. Cambiar contraseña del cliente
            const urlCambio = getUrl('soporteCambiarPasswordCliente');
            // Sanitizar y validar nueva contraseña
            const nuevaPassword = window.Sanitizer ? window.Sanitizer.sanitizeString(nuevaPasswordClienteRaw) : nuevaPasswordClienteRaw;
            if (window.Validators) {
                const res = window.Validators.validatePassword(nuevaPassword);
                if (!res.valid) return mostrarError(res.message);
            }

            const responseCambio = await fetch(urlCambio, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cliente_id: clienteActual.id,
                    nueva_password: nuevaPassword,
                    operador_password: passwordOperador,
                    notificar_email: true
                })
            });

            if (responseCambio.ok) {
                const resultado = await responseCambio.json();
                mostrarExito('Contraseña cambiada exitosamente. El cliente ha sido notificado por email.');

                // Emitir evento para actualizar estadísticas
                window.dispatchEvent(new Event('atencion:soporte-tecnico'));

                // Limpiar formulario
                document.getElementById('form-cambio-password').reset();
                updatePasswordStrength('');

                // Close overlay if present
                const overlay = document.getElementById('atencion-cambio-password-overlay');
                if (overlay) {
                    overlay.remove();
                    document.documentElement.classList.remove('overflow-hidden');
                }

                // Volver al panel después de 2 segundos
                setTimeout(() => {
                    volverAlPanel();
                }, 2000);
            } else {
                const error = await responseCambio.json();
                throw new Error(error.message || 'Error al cambiar la contraseña');
            }

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            mostrarError(error.message || 'Error al cambiar la contraseña del cliente');
        } finally {
            hideLoading();
        }
    }

    /**
     * Valida el formulario
     */
    function validarFormulario() {
        const passwordOperador = document.getElementById('password-operador').value;
        const nuevaPassword = document.getElementById('nueva-password-cliente').value;
        const confirmarPassword = document.getElementById('confirmar-password-cliente').value;

        if (!passwordOperador) {
            mostrarError('Debes ingresar tu contraseña de operador para autenticarte');
            return false;
        }

        if (!nuevaPassword) {
            mostrarError('Debes ingresar la nueva contraseña del cliente');
            return false;
        }

        if (window.Validators) {
            const result = window.Validators.validatePassword(nuevaPassword);
            if (!result.valid) {
                mostrarError(result.message);
                return false;
            }
        }

        if (nuevaPassword !== confirmarPassword) {
            mostrarError('Las contraseñas no coinciden');
            return false;
        }

        return true;
    }

    /**
     * Nueva búsqueda
     */
    function nuevaBusqueda() {
        clienteActual = null;

        document.getElementById('seccion-busqueda')?.classList.remove('hidden');
        document.getElementById('seccion-cambio-password')?.classList.add('hidden');

        // Limpiar campos
        document.getElementById('buscar-documento').value = '';
        document.getElementById('buscar-email').value = '';
        document.getElementById('form-cambio-password')?.reset();
        updatePasswordStrength('');
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
        console.log('🧹 Limpiando módulo de Soporte Técnico');
    }

    // Mobile overlay helpers
    function showMobileOverlayCambioPassword() {
        cleanupMobileOverlayCambioPassword();

        const overlay = document.createElement('div');
        overlay.id = 'atencion-cambio-password-overlay';
        overlay.className = 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute right-4 top-4 text-gray-600 bg-gray-100 rounded-full p-2';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            cleanupMobileOverlayCambioPassword();
            nuevaBusqueda();
        });

        overlay.appendChild(closeBtn);

        const src = document.getElementById('seccion-cambio-password');
        if (src) {
            const clone = src.cloneNode(true);
            clone.classList.remove('hidden');
            overlay.appendChild(clone);
        }

        document.body.appendChild(overlay);
        document.documentElement.classList.add('overflow-hidden');
    }

    function cleanupMobileOverlayCambioPassword() {
        const el = document.getElementById('atencion-cambio-password-overlay');
        if (el) el.remove();
        document.documentElement.classList.remove('overflow-hidden');
    }

    // Exponer funciones públicas
    window.AtencionSoporte = {
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
