/**
 * Módulo de Recuperación de Contraseña - Solicitud
 * Maneja el envío de email para resetear contraseña
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('forgot-email');
    const submitButton = document.getElementById('forgot-submit');
    const errorDiv = document.getElementById('forgot-error');
    const successDiv = document.getElementById('forgot-success');

    // Configuración
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
      if (endpoint.startsWith('http')) return endpoint;
      if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
      return endpoint;
    });

    // Rate limiting del lado del cliente
    const rateLimiter = {
      attempts: 0,
      lastAttempt: 0,
      maxAttempts: 3,
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
      emailInput.addEventListener('blur', () => {
        const result = window.Validators.validateEmail(emailInput.value);
        if (!result.valid) {
          window.Validators.showError(emailInput, result.message);
        } else {
          window.Validators.removeError(emailInput);
        }
      });

      emailInput.addEventListener('input', () => {
        window.Validators.removeError(emailInput);
        hideMessages();
      });
    }

    // Manejo del formulario
    forgotForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Verificar rate limiting
      if (!rateLimiter.canAttempt()) {
        const remaining = rateLimiter.getRemainingTime();
        showError(`Demasiados intentos. Por favor, espera ${remaining} minutos antes de intentar nuevamente.`);
        return;
      }

      // Deshabilitar botón
      setButtonState(true, 'Enviando...');
      hideMessages();

      // Obtener y sanitizar email
      let email = emailInput.value;
      
      if (window.Sanitizer) {
        email = window.Sanitizer.sanitizeEmail(email);
      }

      // Validar email
      if (window.Validators) {
        const emailResult = window.Validators.validateEmail(email);
        if (!emailResult.valid) {
          window.Validators.showError(emailInput, emailResult.message);
          setButtonState(false);
          return;
        }
      }

      try {
        // Usar endpoint de reenvío de email de verificación para recuperación
        const forgotUrl = getUrl('forgotPassword');
        
        console.log('🔐 Enviando solicitud de recuperación de contraseña a:', forgotUrl);
        
        // Preparar payload: enviar el email en el body. Usamos ambas claves `email` y `mail`
        // por compatibilidad con distintos backends.
        const payload = { email, mail: email };

        console.debug('forgot-password: sending payload', JSON.stringify(payload));

        // Usar módulo HTTP si está disponible
        let result;
        if (window.HTTP) {
          result = await window.HTTP.post(forgotUrl, payload);
        } else {
          // Fallback a fetch nativo
          const response = await fetch(forgotUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw response;
          }

          const data = await response.json();
          result = { ok: true, status: response.status, data };
        }

        // Registrar intento exitoso
        rateLimiter.recordAttempt();

        // Mostrar mensaje de éxito (genérico por seguridad)
        showSuccess(
          'Si el email está registrado, recibirás un enlace para resetear tu contraseña. ' +
          'Por favor, revisa tu bandeja de entrada y la carpeta de spam.'
        );

        // Deshabilitar el formulario por 60 segundos
        disableFormTemporarily(60);

        // Log evento
        console.log('🔐 Solicitud de recuperación de contraseña enviada');

      } catch (error) {
        // Registrar intento
        rateLimiter.recordAttempt();

        // Procesar error con ErrorHandler
        let errorMessage = 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.';
        
        if (window.ErrorHandler) {
          const errorInfo = await window.ErrorHandler.handleHTTPError(error, 'forgot-password', false);
          errorMessage = errorInfo.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        showError(errorMessage);

        console.error('❌ Error en recuperación de contraseña:', error);
      } finally {
        setButtonState(false);
      }
    });

    // Funciones auxiliares
    function setButtonState(isLoading, text = 'Enviar enlace de recuperación') {
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
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
      }
    }

    function hideMessages() {
      if (errorDiv) errorDiv.classList.add('hidden');
      if (successDiv) successDiv.classList.add('hidden');
    }

    function disableFormTemporarily(seconds) {
      let remaining = seconds;
      const interval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
          setButtonState(true, `Espera ${remaining}s para volver a enviar`);
        } else {
          clearInterval(interval);
          setButtonState(false);
        }
      }, 1000);
    }

    console.log('✅ Módulo de recuperación de contraseña cargado');
  });
})();
