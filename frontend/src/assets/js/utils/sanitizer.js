/**
 * Sistema de Sanitización de Inputs
 * Previene XSS, injection y otros ataques mediante sanitización de datos
 * @module sanitizer
 */

(function() {
  'use strict';

  // ==================== MAPEOS DE CARACTERES ====================
  
  const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
    /data:text\/html/gi,
  ];

  // ==================== FUNCIONES DE SANITIZACIÓN ====================

  /**
   * Escapa caracteres HTML para prevenir XSS
   * @param {string} str - String a escapar
   * @returns {string} String escapado
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    
    return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
  }

  /**
   * Remueve etiquetas HTML de un string
   * @param {string} str - String a limpiar
   * @returns {string} String sin HTML
   */
  function stripHTML(str) {
    if (typeof str !== 'string') return '';
    
    // Primero escapamos para prevenir ejecución
    const escaped = escapeHTML(str);
    
    // Luego removemos las entidades escapadas (tags)
    return escaped.replace(/&lt;[^&]*&gt;/g, '');
  }

  /**
   * Sanitiza un string removiendo código peligroso
   * @param {string} str - String a sanitizar
   * @returns {string} String sanitizado
   */
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    let sanitized = str;
    
    // Remover patrones peligrosos
    DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Escapar HTML restante
    sanitized = escapeHTML(sanitized);
    
    return sanitized.trim();
  }

  /**
   * Sanitiza un email
   * @param {string} email - Email a sanitizar
   * @returns {string} Email sanitizado
   */
  function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w\s@.\-+]/g, '') // Solo permitir caracteres válidos en emails
      .substring(0, 254); // Longitud máxima de email
  }

  /**
   * Sanitiza un número de teléfono
   * @param {string} phone - Teléfono a sanitizar
   * @returns {string} Teléfono sanitizado en formato +54 9 (XXX) XXX-XXXX
   */
  function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';
    
    // Extraer solo dígitos
    let digits = phone.replace(/\D/g, '');
    
    // Si no hay dígitos, retornar vacío
    if (digits.length === 0) return '';
    
    // Si empieza con 549, remover el prefijo argentino
    if (digits.startsWith('549')) {
      digits = digits.substring(3);
    } else if (digits.startsWith('54')) {
      digits = digits.substring(2);
    }
    
    // Limitar a 10 dígitos (código de área + número local)
    digits = digits.substring(0, 10);
    
    // Si tiene menos de 10 dígitos, retornar sin formato completo
    if (digits.length < 10) {
      // Formatear parcialmente lo que hay
      if (digits.length <= 3) {
        return `+54 9 (${digits}`;
      } else if (digits.length <= 6) {
        return `+54 9 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
      } else {
        const areaCode = digits.substring(0, 3);
        const firstPart = digits.substring(3, 6);
        const secondPart = digits.substring(6);
        return `+54 9 (${areaCode}) ${firstPart}-${secondPart}`;
      }
    }
    
    // Formatear número completo: +54 9 (XXX) XXX-XXXX
    const areaCode = digits.substring(0, 3);
    const firstPart = digits.substring(3, 6);
    const secondPart = digits.substring(6, 10);
    
    return `+54 9 (${areaCode}) ${firstPart}-${secondPart}`;
  }

  /**
   * Sanitiza un DNI
   * @param {string} dni - DNI a sanitizar
   * @returns {string} DNI sanitizado (solo números)
   */
  function sanitizeDNI(dni) {
    if (typeof dni !== 'string') return '';
    
    return dni.replace(/\D/g, '').substring(0, 8);
  }

  /**
   * Sanitiza un CUIT
   * @param {string} cuit - CUIT a sanitizar
   * @returns {string} CUIT sanitizado
   */
  function sanitizeCUIT(cuit) {
    if (typeof cuit !== 'string') return '';
    
    // Mantener solo números y guiones
    return cuit
      .trim()
      .replace(/[^\d\-]/g, '')
      .substring(0, 13); // XX-XXXXXXXX-X
  }

  /**
   * Sanitiza un código postal
   * @param {string} postalCode - Código postal a sanitizar
   * @returns {string} Código postal sanitizado
   */
  function sanitizePostalCode(postalCode) {
    if (typeof postalCode !== 'string') return '';
    
    return postalCode.replace(/\D/g, '').substring(0, 4);
  }

  /**
   * Sanitiza un nombre (solo letras y espacios)
   * @param {string} name - Nombre a sanitizar
   * @returns {string} Nombre sanitizado
   */
  function sanitizeName(name) {
    if (typeof name !== 'string') return '';
    
    return name
      .trim()
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .substring(0, 100);
  }

  /**
   * Sanitiza una dirección
   * @param {string} address - Dirección a sanitizar
   * @returns {string} Dirección sanitizada
   */
  function sanitizeAddress(address) {
    if (typeof address !== 'string') return '';
    
    // Permitir letras, números, espacios, comas, puntos, guiones, °, ª, º
    // Preservar "/" para "S/N"
    return address
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,\-°ªº\/]/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 200);
  }

  /**
   * Sanitiza calle (nombre de calle)
   * @param {string} street - Calle a sanitizar
   * @returns {string} Calle sanitizada
   */
  function sanitizeStreet(street) {
    if (typeof street !== 'string') return '';
    
    // Permitir letras, números, espacios, comas, puntos, guiones
    return street
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,\-°ªº]/g, '')
      .replace(/\s+/g, ' ')
      .substring(0, 150);
  }

  /**
   * Sanitiza número de dirección (puede ser "S/N")
   * @param {string} addressNumber - Número a sanitizar
   * @returns {string} Número sanitizado
   */
  function sanitizeAddressNumber(addressNumber) {
    if (typeof addressNumber !== 'string') return '';
    
    const trimmed = addressNumber.trim().toUpperCase();
    
    // Si es "S/N" o variante, normalizar
    if (/^S\s*\/?\s*N$/i.test(trimmed)) {
      return 'S/N';
    }
    
    // Si no, permitir solo números, letras y espacios
    return trimmed
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .substring(0, 10);
  }

  /**
   * Sanitiza piso (solo alfanuméricos, sin espacios)
   * @param {string} floor - Piso a sanitizar
   * @returns {string} Piso sanitizado
   */
  function sanitizeFloor(floor) {
    if (typeof floor !== 'string') return '';
    
    // Solo letras y números, sin espacios ni caracteres especiales
    return floor
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 5);
  }

  /**
   * Sanitiza departamento (solo alfanuméricos, sin espacios)
   * @param {string} dept - Departamento a sanitizar
   * @returns {string} Departamento sanitizado
   */
  function sanitizeDept(dept) {
    if (typeof dept !== 'string') return '';
    
    // Solo letras y números, sin espacios ni caracteres especiales
    return dept
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 5);
  }

  /**
   * Sanitiza un número
   * @param {string|number} num - Número a sanitizar
   * @returns {string} Número sanitizado
   */
  function sanitizeNumber(num) {
    if (typeof num === 'number') return num.toString();
    if (typeof num !== 'string') return '';
    
    return num.replace(/[^\d.\-]/g, '').substring(0, 20);
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

  /**
   * Sanitiza una URL
   * @param {string} url - URL a sanitizar
   * @param {boolean} checkWhitelist - Si debe verificar contra whitelist de dominios
   * @returns {string} URL sanitizada
   */
  function sanitizeURL(url, checkWhitelist = false) {
    if (typeof url !== 'string') return '';
    
    const trimmed = url.trim();
    
    // Remover javascript: y data: schemes
    if (/^(javascript|data):/i.test(trimmed)) {
      return '';
    }
    
    try {
      const urlObj = new URL(trimmed);
      // Solo permitir http y https
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return '';
      }
      
      // Verificar whitelist si está habilitado
      if (checkWhitelist) {
        const ALLOWED_DOMAINS = [
          'oneinternet.com.ar',
          'api.oneinternet.com.ar',
          'localhost',
          '127.0.0.1'
        ];
        
        const isAllowed = ALLOWED_DOMAINS.some(domain => 
          urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );
        
        if (!isAllowed) {
          console.warn('URL no permitida:', urlObj.hostname);
          return '';
        }
      }
      
      return urlObj.href;
    } catch (e) {
      // Si no es una URL válida, retornar vacío
      return '';
    }
  }

  /**
   * Valida que una URL sea segura para navegación
   * Más estricto que sanitizeURL, rechaza URLs relativas
   * @param {string} url - URL a validar
   * @param {boolean} checkWhitelist - Si debe verificar contra whitelist
   * @returns {boolean} true si es segura
   */
  function isSafeURL(url, checkWhitelist = false) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    
    // Rechazar URLs vacías o placeholders
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
    
    try {
      const parsed = new URL(trimmed, window.location.origin);
      // Solo permitir http y https
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      
      // Verificar whitelist si está habilitado
      if (checkWhitelist) {
        const ALLOWED_DOMAINS = [
          'oneinternet.com.ar',
          'api.oneinternet.com.ar',
          'localhost',
          '127.0.0.1'
        ];
        
        return ALLOWED_DOMAINS.some(domain => 
          parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
        );
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitiza datos de un objeto (útil para formularios)
   * @param {Object} data - Objeto con datos a sanitizar
   * @param {Object} schema - Schema que define tipo de sanitización por campo
   * @returns {Object} Objeto sanitizado
   */
  function sanitizeObject(data, schema = {}) {
    if (typeof data !== 'object' || data === null) return {};
    
    const sanitized = {};
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      const type = schema[key] || 'string';
      
      switch (type) {
        case 'email':
          sanitized[key] = sanitizeEmail(value);
          break;
        case 'phone':
          sanitized[key] = sanitizePhone(value);
          break;
        case 'dni':
          sanitized[key] = sanitizeDNI(value);
          break;
        case 'cuit':
          sanitized[key] = sanitizeCUIT(value);
          break;
        case 'postal-code':
          sanitized[key] = sanitizePostalCode(value);
          break;
        case 'name':
          sanitized[key] = sanitizeName(value);
          break;
        case 'address':
          sanitized[key] = sanitizeAddress(value);
          break;
        case 'number':
          sanitized[key] = sanitizeNumber(value);
          break;
        case 'url':
          sanitized[key] = sanitizeURL(value);
          break;
        case 'html':
          sanitized[key] = escapeHTML(value);
          break;
        case 'strip-html':
          sanitized[key] = stripHTML(value);
          break;
        default:
          sanitized[key] = sanitizeString(value);
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitiza los valores de un formulario
   * @param {HTMLFormElement} form - Formulario a sanitizar
   * @returns {Object} Objeto con valores sanitizados
   */
  function sanitizeFormData(form) {
    if (!form || !(form instanceof HTMLFormElement)) {
      console.error('sanitizeFormData requiere un elemento form válido');
      return {};
    }
    
    const formData = new FormData(form);
    const sanitized = {};
    const schema = {};
    
    // Construir schema desde atributos data-sanitize
    form.querySelectorAll('[name]').forEach(input => {
      const sanitizeType = input.getAttribute('data-sanitize');
      if (sanitizeType) {
        schema[input.name] = sanitizeType;
      }
    });
    
    // Sanitizar cada campo
    for (const [key, value] of formData.entries()) {
      sanitized[key] = sanitizeObject({ [key]: value }, schema)[key];
    }
    
    return sanitized;
  }

  /**
   * Configura sanitización automática en inputs
   * @param {HTMLFormElement} form - Formulario a configurar
   */
  function setupAutoSanitize(form) {
    if (!form) return;
    
    const inputs = form.querySelectorAll('[data-sanitize]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        const sanitizeType = input.getAttribute('data-sanitize');
        const value = input.value;
        
        let sanitized = value;
        
        switch (sanitizeType) {
          case 'email':
            sanitized = sanitizeEmail(value);
            break;
          case 'phone':
            sanitized = sanitizePhone(value);
            break;
          case 'dni':
            sanitized = sanitizeDNI(value);
            break;
          case 'cuit':
            sanitized = sanitizeCUIT(value);
            break;
          case 'postal-code':
            sanitized = sanitizePostalCode(value);
            break;
          case 'name':
            sanitized = sanitizeName(value);
            break;
          case 'address':
            sanitized = sanitizeAddress(value);
            break;
          case 'number':
            sanitized = sanitizeNumber(value);
            break;
          case 'html':
            sanitized = escapeHTML(value);
            break;
          case 'strip-html':
            sanitized = stripHTML(value);
            break;
          default:
            sanitized = sanitizeString(value);
        }
        
        if (sanitized !== value) {
          input.value = sanitized;
        }
      });
    });
  }

  /**
   * Previene inyección en consultas (básico - el servidor debe hacer validación principal)
   * IMPORTANTE: Esta es solo una capa básica de protección.
   * El backend DEBE validar y sanitizar todos los inputs.
   * @param {string} str - String a limpiar
   * @returns {string} String limpio
   */
  function preventSQLInjection(str) {
    if (typeof str !== 'string') return '';
    
    // Remover caracteres peligrosos para SQL
    return str
      .replace(/'/g, "''") // Escapar comillas simples
      .replace(/;/g, '') // Remover punto y coma
      .replace(/--/g, '') // Remover comentarios SQL
      .replace(/\/\*/g, '') // Remover inicio de comentario multilinea
      .replace(/\*\//g, ''); // Remover fin de comentario multilinea
  }

  /**
   * Limpia caracteres de control y no imprimibles
   * @param {string} str - String a limpiar
   * @returns {string} String limpio
   */
  function removeControlCharacters(str) {
    if (typeof str !== 'string') return '';
    
    // Remover caracteres de control excepto salto de línea y tab
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Trunca un string a una longitud máxima
   * @param {string} str - String a truncar
   * @param {number} maxLength - Longitud máxima
   * @param {string} suffix - Sufijo a agregar si se trunca
   * @returns {string} String truncado
   */
  function truncate(str, maxLength = 100, suffix = '...') {
    if (typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  // ==================== EXPORTAR API ====================

  window.Sanitizer = {
    // Funciones de sanitización específicas
    escapeHTML,
    stripHTML,
    sanitizeString,
    sanitizeEmail,
    sanitizePhone,
    sanitizeDNI,
    sanitizeCUIT,
    sanitizePostalCode,
    sanitizeName,
    sanitizeAddress,
    sanitizeStreet,
    sanitizeAddressNumber,
    sanitizeFloor,
    sanitizeDept,
    sanitizeNumber,
    sanitizeURL,
    isSafeURL,
    
    // Sanitización de estructuras
    sanitizeObject,
    sanitizeFormData,
    
    // Configuración automática
    setupAutoSanitize,
    
    // Utilidades
    preventSQLInjection,
    removeControlCharacters,
    truncate,
    sanitizeInteger,
    sanitizeText: sanitizeString,
    sanitizeHtml: stripHTML,
    
    // Constantes
    HTML_ENTITIES,
    DANGEROUS_PATTERNS,
  };
})();
