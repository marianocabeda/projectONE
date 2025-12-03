/**
 * Custom Select Component - Selector desplegable personalizado
 * Componente reutilizable para crear selectores tipo dropdown
 * Similar al comportamiento de los selectores en register_step4.js
 */

(function() {
    'use strict';

    /**
     * Crea un selector desplegable personalizado
     * @param {Object} options - Configuración del selector
     * @param {string} options.buttonId - ID del botón principal
     * @param {string} options.overlayId - ID del contenedor overlay
     * @param {string} options.placeholder - Texto placeholder
     * @param {string} options.labelClass - Clase CSS para el label
     * @param {string} options.chevronClass - Clase CSS para el chevron
     * @param {Function} options.onSelect - Callback cuando se selecciona un item
     * @returns {Object} API del selector
     */
    function createCustomSelect(options) {
        const {
            buttonId,
            overlayId,
            placeholder = 'Seleccione una opción...',
            labelClass = 'select-label',
            chevronClass = 'select-chevron',
            onSelect = () => {}
        } = options;

        const button = document.getElementById(buttonId);
        const overlay = document.getElementById(overlayId);

        if (!button || !overlay) {
            console.error(`CustomSelect: No se encontró el botón (${buttonId}) o el overlay (${overlayId})`);
            return null;
        }

        // Estado del selector
        let items = [];
        let selectedId = null;
        let selectedItem = null;
        let outsideHandler = null;
        let currentZ = 2000;

        // Elementos internos
        const label = button.querySelector(`.${labelClass}`);
        const chevron = button.querySelector(`.${chevronClass}`);

        /**
         * Popula el selector con items
         */
        function populate(newItems, preSelectedId = null) {
            items = newItems || [];
            overlay._items = items;
            overlay.innerHTML = '';

            if (!items || items.length === 0) {
                button.disabled = true;
                if (label) label.textContent = 'No hay opciones disponibles';
                overlay.classList.add('hidden');
                return;
            }

            button.disabled = false;
            if (label) label.textContent = placeholder;

            // Crear panel
            const panel = document.createElement('div');
            panel.className = 'absolute left-0 right-0 w-full mt-1 bg-white dark:bg-dark-bg-card rounded-md shadow-lg dark:shadow-black/50 border border-gray-200 dark:border-dark-border-primary opacity-0 translate-y-1 transition-all duration-150';
            panel.style.zIndex = '9999';
            panel.setAttribute('role', 'listbox');

            const list = document.createElement('div');
            list.className = 'py-1 w-full';
            list.style.maxHeight = '240px'; // Altura máxima para scroll
            list.style.overflowY = 'auto'; // Scroll vertical

            items.forEach(item => {
                const option = document.createElement('div');
                option.className = 'px-4 py-2 hover:bg-principal-50 dark:hover:bg-dark-bg-hover cursor-pointer transition-colors text-gray-900 dark:text-dark-text-primary';
                option.setAttribute('role', 'option');
                option.setAttribute('data-value', item.id);
                option.textContent = item.nombre;

                option.addEventListener('click', () => {
                    selectItem(item);
                    close();
                });

                list.appendChild(option);
            });

            panel.appendChild(list);
            overlay.appendChild(panel);

            // Animar entrada
            requestAnimationFrame(() => {
                panel.classList.remove('opacity-0', 'translate-y-1');
                panel.classList.add('opacity-100', 'translate-y-0');
            });

            // Si hay un item pre-seleccionado, marcarlo
            if (preSelectedId) {
                const item = items.find(i => i.id == preSelectedId);
                if (item) {
                    selectItem(item, true); // true = no trigger callback
                }
            }
        }

        /**
         * Selecciona un item
         */
        function selectItem(item, silent = false) {
            selectedId = item.id;
            selectedItem = item;

            if (label) {
                label.textContent = item.nombre;
                label.classList.add('text-gray-900');
            }

            // Marcar visualmente el item seleccionado
            const options = overlay.querySelectorAll('[role="option"]');
            options.forEach(opt => {
                if (opt.getAttribute('data-value') == item.id) {
                    opt.classList.add('bg-principal-100', 'dark:bg-dark-principal-900/20', 'font-medium');
                } else {
                    opt.classList.remove('bg-principal-100', 'dark:bg-dark-principal-900/20', 'font-medium');
                }
            });

            // Llamar callback
            if (!silent && onSelect) {
                onSelect(item);
            }
        }

        /**
         * Abre el selector
         */
        function open() {
            if (button.disabled || items.length === 0) return;

            overlay.classList.remove('hidden');
            overlay.style.zIndex = ++currentZ;
            button.setAttribute('aria-expanded', 'true');
            if (chevron) chevron.textContent = '⌃';

            // Click fuera para cerrar
            setTimeout(() => {
                outsideHandler = (e) => {
                    if (!overlay.contains(e.target) && !button.contains(e.target)) {
                        close();
                    }
                };
                document.addEventListener('click', outsideHandler);
            }, 0);
        }

        /**
         * Cierra el selector
         */
        function close() {
            overlay.classList.add('hidden');
            button.setAttribute('aria-expanded', 'false');
            if (chevron) chevron.textContent = '⌄';

            if (outsideHandler) {
                document.removeEventListener('click', outsideHandler);
                outsideHandler = null;
            }
        }

        /**
         * Toggle open/close
         */
        function toggle() {
            if (overlay.classList.contains('hidden')) {
                open();
            } else {
                close();
            }
        }

        /**
         * Resetea el selector
         */
        function reset() {
            selectedId = null;
            selectedItem = null;
            if (label) {
                label.textContent = placeholder;
                label.classList.remove('text-gray-900');
            }
            close();
        }

        /**
         * Habilita/deshabilita el selector
         */
        function setDisabled(disabled) {
            button.disabled = disabled;
            if (disabled) {
                close();
                if (label) label.classList.add('text-gray-400');
            } else {
                if (label) label.classList.remove('text-gray-400');
            }
        }

        /**
         * Obtiene el valor seleccionado
         */
        function getValue() {
            return selectedId;
        }

        /**
         * Obtiene el item seleccionado completo
         */
        function getSelectedItem() {
            return selectedItem;
        }

        // Event listener del botón
        button.addEventListener('click', (e) => {
            console.log('🔥🔥🔥 BOTÓN CUSTOMSELECT CLICKEADO:', buttonId);
            e.stopPropagation();
            toggle();
        });

        // Configurar clases iniciales del overlay
        overlay.classList.add('absolute', 'left-0', 'right-0', 'w-full', 'mt-1', 'z-[70]');

        // API pública
        return {
            populate,
            selectItem,
            open,
            close,
            toggle,
            reset,
            setDisabled,
            getValue,
            getSelectedItem,
            get items() { return items; },
            get selectedId() { return selectedId; },
            get selectedItem() { return selectedItem; }
        };
    }

    // Exportar API global
    window.CustomSelect = {
        create: createCustomSelect
    };

    console.log('✅ CustomSelect component loaded');

})();
