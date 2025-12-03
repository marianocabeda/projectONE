/**
 * Módulo de Utilidades HTTP
 * Wrapper para fetch con retry logic, timeout, interceptors y manejo de errores
 * @module http
 */

(function() {
  'use strict';

  // ==================== CONFIGURACIÓN ====================
  
  const HTTP_CONFIG = {
    timeout: 30000, // 30 segundos
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Interceptores globales
  const interceptors = {
    request: [],
    response: [],
    error: [],
  };

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Crea un timeout para fetch
   * @param {number} ms - Milisegundos de timeout
   * @returns {AbortSignal} Signal para abortar
   */
  function createTimeout(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  /**
   * Combina múltiples AbortSignals
   * @param {AbortSignal[]} signals - Signals a combinar
   * @returns {AbortSignal}
   */
  function combineSignals(signals) {
    const controller = new AbortController();
    
    signals.forEach(signal => {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort());
      }
    });
    
    return controller.signal;
  }

  /**
   * Espera un tiempo determinado (para retry)
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise}
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parsea respuesta según Content-Type
   * @param {Response} response - Respuesta de fetch
   * @returns {Promise<any>}
   */
  async function parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!contentType) {
      return null;
    }
    
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType.includes('text/')) {
      return await response.text();
    }
    
    if (contentType.includes('multipart/form-data') || contentType.includes('application/octet-stream')) {
      return await response.blob();
    }
    
    return await response.text();
  }

  // ==================== INTERCEPTORES ====================

  /**
   * Agrega interceptor de request
   * @param {Function} fn - Función interceptora (config) => config
   */
  function addRequestInterceptor(fn) {
    if (typeof fn === 'function') {
      interceptors.request.push(fn);
    }
  }

  /**
   * Agrega interceptor de response
   * @param {Function} fn - Función interceptora (response) => response
   */
  function addResponseInterceptor(fn) {
    if (typeof fn === 'function') {
      interceptors.response.push(fn);
    }
  }

  /**
   * Agrega interceptor de error
   * @param {Function} fn - Función interceptora (error) => error
   */
  function addErrorInterceptor(fn) {
    if (typeof fn === 'function') {
      interceptors.error.push(fn);
    }
  }

  /**
   * Remueve todos los interceptores
   */
  function clearInterceptors() {
    interceptors.request = [];
    interceptors.response = [];
    interceptors.error = [];
  }

  /**
   * Aplica interceptores de request
   * @param {Object} config - Configuración del request
   * @returns {Object} Configuración modificada
   */
  async function applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of interceptors.request) {
      try {
        modifiedConfig = await interceptor(modifiedConfig) || modifiedConfig;
      } catch (error) {
        console.error('Error en interceptor de request:', error);
      }
    }
    
    return modifiedConfig;
  }

  /**
   * Aplica interceptores de response
   * @param {Response} response - Respuesta HTTP
   * @returns {Response} Respuesta modificada
   */
  async function applyResponseInterceptors(response) {
    let modifiedResponse = response;
    
    for (const interceptor of interceptors.response) {
      try {
        modifiedResponse = await interceptor(modifiedResponse) || modifiedResponse;
      } catch (error) {
        console.error('Error en interceptor de response:', error);
      }
    }
    
    return modifiedResponse;
  }

  /**
   * Aplica interceptores de error
   * @param {Error} error - Error capturado
   * @returns {Error} Error modificado
   */
  async function applyErrorInterceptors(error) {
    let modifiedError = error;
    
    for (const interceptor of interceptors.error) {
      try {
        modifiedError = await interceptor(modifiedError) || modifiedError;
      } catch (err) {
        console.error('Error en interceptor de error:', err);
      }
    }
    
    return modifiedError;
  }

  // ==================== FUNCIÓN PRINCIPAL DE REQUEST ====================

  /**
   * Realiza request HTTP con todas las features
   * @param {string} url - URL del request
   * @param {Object} options - Opciones del request
   * @returns {Promise<Object>} Objeto con {ok, status, data, headers, response}
   */
  async function request(url, options = {}) {
    const config = {
      method: 'GET',
      timeout: HTTP_CONFIG.timeout,
      maxRetries: HTTP_CONFIG.maxRetries,
      retryDelay: HTTP_CONFIG.retryDelay,
      headers: { ...HTTP_CONFIG.headers },
      credentials: 'include',
      ...options,
    };

    // Aplicar interceptores de request
    const finalConfig = await applyRequestInterceptors(config);

    // Preparar headers
    const headers = new Headers(finalConfig.headers);

    // USAR AuthToken.authenticatedFetch SI ESTÁ DISPONIBLE Y NO ES UNA PETICIÓN PÚBLICA
    const isPublicEndpoint = url.includes('/login') || 
                             url.includes('/register') || 
                             url.includes('/forgot-password') || 
                             url.includes('/reset-password') ||
                             url.includes('/verify-email') ||
                             url.includes('/reenvio-email-verificacion') || // Reenvío de verificación (público)
                             url.includes('/check-email') ||
                             url.includes('/cambiar-password') && !url.includes('/cambiar-password-auth') || // Reset sin auth
                             finalConfig._skipAuth === true;
    
    if (!isPublicEndpoint && 
        window.AuthToken && 
        typeof window.AuthToken.authenticatedFetch === 'function') {
      
      try {
        // authenticatedFetch maneja el refresh automáticamente
        const response = await window.AuthToken.authenticatedFetch(url, finalConfig);
        
        // Aplicar interceptores de response
        const finalResponse = await applyResponseInterceptors(response);
        
        // Parsear respuesta
        let data = null;
        try {
          data = await parseResponse(finalResponse);
        } catch (parseError) {
          console.warn('Error parseando respuesta:', parseError);
        }
        
        // Retornar resultado
        return {
          ok: finalResponse.ok,
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          data,
          headers: finalResponse.headers,
          response: finalResponse,
        };
      } catch (error) {
        // Aplicar interceptores de error
        const finalError = await applyErrorInterceptors(error);
        throw finalError;
      }
    }
    
    // Para endpoints públicos o si AuthToken no está disponible, usar fetch normal
    // Agregar token de autenticación desde getAuthHeader (access_token en Authorization header)
    if (window.AuthToken && typeof window.AuthToken.getAuthHeader === 'function') {
      const authHeader = window.AuthToken.getAuthHeader();
      if (authHeader.Authorization) {
        headers.set('Authorization', authHeader.Authorization);
      }
    }

    // Preparar body
    let body = finalConfig.body;
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
      body = JSON.stringify(body);
    }

    // Preparar AbortSignal
    const signals = [];
    if (finalConfig.timeout) {
      signals.push(createTimeout(finalConfig.timeout));
    }
    if (finalConfig.signal) {
      signals.push(finalConfig.signal);
    }
    const signal = signals.length > 0 ? combineSignals(signals) : undefined;

    // Función para ejecutar el request
    const executeRequest = async (attempt = 1) => {
      try {
        const response = await fetch(url, {
          method: finalConfig.method,
          headers,
          body,
          credentials: finalConfig.credentials,
          signal,
          mode: finalConfig.mode,
          cache: finalConfig.cache,
          redirect: finalConfig.redirect,
        });

        // Aplicar interceptores de response
        const finalResponse = await applyResponseInterceptors(response);

        // Si la respuesta no es ok y es retryable
        if (!finalResponse.ok && 
            HTTP_CONFIG.retryableStatuses.includes(finalResponse.status) &&
            attempt < finalConfig.maxRetries) {
          
          const backoff = window.ErrorHandler 
            ? window.ErrorHandler.calculateBackoff(attempt, finalConfig.retryDelay)
            : finalConfig.retryDelay * Math.pow(2, attempt - 1);
          
          console.warn(`Request failed with status ${finalResponse.status}. Retrying in ${backoff}ms... (attempt ${attempt + 1}/${finalConfig.maxRetries})`);
          
          await delay(backoff);
          return executeRequest(attempt + 1);
        }

        // Parsear respuesta
        let data = null;
        try {
          data = await parseResponse(finalResponse);
        } catch (parseError) {
          console.warn('Error parseando respuesta:', parseError);
        }

        // Retornar resultado
        const result = {
          ok: finalResponse.ok,
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          data,
          headers: finalResponse.headers,
          response: finalResponse,
        };

        // Si no es ok, lanzar error
        if (!finalResponse.ok) {
          const error = new Error(`HTTP ${finalResponse.status}: ${finalResponse.statusText}`);
          error.response = finalResponse;
          error.data = data;
          error.status = finalResponse.status;
          throw error;
        }

        return result;
      } catch (error) {
        // Aplicar interceptores de error
        const finalError = await applyErrorInterceptors(error);

        // Si es timeout o network error y podemos reintentar
        if ((finalError.name === 'AbortError' || finalError.message.includes('Failed to fetch')) &&
            attempt < finalConfig.maxRetries) {
          
          const backoff = window.ErrorHandler 
            ? window.ErrorHandler.calculateBackoff(attempt, finalConfig.retryDelay)
            : finalConfig.retryDelay * Math.pow(2, attempt - 1);
          
          console.warn(`Request failed: ${finalError.message}. Retrying in ${backoff}ms... (attempt ${attempt + 1}/${finalConfig.maxRetries})`);
          
          await delay(backoff);
          return executeRequest(attempt + 1);
        }

        // Si no podemos reintentar, lanzar error
        throw finalError;
      }
    };

    return executeRequest();
  }

  // ==================== MÉTODOS HTTP ESPECÍFICOS ====================

  /**
   * Realiza GET request
   * @param {string} url - URL del request
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async function get(url, options = {}) {
    return request(url, { ...options, method: 'GET' });
  }

  /**
   * Realiza POST request
   * @param {string} url - URL del request
   * @param {any} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async function post(url, data = null, options = {}) {
    return request(url, { ...options, method: 'POST', body: data });
  }

  /**
   * Realiza PUT request
   * @param {string} url - URL del request
   * @param {any} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async function put(url, data = null, options = {}) {
    return request(url, { ...options, method: 'PUT', body: data });
  }

  /**
   * Realiza PATCH request
   * @param {string} url - URL del request
   * @param {any} data - Datos a enviar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async function patch(url, data = null, options = {}) {
    return request(url, { ...options, method: 'PATCH', body: data });
  }

  /**
   * Realiza DELETE request
   * @param {string} url - URL del request
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async function del(url, options = {}) {
    return request(url, { ...options, method: 'DELETE' });
  }

  // ==================== UTILIDADES ADICIONALES ====================

  /**
   * Construye query string desde objeto
   * @param {Object} params - Parámetros
   * @returns {string} Query string
   */
  function buildQueryString(params) {
    if (!params || typeof params !== 'object') return '';
    
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Construye URL completa con query params
   * @param {string} baseUrl - URL base
   * @param {Object} params - Parámetros
   * @returns {string} URL completa
   */
  function buildURL(baseUrl, params = {}) {
    return baseUrl + buildQueryString(params);
  }

  /**
   * Descarga un archivo desde URL
   * @param {string} url - URL del archivo
   * @param {string} filename - Nombre del archivo a guardar
   */
  async function downloadFile(url, filename) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      throw error;
    }
  }

  /**
   * Sube archivo mediante FormData
   * @param {string} url - URL destino
   * @param {File} file - Archivo a subir
   * @param {Object} additionalData - Datos adicionales
   * @param {Function} onProgress - Callback de progreso
   * @returns {Promise<Object>}
   */
  async function uploadFile(url, file, additionalData = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    // Para upload con progress necesitamos usar XMLHttpRequest
    if (onProgress && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ ok: true, status: xhr.status, data });
            } catch (e) {
              resolve({ ok: true, status: xhr.status, data: xhr.responseText });
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Error de red'));
        });
        
        xhr.open('POST', url);
        
        // Agregar token desde AuthToken.getToken() (access_token)
        if (window.AuthToken && typeof window.AuthToken.getToken === 'function') {
          const token = window.AuthToken.getToken();
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }
        
        xhr.send(formData);
      });
    }

    // Sin progress, usar fetch normal
    return post(url, formData, {
      headers: {}, // No especificar Content-Type para que el navegador lo haga automáticamente con boundary
    });
  }

  // ==================== EXPORTAR API ====================

  window.HTTP = {
    // Métodos principales
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    
    // Utilidades
    buildQueryString,
    buildURL,
    downloadFile,
    uploadFile,
    
    // Interceptores
    addRequestInterceptor,
    addResponseInterceptor,
    addErrorInterceptor,
    clearInterceptors,
    
    // Configuración
    config: HTTP_CONFIG,
  };

})();
