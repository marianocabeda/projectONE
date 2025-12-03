// ========== VARIABLES GLOBALES ==========
let mainContent = null;
let dashboardAside = null;
let navLinks = [];
let currentModuleName = null; // Tracking del módulo activo

/**
 * Limpia el módulo actual antes de cargar uno nuevo
 */
function cleanupCurrentModule() {
    if (!currentModuleName) return;
    
    const moduleName = currentModuleName;
    console.log(`🧹 Limpiando módulo anterior: ${moduleName}`);
    
    if (window[moduleName] && typeof window[moduleName].cleanup === 'function') {
        try {
            window[moduleName].cleanup();
            console.log(`✅ ${moduleName} limpiado correctamente`);
        } catch (err) {
            console.warn(`⚠️ Error limpiando ${moduleName}:`, err);
        }
    }
    
    currentModuleName = null;
}

document.addEventListener('DOMContentLoaded', () => {
    mainContent = document.getElementById('dashboard-content');
    // Si no estamos en la página del dashboard, no hacemos nada.
    if (!mainContent) return;

    dashboardAside = document.getElementById('dashboard-aside');
    const yearSpan = document.getElementById('year');

    // Año dinámico en el footer
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    console.log('🎯 Dashboard.js: DOMContentLoaded - Inicializando...');

    // --- INICIALIZACIÓN DEL MENÚ SEGÚN ROL ---
    
    function initMenuByRole() {
        const menuCliente = document.getElementById('menu-cliente');
        const menuVerificador = document.getElementById('menu-verificador');
        const menuAtencion = document.getElementById('menu-atencion');
        const menuAdmin = document.getElementById('menu-admin');
        
        // Determinar qué menú mostrar según el rol
        if (window.RoleManager && window.RoleManager.isAdmin()) {
            console.log('[Dashboard] Mostrando menú de administrador');
            if (menuAdmin) menuAdmin.classList.remove('hidden');
            if (menuAtencion) menuAtencion.classList.add('hidden');
            if (menuVerificador) menuVerificador.classList.add('hidden');
            if (menuCliente) menuCliente.classList.add('hidden');
            navLinks = dashboardAside.querySelectorAll('#menu-admin a');
            
            // Inicializar dropdown de Configuración (Admin)
            const ajustesAdminToggle = document.getElementById('ajustes-admin-toggle');
            const ajustesAdminSubmenu = document.getElementById('ajustes-admin-submenu');
            const ajustesAdminArrow = document.getElementById('ajustes-admin-arrow');

            if (ajustesAdminToggle && ajustesAdminSubmenu && ajustesAdminArrow) {
                console.log('✅ Menú desplegable de Configuración (Admin) inicializado');
                ajustesAdminToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔧 Toggle Configuración (Admin) clickeado');
                    ajustesAdminSubmenu.classList.toggle('hidden');
                    ajustesAdminArrow.classList.toggle('rotate-180');
                });
            }
        } else if (window.RoleManager && window.RoleManager.isAtencionPublico()) {
            console.log('[Dashboard] Mostrando menú de atención al público');
            if (menuAtencion) menuAtencion.classList.remove('hidden');
            if (menuAdmin) menuAdmin.classList.add('hidden');
            if (menuVerificador) menuVerificador.classList.add('hidden');
            if (menuCliente) menuCliente.classList.add('hidden');
            navLinks = dashboardAside.querySelectorAll('#menu-atencion a');
            
            // Inicializar dropdown de Configuración (Atención)
            const ajustesAtencionToggle = document.getElementById('ajustes-atencion-toggle');
            const ajustesAtencionSubmenu = document.getElementById('ajustes-atencion-submenu');
            const ajustesAtencionArrow = document.getElementById('ajustes-atencion-arrow');

            if (ajustesAtencionToggle && ajustesAtencionSubmenu && ajustesAtencionArrow) {
                console.log('✅ Menú desplegable de Configuración (Atención) inicializado');
                ajustesAtencionToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔧 Toggle Configuración (Atención) clickeado');
                    ajustesAtencionSubmenu.classList.toggle('hidden');
                    ajustesAtencionArrow.classList.toggle('rotate-180');
                });
            }
        } else if (window.RoleManager && window.RoleManager.isVerificador()) {
            console.log('[Dashboard] Mostrando menú de verificador');
            if (menuVerificador) menuVerificador.classList.remove('hidden');
            if (menuAtencion) menuAtencion.classList.add('hidden');
            if (menuAdmin) menuAdmin.classList.add('hidden');
            if (menuCliente) menuCliente.classList.add('hidden');
            navLinks = dashboardAside.querySelectorAll('#menu-verificador a');
            
            // Inicializar dropdown de Configuración (Verificador)
            const ajustesVerificadorToggle = document.getElementById('ajustes-verificador-toggle');
            const ajustesVerificadorSubmenu = document.getElementById('ajustes-verificador-submenu');
            const ajustesVerificadorArrow = document.getElementById('ajustes-verificador-arrow');

            if (ajustesVerificadorToggle && ajustesVerificadorSubmenu && ajustesVerificadorArrow) {
                console.log('✅ Menú desplegable de Configuración (Verificador) inicializado');
                ajustesVerificadorToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔧 Toggle Configuración (Verificador) clickeado');
                    ajustesVerificadorSubmenu.classList.toggle('hidden');
                    ajustesVerificadorArrow.classList.toggle('rotate-180');
                });
            } else {
                console.warn('⚠️ No se encontraron elementos del menú de Configuración (Verificador)');
                console.log('Debug - Toggle:', !!ajustesVerificadorToggle, 'Submenu:', !!ajustesVerificadorSubmenu, 'Arrow:', !!ajustesVerificadorArrow);
            }
        } else {
            console.log('[Dashboard] Mostrando menú de cliente');
            if (menuCliente) menuCliente.classList.remove('hidden');
            if (menuAtencion) menuAtencion.classList.add('hidden');
            if (menuVerificador) menuVerificador.classList.add('hidden');
            if (menuAdmin) menuAdmin.classList.add('hidden');
            navLinks = dashboardAside.querySelectorAll('#menu-cliente a');
            
            // Inicializar dropdown de Configuración (Cliente)
            const ajustesToggle = document.getElementById('ajustes-toggle');
            const ajustesSubmenu = document.getElementById('ajustes-submenu');
            const ajustesArrow = document.getElementById('ajustes-arrow');

            if (ajustesToggle && ajustesSubmenu && ajustesArrow) {
                console.log('✅ Menú desplegable de Configuración (Cliente) inicializado');
                ajustesToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔧 Toggle Configuración clickeado');
                    ajustesSubmenu.classList.toggle('hidden');
                    ajustesArrow.classList.toggle('rotate-180');
                });
            } else {
                console.warn('⚠️ No se encontraron elementos del menú de Configuración (Cliente)');
                console.log('Debug - Toggle:', !!ajustesToggle, 'Submenu:', !!ajustesSubmenu, 'Arrow:', !!ajustesArrow);
            }
        }
    }
    
    // Inicializar menú según rol
    initMenuByRole();
    
    // --- LÓGICA DEL MENÚ DESPLEGABLE (MÓVIL) ---
    // Esta función se encarga de poblar el menú móvil con los enlaces del menú de escritorio
    // y de adjuntar los listeners necesarios para su funcionamiento.
    const populateMobileMenu = () => {
        const mobileMenuContainer = document.getElementById('dashboard-mobile-menu');
        const asideNav = dashboardAside ? dashboardAside.querySelector('nav') : null;
        
        if (!mobileMenuContainer) {
            console.warn('⚠️ No se encontró dashboard-mobile-menu');
            return;
        }
        
        if (!asideNav) {
            console.warn('⚠️ No se encontró nav del dashboard-aside');
            return;
        }
        
        // Clonamos la navegación para no afectar la de escritorio
        const mobileNav = asideNav.cloneNode(true);
        // Le damos estilos de menú móvil
        const ulElement = mobileNav.querySelector('ul');
        if (ulElement) {
            ulElement.classList.remove('space-y-2');
            ulElement.classList.add('px-4', 'py-4', 'space-y-1');
        }

        // Manejar el menú desplegable de Ajustes dentro del menú móvil (Cliente)
        const mobileAjustesLi = mobileNav.querySelector('li[data-group="ajustes"]');
        if (mobileAjustesLi) {
            const mobileAjustesToggle = mobileAjustesLi.querySelector('button');
            const mobileAjustesSubmenu = mobileAjustesLi.querySelector('ul');
            const mobileAjustesArrow = mobileAjustesLi.querySelector('svg');

            // Eliminar IDs de los elementos clonados para evitar duplicados en el DOM
            if (mobileAjustesToggle) mobileAjustesToggle.removeAttribute('id');
            if (mobileAjustesSubmenu) mobileAjustesSubmenu.removeAttribute('id');
            if (mobileAjustesArrow) mobileAjustesArrow.removeAttribute('id');

            if (mobileAjustesToggle && mobileAjustesSubmenu && mobileAjustesArrow) {
                mobileAjustesSubmenu.classList.add('hidden'); // Asegurar que el submenú esté oculto inicialmente
                mobileAjustesArrow.classList.remove('rotate-180'); // Asegurar que la flecha esté hacia abajo
                mobileAjustesToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('📱 Toggle Configuración móvil (Cliente) clickeado');
                    mobileAjustesSubmenu.classList.toggle('hidden');
                    mobileAjustesArrow.classList.toggle('rotate-180');
                });
            }
        }

        // Manejar el menú desplegable de Ajustes dentro del menú móvil (Verificador)
        const mobileAjustesVerificadorLi = mobileNav.querySelector('li[data-group="ajustes-verificador"]');
        if (mobileAjustesVerificadorLi) {
            const mobileAjustesVerificadorToggle = mobileAjustesVerificadorLi.querySelector('button');
            const mobileAjustesVerificadorSubmenu = mobileAjustesVerificadorLi.querySelector('ul');
            const mobileAjustesVerificadorArrow = mobileAjustesVerificadorLi.querySelector('svg');

            // Eliminar IDs de los elementos clonados para evitar duplicados en el DOM
            if (mobileAjustesVerificadorToggle) mobileAjustesVerificadorToggle.removeAttribute('id');
            if (mobileAjustesVerificadorSubmenu) mobileAjustesVerificadorSubmenu.removeAttribute('id');
            if (mobileAjustesVerificadorArrow) mobileAjustesVerificadorArrow.removeAttribute('id');

            if (mobileAjustesVerificadorToggle && mobileAjustesVerificadorSubmenu && mobileAjustesVerificadorArrow) {
                mobileAjustesVerificadorSubmenu.classList.add('hidden');
                mobileAjustesVerificadorArrow.classList.remove('rotate-180');
                mobileAjustesVerificadorToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('📱 Toggle Configuración móvil (Verificador) clickeado');
                    mobileAjustesVerificadorSubmenu.classList.toggle('hidden');
                    mobileAjustesVerificadorArrow.classList.toggle('rotate-180');
                });
            }
        }

        // Manejar el menú desplegable de Ajustes dentro del menú móvil (Admin)
        const mobileAjustesAdminLi = mobileNav.querySelector('li[data-group="ajustes-admin"]');
        if (mobileAjustesAdminLi) {
            const mobileAjustesAdminToggle = mobileAjustesAdminLi.querySelector('button');
            const mobileAjustesAdminSubmenu = mobileAjustesAdminLi.querySelector('ul');
            const mobileAjustesAdminArrow = mobileAjustesAdminLi.querySelector('svg');

            // Eliminar IDs de los elementos clonados para evitar duplicados en el DOM
            if (mobileAjustesAdminToggle) mobileAjustesAdminToggle.removeAttribute('id');
            if (mobileAjustesAdminSubmenu) mobileAjustesAdminSubmenu.removeAttribute('id');
            if (mobileAjustesAdminArrow) mobileAjustesAdminArrow.removeAttribute('id');

            if (mobileAjustesAdminToggle && mobileAjustesAdminSubmenu && mobileAjustesAdminArrow) {
                mobileAjustesAdminSubmenu.classList.add('hidden');
                mobileAjustesAdminArrow.classList.remove('rotate-180');
                mobileAjustesAdminToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('📱 Toggle Configuración móvil (Admin) clickeado');
                    mobileAjustesAdminSubmenu.classList.toggle('hidden');
                    mobileAjustesAdminArrow.classList.toggle('rotate-180');
                });
            }
        }
        
        mobileMenuContainer.innerHTML = ''; // Limpiamos por si acaso
        mobileMenuContainer.appendChild(mobileNav);
        
        // Adjuntar el listener al menú móvil DESPUÉS de poblarlo
        mobileMenuContainer.addEventListener('click', (e) => handleNavClick(e, mobileMenuContainer));
        console.log('✅ Menú móvil poblado y listener agregado');
    };

    const toggleMobileMenu = () => {
        const mobileMenuContainer = document.getElementById('dashboard-mobile-menu');
        if (mobileMenuContainer) {
            const isHidden = mobileMenuContainer.classList.contains('hidden');
            mobileMenuContainer.classList.toggle('hidden');
            console.log(`📱 Menú móvil ${isHidden ? 'abierto' : 'cerrado'}`);
        }
    };
    
    // Cerrar menú móvil al hacer click fuera de él
    document.addEventListener('click', (e) => {
        const mobileMenuContainer = document.getElementById('dashboard-mobile-menu');
        const hamburgerBtn = document.getElementById('aside-menu-button');
        
        if (mobileMenuContainer && !mobileMenuContainer.classList.contains('hidden')) {
            // Si el click no fue en el menú ni en el botón hamburguesa, cerrar
            if (!mobileMenuContainer.contains(e.target) && !hamburgerBtn?.contains(e.target)) {
                mobileMenuContainer.classList.add('hidden');
                console.log('📱 Menú móvil cerrado (click fuera)');
            }
        }
    });

    // El botón está en el header, que se carga dinámicamente.
    // Usamos delegación de eventos en el body para asegurar que el listener funcione.
    document.body.addEventListener('click', (e) => {
        // Botón de hamburguesa
        const hamburgerBtn = e.target.closest('#aside-menu-button');
        if (hamburgerBtn) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🍔 Botón hamburguesa clickeado');
            toggleMobileMenu();
        }
    });
    
    // También manejar con evento touch para móviles
    document.body.addEventListener('touchstart', (e) => {
        const hamburgerBtn = e.target.closest('#aside-menu-button');
        if (hamburgerBtn) {
            e.preventDefault();
            console.log('🍔 Botón hamburguesa tocado (touch)');
            toggleMobileMenu();
        }
    }, { passive: false });
    
    // Esperar a que el header esté listo antes de poblar el menú móvil
    window.addEventListener('dashboard:ready', () => {
        console.log('✅ Header listo, poblando menú móvil...');
        populateMobileMenu();
    });
    
    // También intentar poblar si el header ya está cargado
    if (document.getElementById('dashboard-mobile-menu')) {
        console.log('✅ Header ya cargado, poblando menú móvil...');
        populateMobileMenu();
    }

    // ========== DEFINIR window.loadContent PRIMERO ==========
    console.log('📦 Definiendo window.loadContent...');
    
    // Función para cargar contenido dinámicamente
    window.loadContent = async (url) => { // Exponemos loadContent globalmente
        if (!mainContent) {
            console.error('❌ mainContent no está disponible');
            return;
        }
        try {
            // Limpiar módulos anteriores antes de cargar nuevo contenido
            cleanupCurrentModule();
            
            mainContent.innerHTML = '<p class="text-center">Cargando...</p>'; // Indicador de carga
            
            // Agregar timestamp para evitar caché
            const separator = url.includes('?') ? '&' : '?';
            const urlWithCacheBuster = `${url}${separator}v=${new Date().getTime()}`;
            
            const response = await fetch(urlWithCacheBuster, {
                cache: 'no-store', // Forzar a no usar caché
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            console.log('📡 loadContent fetched:', urlWithCacheBuster, 'status:', response.status, 'finalURL:', response.url, 'redirected:', response.redirected);

            // If the server redirected to the dashboard (or returned a top-level
            // dashboard HTML), prefer a safe navigation strategy — but avoid
            // navigating to the same URL repeatedly which can cause reload loops.
            if (response.redirected || response.url.includes('/dashboard')) {
                try {
                    const finalUrl = new URL(response.url, window.location.origin).href;
                    const currentUrl = window.location.href;

                    if (finalUrl === currentUrl) {
                        // The server redirected back to the same place — don't reload.
                        console.warn('🔁 loadContent detected redirect to same URL (skipping redirect to avoid loop):', finalUrl);
                        mainContent.innerHTML = `<p class="text-center text-red-500">La petición devolvió un redireccionamiento inesperado. Intente recargar la página manualmente.</p>`;
                        return; // stop embedding
                    }

                    // If finalUrl is a dashboard shell with a query (older behavior),
                    // navigate to the shell WITHOUT keeping the query to avoid re-creating
                    // the old ?panel loop.
                    const isDashboardShell = finalUrl.includes('/dashboard');
                    if (isDashboardShell) {
                        const target = '/dashboard';
                        console.warn('🔁 loadContent detected server redirect to dashboard shell — navigating to:', target);
                        window.location.href = target;
                        return;
                    }

                    // Otherwise navigate to the final URL
                    console.warn('🔁 loadContent detected server redirect — navigating to:', finalUrl);
                    window.location.href = finalUrl;
                    return; // stop embedding
                } catch (err) {
                    console.error('Error handling redirect from loadContent:', err);
                    mainContent.innerHTML = `<p class="text-center text-red-500">La petición devolvió un redireccionamiento inesperado. Intente recargar la página manualmente.</p>`;
                    return;
                }
            }
            if (!response.ok) {
                if (response.status === 404) {
                    // Panel no encontrado, redirigir a 404
                    window.location.href = '/404';
                    return;
                }
                if (response.status === 429) {
                    // Rate limited — show friendly page
                    window.location.href = '/429';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            // Busca el contenedor principal del contenido en el HTML cargado.
            // Intenta con #page-content, luego con <main>, y si no, con <body>.
            const loadedContentElement = doc.querySelector('#page-content') || doc.querySelector('main') || doc.body;
            
            // Extract scripts from the parsed document BEFORE inserting the HTML.
            // IMPORTANTE: Solo extraer scripts que están DENTRO del contenedor de contenido
            // No extraer scripts globales del dashboard que ya están cargados
            const scriptsToExecute = Array.from(loadedContentElement.querySelectorAll('script'));
            scriptsToExecute.forEach(script => script.remove()); // Remove them from the parsed doc so innerHTML doesn't include them

            console.log('📜 Scripts encontrados en el contenido:', scriptsToExecute.length);

            // Insertar el contenido HTML (sin los scripts)
            mainContent.innerHTML = loadedContentElement.innerHTML;

            // Esperar a que el navegador renderice el DOM
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });

            // Delay más largo para asegurar que el DOM esté 100% listo
            await new Promise(resolve => setTimeout(resolve, 150));

            console.log('✅ DOM renderizado, ejecutando scripts...');

            // Ahora, ejecutar o inicializar módulos si aplica.
            // Mapa explícito de páginas -> módulo que exporta init(container)
            const pageModuleMap = {
                '/contrato': '/js/forms/contract/gestor_formulario_contrato.js'
            };

            // Ejecutar scripts inline/externos que no correspondan a módulos mapeados
            const notMappedScripts = scriptsToExecute.filter(s => {
                const src = s.getAttribute('src') || '';
                return !Object.values(pageModuleMap).some(m => src.includes(m));
            });

            notMappedScripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                if (oldScript.src) {
                    newScript.src = `${oldScript.src}?v=${new Date().getTime()}`;
                } else {
                    newScript.textContent = oldScript.textContent;
                }
                mainContent.appendChild(newScript);
            });

            // Esperar un tick del event loop para asegurar que el DOM esté renderizado
            // antes de ejecutar módulos
            await new Promise(resolve => setTimeout(resolve, 0));

            // Inicializar módulos específicos según la vista cargada
            // Mapa de rutas a módulos globales que necesitan init()
            const moduleInitMap = {
                '/admin-panel': 'AdminPanel',
                '/solicitudes-cola': 'RequestsManager',
                '/historial-solicitudes': 'HistorialManager',
                '/conexiones': 'ConnectionsManager',
                '/facturas': 'InvoicesManager',
                '/home': 'HomeManager',
                '/ver-contrato': 'VerContratoModule'
            };

            // Extraer la ruta base sin query params para matchear con el mapa
            const urlPath = url.split('?')[0];
            const moduleName = moduleInitMap[urlPath];
            
            if (moduleName && window[moduleName] && typeof window[moduleName].init === 'function') {
                console.log(`📦 Inicializando módulo: ${moduleName} para URL: ${url}`);
                try {
                    // Dar un pequeño delay para asegurar que el DOM esté completamente renderizado
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Extraer query params para pasarlos al módulo
                    const queryString = url.includes('?') ? url.split('?')[1] : '';
                    const urlParams = new URLSearchParams(queryString);
                    const params = Object.fromEntries(urlParams.entries());
                    
                    // Llamar init con los parámetros de la URL
                    await window[moduleName].init(params);
                    currentModuleName = moduleName; // Guardar referencia
                    console.log(`✅ ${moduleName} inicializado correctamente`);
                } catch (err) {
                    console.error(`❌ Error inicializando ${moduleName}:`, err);
                }
            } else {
                if (moduleInitMap[urlPath]) {
                    console.warn(`⚠️ Módulo ${moduleInitMap[urlPath]} no disponible en window o no tiene método init()`);
                } else {
                    console.log(`ℹ️ No hay módulo registrado para la ruta: ${urlPath}`);
                }
            }

            // Si la URL cargada tiene un módulo ES6 asociado, impórtalo y llámalo con el contenedor inyectado
            const modulePath = pageModuleMap[url];
            if (modulePath) {
                try {
                    const mod = await import(modulePath);
                    if (mod && typeof mod.init === 'function') {
                        // Pasamos el contenedor donde se inyectó el contenido para que el módulo haga queryScoped
                        await mod.init(mainContent);
                    }
                } catch (err) {
                    console.error('Error inicializando módulo de página:', err);
                }
            }

        } catch (error) {
            console.error('Error al cargar la página:', error);
            mainContent.innerHTML = `<p class="text-red-500 text-center">No se pudo cargar el contenido. Por favor, intente de nuevo más tarde.</p>`;
        }
    };

    // Función para actualizar el estado activo del menú
    // Esta función ahora es más robusta para manejar clics desde el menú móvil o de escritorio.
    const updateActiveLink = (clickedLink) => {
        const clickedHref = clickedLink.getAttribute('href');
        const clickedDataPage = clickedLink.getAttribute('data-page');

        console.log('🔍 updateActiveLink llamado:', { clickedHref, clickedDataPage });

        // Encontrar el menú actualmente visible
        const activeMenu = dashboardAside.querySelector('ul:not(.hidden)');
        console.log('🔍 Menú activo:', activeMenu?.id);

        // Encontrar el enlace de escritorio correspondiente PRIMERO - solo en el menú visible
        let correspondingDesktopLink = null;
        if (clickedDataPage) {
            // Buscar primero en el menú visible, luego en todo el aside si no se encuentra
            correspondingDesktopLink = activeMenu?.querySelector(`a[data-page="${clickedDataPage}"]`) || 
                                      dashboardAside.querySelector(`a[data-page="${clickedDataPage}"]`);
            console.log('🔍 Buscando link con data-page:', clickedDataPage, '→', correspondingDesktopLink);
        } else {
            correspondingDesktopLink = activeMenu?.querySelector(`a[href="${clickedHref}"]`) ||
                                      dashboardAside.querySelector(`a[href="${clickedHref}"]`);
            console.log('🔍 Buscando link con href:', clickedHref, '→', correspondingDesktopLink);
        }

        // Determinar si el enlace está en un submenú
        let targetParentGroup = null;
        if (correspondingDesktopLink) {
            targetParentGroup = correspondingDesktopLink.closest('li[data-group]');
        }

        // Desactivar TODOS los enlaces de navegación del aside (no solo navLinks)
        // Esto asegura que links de menús ocultos también pierdan el estado activo
        const allLinks = dashboardAside.querySelectorAll('a');
        console.log('🔄 Desactivando', allLinks.length, 'links en el aside');
        allLinks.forEach(link => {
            const hadActive = link.classList.contains('nav-item-active');
            link.classList.remove('nav-item-active');
            // Remover las clases que .nav-item-active aplica
            link.classList.remove('bg-blue-100', 'text-blue-600', 'font-semibold');
            link.classList.remove('bg-principal-100', 'text-principal-600');
            // Agregar las clases por defecto
            link.classList.add('text-gray-500', 'dark:text-dark-text-secondary', 'font-medium');
            if (hadActive) {
                console.log('  ↪ Desactivado:', link.textContent.trim(), link.getAttribute('data-page'));
            }
        });

        // Resetear todos los botones de Ajustes y sus submenús
        const ajustesGroups = [
            { toggle: 'ajustes-toggle', submenu: 'ajustes-submenu', arrow: 'ajustes-arrow', group: 'ajustes' },
            { toggle: 'ajustes-verificador-toggle', submenu: 'ajustes-verificador-submenu', arrow: 'ajustes-verificador-arrow', group: 'ajustes-verificador' },
            { toggle: 'ajustes-admin-toggle', submenu: 'ajustes-admin-submenu', arrow: 'ajustes-admin-arrow', group: 'ajustes-admin' },
            { toggle: 'ajustes-atencion-toggle', submenu: 'ajustes-atencion-submenu', arrow: 'ajustes-atencion-arrow', group: 'ajustes-atencion' }
        ];

        ajustesGroups.forEach(group => {
            const toggle = document.getElementById(group.toggle);
            const submenu = document.getElementById(group.submenu);
            const arrow = document.getElementById(group.arrow);
            
            // Solo resetear si NO es el grupo objetivo
            const isTargetGroup = targetParentGroup && targetParentGroup.getAttribute('data-group') === group.group;
            
            if (toggle) {
                toggle.classList.remove('nav-item-active');
                toggle.classList.add('text-gray-500', 'dark:text-dark-text-secondary', 'font-medium');
            }
            
            // Solo cerrar el submenú si NO vamos a activar un item dentro de él
            if (submenu && !isTargetGroup) {
                submenu.classList.add('hidden');
            }
            
            if (arrow && !isTargetGroup) {
                arrow.classList.remove('rotate-180');
            }
        });

        // Activar el enlace correspondiente
        if (correspondingDesktopLink) {
            console.log('✅ Activando link:', correspondingDesktopLink.textContent.trim(), 'data-page:', correspondingDesktopLink.getAttribute('data-page'));
            correspondingDesktopLink.classList.add('nav-item-active');
            correspondingDesktopLink.classList.remove('text-gray-500', 'dark:text-dark-text-secondary', 'font-medium');
            console.log('  ↪ Clases después de activar:', correspondingDesktopLink.className);

            // Si es un elemento de submenú, activar también su botón padre y asegurar que el submenú esté abierto
            if (targetParentGroup && targetParentGroup.getAttribute('data-group').startsWith('ajustes')) {
                console.log('✅ Link está en submenú de ajustes:', targetParentGroup.getAttribute('data-group'));
                const mainButton = targetParentGroup.querySelector('button');
                const submenu = targetParentGroup.querySelector('ul');
                const arrow = targetParentGroup.querySelector('svg');
                
                if (mainButton) {
                    mainButton.classList.add('nav-item-active');
                    mainButton.classList.remove('text-gray-500', 'dark:text-dark-text-secondary', 'font-medium');
                }
                if (submenu) {
                    submenu.classList.remove('hidden'); // Asegurar que el submenú se abra
                }
                if (arrow) {
                    arrow.classList.add('rotate-180'); // Rotar la flecha
                }
            }
        } else {
            console.warn('⚠️ No se encontró correspondingDesktopLink para:', { clickedHref, clickedDataPage });
        }
    };

    // --- MANEJO DE CLICS EN LA NAVEGACIÓN (ESCRITORIO Y MÓVIL) ---
    // Usamos delegación de eventos para manejar los clics en los enlaces de navegación.
    // Esto funciona tanto para el menú de escritorio como para el menú móvil clonado.
    const handleNavClick = (event, menuContainer) => {
        // Ignorar clics en botones (toggles de submenús)
        if (event.target.closest('button')) {
            return; // Dejar que el toggle maneje su propio evento
        }
        
        const clickedLink = event.target.closest('a');
        if (clickedLink && clickedLink.getAttribute('href')) {
            event.preventDefault(); // Prevenir la navegación por defecto
            event.stopPropagation(); // Evitar que el evento llegue a los toggles
            const url = clickedLink.getAttribute('href');
            
            console.log('🔗 Link clickeado:', url, 'data-page:', clickedLink.getAttribute('data-page'));
            
            // Push to history for back button support
            const hash = url.replace('/', '');
            history.pushState({page: url}, '', `#${hash}`);
            
            loadContent(url);
            updateActiveLink(clickedLink);

            // Si es el menú móvil, lo cerramos después del clic
            if (menuContainer.id === 'dashboard-mobile-menu' && !menuContainer.classList.contains('hidden')) {
                toggleMobileMenu();
            }
        }
    };

    // Adjuntar el listener al menú de escritorio
    const desktopNav = dashboardAside ? dashboardAside.querySelector('nav') : null;
    if (desktopNav) {
        desktopNav.addEventListener('click', (e) => handleNavClick(e, dashboardAside));
        console.log('✅ Listener agregado al menú de escritorio');
    } else {
        console.warn('⚠️ No se encontró el nav del dashboard-aside');
    }
    
    // Nota: El listener del menú móvil se agrega en populateMobileMenu()
    // después de que el contenido se haya poblado correctamente
    
    // Manejar clics en enlaces dinámicos dentro del contenido principal (usando delegación de eventos)
    if (mainContent) {
        mainContent.addEventListener('click', (e) => {
            // Buscar el enlace más cercano con href que empiece con /
            const clickedLink = e.target.closest('a[href^="/"]');
            if (clickedLink) {
                const href = clickedLink.getAttribute('href');
                
                // Ignorar enlaces externos o que no sean páginas del dashboard
                if (href.startsWith('http') || href.includes('mailto:') || href.includes('tel:')) {
                    return;
                }
                
                e.preventDefault();
                const page = clickedLink.getAttribute('data-page') || href.replace('/', '');

                // Push to history
                const hash = href.replace('/', '');
                history.pushState({page: href}, '', `#${hash}`);

                // Cargar el contenido de la nueva página
                loadContent(href);

                // Actualizar el estado activo en el menú de navegación lateral
                const correspondingNavLink = document.querySelector(`aside nav a[data-page="${page}"]`) || 
                                            document.querySelector(`aside nav a[href="${href}"]`);
                if (correspondingNavLink) {
                    updateActiveLink(correspondingNavLink);
                }
            }
        });
        console.log('✅ Listener agregado al contenido principal');
    }

    // Listener for browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            loadContent(event.state.page);
            // Update active link based on the page
            const page = event.state.page.replace('/', '');
            const correspondingNavLink = document.querySelector(`aside nav a[data-page="${page}"]`);
            if (correspondingNavLink) {
                updateActiveLink(correspondingNavLink);
            }
        }
    });

    // ========== CARGA INICIAL DE CONTENIDO ==========

    // Determinar página inicial según rol o hash
    let initialPage = '/home';
    let activeMenuSelector = '#menu-cliente a[data-page="home"]';

    // Check if there's a hash in URL for direct navigation
    if (window.location.hash) {
        const hashPage = '/' + window.location.hash.slice(1);
        // Basic validation - should start with / and not contain invalid chars
        if (hashPage.match(/^\/[a-zA-Z0-9_-]+$/)) {
            initialPage = hashPage;
            // Try to find the corresponding menu selector
            const link = document.querySelector(`aside nav a[href="${hashPage}"]`);
            if (link) {
                const dataPage = link.getAttribute('data-page');
                activeMenuSelector = `a[data-page="${dataPage}"]`;
            }
        }
    } else {
        // No hash, determine by role
        if (window.RoleManager) {
            // Si no hay sección en URL, determinar por rol
            if (window.RoleManager.isAdmin()) {
                initialPage = '/admin-panel';
                activeMenuSelector = '#menu-admin a[data-page="admin-panel"]';
                console.log('🚀 Rol detectado: Administrador');
            } else if (window.RoleManager.isAtencionPublico()) {
                initialPage = '/atencion-panel';
                activeMenuSelector = '#menu-atencion a[data-page="atencion-panel"]';
                console.log('🚀 Rol detectado: Atención al Público');
            } else if (window.RoleManager.isVerificador()) {
                initialPage = '/solicitudes-cola';
                activeMenuSelector = '#menu-verificador a[data-page="solicitudes-cola"]';
                console.log('🚀 Rol detectado: Verificador');
            } else {
                console.log('🚀 Rol detectado: Cliente');
            }
        }
    }
    
    console.log('🚀 Página inicial determinada:', initialPage);

    // Función para cargar y marcar activo
    async function loadInitialContent() {
        try {
            // Cargar contenido
            await window.loadContent(initialPage);
            
            // Set initial history state
            if (!window.location.hash) {
                history.replaceState({page: initialPage}, '', `#${initialPage.replace('/', '')}`);
            }
            
            // Marcar enlace activo
            const initialActiveLink = document.querySelector(`aside nav ${activeMenuSelector}`);
            if (initialActiveLink) {
                initialActiveLink.classList.add('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                initialActiveLink.classList.remove('text-gray-500', 'font-medium');
                
                // Si el enlace está dentro de un submenú de Ajustes, abrirlo automáticamente
                const parentLi = initialActiveLink.closest('li[data-group^="ajustes"]');
                if (parentLi) {
                    const mainButton = parentLi.querySelector('button');
                    const submenu = parentLi.querySelector('ul');
                    const arrow = parentLi.querySelector('svg');
                    
                    if (mainButton) {
                        mainButton.classList.add('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                        mainButton.classList.remove('text-gray-500', 'font-medium');
                    }
                    if (submenu) {
                        submenu.classList.remove('hidden');
                    }
                    if (arrow) {
                        arrow.classList.add('rotate-180');
                    }
                }
            } else if (panelParam) {
                // Si se solicitó un panel pero no se encontró el enlace, redirigir a 404
                console.warn('⚠️ Panel solicitado no encontrado en el menú:', activeMenuSelector);
                window.location.href = '/404';
                return false;
            } else {
                console.warn('⚠️ No se encontró el enlace:', activeMenuSelector);
            }
            
            // No query-panel support anymore; nothing to clean from URL
            
            return true;
        } catch (error) {
            console.error('❌ Error cargando contenido inicial:', error);
            mainContent.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-600 mb-4">Error al cargar el contenido</p>
                    <button onclick="location.reload()" class="bg-principal-500 text-white px-4 py-2 rounded hover:bg-principal-600">
                        Recargar página
                    </button>
                </div>
            `;
            return false;
        }
    }

    // Marcar que dashboard.js está listo
    window.__dashboardJsReady = true;
    
    // EJECUTAR CARGA INMEDIATAMENTE
    try {
        loadInitialContent();
    } catch (error) {
        console.error('❌ Error al llamar loadInitialContent():', error);
    };
});