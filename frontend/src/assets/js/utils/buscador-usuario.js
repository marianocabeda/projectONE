/**
 * Componente: Buscador de Usuario
 * Componente reutilizable para buscar usuarios por DNI, Email, Nombre o Apellido
 * con autocompletado en tiempo real, validación, y soporte de dark mode
 * 
 * @version 2.0.0
 * @date 2025-11-28
 */

(function() {
    'use strict';

    /**
     * Clase principal del Buscador de Usuario
     */
    class BuscadorUsuario {
        constructor(options = {}) {
            // Configuración por defecto
            this.config = {
                containerId: options.containerId || 'buscador-usuario-container',
                apiEndpoint: options.apiEndpoint || 'usuariobuscar',
                placeholder: options.placeholder || 'Buscar por DNI, Email, Nombre o Apellido...',
                debounceTime: options.debounceTime || 400,
                maxResults: options.maxResults || 5,
                minChars: options.minChars || 2,
                showAvatar: options.showAvatar !== false,
                showChips: options.showChips !== false,
                allowMultipleSearch: options.allowMultipleSearch !== false,
                theme: options.theme || 'principal', // 'principal', 'success', 'warning', 'info'
                onSelect: options.onSelect || null,
                onClear: options.onClear || null,
                autoFocus: options.autoFocus || false,
                animated: options.animated !== false
            };

            this.state = {
                isOpen: false,
                isLoading: false,
                query: '',
                results: [],
                selectedUser: null,
                searchType: 'dni' // 'auto', 'dni', 'email', 'nombre', 'apellido'
            };

            this.debounceTimer = null;
            this.container = null;
            this.input = null;
            this.dropdown = null;

            this.init();
        }

        /**
         * Inicializa el componente
         */
        init() {
            this.createContainer();
            this.attachEventListeners();
            // Inicializar tipo de búsqueda por defecto (DNI)
            this.setSearchType('dni');
            if (this.config.autoFocus && this.input) {
                setTimeout(() => this.input.focus(), 100);
            }
        }

        /**
         * Crea la estructura HTML del componente
         */
        createContainer() {
            const container = document.getElementById(this.config.containerId);
            if (!container) {
                console.error(`[BuscadorUsuario] Container #${this.config.containerId} no encontrado`);
                return;
            }

            this.container = container;
            this.render();
        }

        /**
         * Renderiza el componente completo
         */
        render() {
            const themeColors = this.getThemeColors();
            
            this.container.innerHTML = `
                <div class="buscador-usuario-wrapper ${this.config.animated ? 'animate-fade-in' : ''}" style="position: relative;">
                    
                    <!-- Buscador Principal -->
                    <div class="buscador-usuario-main">
                        <div class="relative">
                            
                            <!-- Input Principal -->
                            <div class="buscador-input-container relative ${themeColors.border} ${themeColors.focus}">
                                <div class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg class="w-5 h-5 ${themeColors.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                
                                <input 
                                    type="text" 
                                    id="buscador-usuario-input"
                                    class="buscador-input w-full pl-12 pr-24 py-3.5 text-base bg-white dark:bg-dark-bg-tertiary border-2 ${themeColors.borderColor} dark:border-dark-border-primary rounded-xl focus:outline-none focus:ring-4 ${themeColors.ring} dark:focus:ring-opacity-30 text-gray-900 dark:text-dark-text-primary transition-all duration-300 placeholder-gray-400 dark:placeholder-dark-text-tertiary"
                                    placeholder="${this.config.placeholder}"
                                    autocomplete="off"
                                    spellcheck="false"
                                />
                                
                                <!-- Loading Spinner -->
                                <div id="buscador-loading" class="hidden absolute right-20 top-1/2 -translate-y-1/2">
                                    <svg class="animate-spin h-5 w-5 ${themeColors.iconColor}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                
                                <!-- Botón Limpiar -->
                                <button 
                                    id="buscador-clear-btn" 
                                    class="hidden absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-dark-bg-hover rounded-full transition-colors duration-200"
                                    title="Limpiar búsqueda"
                                >
                                    <svg class="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            ${this.config.showChips ? this.renderSearchChips(themeColors) : ''}

                            <!-- Dropdown de Resultados -->
                            <div 
                                id="buscador-dropdown" 
                                class="hidden absolute z-50 w-full mt-2 bg-white dark:bg-dark-bg-secondary border-2 ${themeColors.dropdownBorder} dark:border-dark-border-secondary rounded-xl shadow-2xl max-h-96 overflow-hidden"
                            >
                                <div id="buscador-results" class="max-h-96 overflow-y-auto buscador-scrollbar">
                                    <!-- Resultados se cargan aquí -->
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- Usuario Seleccionado -->
                    <div id="buscador-selected-user" class="hidden mt-4"></div>
                </div>
            `;

            this.input = document.getElementById('buscador-usuario-input');
            this.dropdown = document.getElementById('buscador-dropdown');
            this.resultsContainer = document.getElementById('buscador-results');
            this.loadingIndicator = document.getElementById('buscador-loading');
            this.clearBtn = document.getElementById('buscador-clear-btn');
            this.selectedUserContainer = document.getElementById('buscador-selected-user');
        }

        /**
         * Renderiza los chips de búsqueda rápida
         */
        renderSearchChips(themeColors) {
            return `
                <div class="flex flex-wrap gap-2 mt-3">
                    <button class="search-chip ${themeColors.chip} ring-2 ring-offset-2" data-type="dni">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                        </svg>
                        <span>DNI</span>
                    </button>
                    <button class="search-chip ${themeColors.chip}" data-type="email">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                        <span>Email</span>
                    </button>
                    <button class="search-chip ${themeColors.chip}" data-type="nombre">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
                        </svg>
                        <span>Nombre</span>
                    </button>
                    <button class="search-chip ${themeColors.chip}" data-type="apellido">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd"/>
                        </svg>
                        <span>Apellido</span>
                    </button>
                </div>
            `;
        }

        /**
         * Obtiene los colores del tema seleccionado
         */
        getThemeColors() {
            const themes = {
                principal: {
                    border: 'focus-within:border-principal-500 dark:focus-within:border-dark-principal-600',
                    borderColor: 'border-gray-300',
                    focus: 'focus-within:ring-principal-500/20',
                    ring: 'focus:ring-principal-500/20',
                    iconColor: 'text-principal-600 dark:text-principal-400',
                    chip: 'bg-principal-50 dark:bg-principal-900/20 text-principal-700 dark:text-principal-300 hover:bg-principal-100 dark:hover:bg-principal-900/30 border border-principal-200 dark:border-principal-800',
                    dropdownBorder: 'border-principal-300',
                    resultHover: 'hover:bg-principal-50 dark:hover:bg-dark-bg-hover',
                    avatar: 'from-principal-400 to-principal-600 dark:from-dark-principal-500 dark:to-dark-principal-700',
                    badge: 'bg-principal-100 dark:bg-principal-900/30 text-principal-700 dark:text-principal-300'
                },
                success: {
                    border: 'focus-within:border-exito-500 dark:focus-within:border-exito-600',
                    borderColor: 'border-gray-300',
                    focus: 'focus-within:ring-exito-500/20',
                    ring: 'focus:ring-exito-500/20',
                    iconColor: 'text-exito-600 dark:text-exito-400',
                    chip: 'bg-exito-50 dark:bg-exito-900/20 text-exito-700 dark:text-exito-300 hover:bg-exito-100 dark:hover:bg-exito-900/30 border border-exito-200 dark:border-exito-800',
                    dropdownBorder: 'border-exito-300',
                    resultHover: 'hover:bg-exito-50 dark:hover:bg-dark-bg-hover',
                    avatar: 'from-exito-400 to-exito-600 dark:from-exito-500 dark:to-exito-700',
                    badge: 'bg-exito-100 dark:bg-exito-900/30 text-exito-700 dark:text-exito-300'
                },
                warning: {
                    border: 'focus-within:border-advertencia-500 dark:focus-within:border-advertencia-600',
                    borderColor: 'border-gray-300',
                    focus: 'focus-within:ring-advertencia-500/20',
                    ring: 'focus:ring-advertencia-500/20',
                    iconColor: 'text-advertencia-600 dark:text-advertencia-400',
                    chip: 'bg-advertencia-50 dark:bg-advertencia-900/20 text-advertencia-700 dark:text-advertencia-300 hover:bg-advertencia-100 dark:hover:bg-advertencia-900/30 border border-advertencia-200 dark:border-advertencia-800',
                    dropdownBorder: 'border-advertencia-300',
                    resultHover: 'hover:bg-advertencia-50 dark:hover:bg-dark-bg-hover',
                    avatar: 'from-advertencia-400 to-advertencia-600 dark:from-advertencia-500 dark:to-advertencia-700',
                    badge: 'bg-advertencia-100 dark:bg-advertencia-900/30 text-advertencia-700 dark:text-advertencia-300'
                },
                info: {
                    border: 'focus-within:border-info-500 dark:focus-within:border-info-600',
                    borderColor: 'border-gray-300',
                    focus: 'focus-within:ring-info-500/20',
                    ring: 'focus:ring-info-500/20',
                    iconColor: 'text-info-600 dark:text-info-400',
                    chip: 'bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-300 hover:bg-info-100 dark:hover:bg-info-900/30 border border-info-200 dark:border-info-800',
                    dropdownBorder: 'border-info-300',
                    resultHover: 'hover:bg-info-50 dark:hover:bg-dark-bg-hover',
                    avatar: 'from-info-400 to-info-600 dark:from-info-500 dark:to-info-700',
                    badge: 'bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300'
                }
            };

            return themes[this.config.theme] || themes.principal;
        }

        /**
         * Adjunta los event listeners
         */
        attachEventListeners() {
            // Input change con debounce
            this.input?.addEventListener('input', (e) => this.handleInput(e));

            // Enter para buscar
            this.input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                } else if (e.key === 'Escape') {
                    this.closeDropdown();
                }
            });

            // Botón limpiar
            this.clearBtn?.addEventListener('click', () => this.clearSearch());

            // Search chips
            document.querySelectorAll('.search-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    const type = e.currentTarget.getAttribute('data-type');
                    this.setSearchType(type);
                    this.input?.focus();
                });
            });

            // Click fuera del componente
            document.addEventListener('click', (e) => {
                if (!this.container?.contains(e.target)) {
                    this.closeDropdown();
                }
            });

            // Sanitización y validación en tiempo real
            this.input?.addEventListener('input', () => {
                if (window.Sanitizer && this.input) {
                    const value = this.input.value;
                    let sanitized;
                    
                    // Sanitizar según el tipo de búsqueda
                    switch (this.state.searchType) {
                        case 'dni':
                            sanitized = window.Sanitizer.sanitizeDNI(value);
                            break;
                        case 'email':
                            sanitized = window.Sanitizer.sanitizeEmail(value);
                            break;
                        case 'nombre':
                        case 'apellido':
                            sanitized = window.Sanitizer.sanitizeName(value);
                            break;
                        default:
                            sanitized = window.Sanitizer.sanitizeString(value);
                    }
                    
                    if (sanitized !== value) {
                        this.input.value = sanitized;
                        this.state.query = sanitized;
                    }
                }
            });
            
            // Validación en blur
            this.input?.addEventListener('blur', () => {
                this.validateInput();
            });
        }

        /**
         * Maneja el input con debounce
         */
        handleInput(e) {
            const value = e.target.value.trim();
            this.state.query = value;

            // Mostrar/ocultar botón limpiar
            if (value) {
                this.clearBtn?.classList.remove('hidden');
            } else {
                this.clearBtn?.classList.add('hidden');
                this.closeDropdown();
                return;
            }

            // Debounce
            clearTimeout(this.debounceTimer);

            // Si es búsqueda por DNI, validar que esté completo (7 u 8 dígitos)
            if (this.state.searchType === 'dni') {
                const cleanDNI = value.replace(/\D/g, '');
                if (cleanDNI.length < 7) {
                    this.closeDropdown();
                    return;
                }
            } else {
                // Para otros tipos, validar longitud mínima
                if (value.length < this.config.minChars) {
                    this.closeDropdown();
                    return;
                }
            }

            this.debounceTimer = setTimeout(() => {
                this.performSearch();
            }, this.config.debounceTime);
        }

        /**
         * Valida el input según el tipo de búsqueda seleccionado
         */
        validateInput() {
            if (!window.Validators || !this.input) return { valid: true, message: '' };
            
            const value = this.input.value.trim();
            if (!value) return { valid: true, message: '' };
            
            let validation;
            
            switch (this.state.searchType) {
                case 'dni':
                    validation = window.Validators.validateDNI(value, false);
                    break;
                case 'email':
                    validation = window.Validators.validateEmail(value, false);
                    break;
                case 'nombre':
                    validation = window.Validators.validateName(value, false);
                    break;
                case 'apellido':
                    validation = window.Validators.validateName(value, false);
                    break;
                default:
                    validation = { valid: true, message: '' };
            }
            
            // Mostrar u ocultar mensaje de error
            if (!validation.valid) {
                this.showValidationError(validation.message);
            } else {
                this.hideValidationError();
            }
            
            return validation;
        }
        
        /**
         * Muestra mensaje de error de validación
         */
        showValidationError(message) {
            // Remover error anterior si existe
            this.hideValidationError();
            
            if (!this.input) return;
            
            // Agregar clase de error al input
            this.input.classList.add('border-error-500', 'dark:border-error-600');
            this.input.classList.remove('border-gray-300', 'dark:border-dark-border-primary');
            
            // Crear mensaje de error
            const errorDiv = document.createElement('div');
            errorDiv.id = 'buscador-validation-error';
            errorDiv.className = 'mt-1 text-sm text-error-600 dark:text-error-400';
            errorDiv.textContent = message;
            
            this.input.parentElement?.parentElement?.appendChild(errorDiv);
        }
        
        /**
         * Oculta mensaje de error de validación
         */
        hideValidationError() {
            if (!this.input) return;
            
            // Remover clase de error
            this.input.classList.remove('border-error-500', 'dark:border-error-600');
            
            // Remover mensaje de error
            const errorDiv = document.getElementById('buscador-validation-error');
            if (errorDiv) {
                errorDiv.remove();
            }
        }

        /**
         * Realiza la búsqueda en el backend
         */
        async performSearch() {
            let query = this.state.query;
            if (!query) return;
            
            // Sanitizar el query según el tipo
            if (window.Sanitizer) {
                switch (this.state.searchType) {
                    case 'dni':
                        query = window.Sanitizer.sanitizeDNI(query);
                        break;
                    case 'email':
                        query = window.Sanitizer.sanitizeEmail(query);
                        break;
                    case 'nombre':
                    case 'apellido':
                        query = window.Sanitizer.sanitizeName(query);
                        break;
                    default:
                        query = window.Sanitizer.sanitizeString(query);
                }
            }
            
            // No validar estrictamente durante búsqueda para permitir búsqueda incremental
            // La validación completa se hace en blur
            
            // Validación específica para DNI
            if (this.state.searchType === 'dni') {
                const cleanDNI = query.replace(/\D/g, '');
                if (cleanDNI.length < 7) {
                    return; // No buscar si el DNI no está completo
                }
            } else {
                // Para otros tipos, validar longitud mínima
                if (query.length < this.config.minChars) return;
            }

            this.setLoading(true);
            this.hideValidationError();

            try {
                // Determinar tipo de búsqueda automáticamente
                const searchType = this.detectSearchType(query);
                const params = new URLSearchParams();

                switch (searchType) {
                    case 'dni':
                        params.append('dni', query);
                        break;
                    case 'email':
                        params.append('email', query);
                        break;
                    case 'nombre':
                        params.append('nombre', query);
                        break;
                    case 'apellido':
                        params.append('apellido', query);
                        break;
                    default:
                        // Búsqueda múltiple (intenta todos los campos)
                        params.append('dni', query);
                        params.append('email', query);
                        params.append('nombre', query);
                        params.append('apellido', query);
                }

                const token = window.AuthToken?.getToken?.() || null;
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
                    const API_BASE_URL = window.AppConfig?.API_BASE_URL || '';
                    if (endpoint.startsWith('http')) return endpoint;
                    if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
                    return API_BASE_URL + '/' + endpoint;
                });

                const url = getUrl(this.config.apiEndpoint) + '?' + params.toString();
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: headers,
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    const usuarios = result.data?.data || result.data || [];
                    this.state.results = usuarios.slice(0, this.config.maxResults);
                    this.renderResults();
                } else {
                    this.showError('No se encontraron usuarios');
                }
            } catch (error) {
                console.error('[BuscadorUsuario] Error en búsqueda:', error);
                this.showError('No se encontró el usuario solicitado.');
            } finally {
                this.setLoading(false);
            }
        }

        /**
         * Detecta el tipo de búsqueda automáticamente
         */
        detectSearchType(query) {
            // Si el usuario seleccionó un tipo específico
            if (this.state.searchType !== 'auto') {
                return this.state.searchType;
            }

            // Auto-detección
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const dniRegex = /^\d{7,8}$/;

            if (emailRegex.test(query)) return 'email';
            if (dniRegex.test(query)) return 'dni';
            
            // Si tiene números, probablemente DNI
            if (/^\d+$/.test(query)) return 'dni';
            
            // Si tiene @, probablemente email (aunque incompleto)
            if (query.includes('@')) return 'email';
            
            // Por defecto, buscar por nombre/apellido
            return 'nombre';
        }

        /**
         * Establece el tipo de búsqueda
         */
        setSearchType(type) {
            this.state.searchType = type;
            
            // Actualizar UI de los chips
            document.querySelectorAll('.search-chip').forEach(chip => {
                if (chip.getAttribute('data-type') === type) {
                    chip.classList.add('ring-2', 'ring-offset-2');
                } else {
                    chip.classList.remove('ring-2', 'ring-offset-2');
                }
            });

            // Actualizar placeholder
            const placeholders = {
                dni: 'Ingresa el número de DNI (7 u 8 dígitos)...',
                email: 'Ingresa el email...',
                nombre: 'Ingresa el nombre...',
                apellido: 'Ingresa el apellido...',
                auto: this.config.placeholder
            };

            if (this.input) {
                this.input.placeholder = placeholders[type] || this.config.placeholder;
            }
        }

        /**
         * Renderiza los resultados de búsqueda
         */
        renderResults() {
            if (!this.resultsContainer) return;

            const themeColors = this.getThemeColors();

            if (this.state.results.length === 0) {
                this.resultsContainer.innerHTML = `
                    <div class="p-8 text-center">
                        <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-dark-text-tertiary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-gray-500 dark:text-dark-text-secondary text-sm">No se encontraron usuarios</p>
                        <p class="text-gray-400 dark:text-dark-text-tertiary text-xs mt-1">Intenta con otro criterio de búsqueda</p>
                    </div>
                `;
                this.openDropdown();
                return;
            }

            const escape = window.Sanitizer?.escapeHTML || (str => String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));

            this.resultsContainer.innerHTML = this.state.results.map((usuario, index) => `
                <div 
                    class="buscador-result-item p-4 ${themeColors.resultHover} cursor-pointer border-b border-gray-200 dark:border-dark-border-primary last:border-b-0 transition-all duration-200 hover:pl-6 ${this.config.animated ? 'animate-slide-in' : ''}" 
                    data-index="${index}"
                    style="animation-delay: ${index * 50}ms"
                >
                    <div class="flex items-center gap-4">
                        ${this.config.showAvatar ? `
                            <div class="w-14 h-14 bg-gradient-to-br ${themeColors.avatar} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white dark:ring-dark-bg-secondary">
                                <span class="text-white text-xl font-bold">
                                    ${escape(usuario.nombre?.charAt(0) || 'U')}${escape(usuario.apellido?.charAt(0) || '')}
                                </span>
                            </div>
                        ` : ''}
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <p class="font-bold text-gray-900 dark:text-dark-text-primary truncate text-base">
                                    ${escape(usuario.nombre)} ${escape(usuario.apellido || '')}
                                </p>
                                ${usuario.tipo_usuario ? `
                                    <span class="px-2 py-0.5 ${themeColors.badge} rounded-full text-xs font-medium">
                                        ${escape(usuario.tipo_usuario)}
                                    </span>
                                ` : ''}
                            </div>
                            <div class="flex flex-wrap gap-3 text-sm">
                                <span class="text-gray-600 dark:text-dark-text-secondary flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                                    </svg>
                                    ${escape(usuario.dni || usuario.documento || 'N/A')}
                                </span>
                                <span class="text-gray-500 dark:text-dark-text-tertiary flex items-center gap-1 truncate">
                                    <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                    </svg>
                                    <span class="truncate">${escape(usuario.email)}</span>
                                </span>
                            </div>
                            ${usuario.telefono ? `
                                <p class="text-xs text-gray-400 dark:text-dark-text-tertiary mt-1 flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                    </svg>
                                    ${escape(usuario.telefono)}
                                </p>
                            ` : ''}
                        </div>
                        <div class="flex-shrink-0">
                            <svg class="w-5 h-5 ${themeColors.iconColor} opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            `).join('');

            // Agregar event listeners a los resultados
            this.resultsContainer.querySelectorAll('.buscador-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.getAttribute('data-index'));
                    this.selectUser(this.state.results[index]);
                });
            });

            this.openDropdown();
        }

        /**
         * Selecciona un usuario
         */
        selectUser(usuario) {
            this.state.selectedUser = usuario;
            this.closeDropdown();
            this.renderSelectedUser(usuario);

            // Callback
            if (typeof this.config.onSelect === 'function') {
                this.config.onSelect(usuario);
            }
        }

        /**
         * Renderiza el usuario seleccionado
         */
        renderSelectedUser(usuario) {
            if (!this.selectedUserContainer) return;

            const themeColors = this.getThemeColors();
            const escape = window.Sanitizer?.escapeHTML || (str => String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));

            this.selectedUserContainer.innerHTML = `
                <div class="bg-gradient-to-r ${themeColors.avatar} p-1 rounded-xl shadow-xl ${this.config.animated ? 'animate-scale-in' : ''}">
                    <div class="bg-white dark:bg-dark-bg-card rounded-lg p-5">
                        <div class="flex items-start justify-between mb-4">
                            <h3 class="text-lg font-bold text-gray-900 dark:text-dark-text-primary flex items-center gap-2">
                                <svg class="w-5 h-5 ${themeColors.iconColor}" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                                </svg>
                                Usuario Seleccionado
                            </h3>
                            <button 
                                id="buscador-deselect-btn"
                                class="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-primary transition-colors"
                                title="Cambiar usuario"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div class="space-y-1">
                                <p class="text-xs text-gray-500 dark:text-dark-text-tertiary font-medium">Nombre Completo</p>
                                <p class="font-semibold text-gray-900 dark:text-dark-text-primary">${escape(usuario.nombre)} ${escape(usuario.apellido || '')}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-xs text-gray-500 dark:text-dark-text-tertiary font-medium">DNI</p>
                                <p class="font-semibold text-gray-900 dark:text-dark-text-primary">${escape(usuario.dni || usuario.documento || 'N/A')}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-xs text-gray-500 dark:text-dark-text-tertiary font-medium">Email</p>
                                <p class="font-semibold text-gray-900 dark:text-dark-text-primary truncate">${escape(usuario.email)}</p>
                            </div>
                            ${usuario.telefono ? `
                                <div class="space-y-1">
                                    <p class="text-xs text-gray-500 dark:text-dark-text-tertiary font-medium">Teléfono</p>
                                    <p class="font-semibold text-gray-900 dark:text-dark-text-primary">${escape(usuario.telefono)}</p>
                                </div>
                            ` : ''}
                            ${usuario.direccion ? `
                                <div class="space-y-1 sm:col-span-2">
                                    <p class="text-xs text-gray-500 dark:text-dark-text-tertiary font-medium">Dirección</p>
                                    <p class="font-semibold text-gray-900 dark:text-dark-text-primary">${escape(typeof usuario.direccion === 'string' ? usuario.direccion : `${usuario.direccion.calle || ''} ${usuario.direccion.numero || ''}`)}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;

            this.selectedUserContainer.classList.remove('hidden');

            // Botón para deseleccionar
            document.getElementById('buscador-deselect-btn')?.addEventListener('click', () => {
                this.clearSearch();
            });

            // Ocultar input
            if (this.input) {
                this.input.value = `${usuario.nombre} ${usuario.apellido || ''} - ${usuario.dni || usuario.documento}`;
                this.input.disabled = true;
                this.input.classList.add('bg-gray-100', 'dark:bg-dark-bg-tertiary', 'cursor-not-allowed');
            }
        }

        /**
         * Limpia la búsqueda
         */
        clearSearch() {
            this.state.query = '';
            this.state.results = [];
            this.state.selectedUser = null;
            this.state.searchType = 'auto';

            if (this.input) {
                this.input.value = '';
                this.input.disabled = false;
                this.input.classList.remove('bg-gray-100', 'dark:bg-dark-bg-tertiary', 'cursor-not-allowed');
                this.input.focus();
            }

            this.clearBtn?.classList.add('hidden');
            this.selectedUserContainer?.classList.add('hidden');
            this.closeDropdown();

            // Reset chips
            document.querySelectorAll('.search-chip').forEach(chip => {
                chip.classList.remove('ring-2', 'ring-offset-2');
            });

            // Callback
            if (typeof this.config.onClear === 'function') {
                this.config.onClear();
            }
        }

        /**
         * Muestra un error
         */
        showError(message) {
            if (!this.resultsContainer) return;

            this.resultsContainer.innerHTML = `
                <div class="p-8 text-center">
                    <svg class="w-16 h-16 mx-auto text-red-300 dark:text-red-800 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-red-600 dark:text-red-400 text-sm font-medium">${message}</p>
                </div>
            `;
            this.openDropdown();
        }

        /**
         * Establece el estado de carga
         */
        setLoading(loading) {
            this.state.isLoading = loading;
            if (loading) {
                this.loadingIndicator?.classList.remove('hidden');
            } else {
                this.loadingIndicator?.classList.add('hidden');
            }
        }

        /**
         * Abre el dropdown
         */
        openDropdown() {
            this.dropdown?.classList.remove('hidden');
            this.state.isOpen = true;
        }

        /**
         * Cierra el dropdown
         */
        closeDropdown() {
            this.dropdown?.classList.add('hidden');
            this.state.isOpen = false;
        }

        /**
         * Obtiene el usuario seleccionado
         */
        getSelectedUser() {
            return this.state.selectedUser;
        }

        /**
         * Destruye el componente
         */
        destroy() {
            clearTimeout(this.debounceTimer);
            if (this.container) {
                this.container.innerHTML = '';
            }
        }
    }

    // Exponer la clase globalmente
    window.BuscadorUsuario = BuscadorUsuario;

})();
