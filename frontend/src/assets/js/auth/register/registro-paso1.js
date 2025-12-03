/**
 * Formulario de Registro - Paso 1: Credenciales
 * Refactorizado con validación y sanitización mejoradas
 */

import FloatingModal from '../../ui/modal-flotante.js';
import { setupEmailValidation } from '../../utils/verificar-email.js';

export const content = `
    <form id="step1-form" novalidate>
        <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-primary">Paso 1: Credenciales</h2>
        <div class="space-y-4">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Correo Electrónico *
                </label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 sm:text-sm dark:text-dark-text-primary" 
                    required
                    data-validate="email"
                    data-sanitize="email"
                    maxlength="254"
                    placeholder="ejemplo@correo.com"
                    aria-label="Correo electrónico"
                    aria-describedby="email-help"
                >
                <p id="email-help" class="mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
                    Usaremos este email para enviarte la confirmación de registro.
                </p>
            </div>
            
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Contraseña *
                </label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 sm:text-sm dark:text-dark-text-primary" 
                    required
                    data-validate="password"
                    minlength="8"
                    maxlength="20"
                    placeholder="••••••••"
                    aria-label="Contraseña"
                    aria-describedby="password-help"
                >
            </div>
            
            <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                    Repetir Contraseña *
                </label>
                <input 
                    type="password" 
                    id="confirm-password" 
                    name="confirm-password" 
                    class="mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-sm focus:outline-none focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:border-principal-500 dark:focus:border-dark-principal-600 sm:text-sm dark:text-dark-text-primary" 
                    required
                    data-match="password"
                    data-label="la contraseña"
                    minlength="8"
                    maxlength="20"
                    placeholder="••••••••"
                    aria-label="Confirmar contraseña"
                    aria-describedby="confirm-password-help"
                >
                <p id="confirm-password-help" class="mt-1 text-xs text-gray-500 dark:text-dark-text-muted">
                    Repite la misma contraseña para confirmar.
                </p>
            </div>
        </div>
        
        <div class="mt-8 flex justify-between items-center">
            <p class="text-xs text-gray-500 dark:text-dark-text-muted">* Campos obligatorios</p>
            <button 
                type="submit" 
                id="submit-btn"
                disabled
                class="bg-principal-500 dark:bg-dark-principal-600 text-white px-6 py-2 rounded-lg hover:bg-principal-600 dark:hover:bg-dark-principal-700 transition focus:outline-none focus:ring-2 focus:ring-principal-500 dark:focus:ring-dark-principal-600 focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary disabled:bg-gray-300 dark:disabled:bg-dark-bg-tertiary disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:hover:bg-dark-bg-tertiary"
            >
                Siguiente
            </button>
        </div>
    </form>
`;

