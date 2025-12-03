/**
 * Módulo: Modificación de Datos del Cliente
 * Permite actualizar información personal de clientes existentes
 */

(function() {
    'use strict';

    let clienteActual = null;
    let datosOriginales = null;

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
        console.log('🎯 Inicializando Módulo de Modificación de Datos...');

        await cargarScriptsNecesarios();
        setupEventListeners();
        inicializarBuscador();

        console.log('✅ Módulo de Modificación de Datos inicializado');
    }

    function inicializarBuscador() {
        if (!window.BuscadorUsuario) return;

        buscadorInstance = new window.BuscadorUsuario({
            containerId: 'buscador-modificar-datos-container',
            theme: 'principal',
            placeholder: 'Buscar cliente para modificar datos...',
            autoFocus: true,
            animated: true,
            onSelect: (usuario) => {
                clienteActual = usuario;
                datosOriginales = { ...usuario };
                cargarDatosFormulario();
            },
            onClear: () => {
                clienteActual = null;
                datosOriginales = null;
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
        document.getElementById('btn-cancelar')?.addEventListener('click', cancelarEdicion);

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

        // Formulario
        document.getElementById('form-edicion')?.addEventListener('submit', guardarCambios);

        // Validaciones en tiempo real
        if (window.Validators) {
            document.getElementById('edit-email')?.addEventListener('blur', function() {
                const result = window.Validators.validateEmail(this.value);
                if (!result.valid && this.value) {
                    window.Validators.showError(this, result.message);
                } else {
                    window.Validators.removeError(this);
                }
            });

            document.getElementById('edit-telefono')?.addEventListener('blur', function() {
                if (this.value) {
                    const result = window.Validators.validatePhone(this.value);
                    if (!result.valid) {
                        window.Validators.showError(this, result.message);
                    } else {
                        window.Validators.removeError(this);
                    }
                }
            });
        }
    }

    /**
     * Busca cliente por documento
     */
    async function buscarPorDocumento() {
        const input = document.getElementById('buscar-documento');
        const raw = input?.value || '';

        // Sanitizar y validar DNI
        const documento = window.Sanitizer ? window.Sanitizer.sanitizeDNI(raw) : raw.trim();
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

        // Sanitizar y validar email
        const email = window.Sanitizer ? window.Sanitizer.sanitizeEmail(raw) : raw.trim();
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
                datosOriginales = { ...clienteActual };
                cargarDatosFormulario();
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
            console.log('[AtencionModificarDatos] Buscando usuario:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[AtencionModificarDatos] Usuario encontrado:', data);
                const usuarios = data.data?.data || [];
                
                if (usuarios.length === 1) {
                    clienteActual = usuarios[0];
                    datosOriginales = { ...usuarios[0] };
                    cargarDatosFormulario();
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
                console.error('[AtencionModificarDatos] Error:', errorText);
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
     * Carga los datos del cliente en el formulario
     */
    function cargarDatosFormulario() {
        // Ocultar búsqueda, mostrar edición
        document.getElementById('seccion-busqueda')?.classList.add('hidden');
        document.getElementById('seccion-edicion')?.classList.remove('hidden');

        // Llenar formulario
        document.getElementById('edit-nombre').value = clienteActual.nombre || '';
        document.getElementById('edit-apellido').value = clienteActual.apellido || '';
        document.getElementById('edit-email').value = clienteActual.email || '';
        document.getElementById('edit-telefono').value = clienteActual.telefono || '';
        document.getElementById('edit-tipo-doc').value = clienteActual.tipo_documento || 'DNI';
        document.getElementById('edit-documento').value = clienteActual.documento || '';
        document.getElementById('edit-direccion').value = clienteActual.direccion || '';

        // On small screens prefer a focused full-screen overlay for editing
        if (isSmallScreen()) {
            showMobileOverlayEditarDatos();
        }
    }

    /**
     * Guarda los cambios realizados
     */
    async function guardarCambios(event) {
        event.preventDefault();

        // Validar campos
        if (!validarFormulario()) {
            return;
        }

        showLoading('Guardando cambios...');

        try {
            // Recolectar y sanitizar datos desde el formulario
            const formEl = document.getElementById('form-edicion');
            let datosActualizados = {};
            if (formEl instanceof HTMLFormElement && window.Sanitizer) {
                datosActualizados = window.Sanitizer.sanitizeFormData(formEl);
            } else {
                datosActualizados = {
                    nombre: document.getElementById('edit-nombre').value.trim(),
                    apellido: document.getElementById('edit-apellido').value.trim(),
                    email: document.getElementById('edit-email').value.trim(),
                    telefono: document.getElementById('edit-telefono').value.trim(),
                    tipo_documento: document.getElementById('edit-tipo-doc').value,
                    documento: document.getElementById('edit-documento').value.trim(),
                    direccion: document.getElementById('edit-direccion').value.trim()
                };
            }

            // Usar endpoint updateUserProfile de config.js
            const url = getUrl('updateUserProfile');
            const token = window.AuthToken?.getToken?.() || null;
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(url, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(datosActualizados)
            });

            if (response.ok) {
                const resultado = await response.json();
                mostrarExito('Datos actualizados exitosamente. El cliente ha sido notificado por email.');

                // Emitir evento para actualizar estadísticas
                window.dispatchEvent(new Event('atencion:modificacion-datos'));

                // Close mobile overlay if present
                const overlay = document.getElementById('atencion-editar-datos-overlay');
                if (overlay) {
                    overlay.remove();
                    document.documentElement.classList.remove('overflow-hidden');
                }

                // Actualizar datos actuales
                clienteActual = { ...clienteActual, ...datosActualizados };
                datosOriginales = { ...clienteActual };

                // Volver al panel después de 2 segundos
                setTimeout(() => {
                    volverAlPanel();
                }, 2000);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al actualizar los datos');
            }
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            mostrarError(error.message || 'Error al guardar los cambios');
        } finally {
            hideLoading();
        }
    }

    /**
     * Valida el formulario
     */
    function validarFormulario() {
        const nombre = document.getElementById('edit-nombre').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const tipoDoc = document.getElementById('edit-tipo-doc').value;
        const documento = document.getElementById('edit-documento').value.trim();

        if (!nombre) {
            mostrarError('El nombre es obligatorio');
            return false;
        }

        if (!email) {
            mostrarError('El email es obligatorio');
            return false;
        }

        if (window.Validators) {
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid) {
                mostrarError(emailResult.message);
                return false;
            }
        }

        if (!tipoDoc || !documento) {
            mostrarError('El tipo y número de documento son obligatorios');
            return false;
        }

        return true;
    }

    /**
     * Cancela la edición y restaura datos originales
     */
    function cancelarEdicion() {
        if (datosOriginales) {
            const hayCambios = JSON.stringify(obtenerDatosFormulario()) !== JSON.stringify(datosOriginales);

            if (hayCambios && !confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
                return;
            }
        }

        nuevaBusqueda();
    }

    /**
     * Obtiene los datos actuales del formulario
     */
    function obtenerDatosFormulario() {
        return {
            nombre: document.getElementById('edit-nombre').value.trim(),
            apellido: document.getElementById('edit-apellido').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            telefono: document.getElementById('edit-telefono').value.trim(),
            tipo_documento: document.getElementById('edit-tipo-doc').value,
            documento: document.getElementById('edit-documento').value.trim(),
            direccion: document.getElementById('edit-direccion').value.trim()
        };
    }

    /**
     * Nueva búsqueda
     */
    function nuevaBusqueda() {
        clienteActual = null;
        datosOriginales = null;

        document.getElementById('seccion-busqueda')?.classList.remove('hidden');
        document.getElementById('seccion-edicion')?.classList.add('hidden');

        // Limpiar campos de búsqueda
        document.getElementById('buscar-documento').value = '';
        document.getElementById('buscar-email').value = '';

        // Limpiar formulario
        document.getElementById('form-edicion')?.reset();
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
        console.log('🧹 Limpiando módulo de Modificación de Datos');
    }

    // Mobile overlay helpers
    function showMobileOverlayEditarDatos() {
        cleanupMobileOverlayEditarDatos();

        const overlay = document.createElement('div');
        overlay.id = 'atencion-editar-datos-overlay';
        overlay.className = 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute right-4 top-4 text-gray-600 bg-gray-100 rounded-full p-2';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            cleanupMobileOverlayEditarDatos();
            nuevaBusqueda();
        });

        overlay.appendChild(closeBtn);

        const src = document.getElementById('seccion-edicion');
        if (src) {
            const clone = src.cloneNode(true);
            clone.classList.remove('hidden');
            overlay.appendChild(clone);
        }

        document.body.appendChild(overlay);
        document.documentElement.classList.add('overflow-hidden');
    }

    function cleanupMobileOverlayEditarDatos() {
        const el = document.getElementById('atencion-editar-datos-overlay');
        if (el) el.remove();
        document.documentElement.classList.remove('overflow-hidden');
    }

    // Exponer funciones públicas
    window.AtencionModificarDatos = {
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
