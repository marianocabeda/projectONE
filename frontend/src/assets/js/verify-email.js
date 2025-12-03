import FloatingModal from '/js/ui/modal-flotante.js';

// Año actual en el footer
document.getElementById('year').textContent = new Date().getFullYear();

// Estados
const verifyingState = document.getElementById('verifying-state');
const successState = document.getElementById('success-state');
const expiredState = document.getElementById('expired-state');
const invalidState = document.getElementById('invalid-state');
const errorState = document.getElementById('error-state');
const alreadyVerifiedState = document.getElementById('already-verified-state');
const usedState = document.getElementById('used-state');
const noTokenState = document.getElementById('no-token-state');

//CAPTURA DE ESTADO DESDE PARÁMETROS DE URL
const params = new URLSearchParams(window.location.search);
const status = params.get('status');
const token = params.get('token');
const email = params.get('email'); // Para reenviar verificación

// 🔍 DEBUG: Logs temporales para diagnóstico
console.log('🔍 DEBUG - URL completa:', window.location.href);
console.log('🔍 DEBUG - Search params:', window.location.search);
console.log('🔍 DEBUG - Status capturado:', status);
console.log('🔍 DEBUG - Token capturado:', token);
console.log('🔍 DEBUG - Email capturado:', email);

// Guardar email en sessionStorage si viene en URL
if (email) {
  try {
    sessionStorage.setItem('verify_email', email);
  } catch (e) {
    // Silencioso - sin logs
  }
}

// Función para mostrar mensaje según el estado
function showMessage(status) {
  verifyingState.classList.add('hidden');
  
  if (status === 'success') {
    // ✅ ÉXITO
    successState.classList.remove('hidden');
  } else if (status === 'expired') {
    // ⏰ EXPIRADO
    expiredState.classList.remove('hidden');
  } else if (status === 'invalid') {
    // ❌ INVÁLIDO
    invalidState.classList.remove('hidden');
  } else if (status === 'error') {
    // ⚠️ ERROR GENÉRICO
    errorState.classList.remove('hidden');
  } else if (status === 'already-verified') {
    // ℹ️ YA VERIFICADO
    alreadyVerifiedState.classList.remove('hidden');
  } else if (status === 'used') {
    // 🔄 TOKEN YA UTILIZADO
    usedState.classList.remove('hidden');
  } else {
    // DEFAULT: No hay status o status desconocido
    // Mantener estado de verificando y proceder con verificación por token
    return false;
  }
  
  return true;
}

// Función para verificar el email con token
async function verifyEmail(token) {
  try {
    const API_BASE_URL = window.AppConfig?.API_BASE_URL || window.ENV?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl;
    
    const verifyUrl = getUrl 
      ? getUrl('verifyEmail') 
      : `${API_BASE_URL}/auth/verify-email`;

    let response, data;
    
    // Usar HTTP module si está disponible
    if (window.HTTP) {
      const result = await window.HTTP.post(verifyUrl, { token }, { _skipAuth: true });
      response = result.response;
      data = result.data;
    } else {
      // Fallback a fetch nativo
      response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token })
      });
      data = await response.json();
    }

    if (response.ok) {
      // ✅ Éxito - Redirigir con status=success
      window.location.href = window.location.pathname + '?status=success';
    } else {
      // Error - Determinar tipo de error y redirigir con status apropiado
      let errorStatus = 'error';
      const errorMsg = data?.message || data?.error || '';
      
      if (response.status === 410 || errorMsg.toLowerCase().includes('expirado') || errorMsg.toLowerCase().includes('expired')) {
        errorStatus = 'expired';
      } else if (response.status === 400 || errorMsg.toLowerCase().includes('inválido') || errorMsg.toLowerCase().includes('invalid')) {
        errorStatus = 'invalid';
      } else if (response.status === 409 || errorMsg.toLowerCase().includes('ya verificado') || errorMsg.toLowerCase().includes('already verified')) {
        errorStatus = 'already-verified';
      } else if (errorMsg.toLowerCase().includes('ya utilizado') || errorMsg.toLowerCase().includes('already used') || errorMsg.toLowerCase().includes('used')) {
        errorStatus = 'used';
      }
      
      window.location.href = window.location.pathname + '?status=' + errorStatus;
    }
  } catch (error) {
    window.location.href = window.location.pathname + '?status=error';
  }
}

// === MODAL MANAGEMENT ===
let resendModal = null;