export function init(navigate, formData, populateForm) {
    const form = document.getElementById('step1-form');
    if (!form) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submit-btn');

    // Estado de verificación de email
    let emailExists = false;

    // Rellenar campos con datos previos si existen
    populateForm(form, formData);

    // Restaurar confirmación de contraseña temporal si el usuario la tipeó antes
    // (guardamos en formData._confirmPassword para no mandarla en el payload final)
    if (formData._confirmPassword) {
        confirmPasswordInput.value = formData._confirmPassword;
    }

    // Verificar estado inicial del botón si hay datos previos
    if (formData.password) {
        validateFormFields();
    }

    // Configurar validación en tiempo real si está disponible
    if (window.Validators) {
        window.Validators.setupRealtimeValidation(form);
    }

    // Configurar sanitización automática si está disponible
    if (window.Sanitizer) {
        window.Sanitizer.setupAutoSanitize(form);
    }

    // Configurar validación de email usando el módulo centralizado
    const emailValidation = setupEmailValidation(emailInput, {
        debounceTime: 800,
        showModal: true, // Mostrar modal en registro público
        onResult: (exists) => {
            emailExists = exists;
            validateFormFields();
        }
    });

    // Validar estado del botón cuando cambia confirmación de contraseña
    confirmPasswordInput.addEventListener('input', () => {
        // Guardar temporalmente la confirmación para que persista al navegar entre pasos
        formData._confirmPassword = confirmPasswordInput.value;
        // Actualizar indicador visual de coincidencia
        updatePasswordMatch();
        // Revalidar el formulario
        validateFormFields();
    });

    // También actualizar cuando cambia la contraseña principal
    passwordInput.addEventListener('input', () => {
        updatePasswordMatch();
        validateFormFields();
    });

    // Validar estado del botón cuando cambia el email
    emailInput.addEventListener('input', () => {
        validateFormFields();
    });

    // Validar dominio del email en tiempo real (blur)
    // La validación ya está integrada en setupEmailValidation, no duplicar
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && window.Validators) {
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid) {
                window.Validators.showError(emailInput, emailResult.message);
                // Marcar el email como no válido
                emailExists = false;
                validateFormFields();
            }
        }
    });


    /**
     * Valida todos los campos y habilita/deshabilita el botón Siguiente
     */
    function validateFormFields() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        let canSubmit = true;

        // Validar email
        if (window.Validators) {
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid) {
                canSubmit = false;
            }
        } else if (!email) {
            canSubmit = false;
        }

        // Validar contraseña (requisitos obligatorios)
        if (window.Validators) {
            const passwordResult = window.Validators.validatePassword(password);
            // No habilitar el botón si la contraseña no cumple todas las reglas
            if (!passwordResult.valid) {
                canSubmit = false;
            }
        } else if (!password || password.length < 8 || password.length > 20) {
            canSubmit = false;
        }

        // Validar coincidencia de contraseñas
        if (password !== confirmPassword || !confirmPassword) {
            canSubmit = false;
        }

        // No permitir si el email ya existe
        if (emailExists) {
            canSubmit = false;
        }

        // Habilitar/deshabilitar botón
        submitBtn.disabled = !canSubmit;
    }

    // Manejar envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obtener valores actuales
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // VALIDACIÓN OBLIGATORIA: No permitir avanzar si la contraseña no cumple TODAS las reglas
        let isValid = true;
        const errors = [];

        if (window.Validators) {
            // Validar email
            const emailResult = window.Validators.validateEmail(email);
            if (!emailResult.valid) {
                window.Validators.showError(emailInput, emailResult.message);
                errors.push('Email inválido');
                isValid = false;
            } else {
                window.Validators.removeError(emailInput);
            }

            // Validar contraseña (CRÍTICO: debe cumplir TODAS las reglas)
            const passwordResult = window.Validators.validatePassword(password);
            if (!passwordResult.valid) {
                window.Validators.showError(passwordInput, passwordResult.message);
                errors.push('Contraseña no cumple requisitos');
                isValid = false;
            } else {
                window.Validators.removeError(passwordInput);
            }

            // Validar coincidencia
            const matchResult = window.Validators.validateMatch(password, confirmPassword, 'la contraseña');
            if (!matchResult.valid) {
                window.Validators.showError(confirmPasswordInput, matchResult.message);
                errors.push('Las contraseñas no coinciden');
                isValid = false;
            } else {
                window.Validators.removeError(confirmPasswordInput);
            }
        } else {
            // Validación básica sin el módulo
            if (!email || !password || !confirmPassword) {
                alert('Por favor, completa todos los campos.');
                return;
            }

            if (password !== confirmPassword) {
                alert('Las contraseñas no coinciden.');
                return;
            }

            if (password.length < 8 || password.length > 20) {
                alert('La contraseña debe tener entre 8 y 20 caracteres.');
                return;
            }

            // Validar requisitos mínimos sin módulo
            if (!/[A-Z]/.test(password)) {
                alert('La contraseña debe incluir al menos una letra mayúscula.');
                return;
            }

            if (!/[a-z]/.test(password)) {
                alert('La contraseña debe incluir al menos una letra minúscula.');
                return;
            }

            if (!/\d/.test(password)) {
                alert('La contraseña debe incluir al menos un número.');
                return;
            }

            if (!/[!@\$%\^&\*()_+\-=[\]{};:'"\\|,.<>\/?`~]/.test(password)) {
                alert('La contraseña debe incluir al menos un carácter especial.');
                return;
            }
        }

        // Bloquear avance si hay errores
        if (!isValid) {
            // Hacer scroll al primer error
            const firstError = form.querySelector('.border-red-500');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        // Verificar si el email ya existe antes de continuar
        if (emailExists) {
            window.Validators.showError(emailInput, 'Este correo ya está registrado. Por favor, inicia sesión o usa otro correo.');
            return;
        }

        // Sanitizar valores antes de guardar
        let sanitizedEmail = email;
        let sanitizedPassword = password;
        
        if (window.Sanitizer) {
            sanitizedEmail = window.Sanitizer.sanitizeEmail(email);
            sanitizedPassword = window.Sanitizer.sanitizeString(password);
        }

        // Actualizar formData
        formData.email = sanitizedEmail;
        formData.password = sanitizedPassword;
        
        // Navegar al siguiente paso (solo si pasó todas las validaciones)
        navigate(1);
    });
}

