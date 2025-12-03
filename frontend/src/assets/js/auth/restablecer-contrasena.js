/**
 * Módulo de Cambio de Contraseña Autenticado
 * Maneja el cambio de contraseña para usuarios logueados (requiere contraseña actual)
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (window.AuthToken && typeof window.AuthToken.requireAuth === 'function') {
      window.AuthToken.requireAuth();
    }

    const changeForm = document.getElementById('change-password-form') || document.getElementById('reset-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitButton = document.getElementById('change-submit') || document.getElementById('reset-submit');
    const errorDiv = document.getElementById('change-error') || document.getElementById('reset-error');
    const successDiv = document.getElementById('change-success') || document.getElementById('reset-success');

    // Configuración
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
      const API_BASE_URL = window.AppConfig?.API_BASE_URL;
      if (endpoint.startsWith('http')) return endpoint;
      if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
      return endpoint;
    });
    const dashboardRoute = window.AppConfig?.routes?.dashboard || '/dashboard';

    if (!changeForm) {
      console.error('❌ Formulario de cambio de contraseña no encontrado');
      return;
    }

    // Validación en tiempo real de contraseñas
    if (window.Validators) {
      if (currentPasswordInput) {
        currentPasswordInput.addEventListener('input', () => {
          window.Validators.removeError(currentPasswordInput);
          hideMessages();
        });

        currentPasswordInput.addEventListener('blur', () => {
          if (!currentPasswordInput.value) {
            window.Validators.showError(currentPasswordInput, 'La contraseña actual es requerida');
          }
        });
      }

      if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
          window.Validators.removeError(newPasswordInput);
          hideMessages();
          
          // Validar confirmación si ya tiene valor
          if (confirmPasswordInput && confirmPasswordInput.value) {
            validatePasswordMatch();
          }
        });

        newPasswordInput.addEventListener('blur', () => {
          const result = window.Validators.validatePassword(newPasswordInput.value);
          if (!result.valid) {
            window.Validators.showError(newPasswordInput, result.message);
          }
        });
      }

      if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
          window.Validators.removeError(confirmPasswordInput);
          validatePasswordMatch();
        });
      }
    }

    // Manejo del formulario
    changeForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Deshabilitar botón
      setButtonState(true, 'Cambiando contraseña...');
      hideMessages();

      // Obtener y sanitizar valores
      let currentPassword = currentPasswordInput?.value || '';
      let newPassword = newPasswordInput?.value || '';
      let confirmPassword = confirmPasswordInput?.value || '';

      if (window.Sanitizer) {
        currentPassword = window.Sanitizer.sanitizeString(currentPassword);
        newPassword = window.Sanitizer.sanitizeString(newPassword);
        confirmPassword = window.Sanitizer.sanitizeString(confirmPassword);
      }

      // Validar contraseñas
      let isValid = true;

      if (window.Validators) {
        // Validar que la contraseña actual no esté vacía
        if (!currentPassword) {
          if (currentPasswordInput) {
            window.Validators.showError(currentPasswordInput, 'La contraseña actual es requerida');
          }
          isValid = false;
        }

        // Validar nueva contraseña
        const passwordResult = window.Validators.validatePassword(newPassword);
        if (!passwordResult.valid) {
          if (newPasswordInput) {
            window.Validators.showError(newPasswordInput, passwordResult.message);
          }
          isValid = false;
        }

        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
          if (confirmPasswordInput) {
            window.Validators.showError(confirmPasswordInput, 'Las contraseñas no coinciden');
          }
          isValid = false;
        }

        // Validar que la nueva contraseña sea diferente a la actual
        if (currentPassword && newPassword && currentPassword === newPassword) {
          if (newPasswordInput) {
            window.Validators.showError(newPasswordInput, 'La nueva contraseña debe ser diferente a la actual');
          }
          isValid = false;
        }
      }

      if (!isValid) {
        setButtonState(false);
        return;
      }

      try {
        const changePasswordUrl = getUrl('changePassword');
        
        // Preparar payload según el formato del backend
        const payload = {
          actual_password: currentPassword,
          nueva_password: newPassword
        };

        // Usar authenticatedFetch para incluir token de autenticación
        const fetchFn = window.AuthToken?.authenticatedFetch || window.fetch.bind(window);
        
        const response = await fetchFn(changePasswordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw response;
        }

        const data = await response.json();

        // Mostrar éxito
        showSuccess('¡Contraseña cambiada exitosamente!');
        
        // Deshabilitar formulario temporalmente
        disableForm();

        // Log evento
        console.log('✅ Contraseña cambiada exitosamente');

        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
          if (currentPasswordInput) currentPasswordInput.value = '';
          if (newPasswordInput) newPasswordInput.value = '';
          if (confirmPasswordInput) confirmPasswordInput.value = '';
          enableForm();
          
          // Opcional: Redirigir al dashboard
          // window.location.href = dashboardRoute;
        }, 2000);

      } catch (error) {
        // Procesar error con ErrorHandler
        let errorMessage = 'Ocurrió un error al cambiar tu contraseña. Intenta nuevamente.';
        
        if (window.ErrorHandler) {
          const errorInfo = await window.ErrorHandler.handleHTTPError(error, 'change-password', false);
          errorMessage = errorInfo.message;

          // Mostrar modal si hay errores de validación
          if (errorInfo.isValidation && errorInfo.errors && window.ErrorModal) {
            window.ErrorModal.show(errorInfo.errors, 'Errores de Validación');
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Verificar errores específicos
        const statusCode = error.status || (error.response && error.response.status);
        if (statusCode === 401) {
          showError('Contraseña actual incorrecta. Por favor, verifica e intenta nuevamente.');
        } else if (statusCode === 403) {
          showError('No tienes permisos para cambiar la contraseña.');
        } else {
          showError(errorMessage);
        }

        console.error('❌ Error al cambiar contraseña:', error);
      } finally {
        if (!changeForm.querySelector('input').disabled) {
          setButtonState(false);
        }
      }
    });



    // Validar que las contraseñas coincidan
    function validatePasswordMatch() {
      if (!newPasswordInput || !confirmPasswordInput) return true;
      
      const password = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (confirmPassword && password !== confirmPassword) {
        window.Validators.showError(confirmPasswordInput, 'Las contraseñas no coinciden');
        return false;
      } else {
        window.Validators.removeError(confirmPasswordInput);
        return true;
      }
    }

    // Funciones auxiliares
    function setButtonState(isLoading, text = 'Cambiar contraseña') {
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
          <svg class="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          ${message}
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
      if (submitButton) submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    function enableForm() {
      const inputs = changeForm.querySelectorAll('input, button');
      inputs.forEach(input => input.disabled = false);
      if (submitButton) submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    console.log('✅ Módulo de cambio de contraseña autenticado cargado');
  });
})();
