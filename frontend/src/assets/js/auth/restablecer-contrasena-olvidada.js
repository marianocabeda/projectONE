/**
 * Flujo: Cambiar contraseña desde enlace (token enviado por email)
 * - Lee el token desde la query string (?token=...)
 * - Habilita validación de contraseña y confirmación
 * - Envía JSON: { token: "", nueva_password: "..." } al endpoint configurado
 */
(function() {
  'use strict';

  function init() {
    const form = document.getElementById('reset-forgot-form');
    const tokenInput = document.getElementById('reset-token');
    const newPasswordInput = document.getElementById('new-password');
    const confirmInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('reset-submit');
    const errDiv = document.getElementById('reset-error');
    const successDiv = document.getElementById('reset-success');
    const noTokenWarning = document.getElementById('no-token-warning');
    const strengthDiv = document.getElementById('password-strength');

    // Endpoint configuration
    const API_BASE_URL = window.AppConfig?.API_BASE_URL || window.ENV?.API_BASE_URL || '';
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
      if (endpoint.startsWith('http')) return endpoint;
      if (API_BASE_URL) return API_BASE_URL + endpoint;
      return endpoint;
    });

    const endpoint = getUrl('resetPassword');

    // Extraer token de la URL (buscar en querystring o fragmento)
    const url = new URL(window.location.href);
    let token = '';
    // comprobar varias posibles claves
    const possibleKeys = ['token', 't', 'reset_token', 'reset'];
    for (const k of possibleKeys) {
      const v = url.searchParams.get(k);
      if (v) {
        token = v;
        break;
      }
    }

    // intentar fragment (#token=...) o hash puro
    if (!token) {
      if (url.hash) {
        const hash = url.hash.replace(/^#/, '');
        // admitir formatos: token=xxx o solo el token
        try {
          const hp = new URLSearchParams(hash);
          for (const k of possibleKeys) {
            const v = hp.get(k);
            if (v) { token = v; break; }
          }
          if (!token && hash && !hash.includes('=')) token = hash;
        } catch (e) {
          if (hash && !hash.includes('=')) token = hash;
        }
      }
    }

    // Si existe, asignar al input oculto
    if (token) {
      tokenInput.value = token;
      noTokenWarning.classList.add('hidden');
    } else {
      // Mostrar advertencia y bloquear formulario
      noTokenWarning.classList.remove('hidden');
      disableForm();
      return;
    }

    // Validadores básicos (se pueden reemplazar con window.Validators)
    function validatePasswordRules(pwd) {
      const rules = {
        length: pwd.length >= 8,
        upper: /[A-Z]/.test(pwd),
        lower: /[a-z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        symbol: /[@$!%*?&#]/.test(pwd),
      };
      return rules;
    }

    function isPasswordValid(pwd) {
      const r = validatePasswordRules(pwd);
      return r.length && r.upper && r.lower && r.number && r.symbol;
    }

    function updateStrengthUI(pwd) {
      if (!strengthDiv) return;
      const r = validatePasswordRules(pwd);
      const passed = Object.values(r).filter(Boolean).length;
      let text = '';
      if (pwd.length === 0) {
        text = '';
        strengthDiv.className = 'mt-2 text-sm';
      } else if (passed <= 2) {
        text = 'Contraseña débil';
        strengthDiv.className = 'mt-2 text-sm text-red-600';
      } else if (passed === 3 || passed === 4) {
        text = 'Contraseña aceptable';
        strengthDiv.className = 'mt-2 text-sm text-yellow-600';
      } else {
        text = 'Contraseña fuerte';
        strengthDiv.className = 'mt-2 text-sm text-green-600';
      }
      strengthDiv.textContent = text;

      // marcar el texto de requisitos en rojo si no cumple
      const req = document.getElementById('password-requirements');
      if (req) {
        if (pwd.length === 0 || isPasswordValid(pwd)) {
          req.classList.remove('text-red-600');
          req.classList.add('text-gray-500');
        } else {
          req.classList.remove('text-gray-500');
          req.classList.add('text-red-600');
        }
      }
    }

    function showError(msg) {
      if (!errDiv) return;
      errDiv.textContent = msg;
      errDiv.classList.remove('hidden');
      successDiv.classList.add('hidden');
    }

    function showSuccess(msg) {
      if (!successDiv) return;
      successDiv.textContent = msg;
      successDiv.classList.remove('hidden');
      errDiv.classList.add('hidden');
    }

    function hideMessages() {
      if (errDiv) errDiv.classList.add('hidden');
      if (successDiv) successDiv.classList.add('hidden');
    }

    function setButtonState(loading) {
      if (loading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cambios';
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }

    function disableForm() {
      if (newPasswordInput) newPasswordInput.disabled = true;
      if (confirmInput) confirmInput.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Eventos de validación en tiempo real
    newPasswordInput.addEventListener('input', () => {
      hideMessages();
      const pwd = newPasswordInput.value || '';
      updateStrengthUI(pwd);
      checkFormValidity();
    });

    confirmInput.addEventListener('input', () => {
      hideMessages();
      checkFormValidity();
    });

    function checkFormValidity() {
      const pwd = newPasswordInput.value || '';
      const conf = confirmInput.value || '';

      const pwdValid = isPasswordValid(pwd);
      const match = pwd && conf && pwd === conf;

      // indicar si las contraseñas no coinciden
      const confirmHint = document.getElementById('confirm-hint');
      if (confirmHint) {
        if (conf.length === 0) {
          confirmHint.textContent = 'Debe coincidir con la nueva contraseña';
          confirmHint.classList.remove('text-red-600');
          confirmHint.classList.add('text-gray-500');
        } else if (!match) {
          confirmHint.textContent = 'Las contraseñas no coinciden';
          confirmHint.classList.remove('text-gray-500');
          confirmHint.classList.add('text-red-600');
        } else {
          confirmHint.textContent = 'Las contraseñas coinciden';
          confirmHint.classList.remove('text-red-600');
          confirmHint.classList.add('text-green-600');
        }
      }

      if (!pwd) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return false;
      }

      if (pwdValid && match && token) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        return true;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      return false;
    }

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideMessages();

      if (!checkFormValidity()) {
        showError('Verifica que la contraseña cumpla los requisitos y que las contraseñas coincidan.');
        return;
      }

      const payload = {
        token: tokenInput.value,
        nueva_password: newPasswordInput.value,
      };

      setButtonState(true);

      try {
          // Mostrar loading spinner
          if (window.LoadingSpinner && typeof window.LoadingSpinner.show === 'function') {
            try { window.LoadingSpinner.show('Cambiando contraseña...'); } catch(e){}
          }

          let result;
          if (window.HTTP && typeof window.HTTP.post === 'function') {
            result = await window.HTTP.post(endpoint, payload);
          } else {
            const resp = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payload),
            });
            const data = resp.headers.get('content-type')?.includes('application/json') ? await resp.json() : null;
            if (!resp.ok) {
              const err = new Error(`HTTP ${resp.status}`);
              err.response = resp;
              err.data = data;
              throw err;
            }
            result = { ok: true, status: resp.status, data };
          }

          // Mostrar modal de éxito si existe
          const successMessage = 'Tu contraseña se actualizó correctamente.';
          if (window.SuccessModal && typeof window.SuccessModal.show === 'function') {
            try { window.SuccessModal.show(successMessage, 'Contraseña actualizada'); } catch (e) { console.warn(e); }
          } else {
            showSuccess(successMessage + ' Serás redirigido al inicio de sesión.');
          }

        // Redirigir al login después de 3s
        setTimeout(() => {
          window.location.href = window.AppConfig?.routes?.login || '/login';
        }, 3000);

      } catch (error) {
        console.error('Error al cambiar contraseña con token:', error);

        // Procesar el error con ErrorHandler si existe
        let userMessage = 'Ocurrió un error al intentar cambiar la contraseña.';
        if (window.ErrorHandler && typeof window.ErrorHandler.handleHTTPError === 'function') {
          try {
            const info = await window.ErrorHandler.handleHTTPError(error, 'reset-forgot-password', false);
            userMessage = info.message || userMessage;
          } catch (e) {
            // ignore
          }
        } else if (error && error.data && error.data.message) {
          userMessage = error.data.message;
        } else if (error && error.message) {
          userMessage = error.message;
        }

        // Mostrar modal de error si está disponible
        if (window.ErrorModal && typeof window.ErrorModal.show === 'function') {
          try { window.ErrorModal.show(userMessage, 'Error al cambiar contraseña'); } catch (e) { console.warn(e); }
        } else {
          showError(userMessage);
        }
      } finally {
        // Ocultar loading spinner
        if (window.LoadingSpinner && typeof window.LoadingSpinner.hide === 'function') {
          try { window.LoadingSpinner.hide(); } catch(e){}
        }
        setButtonState(false);
      }
    });

    console.log('✅ Módulo reset-forgot-password cargado. Endpoint:', endpoint);
  }

  // Inicializar según readyState (soporta carga tardía o script incluido al final)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
