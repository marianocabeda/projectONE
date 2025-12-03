/**
 * Calculadora de Documentos Argentinos (CUIL/CUIT)
 * Implementa el algoritmo oficial de AFIP para calcular CUIL/CUIT
 * @module DocumentCalculator
 */

(function() {
  'use strict';

  /**
   * Calcula el CUIL/CUIT según el algoritmo de AFIP
   * @param {string} dni - DNI (7 u 8 dígitos)
   * @param {string} sexo - Sexo: 'Masculino', 'Femenino', 'Otro'
   * @returns {{cuil: string, formatted: string}|null} - CUIL calculado o null si los datos son inválidos
   */
  function calculateCUIL(dni, sexo) {
    if (!dni || !sexo) {
      return null;
    }

    // Limpiar DNI y asegurar 8 dígitos
    let cleanDNI = dni.replace(/\D/g, '');
    if (cleanDNI.length === 7) {
      cleanDNI = cleanDNI.padStart(8, '0');
    }
    
    if (cleanDNI.length !== 8) {
      return null;
    }

    // Determinar prefijo según sexo
    let prefixes = [];
    const sexoLower = sexo.toLowerCase();
    
    if (sexoLower === 'masculino') {
      prefixes = ['20', '23'];  // 20 para hombres, 23 si hay colisión
    } else if (sexoLower === 'femenino') {
      prefixes = ['27', '23'];  // 27 para mujeres, 23 si hay colisión
    } else {
      prefixes = ['23', '24'];  // 23/24 para otros casos
    }

    // Intentar calcular con cada prefijo posible
    for (const prefix of prefixes) {
      const base = prefix + cleanDNI;
      const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      
      for (let i = 0; i < 10; i++) {
        sum += parseInt(base[i]) * mult[i];
      }
      
      let verifier = 11 - (sum % 11);
      
      // Casos especiales
      if (verifier === 11) {
        verifier = 0;
      } else if (verifier === 10) {
        // Si el dígito verificador es 10, usar el siguiente prefijo
        continue;
      }
      
      const cuil = base + verifier;
      const formatted = `${cuil.substring(0, 2)}-${cuil.substring(2, 10)}-${cuil.substring(10)}`;
      
      return {
        cuil: cuil,
        formatted: formatted
      };
    }
    
    // Si ningún prefijo funcionó, usar el primero con verificador 9
    const prefix = prefixes[0];
    const base = prefix + cleanDNI;
    const cuil = base + '9';
    const formatted = `${cuil.substring(0, 2)}-${cuil.substring(2, 10)}-${cuil.substring(10)}`;
    
    return {
      cuil: cuil,
      formatted: formatted
    };
  }

  /**
   * Valida que un CUIL/CUIT sea correcto según el algoritmo de AFIP
   * @param {string} cuil - CUIL/CUIT a validar (con o sin guiones)
   * @returns {boolean} - true si es válido
   */
  function validateCUIL(cuil) {
    if (!cuil) return false;

    const cleanCUIL = cuil.replace(/\D/g, '');
    
    if (cleanCUIL.length !== 11) {
      return false;
    }

    // Validación del dígito verificador
    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCUIL[i]) * mult[i];
    }
    
    const verifier = 11 - (sum % 11);
    const calculatedVerifier = verifier === 11 ? 0 : verifier === 10 ? 9 : verifier;
    
    return calculatedVerifier === parseInt(cleanCUIL[10]);
  }

  /**
   * Formatea un CUIL/CUIT con guiones
   * @param {string} cuil - CUIL/CUIT sin formato
   * @returns {string} - CUIL formateado (XX-XXXXXXXX-X)
   */
  function formatCUIL(cuil) {
    if (!cuil) return '';
    
    const cleanCUIL = cuil.replace(/\D/g, '');
    
    if (cleanCUIL.length !== 11) {
      return cuil;
    }
    
    return `${cleanCUIL.substring(0, 2)}-${cleanCUIL.substring(2, 10)}-${cleanCUIL.substring(10)}`;
  }

  /**
   * Extrae el DNI de un CUIL/CUIT
   * @param {string} cuil - CUIL/CUIT (con o sin guiones)
   * @returns {string|null} - DNI extraído o null si es inválido
   */
  function extractDNIFromCUIL(cuil) {
    if (!cuil) return null;
    
    const cleanCUIL = cuil.replace(/\D/g, '');
    
    if (cleanCUIL.length !== 11) {
      return null;
    }
    
    return cleanCUIL.substring(2, 10);
  }

  // Exportar API
  window.DocumentCalculator = {
    calculateCUIL,
    validateCUIL,
    formatCUIL,
    extractDNIFromCUIL
  };

})();
