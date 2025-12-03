/**
 * PDF Viewer usando PDF.js v5
 * Renderiza PDFs sin violar Content Security Policy
 */

class PDFViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.canvas = null;
        this.ctx = null;
        this.pdfData = null; // Guardar datos del PDF para descarga
        
        this.initializeContainer();
    }

    /**
     * Esperar a que PDF.js esté disponible
     */
    async waitForPdfJs(maxAttempts = 50) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.pdfjsLib) {
                return window.pdfjsLib;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('PDF.js no pudo cargarse después de 5 segundos');
    }

    initializeContainer() {
        if (!this.container) return;
        
        // Crear estructura del visor
        this.container.innerHTML = `
            <div class="pdf-viewer-wrapper w-full h-full flex flex-col bg-gray-50 dark:bg-dark-bg-primary">
                <!-- Controles -->
                <div class="pdf-controls flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border-primary flex-wrap gap-2 flex-shrink-0">
                    <div class="flex items-center gap-1 sm:gap-2">
                        <button id="pdf-prev" class="px-2 py-1 sm:px-3 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded hover:bg-gray-300 dark:hover:bg-dark-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
                            <span class="hidden sm:inline">← Anterior</span>
                            <span class="sm:hidden">←</span>
                        </button>
                        <span id="pdf-page-info" class="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary px-1 sm:px-2">
                            <span class="hidden sm:inline">Página: </span><span id="pdf-page-num">1</span> / <span id="pdf-page-count">--</span>
                        </span>
                        <button id="pdf-next" class="px-2 py-1 sm:px-3 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded hover:bg-gray-300 dark:hover:bg-dark-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
                            <span class="hidden sm:inline">Siguiente →</span>
                            <span class="sm:hidden">→</span>
                        </button>
                    </div>
                    <div class="hidden sm:flex items-center gap-2">
                        <button id="pdf-zoom-out" class="px-3 py-1 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded hover:bg-gray-300 dark:hover:bg-dark-bg-hover transition-colors text-sm">
                            -
                        </button>
                        <span id="pdf-zoom-level" class="text-sm text-gray-600 dark:text-dark-text-secondary px-2 min-w-[60px] text-center">100%</span>
                        <button id="pdf-zoom-in" class="px-3 py-1 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary rounded hover:bg-gray-300 dark:hover:bg-dark-bg-hover transition-colors text-sm">
                            +
                        </button>
                    </div>
                </div>
                
                <!-- Canvas para renderizar el PDF con overflow-auto para scroll -->
                <div class="pdf-canvas-container flex-1 overflow-auto p-1 sm:p-4 relative bg-gray-50 dark:bg-dark-bg-primary">
                    <!-- Loader overlay -->
                    <div id="pdf-loading-overlay" class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-dark-bg-primary z-10">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
                            <p class="text-gray-600 dark:text-dark-text-secondary">Cargando PDF...</p>
                        </div>
                    </div>
                    <canvas id="pdf-canvas" class="mx-auto shadow-lg border border-gray-300 dark:border-dark-border-primary"></canvas>
                </div>
            </div>
        `;
        
        this.canvas = this.container.querySelector('#pdf-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.loadingOverlay = this.container.querySelector('#pdf-loading-overlay');
        
        // Event listeners
        this.setupEventListeners();
        
        // Listener para redimensionamiento
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        if (this.pdfDoc && !this.pageRendering) {
            this.renderPage(this.pageNum);
        }
    }

    setupEventListeners() {
        const prevBtn = this.container.querySelector('#pdf-prev');
        const nextBtn = this.container.querySelector('#pdf-next');
        const zoomInBtn = this.container.querySelector('#pdf-zoom-in');
        const zoomOutBtn = this.container.querySelector('#pdf-zoom-out');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.onPrevPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.onNextPage());
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
    }

    async loadPDF(url, authToken = null) {
        try {
            // Esperar a que PDF.js esté disponible
            console.log('⏳ Esperando a que PDF.js esté disponible...');
            const pdfjsLib = await this.waitForPdfJs();
            console.log('✅ PDF.js disponible, cargando PDF desde:', url);

            // NO mostrar loader porque ya destruiría el canvas
            // this.showLoader();

            // Configurar headers si hay token
            const loadingTask = authToken 
                ? pdfjsLib.getDocument({
                    url: url,
                    httpHeaders: {
                        'Authorization': `Bearer ${authToken}`
                    }
                })
                : pdfjsLib.getDocument(url);

            this.pdfDoc = await loadingTask.promise;
            
            // Guardar datos para descarga
            this.pdfData = { url, authToken };
            
            // Actualizar contador de páginas
            const pageCount = this.container.querySelector('#pdf-page-count');
            if (pageCount) pageCount.textContent = this.pdfDoc.numPages;
            
            console.log('✅ PDF cargado correctamente:', this.pdfDoc.numPages, 'páginas');
            
            // Renderizar primera página
            await this.renderPage(1);
            
            // Ocultar loader
            this.hideLoader();
            
        } catch (error) {
            console.error('❌ Error al cargar PDF:', error);
            console.error('URL intentada:', url);
            console.error('Stack:', error.stack);
            this.showError('No se pudo cargar el PDF. Por favor, intente nuevamente.');
            throw error;
        }
    }

    async renderPage(num) {
        if (!this.pdfDoc) {
            console.warn('⚠️ No hay documento PDF para renderizar');
            return;
        }
        
        console.log(`📄 Renderizando página ${num} de ${this.pdfDoc.numPages}`);
        this.pageRendering = true;

        try {
            const page = await this.pdfDoc.getPage(num);
            console.log('✅ Página obtenida, creando viewport...');
            
            // Obtener el ancho del contenedor
            const containerEl = this.container.querySelector('.pdf-canvas-container');
            const isMobile = window.innerWidth < 768;
            
            // En móviles, usar casi todo el ancho disponible (solo 4px de margen)
            // En desktop, dejar más espacio (32px)
            const padding = isMobile ? 4 : 32;
            const containerWidth = containerEl.clientWidth - padding;
            
            // Calcular escala basada en el ancho del contenedor
            const viewport = page.getViewport({ scale: 1.0 });
            const baseScale = containerWidth / viewport.width;
            
            // Aplicar escala directamente sin multiplicadores adicionales
            // - En móviles: usar baseScale directamente para llenar el ancho
            // - En desktop: multiplicar por this.scale (zoom manual del usuario)
            const displayScale = isMobile 
                ? baseScale  // Usar escala completa en móviles
                : (baseScale * this.scale); // Permitir zoom en desktop
            
            // Obtener pixel ratio para alta resolución (evita pixelado)
            const pixelRatio = window.devicePixelRatio || 1;
            
            // Escala final incluye el pixelRatio
            const finalScale = displayScale * pixelRatio;
            
            const scaledViewport = page.getViewport({ scale: finalScale });

            // Configurar dimensiones del canvas
            this.canvas.width = scaledViewport.width;
            this.canvas.height = scaledViewport.height;
            
            // Ajustar el tamaño visual del canvas (CSS) - sin pixelRatio
            this.canvas.style.width = Math.floor(scaledViewport.width / pixelRatio) + 'px';
            this.canvas.style.height = Math.floor(scaledViewport.height / pixelRatio) + 'px';
            
            // En móviles quitar el borde
            if (isMobile) {
                this.canvas.classList.remove('border', 'border-gray-300', 'dark:border-dark-border-primary');
            } else {
                this.canvas.classList.add('border', 'border-gray-300', 'dark:border-dark-border-primary');
            }
            
            console.log(`📐 Canvas configurado: ${this.canvas.style.width}x${this.canvas.style.height} visual, ${this.canvas.width}x${this.canvas.height} real (escala: ${displayScale.toFixed(2)}, móvil: ${isMobile}, pixelRatio: ${pixelRatio})`);

            // Renderizar página
            const renderContext = {
                canvasContext: this.ctx,
                viewport: scaledViewport
            };

            console.log('🎨 Iniciando renderizado...');
            await page.render(renderContext).promise;
            console.log('✅ Página renderizada correctamente');
            
            this.pageRendering = false;
            
            // Actualizar número de página
            this.pageNum = num;
            const pageNumSpan = this.container.querySelector('#pdf-page-num');
            if (pageNumSpan) pageNumSpan.textContent = num;
            
            // Actualizar estado de botones
            this.updateButtons();
            
            // Si hay una página pendiente, renderizarla
            if (this.pageNumPending !== null) {
                this.renderPage(this.pageNumPending);
                this.pageNumPending = null;
            }
            
        } catch (error) {
            console.error('Error al renderizar página:', error);
            this.pageRendering = false;
        }
    }

    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }

    onPrevPage() {
        if (this.pageNum <= 1) return;
        this.pageNum--;
        this.queueRenderPage(this.pageNum);
    }

    onNextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) return;
        this.pageNum++;
        this.queueRenderPage(this.pageNum);
    }

    zoomIn() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) return; // No zoom en móviles
        
        this.scale += 0.25;
        if (this.scale > 3) this.scale = 3;
        this.updateZoomLevel();
        this.queueRenderPage(this.pageNum);
    }

    zoomOut() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) return; // No zoom en móviles
        
        this.scale -= 0.25;
        if (this.scale < 0.5) this.scale = 0.5;
        this.updateZoomLevel();
        this.queueRenderPage(this.pageNum);
    }

    updateZoomLevel() {
        const zoomSpan = this.container.querySelector('#pdf-zoom-level');
        const isMobile = window.innerWidth < 768;
        if (zoomSpan) {
            const displayScale = isMobile ? 100 : Math.round(this.scale * 100);
            zoomSpan.textContent = displayScale + '%';
        }
    }

    updateButtons() {
        const prevBtn = this.container.querySelector('#pdf-prev');
        const nextBtn = this.container.querySelector('#pdf-next');
        
        if (prevBtn) prevBtn.disabled = this.pageNum <= 1;
        if (nextBtn) nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages;
    }

    hideLoader() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
            console.log('🎉 Loader ocultado, PDF visible');
        }
    }

    showLoader() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
                        <p class="text-gray-600 dark:text-dark-text-secondary">Cargando PDF...</p>
                    </div>
                </div>
            `;
        }
    }

    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center p-6">
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p class="text-gray-600 dark:text-dark-text-secondary mb-2">${message}</p>
                    </div>
                </div>
            `;
        }
    }

    getPDFData() {
        return this.pdfData;
    }

    destroy() {
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }
    }
}

// Exportar para uso global
window.PDFViewer = PDFViewer;

export default PDFViewer;
