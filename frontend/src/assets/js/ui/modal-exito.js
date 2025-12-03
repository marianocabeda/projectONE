/**
 * Componente de Modal de Éxito
 * Muestra mensajes de operaciones exitosas con estilo verde
 */
(function() {
  'use strict';

/**
 * Muestra un modal flotante de éxito
 * @param {string} message - Mensaje de éxito
 * @param {string} title - Título del modal (por defecto "Operación exitosa")
 */
function show(message, title = 'Operación exitosa') {
    // Remover modal existente
    clear();

    // Crear panel modal
    const panel = createModalPanel(message, title);
    const overlay = createOverlay();

    // Añadir al DOM
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Animar entrada
    requestAnimationFrame(() => {
        overlay.classList.add('opacity-100');
        overlay.classList.remove('opacity-0');
        panel.classList.add('opacity-100', 'scale-100');
        panel.classList.remove('opacity-0', 'scale-95');
    });

    // Focus en botón de cierre para accesibilidad
    const closeBtn = panel.querySelector('[data-close-modal]');
    if (closeBtn) closeBtn.focus();

    // Soporte para cerrar con ESC
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/**
 * Crea el panel del modal
 * @param {string} message - Mensaje de éxito
 * @param {string} title - Título del modal
 * @returns {HTMLElement} Elemento del panel
 */
function createModalPanel(message, title) {
    const panel = document.createElement('div');
    panel.id = 'success-modal-panel';
    panel.className = 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] max-w-md w-[90%] bg-white dark:bg-dark-bg-secondary border-2 border-green-300 dark:border-green-700 rounded-lg shadow-2xl dark:shadow-black/50 opacity-0 scale-95 transition-all duration-300 ease-out';
    panel.setAttribute('role', 'alert');
    panel.setAttribute('aria-live', 'polite');

    // Construir contenido
    panel.appendChild(createHeader(title));
    panel.appendChild(createBody(message));
    panel.appendChild(createFooter());

    return panel;
}

/**
 * Crea el header del modal
 * @param {string} title - Título
 * @returns {HTMLElement}
 */
function createHeader(title) {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700 rounded-t-lg';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex items-center gap-2';
    
    // Icono de éxito
    const icon = document.createElement('svg');
    icon.className = 'h-6 w-6 text-green-600 dark:text-green-400';
    icon.setAttribute('fill', 'none');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('stroke', 'currentColor');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
    titleContainer.appendChild(icon);
    
    const h = document.createElement('strong');
    h.className = 'text-green-700 dark:text-green-300 text-lg';
    h.textContent = title;
    titleContainer.appendChild(h);
    
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'text-green-400 dark:text-green-600 hover:text-green-600 dark:hover:text-green-400 text-3xl font-bold leading-none transition-colors';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.setAttribute('data-close-modal', 'true');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeModal);
    
    header.appendChild(titleContainer);
    header.appendChild(closeBtn);
    
    return header;
}

/**
 * Crea el body del modal con el mensaje
 * @param {string} message - Mensaje de éxito
 * @returns {HTMLElement}
 */
function createBody(message) {
    const body = document.createElement('div');
    body.className = 'px-6 py-4';

    const messageContainer = document.createElement('div');
    messageContainer.className = 'flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-500 dark:border-green-600';
    messageContainer.innerHTML = `
        <svg class="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="flex-1 text-gray-800 dark:text-dark-text-primary">${message}</span>
    `;

    body.appendChild(messageContainer);
    return body;
}

/**
 * Crea el footer del modal
 * @returns {HTMLElement}
 */
function createFooter() {
    const footer = document.createElement('div');
    footer.className = 'px-6 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-t border-gray-200 dark:border-dark-border-primary flex justify-end gap-2 rounded-b-lg';
    
    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.className = 'px-4 py-2 rounded-md bg-green-600 dark:bg-green-700 text-white font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary';
    btnClose.textContent = 'Entendido';
    btnClose.setAttribute('data-close-modal', 'true');
    btnClose.addEventListener('click', closeModal);
    
    footer.appendChild(btnClose);
    return footer;
}

/**
 * Crea el overlay de fondo
 * @returns {HTMLElement}
 */
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'success-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-sm z-[9998] opacity-0 transition-opacity duration-300 ease-out';
    overlay.addEventListener('click', closeModal);
    return overlay;
}

/**
 * Cierra el modal con animación
 */
function closeModal() {
    const panel = document.getElementById('success-modal-panel');
    const overlay = document.getElementById('success-modal-overlay');
    
    if (!panel) return;
    
    // Animar salida
    panel.classList.add('opacity-0', 'scale-95');
    panel.classList.remove('opacity-100', 'scale-100');
    if (overlay) {
        overlay.classList.add('opacity-0');
        overlay.classList.remove('opacity-100');
    }
    
    setTimeout(() => {
        panel.remove();
        if (overlay) overlay.remove();
    }, 300);
}

/**
 * Limpia/cierra el modal sin animación
 */
function clear() {
    const panel = document.getElementById('success-modal-panel');
    const overlay = document.getElementById('success-modal-overlay');
    if (panel) panel.remove();
    if (overlay) overlay.remove();
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exportar API pública
window.SuccessModal = {
    show: show,
    clear: clear
};

})(); // Fin del IIFE
