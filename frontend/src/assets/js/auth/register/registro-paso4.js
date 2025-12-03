export const content = `
    <form id="step4-form" class="w-full">
        <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Paso 4: Domicilio</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <!-- Calle - Full width -->
            <div class="col-span-1 md:col-span-2">
                <label for="calle" class="block text-sm font-medium text-gray-700 mb-1">Calle *</label>
                <input type="text" id="calle" name="calle" 
                    class="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500" 
                    placeholder="Ingrese nombre de calle"
                    required>
            </div>
            
            <!-- Número y Código Postal en la misma fila -->
            <div class="col-span-1">
                <label for="numero" class="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input type="text" id="numero" name="numero" 
                    class="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500"
                    placeholder="Nro">
                <!-- Checkbox Sin Número (directamente debajo del campo número) -->
                <div class="flex items-center mt-2">
                    <input id="sin-numero" name="sin-numero" type="checkbox" 
                        class="h-4 w-4 text-principal-600 border-gray-300 rounded focus:ring-principal-500">
                    <label for="sin-numero" class="ml-2 block text-sm text-gray-900">Sin número</label>
                </div>
            </div>
            
            <div class="col-span-1">
                <label for="codigo_postal" class="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
                <input type="text" id="codigo_postal" name="codigo_postal" 
                    class="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500" 
                    placeholder="CP"
                    required>
            </div>
            
            <!-- Piso y Depto en la misma fila -->
            <div class="col-span-1">
                <label for="piso" class="block text-sm font-medium text-gray-700 mb-1">Piso</label>
                <input type="text" id="piso" name="piso" 
                    class="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500"
                    placeholder="Opcional">
            </div>
            <div class="col-span-1">
                <label for="depto" class="block text-sm font-medium text-gray-700 mb-1">Depto.</label>
                <input type="text" id="depto" name="depto" 
                    class="mt-1 block w-full px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500"
                    placeholder="Opcional">
            </div>
            
            <!-- Provincia -->
            <div class="col-span-1 md:col-span-2">
                <label for="provincia-btn" class="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                <div class="relative">
                    <button type="button" id="provincia-btn" 
                        class="mt-1 flex items-center justify-between w-full text-left px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 min-h-[42px]" 
                        aria-haspopup="listbox" aria-expanded="false"> 
                        <span class="provincia-label truncate">Seleccione provincia...</span>
                        <span class="provincia-chevron text-gray-400 ml-2 flex-shrink-0">⌄</span>
                    </button>
                    <div id="provincia-overlay" class="hidden"></div>
                </div>
            </div>
            
            <!-- Municipio -->
            <div class="col-span-1 md:col-span-2">
                <label for="municipio-btn" class="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
                <div class="relative">
                    <button type="button" id="municipio-btn" 
                        class="mt-1 flex items-center justify-between w-full text-left px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 min-h-[42px]" 
                        aria-haspopup="listbox" aria-expanded="false"> 
                        <span class="municipio-label truncate">Seleccione municipio...</span>
                        <span class="municipio-chevron text-gray-400 ml-2 flex-shrink-0">⌄</span>
                    </button>
                    <div id="municipio-overlay" class="hidden"></div>
                </div>
            </div>
            
            <!-- Distrito -->
            <div class="col-span-1 md:col-span-2">
                <label for="distrito-btn" class="block text-sm font-medium text-gray-700 mb-1">Distrito *</label>
                <div class="relative">
                    <button type="button" id="distrito-btn" 
                        class="mt-1 flex items-center justify-between w-full text-left px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-principal-500 focus:border-principal-500 min-h-[42px]" 
                        aria-haspopup="listbox" aria-expanded="false"> 
                        <span class="distrito-label truncate">Seleccione distrito...</span>
                        <span class="distrito-chevron text-gray-400 ml-2 flex-shrink-0">⌄</span>
                    </button>
                    <div id="distrito-overlay" class="hidden"></div>
                </div>
            </div>
        </div>
        
        <!-- Botones de navegación -->
        <div class="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <button type="button" id="prev-btn" 
                class="w-full sm:w-auto bg-gray-300 text-gray-800 px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg hover:bg-gray-400 transition order-2 sm:order-1">
                Anterior
            </button>
            <button type="submit" 
                class="w-full sm:w-auto bg-principal-500 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg hover:bg-principal-600 transition order-1 sm:order-2">
                Finalizar Registro
            </button>
        </div>
    </form>
`;

