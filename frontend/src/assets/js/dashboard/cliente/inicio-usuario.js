// Carga del nombre de usuario para el dashboard
(function loadUserName() {
  const CACHE_KEY = 'user:profile'; // Mismo key que usuario.js
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas
  let isLoadingData = false; // Lock para prevenir múltiples llamadas
  
  async function run() {
    const elements = document.querySelectorAll('[data-user-name]');
    if (elements.length === 0) return;
    
    // 1. Intentar usar CacheManager (compartido con usuario.js)
    if (window.CacheManager) {
      const cachedData = window.CacheManager.get(CACHE_KEY);
      if (cachedData) {
        console.log('✅ inicio-usuario: Usando datos cacheados');
        const namePart = (cachedData.nombre || '').toString();
        const lastPart = (cachedData.apellido || '').toString();
        const emailPart = (cachedData.email || '').toString();
        const displayName = [namePart, lastPart].filter(Boolean).join(' ') || emailPart || 'Usuario';
        const safeName = window.Sanitizer ? window.Sanitizer.sanitizeString(displayName) : displayName;
        elements.forEach(el => el.textContent = safeName);
        return;
      }
      
      // Si ya hay una carga en progreso, no hacer otra llamada
      if (isLoadingData) {
        console.log('⏳ inicio-usuario: Carga ya en progreso, esperando...');
        // Esperar un poco y reintentar desde caché
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryData = window.CacheManager.get(CACHE_KEY);
        if (retryData) {
          const namePart = (retryData.nombre || '').toString();
          const lastPart = (retryData.apellido || '').toString();
          const emailPart = (retryData.email || '').toString();
          const displayName = [namePart, lastPart].filter(Boolean).join(' ') || emailPart || 'Usuario';
          const safeName = window.Sanitizer ? window.Sanitizer.sanitizeString(displayName) : displayName;
          elements.forEach(el => el.textContent = safeName);
        } else {
          elements.forEach(el => el.textContent = 'Usuario');
        }
        return;
      }
    }
    
    // 2. Fallback: cargar desde backend solo si no está en progreso
    isLoadingData = true;
    try {
      console.log('🌐 inicio-usuario: Cargando datos del backend...');
      const API_BASE_URL = window.AppConfig?.API_BASE_URL;
      const getUrl = window.AppConfig?.getUrl || ((endpoint) => {
        if (endpoint.startsWith('http')) return endpoint;
        if (endpoint.startsWith('/')) return API_BASE_URL + endpoint;
        return endpoint;
      });

      const endpoint = getUrl('getUserProfile');
      
      // Modo híbrido: access_token en Authorization header + refresh_token en cookie httpOnly
      const token = window.AuthToken?.getToken?.() || null;

      const headers = {
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch(endpoint, { method: 'GET', headers, credentials: 'include' });
      
      if (!resp.ok) throw new Error('Error en la respuesta');
      
      const json = await resp.json();
      const profile = json.success ? json.data : json;
      
      if (profile) {
        const displayName = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 
                           profile.email || profile.username || 'Usuario';
        const safeName = window.Sanitizer ? window.Sanitizer.sanitizeString(displayName) : displayName;
        
        // Guardar en CacheManager con TTL de 24 horas para compartir con usuario.js
        if (window.CacheManager) {
          console.log('💾 inicio-usuario: Guardando en caché por 24 horas');
          window.CacheManager.set(CACHE_KEY, profile, CACHE_TTL);
        }
        
        elements.forEach(el => el.textContent = safeName);
      } else {
        elements.forEach(el => el.textContent = 'Usuario');
      }
      
    } catch (e) {
      console.warn('inicio-usuario: error cargando perfil:', e);
      elements.forEach(el => el.textContent = 'Usuario');
    } finally {
      isLoadingData = false;
    }
  }

  // Ejecutar inmediatamente solo si hay elementos
  if (document.querySelectorAll('[data-user-name]').length > 0) {
    run();
  }

  // También observar cambios en el DOM para detectar cuando se carga home.html dinámicamente
  let lastElementCount = document.querySelectorAll('[data-user-name]').length;
  
  const observer = new MutationObserver(() => {
    const elements = document.querySelectorAll('[data-user-name]');
    const currentCount = elements.length;
    
    // Solo ejecutar si aparecieron nuevos elementos (evitar loop por cambios de texto)
    if (currentCount > 0 && currentCount !== lastElementCount) {
      lastElementCount = currentCount;
      run();
    }
  });

  // Observar cambios en el contenedor principal del dashboard
  const mainContent = document.getElementById('dashboard-content');
  if (mainContent) {
    observer.observe(mainContent, { childList: true, subtree: true });
  }
})();
