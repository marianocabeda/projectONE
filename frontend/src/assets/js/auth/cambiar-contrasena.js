/**
 * Módulo de Cambio de Contraseña (Usuario Autenticado)
 * Maneja el cambio de contraseña cuando el usuario está logeado
 */
(function() {
  'use strict';

  const init = () => {
    const changeForm = document.getElementById('change-password-form');
    if (!changeForm) {
      console.warn('⚠️ Formulario de cambio de contraseña no encontrado');
      return;
    }

    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitButton = changeForm.querySelector('button[type="submit"]');
    
    // Crear contenedores de mensajes si no existen
    let errorDiv = document.getElementById('change-password-error');
    let successDiv = document.getElementById('change-password-success');

    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'change-password-error';
      errorDiv.className = 'mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 hidden';
      changeForm.insertAdjacentElement('afterend', errorDiv);
    }

    if (!successDiv) {
      successDiv = document.createElement('div');
      successDiv.id = 'change-password-success';
      successDiv.className = 'mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 hidden flex items-center';
      changeForm.insertAdjacentElement('afterend', successDiv);
    }

    // Configuración
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
      if (endpoint.startsWith('http')) return endpoint;
      if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
      return endpoint;
    });

    // Verificar autenticación
    if (!window.AuthToken || !window.AuthToken.getToken()) {
      showError('No estás autenticado. Por favor, inicia sesión nuevamente.');
      disableForm();
      setTimeout(() => {
        window.location.href = window.AppConfig?.routes?.login || '/login';
      }, 2000);
      return;
    }

    // Rate limiting del lado del cliente
    const rateLimiter = {
      attempts: 0,
      lastAttempt: 0,
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutos
      
      canAttempt() {
        const now = Date.now();
        if (now - this.lastAttempt > this.windowMs) {
          this.attempts = 0;
        }
        return this.attempts < this.maxAttempts;
      },
      
      recordAttempt() {
        this.attempts++;
        this.lastAttempt = Date.now();
      },
      
      getRemainingTime() {
        const elapsed = Date.now() - this.lastAttempt;
        return Math.ceil((this.windowMs - elapsed) / 1000 / 60);
      }
    };

    // Validación en tiempo real
    if (window.Validators) {
      // Validar nueva contraseña
      newPasswordInput.addEventListener('input', () => {
        window.Validators.removeError(newPasswordInput);
        hideMessages();
        
        // Validar coincidencia si ya tiene valor
        if (confirmPasswordInput.value) {
          validatePasswordMatch();
        }
        
        // Verificar que no sea igual a la actual
        if (currentPasswordInput.value && newPasswordInput.value === currentPasswordInput.value) {
          window.Validators.showError(newPasswordInput, 'La nueva contraseña debe ser diferente a la actual');
        }
        
        // Validar habilitación del botón
        validateFormAndToggleButton();
      });

      newPasswordInput.addEventListener('blur', () => {
        const result = window.Validators.validatePassword(newPasswordInput.value);
        if (!result.valid) {
          window.Validators.showError(newPasswordInput, result.message);
        }
        
        // Verificar que no sea igual a la actual
        if (currentPasswordInput.value && newPasswordInput.value === currentPasswordInput.value) {
          window.Validators.showError(newPasswordInput, 'La nueva contraseña debe ser diferente a la actual');
        }
        
        // Validar habilitación del botón
        validateFormAndToggleButton();
      });

      // Validar confirmación
      confirmPasswordInput.addEventListener('input', () => {
        window.Validators.removeError(confirmPasswordInput);
        validatePasswordMatch();
        
        // Validar habilitación del botón
        validateFormAndToggleButton();
      });

      // Limpiar errores al escribir en contraseña actual
      currentPasswordInput.addEventListener('input', () => {
        window.Validators.removeError(currentPasswordInput);
        hideMessages();
        
        // Validar habilitación del botón
        validateFormAndToggleButton();
      });
    }

    // Crear indicador de fortaleza de contraseña si no existe
    createPasswordStrengthIndicator();

    // Manejo del formulario
    changeForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      console.debug('change-password: submit handler invoked', {
        attempts: rateLimiter.attempts,
        lastAttempt: rateLimiter.lastAttempt
      });
      // Verificar rate limiting
      if (!rateLimiter.canAttempt()) {
        const remaining = rateLimiter.getRemainingTime();
        showError(`Demasiados intentos fallidos. Por favor, espera ${remaining} minutos antes de intentar nuevamente.`);
        return;
      }

      // Verificar autenticación nuevamente
      if (!window.AuthToken || !window.AuthToken.getToken()) {
        showError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        setTimeout(() => {
          window.location.href = window.AppConfig?.routes?.login || '/login';
        }, 2000);
        return;
      }

      // Deshabilitar botón
      setButtonState(true, 'Cambiando contraseña...');
      hideMessages();

      // Mostrar loading global (si está disponible)
      if (window.LoadingSpinner && typeof window.LoadingSpinner.show === 'function') {
        try { window.LoadingSpinner.show('Cambiando contraseña...'); } catch (e) { /* swallow */ }
      }

      // Obtener valores (NO sanitizar contraseñas - el JSON las encapsula de forma segura)
      // Solo hacemos trim y removemos caracteres de control si acaso
      let currentPassword = currentPasswordInput.value.trim();
      let newPassword = newPasswordInput.value.trim();
      let confirmPassword = confirmPasswordInput.value.trim();

      if (window.Sanitizer && window.Sanitizer.removeControlCharacters) {
        currentPassword = window.Sanitizer.removeControlCharacters(currentPassword);
        newPassword = window.Sanitizer.removeControlCharacters(newPassword);
        confirmPassword = window.Sanitizer.removeControlCharacters(confirmPassword);
      }

      // Validaciones
      let isValid = true;

      // Validar que todos los campos tengan valor
      if (!currentPassword || !newPassword || !confirmPassword) {
        showError('Por favor, completa todos los campos');
        setButtonState(false);
        return;
      }

      if (window.Validators) {
        // Validar que la contraseña actual no esté vacía
        if (window.Validators.isEmpty(currentPassword)) {
          window.Validators.showError(currentPasswordInput, 'Ingresa tu contraseña actual');
          isValid = false;
        }

        // Validar nueva contraseña
        const passwordResult = window.Validators.validatePassword(newPassword);
        if (!passwordResult.valid) {
          window.Validators.showError(newPasswordInput, passwordResult.message);
          isValid = false;
        }

        // Validar que la nueva contraseña sea diferente
        if (currentPassword === newPassword) {
          window.Validators.showError(newPasswordInput, 'La nueva contraseña debe ser diferente a la actual');
          isValid = false;
        }

        // Validar coincidencia
        if (newPassword !== confirmPassword) {
          window.Validators.showError(confirmPasswordInput, 'Las contraseñas no coinciden');
          isValid = false;
        }
      }

      if (!isValid) {
        setButtonState(false);
        return;
      }

      try {
        const changeUrl = getUrl('changePassword');

        // Preparar payload según modelo esperado por backend
        // { "actual_password":"...", "nueva_password":"..." }
        const payload = {
          actual_password: currentPassword,
          nueva_password: newPassword,
        };

        console.debug('change-password: prepared payload', { changeUrl, payload });
        console.debug('change-password: payload as JSON string:', JSON.stringify(payload));
        console.debug('change-password: auth token present?', !!window.AuthToken?.getToken());

        // Usar módulo HTTP si está disponible
        let result;
        if (window.HTTP) {
          console.debug('change-password: using window.HTTP.post');
          result = await window.HTTP.post(changeUrl, payload);
          console.debug('change-password: HTTP.post result', result);
          // Normalizar comportamiento: si el helper HTTP devuelve ok:false, tratar como error
          if (!result || result.ok === false || (result.status && result.status >= 400)) {
            console.debug('change-password: HTTP.post indicates failure, throwing result to error handler', result);
            throw result;
          }
        } else {
          // Fallback a fetch nativo
          const token = window.AuthToken.getToken();
          const response = await fetch(changeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            credentials: 'include',
            body: JSON.stringify(payload),
          });

          const text = await response.text();
          let data;
          try { data = JSON.parse(text); } catch (e) { data = text; }

          if (!response.ok) {
            const fetchErr = { status: response.status, statusText: response.statusText, body: data };
            console.debug('change-password: fetch returned non-ok', fetchErr);
            throw fetchErr;
          }

          result = { ok: true, status: response.status, data };
          console.debug('change-password: fetch success', result);
        }

        // Mostrar éxito (modal si está disponible)
        console.debug('change-password: success flow, result:', result);
        if (window.SuccessModal && typeof window.SuccessModal.show === 'function') {
          try { window.SuccessModal.show('¡Contraseña cambiada exitosamente! Por seguridad, deberás iniciar sesión nuevamente.', 'Operación exitosa'); } catch (e) { /* swallow */ }
        } else {
          showSuccess('¡Contraseña cambiada exitosamente! Por seguridad, deberás iniciar sesión nuevamente.');
        }

        // Limpiar formulario
        changeForm.reset();

        // Deshabilitar formulario
        disableForm();

        // Log evento
        console.log('✅ Contraseña cambiada exitosamente');

        // Cerrar sesión y redirigir al login después de 3 segundos
        setTimeout(async () => {
          // Intentar hacer logout
          if (window.AuthToken) {
            try {
              if (window.HTTP) {
                const storedRefresh = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || '';
                await window.HTTP.post(getUrl('logout'), { refresh_token: storedRefresh });
              }
            } catch (e) {
              console.warn('Error al hacer logout:', e);
            }
            window.AuthToken.clearToken();
          }

          // Redirigir a login
          window.location.href = (window.AppConfig?.routes?.login || '/login') + 
            '?status=success&msg=' + encodeURIComponent('Contraseña cambiada exitosamente. Por favor, inicia sesión con tu nueva contraseña.');
        }, 3000);

      } catch (error) {
        // Registrar intento fallido
        rateLimiter.recordAttempt();

        console.error('change-password: caught error', error);

        // Procesar error con ErrorHandler
        let errorMessage = 'Ocurrió un error al cambiar tu contraseña. Intenta nuevamente.';
        let errorInfo = null;
        if (window.ErrorHandler) {
          try {
            errorInfo = await window.ErrorHandler.handleHTTPError(error, 'change-password', false);
            console.debug('change-password: ErrorHandler returned', errorInfo);
            errorMessage = errorInfo.message || errorMessage;
          } catch (eh) {
            console.warn('change-password: ErrorHandler threw', eh);
          }
        } else if (error && error.message) {
          errorMessage = error.message;
        } else if (error && error.body) {
          // If we threw a fetchErr with body
          if (typeof error.body === 'string') errorMessage = error.body;
          else if (error.body && error.body.message) errorMessage = error.body.message;
        }

        // Manejar casos especiales
        const statusCode = error.status || (error.response && error.response.status);

        if (statusCode === 401) {
          // Contraseña actual incorrecta
          errorMessage = 'La contraseña actual es incorrecta. Por favor, verifica e intenta nuevamente.';
          window.Validators?.showError(currentPasswordInput, 'Contraseña incorrecta');
        } else if (statusCode === 403) {
          // No autorizado / sesión expirada
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          setTimeout(() => {
            window.location.href = window.AppConfig?.routes?.login || '/login';
          }, 2000);
        }

        // Mostrar errores con ErrorModal si está disponible (asegurar que siempre se muestre)
        try {
          const modalPayload = (errorInfo && errorInfo.errors) ? errorInfo.errors : errorMessage;
          if (window.ErrorModal && typeof window.ErrorModal.show === 'function') {
            window.ErrorModal.show(modalPayload, 'Error al cambiar contraseña');
          }
        } catch (modalErr) {
          console.warn('change-password: Error showing ErrorModal', modalErr);
        }

        showError(errorMessage);
        console.error('❌ Error al cambiar contraseña (final):', error);
      } finally {
        // Ocultar loading global
        if (window.LoadingSpinner && typeof window.LoadingSpinner.hide === 'function') {
          try { window.LoadingSpinner.hide(); } catch (e) { /* swallow */ }
        }

        if (!changeForm.querySelector('input').disabled) {
          setButtonState(false);
        }
      }
    });

    // Validar que las contraseñas coincidan
    function validatePasswordMatch() {
      if (!window.Validators) return true;
      
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (confirmPassword && newPassword !== confirmPassword) {
        window.Validators.showError(confirmPasswordInput, 'Las contraseñas no coinciden');
        return false;
      } else {
        window.Validators.removeError(confirmPasswordInput);
        return true;
      }
    }

    // Validar formulario completo y habilitar/deshabilitar botón
    function validateFormAndToggleButton() {
      if (!submitButton) return;

      const currentPassword = currentPasswordInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      // Verificar que todos los campos tengan valor
      if (!currentPassword || !newPassword || !confirmPassword) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        return;
      }

      // Validar que la nueva contraseña sea válida
      if (window.Validators) {
        const passwordResult = window.Validators.validatePassword(newPassword);
        if (!passwordResult.valid) {
          submitButton.disabled = true;
          submitButton.classList.add('opacity-50', 'cursor-not-allowed');
          return;
        }
      }

      // Validar que la nueva contraseña sea diferente a la actual
      if (currentPassword === newPassword) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        return;
      }

      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
        return;
      }

      // Si todas las validaciones pasan, habilitar el botón
      submitButton.disabled = false;
      submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Crear indicador de fortaleza de contraseña
    function createPasswordStrengthIndicator() {
      const container = newPasswordInput.parentElement;
      if (!container || container.querySelector('#password-strength-indicator')) return;

      const indicator = document.createElement('div');
      indicator.id = 'password-strength-indicator';
      indicator.className = 'mt-2';
      indicator.innerHTML = `
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-dark-text-secondary mb-1">
          <span>Fortaleza:</span>
          <span id="password-strength-text">-</span>
        </div>
        <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div id="password-strength-bar" class="h-full transition-all duration-300 bg-gray-300 w-0"></div>
        </div>
      `;

      // Insertar después del hint
      const hint = container.querySelector('.text-xs');
      if (hint) {
        hint.insertAdjacentElement('afterend', indicator);
      } else {
        container.appendChild(indicator);
      }

      // Event listener para actualizar fortaleza
      newPasswordInput.addEventListener('input', updatePasswordStrength);
    }

    // Actualizar indicador de fortaleza
    function updatePasswordStrength() {
      const password = newPasswordInput.value;
      const strengthBar = document.getElementById('password-strength-bar');
      const strengthText = document.getElementById('password-strength-text');
      
      if (!strengthBar || !strengthText) return;

      let strength = 0;
      let strengthLabel = '';
      let strengthColor = '';

      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[@$!%*?&#]/.test(password)) strength++;

      if (strength === 0) {
        strengthLabel = '-';
        strengthColor = 'bg-gray-300';
      } else if (strength <= 2) {
        strengthLabel = 'Débil';
        strengthColor = 'bg-red-500';
      } else if (strength <= 3) {
        strengthLabel = 'Media';
        strengthColor = 'bg-yellow-500';
      } else if (strength <= 4) {
        strengthLabel = 'Buena';
        strengthColor = 'bg-blue-500';
      } else {
        strengthLabel = 'Fuerte';
        strengthColor = 'bg-green-500';
      }

      strengthText.textContent = strengthLabel;
      
      // Usar clases de Tailwind para el ancho en lugar de estilos inline
      const widthClass = strength === 0 ? 'w-0' : 
                        strength === 1 ? 'w-1/5' :
                        strength === 2 ? 'w-2/5' :
                        strength === 3 ? 'w-3/5' :
                        strength === 4 ? 'w-4/5' : 'w-full';
      
      strengthBar.className = `h-full transition-all duration-300 ${strengthColor} ${widthClass}`;
    }

    // Funciones auxiliares
    function setButtonState(isLoading, text = 'Guardar Cambios') {
      if (!submitButton) return;
      
      submitButton.disabled = isLoading;
      submitButton.textContent = text;
      if (isLoading) {
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    function showError(message) {
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
      }
    }

    function showSuccess(message) {
      if (successDiv) {
        successDiv.innerHTML = `
          <svg class="h-5 w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>${message}</span>
        `;
        successDiv.classList.remove('hidden');
      }
    }

    function hideMessages() {
      if (errorDiv) errorDiv.classList.add('hidden');
      if (successDiv) successDiv.classList.add('hidden');
    }

    function disableForm() {
      const inputs = changeForm.querySelectorAll('input, button');
      inputs.forEach(input => input.disabled = true);
      if (submitButton) {
        submitButton.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }

    console.log('✅ Módulo de cambio de contraseña (autenticado) cargado');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Si el DOM ya está listo (p. ej. script inyectado dinámicamente), inicializar inmediatamente
    init();
  }
})();