export function init(navigate, formData, populateForm) {
    const form = document.getElementById('step4-form');
    const prevBtn = document.getElementById('prev-btn');
    const sinNumero = document.getElementById('sin-numero');
    const numeroInput = document.getElementById('numero');
    // Buttons + overlay containers (sexo-like pickers)
    const provinciaBtn = document.getElementById('provincia-btn');
    const provinciaOverlay = document.getElementById('provincia-overlay');
    const municipioBtn = document.getElementById('municipio-btn');
    const municipioOverlay = document.getElementById('municipio-overlay');
    const distritoBtn = document.getElementById('distrito-btn');
    const distritoOverlay = document.getElementById('distrito-overlay');

    populateForm(form, formData);

    // Estado inicial del campo "sin número"
    if (formData['sin-numero'] === 'on') {
        sinNumero.checked = true;
        numeroInput.disabled = true;
        numeroInput.value = 'S/N';
        numeroInput.classList.add('bg-gray-100');
    }

    sinNumero.addEventListener('change', (e) => {
        if (e.target.checked) {
            numeroInput.disabled = true;
            numeroInput.value = 'S/N';
            numeroInput.classList.add('bg-gray-100');
        } else {
            numeroInput.disabled = false;
            numeroInput.value = '';
            numeroInput.classList.remove('bg-gray-100');
        }
    });

    // Usar configuración centralizada - delegar completamente a AppConfig
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        console.error('AppConfig no está disponible. Asegúrese de cargar config.js antes de este archivo.');
        return endpoint;
    });

    /**
     * Popula un elemento select tradicional o el par input+dropdown.
     * - selectElement puede ser un <select> o un <input> (custom dropdown)
     */
    const populateSelect = (selectElement, items, placeholder, selectedId) => {
        if (!selectElement) return;

        // If it's an actual <select>, keep old behavior for compatibility
        if (selectElement.tagName === 'SELECT') {
            selectElement.innerHTML = `<option value="">${placeholder}</option>`;
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.nombre;
                selectElement.appendChild(option);
            });
            selectElement.disabled = items.length === 0;
            if (selectedId) selectElement.value = selectedId;
            return;
        }

        // If it's a sexo-like button picker, populate its overlay
        if (selectElement.tagName === 'BUTTON') {
            const btnEl = selectElement;
            const base = btnEl.id.replace(/-btn$/, '');
            const overlayEl = document.getElementById(base + '-overlay');
            if (!overlayEl) return;

            overlayEl._items = items || [];
            overlayEl.innerHTML = '';

            if (!items || items.length === 0) {
                overlayEl.classList.add('hidden');
                btnEl.disabled = true;
                const lbl = btnEl.querySelector(`.${base}-label`);
                if (lbl) lbl.textContent = placeholder;
                return;
            }

            btnEl.disabled = false;

            const panel = document.createElement('div');
            // start hidden and slightly translated for a smooth entrance
            panel.className = 'absolute left-0 right-0 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 translate-y-1 transition-all duration-150 z-50';
            panel.setAttribute('role', 'listbox');
            const list = document.createElement('div');
            list.className = 'py-1 w-full max-h-48 sm:max-h-60 overflow-y-auto';

            items.forEach(item => {
                const itemBtn = document.createElement('button');
                itemBtn.type = 'button';
                itemBtn.className = 'w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base hover:bg-gray-100 active:bg-gray-200 transition-colors block';
                itemBtn.textContent = item.nombre;
                itemBtn.dataset.id = item.id;
                itemBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const name = base;
                    formData[name + '_id'] = item.id;
                    if (name === 'provincia') {
                        formData.provincia_id = item.id;
                        formData.municipio_id = '';
                        formData.distrito_id = '';
                        if (municipioBtn) {
                            const l = municipioBtn.querySelector('.municipio-label'); if (l) l.textContent = 'Seleccione municipio...';
                            municipioOverlay && municipioOverlay.classList.add('hidden');
                        }
                        if (distritoBtn) {
                            const l = distritoBtn.querySelector('.distrito-label'); if (l) l.textContent = 'Seleccione distrito...';
                            distritoOverlay && distritoOverlay.classList.add('hidden');
                        }
                        loadMunicipios(item.id);
                    } else if (name === 'municipio') {
                        formData.municipio_id = item.id;
                        formData.distrito_id = '';
                        if (distritoBtn) {
                            const l = distritoBtn.querySelector('.distrito-label'); if (l) l.textContent = 'Seleccione distrito...';
                            distritoOverlay && distritoOverlay.classList.add('hidden');
                        }
                        loadDistritos(item.id);
                    } else if (name === 'distrito') {
                        formData.distrito_id = item.id;
                    }

                    const lbl = btnEl.querySelector(`.${base}-label`);
                    if (lbl) lbl.textContent = item.nombre;
                    overlayEl.classList.add('hidden');
                    btnEl.setAttribute('aria-expanded', 'false');
                });
                list.appendChild(itemBtn);
            });

            panel.appendChild(list);
            overlayEl.appendChild(panel);

            // animate panel into view
            requestAnimationFrame(() => {
                panel.classList.remove('opacity-0', 'translate-y-1');
                panel.classList.add('opacity-100', 'translate-y-0');
            });

            if (selectedId) {
                const found = items.find(i => String(i.id) === String(selectedId));
                if (found) {
                    const lbl = btnEl.querySelector(`.${base}-label`);
                    if (lbl) lbl.textContent = found.nombre;
                }
            }
        }
    };

    // The provincia/municipio/distrito pickers behave like the sexo picker (button + overlay).
    // No client-side text filtering is needed here — we present the list and let the user pick one.

    // Función para limpiar errores visuales del formulario
    const clearFormErrors = (formEl) => {
        if (!formEl) return;
        formEl.querySelectorAll('.register-field-error, .form-field-error').forEach(n => n.remove());
        formEl.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));
    };

    const loadProvincias = async () => {
        const url = getUrl('provincias');
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            
            if (!response.ok) {
                // Delegar al ErrorHandler que maneje el error y muestre el modal
                if (window.ErrorHandler) {
                    await window.ErrorHandler.handleHTTPError(response, 'register');
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            // La API devuelve {success: true, data: [...]}
            const provincias = data.data || [];
            populateSelect(provinciaBtn, provincias, 'Seleccione provincia...', formData.provincia_id);
            if (formData.provincia_id) await loadMunicipios(formData.provincia_id);
        } catch (error) {
            console.error('Error cargando provincias:', error);
            if (provinciaBtn) {
                const lbl = provinciaBtn.querySelector('.provincia-label');
                if (lbl) lbl.textContent = 'Seleccione provincia...';
                provinciaBtn.disabled = true;
            }
            provinciaOverlay && provinciaOverlay.classList.add('hidden');
        }
    };

    const loadMunicipios = async (provinciaId) => {
        if (municipioBtn) {
            const lbl = municipioBtn.querySelector('.municipio-label');
            if (lbl) lbl.textContent = 'Cargando...';
            municipioBtn.disabled = true;
        }
        if (distritoBtn) {
            const lbl = distritoBtn.querySelector('.distrito-label');
            if (lbl) lbl.textContent = 'Seleccione distrito...';
            distritoBtn.disabled = true;
        }
        municipioOverlay && municipioOverlay.classList.add('hidden');
        distritoOverlay && distritoOverlay.classList.add('hidden');
        
        const url = getUrl('departamentos') + `?provincia_id=${provinciaId}`;
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            
            if (!response.ok) {
                // Delegar al ErrorHandler que maneje el error y muestre el modal
                if (window.ErrorHandler) {
                    await window.ErrorHandler.handleHTTPError(response, 'register');
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            // La API devuelve {success: true, data: [...]}
            const municipios = data.data || [];
            populateSelect(municipioBtn, municipios, 'Seleccione municipio...', formData.municipio_id);
            if (formData.municipio_id) await loadDistritos(formData.municipio_id);
        } catch (error) {
            console.error('Error cargando municipios:', error);
            if (municipioBtn) {
                const lbl = municipioBtn.querySelector('.municipio-label');
                if (lbl) lbl.textContent = 'Seleccione municipio...';
                municipioBtn.disabled = true;
            }
            municipioOverlay && municipioOverlay.classList.add('hidden');
        }
    };

    const loadDistritos = async (municipioId) => {
        if (distritoBtn) {
            const lbl = distritoBtn.querySelector('.distrito-label');
            if (lbl) lbl.textContent = 'Cargando...';
            distritoBtn.disabled = true;
        }
        distritoOverlay && distritoOverlay.classList.add('hidden');
        
        const url = getUrl('distritos') + `?departamento_id=${municipioId}`;
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
            
            if (!response.ok) {
                // Delegar al ErrorHandler que maneje el error y muestre el modal
                if (window.ErrorHandler) {
                    await window.ErrorHandler.handleHTTPError(response, 'register');
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            // La API devuelve {success: true, data: [...]}
            const distritos = data.data || [];
            populateSelect(distritoBtn, distritos, 'Seleccione distrito...', formData.distrito_id);
        } catch (error) {
            console.error('Error cargando distritos:', error);
            if (distritoBtn) {
                const lbl = distritoBtn.querySelector('.distrito-label');
                if (lbl) lbl.textContent = 'Seleccione distrito...';
                distritoBtn.disabled = true;
            }
            distritoOverlay && distritoOverlay.classList.add('hidden');
        }
    };

    // Wire button open/close behavior for sexo-like pickers
    // Use a dynamic z-index allocator so the opened overlay always appears on top
    let currentOverlayZ = 2000;
    let _provinciaOutsideHandler = null;
    if (provinciaBtn && provinciaOverlay) {
        provinciaOverlay.classList.add('absolute', 'left-0', 'right-0', 'w-full', 'mt-1', 'z-[70]');
        provinciaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (provinciaOverlay.classList.contains('hidden')) {
                provinciaOverlay.classList.remove('hidden');
                // ensure this overlay is on top of others
                provinciaOverlay.style.zIndex = String(currentOverlayZ++);
                provinciaBtn.setAttribute('aria-expanded', 'true');
                // rotate chevron
                const pch = provinciaBtn.querySelector('.provincia-chevron');
                if (pch) pch.classList.add('transition-transform', 'duration-150', 'rotate-180');

                _provinciaOutsideHandler = (ev) => {
                    if (!provinciaBtn.contains(ev.target) && !provinciaOverlay.contains(ev.target)) {
                        provinciaOverlay.classList.add('hidden');
                        provinciaBtn.setAttribute('aria-expanded', 'false');
                        const pch = provinciaBtn.querySelector('.provincia-chevron'); if (pch) pch.classList.remove('rotate-180');
                        document.removeEventListener('click', _provinciaOutsideHandler);
                        _provinciaOutsideHandler = null;
                    }
                };
                document.addEventListener('click', _provinciaOutsideHandler);
            } else {
                provinciaOverlay.classList.add('hidden');
                provinciaBtn.setAttribute('aria-expanded', 'false');
                const pch = provinciaBtn.querySelector('.provincia-chevron'); if (pch) pch.classList.remove('rotate-180');
            }
        });
    }

    let _municipioOutsideHandler = null;
    if (municipioBtn && municipioOverlay) {
        municipioOverlay.classList.add('absolute', 'left-0', 'right-0', 'w-full', 'mt-1', 'z-[70]');
        municipioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (municipioOverlay.classList.contains('hidden')) {
                municipioOverlay.classList.remove('hidden');
                // bring to front
                municipioOverlay.style.zIndex = String(currentOverlayZ++);
                municipioBtn.setAttribute('aria-expanded', 'true');
                const mch = municipioBtn.querySelector('.municipio-chevron'); if (mch) mch.classList.add('transition-transform', 'duration-150', 'rotate-180');

                _municipioOutsideHandler = (ev) => {
                    if (!municipioBtn.contains(ev.target) && !municipioOverlay.contains(ev.target)) {
                        municipioOverlay.classList.add('hidden');
                        municipioBtn.setAttribute('aria-expanded', 'false');
                        const mch = municipioBtn.querySelector('.municipio-chevron'); if (mch) mch.classList.remove('rotate-180');
                        document.removeEventListener('click', _municipioOutsideHandler);
                        _municipioOutsideHandler = null;
                    }
                };
                document.addEventListener('click', _municipioOutsideHandler);
            } else {
                municipioOverlay.classList.add('hidden');
                municipioBtn.setAttribute('aria-expanded', 'false');
                const mch = municipioBtn.querySelector('.municipio-chevron'); if (mch) mch.classList.remove('rotate-180');
            }
        });
    }

    let _distritoOutsideHandler = null;
    if (distritoBtn && distritoOverlay) {
        distritoOverlay.classList.add('absolute', 'left-0', 'right-0', 'w-full', 'mt-1', 'z-[70]');
        distritoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (distritoOverlay.classList.contains('hidden')) {
                distritoOverlay.classList.remove('hidden');
                // bring to front
                distritoOverlay.style.zIndex = String(currentOverlayZ++);
                distritoBtn.setAttribute('aria-expanded', 'true');
                const dch = distritoBtn.querySelector('.distrito-chevron'); if (dch) dch.classList.add('transition-transform', 'duration-150', 'rotate-180');

                _distritoOutsideHandler = (ev) => {
                    if (!distritoBtn.contains(ev.target) && !distritoOverlay.contains(ev.target)) {
                        distritoOverlay.classList.add('hidden');
                        distritoBtn.setAttribute('aria-expanded', 'false');
                        const dch = distritoBtn.querySelector('.distrito-chevron'); if (dch) dch.classList.remove('rotate-180');
                        document.removeEventListener('click', _distritoOutsideHandler);
                        _distritoOutsideHandler = null;
                    }
                };
                document.addEventListener('click', _distritoOutsideHandler);
            } else {
                distritoOverlay.classList.add('hidden');
                distritoBtn.setAttribute('aria-expanded', 'false');
                const dch = distritoBtn.querySelector('.distrito-chevron'); if (dch) dch.classList.remove('rotate-180');
            }
        });
    }

    // Función para mostrar spinner de carga con logo
    // Ahora delega a window.LoadingSpinner si existe; se mantiene un fallback local.
    const showLoadingSpinner = (message) => {
        if (window.LoadingSpinner && typeof window.LoadingSpinner.show === 'function') {
            try { window.LoadingSpinner.show(message || 'Completando tu registro...'); } catch (e) { console.error(e); }
            return;
        }

        // Fallback local (legacy)
        if (document.getElementById('registration-loading-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'registration-loading-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl">
                <div class="relative">
                    <!-- Logo de One Internet (si existe) -->
                    <img src="/images/logos/one-negro.png" alt="One Internet" class="w-24 h-24 object-contain" onerror="this.style.display='none'">
                    <!-- Spinner animado alrededor del logo -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-32 h-32 border-4 border-principal-200 border-t-principal-600 rounded-full animate-spin"></div>
                    </div>
                </div>
                <p class="mt-6 text-gray-700 font-medium">${message || 'Completando tu registro...'}</p>
                <p class="mt-2 text-sm text-gray-500">Por favor espera un momento</p>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    // Función para ocultar spinner
    const hideLoadingSpinner = () => {
        if (window.LoadingSpinner && typeof window.LoadingSpinner.hide === 'function') {
            try { window.LoadingSpinner.hide(); } catch (e) { console.error(e); }
            return;
        }
        const overlay = document.getElementById('registration-loading-overlay');
        if (overlay) overlay.remove();
    };

    // Mostrar overlay de éxito después del registro con botón Cerrar -> redirige a login
    const showRegistrationSuccessOverlay = (message) => {
        // if already shown, do nothing
        if (document.getElementById('registration-success-overlay')) return;

        // prevent background scroll
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const overlay = document.createElement('div');
        overlay.id = 'registration-success-overlay';
        overlay.className = 'fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg p-6 flex flex-col items-center shadow-2xl max-w-md mx-4';

        const logoWrap = document.createElement('div');
        logoWrap.className = 'relative';
    const logo = document.createElement('img');
    logo.src = '/images/logos/one-negro.png';
    logo.alt = 'ONE';
    // Reduced size so it doesn't appear too large in the success overlay
    logo.className = 'w-20 h-20 object-contain';
        logoWrap.appendChild(logo);

        const text = document.createElement('p');
        text.className = 'mt-4 text-center text-gray-800';
        text.textContent = message || 'Revisa tu email y sigue los pasos para activar tu cuenta';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mt-6 bg-principal-500 text-white px-4 py-2 rounded-md hover:bg-principal-600 transition';
        btn.textContent = 'Cerrar';

        btn.addEventListener('click', () => {
            // restore scroll
            document.body.style.overflow = previousOverflow || '';
            const el = document.getElementById('registration-success-overlay');
            if (el) el.remove();
            
            // En contexto de atención, NO redirigir a login
            const isAtencionContext = window.location.pathname.includes('/atencion') || 
                                       window.AtencionNuevasConexiones !== undefined;
            
            if (!isAtencionContext) {
                // Solo redirigir a login en el flujo de registro normal
                window.location.href = '/login';
            }
            // En atención, el cierre del overlay permitirá continuar con el flujo
        });

        card.appendChild(logoWrap);
        card.appendChild(text);
        card.appendChild(btn);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // focus the close button for accessibility
        try { btn.focus(); } catch (e) { /* ignore */ }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

    // Actualizar formData con los valores del formulario
    formData.calle = document.getElementById('calle').value.trim();
    // El número de calle es varchar y puede contener letras/caracteres (ej: 'S/N', 'C123', 'B/12'). No convertir a número.
    formData.piso = document.getElementById('piso').value.trim();
    formData.depto = document.getElementById('depto').value.trim();
    formData.codigo_postal = document.getElementById('codigo_postal').value.trim();
        // Ensure IDs are present (they are set when the user selects from the custom dropdowns)
        formData.provincia_id = formData.provincia_id || '';
        formData.municipio_id = formData.municipio_id || '';
        formData.distrito_id = formData.distrito_id || '';

        if (sinNumero.checked) {
            formData.numero = 'S/N';
            formData['sin-numero'] = 'on';
        } else {
            // Mantener como string (varchar). No realizar parseInt/Number.
            formData.numero = numeroInput.value.trim();
            delete formData['sin-numero'];
        }

        // Validar que distrito esté seleccionado
        if (!formData.distrito_id) {
            if (window.ErrorModal) {
                window.ErrorModal.show('Por favor, seleccione la provincia, municipio y distrito.', 'Error de Validación');
            }
            return;
        }

        // Armar payload final según la estructura que espera el backend
        // CRÍTICO: En el contexto de dashboard de atención, no hay campo password
        // porque se genera automáticamente de manera aleatoria
        const isAtencionContext = window.location.pathname.includes('/atencion') || 
                                   window.AtencionNuevasConexiones !== undefined;
        
        // Generar contraseña aleatoria segura para dashboard de atención
        let finalPassword = formData.password;
        if (!finalPassword && isAtencionContext) {
            if (window.PasswordGenerator) {
                finalPassword = window.PasswordGenerator.generate({
                    length: 12,
                    requireUpper: true,
                    requireLower: true,
                    requireDigits: true,
                    requireSpecial: true
                });
                console.log('🔑 Contraseña generada automáticamente para usuario de atención');
            } else {
                console.error('⚠️ PasswordGenerator no disponible, usando fallback');
                finalPassword = `Dni${formData.dni}*`;
            }
        }
        
        const payload = {
            persona: {
                nombre: formData.nombre,
                apellido: formData.apellido,
                email: formData.email,
                dni: formData.dni,
                fecha_nacimiento: formData.fecha_nacimiento,
                sexo: formData.sexo,
                telefono: formData.telefono
            },
            direccion: {
                calle: formData.calle,
                numero: formData.numero || '',
                codigo_postal: formData.codigo_postal,
                id_distrito: Number(formData.distrito_id)
            },
            password: finalPassword
        };
        
        // Agregar flags para contexto de atención (backend debe soportarlos)
        if (isAtencionContext) {
            payload.force_password_change = true; // El usuario debe cambiar la contraseña en el primer login
            payload.send_credentials_email = true; // Enviar email con las credenciales
        }

        // Agregar campos opcionales solo si tienen valor
        if (formData.cuil && formData.cuil.trim() !== '') {
            payload.persona.cuil = formData.cuil;
        }
        if (formData.telefono_alternativo && formData.telefono_alternativo.trim() !== '') {
            payload.persona.telefono_alternativo = formData.telefono_alternativo;
        }
        if (formData.piso && formData.piso.trim() !== '') {
            payload.direccion.piso = formData.piso;
        }
        if (formData.depto && formData.depto.trim() !== '') {
            payload.direccion.depto = formData.depto;
        }

        // Log para debug (remover en producción)
        console.log('Payload a enviar:', JSON.stringify(payload, null, 2));

        // Mostrar spinner de carga
        showLoadingSpinner();

        try {
            // Usar endpoint según el contexto:
            // - Flujo normal: /registro (público)
            // - Flujo atención: /api/usuarios (protegido)
            const registerUrl = isAtencionContext ? getUrl('usuarios') : getUrl('register');
            
            const headers = { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            // En contexto de atención, agregar token de autenticación
            let tokenDebugInfo = 'No se requiere token (flujo público)';
            if (isAtencionContext) {
                const token = window.AuthToken?.getToken?.() || null;
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    tokenDebugInfo = `Token presente (${token.substring(0, 20)}...)`;
                } else {
                    tokenDebugInfo = '⚠️ ADVERTENCIA: Contexto de atención pero NO hay token disponible';
                }
            }
            
            // LOGS DE DEBUGGING DETALLADOS
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔍 DIAGNÓSTICO DE ENDPOINT DE REGISTRO');
            console.log('═══════════════════════════════════════════════════════');
            console.log('🌐 Pathname actual:', window.location.pathname);
            console.log('🔐 Contexto de atención:', isAtencionContext);
            console.log('🔐 window.AtencionNuevasConexiones existe:', typeof window.AtencionNuevasConexiones !== 'undefined');
            console.log('📡 Endpoint key usado:', isAtencionContext ? 'usuarios' : 'register');
            console.log('📡 URL final construida:', registerUrl);
            console.log('🔑 Info de token:', tokenDebugInfo);
            console.log('📋 Headers completos:', JSON.stringify(headers, null, 2));
            console.log('═══════════════════════════════════════════════════════');
            
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                credentials: 'include' // Para cookies httpOnly
            });
            
            hideLoadingSpinner();
            
            if (!response.ok) {
                // Log detallado del error para debug
                const errorText = await response.text();
                console.error('Error del servidor:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });

                // Intentar parsear como JSON
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }

                // Delegar al ErrorHandler que maneje el error y muestre el modal
                if (window.ErrorHandler) {
                    const errorInfo = await window.ErrorHandler.handleHTTPError(response, 'register');
                    
                    // Si hay errores de validación por campo, marcarlos visualmente
                    if (errorInfo.isValidation && errorInfo.errors) {
                        clearFormErrors(form);
                        Object.keys(errorInfo.errors).forEach(key => {
                            if (key === '_general') return;
                            const input = form.querySelector(`[name="${key}"]`);
                            if (input) {
                                input.classList.add('border-red-500');
                                const p = document.createElement('p');
                                p.className = 'register-field-error text-sm text-red-600 mt-1';
                                p.textContent = errorInfo.errors[key];
                                if (input.parentElement) input.parentElement.appendChild(p);
                            }
                        });
                    }
                } else if (window.ErrorModal) {
                    const msg = errorData.error || errorData.message || 'Error al completar el registro. Por favor, intente nuevamente.';
                    window.ErrorModal.show(msg, 'Error');
                }
                return;
            }
            
            const data = await response.json();
            
            // En contexto de atención, continuar con el flujo en lugar de mostrar overlay
            if (isAtencionContext) {
                hideLoadingSpinner();
                
                // Mostrar éxito breve con HTML renderizado
                if (window.SuccessModal) {
                    window.SuccessModal.show(
                        `El usuario ha sido registrado correctamente.<br><br>
                        <strong>Email:</strong> ${formData.email}<br>
                        Se ha enviado un correo con las credenciales de acceso.<br><br>
                        <em class="text-sm text-gray-600">Continuando con la contratación...</em>`,
                        'Usuario Creado Exitosamente'
                    );
                }
                
                // Esperar 2 segundos y continuar con contratación
                setTimeout(() => {
                    if (window.SuccessModal) window.SuccessModal.clear();
                    
                    // Disparar evento personalizado para que el módulo de atención continúe
                    const event = new CustomEvent('atencion-registro-completo', {
                        detail: { 
                            userData: data,
                            formData: formData 
                        }
                    });
                    window.dispatchEvent(event);
                    
                    // Fallback: llamar callback si existe
                    if (window.AtencionNuevasConexiones && window.AtencionNuevasConexiones.onRegistroCompleto) {
                        window.AtencionNuevasConexiones.onRegistroCompleto(data, formData);
                    }
                }, 2000);
            } else {
                // Flujo normal: mostrar overlay y redirigir a login
                showRegistrationSuccessOverlay(data.mensaje || 'Revisa tu email y sigue los pasos para activar tu cuenta');
            }
        } catch (error) {
            hideLoadingSpinner();
            console.error('Error en registro:', error);
            
            // Si no es un error HTTP manejado, mostrar error genérico
            if (window.ErrorModal) {
                window.ErrorModal.show('Error al completar el registro. Por favor, intente nuevamente.', 'Error');
            } else {
                // Fallback si ErrorModal no está disponible
                alert('❌ Error al completar el registro. Por favor, intente nuevamente.');
            }
        }
    });

    prevBtn.addEventListener('click', () => navigate(-1));

    // Carga inicial de provincias
    loadProvincias();
}
