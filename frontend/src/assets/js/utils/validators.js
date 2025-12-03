/**
 * Sistema de Validación Centralizado
 * Proporciona funciones de validación reutilizables para formularios
 * con mensajes de error claros y en español
 * @module validators
 */

(function() {
  'use strict';

  // ==================== CONSTANTES DE VALIDACIÓN ====================
  
  const PATTERNS = {
    email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    // Teléfono argentino: acepta formato +54 9 (XXX) XXXXXXX o +54 9 (XXX) XXXXXX (9 o 10 dígitos después del código de área)
    phone: /^(?:\+54\s?9?\s?)?(\(?\d{2,4}\)?)?[\s\-]?\d{3,4}[\s\-]?\d{4}$/,
    dni: /^\d{7,8}$/,
    cuit: /^\d{2}-?\d{8}-?\d{1}$/,
  // Código postal: permitir 4 a 8 caracteres alfanuméricos (letras o números)
  postalCode: /^[A-Za-z0-9]{4,8}$/, 
    alphanumeric: /^[a-zA-Z0-9\s]+$/,
    alphabetic: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    numeric: /^\d+$/,
    // Número de calle: permitir letras, números, espacios, slash y guion (ej: "S/N", "12A", "B/12")
    addressNumber: /^[a-zA-Z0-9\s\/\-]{1,20}$/, // longitud límite por patrón, validación final por función
    // Contraseña: min 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&#^()_+=\-[\]{};:'",.<>/?\\|`~]{8,}$/,
  };

  // Lista de TLDs (Top Level Domains) válidos más comunes
  const VALID_TLDS = [
    // TLDs genéricos más comunes
    'com', 'net', 'org', 'edu', 'gov', 'mil', 'int',
    // TLDs de país (ccTLDs) más usados
    'ar', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'it', 'es', 'br', 'mx', 'cl', 'co', 'pe', 've', 'uy', 'py', 'bo', 'ec',
    'cn', 'jp', 'in', 'ru', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'pt', 'gr', 'cz', 'ie', 'nz', 'za',
    // TLDs nuevos populares
    'io', 'co', 'app', 'dev', 'tech', 'online', 'site', 'website', 'store', 'shop', 'blog', 'info', 'biz', 'me', 'tv',
    // TLDs específicos
    'mobi', 'tel', 'travel', 'jobs', 'pro', 'name', 'museum', 'aero', 'asia', 'cat', 'coop', 'post', 'xxx',
    // TLDs de Argentina
    'com.ar', 'gob.ar', 'gov.ar', 'int.ar', 'mil.ar', 'net.ar', 'org.ar', 'tur.ar', 'edu.ar',
    // TLDs compuestos comunes
    'co.uk', 'gov.uk', 'ac.uk', 'org.uk', 'com.au', 'gov.au', 'edu.au', 'com.br', 'gov.br', 'edu.br',
    'com.mx', 'gob.mx', 'edu.mx', 'com.co', 'gov.co', 'edu.co'
  ];

  // Dominios de email populares y confiables
  const COMMON_EMAIL_DOMAINS = [
    // Proveedores internacionales
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
    'aol.com', 'protonmail.com', 'proton.me', 'mail.com', 'zoho.com', 'yandex.com', 'gmx.com', 'tutanota.com',
    // Proveedores argentinos
    'yahoo.com.ar', 'hotmail.com.ar', 'outlook.com.ar', 'live.com.ar', 'arnet.com.ar', 'fibertel.com.ar',
    'speedy.com.ar', 'ciudad.com.ar', 'infovia.com.ar', 'sinectis.com.ar', 'telecentro.com.ar',
    // Educativos
    'unc.edu.ar', 'uba.ar', 'unlp.edu.ar', 'unr.edu.ar', 'utn.edu.ar', 'uncuyo.edu.ar',
    // Gubernamentales
    'gov.ar', 'gob.ar', 'mendoza.gov.ar', 'buenosaires.gob.ar',
    // Empresariales comunes
    'empresa.com', 'company.com', 'corporation.com'
  ];

  const MESSAGES = {
    required: 'Este campo es obligatorio',
    email: 'Ingresá un correo electrónico válido',
    email_format: 'El formato del correo electrónico no es válido',
    email_domain: 'El dominio del correo no es válido. Usá dominios conocidos como gmail.com, outlook.com, yahoo.com, etc.',
    phone: 'Ingresá un número de teléfono válido (ej: +54 9 (261) 123-4567 o 261 1234567)',
    dni: 'Ingresá un DNI válido (7 u 8 dígitos)',
    cuit: 'Ingresá un CUIT válido (formato: XX-XXXXXXXX-X)',
  postalCode: 'Ingresá un código postal válido (4 a 8 letras o números)',
    alphanumeric: 'Solo se permiten letras y números',
    alphabetic: 'Solo se permiten letras',
    numeric: 'Solo se permiten números',
    addressNumber: (max) => `Ingresá un número de calle válido (máx. ${max} caracteres, solo letras, números, espacios, / y -)`,
  pisoDepto: (min, max) => `Debe tener entre ${min} y ${max} caracteres`,
  password: 'La contraseña debe tener entre 8 y 20 caracteres, incluir al menos una mayúscula, una minúscula, un número y un carácter especial',
  password_uppercase: 'Debe incluir al menos una letra mayúscula',
  password_lowercase: 'Debe incluir al menos una letra minúscula',
  password_number: 'Debe incluir al menos un número',
  password_special: 'Debe incluir al menos un carácter especial (por ejemplo: @#$%&*)',
    password_min_length: (min) => `Debe tener al menos ${min} caracteres`,
    password_max_length: (max) => `No puede exceder ${max} caracteres`,
    minLength: (min) => `Debe tener al menos ${min} caracteres`,
    maxLength: (max) => `No puede exceder ${max} caracteres`,
    min: (min) => `El valor mínimo es ${min}`,
    max: (max) => `El valor máximo es ${max}`,
    match: (fieldName) => `Debe coincidir con ${fieldName}`,
    custom: 'El valor ingresado no es válido',
  };

  // ==================== FUNCIONES DE VALIDACIÓN ====================

  /**
   * Valida si un campo está vacío
   * @param {string} value - Valor a validar
   * @returns {boolean}
   */
  function isEmpty(value) {
    return value === null || value === undefined || value.trim() === '';
  }

  /**
   * Valida campo obligatorio
   * @param {string} value - Valor a validar
   * @returns {{valid: boolean, message: string}}
   */
  function validateRequired(value) {
    const valid = !isEmpty(value);
    return {
      valid,
      message: valid ? '' : MESSAGES.required
    };
  }

  /**
   * Valida email con verificación de dominio real
   * @param {string} email - Email a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validateEmail(email, required = true) {
    if (!required && isEmpty(email)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(email)) {
      return { valid: false, message: MESSAGES.required };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validar formato básico
    if (!PATTERNS.email.test(trimmedEmail)) {
      return {
        valid: false,
        message: MESSAGES.email_format
      };
    }

    // Extraer dominio
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) {
      return {
        valid: false,
        message: MESSAGES.email_format
      };
    }

    const domain = parts[1];

    // Verificar que el dominio no esté vacío
    if (!domain || domain.length === 0) {
      return {
        valid: false,
        message: MESSAGES.email_format
      };
    }

    // Verificar si es un dominio común conocido (permite pasar directamente)
    if (COMMON_EMAIL_DOMAINS.includes(domain)) {
      return { valid: true, message: '' };
    }

    // Validar que tenga al menos un punto
    if (!domain.includes('.')) {
      return {
        valid: false,
        message: MESSAGES.email_domain
      };
    }

    // Extraer TLD (extensión)
    const domainParts = domain.split('.');
    
    // Validar que el nombre del dominio (sin TLD) tenga al menos 2 caracteres
    const domainName = domainParts[0];
    if (!domainName || domainName.length < 2) {
      return {
        valid: false,
        message: MESSAGES.email_domain
      };
    }

    // Validar que la parte local (antes del @) tenga al menos 1 carácter
    const localPart = parts[0];
    if (!localPart || localPart.length === 0) {
      return {
        valid: false,
        message: MESSAGES.email_format
      };
    }

    // Validar dominios con TLD compuesto (ej: com.ar, co.uk)
    if (domainParts.length >= 3) {
      const tldCompuesto = domainParts.slice(-2).join('.');
      if (VALID_TLDS.includes(tldCompuesto)) {
        // Para TLDs compuestos, validar que sea un dominio real o conocido
        // Solo permitir si el nombre base del dominio parece legítimo (al menos 3 caracteres y sin números consecutivos)
        if (domainName.length >= 3 && !/\d{3,}/.test(domainName)) {
          return { valid: true, message: '' };
        }
      }
    }

    // Validar TLD simple
    const tld = domainParts[domainParts.length - 1];
    if (!VALID_TLDS.includes(tld)) {
      return {
        valid: false,
        message: MESSAGES.email_domain
      };
    }

    // VALIDACIÓN ESTRICTA: Para dominios con TLD genérico (.com, .net, .org, etc.)
    // que no están en la lista de dominios conocidos, aplicar reglas más estrictas
    const genericTLDs = ['com', 'net', 'org', 'info', 'biz', 'co'];
    
    if (genericTLDs.includes(tld)) {
      // Para TLDs genéricos, el dominio debe:
      // 1. Tener al menos 4 caracteres en el nombre
      // 2. No tener secuencias sospechosas de letras repetidas (ej: aaa, sss)
      // 3. No tener muchos números consecutivos
      // 4. Tener una estructura de palabra reconocible
      
      if (domainName.length < 4) {
        return {
          valid: false,
          message: 'El dominio parece demasiado corto. Usá un proveedor conocido como gmail.com, outlook.com o yahoo.com'
        };
      }

      // Detectar secuencias sospechosas: 3+ letras iguales consecutivas
      if (/(.)\1{2,}/.test(domainName)) {
        return {
          valid: false,
          message: MESSAGES.email_domain
        };
      }

      // Detectar patrones aleatorios: mezcla caótica de consonantes sin vocales o viceversa
      const vowels = (domainName.match(/[aeiou]/gi) || []).length;
      const consonants = (domainName.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
      
      // Si tiene más de 5 caracteres y casi no tiene vocales o casi no tiene consonantes, es sospechoso
      if (domainName.length > 5) {
        if (vowels === 0 || consonants === 0) {
          return {
            valid: false,
            message: MESSAGES.email_domain
          };
        }
        // Ratio muy desbalanceado (ej: gsadasda tiene ratio sospechoso)
        const ratio = vowels > 0 ? consonants / vowels : consonants;
        if (ratio > 4 || (vowels > 0 && vowels / consonants > 4)) {
          return {
            valid: false,
            message: MESSAGES.email_domain
          };
        }
      }

      // Detectar nombres de dominio que parecen aleatorios (muchas letras sin patrón)
      // Si tiene 6+ caracteres sin ninguna palabra común, rechazar
      if (domainName.length >= 6) {
        // Lista de palabras/patrones comunes en dominios legítimos
        const commonPatterns = [
          'mail', 'email', 'corp', 'company', 'tech', 'digital', 'online', 
          'web', 'net', 'service', 'group', 'business', 'enterprise', 'solutions',
          'consulting', 'studio', 'lab', 'media', 'creative'
        ];
        
        const hasCommonPattern = commonPatterns.some(pattern => 
          domainName.includes(pattern)
        );
        
        // Si no tiene patrones comunes y tiene muchos caracteres seguidos
        if (!hasCommonPattern && /[a-z]{6,}/.test(domainName)) {
          // Detectar patrones de repetición de sílabas o secuencias (ej: fafasdas, asdasd, gsadasda)
          // Buscar repeticiones de 2-3 caracteres consecutivos (ej: fafa, asas)
          const hasSyllableRepetition = /([a-z]{2,3})\1/.test(domainName);
          if (hasSyllableRepetition) {
            return {
              valid: false,
              message: MESSAGES.email_domain
            };
          }

          // Detectar patrones de repetición no consecutivos
          // Buscar todas las secuencias de 2-3 letras que se repiten (incluyendo solapadas)
          let hasRepeatedSequence = false;
          for (let len = 2; len <= 3; len++) {
            for (let i = 0; i <= domainName.length - len; i++) {
              const seq = domainName.substring(i, i + len);
              const restOfString = domainName.substring(i + len);
              if (restOfString.includes(seq)) {
                hasRepeatedSequence = true;
                break;
              }
            }
            if (hasRepeatedSequence) break;
          }
          
          if (hasRepeatedSequence) {
            return {
              valid: false,
              message: MESSAGES.email_domain
            };
          }

          // Verificar si parece una palabra real (alternancia razonable de vocales y consonantes)
          let alternations = 0;
          let prevIsVowel = /[aeiou]/i.test(domainName[0]);
          
          for (let i = 1; i < domainName.length; i++) {
            const currentIsVowel = /[aeiou]/i.test(domainName[i]);
            if (currentIsVowel !== prevIsVowel) {
              alternations++;
            }
            prevIsVowel = currentIsVowel;
          }
          
          // Si tiene muy pocas alternaciones para su longitud, es sospechoso
          const alternationRatio = alternations / domainName.length;
          if (alternationRatio < 0.3) {
            return {
              valid: false,
              message: MESSAGES.email_domain
            };
          }
        }
      }
    }

    return { valid: true, message: '' };
  }

  /**
   * Valida contraseña
   * @param {string} password - Contraseña a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validatePassword(password, required = true) {
    if (!required && isEmpty(password)) {
      return { valid: true, message: '' };
    }

    if (isEmpty(password)) {
      return { valid: false, message: MESSAGES.required };
    }

    const minLen = 8;
    const maxLen = 20;
    const checks = [];

    // Validar longitud mínima
    if (password.length < minLen) {
      checks.push(MESSAGES.password_min_length(minLen));
    }

    // Validar longitud máxima
    if (password.length > maxLen) {
      checks.push(MESSAGES.password_max_length(maxLen));
    }

    // Validar mayúscula obligatoria
    if (!/[A-Z]/.test(password)) {
      checks.push(MESSAGES.password_uppercase);
    }

    // Validar minúscula obligatoria
    if (!/[a-z]/.test(password)) {
      checks.push(MESSAGES.password_lowercase);
    }

    // Validar número obligatorio
    if (!/\d/.test(password)) {
      checks.push(MESSAGES.password_number);
    }

    // Validar carácter especial obligatorio
    if (!/[!@\$%\^&\*()_+\-=[\]{};:'"\\|,.<>\/?`~]/.test(password)) {
      checks.push(MESSAGES.password_special);
    }

    const valid = checks.length === 0;
    const message = valid ? '' : checks.join('. ');

    return { valid, message };
  }

  /**
   * Valida que dos valores coincidan (ej: confirmar contraseña)
   * @param {string} value1 - Primer valor
   * @param {string} value2 - Segundo valor
   * @param {string} fieldName - Nombre del campo para el mensaje
   * @returns {{valid: boolean, message: string}}
   */
  function validateMatch(value1, value2, fieldName = 'el campo anterior') {
    const valid = value1 === value2;
    return {
      valid,
      message: valid ? '' : MESSAGES.match(fieldName)
    };
  }

  /**
   * Valida teléfono argentino
   * @param {string} phone - Teléfono a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validatePhone(phone, required = true) {
    if (!required && isEmpty(phone)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(phone)) {
      return { valid: false, message: MESSAGES.required };
    }

    // Limpiar el teléfono para validación (remover espacios, guiones, paréntesis, +)
    const cleanPhone = phone.replace(/[\s\-()\+]/g, '');
    
    // Extraer solo los dígitos
    const digits = cleanPhone.replace(/\D/g, '');
    
    // Validar longitud: debe tener entre 10 y 13 dígitos
    // 10 dígitos: código de área (2-4 dígitos) + número (6-8 dígitos)
    // 11-13 dígitos: con código de país (54) y 9
    if (digits.length < 10 || digits.length > 13) {
      return { valid: false, message: MESSAGES.phone };
    }
    
    // Validar formato general
    const valid = PATTERNS.phone.test(phone);
    
    return {
      valid,
      message: valid ? '' : MESSAGES.phone
    };
  }

  /**
   * Valida DNI argentino
   * @param {string} dni - DNI a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validateDNI(dni, required = true) {
    if (!required && isEmpty(dni)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(dni)) {
      return { valid: false, message: MESSAGES.required };
    }

    const cleanDNI = dni.replace(/\D/g, '');
    const valid = PATTERNS.dni.test(cleanDNI);
    
    return {
      valid,
      message: valid ? '' : MESSAGES.dni
    };
  }

  /**
   * Valida CUIT argentino
   * @param {string} cuit - CUIT a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validateCUIT(cuit, required = true) {
    if (!required && isEmpty(cuit)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(cuit)) {
      return { valid: false, message: MESSAGES.required };
    }

    const cleanCUIT = cuit.replace(/\D/g, '');
    
    if (cleanCUIT.length !== 11) {
      return { valid: false, message: MESSAGES.cuit };
    }

    // Validación del dígito verificador
    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCUIT[i]) * mult[i];
    }
    
    const verifier = 11 - (sum % 11);
    const calculatedVerifier = verifier === 11 ? 0 : verifier === 10 ? 9 : verifier;
    const valid = calculatedVerifier === parseInt(cleanCUIT[10]);

    return {
      valid,
      message: valid ? '' : MESSAGES.cuit
    };
  }

  /**
   * Valida código postal argentino
   * @param {string} postalCode - Código postal a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validatePostalCode(postalCode, required = true) {
    if (!required && isEmpty(postalCode)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(postalCode)) {
      return { valid: false, message: MESSAGES.required };
    }

    const clean = postalCode.trim();
    // comprobar longitud mínima/máxima y patrón alfanumérico
    const valid = PATTERNS.postalCode.test(clean);
    return {
      valid,
      message: valid ? '' : MESSAGES.postalCode
    };
  }

  /**
   * Valida la estructura de una fecha (días válidos por mes, años bisiestos)
   * @param {string} date - Fecha en formato DD-MM-YYYY
   * @returns {{valid: boolean, message: string}}
   */
  function validateDateStructure(date) {
    if (typeof date !== 'string') {
      return { valid: false, message: 'Formato de fecha inválido' };
    }

    const parts = date.split('-');
    if (parts.length !== 3) {
      return { valid: false, message: 'Formato de fecha inválido (use DD-MM-YYYY)' };
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validar que sean números válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, message: 'La fecha contiene valores inválidos' };
    }

    // Validar rangos básicos
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return { valid: false, message: 'Día debe estar entre 1-31 y mes entre 1-12' };
    }

    // Días por mes (considerando año bisiesto)
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (day > daysInMonth[month - 1]) {
      return { 
        valid: false, 
        message: `El mes ${month} no tiene ${day} días` 
      };
    }

    return { valid: true, message: '' };
  }

  /**
   * Valida que una fecha no sea futura
   * @param {Date|string} date - Fecha a validar (objeto Date o string en formato DD-MM-YYYY o formato numérico DD/MM/YYYY)
   * @returns {{valid: boolean, message: string}}
   */
  function validateDateNotFuture(date) {
    let day, month, year;
    
    if (date instanceof Date) {
      day = date.getDate();
      month = date.getMonth() + 1; // Los meses en JS son 0-indexed
      year = date.getFullYear();
    } else if (typeof date === 'string') {
      // Intentar parsear formato DD-MM-YYYY o DD/MM/YYYY (soportar ambos separadores)
      const parts = date.includes('-') ? date.split('-') : date.split('/');
      if (parts.length === 3) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        return { valid: false, message: 'Formato de fecha inválido' };
      }
    } else {
      return { valid: false, message: 'Formato de fecha inválido' };
    }
    
    // Verificar que los valores son válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, message: 'Fecha inválida' };
    }
    
    // Comparar sin crear objetos Date para evitar problemas de zona horaria
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    // Comparar año, luego mes, luego día
    if (year > currentYear) {
      return { valid: false, message: 'No se permiten fechas futuras' };
    }
    if (year === currentYear && month > currentMonth) {
      return { valid: false, message: 'No se permiten fechas futuras' };
    }
    if (year === currentYear && month === currentMonth && day > currentDay) {
      return { valid: false, message: 'No se permiten fechas futuras' };
    }
    
    return { valid: true, message: '' };
  }

  /**
   * Valida que la persona tenga edad mínima
   * @param {Date|string} birthDate - Fecha de nacimiento (objeto Date o string en formato DD-MM-YYYY o DD/MM/YYYY)
   * @param {number} minAge - Edad mínima requerida (por defecto 18)
   * @returns {{valid: boolean, message: string}}
   */
  function validateMinimumAge(birthDate, minAge = 18) {
    let day, month, year;
    
    if (birthDate instanceof Date) {
      day = birthDate.getDate();
      month = birthDate.getMonth() + 1; // Los meses en JS son 0-indexed
      year = birthDate.getFullYear();
    } else if (typeof birthDate === 'string') {
      // Intentar parsear formato DD-MM-YYYY o DD/MM/YYYY (soportar ambos separadores)
      const parts = birthDate.includes('-') ? birthDate.split('-') : birthDate.split('/');
      if (parts.length === 3) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        return { valid: false, message: 'Formato de fecha inválido' };
      }
    } else {
      return { valid: false, message: 'Formato de fecha inválido' };
    }
    
    // Verificar que los valores son válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, message: 'Fecha inválida' };
    }
    
    // Calcular edad sin crear objetos Date para evitar problemas de zona horaria
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    let age = currentYear - year;
    
    // Ajustar edad si no ha cumplido años este año
    if (month > currentMonth || (month === currentMonth && day > currentDay)) {
      age--;
    }
    
    const valid = age >= minAge;
    return {
      valid,
      message: valid ? '' : `Debes ser mayor de ${minAge} años para registrarte`
    };
  }

  /**
   * Valida longitud mínima
   * @param {string} value - Valor a validar
   * @param {number} min - Longitud mínima
   * @returns {{valid: boolean, message: string}}
   */
  function validateMinLength(value, min) {
    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const valid = value.trim().length >= min;
    return {
      valid,
      message: valid ? '' : MESSAGES.minLength(min)
    };
  }

  /**
   * Valida longitud máxima
   * @param {string} value - Valor a validar
   * @param {number} max - Longitud máxima
   * @returns {{valid: boolean, message: string}}
   */
  function validateMaxLength(value, max) {
    if (isEmpty(value)) {
      return { valid: true, message: '' };
    }

    const valid = value.trim().length <= max;
    return {
      valid,
      message: valid ? '' : MESSAGES.maxLength(max)
    };
  }

  /**
   * Valida valor numérico mínimo
   * @param {number} value - Valor a validar
   * @param {number} min - Valor mínimo
   * @returns {{valid: boolean, message: string}}
   */
  function validateMin(value, min) {
    const numValue = parseFloat(value);
    const valid = !isNaN(numValue) && numValue >= min;
    return {
      valid,
      message: valid ? '' : MESSAGES.min(min)
    };
  }

  /**
   * Valida que un número no sea negativo
   * @param {string|number} value - Valor a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validateNonNegative(value, required = true) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }

    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const numValue = parseFloat(value);
    const valid = !isNaN(numValue) && numValue >= 0;
    return {
      valid,
      message: valid ? '' : 'No se permiten números negativos'
    };
  }

  /**
   * Valida valor numérico máximo
   * @param {number} value - Valor a validar
   * @param {number} max - Valor máximo
   * @returns {{valid: boolean, message: string}}
   */
  function validateMax(value, max) {
    const numValue = parseFloat(value);
    const valid = !isNaN(numValue) && numValue <= max;
    return {
      valid,
      message: valid ? '' : MESSAGES.max(max)
    };
  }

  /**
   * Valida solo letras
   * @param {string} value - Valor a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validateAlphabetic(value, required = true) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const valid = PATTERNS.alphabetic.test(value.trim());
    return {
      valid,
      message: valid ? '' : MESSAGES.alphabetic
    };
  }

  /**
   * Valida solo números
   * @param {string} value - Valor a validar
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validateNumeric(value, required = true) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const valid = PATTERNS.numeric.test(value.trim());
    return {
      valid,
      message: valid ? '' : MESSAGES.numeric
    };
  }

  /**
   * Valida número de calle (puede contener letras, números, '/', '-' y espacios)
   * Se comprueba longitud máxima y patrón permitido
   * @param {string} value
   * @param {boolean} required
   * @param {number} maxLen
   * @returns {{valid: boolean, message: string}}
   */
  function validateAddressNumber(value, required = false, maxLen = 10) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }

    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const clean = String(value).trim();
    if (clean.length > maxLen) {
      return { valid: false, message: MESSAGES.addressNumber(maxLen) };
    }

    const valid = PATTERNS.addressNumber.test(clean);
    return {
      valid,
      message: valid ? '' : MESSAGES.addressNumber(maxLen)
    };
  }

  /**
   * Valida piso o depto: restringe longitud máxima y caracteres simples
   * @param {string} value
   * @param {boolean} required
   * @param {number} minLen
   * @param {number} maxLen
   * @returns {{valid: boolean, message: string}}
   */
  function validateFloorDept(value, required = false, minLen = 1, maxLen = 5) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }

    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const clean = String(value).trim();

    if (clean.length < minLen) {
      return { valid: false, message: `Debe tener al menos ${minLen} caracter(es)` };
    }

    if (clean.length > maxLen) {
      return { valid: false, message: `No puede exceder ${maxLen} caracteres` };
    }

    // Permitir solo letras y números (sin negativos, sin caracteres especiales)
    const pattern = /^[a-zA-Z0-9]+$/;
    if (!pattern.test(clean)) {
      return {
        valid: false,
        message: 'Solo se permiten letras y números'
      };
    }

    // Si es un número puro, validar que no supere 200
    if (/^\d+$/.test(clean)) {
      const numValue = parseInt(clean, 10);
      if (numValue > 200) {
        return {
          valid: false,
          message: 'El piso no puede superar el valor de 200'
        };
      }
    }

    return { valid: true, message: '' };
  }

  /**
   * Valida nombre de persona (solo letras y espacios)
   * @param {string} value
   * @param {boolean} required
   * @returns {{valid: boolean, message: string}}
   */
  function validateName(value, required = true) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }

    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const clean = value.trim();

    if (clean.length < 2) {
      return { valid: false, message: 'Debe tener al menos 2 caracteres' };
    }

    // Solo letras (incluye acentos y ñ) y espacios
    const pattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const valid = pattern.test(clean);
    return {
      valid,
      message: valid ? '' : 'Solo se permiten letras y espacios'
    };
  }

  /**
   * Valida calle/dirección
   * @param {string} value
   * @param {boolean} required
   * @param {number} minLen
   * @returns {{valid: boolean, message: string}}
   */
  function validateStreet(value, required = true, minLen = 3) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }

    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const clean = value.trim();

    if (clean.length < minLen) {
      return { valid: false, message: `Debe tener al menos ${minLen} caracteres` };
    }

    // Permitir letras, números, espacios, puntos, comas, guiones
    const pattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,\-°ªº]+$/;
    const valid = pattern.test(clean);
    return {
      valid,
      message: valid ? '' : 'Contiene caracteres no permitidos'
    };
  }

  /**
   * Valida campo con pattern personalizado
   * @param {string} value - Valor a validar
   * @param {RegExp} pattern - Expresión regular personalizada
   * @param {string} message - Mensaje de error personalizado
   * @param {boolean} required - Si el campo es obligatorio
   * @returns {{valid: boolean, message: string}}
   */
  function validatePattern(value, pattern, message = MESSAGES.custom, required = true) {
    if (!required && isEmpty(value)) {
      return { valid: true, message: '' };
    }
    
    if (isEmpty(value)) {
      return { valid: false, message: MESSAGES.required };
    }

    const valid = pattern.test(value.trim());
    return {
      valid,
      message: valid ? '' : message
    };
  }

  /**
   * Valida campo usando función personalizada
   * @param {string} value - Valor a validar
   * @param {Function} validatorFn - Función que retorna true si es válido
   * @param {string} message - Mensaje de error
   * @returns {{valid: boolean, message: string}}
   */
  function validateCustom(value, validatorFn, message = MESSAGES.custom) {
    try {
      const valid = validatorFn(value);
      return {
        valid: !!valid,
        message: valid ? '' : message
      };
    } catch (error) {
      console.error('Error en validación personalizada:', error);
      return {
        valid: false,
        message
      };
    }
  }

  // ==================== FORMATEADORES ====================

  /**
   * Formatea un número de teléfono argentino al formato +54 9 (XXX) XXX-XXXX
   * @param {string} phone - Teléfono a formatear
   * @returns {string} - Teléfono formateado
   */
  function formatPhone(phone) {
    if (!phone) return '';
    
    // Extraer solo dígitos
    const digits = phone.replace(/\D/g, '');
    
    // Si tiene prefijo internacional (54)
    if (digits.startsWith('54')) {
      const withoutCountry = digits.substring(2);
      
      // Si tiene el 9 después del código de país
      if (withoutCountry.startsWith('9')) {
        const number = withoutCountry.substring(1);
        
        // Formato: +54 9 (XXX) XXX-XXXX o +54 9 (XXX) XXXX-XXXX
        if (number.length >= 10) {
          const areaCode = number.substring(0, 3);
          const firstPart = number.substring(3, 6);
          const secondPart = number.substring(6);
          return `+54 9 (${areaCode}) ${firstPart}-${secondPart}`;
        }
      }
    }
    
    // Si es un número local sin prefijo
    if (digits.length >= 10) {
      const areaCode = digits.substring(0, 3);
      const firstPart = digits.substring(3, 6);
      const secondPart = digits.substring(6, 10);
      return `+54 9 (${areaCode}) ${firstPart}-${secondPart}`;
    }
    
    // Si no se puede formatear, devolver tal cual
    return phone;
  }

  /**
   * Aplica formateo automático de teléfono mientras se escribe
   * @param {HTMLInputElement} input - Input de teléfono
   */
  function setupPhoneFormatting(input) {
    if (!input) return;
    
    // Marcar que este input ya tiene formateo configurado
    if (input.dataset.phoneFormattingEnabled === 'true') {
      return;
    }
    input.dataset.phoneFormattingEnabled = 'true';
    
    // Función para obtener la posición del cursor en los dígitos puros
    const getCursorPositionInDigits = (text, cursorPos) => {
      let digitCount = 0;
      for (let i = 0; i < cursorPos && i < text.length; i++) {
        if (/\d/.test(text[i])) {
          digitCount++;
        }
      }
      return digitCount;
    };
    
    // Función para obtener la posición del cursor en el texto formateado
    const getCursorPositionInFormatted = (formatted, digitPosition) => {
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          if (digitCount === digitPosition) {
            return i;
          }
          digitCount++;
        }
      }
      return formatted.length;
    };
    
    input.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      const oldValue = e.target.value;
      
      // Guardar posición del cursor en dígitos
      const cursorDigitPosition = getCursorPositionInDigits(oldValue, cursorPosition);
      
      // Extraer solo dígitos
      let digits = oldValue.replace(/\D/g, '');
      
      // Si empieza con 549, remover el prefijo (ya se agregará automáticamente)
      if (digits.startsWith('549')) {
        digits = digits.substring(3);
      } else if (digits.startsWith('54')) {
        digits = digits.substring(2);
      }
      
      // Limitar a 10 dígitos (código de área + número local)
      digits = digits.substring(0, 10);
      
      let formatted = '';
      
      if (digits.length === 0) {
        formatted = '+54 9 ';
      } else if (digits.length <= 3) {
        // Solo código de área
        formatted = `+54 9 (${digits}`;
      } else if (digits.length <= 6) {
        // Código de área + primeros dígitos
        formatted = `+54 9 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
      } else {
        // Número completo
        const areaCode = digits.substring(0, 3);
        const firstPart = digits.substring(3, 6);
        const secondPart = digits.substring(6);
        formatted = `+54 9 (${areaCode}) ${firstPart}-${secondPart}`;
      }
      
      // Solo actualizar si cambió
      if (e.target.value !== formatted) {
        e.target.value = formatted;
        
        // Restaurar posición del cursor
        const newCursorPosition = getCursorPositionInFormatted(formatted, cursorDigitPosition);
        e.target.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });
    
    // Iniciar con el prefijo si el campo está vacío
    input.addEventListener('focus', (e) => {
      if (!e.target.value || e.target.value.trim() === '') {
        e.target.value = '+54 9 ';
        e.target.setSelectionRange(7, 7);
      }
    });
    
    // Si ya tiene un valor al cargar, formatearlo
    if (input.value && input.value.trim() !== '') {
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
  }

  // ==================== UTILIDADES DE UI ====================

  /**
   * Muestra mensaje de error en un elemento
   * @param {HTMLElement} inputElement - Input que tiene el error
   * @param {string} message - Mensaje de error
   */
  function showError(inputElement, message) {
    if (!inputElement) return;

    // Remover error previo
    removeError(inputElement);

    // Agregar clase de error al input
    inputElement.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    inputElement.classList.remove('border-gray-300');
    inputElement.setAttribute('aria-invalid', 'true');

    // Crear elemento de error
    const errorElement = document.createElement('p');
    errorElement.className = 'text-red-600 text-sm mt-1 validation-error';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');

    // Insertar después del input
    inputElement.parentElement.appendChild(errorElement);
  }

  /**
   * Remueve mensaje de error de un elemento
   * @param {HTMLElement} inputElement - Input del cual remover el error
   */
  function removeError(inputElement) {
    if (!inputElement) return;

    // Remover clase de error
    inputElement.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
    inputElement.classList.add('border-gray-300');
    inputElement.removeAttribute('aria-invalid');

    // Remover mensaje de error
    const errorElement = inputElement.parentElement.querySelector('.validation-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Valida un formulario completo usando atributos data-validate
   * @param {HTMLFormElement} form - Formulario a validar
   * @returns {boolean} - true si todo es válido
   */
  function validateForm(form) {
    if (!form) return false;

    let isValid = true;
    const inputs = form.querySelectorAll('[data-validate]');

    inputs.forEach(input => {
      const result = validateField(input);
      if (!result.valid) {
        isValid = false;
        showError(input, result.message);
      } else {
        removeError(input);
      }
    });

    return isValid;
  }

  /**
   * Valida un campo individual usando atributos data-validate
   * @param {HTMLElement} input - Input a validar
   * @returns {{valid: boolean, message: string}}
   */
  function validateField(input) {
    if (!input) return { valid: false, message: 'Campo no encontrado' };

    const validationType = input.getAttribute('data-validate');
    const value = input.value;
    const required = input.hasAttribute('required') || input.getAttribute('data-required') === 'true';

    let result = { valid: true, message: '' };

    switch (validationType) {
      case 'email':
        result = validateEmail(value, required);
        break;
      case 'password':
        result = validatePassword(value, required);
        break;
      case 'phone':
        result = validatePhone(value, required);
        break;
      case 'dni':
        result = validateDNI(value, required);
        break;
      case 'cuit':
        result = validateCUIT(value, required);
        break;
      case 'postal-code':
        result = validatePostalCode(value, required);
        break;
      case 'address-number':
      case 'numero':
      case 'number':
        // Por defecto no obligatorio aquí, pasar required si corresponde
        result = validateAddressNumber(value, required, 10);
        break;
      case 'piso-depto':
      case 'piso':
      case 'depto':
        // exigir mínimo 2 y máximo 5 caracteres por defecto
        result = validateFloorDept(value, required, 2, 5);
        break;
      case 'alphabetic':
        result = validateAlphabetic(value, required);
        break;
      case 'numeric':
        result = validateNumeric(value, required);
        break;
      case 'non-negative':
        result = validateNonNegative(value, required);
        break;
      default:
        if (required) {
          result = validateRequired(value);
        }
    }

    // Validaciones adicionales
    if (result.valid) {
      const minLength = input.getAttribute('data-min-length');
      if (minLength) {
        result = validateMinLength(value, parseInt(minLength));
      }
    }

    if (result.valid) {
      const maxLength = input.getAttribute('data-max-length');
      if (maxLength) {
        result = validateMaxLength(value, parseInt(maxLength));
      }
    }

    if (result.valid) {
      const matchField = input.getAttribute('data-match');
      if (matchField) {
        const matchInput = document.getElementById(matchField);
        if (matchInput) {
          result = validateMatch(value, matchInput.value, matchInput.getAttribute('data-label') || matchField);
        }
      }
    }

    return result;
  }

  /**
   * Configura validación en tiempo real para un formulario
   * @param {HTMLFormElement} form - Formulario a configurar
   */
  function setupRealtimeValidation(form) {
    if (!form) return;

    const inputs = form.querySelectorAll('[data-validate]');

    inputs.forEach(input => {
      // Validar al perder el foco
      input.addEventListener('blur', () => {
        const result = validateField(input);
        if (!result.valid) {
          showError(input, result.message);
        } else {
          removeError(input);
        }
      });

      // Remover error al empezar a escribir
      input.addEventListener('input', () => {
        if (input.classList.contains('border-red-500')) {
          removeError(input);
        }
      });
    });

    // Validar todo el formulario al enviar
    form.addEventListener('submit', (e) => {
      if (!validateForm(form)) {
        e.preventDefault();
        
        // Hacer scroll al primer error
        const firstError = form.querySelector('.border-red-500');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
      }
    });
  }

  /**
   * Previene entrada de números negativos en inputs type="number"
   * Se puede invocar al inicio de la app para aplicarlo globalmente
   * @param {HTMLElement} container - Contenedor (por defecto document)
   */
  function preventNegativeNumbers(container = document) {
    if (!container) return;

    // Encontrar todos los inputs numéricos
    const numericInputs = container.querySelectorAll('input[type="number"]');
    
    numericInputs.forEach(input => {
      // Prevenir entrada directa de signo menos
      input.addEventListener('keydown', (e) => {
        // Bloquear teclas de signo menos (código 189 y 109)
        if (e.key === '-' || e.keyCode === 189 || e.keyCode === 109) {
          e.preventDefault();
        }
      });

      // Validar al cambiar el valor (por paste, etc.)
      input.addEventListener('input', () => {
        if (parseFloat(input.value) < 0) {
          input.value = '';
        }
      });

      // Agregar atributo min="0" si no lo tiene
      if (!input.hasAttribute('min')) {
        input.setAttribute('min', '0');
      }
    });
  }

  /**
   * Sanitiza y valida un entero
   * @param {string|number} value - Valor a sanitizar
   * @returns {number|null} Entero sanitizado o null si no es válido
   */
  function sanitizeInteger(value) {
    if (value === null || value === undefined) return null;
    
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }

  // ==================== EXPORTAR API ====================

  window.Validators = {
    // Funciones de validación individuales
    validateRequired,
    validateEmail,
    validatePassword,
    validateMatch,
    validatePhone,
    validateDNI,
    validateCUIT,
    validatePostalCode,
    validateDateStructure,
    validateDateNotFuture,
    validateMinimumAge,
    validateMinLength,
    validateMaxLength,
    validateMin,
    validateMax,
    validateNonNegative,
    validateAlphabetic,
    validateNumeric,
    validatePattern,
    validateCustom,
    
    // Utilidades de UI
    showError,
    removeError,
    validateField,
    validateForm,
    setupRealtimeValidation,
    preventNegativeNumbers,
    
    // Validadores de dirección
    validateAddressNumber,
    validateFloorDept,
    validateName,
    validateStreet,
    
    // Formateadores
    formatPhone,
    setupPhoneFormatting,
    
    // Constantes
    PATTERNS,
    MESSAGES,
    
    // Helpers
    isEmpty,
    sanitizeInteger,
  };
})();