function openResendModal() {
  // Obtener email guardado
  const savedEmail = sessionStorage.getItem('verify_email') || '';

  // Crear contenido del modal
  const modalContent = `
    <p class="text-gray-600 mb-6">
      Ingresá tu correo electrónico y te enviaremos un nuevo enlace de verificación.
    </p>
    <form id="resend-form" class="space-y-4">
      <div>
        <label for="modal-email" class="block text-sm font-medium text-gray-700 mb-2">
          Correo electrónico
        </label>
        <input 
          type="email" 
          id="modal-email" 
          name="email"
          value="${savedEmail}"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-principal-500 focus:border-principal-500 transition-colors"
          placeholder="tu@email.com"
        />
      </div>
      <div id="modal-status" class="hidden p-3 rounded-lg text-sm"></div>
    </form>
  `;

  // Crear modal
  resendModal = new FloatingModal({
    title: 'Reenviar verificación',
    html: modalContent,
    showCloseButton: true,
    buttons: [
      {
        label: 'Cancelar',
        onClick: (ev, modal) => modal.close()
      },
      {
        label: 'Enviar',
        primary: true,
        onClick: async (ev, modal) => {
          const form = document.getElementById('resend-form');
          const emailInput = document.getElementById('modal-email');
          const statusDiv = document.getElementById('modal-status');
          
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const email = emailInput.value.trim();
          if (!email) return;

          // Deshabilitar botón
          ev.target.disabled = true;
          ev.target.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Enviando...';
          statusDiv.classList.add('hidden');

          try {
            await resendVerification(email, statusDiv);
            
            // Guardar email
            try {
              sessionStorage.setItem('verify_email', email);
            } catch (e) {}

            // Cerrar modal después de 3 segundos si fue exitoso
            setTimeout(() => {
              if (resendModal) resendModal.close();
            }, 3000);
          } catch (error) {
            // Error ya manejado en resendVerification
          } finally {
            ev.target.disabled = false;
            ev.target.textContent = 'Enviar';
          }
        }
      }
    ]
  });

  resendModal.show();

  // Focus en el input
  setTimeout(() => {
    const emailInput = document.getElementById('modal-email');
    if (emailInput) emailInput.focus();
  }, 100);
}

// Función para reenviar email de verificación
async function resendVerification(userEmail, statusDiv) {
  try {
    const API_BASE_URL = window.AppConfig?.API_BASE_URL || window.ENV?.API_BASE_URL;
    const getUrl = window.AppConfig?.getUrl;
    
    const resendUrl = getUrl 
      ? getUrl('resendVerification') 
      : `${API_BASE_URL}/auth/reenvio-email-verificacion`;

    let response, data;
    
    // Usar HTTP module si está disponible
    if (window.HTTP) {
      const result = await window.HTTP.post(resendUrl, { email: userEmail }, { _skipAuth: true });
      response = result.response;
      data = result.data;
    } else {
      // Fallback a fetch nativo
      response = await fetch(resendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email: userEmail })
      });
      data = await response.json();
    }

    if (response.ok) {
      statusDiv.className = 'p-3 rounded-lg text-sm bg-exito-50 border border-exito-200 text-exito-800';
      statusDiv.innerHTML = '<strong>✓ Email reenviado con éxito.</strong><br>Revisá tu bandeja de entrada.';
      statusDiv.classList.remove('hidden');
    } else {
      throw new Error(data?.message || 'Error al reenviar el email');
    }
  } catch (error) {
    statusDiv.className = 'p-3 rounded-lg text-sm bg-error-50 border border-error-200 text-error-800';
    statusDiv.innerHTML = '<strong>✗ Error al enviar.</strong><br>' + (error.message || 'Por favor, intenta nuevamente.');
    statusDiv.classList.remove('hidden');
    throw error;
  }
}

// Event listener para abrir modal desde los botones de reenviar
document.querySelectorAll('[id="resend-verification-btn"]').forEach(btn => {
  btn.addEventListener('click', openResendModal);
});

// 🔥 LÓGICA PRINCIPAL: Determinar qué mostrar
if (status) {
  // Si hay status en URL, mostrar mensaje correspondiente
  showMessage(status);
} else if (token) {
  // Si hay token pero no status, verificar el email
  verifyEmail(token);
} else {
  // No hay ni status ni token - mostrar estado sin token
  verifyingState.classList.add('hidden');
  noTokenState.classList.remove('hidden');
}