/**
 * Actualiza el indicador visual de coincidencia de contraseñas
 */
function updatePasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const helpText = document.getElementById('confirm-password-help');
    
    if (!passwordInput || !confirmPasswordInput || !helpText) return;

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Si el campo de confirmación está vacío, mostrar mensaje por defecto
    if (!confirmPassword || confirmPassword.length === 0) {
        helpText.innerHTML = 'Repite la misma contraseña para confirmar.';
        helpText.className = 'mt-1 text-xs text-gray-500 dark:text-dark-text-muted';
        confirmPasswordInput.classList.remove('border-green-500');
        return;
    }

    // Si las contraseñas coinciden
    if (password === confirmPassword && password.length > 0) {
        helpText.innerHTML = '<span class="inline-flex items-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Las contraseñas coinciden</span>';
        helpText.className = 'mt-1 text-xs text-green-600 dark:text-green-400';
        confirmPasswordInput.classList.remove('border-red-500');
        confirmPasswordInput.classList.add('border-green-500');
        // Limpiar solo los errores de validación (elementos con clase validation-error)
        const errorElement = confirmPasswordInput.parentElement.querySelector('.validation-error');
        if (errorElement) {
            errorElement.remove();
            confirmPasswordInput.classList.remove('border-red-500');
            confirmPasswordInput.removeAttribute('aria-invalid');
        }
    } else {
        // Si no coinciden, mostrar indicador pero no tocar el borde
        // setupRealtimeValidation se encargará del borde rojo al hacer blur
        helpText.innerHTML = '<span class="inline-flex items-center gap-1"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>Las contraseñas no coinciden</span>';
        helpText.className = 'mt-1 text-xs text-orange-600 dark:text-orange-400';
        confirmPasswordInput.classList.remove('border-green-500');
    }
}

/**
 * Actualiza el indicador de fortaleza de contraseña
 */
function updatePasswordStrength(password) {
    const helpText = document.getElementById('password-help');
    if (!helpText) return;

    if (!password) {
        helpText.textContent = 'Mínimo 8 caracteres, máximo 20. Debe incluir mayúsculas, minúsculas y números.';
        helpText.className = 'mt-1 text-xs text-gray-500';
        return;
    }

    let strength = 0;
    let feedback = [];

    // Validar longitud mínima
    if (password.length >= 8) {
        strength++;
    } else {
        feedback.push('mínimo 8 caracteres');
    }

    // Validar longitud máxima
    if (password.length > 20) {
        feedback.push('máximo 20 caracteres');
    }

    // Verificar mayúscula (obligatorio)
    if (/[A-Z]/.test(password)) {
        strength++;
    } else {
        feedback.push('una mayúscula');
    }

    // Verificar minúscula (obligatorio)
    if (/[a-z]/.test(password)) {
        strength++;
    } else {
        feedback.push('una minúscula');
    }

    // Verificar número (obligatorio)
    if (/\d/.test(password)) {
        strength++;
    } else {
        feedback.push('un número');
    }

    // Verificar carácter especial (obligatorio)
    if (/[!@\$%\^&\*()_+\-=[\]{};:'"\\|,.<>\/?`~]/.test(password)) {
        strength++;
    } else {
        feedback.push('un carácter especial');
    }

    // Mostrar feedback
    // Si falta algún requisito obligatorio (hay feedback), marcar débil
    if (feedback.length > 0) {
        helpText.textContent = `Contraseña inválida. Falta: ${feedback.join(', ')}.`;
        helpText.className = 'mt-1 text-xs text-red-600';
    } else if (strength <= 3) {
        helpText.textContent = 'Contraseña aceptable. Para mejorarla, agrega caracteres especiales o más longitud.';
        helpText.className = 'mt-1 text-xs text-yellow-600';
    } else {
        helpText.textContent = '✓ Contraseña fuerte';
        helpText.className = 'mt-1 text-xs text-green-600';
    }
}
