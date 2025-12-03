/**
 * Módulo de Login - Refactorizado con validación, sanitización y manejo de errores
 */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const submitButton = document.getElementById('login-submit');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  // Elementos del botón "ojito" (se usan globalmente)
  const toggle = document.getElementById('toggle-password');
  const eye = document.getElementById('icon-eye');
  const eyeOff = document.getElementById('icon-eye-off');

  // Usar configuración centralizada
  const API_BASE_URL = window.AppConfig?.API_BASE_URL;
  const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
    if (endpoint.startsWith('http')) return endpoint;
    if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
    return endpoint;
  });
  const dashboardRoute = window.AppConfig?.routes?.dashboard || '/dashboard';

  // Usar componente global de modal de errores
  const showErrorModal = window.ErrorModal?.show || ((errors, title) => {
    const msg = typeof errors === 'string' ? errors :
      errors._general || Object.values(errors).join('; ');
    alert(title + ':\n' + msg);
  });

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

  // Mostrar mensajes según parámetros de la URL
  try {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const msg = params.get('msg');

    if (status === 'success' && window.ErrorHandler) {
      window.ErrorHandler.showSuccessNotification(
        msg || 'Tu correo fue verificado correctamente. Ya podés iniciar sesión.'
      );
    } else if (status === 'error' && msg) {
      errorDiv.textContent = msg;
      errorDiv.classList.remove('hidden');
    }
  } catch (e) {
    console.warn('Error leyendo query params:', e);
  }

  // Configurar validación en tiempo real
  if (window.Validators) {
    // Validar email al perder foco
    emailInput.addEventListener('blur', () => {
      const result = window.Validators.validateEmail(emailInput.value);
      if (!result.valid) {
        window.Validators.showError(emailInput, result.message);
      } else {
        window.Validators.removeError(emailInput);
      }
    });

    // Limpiar error al escribir
    emailInput.addEventListener('input', () => {
      window.Validators.removeError(emailInput);
      if (errorDiv) errorDiv.classList.add('hidden');
    });

    passwordInput.addEventListener('input', () => {
      if (errorDiv) errorDiv.classList.add('hidden');
    });
  }

  // Manejar envío del formulario
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Verificar rate limiting
    if (!rateLimiter.canAttempt()) {
      const remaining = rateLimiter.getRemainingTime();
      errorDiv.textContent = `Demasiados intentos fallidos. Por favor, espera ${remaining} minutos antes de intentar nuevamente.`;
      errorDiv.classList.remove('hidden');
      return;
    }

    // Deshabilitar botón
    submitButton.disabled = true;
    submitButton.textContent = 'Iniciando sesión...';
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');

    // Ocultar errores previos
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';

    // Obtener y sanitizar valores
    let email = emailInput.value;
    let password = passwordInput.value;

    if (window.Sanitizer) {
      email = window.Sanitizer.sanitizeEmail(email);
      password = window.Sanitizer.sanitizeString(password);
    }

    // Validar campos
    let isValid = true;

    if (window.Validators) {
      const emailResult = window.Validators.validateEmail(email);
      if (!emailResult.valid) {
        window.Validators.showError(emailInput, emailResult.message);
        isValid = false;
      }

      if (window.Validators.isEmpty(password)) {
        errorDiv.textContent = 'Por favor, ingresa tu contraseña.';
        errorDiv.classList.remove('hidden');
        isValid = false;
      }
    }

    if (!isValid) {
      submitButton.disabled = false;
      submitButton.textContent = 'Iniciar sesión';
      submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
      return;
    }

    try {
      const loginUrl = getUrl('login');

      // 🔧 DEBUG: Usar siempre fetch nativo para evitar problemas con window.HTTP
      console.log('🔧 Usando fetch nativo para login (evitando window.HTTP)');
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Importante: recibe cookies httpOnly del servidor
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();
      // La respuesta del backend es: { success: true, data: { token: "..." } }
      const result = { ok: true, status: response.status, data };

      // 🔍 DEBUG: Mostrar estructura completa de la respuesta
      console.log('📦 ===== RESPUESTA COMPLETA DEL LOGIN =====');
      console.log('📦 result:', result);
      console.log('📦 result.ok:', result.ok);
      console.log('📦 result.status:', result.status);
      console.log('📦 result.data:', result.data);
      console.log('📦 result.data type:', typeof result.data);
      console.log('📦 result.data JSON:', JSON.stringify(result.data, null, 2));

      // 🍪 DEBUG: Verificar cookies recibidas
      console.log('🍪 ===== COOKIES DESPUÉS DE LOGIN =====');
      console.log('🍪 document.cookie:', document.cookie || '(vacío)');
      console.log('ℹ️ NOTA: Si refresh_token es httpOnly, NO aparecerá aquí (es correcto)');

      // Verificar si hay Set-Cookie en los headers de respuesta (solo visible si CORS lo permite)
      if (result.response && result.response.headers) {
        const setCookie = result.response.headers.get('set-cookie');
        console.log('🍪 Set-Cookie header:', setCookie || '(no visible - CORS policy)');
      }

      // Helper para inspeccionar cookies en DevTools
      console.log('💡 TIP: Para ver cookies httpOnly, ve a DevTools → Application → Cookies → ' + window.location.hostname);

      // Extraer el token según la estructura del backend
      // Backend (utilidades.ResponderJSON) envía: { "success": true, "data": { "token": "..." } }
      // El módulo HTTP ya parsea esto, por lo que result.data contiene { "success": true, "data": { "token": "..." } }
      let token = null;

      // Verificar múltiples formatos para máxima compatibilidad
      if (result.data?.data?.token) {
        // Formato estándar del backend: { success: true, data: { token: "..." } }
        token = result.data.data.token;
      } else if (result.data?.token) {
        // Formato directo: { token: "..." }
        token = result.data.token;
      } else if (result.data?.accessToken) {
        // Formato camelCase: { accessToken: "..." }
        token = result.data.accessToken;
      } else if (result.data?.access_token) {
        // Formato snake_case: { access_token: "..." }
        token = result.data.access_token;
      }

      console.log('🔑 Token extraído:', token ? '✅ Token presente (' + token.substring(0, 30) + '...)' : '❌ NO SE ENCONTRÓ TOKEN');

      // ✅ SISTEMA HÍBRIDO:
      // - access_token: Se guarda en localStorage/memoria y se envía en Authorization header
      // - refresh_token: Permanece en cookie httpOnly (más seguro, el backend lo establece)
      if (!token) {
        console.error('❌ NO SE PUDO EXTRAER EL TOKEN de la respuesta');
        console.error('Estructura recibida:', result.data);
        throw new Error('No se recibió token del servidor');
      }

      // Guardar access_token usando AuthToken.saveToken()
      if (window.AuthToken && typeof window.AuthToken.saveToken === 'function') {
        window.AuthToken.saveToken(token);
        console.log('✅ Access token guardado en memoria/localStorage');
      } else {
        console.warn('⚠️ window.AuthToken.saveToken() no disponible, usando fallback');
        try {
          localStorage.setItem('access_token', token);
        } catch (e) {
          console.error('Error guardando token:', e);
        }
      }

      console.log('✅ Login exitoso');
      console.log('📦 Access token: Guardado en localStorage/memoria');
      console.log('🍪 Refresh token: Guardado en cookie httpOnly por el backend');

      // Marcar timestamp de login para Session Manager
      try {
        sessionStorage.setItem('login_timestamp', Date.now().toString());
      } catch (e) {
        // ignore
      }

      // 🔍 VERIFICAR: Intentar hacer una petición de prueba para confirmar autenticación
      // Y cachear los datos del usuario para uso posterior
      try {
        console.log('🔍 Verificando autenticación y cacheando perfil...');
        const testUrl = getUrl('getUserProfile');
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🔍 Test response status:', testResponse.status);
        
        if (testResponse.status === 401) {
          console.error('❌ La autenticación NO funciona correctamente');
          throw new Error('Error de autenticación. Contacta al administrador.');
        }
        
        // Cachear los datos del usuario
        if (testResponse.ok && window.CacheManager) {
          const userData = await testResponse.json();
          const profile = userData.success ? userData.data : userData;
          if (profile) {
            console.log('💾 Login: Cacheando perfil de usuario por 24 horas');
            window.CacheManager.set('user:profile', profile, 24 * 60 * 60 * 1000);
          }
        }
        
        console.log('✅ Autenticación verificada - sistema funcionando correctamente');
      } catch (testError) {
        console.error('❌ Error verificando autenticación:', testError);
        // Continuar de todos modos - el usuario verá el error en el dashboard
      }

      // Mostrar éxito y redirigir
      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccessNotification('Inicio de sesión exitoso. Redirigiendo...');
      }

      setTimeout(() => {
        window.location.href = dashboardRoute;
      }, 500);

    } catch (error) {
      // Registrar intento fallido
      rateLimiter.recordAttempt();

      // Procesar error con ErrorHandler (sin mostrar modal automáticamente)
      const errorInfo = await window.ErrorHandler.handleHTTPError(error, 'login', false);

      // Mostrar error en el div inline
      errorDiv.textContent = errorInfo.message;
      errorDiv.classList.remove('hidden');

      // Mostrar modal con los datos procesados por ErrorHandler
      if (window.ErrorModal) {
        if (errorInfo.isValidation && errorInfo.errors) {
          // Errores de validación: pasar objeto completo
          window.ErrorModal.show(errorInfo.errors, 'Errores de Validación');
        } else {
          // Error simple: pasar string
          window.ErrorModal.show(errorInfo.message, 'Error de Inicio de Sesión');
        }
      }

      // Manejar caso especial de verificación pendiente
      const statusCode = error.status || errorInfo.status;
      if (statusCode === 403 || (errorInfo.message && errorInfo.message.toLowerCase().includes('verificación'))) {
        handleEmailVerification(email);
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Iniciar sesión';
      submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });

  /**
   * Maneja la opción de reenviar email de verificación
   */
  function handleEmailVerification(email) {
    const resendContainer = document.getElementById('resend-container');
    const resendBtn = document.getElementById('resend-btn');
    const resendStatus = document.getElementById('resend-status');

    if (!resendContainer || !resendBtn) return;

    resendContainer.classList.remove('hidden');
    resendStatus.textContent = '';

    resendBtn.onclick = async () => {
      try {
        resendBtn.disabled = true;
        resendStatus.textContent = 'Enviando...';
        resendStatus.className = 'text-xs mt-2 text-gray-600';

        const resendUrl = getUrl('resendVerification');

        let result;
        if (window.HTTP) {
          result = await window.HTTP.post(resendUrl, { email });
        } else {
          const response = await fetch(resendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email })
          });
          result = { ok: response.ok };
        }

        if (result.ok) {
          resendStatus.textContent = 'Si el email existe, te enviamos un nuevo enlace de verificación.';
          resendStatus.className = 'text-xs mt-2 text-green-700';

          if (window.ErrorHandler) {
            window.ErrorHandler.showSuccessNotification('Email de verificación enviado.');
          }
        } else {
          throw new Error('Error al reenviar');
        }
      } catch (error) {
        resendStatus.textContent = 'No se pudo reenviar. Intenta más tarde.';
        resendStatus.className = 'text-xs mt-2 text-red-600';
      } finally {
        resendBtn.disabled = false;
      }
    };
  }
  // Listener para mostrar/ocultar contraseña (si el botón existe)
  if (toggle) {
    toggle.addEventListener('click', () => {
      const showing = passwordInput && passwordInput.type === 'text';
      if (!passwordInput) return;

      passwordInput.type = showing ? 'password' : 'text';

      if (eye) eye.classList.toggle('hidden', !showing);
      if (eyeOff) eyeOff.classList.toggle('hidden', showing);
    });
  }
});