/**
 * FloatingModal - reusable centered floating modal component
 * Usage:
 *   import FloatingModal from '../ui/modal-flotante.js'
 *   const modal = new FloatingModal({ title, html, buttons, onClose, showCloseButton })
 *   modal.show()
 */
export default class FloatingModal {
    constructor(opts = {}) {
        this.title = opts.title || '';
        this.html = opts.html || '';
        this.buttons = Array.isArray(opts.buttons) ? opts.buttons : [];
        this.closeOnOverlayClick = typeof opts.closeOnOverlayClick === 'boolean' ? opts.closeOnOverlayClick : true;
        this.closeOnEsc = typeof opts.closeOnEsc === 'boolean' ? opts.closeOnEsc : true;
        this.showCloseButton = typeof opts.showCloseButton === 'boolean' ? opts.showCloseButton : true;
        this.onClose = typeof opts.onClose === 'function' ? opts.onClose : null;
        this.onSubmit = typeof opts.onSubmit === 'function' ? opts.onSubmit : null;

        // Generated elements
        this._overlay = null;
        this._panel = null;
        this._id = `floating-modal-${Math.random().toString(36).slice(2,9)}`;
        this._handleEsc = this._handleEsc.bind(this);
    }

    _create() {
        // Overlay - Centrado y responsive con menos opacidad
        const overlay = document.createElement('div');
        overlay.className = 'floating-modal-overlay fixed inset-0 bg-black/20 dark:bg-black/70 z-[9999] backdrop-blur-sm flex items-center justify-center p-4';
        overlay.dataset.modalId = this._id;

        // Panel - Responsive y centrado (dentro del overlay)
        const panel = document.createElement('div');
        panel.className = 'floating-modal-panel bg-white dark:bg-dark-bg-secondary rounded-xl w-full max-w-md shadow-2xl dark:shadow-black/50 p-6 max-h-[90vh] overflow-y-auto shrink-0 border border-gray-200 dark:border-dark-border-primary';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', `${this._id}-title`);
        panel.dataset.modalId = this._id;

        // Header con botón de cierre opcional
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-4';

        const title = document.createElement('h2');
        title.id = `${this._id}-title`;
        title.className = 'text-2xl font-bold text-gray-900 dark:text-dark-text-primary m-0';
        title.textContent = this.title;

        header.appendChild(title);

        // Botón de cierre opcional
        if (this.showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text-secondary transition-colors focus:outline-none';
            closeBtn.setAttribute('aria-label', 'Cerrar');
            closeBtn.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            `;
            closeBtn.addEventListener('click', () => this.close());
            header.appendChild(closeBtn);
        }

        // Body
        const body = document.createElement('div');
        body.className = 'floating-modal-body py-4 text-gray-700 dark:text-dark-text-primary';
        body.id = `${this._id}-body`;
        if (typeof this.html === 'string') {
            // Si sanitize=false, confiar en el contenido (HTML interno)
            if (this.sanitize === false) {
                body.innerHTML = this.html;
            } else {
                // Detectar si el contenido tiene HTML válido (tags)
                if (/<[a-z][\s\S]*>/i.test(this.html)) {
                    // Permitir HTML interno de confianza (ya viene del frontend)
                    body.innerHTML = this.html;
                } else if (window.Sanitizer) {
                    // Texto plano: sanitizar
                    body.innerHTML = window.Sanitizer.escapeHTML(this.html);
                } else {
                    // Fallback: usar textContent si no hay Sanitizer
                    body.textContent = this.html;
                }
            }
        } else if (this.html instanceof Node) {
            body.appendChild(this.html);
        }

        // Actions
        const actions = document.createElement('div');
        actions.className = 'floating-modal-actions flex gap-3 mt-6';

        // Create buttons
        this.buttons.forEach((b, idx) => {
            const btn = document.createElement('button');
            btn.type = b.type || 'button';
            btn.textContent = b.label || `Button ${idx+1}`;
            
            // Si el usuario pasó clases, usar esas. Si no, aplicar clases personalizadas
            if (b.className) {
                btn.className = b.className;
            } else {
                if (b.primary) {
                    btn.className = 'flex-1 px-4 py-3 bg-principal-500 dark:bg-dark-principal-600 text-white font-semibold rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary focus:ring-principal-500 dark:focus:ring-dark-principal-600';
                } else {
                    btn.className = 'flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-hover transition focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary focus:ring-gray-300 dark:focus:ring-dark-border-primary';
                }
            }

            btn.addEventListener('click', (ev) => {
                try {
                    if (typeof b.onClick === 'function') b.onClick(ev, this);
                } catch (err) {
                    // Silencioso
                }
            });

            actions.appendChild(btn);
        });

        panel.appendChild(header);
        panel.appendChild(body);
        if (this.buttons.length > 0) {
            panel.appendChild(actions);
        }

        // Agregar panel dentro del overlay para que funcione el centrado con flexbox
        overlay.appendChild(panel);

        this._overlay = overlay;
        this._panel = panel;

        // Overlay click
        if (this.closeOnOverlayClick) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close();
            });
        }
    }

    _handleEsc(e) {
        if (this.closeOnEsc && e.key === 'Escape') this.close();
    }

    show() {
        if (!this._panel || !this._overlay) this._create();
        // Solo agregar el overlay; el panel ya está dentro
        document.body.appendChild(this._overlay);
        document.addEventListener('keydown', this._handleEsc);

        // Focus first action button if present
        const firstAction = this._panel.querySelector('.floating-modal-actions button');
        if (firstAction) firstAction.focus();
    }

    close() {
        try {
            if (this._overlay && this._overlay.parentElement) {
                this._overlay.parentElement.removeChild(this._overlay);
            }
        } catch (e) {
            // ignore
        }
        document.removeEventListener('keydown', this._handleEsc);
        if (typeof this.onClose === 'function') {
            try { this.onClose(); } catch (e) { /* silencioso */ }
        }
    }

    /**
     * Obtiene el elemento del body para manipulación dinámica
     */
    getBody() {
        return this._panel ? this._panel.querySelector(`#${this._id}-body`) : null;
    }

    /**
     * Actualiza el contenido HTML del modal
     */
    updateContent(html) {
        const body = this.getBody();
        if (body) {
            if (typeof html === 'string') {
                body.innerHTML = html;
            } else if (html instanceof Node) {
                body.innerHTML = '';
                body.appendChild(html);
            }
        }
    }
}
