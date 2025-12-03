/**
 * Generador de contraseñas seguras
 * Genera contraseñas basadas en palabras aleatorias que cumplen con requisitos de seguridad
 */
(function() {
  'use strict';

  // Lista de palabras seguras para generar contraseñas memorables
  const wordLists = {
    sustantivos: [
      'Sol', 'Luna', 'Mar', 'Rio', 'Monte', 'Valle', 'Nube', 'Estrella',
      'Bosque', 'Lago', 'Arena', 'Piedra', 'Viento', 'Lluvia', 'Nieve',
      'Fuego', 'Tierra', 'Cielo', 'Flor', 'Arbol', 'Hoja', 'Rama',
      'Pajaro', 'Pez', 'Mariposa', 'Abeja', 'Delfin', 'Aguila', 'Leon',
      'Tigre', 'Lobo', 'Oso', 'Gato', 'Perro', 'Caballo', 'Ciervo',
      'Puente', 'Torre', 'Castillo', 'Casa', 'Ciudad', 'Pueblo', 'Camino',
      'Libro', 'Musica', 'Arte', 'Color', 'Luz', 'Sombra', 'Tiempo'
    ],
    adjetivos: [
      'Brillante', 'Veloz', 'Fuerte', 'Suave', 'Grande', 'Pequeño',
      'Alto', 'Bajo', 'Largo', 'Corto', 'Nuevo', 'Viejo', 'Joven',
      'Rapido', 'Lento', 'Claro', 'Oscuro', 'Dulce', 'Amargo',
      'Calido', 'Frio', 'Seco', 'Humedo', 'Duro', 'Blando',
      'Alegre', 'Tranquilo', 'Sereno', 'Vivo', 'Noble', 'Libre',
      'Puro', 'Simple', 'Magico', 'Feliz', 'Sabio', 'Valiente'
    ],
    verbos: [
      'Corre', 'Salta', 'Vuela', 'Nada', 'Canta', 'Baila', 'Juega',
      'Crea', 'Sueña', 'Piensa', 'Rie', 'Brilla', 'Crece', 'Vive',
      'Ama', 'Espera', 'Busca', 'Encuentra', 'Camina', 'Viaja'
    ]
  };

  /**
   * Genera un número aleatorio entre 0 y max-1
   */
  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Selecciona un elemento aleatorio de un array
   */
  function pickFromArray(arr) {
    return arr[randInt(arr.length)];
  }

  /**
   * Selecciona un carácter aleatorio de un string
   */
  function pick(str) {
    return str.charAt(randInt(str.length));
  }

  /**
   * Mezcla aleatoriamente los elementos de un array (Fisher-Yates)
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Capitaliza la primera letra de una palabra
   */
  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  /**
   * Genera una palabra compuesta aleatoria
   */
  function generateWordPhrase() {
    const patterns = [
      () => pickFromArray(wordLists.adjetivos) + pickFromArray(wordLists.sustantivos),
      () => pickFromArray(wordLists.sustantivos) + pickFromArray(wordLists.adjetivos),
      () => pickFromArray(wordLists.verbos) + pickFromArray(wordLists.sustantivos),
      () => pickFromArray(wordLists.sustantivos) + pickFromArray(wordLists.verbos)
    ];
    
    const pattern = pickFromArray(patterns);
    return pattern();
  }

  /**
   * Genera una contraseña basada en palabras que cumple con los requisitos de seguridad
   * @param {Object} opts - Opciones de generación
   * @param {number} opts.length - Longitud mínima de la contraseña (default: 12)
   * @param {boolean} opts.requireUpper - Requiere mayúsculas (default: true)
   * @param {boolean} opts.requireLower - Requiere minúsculas (default: true)
   * @param {boolean} opts.requireDigits - Requiere dígitos (default: true)
   * @param {boolean} opts.requireSpecial - Requiere caracteres especiales (default: true)
   * @returns {string} Contraseña generada basada en palabras
   */
  function generatePassword(opts = {}) {
    const {
      length = 12,
      requireUpper = true,
      requireLower = true,
      requireDigits = true,
      requireSpecial = true
    } = opts;

    const digits = '0123456789';
    const special = '!@#$%^&*-_=+';
    
    // Generar frase base con palabras
    let password = '';
    let attempts = 0;
    const maxAttempts = 10;
    
    // Generar combinación de palabras hasta alcanzar longitud mínima
    while (password.length < length && attempts < maxAttempts) {
      const phrase = generateWordPhrase();
      password += phrase;
      attempts++;
    }
    
    // Si es demasiado larga, recortar
    if (password.length > length + 5) {
      password = password.substring(0, length + randInt(6));
    }
    
    // Convertir a array para manipular
    let chars = password.split('');
    
    // Asegurar que cumple con los requisitos
    let modifications = [];
    
    // Verificar y ajustar mayúsculas
    if (requireUpper && !/[A-Z]/.test(password)) {
      // Ya tenemos mayúsculas en las palabras capitalizadas
      const idx = randInt(chars.length);
      chars[idx] = chars[idx].toUpperCase();
    }
    
    // Verificar y ajustar minúsculas
    if (requireLower && !/[a-z]/.test(password)) {
      const idx = randInt(chars.length);
      chars[idx] = chars[idx].toLowerCase();
    }
    
    // Añadir números si se requieren
    if (requireDigits) {
      const numCount = 2 + randInt(2); // 2-3 números
      const digitPositions = [];
      
      for (let i = 0; i < numCount; i++) {
        const digit = pick(digits);
        modifications.push(digit);
      }
    }
    
    // Añadir caracteres especiales si se requieren
    if (requireSpecial) {
      const specialCount = 1 + randInt(2); // 1-2 caracteres especiales
      
      for (let i = 0; i < specialCount; i++) {
        const specialChar = pick(special);
        modifications.push(specialChar);
      }
    }
    
    // Insertar modificaciones en posiciones aleatorias
    if (modifications.length > 0) {
      // Mezclar modificaciones
      modifications = shuffle(modifications);
      
      // Insertar al final o en medio
      modifications.forEach((mod, idx) => {
        if (idx === 0) {
          chars.push(mod); // Al final
        } else {
          const pos = randInt(chars.length);
          chars.splice(pos, 0, mod); // En posición aleatoria
        }
      });
    }
    
    // Asegurar que tiene mayúsculas y minúsculas mezcladas
    if (requireUpper && requireLower) {
      // Hacer algunas letras mayúsculas y otras minúsculas de forma aleatoria
      chars = chars.map((char, idx) => {
        if (/[a-zA-Z]/.test(char) && randInt(3) === 0) {
          return char.toUpperCase();
        } else if (/[a-zA-Z]/.test(char)) {
          return char.toLowerCase();
        }
        return char;
      });
    }
    
    // Unir y retornar
    return chars.join('');
  }

  /**
   * Valida si una contraseña cumple con los requisitos
   * @param {string} password - Contraseña a validar
   * @param {Object} opts - Opciones de validación
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  function validatePassword(password, opts = {}) {
    const {
      minLength = 8,
      requireUpper = true,
      requireLower = true,
      requireDigits = true,
      requireSpecial = true
    } = opts;

    const errors = [];

    if (!password || password.length < minLength) {
      errors.push(`La contraseña debe tener al menos ${minLength} caracteres`);
    }
    if (requireUpper && !/[A-Z]/.test(password)) {
      errors.push('La contraseña debe incluir al menos una letra mayúscula');
    }
    if (requireLower && !/[a-z]/.test(password)) {
      errors.push('La contraseña debe incluir al menos una letra minúscula');
    }
    if (requireDigits && !/[0-9]/.test(password)) {
      errors.push('La contraseña debe incluir al menos un número');
    }
    if (requireSpecial && !/[!@#$%^&*()\-_=+\[\]{};:,.<>?]/.test(password)) {
      errors.push('La contraseña debe incluir al menos un carácter especial');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Exportar API pública
  window.PasswordGenerator = {
    generate: generatePassword,
    validate: validatePassword
  };

})();
