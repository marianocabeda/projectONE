// Utilitario avanzado para manejar autenticación híbrida.
// El access_token se guarda en memoria/localStorage y se envía en Authorization header.
// El refresh_token se maneja como cookie httpOnly (más seguro).
(function () {
  'use strict';
  
  const globalScope = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
  const nativeFetch = globalScope.fetch ? globalScope.fetch.bind(globalScope) : null;
  
  // 🔑 Almacenamiento del access_token en memoria (más seguro que localStorage)
  let accessTokenMemory = null;
  
  if (!nativeFetch) {
    throw new Error('Fetch API no está disponible en este entorno. AuthToken requiere fetch para funcionar.');
  }
  
  // Usar configuración centralizada
  const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
    const API_BASE_URL = window.AppConfig?.API_BASE_URL;
    if (endpoint.startsWith('http')) return endpoint;
    if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
    return endpoint;
  });
  
  const getConfig = () => ({
    routes: {
      login: window.AppConfig?.routes?.login || '/login',
      dashboard: window.AppConfig?.routes?.dashboard || '/dashboard',
    },
  });
  
  let isRefreshing = false;
  let refreshPromise = null; // Promise del refresh en curso
  let refreshSubscribers = [];
  
  // ==================== MANEJO DE ACCESS TOKEN ====================
  
  /**
   * Guarda el access token en memoria y localStorage
   * @param {string} token - El access token JWT
   */
  function saveToken(token) {
    if (!token) {
      console.warn('⚠️ Intentando guardar token vacío');
      return;
    }
    
    // Guardar en memoria (prioridad)
    accessTokenMemory = token;
    
    // Guardar en localStorage como respaldo
    try {
      localStorage.setItem('access_token', token);
    } catch (e) {
      console.warn('No se pudo guardar token en localStorage:', e);
    }
  }
  
  /**
   * Obtiene el access token de memoria o localStorage
   * @returns {string|null} El access token o null si no existe
   */
  function getToken() {
    // Primero intentar desde memoria
    if (accessTokenMemory) {
      return accessTokenMemory;
    }
    
    // Fallback a localStorage
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        accessTokenMemory = token; // Sincronizar con memoria
        return token;
      }
    } catch (e) {
      console.warn('No se pudo leer token de localStorage:', e);
    }
    
    return null;
  }
  
  /**
   * Limpia el access token de memoria y localStorage
   */
  function clearToken() {
    accessTokenMemory = null;
    try {
      localStorage.removeItem('access_token');
    } catch (e) {
      // ignore
    }
  }
  
  /**
   * Obtiene el header de autorización con el token
   * @returns {Object} Header con Authorization o vacío
   */
  function getAuthHeader() {
    const token = getToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  }
  
  // Helper: Detectar logout en progreso
  function isLogoutInProgress() {
    try {
      if (window.isLoggingOut) return true;
      if (window._suppressAuthRedirect) return true;
      const ts = parseInt(localStorage.getItem('logout_in_progress') || '0', 10);
      if (ts && !Number.isNaN(ts)) {
        // Considerar logout válido por 5 segundos
        if (Date.now() - ts < 5000) return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }
  
  // ==================== REFRESH TOKEN ====================
  
  /**
   * Helper para detectar cookies duplicadas
   */
  function detectDuplicateCookies() {
    const cookies = document.cookie.split(';').map(c => c.trim());
    const cookieNames = {};
    
    cookies.forEach(cookie => {
      const [name] = cookie.split('=');
      if (cookieNames[name]) {
        cookieNames[name]++;
      } else {
        cookieNames[name] = 1;
      }
    });
    
    const duplicates = Object.entries(cookieNames).filter(([_, count]) => count > 1);
    return duplicates.length > 0;
  }
  
  /**
   * Refresca el access token usando el refresh token (cookie httpOnly)
   */
  async function refreshAccessToken() {
    try {
      // 🔒 NO intentar refrescar si estamos en proceso de logout
      if (isLogoutInProgress()) {
        console.log('⚠️ Refresh token cancelado: logout en progreso');
        return null;
      }
      
      // Si ya hay un refresh en curso, esperar a que termine y retornar su resultado
      if (isRefreshing && refreshPromise) {
        return refreshPromise;
      }
      
      // Marcar que estamos refrescando y crear la promesa
      isRefreshing = true;
      
      refreshPromise = (async () => {
        try {
          detectDuplicateCookies();
          
          const refreshUrl = getUrl('refresh');
          
          const response = await nativeFetch(refreshUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          });
          
          if (response.ok) {
            // El backend actualiza el refresh_token en cookie httpOnly
            // Y retorna el nuevo access_token en JSON: {"token": "..."}
            const data = await response.json();
            const newToken = data?.token || data?.data?.token;
            
            if (newToken) {
              saveToken(newToken);
              console.log('✅ Access token refrescado exitosamente');
              onTokenRefreshed();
              return true;
            } else {
              console.error('❌ No se recibió access_token en el refresh. Respuesta:', data);
              return null;
            }
          } else {
            // Si el servidor responde 401 explícitamente, el refresh token es inválido/expirado/revocado
            if (response.status === 401) {
              // Mostrar modal de sesión expirada si está disponible
              if (window.SessionExpiredModal && typeof window.SessionExpiredModal.show === 'function') {
                setTimeout(() => {
                  if (!window.SessionExpiredModal.isVisible()) {
                    window.SessionExpiredModal.show();
                  }
                }, 100);
              }
            }
            
            return null;
          }
        } finally {
          // Limpiar estado de refresh
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
      
      return refreshPromise;
      
    } catch (error) {
      // Limpiar estado
      isRefreshing = false;
      refreshPromise = null;
      
      // Delegar a ErrorHandler si está disponible
      if (window.ErrorHandler && !isLogoutInProgress()) {
        try {
          window.ErrorHandler.handleHTTPError(error, 'login', false);
        } catch (e) {
          console.error('Error en ErrorHandler:', e);
        }
      }
      return null;
    }
  }
  
  // Manejar múltiples requests mientras se refresca el token
  function subscribeTokenRefresh(callback) {
    refreshSubscribers.push(callback);
  }
  
  function onTokenRefreshed() {
    refreshSubscribers.forEach(callback => callback());
    refreshSubscribers = [];
  }
  
  // ==================== FETCH WRAPPER ====================
  
  async function authenticatedFetch(url, options = {}) {
    // MODO DESARROLLO: Fetch sin autenticación
    if (window.ENV && window.ENV.isDevelopment) {
      // Hacer fetch normal sin headers de autenticación
      const fetchOptions = {
        ...options,
        credentials: options.credentials || 'include',
      };
      
      return nativeFetch(url, fetchOptions);
    }
    
    // STAGING/PRODUCTION: Fetch con cookies httpOnly
    // NO realizar peticiones autenticadas si estamos en logout
    if (isLogoutInProgress()) {
      throw new Error('Logout en progreso');
    }
    
    // Preparar body: si es un objeto, convertir a JSON
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob) && typeof body !== 'string') {
      try {
        body = JSON.stringify(body);
      } catch (e) {
        console.warn('Error al serializar body:', e);
      }
    }
    
    // Obtener access_token y agregar a headers
    const token = getToken();
    
    // Fetch con credentials para enviar refresh_token cookie Y Authorization header con access_token
    const fetchOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body,
      credentials: options.credentials || 'include',
    };
    
    const response = await nativeFetch(url, fetchOptions);
    
    // Si recibimos 401, intentar refrescar una vez más (solo si NO estamos en logout)
    if (response.status === 401 && !options._retry && !isLogoutInProgress()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Reintentar con la nueva cookie
        return authenticatedFetch(url, { ...options, _retry: true });
      } else {
        // Mostrar modal de sesión expirada
        if (window.SessionExpiredModal && typeof window.SessionExpiredModal.show === 'function') {
          if (!window.SessionExpiredModal.isVisible()) {
            window.SessionExpiredModal.show();
          }
          // No redirigir automáticamente - dejar que el usuario decida
          throw new Error('Sesión expirada - esperando acción del usuario');
        } else {
          // Fallback: redirigir a login
          const config = getConfig();
          if (!isLogoutInProgress()) {
            if (!window.location.pathname.includes('/login.html') && !isLogoutInProgress()) {
              window.location.href = config.routes.login + '?status=error&msg=' +
                encodeURIComponent('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
          }
          throw new Error('No autenticado');
        }
      }
    }
    
    return response;
  }
  
  // ==================== LOGOUT ====================
  
  async function logout() {
    try {
      // 🔒 Marcar que estamos en proceso de logout
      window.isLoggingOut = true;
      localStorage.setItem('logout_in_progress', Date.now().toString());
      
      const logoutUrl = getUrl('logout');
      
      console.log('🔓 AuthToken.logout() - URL:', logoutUrl);
      console.log('🔓 Enviando cookies (refresh_token) y Authorization header al backend...');
      
      // Obtener access_token para el header Authorization
      const token = getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Access token incluido en Authorization header');
      }
      
      // Llamar al endpoint de logout para invalidar refresh_token y limpiar cookie httpOnly
      const response = await nativeFetch(logoutUrl, {
        method: 'POST',
        credentials: 'include', // 🔥 CRÍTICO: envía las cookies httpOnly (refresh_token) al servidor
        headers: headers,
      });
      
      if (response.ok) {
        console.log('✅ Logout exitoso en servidor');
        const data = await response.json().catch(() => null);
        console.log('📦 Respuesta del servidor:', data);
        console.log('✅ Refresh token revocado en backend');
        console.log('✅ Cookie refresh_token eliminada por el servidor');
      } else {
        console.warn('⚠️ Logout falló en servidor, status:', response.status);
        const text = await response.text().catch(() => '');
        console.warn('📄 Respuesta:', text);
      }
    } catch (error) {
      console.error('❌ Error en logout:', error);
    } finally {
      // 🧹 Limpieza del access_token y storage
      console.log('🧹 Limpiando access_token y storage local...');
      
      // 📢 PRIMERO: Despachar evento de logout antes de limpiar cualquier cosa
      console.log('📢 Despachando evento userLogout...');
      window.dispatchEvent(new CustomEvent('userLogout', {
        detail: { timestamp: Date.now() }
      }));
      
      // 🗑️ SEGUNDO: Invalidar caché de usuario ANTES de limpiar localStorage
      if (window.CacheManager) {
        console.log('🗑️ Invalidando caché de usuario...');
        window.CacheManager.invalidate('user:profile');
      }
      
      // Limpiar access_token
      clearToken();
      
      // 💾 Preservar temas de TODOS los usuarios antes de limpiar
      const themesToPreserve = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('user_theme_')) {
            themesToPreserve[key] = localStorage.getItem(key);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error preservando temas:', e);
      }
      
      // Limpiar localStorage y sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // ignore
      }
      
      // 🎨 Restaurar temas de todos los usuarios
      try {
        Object.entries(themesToPreserve).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        console.log('✅ Temas de usuarios preservados:', Object.keys(themesToPreserve).length);
      } catch (e) {
        console.warn('⚠️ Error restaurando temas:', e);
      }
      
      // Limpiar flag de logout
      window.isLoggingOut = false;
      
      console.log('✅ Limpieza local completa finalizada');
      console.log('ℹ️ Access token: limpiado de memoria y localStorage');
      console.log('ℹ️ Refresh token: revocado en backend y cookie eliminada');
      console.log('ℹ️ LocalStorage y SessionStorage: limpiados (tema preservado)');
      
      // 🔄 Redirigir al login
      console.log('🔄 Redirigiendo a login...');
      const config = getConfig();
      window.location.href = config.routes.login;
      
      // Fallback: forzar reload si la redirección no funciona
      setTimeout(() => {
        if (window.location.pathname !== config.routes.login) {
          window.location.reload();
        }
      }, 100);
    }
  }
  
  // ==================== VERIFICAR AUTENTICACIÓN ====================
  
  async function isAuthenticated() {
    // MODO DESARROLLO: Siempre autenticado
    if (window.ENV && window.ENV.isDevelopment) {
      return true;
    }
    
    // Verificar si hay access_token primero
    const token = getToken();
    if (!token) {
      return false;
    }
    
    // PÁGINAS PÚBLICAS: Si hay token, verificarlo igual
    // Solo omitir verificación si NO hay token en páginas públicas
    const currentPath = window.location?.pathname;
    const publicPages = ['/', '/index.html', '/contacto', '/acercade', '/contrato', '/forgot-password', '/cambiar-password', '/verificar-email'];
    const isPublicPage = currentPath && publicPages.some(page => currentPath === page || currentPath.endsWith(page));
    
    // En páginas públicas sin /login o /registro, si no hay token, retornar false rápido
    if (isPublicPage && !token) {
      return false;
    }
    
    // Si hay datos en caché, asumir autenticado (evita llamada innecesaria)
    const CACHE_KEY = 'user:profile';
    if (window.CacheManager) {
      const cachedData = window.CacheManager.get(CACHE_KEY);
      if (cachedData) {
        console.log('✅ token.js isAuthenticated(): Token válido (confirmado por caché)');
        return true;
      }
    }
    
    // STAGING/PRODUCTION: Verificar con request al backend solo si no hay caché
    try {
      console.log('🔍 token.js isAuthenticated(): Verificando con backend...');
      const response = await nativeFetch(getUrl('getUserProfile'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      // Si la respuesta es ok, cachear los datos
      if (response.ok && window.CacheManager) {
        try {
          const userData = await response.json();
          const profile = userData.data || userData;
          if (profile) {
            console.log('💾 token.js isAuthenticated(): Cacheando perfil por 24 horas');
            window.CacheManager.set(CACHE_KEY, profile, 24 * 60 * 60 * 1000);
          }
        } catch (e) {
          console.warn('Error parseando respuesta:', e);
        }
      }
      
      return response.ok;
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  }
  
  async function requireAuth() {
    // MODO DESARROLLO: No requiere autenticación
    if (window.ENV && window.ENV.isDevelopment) {
      return;
    }
    
    // PÁGINAS PÚBLICAS: No verificar autenticación
    const currentPath = window.location?.pathname;
    const publicPages = ['/', '/index.html', '/contacto', '/acercade', '/contrato', '/login', '/registro', '/forgot-password', '/cambiar-password', '/verificar-email'];
    const isPublicPage = currentPath && publicPages.some(page => currentPath === page || currentPath.endsWith(page));
    
    if (isPublicPage) {
      return; // En páginas públicas, no requerir autenticación
    }
    
    // STAGING/PRODUCTION: Verificar con request
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      const config = getConfig();
      // Si estamos en proceso de logout, no agregamos parámetros de error
      if (isLogoutInProgress()) {
        window.location.href = config.routes.login;
      } else {
        window.location.href = config.routes.login + '?status=error&msg=' +
          encodeURIComponent('Debes iniciar sesión para acceder a esta página.');
      }
    }
  }
  
  // ==================== OBTENER DATOS DEL USUARIO ====================
  
  async function getUser() {
    // MODO DESARROLLO: Usuario dummy
    if (window.ENV && window.ENV.isDevelopment) {
      return {
        id: 1,
        email: 'dev@example.com',
        rol: 'admin',
        nombre: 'Usuario Desarrollo'
      };
    }
    
    // Intentar usar caché primero
    const CACHE_KEY = 'user:profile';
    if (window.CacheManager) {
      const cachedData = window.CacheManager.get(CACHE_KEY);
      if (cachedData) {
        console.log('✅ token.js getUser(): Usando datos cacheados');
        return cachedData;
      }
    }
    
    // STAGING/PRODUCTION: Obtener del backend con Authorization header
    try {
      console.log('🌐 token.js getUser(): Cargando datos del backend...');
      const token = getToken();
      const headers = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await nativeFetch(getUrl('getUserProfile'), {
        method: 'GET',
        headers: headers,
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        
        // Guardar en caché por 24 horas
        if (window.CacheManager && userData) {
          console.log('💾 token.js getUser(): Guardando en caché por 24 horas');
          window.CacheManager.set(CACHE_KEY, userData, 24 * 60 * 60 * 1000);
        }
        
        // Disparar evento de usuario cargado para que otros módulos (como ThemeManager) puedan reaccionar
        if (userData && userData.id) {
          const event = new CustomEvent('userLoaded', { detail: { userId: userData.id } });
          window.dispatchEvent(event);
          console.log('📢 Evento userLoaded disparado con userId:', userData.id);
        }
        
        return userData;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
    }
    return null;
  }
  
  // ==================== GLOBAL FETCH INTERCEPTOR ====================
  
  function headersToObject(headers = {}) {
    if (headers instanceof Headers) {
      const converted = {};
      headers.forEach((value, key) => {
        converted[key] = value;
      });
      return converted;
    }
    
    if (Array.isArray(headers)) {
      return headers.reduce((acc, [key, value]) => {
        if (key) acc[key] = value;
        return acc;
      }, {});
    }
    
    return { ...headers };
  }
  
  function shouldInterceptFetch(url, options = {}) {
    if (!url || options._skipAuth === true || options._forceNativeFetch === true) {
      return false;
    }
    
    if (options._useAuthToken === true) {
      return true;
    }
    
    if (typeof url !== 'string') {
      return false;
    }
    
    const lowerUrl = url.toLowerCase();
    // Construir dinámicamente las rutas que deben bypassear el interceptor.
    const getUrlFn = window.AppConfig?.getUrl || ((e) => e);
    
    const dynamicEndpoints = [
      'login',
      'register',
      'refresh',
      'logout',
      'forgotPassword',
      'resetPassword',
      'resendVerification',
      'verifyEmail'
    ];
    
    const bypassSegments = (function() {
      try {
        if (window.AppConfig && window.AppConfig.endpoints) {
          // Resolver cada clave a su URL (si existe) y añadir su path y lowercased forms
          const segments = new Set();
          dynamicEndpoints.forEach(key => {
            const resolved = getUrlFn(key) || window.AppConfig.endpoints[key];
            if (!resolved) return;
            const urlStr = String(resolved).toLowerCase();
            // Añadir la ruta tal como viene (p.ej. '/api/..' o '/auth/..')
            segments.add(urlStr);
            // También agregar solo la porción de ruta si la URL es absoluta
            try {
              const u = new URL(resolved, window.location.origin);
              segments.add(u.pathname.toLowerCase());
            } catch (e) {
              // ignore
            }
          });
          // Añadir legacy fallback patterns for compatibility
          ['/v1/auth/login','/auth/login','/v1/registro','/auth/register','/v1/auth/refresh','/auth/refresh','/v1/api/auth/logout','/auth/logout','/v1/auth/solicitar-cambio-password','/auth/forgot-password','/v1/auth/cambiar-password','/auth/reset-password','/v1/auth/reenvio-email-verificacion','/auth/reenvio-email-verificacion','/v1/auth/verificar-email','/auth/verify-email'].forEach(p => segments.add(p));
          return Array.from(segments);
        }
      } catch (e) {
        // ignore and fallback to static list
      }
      
      // Fallback hardcoded list (legacy)
      return [
        '/v1/auth/login',
        '/auth/login',
        '/v1/registro',
        '/auth/register',
        '/v1/auth/refresh',
        '/auth/refresh',
        '/v1/api/auth/logout',
        '/auth/logout',
        '/v1/auth/solicitar-cambio-password',
        '/auth/forgot-password',
        '/v1/auth/cambiar-password',
        '/auth/reset-password',
        '/v1/auth/reenvio-email-verificacion',
        '/auth/reenvio-email-verificacion',
        '/v1/auth/verificar-email',
        '/auth/verify-email'
      ];
    })();
    
    if (bypassSegments.some(segment => lowerUrl.includes(segment))) {
      return false;
    }
    
    // Interceptar todas las requests a /api/ (endpoints protegidos)
    return lowerUrl.includes('/api/');
  }
  
  function setupGlobalFetchInterceptor() {
    if (!nativeFetch || globalScope.__authFetchPatched) {
      return;
    }
    
    globalScope.__authFetchPatched = true;
    globalScope.__nativeFetch = nativeFetch;
    
    globalScope.fetch = function patchedFetch(input, init = {}) {
      if (typeof input !== 'string') {
        return nativeFetch(input, init);
      }
      
      const options = init || {};
      if (shouldInterceptFetch(input, options)) {
        const normalizedOptions = { ...options };
        normalizedOptions.headers = headersToObject(options.headers);
        return authenticatedFetch(input, normalizedOptions);
      }
      
      return nativeFetch(input, options);
    };
  }
  
  // Activar interceptor global inmediatamente (idempotente)
  setupGlobalFetchInterceptor();
  
  // ==================== EXPORTAR API ====================
  
  /**
   * Obtiene el ID del usuario actual desde el caché o retorna null
   * Esta función es síncrona y útil para componentes que necesitan el ID inmediatamente
   * @returns {number|null} ID del usuario o null si no está disponible
   */
  function getUsuarioId() {
    const CACHE_KEY = 'user:profile';
    if (window.CacheManager) {
      const cachedData = window.CacheManager.get(CACHE_KEY);
      if (cachedData && cachedData.id) {
        return cachedData.id;
      }
    }
    // Fallback: intentar desde sessionStorage si está disponible
    try {
      const sessionUser = sessionStorage.getItem('current_user');
      if (sessionUser) {
        const user = JSON.parse(sessionUser);
        return user.id || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  window.AuthToken = {
    // Funciones principales
    authenticatedFetch,
    logout,
    isAuthenticated,
    requireAuth,
    getUser,
    getUsuarioId,
    refreshAccessToken,
    // Manejo de tokens
    saveToken,
    getToken,
    clearToken,
    getAuthHeader,
    // Helper para que otros módulos verifiquen si hay un logout en progreso
    isLogoutInProgress,
    attachFetchInterceptor: setupGlobalFetchInterceptor,
  };
})();
