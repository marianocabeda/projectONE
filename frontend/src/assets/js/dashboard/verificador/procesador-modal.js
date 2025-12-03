/**
 * Procesador del Modal para Solicitudes
 * Maneja la lógica del modal de procesamiento de solicitudes
 */

(function() {
    // Estado del modal
    let currentSolicitud = null;
    let modalMap = null;
    let decisionSwitch = null; // Nuevo: instancia del switch

    // API helper (copiado de requests.js)
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl || function (endpoint) {
        if (!endpoint) return API_BASE_URL;
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + endpoint;
        if (window.AppConfig?.endpoints && window.AppConfig.endpoints[endpoint]) {
            return (window.AppConfig?.API_BASE_URL || API_BASE_URL) + window.AppConfig.endpoints[endpoint];
        }
        return endpoint;
    };

    /**
     * Abre el modal para procesar una solicitud
     * @param {Object|String|Number} solicitudOrId - Objeto de solicitud, ID de conexión, o nro_conexion
     */
    function openModal(solicitudOrId) {
        // Si recibimos un ID o string (nro_conexion), buscar la solicitud
        if (typeof solicitudOrId === 'string' || typeof solicitudOrId === 'number') {
            if (window.RequestsManager && typeof window.RequestsManager.getSolicitudes === 'function') {
                const solicitudes = window.RequestsManager.getSolicitudes();
                const found = solicitudes.find(s => 
                    s.nro_conexion === solicitudOrId || 
                    s.id === parseInt(solicitudOrId) || 
                    s.id_conexion_notificacion === parseInt(solicitudOrId)
                );
                
                if (found) {
                    openModal(found); // Llamada recursiva con el objeto completo
                    return;
                } else {
                    console.warn('[ModalProcessor] No se encontró solicitud con ID:', solicitudOrId);
                    if (window.ErrorModal) {
                        window.ErrorModal.show({
                            title: 'Solicitud no encontrada',
                            message: 'No se pudo encontrar la solicitud seleccionada. Por favor, refresque la página.',
                            type: 'warning'
                        });
                    }
                    return;
                }
            }
        }
        
        // Si llegamos aquí, solicitudOrId es un objeto de solicitud
        let solicitudActual = solicitudOrId;

        try {
            // Cargar detalles frescos de la solicitud
            const url = getUrl('revisacionDetalleSolicitud').replace(':id', solicitudActual.id);
            const response = fetch(url, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                if (res.ok) {
                    return res.json();
                }
            }).then(data => {
                if (data?.data) {
                    solicitudActual = data.data;
                }
            }).catch(error => {
                console.warn('[ModalProcessor] Error al cargar detalles de la solicitud:', error);
            }).finally(() => {
                // Llenar el modal después de intentar cargar detalles
                fillModal(solicitudActual);
            });
        } catch (error) {
            console.warn('[ModalProcessor] Error al iniciar carga de detalles:', error);
            fillModal(solicitudActual);
        }

        currentSolicitud = solicitudActual;
    }

    /**
     * Llena el modal con los datos de la solicitud
     */
    function fillModal(solicitud) {
        // Formatear dirección completa
        const dir = solicitud.direccion;
        let direccionCompleta = `${dir.calle} ${dir.numero}`;
        if (dir.piso) direccionCompleta += `, Piso ${dir.piso}`;
        if (dir.depto) direccionCompleta += ` ${dir.depto}`;
        direccionCompleta += `, ${dir.codigo_postal}`;

        // Plan info
        const planInfo = `${solicitud.plan.nombre} ${solicitud.plan.velocidad_mbps} Mbps`;

        // Llenar información del cliente
        const modalClienteNombre = document.getElementById('modal-cliente-nombre');
        const modalNroConexion = document.getElementById('modal-nro-conexion');
        const modalClienteEmail = document.getElementById('modal-cliente-email');
        const modalClienteTelefono = document.getElementById('modal-cliente-telefono');
        const modalClienteDireccion = document.getElementById('modal-cliente-direccion');
        const modalPlanSolicitado = document.getElementById('modal-plan-solicitado');
        const modalLatitud = document.getElementById('modal-latitud');
        const modalLongitud = document.getElementById('modal-longitud');
        const modalDistrito = document.getElementById('modal-distrito');
        const modalDepartamento = document.getElementById('modal-departamento');
        const modalSolicitudId = document.getElementById('modal-solicitud-id');

        if (modalClienteNombre) modalClienteNombre.textContent = solicitud.cliente.nombre + ' ' + solicitud.cliente.apellido;
        if (modalNroConexion) modalNroConexion.textContent = solicitud.conexion?.nro_conexion || 'N/A';
        if (modalClienteEmail) modalClienteEmail.textContent = solicitud.cliente.email || 'No disponible';
        if (modalClienteTelefono) modalClienteTelefono.textContent = solicitud.cliente.telefono || 'No disponible';
        if (modalClienteDireccion) modalClienteDireccion.textContent = direccionCompleta;
        if (modalPlanSolicitado) modalPlanSolicitado.textContent = planInfo;
        if (modalLatitud) modalLatitud.textContent = solicitud.conexion?.latitud || solicitud.ubicacion?.lat || 'N/A';
        if (modalLongitud) modalLongitud.textContent = solicitud.conexion?.longitud || solicitud.ubicacion?.lng || 'N/A';
        if (modalDistrito) modalDistrito.textContent = solicitud.conexion?.distrito || 'N/A';
        if (modalDepartamento) modalDepartamento.textContent = solicitud.conexion?.departamento || 'N/A';
        const idConexion = solicitud.conexion?.id_conexion || solicitud.id;
        if (modalSolicitudId) modalSolicitudId.value = idConexion;

        // Buscar y mostrar observaciones de la notificación relacionada
        mostrarObservacionNotificacion(idConexion);

        // Limpiar formulario y resetear estado
        resetModalForm();

        // Inicializar el switch de decisión
        initDecisionSwitch();

        // Asignar event listener al botón cancelar después de que el modal esté visible
        setTimeout(() => {
            const btnCerrar = document.getElementById('btn-cerrar-modal');
            if (btnCerrar) {
                // Remover listeners anteriores para evitar duplicados
                btnCerrar.removeEventListener('click', closeModal);
                btnCerrar.addEventListener('click', closeModal);
            }
        }, 100);

        // Mostrar modal
        const modal = document.getElementById('modal-procesar');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        // Inicializar mapa con las coordenadas de la solicitud
        if ((solicitud.conexion && solicitud.conexion.latitud && solicitud.conexion.longitud) || (solicitud.ubicacion && solicitud.ubicacion.lat && solicitud.ubicacion.lng)) {
            const lat = solicitud.conexion?.latitud || solicitud.ubicacion?.lat;
            const lng = solicitud.conexion?.longitud || solicitud.ubicacion?.lng;
            initModalMap(lat, lng);
        } else {
            console.warn('[ModalProcessor] Solicitud sin coordenadas de ubicación');
        }
    }

    /**
     * Busca y muestra la observación de la notificación relacionada con la solicitud
     * @param {Number} idConexion - ID de la conexión
     */
    function mostrarObservacionNotificacion(idConexion) {
        const campoObservacion = document.getElementById('campo-observacion-notificacion');
        const textoObservacion = document.getElementById('texto-observacion-notificacion');
        
        if (!campoObservacion || !textoObservacion) {
            console.warn('[ModalProcessor] Elementos de observación no encontrados en el DOM');
            return;
        }

        // Ocultar por defecto
        campoObservacion.classList.add('hidden');
        textoObservacion.textContent = '';

        console.log('[ModalProcessor] Buscando notificación para id_conexion:', idConexion);

        // Buscar notificación relacionada con esta conexión
        if (window.NotificationSystem && typeof window.NotificationSystem.getNotifications === 'function') {
            const notifications = window.NotificationSystem.getNotifications();
            console.log('[ModalProcessor] Total notificaciones disponibles:', notifications.length);
            console.log('[ModalProcessor] Notificaciones con id_conexion:', notifications.filter(n => n.id_conexion).map(n => ({
                id: n.id,
                id_conexion: n.id_conexion,
                observacion: n.observacion
            })));
            
            const related = notifications.find(n => 
                n.id_conexion === idConexion || 
                String(n.id_conexion) === String(idConexion) ||
                parseInt(n.id_conexion) === parseInt(idConexion)
            );
            
            if (related) {
                console.log('[ModalProcessor] Notificación relacionada encontrada:', {
                    id: related.id,
                    id_conexion: related.id_conexion,
                    observacion: related.observacion,
                    tiene_observacion: !!related.observacion
                });
                
                if (related.observacion && related.observacion.trim() !== '') {
                    console.log('[ModalProcessor] ✅ Mostrando observación:', related.observacion);
                    
                    // Sanitizar y mostrar observación
                    const observacionSegura = window.Sanitizer 
                        ? window.Sanitizer.sanitizeString(related.observacion)
                        : related.observacion;
                    
                    textoObservacion.textContent = observacionSegura;
                    campoObservacion.classList.remove('hidden');
                } else {
                    console.log('[ModalProcessor] ⚠️ Notificación encontrada pero sin observación o vacía');
                }
            } else {
                console.log('[ModalProcessor] ❌ No se encontró notificación para id_conexion:', idConexion);
            }
        } else {
            console.warn('[ModalProcessor] NotificationSystem no disponible');
        }
    }

    /**
     * Inicializa el switch de decisión usando el componente Button/Switch
     */
    function initDecisionSwitch() {
        const container = document.getElementById('switch-decision-container');
        if (!container || !window.createSwitch) return;

        // Destruir switch anterior si existe
        if (decisionSwitch) {
            decisionSwitch.destroy();
        }

        // Crear nuevo switch
        decisionSwitch = window.createSwitch({
            switchOptions: {
                left: {
                    text: window.innerWidth >= 640 ? 'No es Factible' : 'No Factible',
                    icon: 'fas fa-times-circle',
                    value: 'no_factible'
                },
                right: {
                    text: window.innerWidth >= 640 ? 'Es Factible' : 'Factible',
                    icon: 'fas fa-check-circle',
                    value: 'factible'
                }
            },
            // Sin valor inicial - aparecerá sin selección
            onSwitchChange: (value) => {
                if (value === 'factible') {
                    handleFactible();
                } else if (value === 'no_factible') {
                    handleNoFactible();
                }
            }
        });

        // Agregar al contenedor
        container.innerHTML = '';
        container.appendChild(decisionSwitch.getElement());
    }

    /**
     * Resetea el formulario del modal al estado inicial
     */
    function resetModalForm() {
        // Limpiar campos
        const inputVlan = document.getElementById('input-vlan');
        const inputNap = document.getElementById('input-nap');
        const inputPuerto = document.getElementById('input-puerto');
        const inputObservaciones = document.getElementById('input-observaciones');
        const selectMotivo = document.getElementById('select-motivo');

        if (inputVlan) inputVlan.value = '';
        if (inputNap) inputNap.value = '';
        if (inputPuerto) inputPuerto.value = '';
        if (inputObservaciones) inputObservaciones.value = '';
        if (selectMotivo) selectMotivo.value = '';

        // Ocultar todos los campos
        const camposFactible = document.getElementById('campos-factible');
        const campoObservaciones = document.getElementById('campo-observaciones');
        const campoMotivo = document.getElementById('campo-motivo');
        const btnConfirmarContainer = document.getElementById('btn-confirmar-container');
        const observacionesRequired = document.getElementById('observaciones-required');

        if (camposFactible) camposFactible.classList.add('hidden');
        if (campoObservaciones) campoObservaciones.classList.add('hidden');
        if (campoMotivo) campoMotivo.classList.add('hidden');
        if (btnConfirmarContainer) btnConfirmarContainer.classList.add('hidden');
        if (observacionesRequired) observacionesRequired.classList.add('hidden');

        // Remover atributo required de los campos
        if (inputVlan) inputVlan.removeAttribute('required');
        if (inputNap) inputNap.removeAttribute('required');
        if (inputPuerto) inputPuerto.removeAttribute('required');
        if (inputObservaciones) inputObservaciones.removeAttribute('required');
        if (selectMotivo) selectMotivo.removeAttribute('required');

        // Resetear el switch a estado sin selección
        if (decisionSwitch) {
            decisionSwitch.setValue(null);
        }
    }

    /**
     * Maneja el cambio en el select de motivo
     */
    function handleMotivoChange() {
        const selectMotivo = document.getElementById('select-motivo');
        const motivo = selectMotivo ? selectMotivo.value : '';
        const campoObservaciones = document.getElementById('campo-observaciones');
        const inputObservaciones = document.getElementById('input-observaciones');
        const observacionesRequired = document.getElementById('observaciones-required');

        if (motivo === 'otro') {
            if (campoObservaciones) campoObservaciones.classList.remove('hidden');
            if (inputObservaciones) inputObservaciones.setAttribute('required', 'required');
            if (observacionesRequired) observacionesRequired.classList.remove('hidden');
        } else {
            if (campoObservaciones) campoObservaciones.classList.add('hidden');
            if (inputObservaciones) {
                inputObservaciones.removeAttribute('required');
                inputObservaciones.value = '';
            }
            if (observacionesRequired) observacionesRequired.classList.add('hidden');
        }

        checkFormValidity();
    }
    function checkFormValidity() {
        const form = document.getElementById('form-procesar-solicitud');
        const decision = form?.dataset.decision;
        const btnConfirmar = document.getElementById('btn-confirmar-container')?.querySelector('button');

        if (!decision || !btnConfirmar) {
            if (btnConfirmar) {
                btnConfirmar.disabled = true;
                btnConfirmar.classList.add('opacity-50');
            }
            return;
        }

        if (decision === 'factible') {
            const vlanEl = document.getElementById('input-vlan');
            const napEl = document.getElementById('input-nap');
            const puertoEl = document.getElementById('input-puerto');
            const vlan = vlanEl ? vlanEl.value.trim() : '';
            const nap = napEl ? napEl.value.trim() : '';
            const puerto = puertoEl ? puertoEl.value.trim() : '';
            btnConfirmar.disabled = !vlan || !nap || !puerto;
        } else if (decision === 'no_factible') {
            const motivoEl = document.getElementById('select-motivo');
            const motivo = motivoEl ? motivoEl.value.trim() : '';
            if (motivo === 'otro') {
                const obsEl = document.getElementById('input-observaciones');
                const obs = obsEl ? obsEl.value.trim() : '';
                btnConfirmar.disabled = !obs;
            } else {
                btnConfirmar.disabled = !motivo;
            }
        } else {
            btnConfirmar.disabled = true;
        }

        // Actualizar apariencia visual
        btnConfirmar.classList.toggle('opacity-50', btnConfirmar.disabled);
    }

    /**
     * Maneja el click en el botón "Es Factible"
     */
    function handleFactible() {
        // Mostrar campos de VLAN, NAP y observaciones, ocultar motivo
        const camposFactible = document.getElementById('campos-factible');
        const campoObservaciones = document.getElementById('campo-observaciones');
        const campoMotivo = document.getElementById('campo-motivo');
        const btnConfirmarContainer = document.getElementById('btn-confirmar-container');
        const observacionesRequired = document.getElementById('observaciones-required');

        if (camposFactible) camposFactible.classList.remove('hidden');
        if (campoObservaciones) campoObservaciones.classList.remove('hidden');
        if (campoMotivo) campoMotivo.classList.add('hidden'); // Asegurar que motivo esté oculto
        if (btnConfirmarContainer) btnConfirmarContainer.classList.remove('hidden');
        if (observacionesRequired) observacionesRequired.classList.add('hidden');

        // Verificar validez del formulario
        checkFormValidity();

        // Establecer campos requeridos
        const inputVlan = document.getElementById('input-vlan');
        const inputNap = document.getElementById('input-nap');
        const inputPuerto = document.getElementById('input-puerto');
        const inputObservaciones = document.getElementById('input-observaciones');
        const selectMotivo = document.getElementById('select-motivo');

        if (inputVlan) inputVlan.setAttribute('required', 'required');
        if (inputNap) inputNap.setAttribute('required', 'required');
        if (inputPuerto) inputPuerto.setAttribute('required', 'required');
        if (inputObservaciones) inputObservaciones.removeAttribute('required');
        if (selectMotivo) selectMotivo.removeAttribute('required');

        // Guardar el estado de la decisión
        const form = document.getElementById('form-procesar-solicitud');
        if (form) {
            form.dataset.decision = 'factible';
        }
    }

    /**
     * Maneja el click en el botón "No es Factible"
     */
    function handleNoFactible() {
        console.log('[ModalProcessor] handleNoFactible called');

        // Ocultar campos de VLAN, NAP y Puerto, mostrar solo motivo
        const camposFactible = document.getElementById('campos-factible');
        const campoObservaciones = document.getElementById('campo-observaciones');
        const campoMotivo = document.getElementById('campo-motivo');
        const btnConfirmarContainer = document.getElementById('btn-confirmar-container');
        const observacionesRequired = document.getElementById('observaciones-required');

        console.log('camposFactible:', camposFactible);
        console.log('campoObservaciones:', campoObservaciones);
        console.log('campoMotivo:', campoMotivo);
        console.log('btnConfirmarContainer:', btnConfirmarContainer);

        if (camposFactible) camposFactible.classList.add('hidden');
        if (campoObservaciones) campoObservaciones.classList.add('hidden');
        if (campoMotivo) campoMotivo.classList.remove('hidden');
        if (btnConfirmarContainer) btnConfirmarContainer.classList.remove('hidden');
        if (observacionesRequired) observacionesRequired.classList.add('hidden');

        // Establecer campos requeridos
        const inputVlan = document.getElementById('input-vlan');
        const inputNap = document.getElementById('input-nap');
        const inputPuerto = document.getElementById('input-puerto');
        const inputObservaciones = document.getElementById('input-observaciones');
        const selectMotivo = document.getElementById('select-motivo');

        if (inputVlan) inputVlan.removeAttribute('required');
        if (inputNap) inputNap.removeAttribute('required');
        if (inputPuerto) inputPuerto.removeAttribute('required');
        if (inputObservaciones) inputObservaciones.removeAttribute('required');
        if (selectMotivo) selectMotivo.setAttribute('required', 'required');

        // Limpiar campos que no se van a usar
        if (inputVlan) inputVlan.value = '';
        if (inputNap) inputNap.value = '';
        if (inputPuerto) inputPuerto.value = '';

        // Guardar el estado de la decisión
        const form = document.getElementById('form-procesar-solicitud');
        if (form) {
            form.dataset.decision = 'no_factible';
        }

        // Verificar validez del formulario
        checkFormValidity();
    }

    /**
     * Confirma y procesa la solicitud según la decisión tomada
     */
    async function confirmarSolicitud() {
        const form = document.getElementById('form-procesar-solicitud');
        const decision = form?.dataset.decision;

        if (decision === 'factible') {
            await marcarFactible();
        } else if (decision === 'no_factible') {
            await marcarNoFactible();
        } else {
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Seleccione una opción',
                    message: 'Por favor, indique si la solicitud es factible o no.',
                    type: 'warning'
                });
            }
        }
    }

    /**
     * Cierra el modal
     */
    function closeModal() {
        const modal = document.getElementById('modal-procesar');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
        currentSolicitud = null;

        // Destruir mapa al cerrar modal
        if (modalMap) {
            modalMap.remove();
            modalMap = null;
        }
    }

    /**
     * Marca notificación relacionada como leída
     */
    async function marcarNotificacionLeida(idConexion) {
        try {
            // Buscar notificación relacionada con esta conexión
            if (window.NotificationSystem && typeof window.NotificationSystem.getNotifications === 'function') {
                const notifications = window.NotificationSystem.getNotifications();
                const related = notifications.find(n => 
                    n.id_conexion === idConexion && !n.leida
                );
                
                if (related) {
                    console.log('[ModalProcessor] Marcando notificación', related.id, 'como leída');
                    await window.NotificationSystem.markAsRead(related.id);
                    
                    // Refrescar notificaciones para actualizar UI
                    if (typeof window.NotificationSystem.fetchNotifications === 'function') {
                        await window.NotificationSystem.fetchNotifications();
                    }
                }
            }
        } catch (error) {
            console.warn('[ModalProcessor] Error marcando notificación como leída:', error);
            // No detener el flujo por este error
        }
    }

    /**
     * Marca una solicitud como factible
     */
    async function marcarFactible() {
        if (!currentSolicitud) return;

        const vlanRaw = document.getElementById('input-vlan').value || '';
        const napRaw = document.getElementById('input-nap').value || '';
        const puertoRaw = document.getElementById('input-puerto').value || '';
        const observacionesRaw = document.getElementById('input-observaciones').value || '';

        const vlan = window.Sanitizer ? window.Sanitizer.sanitizeString(vlanRaw) : vlanRaw.trim();
        const nap = window.Sanitizer ? window.Sanitizer.sanitizeString(napRaw) : napRaw.trim();
        const puerto = parseInt(puertoRaw, 10);
        let observaciones = window.Sanitizer ? window.Sanitizer.sanitizeString(observacionesRaw) : observacionesRaw.trim();

        // Si observaciones está vacío, autocompletar con mensaje genérico
        if (!observaciones) {
            observaciones = 'Solicitud aprobada como factible.';
        }

        if (!vlan || !nap || isNaN(puerto) || puerto <= 0) {
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Campos requeridos',
                    message: 'Por favor complete los campos VLAN, NAP y Puerto.',
                    type: 'warning'
                });
            }
            return;
        }

        // Validaciones adicionales (si están disponibles)
        if (window.Validators) {
            const pattern = /^[A-Za-z0-9\- _]+$/;
            const vRes = window.Validators.validatePattern(vlan, pattern, 'VLAN inválida', true);
            const nRes = window.Validators.validatePattern(nap, pattern, 'NAP inválido', true);
            if (!vRes.valid || !nRes.valid) {
                const msg = (!vRes.valid ? vRes.message : '') + (!nRes.valid ? ' ' + nRes.message : '');
                if (window.ErrorModal) window.ErrorModal.show({ title: 'Validación', message: msg.trim(), type: 'warning' });
                return;
            }
            // Observaciones: límite máximo
            const obsRes = window.Validators.validateMaxLength(observaciones, 1000);
            if (!obsRes.valid) {
                if (window.ErrorModal) window.ErrorModal.show({ title: 'Validación', message: obsRes.message, type: 'warning' });
                return;
            }
        }

        try {
            // Llamada al backend usando endpoint centralizado
            const endpoint = getUrl('revisacionConfirmarFactibilidad');
            // VLAN en backend es numérica; intentar parsear número desde input (p.ej. "VLAN150" -> 150)
            const vlanNumber = (() => {
                if (!vlan) return 0;
                const digits = vlan.replace(/[^0-9]/g, '');
                const n = parseInt(digits, 10);
                return isNaN(n) ? 0 : n;
            })();

            if (vlanNumber <= 0) {
                if (window.ErrorModal) window.ErrorModal.show({ title: 'VLAN inválida', message: 'Asegúrese de indicar una VLAN numérica (p.ej. VLAN150 o 150).', type: 'warning' });
                return;
            }

            const idConexion = currentSolicitud.conexion?.id_conexion || currentSolicitud.id;
            const payload = {
                id_conexion: idConexion,
                nap: nap,
                vlan: vlanNumber,
                puerto: puerto,
            };
            if (observaciones) payload.observaciones = observaciones;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
            }

            // Marcar notificación relacionada como leída (idConexion ya declarado arriba)
            await marcarNotificacionLeida(idConexion);

            // Cerrar modal
            closeModal();

            // Limpiar cache para forzar recarga
            window.CacheManager?.invalidate('solicitudes_pendientes');

            // Refrescar solicitudes desde el servidor
            if (window.RequestsManager?.refresh) {
                window.RequestsManager.refresh();
            }

            // Notificación de éxito
            if (window.SuccessModal) {
                window.SuccessModal.show('La solicitud ha sido marcada como factible correctamente.', 'Solicitud procesada');
            }

        } catch (error) {
            console.error('[ModalProcessor] Error al marcar como factible:', error);

            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error',
                    message: error.message || 'No se pudo procesar la solicitud. Por favor, intente nuevamente.',
                    type: 'error'
                });
            }
        }
    }

    /**
     * Marca una solicitud como no factible
     */
    async function marcarNoFactible() {
        if (!currentSolicitud) return;

        const motivoRaw = document.getElementById('select-motivo').value || '';
        const motivo = window.Sanitizer ? window.Sanitizer.sanitizeString(motivoRaw) : motivoRaw.trim();

        let motivoFinal = motivo;
        if (motivo === 'otro') {
            const obsRaw = document.getElementById('input-observaciones').value || '';
            motivoFinal = window.Sanitizer ? window.Sanitizer.sanitizeString(obsRaw) : obsRaw.trim();
        }

        if (!motivoFinal) {
            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Motivo requerido',
                    message: motivo === 'otro' ? 'Por favor escriba el motivo en el campo de observaciones.' : 'Por favor seleccione el motivo por el cual no es factible.',
                    type: 'warning'
                });
            }
            return;
        }

        try {
            // Llamada al backend usando endpoint centralizado
            const endpoint = getUrl('revisacionRechazarFactibilidad');
            const idConexion = currentSolicitud.conexion?.id_conexion || currentSolicitud.id;
            const payload = { id_conexion: idConexion, motivo: motivoFinal };
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || `HTTP ${response.status}`);
            }

            // Marcar notificación relacionada como leída (idConexion ya declarado arriba)
            await marcarNotificacionLeida(idConexion);

            // Cerrar modal
            closeModal();

            // Limpiar cache para forzar recarga
            window.CacheManager?.invalidate('solicitudes_pendientes');

            // Refrescar solicitudes desde el servidor
            if (window.RequestsManager?.refresh) {
                window.RequestsManager.refresh();
            }

            // Notificación de éxito
            if (window.SuccessModal) {
                window.SuccessModal.show('La solicitud ha sido marcada como no factible.', 'Solicitud procesada');
            }

        } catch (error) {
            console.error('[ModalProcessor] Error al marcar como no factible:', error);

            if (window.ErrorModal) {
                window.ErrorModal.show({
                    title: 'Error',
                    message: error.message || 'No se pudo procesar la solicitud. Por favor, intente nuevamente.',
                    type: 'error'
                });
            }
        }
    }

    /**
     * Carga Leaflet dinámicamente si no está presente
     */
    function loadLeaflet() {
        return new Promise((resolve, reject) => {
            if (window.L) return resolve();

            // Cargar CSS
            const cssId = 'leaflet-css';
            if (!document.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            // Cargar JavaScript
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
            document.body.appendChild(script);
        });
    }

    /**
     * Inicializa el mapa en el modal con las coordenadas de la solicitud
     */
    async function initModalMap(lat, lng) {
        try {
            // Cargar Leaflet si no está disponible
            await loadLeaflet();

            // Destruir mapa anterior si existe
            if (modalMap) {
                modalMap.remove();
                modalMap = null;
            }

            // Esperar un poco para que el DOM se actualice
            setTimeout(() => {
                const mapContainer = document.getElementById('modal-mapa');
                if (!mapContainer) {
                    console.error('[ModalProcessor] Contenedor del mapa no encontrado');
                    return;
                }

                // Crear nueva instancia del mapa
                modalMap = L.map('modal-mapa', {
                    zoomControl: true,
                    attributionControl: true
                }).setView([lat, lng], 16);

                // Agregar capa de tiles (OpenStreetMap)
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(modalMap);

                // Agregar marcador en la ubicación
                const marker = L.marker([lat, lng], {
                    draggable: false
                }).addTo(modalMap);

                // Agregar popup con información
                marker.bindPopup(`
                    <div class="text-center">
                        <strong>Ubicación de instalación</strong><br>
                        <small>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
                    </div>
                `).openPopup();

                // Ajustar el tamaño del mapa después de que se muestre
                setTimeout(() => {
                    if (modalMap) {
                        modalMap.invalidateSize();
                    }
                }, 200);
            }, 100);

        } catch (error) {
            console.error('[ModalProcessor] Error al inicializar mapa:', error);
        }
    }

    // Exponer funciones globalmente
    window.ModalProcessor = {
        openModal,
        handleFactible,
        handleNoFactible,
        confirmarSolicitud,
        closeModal
    };

    // Asignar event listeners para validación en tiempo real
    const inputVlan = document.getElementById('input-vlan');
    const inputNap = document.getElementById('input-nap');
    const inputPuerto = document.getElementById('input-puerto');
    const inputObservaciones = document.getElementById('input-observaciones');
    const selectMotivo = document.getElementById('select-motivo');

    if (inputVlan) inputVlan.addEventListener('input', checkFormValidity);
    if (inputNap) inputNap.addEventListener('input', checkFormValidity);
    if (inputPuerto) inputPuerto.addEventListener('input', checkFormValidity);
    if (inputObservaciones) inputObservaciones.addEventListener('input', checkFormValidity);
    if (selectMotivo) selectMotivo.addEventListener('change', handleMotivoChange);

    // Asignar event listeners
    const btnCerrar = document.getElementById('btn-cerrar-modal');
    if (btnCerrar) btnCerrar.addEventListener('click', closeModal);

    const form = document.getElementById('form-procesar-solicitud');
    if (form) form.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmarSolicitud();
    });
})();