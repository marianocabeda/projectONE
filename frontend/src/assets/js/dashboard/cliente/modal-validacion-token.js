/**
 * Modal de Validación de Token de Firma
 * Maneja la validación del token de verificación enviado por correo
 */
(function() {
    'use strict';

    class ModalValidacionToken {
        constructor(config = {}) {
            this.idContratoFirma = config.idContratoFirma;
            this.contratoId = config.contratoId;
            this.onSuccess = config.onSuccess || (() => {});
            this.onCancel = config.onCancel || (() => {});
            this.modal = null;
            
            // Validar IDs
            if (!this.idContratoFirma && !this.contratoId) {
                console.error('❌ Se requiere idContratoFirma o contratoId');
                throw new Error('ID de contrato requerido');
            }
        }

        /**
         * Mostrar el modal
         */
        show() {
            // Verificar que FloatingModal esté disponible
            if (!window.FloatingModal) {
                console.error('❌ FloatingModal no está disponible');
                this.showError('Error al cargar el modal de validación');
                return;
            }

            const modalHtml = this._buildModalHTML();

            this.modal = new window.FloatingModal({
                title: 'Verificación de Firma',
                html: modalHtml,
                showCloseButton: false,
                closeOnOverlayClick: false,
                closeOnEsc: false,
                buttons: [
                    {
                        label: 'Cancelar',
                        onClick: (ev, modalInstance) => {
                            modalInstance.close();
                            this.onCancel();
                        }
                    },
                    {
                        label: 'Verificar',
                        primary: true,
                        onClick: async (ev, modalInstance) => {
                            await this._validateToken(modalInstance);
                        }
                    }
                ]
            });

            this.modal.show();

            // Configurar eventos después de mostrar el modal
            setTimeout(() => {
                this._setupEventListeners();
            }, 100);
        }

        /**
         * Construir HTML del modal
         */
        _buildModalHTML() {
            return `
                <div class="space-y-4">
                    <p class="text-gray-700 dark:text-dark-text-primary">
                        Se ha enviado un código de verificación a su correo electrónico.
                        Por favor, ingrese el código para confirmar la firma del contrato.
                    </p>
                    <div>
                        <label for="token-input" class="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
                            Código de Verificación
                        </label>
                        <input 
                            type="text" 
                            id="token-input" 
                            maxlength="6"
                            minlength="6"
                            placeholder="PV80A1"
                            class="w-full px-4 py-3 border border-gray-300 dark:border-dark-border-primary rounded-lg focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-transparent bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-tertiary font-mono text-center text-lg tracking-wider"
                            autocomplete="off"
                        />
                        <p id="token-error" class="text-red-500 dark:text-red-400 text-sm mt-2 hidden"></p>
                        <p id="token-info" class="text-blue-600 dark:text-blue-400 text-sm mt-2 hidden"></p>
                        <div class="mt-3 text-center">
                            <button 
                                id="resend-token-btn" 
                                type="button"
                                class="text-sm text-principal-600 dark:text-dark-principal-400 hover:text-principal-700 dark:hover:text-dark-principal-300 font-medium underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ¿No recibió el código? Reenviar código
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Configurar event listeners
         */
        _setupEventListeners() {
            const tokenInput = document.getElementById('token-input');
            const resendBtn = document.getElementById('resend-token-btn');
            
            if (tokenInput) {
                tokenInput.focus();
                
                // Permitir verificar con Enter
                tokenInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this._validateToken(this.modal);
                    }
                });
                
                // Limpiar errores al escribir
                tokenInput.addEventListener('input', () => {
                    this._clearMessages();
                    tokenInput.classList.remove('border-red-500');
                });
            }
            
            // Configurar botón de reenvío
            if (resendBtn) {
                resendBtn.addEventListener('click', async () => {
                    await this._resendVerificationToken();
                });
            }
        }

        /**
         * Reenviar token de verificación
         */
        async _resendVerificationToken() {
            const resendBtn = document.getElementById('resend-token-btn');
            const tokenError = document.getElementById('token-error');
            const tokenInfo = document.getElementById('token-info');
            
            if (!resendBtn) return;
            
            try {
                // Deshabilitar botón y mostrar estado de carga
                const originalText = resendBtn.textContent;
                resendBtn.disabled = true;
                resendBtn.textContent = 'Enviando...';
                resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
                
                // Limpiar mensajes previos
                this._clearMessages();
                
                // Sanitizar y validar ID
                const idParaFirma = this._getValidatedId();
                if (!idParaFirma) {
                    throw new Error('ID de contrato no disponible');
                }
                
                console.log('📧 Reenviando token con ID:', idParaFirma);
                const reenvioUrl = window.AppConfig.getUrl('contratoFirmaReenvioToken').replace(':id', idParaFirma);
                
                const response = await fetch(reenvioUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (!response.ok || result.success === false) {
                    // Capturar errores específicos
                    let errorMessage = 'Error al reenviar el código';
                    
                    if (result.error) {
                        const errorLower = this._sanitizeText(result.error).toLowerCase();
                        
                        // Token aún válido
                        if (errorLower.includes('aún es válido') || errorLower.includes('aun es valido')) {
                            // Extraer tiempo restante si está disponible
                            const match = result.error.match(/(\d+)\s*(hora|horas|minuto|minutos)/i);
                            if (match) {
                                errorMessage = `El código actual aún es válido por ${match[1]} ${match[2]}. No es necesario solicitar uno nuevo.`;
                            } else {
                                errorMessage = 'El código actual aún es válido. No es necesario solicitar uno nuevo por el momento.';
                            }
                            
                            // Mostrar como información en lugar de error
                            if (tokenInfo) {
                                tokenInfo.textContent = errorMessage;
                                tokenInfo.classList.remove('hidden');
                            }
                            
                            // Enfocar input para usar el código actual
                            const tokenInput = document.getElementById('token-input');
                            if (tokenInput) {
                                tokenInput.focus();
                            }
                            
                            return; // No lanzar error, es información
                        }
                        // Otros errores específicos
                        else if (errorLower.includes('límite') || errorLower.includes('limite')) {
                            errorMessage = 'Ha alcanzado el límite de reenvíos. Por favor, intente más tarde.';
                        } else if (errorLower.includes('no encontrado')) {
                            errorMessage = 'No se encontró el contrato. Por favor, recargue la página.';
                        } else {
                            errorMessage = this._sanitizeText(result.error);
                        }
                    } else if (result.message) {
                        errorMessage = this._sanitizeText(result.message);
                    }
                    
                    throw new Error(errorMessage);
                }
                
                // Mostrar mensaje de éxito
                if (tokenInfo) {
                    tokenInfo.textContent = '✓ Código reenviado exitosamente. Por favor, revise su correo electrónico.';
                    tokenInfo.classList.remove('hidden');
                    tokenInfo.classList.add('text-green-600', 'dark:text-green-400');
                    tokenInfo.classList.remove('text-blue-600', 'dark:text-blue-400');
                    
                    // Restaurar color después de 5 segundos y ocultar
                    setTimeout(() => {
                        tokenInfo.classList.add('hidden');
                        tokenInfo.classList.remove('text-green-600', 'dark:text-green-400');
                        tokenInfo.classList.add('text-blue-600', 'dark:text-blue-400');
                    }, 5000);
                }
                
                // Enfocar input para que el usuario ingrese el nuevo código
                const tokenInput = document.getElementById('token-input');
                if (tokenInput) {
                    tokenInput.value = '';
                    tokenInput.classList.remove('border-red-500');
                    tokenInput.focus();
                }
                
            } catch (error) {
                console.error('Error al reenviar token:', error);
                
                if (tokenError) {
                    tokenError.textContent = error.message || 'Error al reenviar el código. Por favor, intente nuevamente.';
                    tokenError.classList.remove('hidden');
                }
            } finally {
                // Re-habilitar botón
                if (resendBtn) {
                    resendBtn.disabled = false;
                    resendBtn.textContent = '¿No recibió el código? Reenviar código';
                    resendBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        }

        /**
         * Validar token de verificación
         */
        async _validateToken(modalInstance) {
            const tokenInput = document.getElementById('token-input');
            const tokenError = document.getElementById('token-error');
            const tokenRaw = tokenInput?.value;

            // Limpiar mensajes previos
            this._clearMessages();
            if (tokenInput) {
                tokenInput.classList.remove('border-red-500');
            }

            // Sanitizar token
            const token = this._sanitizeToken(tokenRaw);

            // Validar token
            if (!token || token.length === 0) {
                this._showValidationError('Por favor, ingrese el código de verificación', tokenInput, tokenError);
                return;
            }

            if (token.length !== 6) {
                this._showValidationError('El código de verificación debe tener 6 caracteres', tokenInput, tokenError);
                return;
            }

            try {
                // Deshabilitar input y botones durante la validación
                if (tokenInput) tokenInput.disabled = true;
                const buttons = modalInstance._panel?.querySelectorAll('button');
                buttons?.forEach(btn => btn.disabled = true);

                // Sanitizar y validar ID
                const idParaFirma = this._getValidatedId();
                if (!idParaFirma) {
                    throw new Error('ID de contrato no disponible');
                }

                console.log('🔑 Validando token con ID:', idParaFirma);
                const validateUrl = window.AppConfig.getUrl('contratoFirmaValidarToken').replace(':id', idParaFirma);
                
                const response = await fetch(validateUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const result = await response.json();

                if (!response.ok || result.success === false) {
                    // Capturar errores específicos del backend
                    let errorMessage = 'Token inválido. Por favor, verifique el código.';
                    
                    if (result.error) {
                        const errorLower = this._sanitizeText(result.error).toLowerCase();
                        if (errorLower.includes('expirado')) {
                            errorMessage = 'El código de verificación ha expirado. Por favor, solicite uno nuevo.';
                        } else if (errorLower.includes('inválido') || errorLower.includes('invalido')) {
                            errorMessage = 'El código de verificación es inválido. Por favor, verifique el código.';
                        } else if (errorLower.includes('no encontrado')) {
                            errorMessage = 'No se encontró el código de verificación.';
                        } else if (errorLower.includes('excediste') || errorLower.includes('máximo de intentos') || errorLower.includes('maximo de intentos')) {
                            errorMessage = 'Número de intentos excedido. Solicite un nuevo código con la opción "Reenviar código".';
                        } else {
                            errorMessage = this._sanitizeText(result.error);
                        }
                    } else if (result.message) {
                        errorMessage = this._sanitizeText(result.message);
                    }
                    
                    throw new Error(errorMessage);
                }

                // Éxito: cerrar modal y ejecutar callback
                modalInstance.close();
                this.onSuccess();

            } catch (error) {
                console.error('Error al validar token:', error);
                
                // Mostrar error
                if (tokenError) {
                    tokenError.textContent = error.message || 'Token inválido. Por favor, verifique el código.';
                    tokenError.classList.remove('hidden');
                }
                if (tokenInput) {
                    tokenInput.classList.add('border-red-500');
                    tokenInput.disabled = false;
                    tokenInput.focus();
                    tokenInput.select();
                }
                
                // Re-habilitar botones
                const buttons = modalInstance._panel?.querySelectorAll('button');
                buttons?.forEach(btn => btn.disabled = false);
            }
        }

        /**
         * Obtener ID validado para las peticiones
         */
        _getValidatedId() {
            const id = this.idContratoFirma || this.contratoId;
            
            // Usar validador si está disponible
            if (window.Validators && typeof window.Validators.sanitizeInteger === 'function') {
                return window.Validators.sanitizeInteger(id);
            }
            
            // Fallback: validación manual
            const parsedId = parseInt(id, 10);
            return !isNaN(parsedId) && parsedId > 0 ? parsedId : null;
        }

        /**
         * Sanitizar texto
         */
        _sanitizeText(text) {
            if (!text) return '';
            
            // Usar sanitizador si está disponible
            if (window.Sanitizer && typeof window.Sanitizer.sanitizeText === 'function') {
                return window.Sanitizer.sanitizeText(text);
            }
            
            // Fallback: sanitización manual
            return String(text)
                .trim()
                .replace(/[<>]/g, '') // Remover < y >
                .substring(0, 500); // Limitar longitud
        }

        /**
         * Sanitizar token (alfanumérico y mayúsculas)
         */
        _sanitizeToken(token) {
            if (!token) return '';
            
            // Remover espacios y caracteres no permitidos
            return String(token)
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 20); // Limitar a 20 caracteres
        }

        /**
         * Limpiar todos los mensajes de error e información
         */
        _clearMessages() {
            const tokenError = document.getElementById('token-error');
            const tokenInfo = document.getElementById('token-info');
            
            if (tokenError) {
                tokenError.textContent = '';
                tokenError.classList.add('hidden');
            }
            
            if (tokenInfo) {
                tokenInfo.textContent = '';
                tokenInfo.classList.add('hidden');
            }
        }

        /**
         * Mostrar error de validación
         */
        _showValidationError(message, input, errorElement) {
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
            }
            if (input) {
                input.classList.add('border-red-500');
                input.focus();
            }
        }

        /**
         * Mostrar error general
         */
        showError(message) {
            if (window.ErrorModal) {
                window.ErrorModal.show(message);
            } else {
                alert(message);
            }
        }

        /**
         * Mostrar mensaje de éxito
         */
        showSuccess(message) {
            if (window.SuccessModal) {
                window.SuccessModal.show(message);
            } else {
                alert(message);
            }
        }
    }

    // Exportar clase globalmente
    window.ModalValidacionToken = ModalValidacionToken;

    console.log('✅ Módulo modal-validacion-token.js cargado');

})();
