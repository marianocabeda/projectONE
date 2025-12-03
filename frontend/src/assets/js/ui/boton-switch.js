/**
 * Componente de Botón/Switch Reutilizable
 * Permite crear botones con estilos consistentes y switches tipo toggle
 */

(function() {
    'use strict';

    /**
     * Clase Button - Componente de botón reutilizable con soporte para switches
     */
    class Button {
        constructor(options = {}) {
            this.options = {
                // Tipo de componente
                type: 'button', // 'button' o 'switch'

                // Colores por defecto
                bgColor: 'bg-principal-500',
                hoverColor: 'hover:bg-principal-600',
                textColor: 'text-white',
                borderColor: 'border-transparent',

                // Estados
                disabled: false,
                loading: false,

                // Estilos base
                baseClasses: 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm dark:shadow-black/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-dark-bg-primary',

                // Tamaños
                size: 'md', // sm, md, lg

                // Forma
                rounded: 'rounded-lg',

                // Iconos
                iconLeft: null,
                iconRight: null,

                // Callbacks
                onClick: null,

                // Para switches
                switchOptions: null, // { left: { text, icon, value }, right: { text, icon, value } }
                switchValue: null, // valor seleccionado
                onSwitchChange: null, // callback cuando cambia el switch

                ...options
            };

            this.element = null;
            this.switchIndicator = null;
            this.init();
        }

        /**
         * Inicializa el componente
         */
        init() {
            this.applySize();
            this.applyColors();
            this.applyStates();
        }

        /**
         * Aplica el tamaño del componente
         */
        applySize() {
            const sizeClasses = {
                sm: 'px-3 py-1.5 text-xs',
                md: 'px-4 py-2 text-sm',
                lg: 'px-6 py-3 text-base'
            };

            this.options.sizeClasses = sizeClasses[this.options.size] || sizeClasses.md;
        }

        /**
         * Aplica los colores del componente
         */
        applyColors() {
            // Extraer el color base del bgColor (ej: bg-principal-500 -> principal)
            const colorMatch = this.options.bgColor.match(/bg-(\w+)-\d+/);
            const colorBase = colorMatch ? colorMatch[1] : 'principal';

            // Generar colores relacionados
            this.options.focusRing = `focus:ring-${colorBase}-500`;
            this.options.activeColor = `active:bg-${colorBase}-700`;

            // Si no se especificó hoverColor, generar uno automático
            if (!this.options.hoverColor || this.options.hoverColor === 'hover:bg-principal-600') {
                const hoverMatch = this.options.bgColor.match(/bg-(\w+)-(\d+)/);
                if (hoverMatch) {
                    const num = parseInt(hoverMatch[2]);
                    this.options.hoverColor = `hover:bg-${hoverMatch[1]}-${Math.min(num + 100, 900)}`;
                }
            }
        }

        /**
         * Aplica los estados del componente
         */
        applyStates() {
            if (this.options.type === 'switch') {
                // Para switches, usamos estilos diferentes
                this.classes = [
                    'relative bg-gray-100 dark:bg-dark-bg-tertiary rounded-full p-1 flex shadow-lg dark:shadow-black/50 border border-gray-200 dark:border-dark-border-primary transition-all duration-300 w-full max-w-md'
                ];
            } else {
                // Para botones normales
                this.classes = [
                    this.options.baseClasses,
                    this.options.sizeClasses,
                    this.options.bgColor,
                    this.options.hoverColor,
                    this.options.textColor,
                    this.options.borderColor,
                    this.options.focusRing,
                    this.options.activeColor,
                    this.options.rounded
                ];
            }

            if (this.options.disabled) {
                this.classes.push('opacity-50 cursor-not-allowed');
            }

            if (this.options.loading) {
                this.classes.push('cursor-wait');
            }
        }

        /**
         * Crea el elemento HTML del componente
         */
        createElement() {
            if (this.options.type === 'switch') {
                return this.createSwitchElement();
            } else {
                return this.createButtonElement();
            }
        }

        /**
         * Crea un elemento de botón normal
         */
        createButtonElement() {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = this.classes.join(' ');

            // Agregar iconos si existen
            if (this.options.iconLeft) {
                const iconLeft = document.createElement('i');
                iconLeft.className = `${this.options.iconLeft} mr-2`;
                button.appendChild(iconLeft);
            }

            // Contenido del botón
            if (this.options.text) {
                const textSpan = document.createElement('span');
                textSpan.textContent = this.options.text;
                button.appendChild(textSpan);
            }

            // Agregar iconos si existen
            if (this.options.iconRight) {
                const iconRight = document.createElement('i');
                iconRight.className = `${this.options.iconRight} ml-2`;
                button.appendChild(iconRight);
            }

            // Estado de carga
            if (this.options.loading) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...';
            }

            // Event listener
            if (this.options.onClick && !this.options.disabled) {
                button.addEventListener('click', this.options.onClick);
            }

            this.element = button;
            return button;
        }

        /**
         * Crea un elemento de switch
         */
        createSwitchElement() {
            const switchContainer = document.createElement('div');
            switchContainer.className = this.classes.join(' ');

            // Indicador deslizante
            const indicator = document.createElement('div');
            indicator.className = `absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] bg-principal-500 dark:bg-dark-principal-600 rounded-full shadow-md dark:shadow-black/60 transition-all duration-300 ease-in-out transform ${this.options.switchValue === this.options.switchOptions?.right?.value ? 'translate-x-full' : ''}`;
            indicator.style.opacity = (this.options.switchValue === this.options.switchOptions?.left?.value || this.options.switchValue === this.options.switchOptions?.right?.value) ? '1' : '0';
            this.switchIndicator = indicator;
            switchContainer.appendChild(indicator);

            // Opción izquierda
            const leftOption = document.createElement('button');
            leftOption.type = 'button';
            leftOption.className = `relative z-10 flex-1 text-center py-3 px-4 rounded-full transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-principal-300 dark:focus:ring-dark-principal-600 ${this.options.switchValue === this.options.switchOptions?.left?.value ? 'text-white' : 'text-gray-500 dark:text-dark-text-secondary'}`;
            leftOption.dataset.value = this.options.switchOptions?.left?.value || 'left';

            if (this.options.switchOptions?.left?.icon) {
                const icon = document.createElement('i');
                icon.className = `${this.options.switchOptions.left.icon} mr-2`;
                leftOption.appendChild(icon);
            }

            const leftText = document.createElement('span');
            leftText.textContent = this.options.switchOptions?.left?.text || 'Opción 1';
            leftOption.appendChild(leftText);

            leftOption.addEventListener('click', () => this.handleSwitchChange(this.options.switchOptions?.left?.value || 'left'));
            switchContainer.appendChild(leftOption);

            // Opción derecha
            const rightOption = document.createElement('button');
            rightOption.type = 'button';
            rightOption.className = `relative z-10 flex-1 text-center py-3 px-4 rounded-full transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-principal-300 dark:focus:ring-dark-principal-600 ${this.options.switchValue === this.options.switchOptions?.right?.value ? 'text-white' : 'text-gray-500 dark:text-dark-text-secondary'}`;
            rightOption.dataset.value = this.options.switchOptions?.right?.value || 'right';

            if (this.options.switchOptions?.right?.icon) {
                const icon = document.createElement('i');
                icon.className = `${this.options.switchOptions.right.icon} mr-2`;
                rightOption.appendChild(icon);
            }

            const rightText = document.createElement('span');
            rightText.textContent = this.options.switchOptions?.right?.text || 'Opción 2';
            rightOption.appendChild(rightText);

            rightOption.addEventListener('click', () => this.handleSwitchChange(this.options.switchOptions?.right?.value || 'right'));
            switchContainer.appendChild(rightOption);

            // Efectos hover
            [leftOption, rightOption].forEach(option => {
                option.addEventListener('mouseenter', () => {
                    if (!this.options.switchValue || option.dataset.value !== this.options.switchValue) {
                        option.classList.add('scale-105');
                    }
                });
                option.addEventListener('mouseleave', () => {
                    option.classList.remove('scale-105');
                });
            });

            this.element = switchContainer;
            return switchContainer;
        }

        /**
         * Maneja el cambio de valor en el switch
         */
        handleSwitchChange(value) {
            if (this.options.disabled) return;

            this.options.switchValue = value;

            // Actualizar apariencia
            this.updateSwitchAppearance();

            // Callback
            if (this.options.onSwitchChange) {
                this.options.onSwitchChange(value);
            }
        }

        /**
         * Actualiza la apariencia del switch
         */
        updateSwitchAppearance() {
            if (!this.element || this.options.type !== 'switch') return;

            const leftOption = this.element.children[1]; // índice 1 porque 0 es el indicador
            const rightOption = this.element.children[2];

            // Actualizar indicador - si no hay selección, mostrar en posición izquierda
            if (this.switchIndicator) {
                const isRightSelected = this.options.switchValue === this.options.switchOptions?.right?.value;
                const isLeftSelected = this.options.switchValue === this.options.switchOptions?.left?.value;
                
                if (isRightSelected) {
                    this.switchIndicator.classList.add('translate-x-full');
                    this.switchIndicator.style.opacity = '1';
                } else if (isLeftSelected) {
                    this.switchIndicator.classList.remove('translate-x-full');
                    this.switchIndicator.style.opacity = '1';
                } else {
                    // Si no hay selección, ocultar completamente el indicador
                    this.switchIndicator.classList.remove('translate-x-full');
                    this.switchIndicator.style.opacity = '0';
                }
            }

            // Actualizar colores del texto
            if (leftOption && rightOption) {
                const isLeftSelected = this.options.switchValue === this.options.switchOptions?.left?.value;
                const isRightSelected = this.options.switchValue === this.options.switchOptions?.right?.value;
                
                leftOption.classList.toggle('text-white', isLeftSelected);
                leftOption.classList.toggle('text-gray-500', !isLeftSelected);
                leftOption.classList.toggle('dark:text-dark-text-secondary', !isLeftSelected);

                rightOption.classList.toggle('text-white', isRightSelected);
                rightOption.classList.toggle('text-gray-500', !isRightSelected);
                rightOption.classList.toggle('dark:text-dark-text-secondary', !isRightSelected);
            }
        }

        /**
         * Actualiza las opciones del componente
         */
        update(options = {}) {
            this.options = { ...this.options, ...options };
            this.init();

            if (this.element) {
                if (this.options.type === 'switch') {
                    this.element.className = this.classes.join(' ');
                    this.updateSwitchAppearance();
                } else {
                    this.element.className = this.classes.join(' ');
                    this.element.disabled = this.options.disabled;

                    if (this.options.loading) {
                        this.element.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cargando...';
                    }
                }
            }
        }

        /**
         * Obtiene el elemento HTML
         */
        getElement() {
            if (!this.element) {
                this.createElement();
            }
            return this.element;
        }

        /**
         * Obtiene el valor actual del switch
         */
        getValue() {
            if (this.options.type === 'switch') {
                return this.options.switchValue;
            }
            return null;
        }

        /**
         * Establece el valor del switch
         */
        setValue(value) {
            if (this.options.type === 'switch') {
                this.options.switchValue = value;
                this.updateSwitchAppearance();
            }
        }

        /**
         * Destruye el componente
         */
        destroy() {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
            this.switchIndicator = null;
        }
    }

    /**
     * Función de fábrica para crear botones fácilmente
     */
    function createButton(options = {}) {
        return new Button(options);
    }

    /**
     * Función de fábrica para crear switches fácilmente
     */
    function createSwitch(options = {}) {
        return new Button({
            type: 'switch',
            ...options
        });
    }

    /**
     * Inicializa botones desde elementos HTML con atributos data-
     */
    function initButtons() {
        // Inicializar botones normales
        const buttonElements = document.querySelectorAll('[data-button]');
        buttonElements.forEach(element => {
            const bgColor = element.getAttribute('data-bg') || 'bg-principal-500';
            const size = element.getAttribute('data-size') || 'md';
            const text = element.textContent.trim();
            const iconLeft = element.getAttribute('data-icon-left');
            const iconRight = element.getAttribute('data-icon-right');
            const disabled = element.hasAttribute('disabled');

            const options = {
                bgColor,
                size,
                text,
                iconLeft,
                iconRight,
                disabled
            };

            const button = new Button(options);
            const newElement = button.getElement();

            // Copiar atributos importantes
            if (element.id) newElement.id = element.id;
            if (element.classList.contains('w-full')) newElement.classList.add('w-full');

            // Reemplazar el elemento
            element.parentNode.replaceChild(newElement, element);
        });

        // Inicializar switches
        const switchElements = document.querySelectorAll('[data-switch]');
        switchElements.forEach(element => {
            const leftText = element.getAttribute('data-left-text') || 'Opción 1';
            const leftIcon = element.getAttribute('data-left-icon');
            const leftValue = element.getAttribute('data-left-value') || 'left';
            const rightText = element.getAttribute('data-right-text') || 'Opción 2';
            const rightIcon = element.getAttribute('data-right-icon');
            const rightValue = element.getAttribute('data-right-value') || 'right';
            const defaultValue = element.getAttribute('data-value') || leftValue;
            const disabled = element.hasAttribute('disabled');

            const options = {
                type: 'switch',
                switchOptions: {
                    left: { text: leftText, icon: leftIcon, value: leftValue },
                    right: { text: rightText, icon: rightIcon, value: rightValue }
                },
                switchValue: defaultValue,
                disabled
            };

            const switchComponent = new Button(options);
            const newElement = switchComponent.getElement();

            // Copiar atributos importantes
            if (element.id) newElement.id = element.id;

            // Reemplazar el elemento
            element.parentNode.replaceChild(newElement, element);
        });
    }

    // Exponer globalmente
    window.Button = Button;
    window.createButton = createButton;
    window.createSwitch = createSwitch;
    window.initButtons = initButtons;

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initButtons);
    } else {
        initButtons();
    }

})();