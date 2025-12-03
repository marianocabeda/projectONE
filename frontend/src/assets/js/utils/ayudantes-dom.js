/**
 * Utilidades DOM - Helpers para manipulación del DOM
 * Funciones reutilizables para operaciones comunes en el DOM
 * @module dom-helpers
 */

(function() {
    'use strict';

    /**
     * Establece el texto de un elemento por ID
     * @param {string} id - ID del elemento
     * @param {string} text - Texto a establecer
     */
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }

    /**
     * Establece un atributo de un elemento por ID
     * @param {string} id - ID del elemento
     * @param {string} attr - Nombre del atributo
     * @param {string} value - Valor del atributo
     */
    function setAttr(id, attr, value) {
        const el = document.getElementById(id);
        if (el) el.setAttribute(attr, value || '');
    }

    /**
     * Establece el valor de un input por nombre
     * @param {string} name - Nombre del input
     * @param {string} value - Valor a establecer
     */
    function setValue(name, value) {
        const input = document.querySelector(`[name="${name}"]`);
        if (input) input.value = value || '';
    }

    /**
     * Obtiene el valor de un input por nombre
     * @param {string} name - Nombre del input
     * @returns {string} - Valor del input
     */
    function getValue(name) {
        const input = document.querySelector(`[name="${name}"]`);
        return input ? input.value : '';
    }

    /**
     * Formatea una fecha a formato local
     * @param {string} dateString - Fecha en formato ISO
     * @param {string} locale - Locale (por defecto 'es-AR')
     * @returns {string} - Fecha formateada
     */
    function formatDate(dateString, locale = 'es-AR') {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString(locale);
        } catch {
            return '';
        }
    }

    /**
     * Formatea una fecha con hora a formato local
     * @param {string} dateString - Fecha en formato ISO
     * @param {string} locale - Locale (por defecto 'es-AR')
     * @returns {string} - Fecha y hora formateadas
     */
    function formatDateTime(dateString, locale = 'es-AR') {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString(locale);
        } catch {
            return '';
        }
    }

    /**
     * Muestra u oculta un elemento
     * @param {string|HTMLElement} element - ID o elemento DOM
     * @param {boolean} show - Mostrar (true) u ocultar (false)
     */
    function toggleVisibility(element, show) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    /**
     * Habilita o deshabilita un elemento
     * @param {string|HTMLElement} element - ID o elemento DOM
     * @param {boolean} enabled - Habilitar (true) o deshabilitar (false)
     */
    function toggleEnabled(element, enabled) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        el.disabled = !enabled;
    }

    /**
     * Añade o remueve una clase CSS
     * @param {string|HTMLElement} element - ID o elemento DOM
     * @param {string} className - Nombre de la clase
     * @param {boolean} add - Añadir (true) o remover (false)
     */
    function toggleClass(element, className, add) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        if (add) {
            el.classList.add(className);
        } else {
            el.classList.remove(className);
        }
    }

    /**
     * Obtiene el valor de un formulario como objeto
     * @param {string|HTMLFormElement} form - ID o elemento form
     * @returns {Object} - Objeto con los valores del formulario
     */
    function getFormData(form) {
        const formElement = typeof form === 'string' ? document.getElementById(form) : form;
        if (!formElement) return {};

        const formData = new FormData(formElement);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    /**
     * Establece los valores de un formulario desde un objeto
     * @param {string|HTMLFormElement} form - ID o elemento form
     * @param {Object} data - Objeto con los valores a establecer
     */
    function setFormData(form, data) {
        const formElement = typeof form === 'string' ? document.getElementById(form) : form;
        if (!formElement || !data) return;

        Object.keys(data).forEach(key => {
            const input = formElement.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key] || '';
            }
        });
    }

    /**
     * Limpia todos los inputs de un formulario
     * @param {string|HTMLFormElement} form - ID o elemento form
     */
    function clearForm(form) {
        const formElement = typeof form === 'string' ? document.getElementById(form) : form;
        if (!formElement) return;

        formElement.reset();
    }

    /**
     * Hace scroll a un elemento suavemente
     * @param {string|HTMLElement} element - ID o elemento DOM
     * @param {string} block - Posición ('start', 'center', 'end', 'nearest')
     */
    function scrollToElement(element, block = 'center') {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block });
    }

    /**
     * Crea un elemento con clases y atributos
     * @param {string} tag - Tag del elemento
     * @param {Object} options - Opciones (classes, attributes, text, html)
     * @returns {HTMLElement}
     */
    function createElement(tag, options = {}) {
        const element = document.createElement(tag);

        if (options.classes) {
            if (Array.isArray(options.classes)) {
                element.classList.add(...options.classes);
            } else {
                element.className = options.classes;
            }
        }

        if (options.attributes) {
            Object.keys(options.attributes).forEach(attr => {
                element.setAttribute(attr, options.attributes[attr]);
            });
        }

        if (options.text) {
            element.textContent = options.text;
        }

        if (options.html) {
            element.innerHTML = options.html;
        }

        return element;
    }

    /**
     * Remueve todos los hijos de un elemento
     * @param {string|HTMLElement} element - ID o elemento DOM
     */
    function clearChildren(element) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    /**
     * Verifica si un elemento es visible en el viewport
     * @param {string|HTMLElement} element - ID o elemento DOM
     * @returns {boolean}
     */
    function isInViewport(element) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return false;

        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Exportar API
    window.DomHelpers = {
        setText,
        setAttr,
        setValue,
        getValue,
        formatDate,
        formatDateTime,
        toggleVisibility,
        toggleEnabled,
        toggleClass,
        getFormData,
        setFormData,
        clearForm,
        scrollToElement,
        createElement,
        clearChildren,
        isInViewport
    };

    console.log('✅ DomHelpers loaded');

})();
