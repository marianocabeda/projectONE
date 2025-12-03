/**
 * Componente de Modal de Errores
 * Responsable ÚNICAMENTE de la presentación visual de errores
 * La lógica de parsing y procesamiento está en errorHandler.js
 */
(function() {
  'use strict';

/**
 * Muestra un modal flotante con errores
 * @param {Object|string} errors - Objeto con errores { campo: "mensaje" } o string simple
 * @param {string} title - Título del modal
 */
function show(errors, title = 'Error') {
    // Normalizar errores a objeto
    let errorsObj = {};
    if (typeof errors === 'string') {
        errorsObj._general = errors;
    } else if (errors && typeof errors === 'object') {
        errorsObj = errors;
    } else {
        errorsObj._general = 'Ha ocurrido un error inesperado';
    }

    // Remover modal existente
    clear();

    // Crear panel modal
    const panel = createModalPanel(errorsObj, title);
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
 * @param {Object} errorsObj - Objeto con errores normalizados
 * @param {string} title - Título del modal
 * @returns {HTMLElement} Elemento del panel
 */
function createModalPanel(errorsObj, title) {
    const panel = document.createElement('div');
    panel.id = 'error-modal-panel';
    panel.className = 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] max-w-2xl w-[90%] bg-white dark:bg-dark-bg-secondary border-2 border-error-300 dark:border-red-700 rounded-lg shadow-2xl dark:shadow-black/50 opacity-0 scale-95 transition-all duration-300 ease-out';
    panel.setAttribute('role', 'alert');
    panel.setAttribute('aria-live', 'assertive');

    // Construir contenido
    panel.appendChild(createHeader(title));
    panel.appendChild(createBody(errorsObj));
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
    header.className = 'flex items-center justify-between px-4 py-3 bg-error-50 dark:bg-red-900/20 border-b border-error-200 dark:border-red-700 rounded-t-lg';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex items-center gap-2';
    
    // Icono de advertencia
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'h-6 w-6 text-error-600 dark:text-red-400');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path1.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z');
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '12');
    line1.setAttribute('y1', '9');
    line1.setAttribute('x2', '12');
    line1.setAttribute('y2', '13');
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '12');
    line2.setAttribute('y1', '17');
    line2.setAttribute('x2', '12.01');
    line2.setAttribute('y2', '17');
    icon.appendChild(path1);
    icon.appendChild(line1);
    icon.appendChild(line2);
    titleContainer.appendChild(icon);
    
    const h = document.createElement('strong');
    h.className = 'text-error-700 dark:text-red-300 text-lg';
    h.textContent = title;
    titleContainer.appendChild(h);
    
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'text-error-400 dark:text-red-600 hover:text-error-600 dark:hover:text-red-400 text-3xl font-bold leading-none transition-colors';
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.setAttribute('data-close-modal', 'true');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeModal);
    
    header.appendChild(titleContainer);
    header.appendChild(closeBtn);
    
    return header;
}

/**
 * Crea el body del modal con la lista de errores
 * @param {Object} errorsObj - Errores normalizados
 * @returns {HTMLElement}
 */
function createBody(errorsObj) {
    const body = document.createElement('div');
    body.className = 'px-6 py-4';

    const list = document.createElement('ul');
    list.className = 'space-y-2 text-sm text-gray-800 dark:text-dark-text-primary';

    const errorKeys = Object.keys(errorsObj);
    const hasOnlyGeneral = errorKeys.length === 1 && errorKeys[0] === '_general';

    // Si solo hay error general, mostrarlo destacado
    if (hasOnlyGeneral && errorsObj._general) {
        list.appendChild(createGeneralErrorItem(errorsObj._general));
    } else {
        // Mostrar error general primero si existe
        if (errorsObj._general) {
            list.appendChild(createGeneralErrorItem(errorsObj._general));
        }

        // Mostrar errores de campos específicos
        Object.keys(errorsObj).forEach(key => {
            if (key === '_general') return;
            list.appendChild(createFieldErrorItem(key, errorsObj[key]));
        });
    }

    body.appendChild(list);
    return body;
}

/**
 * Crea un item de error general
 * @param {string} message - Mensaje de error
 * @returns {HTMLElement}
 */
function createGeneralErrorItem(message) {
    const li = document.createElement('li');
    li.className = 'flex items-start gap-2 p-3 bg-error-50 dark:bg-red-900/20 rounded border-l-4 border-error-500 dark:border-red-600';
    
    // Crear estructura con DOM API (más seguro que innerHTML)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'h-5 w-5 text-error-500 dark:text-red-400 flex-shrink-0 mt-0.5');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('viewBox', '0 0 20 20');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('d', 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z');
    path.setAttribute('clip-rule', 'evenodd');
    svg.appendChild(path);
    li.appendChild(svg);
    
    const span = document.createElement('span');
    span.className = 'flex-1';
    // Permitir HTML solo si viene de backend (ya sanitizado) o es interno
    // Detectar si el mensaje tiene tags HTML válidos
    if (/<[a-z][\s\S]*>/i.test(message)) {
        span.innerHTML = message; // Permitir HTML del backend
    } else {
        span.textContent = message; // Escapar texto plano
    }
    li.appendChild(span);
    
    return li;
}

/**
 * Crea un item de error de campo
 * @param {string} fieldName - Nombre del campo
 * @param {string} message - Mensaje de error
 * @returns {HTMLElement}
 */
function createFieldErrorItem(fieldName, message) {
    const li = document.createElement('li');
    li.className = 'flex items-start gap-2';
    const label = formatFieldName(fieldName);
    
    // Crear estructura con DOM API
    const bullet = document.createElement('span');
    bullet.className = 'text-error-500 dark:text-red-400 font-bold';
    bullet.textContent = '•';
    li.appendChild(bullet);
    
    const spanOuter = document.createElement('span');
    const spanLabel = document.createElement('span');
    spanLabel.className = 'font-semibold text-error-700 dark:text-red-300';
    spanLabel.textContent = label + ': ';
    spanOuter.appendChild(spanLabel);
    spanOuter.appendChild(document.createTextNode(message));
    li.appendChild(spanOuter);
    return li;
}

/**
 * Formatea el nombre del campo para mostrarlo
 * @param {string} fieldName - Nombre del campo
 * @returns {string} Nombre formateado
 */
function formatFieldName(fieldName) {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    btnClose.className = 'px-4 py-2 rounded-md bg-error-600 dark:bg-red-700 text-white font-medium hover:bg-error-700 dark:hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 dark:focus:ring-red-600 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary';
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
    overlay.id = 'error-modal-overlay';
    overlay.className = 'fixed inset-0 bg-black/20 dark:bg-black/70 backdrop-blur-sm z-[9998] opacity-0 transition-opacity duration-300 ease-out';
    overlay.addEventListener('click', closeModal);
    return overlay;
}

/**
 * Cierra el modal con animación
 */
function closeModal() {
    const panel = document.getElementById('error-modal-panel');
    const overlay = document.getElementById('error-modal-overlay');
    
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
    const panel = document.getElementById('error-modal-panel');
    const overlay = document.getElementById('error-modal-overlay');
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
window.ErrorModal = {
    show: show,
    clear: clear
};

})(); // Fin del IIFE
