export const content = `
    <div id="contract-step4-review" class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">Paso 4: Revisar y Confirmar</h2>
        </div>

        <div id="review-container" class="bg-white dark:bg-dark-bg-card p-6 rounded-lg shadow-sm dark:shadow-black/30 text-sm text-gray-700 dark:text-dark-text-primary space-y-6 border border-gray-200 dark:border-dark-border-primary"></div>

        <div class="mt-6 flex justify-between">
            <button id="prev-btn" class="bg-gray-300 dark:bg-dark-bg-tertiary text-gray-800 dark:text-dark-text-primary px-6 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-bg-hover transition">Anterior</button>
            <div class="flex items-center gap-3">
                <button id="edit-all-btn" class="hidden text-sm text-gray-600 dark:text-dark-text-secondary underline">Editar todo</button>
                <button id="confirm-btn" class="bg-principal-500 dark:bg-dark-principal-600 text-white px-6 py-2 rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition">
                    <span id="confirm-btn-text">Confirmar Solicitud</span>
                </button>
            </div>
        </div>
    </div>
`;

export function init(navigate, formData, populateForm) {
    const reviewContainer = document.getElementById('review-container');
    const prevBtn = document.getElementById('prev-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const confirmBtnText = document.getElementById('confirm-btn-text');
    const editAllBtn = document.getElementById('edit-all-btn');

    // Detectar contexto de atención
    const isAtencionContext = window.location.pathname.includes('/atencion') || 
                              window.AtencionNuevasConexiones !== undefined;
    
    // Cambiar texto del botón según contexto
    if (isAtencionContext && confirmBtnText) {
        confirmBtnText.textContent = 'Siguiente';
    }

    const currentStepIndex = 4;

    const renderReview = () => {
        const d = formData || {};

        // Verificar que existan los módulos de sanitización
        if (!window.Sanitizer) {
            console.error('Sanitizer no está disponible');
            if (window.ErrorModal) {
                window.ErrorModal.show('Error al cargar el sistema de sanitización.', 'Error del Sistema');
            }
            return;
        }

        // Determinar si se usó dirección registrada o manual
        const usandoDireccionRegistrada = d.direccion_id ? true : false;
        const direccionData = usandoDireccionRegistrada ? {} : (d.direccion || {});

        // Para dirección registrada, los datos están en el nivel superior por compatibilidad
        // Aplicar sanitización usando Sanitizer.js
        const calle = window.Sanitizer.sanitizeStreet(
            usandoDireccionRegistrada ? (d.calle || '') : (direccionData.calle || '')
        );
        const numero = window.Sanitizer.sanitizeAddressNumber(
            usandoDireccionRegistrada ? (d.numero || '') : (direccionData.numero || '')
        );
        const piso = window.Sanitizer.sanitizeFloor(
            usandoDireccionRegistrada ? (d.piso || '') : (direccionData.piso || '')
        );
        const depto = window.Sanitizer.sanitizeDept(
            usandoDireccionRegistrada ? (d.depto || '') : (direccionData.depto || '')
        );
        const codigo_postal = window.Sanitizer.sanitizePostalCode(
            usandoDireccionRegistrada ? (d.codigo_postal || '') : (direccionData.codigo_postal || '')
        );
        const provincia = window.Sanitizer.sanitizeName(
            usandoDireccionRegistrada ? (d.provincia || '') : (direccionData.provincia || '')
        );
        const municipio = window.Sanitizer.sanitizeName(
            usandoDireccionRegistrada ? (d.municipio || '') : (direccionData.municipio || '')
        );
        const distrito = window.Sanitizer.sanitizeName(
            usandoDireccionRegistrada ? (d.distrito || '') : (direccionData.distrito || '')
        );

        // Usar Sanitizer.escapeHTML para sanitizar texto
        const safe = (v, fallback = '-') => {
            if (v === null || v === undefined || v === '') return fallback;
            return window.Sanitizer.escapeHTML(String(v));
        };

        const addressTag = usandoDireccionRegistrada ? '<span class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">📍 Dirección registrada</span>' : '';

        // Validar y sanitizar coordenadas
        let coordsText = null;
        if (d.coordinates && d.coordinates.lat && d.coordinates.lon) {
            const lat = parseFloat(d.coordinates.lat);
            const lon = parseFloat(d.coordinates.lon);
            
            // Validar que las coordenadas sean números válidos
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                coordsText = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            }
        }

        reviewContainer.innerHTML = `
            <div class="space-y-4">
                <!-- Sección 1: Domicilio de Instalación -->
                <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border-2 border-principal-200 dark:border-dark-border-primary shadow-sm dark:shadow-black/30 overflow-hidden">
                    <div class="bg-gradient-to-r from-principal-500 to-principal-600 dark:from-dark-principal-600 dark:to-dark-principal-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h3 class="text-base font-bold text-white">Domicilio de Instalación</h3>
                            ${addressTag ? '<div class="mt-1">' + addressTag + '</div>' : ''}
                        </div>
                        <button data-target-step="1" class="edit-step-btn bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors self-start sm:self-auto">Editar</button>
                    </div>
                    <div class="p-4">
                        <div class="mb-2">
                            <span class="text-lg font-bold text-gray-900 dark:text-dark-text-primary">${safe(calle)} ${safe(numero)}</span>
                            ${ (piso || depto) ? ('<span class="text-sm text-gray-600 dark:text-dark-text-secondary ml-2">' + (piso ? 'Piso ' + safe(piso) : '') + (piso && depto ? ' • ' : '') + (depto ? 'Depto. ' + safe(depto) : '') + '</span>') : '' }
                        </div>
                        <div class="text-sm text-gray-700 dark:text-dark-text-secondary">
                            ${safe(distrito ? distrito + ', ' + municipio : municipio)} • ${safe(provincia)} • CP ${safe(codigo_postal, '-')}
                        </div>
                    </div>
                </div>

                <!-- Sección 2: Ubicación (Coordenadas) -->
                <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border-2 border-principal-200 dark:border-dark-border-primary shadow-sm dark:shadow-black/30 overflow-hidden">
                    <div class="bg-gradient-to-r from-principal-500 to-principal-600 dark:from-dark-principal-600 dark:to-dark-principal-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 class="text-base font-bold text-white">Ubicación Geográfica</h3>
                        <button data-target-step="2" class="edit-step-btn bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors self-start sm:self-auto">Editar</button>
                    </div>
                    <div class="p-4 space-y-2">
                        <div class="font-mono text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
                            ${safe(coordsText, '<span class="text-gray-400 dark:text-dark-text-muted font-sans">No especificadas</span>')}
                        </div>
                        ${d.coordinates && d.coordinates.display_name ? ('<div class="text-xs text-gray-600 dark:text-dark-text-secondary leading-relaxed">' + safe(d.coordinates.display_name) + '</div>') : ''}
                    </div>
                </div>

                <!-- Sección 3: Plan Seleccionado -->
                <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border-2 border-principal-200 dark:border-dark-border-primary shadow-sm dark:shadow-black/30 overflow-hidden">
                    <div class="bg-gradient-to-r from-principal-500 to-principal-600 dark:from-dark-principal-600 dark:to-dark-principal-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 class="text-base font-bold text-white">Plan Contratado</h3>
                        <button data-target-step="3" class="edit-step-btn bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors self-start sm:self-auto">Editar</button>
                    </div>
                    <div class="p-4">
                        ${d.plan ? `
                        <div class="flex flex-col sm:flex-row gap-4 items-start">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">${safe(d.plan.nombre || d.plan.title || d.plan.name)}</h4>
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    ${d.plan.velocidad_mbps ? '<span class="inline-flex items-center bg-principal-500 dark:bg-dark-principal-600 text-white px-3 py-1 rounded-full text-sm font-semibold">' + safe(String(d.plan.velocidad_mbps)) + ' Mbps</span>' : ''}
                                    ${d.plan_type ? '<span class="inline-flex items-center bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-secondary px-3 py-1 rounded-full text-sm font-medium">' + safe(d.plan_type.nombre || '') + '</span>' : ''}
                                </div>
                                <p class="text-sm text-gray-600 dark:text-dark-text-secondary">${safe(d.plan.descripcion || d.plan.installation || 'Instalación incluida')}</p>
                            </div>
                            <div class="flex-shrink-0">
                                <div class="bg-gradient-to-br from-exito-50 to-exito-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-exito-500 dark:border-green-600 px-6 py-4 rounded-xl text-center">
                                    <div class="text-3xl font-black text-exito-700 dark:text-green-400 leading-none mb-1">$${window.Sanitizer.sanitizeNumber(String(d.plan.precio || d.plan.price || '0'))}</div>
                                    <div class="text-xs text-exito-600 dark:text-green-500 font-semibold uppercase">por mes</div>
                                </div>
                            </div>
                        </div>
                        ` : '<div class="text-center py-6 text-gray-400 dark:text-dark-text-muted">No se ha seleccionado ningún plan</div>'}
                    </div>
                </div>
            </div>
        `;

        // Attach edit handlers
        reviewContainer.querySelectorAll('.edit-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = parseInt(btn.dataset.targetStep, 10);
                if (isNaN(target)) return;

                // calcular delta: targetStep - currentStepIndex
                const delta = target - currentStepIndex;

                // allow edit: populate forms if helper provided
                if (typeof populateForm === 'function') {
                    try { populateForm(formData); } catch (err) { /* ignore */ }
                }
                navigate(delta);
            });
        });
    };

    // Función helper para preparar el payload final
    function prepareFinalPayload(formData) {
        const finalPayload = {};
        
        // 1. Dirección
        if (formData.direccion_id) {
            finalPayload.direccion_id = parseInt(formData.direccion_id, 10);
        } else if (formData.direccion) {
            const dir = formData.direccion;
            finalPayload.direccion = {
                calle: dir.calle,
                numero: dir.numero,
                codigo_postal: dir.codigo_postal,
                piso: dir.piso || null,
                depto: dir.depto || null,
                id_provincia: parseInt(dir.provincia_id, 10),
                id_municipio: parseInt(dir.municipio_id, 10),
                id_distrito: dir.distrito_id ? parseInt(dir.distrito_id, 10) : null
            };
        }
        
        // 2. Ubicación
        if (formData.coordinates) {
            finalPayload.ubicacion = {
                lat: parseFloat(formData.coordinates.lat),
                lng: parseFloat(formData.coordinates.lon),
                latitud: parseFloat(formData.coordinates.lat),
                longitud: parseFloat(formData.coordinates.lon)
            };
        }
        
        // 3. Plan
        if (formData.plan) {
            finalPayload.plan_id = parseInt(formData.plan.id_plan || formData.plan.id, 10);
        }
        
        return finalPayload;
    }

    // Inicial render
    renderReview();

    prevBtn.addEventListener('click', () => {
        navigate(-1);
    });

    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.classList.add('opacity-60', 'cursor-not-allowed');

        // Si estamos en contexto de atención, solo validar y navegar al paso 5
        if (isAtencionContext) {
            console.log('✅ Contexto de atención detectado, navegando al paso 5 (Factibilidad Inmediata)');
            
            // Validación básica antes de continuar
            const hasAddress = formData.direccion_id || formData.direccion;
            const hasCoordinates = formData.coordinates && formData.coordinates.lat && formData.coordinates.lon;
            const hasPlan = formData.plan && (formData.plan.id_plan || formData.plan.id);
            
            if (!hasAddress) {
                if (window.ErrorModal) {
                    window.ErrorModal.show('Debes proporcionar una dirección de instalación.', 'Datos Incompletos');
                }
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                return;
            }
            
            if (!hasCoordinates) {
                if (window.ErrorModal) {
                    window.ErrorModal.show('Debes proporcionar las coordenadas de ubicación.', 'Datos Incompletos');
                }
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                return;
            }
            
            if (!hasPlan) {
                if (window.ErrorModal) {
                    window.ErrorModal.show('Debes seleccionar un plan.', 'Datos Incompletos');
                }
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                return;
            }
            
            // Preparar datos finales para el paso 5
            formData._finalPayload = prepareFinalPayload(formData);
            
            // LOGGING: Estado de formData después del Paso 4
            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 PASO 4 COMPLETADO - Revisar y Confirmar');
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ Payload final preparado:', formData._finalPayload);
            console.log('📦 FormData completo:', JSON.stringify(formData, null, 2));
            console.log('🔜 Navegando al Paso 5 - Factibilidad Inmediata');
            console.log('═══════════════════════════════════════════════════════');
            
            // Navegar al paso 5
            navigate('next');
            return;
        }

        // FLUJO NORMAL (no atención): Verificar módulos necesarios y enviar
        if (!window.Sanitizer || !window.Validators || !window.ErrorHandler) {
            console.error('Módulos de sanitización, validación o manejo de errores no disponibles');
            if (window.ErrorModal) {
                window.ErrorModal.show('Error al cargar los módulos del sistema.', 'Error del Sistema');
            }
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            return;
        }

        // Validar que existan datos mínimos requeridos
        const validationErrors = [];

        // Preparar el payload final según el tipo de dirección
        const finalPayload = {};

        // 1. Dirección: enviar ID si se usó registrada, o datos completos si fue manual
        if (formData.direccion_id) {
            // Usando dirección registrada: enviar solo id_direccion en nivel raíz
            const direccionId = parseInt(formData.direccion_id, 10);
            if (isNaN(direccionId) || direccionId <= 0) {
                validationErrors.push('ID de dirección registrada no válido');
            } else {
                finalPayload.id_direccion = direccionId;
            }
        } else if (formData.direccion) {
            // Dirección manual: validar y sanitizar campos requeridos
            const dir = formData.direccion;
            
            // Validar calle
            const calleValidation = window.Validators.validateStreet(dir.calle, true, 3);
            if (!calleValidation.valid) {
                validationErrors.push(`Calle: ${calleValidation.message}`);
            }
            
            // Validar número
            const numeroValidation = window.Validators.validateAddressNumber(dir.numero, true, 10);
            if (!numeroValidation.valid) {
                validationErrors.push(`Número: ${numeroValidation.message}`);
            }
            
            // Validar código postal
            const cpValidation = window.Validators.validatePostalCode(dir.codigo_postal, true);
            if (!cpValidation.valid) {
                validationErrors.push(`Código Postal: ${cpValidation.message}`);
            }
            
            // Validar piso (opcional)
            if (dir.piso) {
                const pisoValidation = window.Validators.validateFloorDept(dir.piso, false, 1, 5);
                if (!pisoValidation.valid) {
                    validationErrors.push(`Piso: ${pisoValidation.message}`);
                }
            }
            
            // Validar depto (opcional)
            if (dir.depto) {
                const deptoValidation = window.Validators.validateFloorDept(dir.depto, false, 1, 5);
                if (!deptoValidation.valid) {
                    validationErrors.push(`Depto: ${deptoValidation.message}`);
                }
            }
            
            // Validar IDs de ubicación geográfica
            if (!dir.provincia_id || isNaN(parseInt(dir.provincia_id, 10))) {
                validationErrors.push('Provincia no seleccionada');
            }
            if (!dir.municipio_id || isNaN(parseInt(dir.municipio_id, 10))) {
                validationErrors.push('Municipio no seleccionado');
            }
            
            if (validationErrors.length === 0) {
                // Sanitizar y preparar dirección con nombres de campos correctos
                finalPayload.direccion = {
                    calle: window.Sanitizer.sanitizeStreet(dir.calle),
                    numero: window.Sanitizer.sanitizeAddressNumber(dir.numero),
                    codigo_postal: window.Sanitizer.sanitizePostalCode(dir.codigo_postal),
                    piso: dir.piso ? window.Sanitizer.sanitizeFloor(dir.piso) : null,
                    depto: dir.depto ? window.Sanitizer.sanitizeDept(dir.depto) : null,
                    id_provincia: parseInt(dir.provincia_id, 10),
                    id_municipio: parseInt(dir.municipio_id, 10),
                    id_distrito: dir.distrito_id ? parseInt(dir.distrito_id, 10) : null
                };
            }
        } else {
            validationErrors.push('No se ha proporcionado información de dirección');
        }

        // 2. Ubicación: validar y sanitizar coordenadas (latitud y longitud en nivel raíz)
        if (formData.coordinates && formData.coordinates.lat && formData.coordinates.lon) {
            const lat = parseFloat(formData.coordinates.lat);
            const lon = parseFloat(formData.coordinates.lon);
            
            // Validar rangos de coordenadas
            if (isNaN(lat) || lat < -90 || lat > 90) {
                validationErrors.push('Latitud no válida (debe estar entre -90 y 90)');
            }
            if (isNaN(lon) || lon < -180 || lon > 180) {
                validationErrors.push('Longitud no válida (debe estar entre -180 y 180)');
            }
            
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                finalPayload.latitud = lat;
                finalPayload.longitud = lon;
            }
        } else {
            validationErrors.push('No se han proporcionado coordenadas de ubicación');
        }

        // 3. Plan: validar ID
        if (formData.plan && (formData.plan.id_plan || formData.plan.id)) {
            const planId = parseInt(formData.plan.id_plan || formData.plan.id, 10);
            if (isNaN(planId) || planId <= 0) {
                validationErrors.push('ID de plan no válido');
            } else {
                finalPayload.id_plan = planId;
            }
        } else {
            validationErrors.push('No se ha seleccionado un plan');
        }

        // Si hay errores de validación, mostrarlos y no continuar
        if (validationErrors.length > 0) {
            if (window.ErrorModal) {
                window.ErrorModal.show(validationErrors, 'Errores de Validación');
            }
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            return;
        }

        // Enviar solicitud al endpoint del backend
        if (!window.AppConfig || !window.AppConfig.getUrl) {
            console.error('AppConfig no está disponible');
            if (window.ErrorModal) {
                window.ErrorModal.show('Error de configuración de la aplicación.', 'Error del Sistema');
            }
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            return;
        }

        try {
            const submitUrl = window.AppConfig.getUrl('crearSolicitud');
            const token = window.AuthToken?.getToken();
            
            if (!token) {
                console.error('No hay token de autenticación');
                if (window.ErrorModal) {
                    window.ErrorModal.show('Debes iniciar sesión para enviar la solicitud.', 'No Autenticado');
                }
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                return;
            }
            
            console.log('📤 Enviando solicitud a:', submitUrl);
            console.log('📦 Payload:', JSON.stringify(finalPayload, null, 2));
            
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            const res = await fetch(submitUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(finalPayload)
            });
            
            console.log('📥 Respuesta recibida - Status:', res.status, 'OK:', res.ok);
            
            if (!res.ok) {
                console.error('❌ Error en respuesta del servidor');
                if (window.ErrorHandler && typeof window.ErrorHandler.handleHTTPError === 'function') {
                    await window.ErrorHandler.handleHTTPError(res, 'solicitud', true);
                } else {
                    console.error('ErrorHandler no disponible');
                    if (window.ErrorModal) {
                        window.ErrorModal.show('Error al enviar la solicitud. Por favor, intente nuevamente.', 'Error');
                    }
                }
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                return;
            }
            
            const data = await res.json();
            console.log('✅ Solicitud enviada exitosamente:', data);
            
            // Función para navegar al dashboard
            const navigateToDashboard = () => {
                try {
                    console.log('🔄 Navegando al dashboard...');
                    // Intentar navegar al dashboard
                    if (window.AppConfig?.routes?.dashboard) {
                        window.location.href = window.AppConfig.routes.dashboard;
                    } else {
                        window.location.href = '/dashboard';
                    }
                } catch (err) {
                    console.error('❌ Error al navegar:', err);
                }
            };
            
            // Mostrar mensaje de éxito y navegar solo cuando el usuario cierre el modal
            if (window.SuccessModal && typeof window.SuccessModal.show === 'function') {
                const mensaje = data.message || 'Tu solicitud de contrato ha sido enviada correctamente. Recibirás una notificación cuando sea procesada.';
                console.log('✅ Mostrando modal de éxito');
                window.SuccessModal.show(mensaje, '¡Solicitud Enviada!');
                
                // Esperar a que el modal se cierre antes de navegar
                const checkModalClosed = setInterval(() => {
                    const modalPanel = document.getElementById('success-modal-panel');
                    if (!modalPanel) {
                        clearInterval(checkModalClosed);
                        navigateToDashboard();
                    }
                }, 100);
            } else if (window.ErrorHandler && typeof window.ErrorHandler.showSuccessNotification === 'function') {
                console.log('✅ Mostrando notificación de éxito (ErrorHandler)');
                window.ErrorHandler.showSuccessNotification('Solicitud enviada correctamente');
                // Si no hay modal, navegar después de un breve delay
                setTimeout(navigateToDashboard, 2000);
            } else {
                // Si no hay ningún sistema de notificación, navegar directamente
                console.log('⚠️ No hay sistema de notificación, navegando directamente');
                navigateToDashboard();
            }
            
        } catch (err) {
            console.error('❌ Error en el proceso de envío:', err);
            
            if (window.ErrorHandler && typeof window.ErrorHandler.handleHTTPError === 'function') {
                await window.ErrorHandler.handleHTTPError(err, 'solicitud', true);
            } else {
                console.error('ErrorHandler no disponible');
                if (window.ErrorModal) {
                    window.ErrorModal.show('Ocurrió un error inesperado. Por favor, intente nuevamente.', 'Error');
                } else {
                    alert('Error al enviar la solicitud. Por favor, intente nuevamente.');
                }
            }
            
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-60', 'cursor-not-allowed');
        }
    });

    // Optional 'edit all' behavior: bring user to the first step
    if (editAllBtn) {
        editAllBtn.addEventListener('click', () => {
            if (typeof populateForm === 'function') { try { populateForm(formData); } catch (e) {} }
            navigate(1 - currentStepIndex); // ir al inicio (asumimos)
        });
    }
}
