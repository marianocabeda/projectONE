/**
 * Utilidad para verificar disponibilidad de email
 * Módulo centralizado para validar si un email ya está registrado en el sistema
 */

/**
 * Verifica si un email ya existe en el sistema
 * @param {string} email - Email a verificar
 * @param {HTMLInputElement} inputElement - Elemento input para mostrar mensajes
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onResult - Callback con el resultado (emailExists: boolean)
 * @param {boolean} options.showMessages - Si se deben mostrar mensajes visuales (default: true)
 * @param {boolean} options.showModal - Si se debe mostrar modal cuando existe (default: false)
 * @returns {Promise<boolean>} - true si el email existe, false si está disponible
 */
export async function checkEmailAvailability(email, inputElement, options = {}) {
    const {
        onResult = null,
        showMessages = true,
        showModal = false
    } = options;

    // Usar configuración centralizada
    const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        const API_BASE_URL = window.AppConfig?.API_BASE_URL || '';
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
    });

    try {
        if (showMessages) {
            showEmailCheckLoading(inputElement);
        }

        const apiUrl = getUrl('checkEmail');

        // IMPORTANTE: usar GET con query parameter, NO POST
        const response = await fetch(`${apiUrl}?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (showMessages) {
            removeEmailCheckLoading(inputElement);
        }

        let emailExists = false;

        if (response.ok) {
            const data = await response.json();

            // El backend puede devolver distintos formatos
            let disponible = null;

            if (data && typeof data.disponible !== 'undefined') {
                disponible = !!data.disponible;
            } else if (data && data.data && typeof data.data.disponible !== 'undefined') {
                disponible = !!data.data.disponible;
            } else if (data && typeof data.exists !== 'undefined') {
                disponible = !data.exists;
            }

            if (disponible === true) {
                // Email disponible
                emailExists = false;
                if (showMessages) {
                    showEmailAvailableMessage(inputElement);
                }
            } else if (disponible === false) {
                // Email NO disponible
                emailExists = true;
                if (showMessages) {
                    showEmailExistsMessage(inputElement, showModal);
                }
            } else {
                // Fallback
                if (data && data.exists) {
                    emailExists = true;
                    if (showMessages) {
                        showEmailExistsMessage(inputElement, showModal);
                    }
                } else {
                    emailExists = false;
                    if (showMessages) {
                        showEmailAvailableMessage(inputElement);
                    }
                }
            }
        } else if (response.status === 404) {
            // Email no encontrado = disponible
            emailExists = false;
            if (showMessages) {
                showEmailAvailableMessage(inputElement);
            }
        } else {
            // Error del servidor
            console.warn('Error al verificar email:', response.status);
            if (showMessages) {
                removeEmailMessages(inputElement);
            }
            emailExists = false; // No bloquear por error
        }

        // Llamar callback si existe
        if (onResult) {
            onResult(emailExists);
        }

        return emailExists;

    } catch (error) {
        console.error('Error verificando email:', error);
        if (showMessages) {
            removeEmailCheckLoading(inputElement);
        }
        
        if (onResult) {
            onResult(false);
        }
        
        return false; // No bloquear por error de red
    }
}

/**
 * Muestra indicador de carga mientras se verifica el email
 */
function showEmailCheckLoading(inputElement) {
    removeEmailMessages(inputElement);
    
    const loadingElement = document.createElement('p');
    loadingElement.className = 'text-blue-600 text-sm mt-1 email-check-message';
    loadingElement.innerHTML = '🔄 Verificando disponibilidad...';
    
    inputElement.parentElement.appendChild(loadingElement);
}

/**
 * Remueve indicador de carga
 */
function removeEmailCheckLoading(inputElement) {
    const loadingElement = inputElement.parentElement.querySelector('.email-check-message');
    if (loadingElement) {
        loadingElement.remove();
    }
}

/**
 * Muestra mensaje cuando el email ya existe
 */
function showEmailExistsMessage(inputElement, showModal = false) {
    removeEmailMessages(inputElement);
    
    const messageElement = document.createElement('div');
    messageElement.className = 'bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2 email-exists-message';
    messageElement.innerHTML = `
        <p class="text-sm text-yellow-800">
            ⚠️ Este correo ya está registrado en el sistema.
        </p>
    `;
    
    inputElement.parentElement.appendChild(messageElement);
    
    // Agregar clase de advertencia al input
    inputElement.classList.add('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500');
    inputElement.classList.remove('border-gray-300');

    // Si se solicita modal (para contexto de registro público)
    if (showModal) {
        showExistingEmailModal(inputElement);
    }
}

/**
 * Muestra modal flotante cuando el email ya existe (solo para registro público)
 */
function showExistingEmailModal(inputElement) {
    try {
        // Intentar cargar FloatingModal dinámicamente si no está disponible
        if (!window.FloatingModal) {
            console.warn('FloatingModal no disponible, saltando modal');
            return;
        }

        const modal = new window.FloatingModal({
            title: 'Usuario registrado',
            html: '<p class="text-gray-600">El correo ingresado ya existe como cliente. Por favor, iniciá sesión con tu cuenta actual o registrate con otro correo.</p>',
            buttons: [
                {
                    label: 'Iniciar sesión',
                    primary: true,
                    onClick: (ev, modalInstance) => {
                        modalInstance.close();
                        const loginUrl = window.AppConfig?.routes?.login || '/login';
                        window.location.href = loginUrl;
                    }
                },
                {
                    label: 'Usar otro correo',
                    onClick: (ev, modalInstance) => {
                        modalInstance.close();
                        inputElement.value = '';
                        inputElement.focus();
                    }
                }
            ]
        });
        modal.show();
    } catch (e) {
        console.warn('⚠️ No se pudo mostrar modal flotante:', e);
    }
}

/**
 * Muestra mensaje cuando el email está disponible
 */
function showEmailAvailableMessage(inputElement) {
    removeEmailMessages(inputElement);
    
    const messageElement = document.createElement('p');
    messageElement.className = 'text-green-600 text-sm mt-1 email-exists-message';
    messageElement.innerHTML = '✓ Correo disponible';
    
    inputElement.parentElement.appendChild(messageElement);
    
    // Restaurar estilos normales
    inputElement.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500');
    inputElement.classList.add('border-gray-300');

    // Remover después de 3 segundos
    setTimeout(() => {
        removeEmailMessages(inputElement);
    }, 3000);
}

/**
 * Remueve todos los mensajes de email
 */
function removeEmailMessages(inputElement) {
    const messages = inputElement.parentElement.querySelectorAll('.email-check-message, .email-exists-message');
    messages.forEach(msg => msg.remove());
    
    // Restaurar estilos
    inputElement.classList.remove('border-yellow-500', 'focus:border-yellow-500', 'focus:ring-yellow-500');
    if (!inputElement.classList.contains('border-red-500')) {
        inputElement.classList.add('border-gray-300');
    }
}

/**
 * Configura validación automática de email con debounce
 * @param {HTMLInputElement} emailInput - Input de email
 * @param {Object} options - Opciones de configuración
 * @param {number} options.debounceTime - Tiempo de debounce en ms (default: 800)
 * @param {Function} options.onResult - Callback con el resultado
 * @param {boolean} options.showModal - Si se debe mostrar modal cuando existe
 * @returns {Object} - Objeto con métodos de control { cleanup, checkNow }
 */
export function setupEmailValidation(emailInput, options = {}) {
    const {
        debounceTime = 800,
        onResult = null,
        showModal = false
    } = options;

    let emailCheckTimeout = null;
    let emailCheckInProgress = false;

    // Validar en blur
    const blurHandler = async () => {
        const email = emailInput.value.trim();
        if (!email || emailCheckInProgress) return;
        
        // Validar formato y dominio primero (CRÍTICO: no consultar backend si el formato es inválido)
        if (window.Validators) {
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid) {
                // Si el formato/dominio no es válido, mostrar error y NO verificar en backend
                window.Validators.showError(emailInput, emailResult.message);
                removeEmailMessages(emailInput);
                if (onResult) onResult(false);
                return;
            }
        }
        
        await checkEmailAvailability(email, emailInput, { onResult, showModal });
    };

    // Validar con debounce en input
    const inputHandler = () => {
        const email = emailInput.value.trim();
        
        // Limpiar timeout anterior
        clearTimeout(emailCheckTimeout);
        
        // Limpiar mensajes si el campo está vacío
        if (!email) {
            removeEmailMessages(emailInput);
            if (onResult) onResult(false);
            return;
        }
        
        // Validar formato y dominio (CRÍTICO: no consultar backend si el formato es inválido)
        if (window.Validators) {
            const result = window.Validators.validateEmail(email);
            if (!result.valid) {
                removeEmailMessages(emailInput);
                if (onResult) onResult(false);
                return; // NO verificar en backend si el formato/dominio no es válido
            }
        }
        
        // Debounce para verificar disponibilidad
        emailCheckTimeout = setTimeout(() => {
            checkEmailAvailability(email, emailInput, { onResult, showModal });
        }, debounceTime);
    };

    // Agregar event listeners
    emailInput.addEventListener('blur', blurHandler);
    emailInput.addEventListener('input', inputHandler);

    // Retornar métodos de control
    return {
        cleanup: () => {
            emailInput.removeEventListener('blur', blurHandler);
            emailInput.removeEventListener('input', inputHandler);
            clearTimeout(emailCheckTimeout);
        },
        checkNow: () => {
            const email = emailInput.value.trim();
            if (email) {
                return checkEmailAvailability(email, emailInput, { onResult, showModal });
            }
            return Promise.resolve(false);
        }
    };
}

export default {
    checkEmailAvailability,
    setupEmailValidation
};
