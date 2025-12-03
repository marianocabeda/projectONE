/**
 * Componente de Input de Teléfono con Selector de País
 * Maneja códigos de país, máscaras y validación en tiempo real
 * @module PhoneInput
 */

(function() {
  'use strict';

  // ==================== CONFIGURACIÓN ====================
  
  const COUNTRY_CODES = [
    { code: '+54 9', country: 'Argentina', flag: '🇦🇷', minDigits: 9, maxDigits: 10, format: '+54 9 XXX XXX-XXXX' },
    { code: '+1', country: 'Estados Unidos', flag: '🇺🇸', minDigits: 10, maxDigits: 10, format: '+1 XXX XXX-XXXX' },
    { code: '+1', country: 'Canadá', flag: '🇨🇦', minDigits: 10, maxDigits: 10, format: '+1 XXX XXX-XXXX' },
    { code: '+52', country: 'México', flag: '🇲🇽', minDigits: 10, maxDigits: 10, format: '+52 XX XXXX-XXXX' },
    { code: '+34', country: 'España', flag: '🇪🇸', minDigits: 9, maxDigits: 9, format: '+34 XXX XXX XXX' },
    { code: '+55', country: 'Brasil', flag: '🇧🇷', minDigits: 10, maxDigits: 11, format: '+55 XX XXXXX-XXXX' },
    { code: '+56', country: 'Chile', flag: '🇨🇱', minDigits: 9, maxDigits: 9, format: '+56 X XXXX-XXXX' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴', minDigits: 10, maxDigits: 10, format: '+57 XXX XXX-XXXX' },
    { code: '+51', country: 'Perú', flag: '🇵🇪', minDigits: 9, maxDigits: 9, format: '+51 XXX XXX XXX' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾', minDigits: 8, maxDigits: 9, format: '+598 XX XXX XXX' },
  ];

  const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Argentina por defecto

  // ==================== CLASE PhoneInput ====================

  class PhoneInput {
    constructor(options) {
      this.containerId = options.containerId;
      this.inputId = options.inputId || `phone-input-${Date.now()}`;
      this.name = options.name || 'telefono';
      this.required = options.required !== false;
      this.placeholder = options.placeholder || 'Ingrese su teléfono';
      this.initialValue = options.initialValue || '';
      this.onChange = options.onChange || null;
      this.onValidation = options.onValidation || null;
      
      this.selectedCountry = DEFAULT_COUNTRY;
      this.digits = '';
      this.isValid = false;
      
      this.container = null;
      this.countryBtn = null;
      this.countryDropdown = null;
      this.input = null;
      
      this.init();
    }

    init() {
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        console.error(`PhoneInput: Container #${this.containerId} no encontrado`);
        return;
      }

      this.render();
      this.attachEvents();
      
      // Si hay un valor inicial, cargarlo
      if (this.initialValue) {
        this.setValue(this.initialValue);
      }
    }

    render() {
      this.container.innerHTML = `
        <div class="phone-input-wrapper relative">
          <!-- Selector de País -->
          <div class="flex gap-2">
            <div class="relative w-32">
              <button 
                type="button" 
                id="${this.inputId}-country-btn" 
                class="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md text-sm hover:border-principal-500 focus:outline-none focus:ring-2 focus:ring-principal-500 transition-colors dark:text-dark-text-primary"
                aria-haspopup="listbox"
                aria-expanded="false"
              >
                <span class="flex items-center gap-2">
                  <span class="country-flag">${this.selectedCountry.flag}</span>
                  <span class="country-code">${this.selectedCountry.code}</span>
                </span>
                <svg class="w-4 h-4 text-gray-400 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Dropdown -->
              <div 
                id="${this.inputId}-country-dropdown" 
                class="hidden absolute z-50 mt-1 w-64 bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border-primary rounded-md shadow-lg max-h-60 overflow-y-auto"
                role="listbox"
              >
                ${COUNTRY_CODES.map((country, index) => `
                  <button
                    type="button"
                    class="country-option w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors dark:text-dark-text-primary"
                    data-index="${index}"
                    role="option"
                  >
                    <span class="text-xl">${country.flag}</span>
                    <div class="flex-1">
                      <div class="font-medium">${country.country}</div>
                      <div class="text-xs text-gray-500 dark:text-dark-text-tertiary">${country.code}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Input de Teléfono -->
            <div class="flex-1 relative">
              <input 
                type="text" 
                id="${this.inputId}" 
                name="${this.name}"
                class="phone-number-input w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-principal-500 focus:border-principal-500 transition-colors dark:text-dark-text-primary"
                placeholder="${this.getPlaceholder()}"
                ${this.required ? 'required' : ''}
                autocomplete="tel"
                inputmode="numeric"
              />
              <div class="phone-validation-message text-xs mt-1 hidden"></div>
            </div>
          </div>
          
          <!-- Input oculto para el valor final -->
          <input type="hidden" id="${this.inputId}-value" name="${this.name}-value" />
        </div>
      `;

      this.countryBtn = document.getElementById(`${this.inputId}-country-btn`);
      this.countryDropdown = document.getElementById(`${this.inputId}-country-dropdown`);
      this.input = document.getElementById(this.inputId);
      this.hiddenInput = document.getElementById(`${this.inputId}-value`);
      this.validationMessage = this.container.querySelector('.phone-validation-message');
    }

    getPlaceholder() {
      // Crear placeholder dinámico con asteriscos
      return '*'.repeat(this.selectedCountry.maxDigits);
    }

    attachEvents() {
      // Abrir/cerrar dropdown
      this.countryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.countryBtn.disabled) {
          this.toggleDropdown();
        }
      });

      // Seleccionar país
      this.countryDropdown.querySelectorAll('.country-option').forEach(option => {
        option.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.dataset.index);
          this.selectCountry(COUNTRY_CODES[index]);
          this.closeDropdown();
        });
      });

      // Cerrar dropdown al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.closeDropdown();
        }
      });

      // Input de teléfono
      this.input.addEventListener('input', (e) => {
        this.handleInput(e);
      });

      this.input.addEventListener('keydown', (e) => {
        this.handleKeydown(e);
      });

      this.input.addEventListener('blur', () => {
        this.validate();
      });

      // No hacer nada especial en focus, dejar que el placeholder haga su trabajo
    }

    toggleDropdown() {
      const isHidden = this.countryDropdown.classList.contains('hidden');
      if (isHidden) {
        this.countryDropdown.classList.remove('hidden');
        this.countryBtn.setAttribute('aria-expanded', 'true');
        const chevron = this.countryBtn.querySelector('svg');
        if (chevron) chevron.style.transform = 'rotate(180deg)';
      } else {
        this.closeDropdown();
      }
    }

    closeDropdown() {
      this.countryDropdown.classList.add('hidden');
      this.countryBtn.setAttribute('aria-expanded', 'false');
      const chevron = this.countryBtn.querySelector('svg');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }

    selectCountry(country) {
      this.selectedCountry = country;
      
      // Actualizar UI del botón
      const flag = this.countryBtn.querySelector('.country-flag');
      const code = this.countryBtn.querySelector('.country-code');
      if (flag) flag.textContent = country.flag;
      if (code) code.textContent = country.code;
      
      // Actualizar placeholder
      this.input.placeholder = this.getPlaceholder();
      
      // No resetear el input, solo validar con el nuevo país
      this.validate();
    }

    handleInput(e) {
      // Extraer solo dígitos del valor ingresado
      const inputValue = e.target.value;
      let newDigits = inputValue.replace(/\D/g, '');
      
      // Compatibilidad con autocompletado: remover código de país si está presente
      // Para Argentina, puede venir como +54 o +549
      const codeDigits = this.selectedCountry.code.replace(/\D/g, '');
      if (newDigits.startsWith(codeDigits)) {
        newDigits = newDigits.substring(codeDigits.length);
      } else {
        // Intentar remover solo la parte base del código (ej: "54" sin el "9")
        const baseCode = codeDigits.replace(/^(\d+)9$/, '$1'); // Remover "9" final si existe
        if (baseCode !== codeDigits && newDigits.startsWith(baseCode)) {
          newDigits = newDigits.substring(baseCode.length);
        }
      }
      
      // Limitar a la cantidad máxima de dígitos
      this.digits = newDigits.substring(0, this.selectedCountry.maxDigits);
      
      // Actualizar el input sin máscara, solo los dígitos
      this.input.value = this.digits;
      
      // Validar y notificar cambios
      this.validate();
      
      if (this.onChange) {
        this.onChange(this.getValue(), this.isValid);
      }
    }

    handleKeydown(e) {
      // Permitir: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].includes(e.keyCode) ||
          // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey) ||
          (e.keyCode === 67 && e.ctrlKey) ||
          (e.keyCode === 86 && e.ctrlKey) ||
          (e.keyCode === 88 && e.ctrlKey) ||
          // Permitir: home, end, left, right
          (e.keyCode >= 35 && e.keyCode <= 39)) {
        return;
      }
      
      // Asegurar que es un número
      if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && 
          (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    }

    validate() {
      const digitCount = this.digits.length;
      const min = this.selectedCountry.minDigits;
      const max = this.selectedCountry.maxDigits;
      
      let valid = true;
      let message = '';
      
      if (this.required && digitCount === 0) {
        valid = false;
        message = 'El teléfono es obligatorio';
      } else if (digitCount > 0 && digitCount < min) {
        valid = false;
        message = `El teléfono debe tener al menos ${min} dígitos`;
      } else if (digitCount > max) {
        valid = false;
        message = `El teléfono no puede tener más de ${max} dígitos`;
      }
      
      this.isValid = valid;
      
      // Actualizar UI
      if (valid) {
        this.input.classList.remove('border-red-500');
        this.validationMessage.classList.add('hidden');
        this.validationMessage.classList.remove('text-red-600');
      } else if (digitCount > 0 || !this.required) {
        this.input.classList.add('border-red-500');
        this.validationMessage.textContent = message;
        this.validationMessage.classList.remove('hidden');
        this.validationMessage.classList.add('text-red-600');
      }
      
      // Actualizar valor oculto
      if (this.hiddenInput) {
        this.hiddenInput.value = this.getValue();
      }
      
      // Notificar validación
      if (this.onValidation) {
        this.onValidation(valid, message);
      }
      
      return valid;
    }

    getValue() {
      if (this.digits.length === 0) return '';
      return this.selectedCountry.code.replace(/\s/g, '') + this.digits;
    }

    setValue(phoneNumber) {
      if (!phoneNumber) {
        this.digits = '';
        this.input.value = '';
        this.validate();
        return;
      }
      
      // Intentar detectar el código de país
      const numStr = phoneNumber.replace(/\D/g, '');
      
      // Buscar el país coincidente (ordenar por longitud de código descendente)
      const sortedCountries = [...COUNTRY_CODES].sort((a, b) => {
        const aLen = a.code.replace(/\D/g, '').length;
        const bLen = b.code.replace(/\D/g, '').length;
        return bLen - aLen;
      });
      
      let matchedCountry = null;
      let digits = '';
      
      for (const country of sortedCountries) {
        const codeDigits = country.code.replace(/\D/g, '');
        if (numStr.startsWith(codeDigits)) {
          matchedCountry = country;
          digits = numStr.substring(codeDigits.length);
          break;
        }
      }
      
      if (!matchedCountry) {
        // Si no se detectó país, asumir que son solo los dígitos locales
        matchedCountry = this.selectedCountry;
        digits = numStr.substring(0, this.selectedCountry.maxDigits);
      }
      
      // Actualizar país si cambió (sin resetear el input)
      if (matchedCountry.code !== this.selectedCountry.code) {
        this.selectedCountry = matchedCountry;
        const flag = this.countryBtn.querySelector('.country-flag');
        const code = this.countryBtn.querySelector('.country-code');
        if (flag) flag.textContent = matchedCountry.flag;
        if (code) code.textContent = matchedCountry.code;
        this.input.placeholder = this.getPlaceholder();
      }
      
      // Actualizar dígitos
      this.digits = digits;
      this.input.value = this.digits;
      this.validate();
    }

    getDigits() {
      return this.digits;
    }

    getSelectedCountry() {
      return this.selectedCountry;
    }

    clear() {
      this.digits = '';
      this.input.value = '';
      this.validate();
    }

    setRequired(required) {
      this.required = required;
      if (required) {
        this.input.setAttribute('required', '');
      } else {
        this.input.removeAttribute('required');
      }
      this.validate();
    }

    setDisabled(disabled) {
      if (disabled) {
        this.input.disabled = true;
        this.countryBtn.disabled = true;
        this.input.classList.add('bg-gray-100', 'cursor-not-allowed');
        this.countryBtn.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
      } else {
        this.input.disabled = false;
        this.countryBtn.disabled = false;
        this.input.classList.remove('bg-gray-100', 'cursor-not-allowed');
        this.countryBtn.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
      }
    }

    destroy() {
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  // ==================== API PÚBLICA ====================

  /**
   * Crea una nueva instancia de PhoneInput
   * @param {Object} options - Opciones de configuración
   * @returns {PhoneInput} - Instancia del componente
   */
  function create(options) {
    return new PhoneInput(options);
  }

  /**
   * Formatea un número de teléfono al formato internacional compacto
   * @param {string} phoneNumber - Número a formatear
   * @returns {string} - Número formateado (ej: +5492615975657)
   */
  function formatToInternational(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/\D/g, '').replace(/^(\d+)/, '+$1');
  }

  /**
   * Parsea un número de teléfono y devuelve sus partes
   * @param {string} phoneNumber - Número a parsear
   * @returns {Object} - { countryCode, digits, full }
   */
  function parsePhone(phoneNumber) {
    if (!phoneNumber) return null;
    
    const numStr = phoneNumber.replace(/\D/g, '');
    
    for (const country of COUNTRY_CODES) {
      const codeDigits = country.code.replace(/\D/g, '');
      if (numStr.startsWith(codeDigits)) {
        return {
          countryCode: country.code,
          country: country.country,
          digits: numStr.substring(codeDigits.length),
          full: phoneNumber
        };
      }
    }
    
    return {
      countryCode: DEFAULT_COUNTRY.code,
      country: DEFAULT_COUNTRY.country,
      digits: numStr,
      full: phoneNumber
    };
  }

  // Exportar API
  window.PhoneInput = {
    create,
    formatToInternational,
    parsePhone,
    COUNTRY_CODES,
    DEFAULT_COUNTRY
  };

})();
