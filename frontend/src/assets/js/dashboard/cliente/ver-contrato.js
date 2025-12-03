/**
 * Visor y Firma de Contratos
 * Maneja la visualización de contratos PDF y la captura de firma digital
 */

(function() {
    'use strict';

    // Estado de la aplicación
    let state = {
        conexionId: null,
        contratoId: null,
        contratoData: null,
        signatureData: null,
        isDrawing: false,
        isMobile: window.innerWidth < 768,
        pdfViewer: null, // Instancia del visor de PDF
        pdfUrl: null // URL del PDF para descarga
    };

    // Importar FloatingModal dinámicamente
    if (!window.FloatingModal) {
        import('../../ui/modal-flotante.js')
            .then(module => {
                window.FloatingModal = module.default;
                console.log('✅ FloatingModal importado correctamente');
            })
            .catch(error => {
                console.error('❌ Error al importar FloatingModal:', error);
            });
    }

    // Referencias a elementos DOM
    const elements = {
        pdfViewer: document.getElementById('pdf-viewer'),
        pdfFullscreenBtn: document.getElementById('pdf-fullscreen-btn'),
        pdfDownloadBtn: document.getElementById('pdf-download-btn'),
        pdfFullscreenModal: document.getElementById('pdf-fullscreen-modal'),
        pdfFullscreenContainer: document.getElementById('pdf-fullscreen-container'),
        pdfFullscreenCloseBtn: document.getElementById('pdf-fullscreen-close-btn'),
        pdfFullscreenDownloadBtn: document.getElementById('pdf-fullscreen-download-btn'),
        signatureCanvas: document.getElementById('signature-canvas'),
        signatureFullscreenCanvas: document.getElementById('signature-fullscreen-canvas'),
        fullscreenModal: document.getElementById('signature-fullscreen-modal'),
        clearBtn: document.getElementById('clear-signature-btn'),
        submitBtn: document.getElementById('submit-contract-btn'),
        fullscreenClearBtn: document.getElementById('fullscreen-clear-btn'),
        fullscreenCancelBtn: document.getElementById('fullscreen-cancel-btn'),
        fullscreenConfirmBtn: document.getElementById('fullscreen-confirm-btn'),
        nroConexion: document.getElementById('nro-conexion'),
        planNombre: document.getElementById('plan-nombre'),
        titularNombre: document.getElementById('titular-nombre'),
        estadoConexion: document.getElementById('estado-conexion')
    };

    // Contextos de canvas
    let canvasContext = null;
    let fullscreenContext = null;

    /**
     * Inicialización
     */
    function init(params = {}) {
        console.log('🎨 Inicializando visor de contratos...', params);
        
        // Re-obtener referencias a elementos DOM (por si se cargaron dinámicamente)
        elements.pdfViewer = document.getElementById('pdf-viewer');
        elements.pdfFullscreenBtn = document.getElementById('pdf-fullscreen-btn');
        elements.pdfDownloadBtn = document.getElementById('pdf-download-btn');
        elements.pdfFullscreenModal = document.getElementById('pdf-fullscreen-modal');
        elements.pdfFullscreenContainer = document.getElementById('pdf-fullscreen-container');
        elements.pdfFullscreenCloseBtn = document.getElementById('pdf-fullscreen-close-btn');
        elements.pdfFullscreenDownloadBtn = document.getElementById('pdf-fullscreen-download-btn');
        elements.signatureCanvas = document.getElementById('signature-canvas');
        elements.signatureFullscreenCanvas = document.getElementById('signature-fullscreen-canvas');
        elements.fullscreenModal = document.getElementById('signature-fullscreen-modal');
        elements.clearBtn = document.getElementById('clear-signature-btn');
        elements.submitBtn = document.getElementById('submit-contract-btn');
        elements.fullscreenClearBtn = document.getElementById('fullscreen-clear-btn');
        elements.fullscreenCancelBtn = document.getElementById('fullscreen-cancel-btn');
        elements.fullscreenConfirmBtn = document.getElementById('fullscreen-confirm-btn');
        elements.nroConexion = document.getElementById('nro-conexion');
        elements.planNombre = document.getElementById('plan-nombre');
        elements.titularNombre = document.getElementById('titular-nombre');
        elements.estadoConexion = document.getElementById('estado-conexion');
        
        // Verificar que los elementos existen
        if (!elements.signatureCanvas || !elements.submitBtn) {
            console.warn('⚠️ Elementos del canvas no encontrados, reintentando...');
            setTimeout(() => init(params), 200);
            return;
        }
        
        console.log('✅ Elementos encontrados:', {
            signatureCanvas: !!elements.signatureCanvas,
            submitBtn: !!elements.submitBtn,
            clearBtn: !!elements.clearBtn
        });
        
        // Obtener ID de conexión e idContratoFirma de los parámetros pasados o de la URL
        let conexionIdParam = params.conexionId;
        let idContratoFirmaParam = params.idContratoFirma;
        
        // Si no viene en params, intentar obtenerlo de window.location
        if (!conexionIdParam || !idContratoFirmaParam) {
            const urlParams = new URLSearchParams(window.location.search);
            if (!conexionIdParam) {
                conexionIdParam = urlParams.get('conexionId');
            }
            if (!idContratoFirmaParam) {
                idContratoFirmaParam = urlParams.get('idContratoFirma');
            }
        }
        
        console.log('🔍 Params:', { conexionIdParam, idContratoFirmaParam });
        
        // Sanitizar de forma segura
        if (window.Validators && typeof window.Validators.sanitizeInteger === 'function') {
            state.conexionId = window.Validators.sanitizeInteger(conexionIdParam);
            state.idContratoFirma = window.Validators.sanitizeInteger(idContratoFirmaParam);
        } else {
            state.conexionId = parseInt(conexionIdParam) || null;
            state.idContratoFirma = parseInt(idContratoFirmaParam) || null;
        }

        if (!state.conexionId) {
            console.warn('⚠️ No se especificó un número de conexión válido');
            showError('No se especificó un número de conexión válido');
            return;
        }
        
        console.log('📋 Conexión ID:', state.conexionId);
        console.log('📋 ID Contrato Firma:', state.idContratoFirma);

        // Inicializar canvas
        initializeCanvas();
        
        // Cargar datos del contrato
        loadContractData();
        
        // Event listeners
        setupEventListeners();
        
        // Detectar cambios de orientación en móvil
        window.addEventListener('resize', handleResize);
    }

    /**
     * Configurar canvas de firma
     */
    function initializeCanvas() {
        console.log('🎨 Inicializando canvas...');
        
        if (!elements.signatureCanvas) {
            console.error('❌ signatureCanvas no existe');
            return;
        }
        
        // Canvas principal
        canvasContext = elements.signatureCanvas.getContext('2d');
        canvasContext.strokeStyle = '#000';
        canvasContext.lineWidth = 2;
        canvasContext.lineCap = 'round';
        canvasContext.lineJoin = 'round';
        
        console.log('✅ Canvas principal inicializado:', {
            width: elements.signatureCanvas.width,
            height: elements.signatureCanvas.height
        });

        // Canvas pantalla completa
        if (elements.signatureFullscreenCanvas) {
            fullscreenContext = elements.signatureFullscreenCanvas.getContext('2d');
            fullscreenContext.strokeStyle = '#000';
            fullscreenContext.lineWidth = 3;
            fullscreenContext.lineCap = 'round';
            fullscreenContext.lineJoin = 'round';
            console.log('✅ Canvas fullscreen inicializado');
        }
        
        // Listener para cambios de orientación
        setupOrientationListener();
    }
    
    /**
     * Configurar listener para cambios de orientación
     */
    function setupOrientationListener() {
        // Detectar cambios de orientación
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener('change', handleOrientationChange);
        } else {
            // Fallback para navegadores que no soportan Screen Orientation API
            window.addEventListener('orientationchange', handleOrientationChange);
        }
        
        // También detectar cambios de tamaño (resize)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (elements.fullscreenModal && !elements.fullscreenModal.classList.contains('hidden')) {
                    handleOrientationChange();
                }
            }, 200);
        });
    }
    
    /**
     * Manejar cambios de orientación
     */
    function handleOrientationChange() {
        console.log('🔄 Orientación cambiada');
        
        // Si el modal de firma está abierto, ajustar el canvas
        if (elements.fullscreenModal && !elements.fullscreenModal.classList.contains('hidden')) {
            // Limpiar el canvas actual
            if (fullscreenContext && elements.signatureFullscreenCanvas) {
                clearCanvas(fullscreenContext, elements.signatureFullscreenCanvas);
            }
            
            // Reajustar dimensiones
            adjustFullscreenCanvas();
        }
    }

    /**
     * Configurar event listeners
     */
    function setupEventListeners() {
        console.log('🎯 Configurando event listeners...');
        
        if (!elements.signatureCanvas) {
            console.error('❌ signatureCanvas no existe, abortando setupEventListeners');
            return;
        }
        
        // Canvas principal - Desktop
        console.log('📌 Agregando listeners mousedown/mousemove/mouseup/mouseout');
        elements.signatureCanvas.addEventListener('mousedown', startDrawing, { passive: false });
        elements.signatureCanvas.addEventListener('mousemove', draw, { passive: false });
        elements.signatureCanvas.addEventListener('mouseup', stopDrawing, { passive: false });
        elements.signatureCanvas.addEventListener('mouseout', stopDrawing, { passive: false });

        // Canvas principal - Touch (abre pantalla completa en móvil)
        console.log('📱 Agregando listeners touch');
        elements.signatureCanvas.addEventListener('touchstart', (e) => {
            console.log('👆 Touch start detectado');
            if (state.isMobile) {
                e.preventDefault();
                openFullscreenSignature();
            } else {
                startDrawing(e);
            }
        }, { passive: false });
        elements.signatureCanvas.addEventListener('touchmove', draw, { passive: false });
        elements.signatureCanvas.addEventListener('touchend', stopDrawing, { passive: false });

        // Canvas pantalla completa
        if (elements.signatureFullscreenCanvas) {
            elements.signatureFullscreenCanvas.addEventListener('touchstart', startDrawing, { passive: false });
            elements.signatureFullscreenCanvas.addEventListener('touchmove', draw, { passive: false });
            elements.signatureFullscreenCanvas.addEventListener('touchend', stopDrawing, { passive: false });
        }

        // Botones
        if (elements.clearBtn) elements.clearBtn.addEventListener('click', clearSignature);
        if (elements.submitBtn) elements.submitBtn.addEventListener('click', submitContract);
        if (elements.fullscreenClearBtn) elements.fullscreenClearBtn.addEventListener('click', () => clearCanvas(fullscreenContext, elements.signatureFullscreenCanvas));
        if (elements.fullscreenCancelBtn) elements.fullscreenCancelBtn.addEventListener('click', closeFullscreenSignature);
        if (elements.fullscreenConfirmBtn) elements.fullscreenConfirmBtn.addEventListener('click', confirmFullscreenSignature);
        
        // Botones de PDF
        if (elements.pdfFullscreenBtn) elements.pdfFullscreenBtn.addEventListener('click', openPdfFullscreen);
        if (elements.pdfDownloadBtn) elements.pdfDownloadBtn.addEventListener('click', downloadPdf);
        if (elements.pdfFullscreenCloseBtn) elements.pdfFullscreenCloseBtn.addEventListener('click', closePdfFullscreen);
        if (elements.pdfFullscreenDownloadBtn) elements.pdfFullscreenDownloadBtn.addEventListener('click', downloadPdf);
        
        console.log('✅ Event listeners configurados correctamente');
    }

    /**
     * Cargar datos del contrato
     */
    async function loadContractData() {
        try {
            showLoader(elements.pdfViewer);

            // Obtener datos de la conexión
            const conexionesResponse = await fetch(window.AppConfig.getUrl('conexiones'), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!conexionesResponse.ok) {
                throw new Error('Error al cargar los datos de la conexión');
            }

            const conexionesData = await conexionesResponse.json();
            console.log('📊 Datos de conexiones recibidos:', conexionesData);
            
            // La estructura real es { success: true, data: { conexiones: [...] } }
            let conexiones = [];
            if (conexionesData.data && Array.isArray(conexionesData.data.conexiones)) {
                conexiones = conexionesData.data.conexiones;
            } else if (Array.isArray(conexionesData.data)) {
                conexiones = conexionesData.data;
            } else if (Array.isArray(conexionesData.conexiones)) {
                conexiones = conexionesData.conexiones;
            } else if (Array.isArray(conexionesData)) {
                conexiones = conexionesData;
            }
            
            console.log('🔍 Buscando conexión con ID:', state.conexionId, 'en', conexiones.length, 'conexiones');
            
            const conexion = conexiones.find(c => 
                c.id_conexion === state.conexionId || 
                c.id === state.conexionId
            );
            
            if (!conexion) {
                console.error('❌ Conexión no encontrada. IDs disponibles:', conexiones.map(c => c.id_conexion || c.id));
                throw new Error('Conexión no encontrada');
            }
            
            console.log('✅ Conexión encontrada:', conexion);

            const data = {
                nroConexion: conexion.nro_conexion || conexion.nroConexion,
                plan: conexion.plan?.nombre || conexion.plan,
                titular: conexion.titular,
                estado: conexion.estado_conexion || conexion.estado,
                contratoId: conexion.id_contrato || conexion.contratoId,
                contrato_firmado: conexion.contrato_firmado === true
            };
            
            console.log('📝 Datos extraídos:', data);
            console.log('🔐 contrato_firmado:', data.contrato_firmado);
            
            // Guardar contratoId para usarlo en las peticiones
            state.contratoId = data.contratoId;
            
            if (!state.contratoId) {
                console.error('❌ No se pudo obtener contratoId de la conexión');
                throw new Error('No se pudo obtener el ID del contrato');
            }
            
            console.log('🎯 contratoId guardado:', state.contratoId);
            
            // Sanitizar datos de forma segura
            const sanitize = window.Sanitizer || {
                sanitizeText: (text) => String(text || '').trim(),
                sanitizeHtml: (html) => String(html || '').trim()
            };
            const validate = window.Validators || {
                sanitizeInteger: (val) => parseInt(val) || null
            };
            
            state.contratoData = {
                nroConexion: validate.sanitizeInteger(data.nroConexion),
                planNombre: sanitize.sanitizeText(data.plan),
                titular: sanitize.sanitizeText(data.titular),
                estado: sanitize.sanitizeText(data.estado),
                contratoHtml: sanitize.sanitizeHtml(data.contratoHtml),
                contrato_firmado: data.contrato_firmado === true
            };

            console.log('📋 Estado contrato_firmado:', state.contratoData.contrato_firmado);

            // Mostrar información
            displayContractInfo();
            
            // Cargar contrato en el visor
            loadPdfViewer();

        } catch (error) {
            console.error('Error al cargar contrato:', error);
            showError('No se pudo cargar el contrato. Por favor, intente nuevamente.');
        }
    }

    /**
     * Mostrar información del contrato
     */
    function displayContractInfo() {
        if (elements.nroConexion) {
            elements.nroConexion.textContent = state.contratoData.nroConexion || '-';
        }
        if (elements.planNombre) {
            elements.planNombre.textContent = state.contratoData.planNombre || '-';
        }
        if (elements.titularNombre) {
            elements.titularNombre.textContent = state.contratoData.titular || '-';
        }
        if (elements.estadoConexion) {
            elements.estadoConexion.textContent = state.contratoData.estado || '-';
        }
        
        // Mostrar/ocultar sección de firma según estado
        toggleSignatureSection();
    }
    
    /**
     * Mostrar u ocultar la sección de firma según el estado del contrato
     */
    function toggleSignatureSection() {
        const signatureCard = document.querySelector('.dashboard-card:has(#signature-canvas)');
        const submitBtn = elements.submitBtn;
        const cancelBtn = document.querySelector('button[onclick*="loadContent"]');
        
        if (!state.contratoData) {
            console.warn('⚠️ No hay datos del contrato para verificar estado de firma');
            return;
        }
        
        const contratoFirmado = state.contratoData.contrato_firmado === true;
        
        console.log('📝 Estado contrato firmado:', contratoFirmado);
        
        if (contratoFirmado) {
            // Ocultar sección de firma y botones
            if (signatureCard) {
                signatureCard.style.display = 'none';
                console.log('✅ Sección de firma ocultada (contrato ya firmado)');
            }
            if (submitBtn) {
                submitBtn.style.display = 'none';
            }
            if (cancelBtn) {
                cancelBtn.textContent = 'Volver';
            }
            
            // Mostrar mensaje informativo
            const pdfCard = document.querySelector('.dashboard-card:has(#pdf-viewer)');
            if (pdfCard && !document.getElementById('contract-signed-notice')) {
                const notice = document.createElement('div');
                notice.id = 'contract-signed-notice';
                notice.className = 'mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg';
                notice.innerHTML = `
                    <div class="flex items-start gap-3">
                        <svg class="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div class="flex-1">
                            <h3 class="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                                Contrato Firmado
                            </h3>
                            <p class="text-sm text-green-700 dark:text-green-400">
                                Este contrato ya ha sido firmado y verificado correctamente.
                            </p>
                        </div>
                    </div>
                `;
                pdfCard.appendChild(notice);
            }
        } else {
            // Mostrar sección de firma y botones
            if (signatureCard) {
                signatureCard.style.display = 'block';
                console.log('✅ Sección de firma visible (contrato pendiente de firma)');
            }
            if (submitBtn) {
                submitBtn.style.display = 'inline-block';
            }
        }
    }

    /**
     * Cargar visor de PDF
     */
    async function loadPdfViewer() {
        try {
            // Usar idContratoFirma si está disponible, sino contratoId
            const idParaFirma = state.idContratoFirma || state.contratoId;
            console.log('📝 Iniciando carga de PDF con ID:', idParaFirma, '(idContratoFirma:', state.idContratoFirma, ', contratoId:', state.contratoId, ')');
            
            if (!idParaFirma) {
                console.error('❌ No hay ID disponible para cargar el PDF');
                throw new Error('ID de contrato no disponible');
            }

            // Obtener URL del PDF del contrato usando id_contrato_firma
            const pdfUrl = window.AppConfig.getUrl('contratoFirmaPdf').replace(':id', idParaFirma);
            console.log('🔗 URL del PDF:', pdfUrl);
            
            // Guardar URL para descarga
            state.pdfUrl = pdfUrl;

            // Inicializar visor PDF.js
            if (!window.PDFViewer) {
                // Cargar módulo del visor
                await import('/assets/js/utils/pdf-viewer.js');
            }

            // Crear instancia del visor
            state.pdfViewer = new window.PDFViewer('pdf-viewer');
            
            // Cargar PDF con autenticación
            await state.pdfViewer.loadPDF(pdfUrl, localStorage.getItem('token'));
            
            // Mostrar botones de acción
            if (elements.pdfFullscreenBtn) {
                elements.pdfFullscreenBtn.classList.remove('hidden');
                elements.pdfFullscreenBtn.classList.add('flex');
            }
            if (elements.pdfDownloadBtn) {
                elements.pdfDownloadBtn.classList.remove('hidden');
                elements.pdfDownloadBtn.classList.add('flex');
            }

        } catch (error) {
            console.error('Error al cargar PDF:', error);
            // Fallback: mostrar mensaje de error
            elements.pdfViewer.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center p-6">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p class="text-gray-600 dark:text-dark-text-secondary mb-2">No se pudo cargar el contrato</p>
                        <p class="text-sm text-gray-500 dark:text-dark-text-tertiary">Por favor, intente nuevamente más tarde</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Abrir PDF en pantalla completa
     */
    function openPdfFullscreen() {
        if (!state.pdfUrl) {
            showError('PDF no disponible');
            return;
        }
        
        if (!elements.pdfFullscreenModal || !elements.pdfFullscreenContainer) {
            console.error('Elementos de modal no encontrados');
            return;
        }
        
        // Crear visor en el modal
        elements.pdfFullscreenContainer.innerHTML = '<div id="pdf-fullscreen-viewer" class="w-full h-full"></div>';
        
        // Inicializar visor en pantalla completa
        const fullscreenViewer = new window.PDFViewer('pdf-fullscreen-viewer');
        fullscreenViewer.loadPDF(state.pdfUrl, localStorage.getItem('token'));
        
        // Mostrar modal
        elements.pdfFullscreenModal.classList.remove('hidden');
        elements.pdfFullscreenModal.classList.add('flex');
        
        // Prevenir scroll del body
        document.body.classList.add('overflow-hidden');
    }

    /**
     * Cerrar PDF en pantalla completa
     */
    function closePdfFullscreen() {
        if (!elements.pdfFullscreenModal) return;
        
        elements.pdfFullscreenModal.classList.add('hidden');
        elements.pdfFullscreenModal.classList.remove('flex');
        
        // Restaurar scroll del body
        document.body.classList.remove('overflow-hidden');
    }

    /**
     * Descargar PDF
     */
    async function downloadPdf() {
        if (!state.pdfUrl) {
            showError('PDF no disponible para descargar');
            return;
        }
        
        try {
            // Descargar el PDF con autenticación
            const response = await fetch(state.pdfUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al descargar el PDF');
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // Crear elemento <a> temporal para descargar
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `contrato_${state.conexionId}_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Liberar URL del blob
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            
            showSuccess('Descarga iniciada');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            showError('No se pudo descargar el PDF');
        }
    }

    /**
     * Iniciar dibujo en canvas
     */
    function startDrawing(e) {
        console.log('🖊️ Iniciando dibujo...', e.type);
        state.isDrawing = true;
        const canvas = e.target;
        const context = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let x, y;
        if (e.type.includes('touch')) {
            e.preventDefault();
            const touch = e.touches[0];
            x = (touch.clientX - rect.left) * scaleX;
            y = (touch.clientY - rect.top) * scaleY;
        } else {
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        }

        console.log('📍 Posición inicial:', { x, y, scaleX, scaleY });

        context.beginPath();
        context.moveTo(x, y);
        canvas.classList.remove('signature-canvas-idle');
        canvas.classList.add('signature-canvas-drawing');
    }

    /**
     * Dibujar en canvas
     */
    function draw(e) {
        if (!state.isDrawing) return;
        
        const canvas = e.target;
        const context = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let x, y;
        if (e.type.includes('touch')) {
            e.preventDefault();
            const touch = e.touches[0];
            x = (touch.clientX - rect.left) * scaleX;
            y = (touch.clientY - rect.top) * scaleY;
        } else {
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        }

        context.lineTo(x, y);
        context.stroke();
    }

    /**
     * Detener dibujo
     */
    function stopDrawing(e) {
        if (state.isDrawing) {
            state.isDrawing = false;
            const canvas = e.target;
            canvas.classList.remove('signature-canvas-drawing');
            canvas.classList.add('signature-canvas-idle');
            
            // Guardar firma
            if (canvas === elements.signatureCanvas) {
                state.signatureData = canvas.toDataURL('image/png');
            }
        }
    }

    /**
     * Limpiar firma
     */
    function clearSignature() {
        clearCanvas(canvasContext, elements.signatureCanvas);
        state.signatureData = null;
    }

    /**
     * Limpiar canvas específico
     */
    function clearCanvas(context, canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Abrir modal de firma pantalla completa
     */
    async function openFullscreenSignature() {
        elements.fullscreenModal.classList.remove('hidden');
        elements.fullscreenModal.classList.add('flex');
        
        // En móviles, entrar en modo fullscreen (sin bloquear orientación)
        if (state.isMobile) {
            try {
                await enterFullscreen(elements.fullscreenModal);
                console.log('✅ Fullscreen activado');
                
                // Esperar y ajustar canvas
                await new Promise(resolve => setTimeout(resolve, 200));
                adjustFullscreenCanvas();
            } catch (err) {
                console.log('⚠️ Error en fullscreen:', err.message);
                // Si falla, igual ajustar el canvas
                adjustFullscreenCanvas();
            }
        } else {
            // Desktop: solo ajustar canvas
            adjustFullscreenCanvas();
        }
    }

    /**
     * Entrar en modo fullscreen
     */
    async function enterFullscreen(element) {
        if (!element) return;
        
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }
        } catch (err) {
            console.log('ℹ️ Fullscreen no disponible:', err.message);
            throw err;
        }
    }

    /**
     * Salir de modo fullscreen
     */
    async function exitFullscreen() {
        if (!state.isMobile) return;
        
        console.log('🔓 Intentando salir de fullscreen...');
        
        try {
            const fullscreenElement = document.fullscreenElement || 
                                     document.webkitFullscreenElement || 
                                     document.mozFullScreenElement || 
                                     document.msFullscreenElement;
            
            if (fullscreenElement) {
                console.log('📱 Elemento en fullscreen detectado, saliendo...');
                
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
                
                console.log('✅ Salió de fullscreen');
                
                // Esperar a que el navegador procese la salida
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
                console.log('ℹ️ No hay elemento en fullscreen');
            }
        } catch (err) {
            console.log('⚠️ Error al salir de fullscreen:', err.message);
        }
    }

    /**
     * Ajustar tamaño del canvas fullscreen según orientación
     */
    function adjustFullscreenCanvas() {
        const canvas = elements.signatureFullscreenCanvas;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            // Modo horizontal: usar todo el espacio
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - 150; // Espacio para botones
        } else {
            // Modo vertical: optimizar para firma vertical
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - 180; // Más espacio para botones
        }
        
        // Reinicializar contexto
        fullscreenContext.strokeStyle = '#000';
        fullscreenContext.lineWidth = 3;
        fullscreenContext.lineCap = 'round';
        fullscreenContext.lineJoin = 'round';
        
        console.log(`📐 Canvas firma ajustado: ${canvas.width}x${canvas.height}, landscape: ${isLandscape}`);
    }

    /**
     * Solicitar orientación horizontal (landscape)
     */
    async function requestLandscapeOrientation() {
        // Solo en dispositivos móviles
        if (!state.isMobile) return;
        
        // Verificar si la Screen Orientation API está disponible
        if (screen.orientation && screen.orientation.lock) {
            try {
                await screen.orientation.lock('landscape');
                console.log('✅ Orientación bloqueada en landscape');
            } catch (err) {
                console.log('ℹ️ No se pudo bloquear la orientación:', err.message);
                // Esto puede fallar si:
                // - El usuario no tiene rotación automática activada
                // - El navegador no permite el bloqueo
                // - No estamos en modo fullscreen
            }
        } else if (window.screen.lockOrientation) {
            // Fallback para navegadores antiguos
            try {
                const result = window.screen.lockOrientation('landscape');
                if (result) {
                    console.log('✅ Orientación bloqueada (legacy API)');
                }
            } catch (err) {
                console.log('ℹ️ lockOrientation no soportado:', err.message);
            }
        }
    }

    /**
     * Liberar bloqueo de orientación
     */
    function unlockOrientation() {
        // Solo en dispositivos móviles
        if (!state.isMobile) return;
        
        console.log('🔓 Intentando desbloquear orientación...');
        
        try {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
                screen.orientation.unlock();
                console.log('✅ Orientación desbloqueada (screen.orientation.unlock)');
            }
        } catch (err) {
            console.log('⚠️ Error al desbloquear orientación:', err.message);
        }
        
        // Intentar con API legacy también
        try {
            if (window.screen.unlockOrientation && typeof window.screen.unlockOrientation === 'function') {
                window.screen.unlockOrientation();
                console.log('✅ Orientación desbloqueada (legacy API)');
            }
        } catch (err) {
            console.log('⚠️ Error con legacy unlock:', err.message);
        }
        
        // Forzar cualquier otro método disponible
        try {
            if (window.screen.mozUnlockOrientation) {
                window.screen.mozUnlockOrientation();
                console.log('✅ Orientación desbloqueada (moz)');
            }
        } catch (err) {
            // Silenciar error
        }
        
        try {
            if (window.screen.msUnlockOrientation) {
                window.screen.msUnlockOrientation();
                console.log('✅ Orientación desbloqueada (ms)');
            }
        } catch (err) {
            // Silenciar error
        }
    }

    /**
     * Cerrar modal de firma pantalla completa
     */
    async function closeFullscreenSignature() {
        console.log('🔄 Cerrando modal de firma...');
        
        // Ocultar modal primero
        elements.fullscreenModal.classList.add('hidden');
        elements.fullscreenModal.classList.remove('flex');
        clearCanvas(fullscreenContext, elements.signatureFullscreenCanvas);
        
        // Solo en móviles: salir de fullscreen
        if (state.isMobile) {
            console.log('📱 Saliendo de fullscreen...');
            await exitFullscreen();
        }
        
        console.log('✅ Modal de firma cerrado');
    }

    /**
     * Confirmar firma de pantalla completa
     */
    async function confirmFullscreenSignature() {
        // Copiar firma del canvas fullscreen al canvas principal
        const fullscreenCanvas = elements.signatureFullscreenCanvas;
        const mainCanvas = elements.signatureCanvas;
        
        // Redimensionar y copiar manteniendo aspect ratio
        canvasContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        
        // Calcular el aspect ratio para evitar distorsión
        const srcAspect = fullscreenCanvas.width / fullscreenCanvas.height;
        const dstAspect = mainCanvas.width / mainCanvas.height;
        
        let drawWidth = mainCanvas.width;
        let drawHeight = mainCanvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (srcAspect > dstAspect) {
            // Fuente más ancha - ajustar altura
            drawHeight = mainCanvas.width / srcAspect;
            offsetY = (mainCanvas.height - drawHeight) / 2;
        } else {
            // Fuente más alta - ajustar ancho
            drawWidth = mainCanvas.height * srcAspect;
            offsetX = (mainCanvas.width - drawWidth) / 2;
        }
        
        canvasContext.drawImage(
            fullscreenCanvas, 
            0, 0, fullscreenCanvas.width, fullscreenCanvas.height,
            offsetX, offsetY, drawWidth, drawHeight
        );
        
        // Guardar firma
        state.signatureData = mainCanvas.toDataURL('image/png');
        
        // Cerrar modal (esto liberará la orientación y saldrá de fullscreen)
        await closeFullscreenSignature();
    }

    /**
     * Enviar contrato firmado y mostrar modal de validación
     */
    async function submitContract() {
        try {
            // Verificar si el contrato ya está firmado
            if (state.contratoData && state.contratoData.contrato_firmado === true) {
                showError('Este contrato ya ha sido firmado');
                return;
            }
            
            // Validar firma
            if (!state.signatureData) {
                showError('Por favor, firme el contrato antes de enviarlo');
                return;
            }

            // Validar que la firma no esté vacía (canvas en blanco)
            if (isCanvasBlank(elements.signatureCanvas)) {
                showError('El área de firma está vacía. Por favor, firme el contrato.');
                return;
            }

            elements.submitBtn.disabled = true;
            elements.submitBtn.textContent = 'Enviando...';

            // Enviar firma al servidor usando id_contrato_firma
            const idParaFirma = state.idContratoFirma || state.contratoId;
            console.log('📝 Enviando firma con ID:', idParaFirma);
            const firmaUrl = window.AppConfig.getUrl('contratoFirmaEnviar').replace(':id', idParaFirma);
            const response = await fetch(firmaUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firma_base64: state.signatureData
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al enviar la firma');
            }

            const result = await response.json();
            
            // Mostrar modal de validación de token usando el nuevo módulo
            showTokenValidationModal();

        } catch (error) {
            console.error('Error al enviar firma:', error);
            showError(error.message || 'No se pudo enviar la firma. Por favor, intente nuevamente.');
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = 'Verificar';
        }
    }

    /**
     * Mostrar modal de validación de token
     */
    function showTokenValidationModal() {
        // Verificar que ModalValidacionToken esté disponible
        if (!window.ModalValidacionToken) {
            console.error('ModalValidacionToken no está disponible');
            showError('Error al cargar el modal de validación');
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = 'Verificar';
            return;
        }

        try {
            // Crear instancia del modal con callbacks
            const modal = new window.ModalValidacionToken({
                idContratoFirma: state.idContratoFirma,
                contratoId: state.contratoId,
                onSuccess: () => {
                    // Éxito: mostrar mensaje y redirigir
                    showSuccess('¡Contrato firmado y verificado exitosamente!');
                    
                    setTimeout(() => {
                        if (window.loadContent) {
                            window.loadContent('/conexiones');
                        } else {
                            window.location.href = '/dashboard';
                        }
                    }, 2000);
                },
                onCancel: () => {
                    // Cancelado: re-habilitar botón
                    elements.submitBtn.disabled = false;
                    elements.submitBtn.textContent = 'Verificar';
                }
            });

            modal.show();
        } catch (error) {
            console.error('Error al crear modal de validación:', error);
            showError('Error al abrir el modal de validación');
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = 'Verificar';
        }
    }



    /**
     * Verificar si el canvas está en blanco
     */
    function isCanvasBlank(canvas) {
        const context = canvas.getContext('2d');
        const pixelBuffer = new Uint32Array(
            context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
        return !pixelBuffer.some(color => color !== 0);
    }

    /**
     * Limpiar estilos de error del input al remover
     */
    function removeErrorStyles(input) {
        if (!input) return;
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
    }

    /**
     * Cleanup cuando se cambia de vista
     */
    function cleanup() {
        console.log('🧹 Limpiando módulo ver-contrato...');
        
        // Remover event listeners de window
        window.removeEventListener('resize', handleResize);
        
        // Remover listeners de orientación
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.removeEventListener('change', handleOrientationChange);
        } else {
            window.removeEventListener('orientationchange', handleOrientationChange);
        }
        
        // Destruir visor de PDF
        if (state.pdfViewer) {
            state.pdfViewer.destroy();
            state.pdfViewer = null;
        }
        
        // Cerrar modales y liberar orientación
        closePdfFullscreen();
        closeFullscreenSignature();
        
        // Limpiar referencias
        state.isDrawing = false;
        state.signatureData = null;
        state.contratoData = null;
        state.pdfUrl = null;
    }

    /**
     * Manejar cambios de tamaño de ventana
     */
    function handleResize() {
        state.isMobile = window.innerWidth < 768;
    }

    /**
     * Mostrar loader
     */
    function showLoader(element) {
        element.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p class="text-gray-600 dark:text-dark-text-secondary">Cargando...</p>
                </div>
            </div>
        `;
    }

    /**
     * Mostrar error
     */
    function showError(message) {
        if (window.ErrorModal) {
            window.ErrorModal.show(message);
        } else {
            alert(message);
        }
    }

    /**
     * Mostrar éxito
     */
    function showSuccess(message) {
        if (window.SuccessModal) {
            window.SuccessModal.show(message);
        } else {
            alert(message);
        }
    }

    // Exponer función de inicialización globalmente
    window.VerContratoModule = {
        init: init,
        cleanup: cleanup
    };

    console.log('✅ Módulo ver-contrato.js cargado y listo');

})();
