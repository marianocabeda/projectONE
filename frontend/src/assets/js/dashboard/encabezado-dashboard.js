/**
 * header-dashboard.js
 * Header para usuarios autenticados en el dashboard
 */

const dashboardHeaderContent = `
    <header class="bg-principal-500 dark:bg-principal-700 text-white shadow-lg sticky top-0 z-50 transition-colors duration-300">
        <nav class="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <!-- Logo -->
                <a href="/dashboard" class="group flex items-center flex-shrink-0">
                    <img 
                        src="/images/logos/one-blanco.png" 
                        alt="Logo" 
                        class="h-9 sm:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                    >
                </a>
            </div>

            <!-- Íconos de la derecha -->
            <div class="flex items-center space-x-4">
                <!-- Notifications Icon with Container -->
                <div id="notifications-container" class="relative">
                    <button id="notifications-button" class="relative p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200" aria-label="Notificaciones">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                        </svg>
                        <!-- Badge para contador de notificaciones (se agregará dinámicamente) -->
                    </button>
                    <!-- El dropdown se creará aquí dinámicamente -->
                </div>

                <!-- Mobile aside hamburger for dashboard -->
                <button 
                    id="aside-menu-button" 
                    class="md:hidden p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                    aria-label="Abrir menú de navegación">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>

                <!-- User Profile/Dropdown -->
                <div class="relative">
                    <button id="user-menu-button" class="flex items-center p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200" aria-label="Menú de usuario">
                        <!-- Generic User SVG Icon -->
                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                        </svg>
                    </button>
                    <div id="user-menu-dropdown" class="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-card rounded-md shadow-lg dark:shadow-2xl py-1 hidden z-50 transition-colors duration-300 border border-gray-200 dark:border-dark-border-primary">
                        <button class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors" id="toggle-theme-button">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                            </svg>
                            <span id="theme-button-text">Tema oscuro</span>
                        </button>
                        <button data-logout id="logout-btn" class="logout-btn flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-bg-hover font-medium transition-colors">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Menú desplegable para móvil -->
        <div id="dashboard-mobile-menu" class="hidden md:hidden bg-white dark:bg-dark-bg-secondary border-t border-principal-100 dark:border-dark-border-primary shadow-xl transition-colors duration-300">
            <!-- El contenido del menú se inyectará aquí con JS -->
        </div>

        <!-- Panel de notificaciones móvil (fullscreen debajo del header) -->
        <div id="notifications-mobile-panel" class="hidden md:hidden fixed inset-x-0 top-16 bottom-0 bg-white dark:bg-dark-bg-secondary shadow-2xl z-40 transition-colors duration-300">
            <div class="h-full flex flex-col">
                <!-- Header del panel (fijo) -->
                <div class="px-4 py-3 border-b border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-tertiary flex items-center justify-between flex-shrink-0 transition-colors duration-300">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-dark-text-primary">Notificaciones</h3>
                    <button id="close-mobile-notifications" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-bg-hover text-gray-600 dark:text-dark-text-primary transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <!-- Contenido scrolleable -->
                <div id="notifications-mobile-list" class="flex-1 overflow-y-auto overscroll-contain">
                    <!-- Las notificaciones se renderizarán aquí -->
                </div>
                <!-- Footer (fijo) -->
                <div class="px-4 py-3 border-t border-gray-200 dark:border-dark-border-primary bg-gray-50 dark:bg-dark-bg-tertiary flex-shrink-0 transition-colors duration-300">
                    <button id="mobile-view-all-notifications" class="w-full text-sm text-principal-600 dark:text-dark-principal-600 hover:text-principal-800 dark:hover:text-dark-principal-700 font-medium py-2 transition-colors">
                        Ver todas las notificaciones
                    </button>
                </div>
            </div>
        </div>
    </header>
`;

// Inicialización del header del dashboard
if (!window.__dashboardHeaderInitialized) {
    window.__dashboardHeaderInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        const headerPlaceholder = document.getElementById('header');
        if (!headerPlaceholder) return;

        // Insertar contenido del header
        headerPlaceholder.innerHTML = dashboardHeaderContent;

        // Logo - Cargar página inicial según rol del usuario
        const logoLink = headerPlaceholder.querySelector('a[href="/dashboard"]');
        if (logoLink) {
            logoLink.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🏠 Logo clicked - navigating to initial page based on role');

                if (window.loadContent && typeof window.loadContent === 'function') {
                    try {
                        // Determinar la página inicial según el rol del usuario
                        let initialPage = '/home';
                        let activeSelector = 'a[data-page="home"]';

                        if (window.RoleManager && typeof window.RoleManager.getHomePage === 'function') {
                            try {
                                initialPage = window.RoleManager.getHomePage() || initialPage;
                                const primary = window.RoleManager.getPrimaryRole && window.RoleManager.getPrimaryRole();
                                if (primary === 'admin') {
                                    activeSelector = 'a[data-page="admin-panel"]';
                                } else if (window.RoleManager.isAtencionPublico && window.RoleManager.isAtencionPublico()) {
                                    activeSelector = 'a[data-page="atencion-panel"]';
                                } else if (window.RoleManager.isVerificador && window.RoleManager.isVerificador()) {
                                    activeSelector = 'a[data-page="solicitudes"]';
                                } else {
                                    activeSelector = 'a[data-page="home"]';
                                }
                                console.log('🔑 Rol detectado por RoleManager - cargando', initialPage);
                            } catch (innerErr) {
                                console.warn('⚠️ RoleManager.getHomePage falló, usando /home', innerErr);
                            }
                        }

                        // Cargar la página inicial con timeout y fallback
                        const timeoutMs = 8000;
                        try {
                            await Promise.race([
                                window.loadContent(initialPage),
                                new Promise((_, reject) => setTimeout(() => reject(new Error('loadContent timeout')), timeoutMs))
                            ]);
                        } catch (loadErr) {
                            console.warn('⚠️ loadContent falló o tomó demasiado tiempo:', loadErr);

                            // Fallback: intentar cargar el script del home explícitamente (sin recargar toda la página)
                            try {
                                console.log('🔁 Intentando fallback: cargar /js/dashboard/home.js directamente');
                                await new Promise((resolve, reject) => {
                                    // Evitar multiple carga
                                    if (window.HomeManager && typeof window.HomeManager.init === 'function') {
                                        try { window.HomeManager.init(); resolve(); } catch (e) { reject(e); }
                                        return;
                                    }

                                    const s = document.createElement('script');
                                    s.src = '/js/dashboard/home.js?v=' + new Date().getTime();
                                    s.onload = () => {
                                        console.log('✅ home.js cargado vía fallback');
                                        // Si expone HomeManager con init(), llamarla
                                        try {
                                            if (window.HomeManager && typeof window.HomeManager.init === 'function') {
                                                window.HomeManager.init();
                                            }
                                        } catch (e) {
                                            console.warn('⚠️ Error al inicializar HomeManager en fallback:', e);
                                        }
                                        resolve();
                                    };
                                    s.onerror = (err) => reject(new Error('No se pudo cargar /js/dashboard/home.js'));
                                    document.head.appendChild(s);
                                });
                            } catch (fallbackErr) {
                                console.error('❌ Fallback para /home falló:', fallbackErr);
                                // Último recurso: navegar al shell del dashboard
                                window.location.href = '/dashboard';
                                return;
                            }
                        }

                        // Actualizar estado activo del menú
                        const allLinks = document.querySelectorAll('aside nav a');
                        allLinks.forEach(link => {
                            link.classList.remove('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                            link.classList.add('text-gray-500', 'font-medium');
                        });

                        const activeLink = document.querySelector(`aside nav ${activeSelector}`);
                        if (activeLink) {
                            activeLink.classList.add('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                            activeLink.classList.remove('text-gray-500', 'font-medium');
                        } else {
                            console.warn('⚠️ No se encontró el enlace activo:', activeSelector);
                        }
                    } catch (err) {
                        console.error('❌ Error navegando a la página inicial:', err);
                        // Fallback: recargar completamente la página
                        window.location.href = '/dashboard';
                    }
                } else {
                    console.warn('⚠️ window.loadContent no disponible — usando navegación completa');
                    window.location.href = '/dashboard';
                }
            });
        }

        // User menu dropdown
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        const toggleThemeButton = document.getElementById('toggle-theme-button');

        if (userMenuButton && userMenuDropdown) {
            userMenuButton.addEventListener('click', () => {
                userMenuDropdown.classList.toggle('hidden');
            });

            // Close dropdown if clicked outside
            document.addEventListener('click', (event) => {
                if (!userMenuButton.contains(event.target) && !userMenuDropdown.contains(event.target)) {
                    userMenuDropdown.classList.add('hidden');
                }
            });
        }

        if (toggleThemeButton) {
            const themeButtonText = document.getElementById('theme-button-text');
            const themeIconSvg = toggleThemeButton.querySelector('svg');
            
            // Función para actualizar el botón de tema
            const updateThemeButton = (isDark) => {
                if (!themeButtonText || !themeIconSvg) return;
                
                if (isDark) {
                    // Modo oscuro activo -> mostrar opción para cambiar a claro (ícono sol)
                    themeIconSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
                    themeButtonText.textContent = 'Tema claro';
                } else {
                    // Modo claro activo -> mostrar opción para cambiar a oscuro (ícono luna)
                    themeIconSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
                    themeButtonText.textContent = 'Tema oscuro';
                }
            };
            
            toggleThemeButton.addEventListener('click', () => {
                console.log('🎨 Botón cambiar tema clickeado');
                
                if (window.ThemeManager && typeof window.ThemeManager.toggleTheme === 'function') {
                    window.ThemeManager.toggleTheme();
                    const isDark = window.ThemeManager.isDarkMode();
                    
                    console.log('✅ Tema cambiado a:', window.ThemeManager.getCurrentTheme());
                    
                    // Actualizar el botón según el nuevo tema
                    updateThemeButton(isDark);
                } else {
                    console.error('❌ ThemeManager no está disponible');
                    alert('Error: El gestor de temas no está cargado');
                }
                
                userMenuDropdown.classList.add('hidden');
            });

            // Actualizar el botón al cargar según el tema actual
            setTimeout(() => {
                if (window.ThemeManager) {
                    const isDark = window.ThemeManager.isDarkMode();
                    updateThemeButton(isDark);
                }
            }, 100);
        }

        // Logout button
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🚪 Logout button clicked');

                try {
                    const { default: FloatingModal } = await import('/js/ui/modal-flotante.js');

                    const logoutModal = new FloatingModal({
                        title: 'Cerrar sesión',
                        html: '¿Estás seguro que deseas cerrar sesión?',
                        sanitize: false, // Texto interno confiable, no necesita sanitización
                        showCloseButton: true,
                        closeOnOverlayClick: true,
                        closeOnEsc: true,
                        buttons: [
                            {
                                label: 'Cancelar',
                                primary: false,
                                onClick: (ev, modal) => {
                                    console.log('❌ Logout cancelado');
                                    modal.close();
                                }
                            },
                            {
                                label: 'Cerrar sesión',
                                primary: true,
                                className: 'flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
                                onClick: async (ev, modal) => {
                                    console.log('✅ Logout confirmado');
                                    modal.close();

                                    if (window.AuthToken && typeof window.AuthToken.logout === 'function') {
                                        await window.AuthToken.logout();
                                    } else if (typeof window.performLogout === 'function') {
                                        await window.performLogout();
                                    } else {
                                        console.error('❌ Ni AuthToken.logout ni performLogout están disponibles');
                                        // ✅ Con cookies httpOnly, el logout se maneja en el backend
                                        // No hay storage local que limpiar
                                        window.location.href = '/login';
                                    }
                                }
                            }
                        ]
                    });

                    logoutModal.show();
                } catch (error) {
                    console.error('❌ Error cargando FloatingModal:', error);
                    const shouldLogout = confirm('¿Estás seguro que deseas cerrar sesión?');
                    if (!shouldLogout) return;

                    if (window.AuthToken && typeof window.AuthToken.logout === 'function') {
                        await window.AuthToken.logout();
                    } else if (typeof window.performLogout === 'function') {
                        await window.performLogout();
                    } else {
                        // ✅ Con cookies httpOnly, el logout se maneja en el backend
                        // No hay storage local que limpiar
                        window.location.href = '/login';
                    }
                }
            });
        }

        // Carga de páginas desde el dropdown de usuario usando window.loadContent
        const dropdownLinks = userMenuDropdown.querySelectorAll('a[href]');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                // Solo interceptar si es una ruta del dashboard y window.loadContent está disponible
                if (href && href.startsWith('/') && !href.includes('http') && window.loadContent) {
                    e.preventDefault();
                    console.log('🔗 Cargando página desde header:', href);
                    window.loadContent(href);
                    userMenuDropdown.classList.add('hidden');

                    // Actualizar estado activo del menú
                    const dataPage = href.split('/').pop();
                    const menuLink = document.querySelector(`aside nav a[href="${href}"]`);
                    if (menuLink) {
                        // Desactivar todos
                        document.querySelectorAll('aside nav a').forEach(l => {
                            l.classList.remove('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                            l.classList.add('text-gray-500', 'font-medium');
                        });
                        // Activar el correcto
                        menuLink.classList.add('nav-item-active', 'text-principal-600', 'bg-principal-100', 'font-semibold');
                        menuLink.classList.remove('text-gray-500', 'font-medium');
                    }
                }
            });
        });

        // Inicializar notificaciones (los scripts ya están cargados en dashboard.html)
        setTimeout(() => {
            const notifButton = document.getElementById('notifications-button');
            const mobilePanel = document.getElementById('notifications-mobile-panel');
            const closeMobileBtn = document.getElementById('close-mobile-notifications');
            const mobileViewAllBtn = document.getElementById('mobile-view-all-notifications');
            
            if (!notifButton) {
                console.warn('⚠️ Botón de notificaciones no encontrado en el DOM');
                return;
            }

            // Limpiar cualquier badge existente antes de inicializar
            const existingBadge = notifButton.querySelector('.notification-badge');
            if (existingBadge) {
                console.log('🧹 Limpiando badge existente antes de inicializar');
                existingBadge.remove();
            }

            // Detectar ancho de pantalla
            const isMobile = () => window.innerWidth < 768;

            // Click en botón de notificaciones
            notifButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (isMobile()) {
                    // Móvil: toggle panel fullscreen
                    const isOpen = !mobilePanel.classList.contains('hidden');
                    
                    if (isOpen) {
                        // Cerrar
                        closeMobilePanel();
                        console.log('📱 Panel móvil de notificaciones cerrado');
                    } else {
                        // Abrir
                        mobilePanel.classList.remove('hidden');
                        document.body.classList.add('overflow-hidden', 'fixed', 'w-full');
                        renderMobileNotifications();
                        console.log('📱 Panel móvil de notificaciones abierto');
                    }
                } else {
                    // Desktop: usar dropdown existente
                    if (window.NotificationDropdown && typeof window.NotificationDropdown.toggleDropdown === 'function') {
                        window.NotificationDropdown.toggleDropdown();
                    }
                }
            });

            // Función para cerrar panel móvil
            const closeMobilePanel = () => {
                mobilePanel.classList.add('hidden');
                document.body.classList.remove('overflow-hidden', 'fixed', 'w-full');
            };

            // Botón cerrar panel móvil
            if (closeMobileBtn) {
                closeMobileBtn.addEventListener('click', closeMobilePanel);
            }

            // Botón ver todas (móvil)
            if (mobileViewAllBtn) {
                mobileViewAllBtn.addEventListener('click', () => {
                    closeMobilePanel();
                    if (window.NotificationModal && typeof window.NotificationModal.openModal === 'function') {
                        window.NotificationModal.openModal();
                    }
                });
            }

            // Renderizar notificaciones en panel móvil
            function renderMobileNotifications() {
                const container = document.getElementById('notifications-mobile-list');
                if (!container) return;

                const notifications = window.NotificationSystem?.getNotifications() || [];
                
                if (notifications.length === 0) {
                    container.innerHTML = `
                        <div class="p-8 text-center text-gray-500 dark:text-dark-text-secondary">
                            <svg class="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                            <p class="font-medium text-gray-700 dark:text-dark-text-primary">No hay notificaciones</p>
                            <p class="text-sm mt-1">Te avisaremos cuando tengas algo nuevo</p>
                        </div>
                    `;
                    return;
                }

                // Mostrar hasta 50 notificaciones en móvil (con scroll)
                const displayNotifications = notifications.slice(0, 50);
                const html = displayNotifications.map(n => renderMobileNotificationItem(n)).join('');
                container.innerHTML = html;
                
                // Scroll al inicio
                container.scrollTop = 0;

                // Agregar event listeners a notificaciones
                container.querySelectorAll('.mobile-notification-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const notificationId = parseInt(item.dataset.notificationId);
                        const isRead = item.dataset.notificationRead === 'true';
                        const idConexionRaw = item.dataset.idConexion;
                        const idConexion = (idConexionRaw && idConexionRaw !== '' && idConexionRaw !== 'undefined') ? idConexionRaw : null;

                        console.log('[MobileNotifications] Click en notificación:', {
                            notificationId,
                            idConexion,
                            hash: window.location.hash,
                            dataset: item.dataset
                        });

                        if (!isRead && window.NotificationSystem) {
                            await window.NotificationSystem.markAsRead(notificationId);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        // Cerrar panel
                        closeMobilePanel();
                        
                        // VERIFICAR SI ESTAMOS EN EL PANEL DE VERIFICADOR
                        const currentHash = window.location.hash.replace('#', '');
                        const currentPath = window.location.pathname;
                        const isVerificadorPanel = currentHash === 'solicitudes-cola' || 
                                                   currentHash.includes('verificador') ||
                                                   currentPath.includes('/verificador') || 
                                                   currentPath.includes('solicitudes-cola');
                        
                        console.log('[MobileNotifications] Verificación panel:', {
                            hash: currentHash,
                            pathname: currentPath,
                            isVerificadorPanel,
                            hasIdConexion: !!idConexion,
                            hasModalProcessor: !!window.ModalProcessor,
                            hasRequestsManager: !!window.RequestsManager
                        });
                        
                        // Si estamos en el panel de verificador Y la notificación tiene id_conexion
                        if (isVerificadorPanel && idConexion && window.ModalProcessor && window.RequestsManager) {
                            console.log('[MobileNotifications] Abriendo modal de verificación para conexión:', idConexion);
                            
                            const solicitudes = window.RequestsManager.getSolicitudes();
                            console.log('[MobileNotifications] Solicitudes disponibles:', solicitudes.length);
                            
                            const solicitud = solicitudes.find(s => {
                                const match = s.nro_conexion === idConexion || 
                                             String(s.id) === String(idConexion) || 
                                             String(s.id_conexion_notificacion) === String(idConexion);
                                if (match) {
                                    console.log('[MobileNotifications] Solicitud encontrada:', s);
                                }
                                return match;
                            });
                            
                            if (solicitud) {
                                console.log('[MobileNotifications] ✅ Abriendo modal de procesamiento');
                                window.ModalProcessor.openModal(solicitud);
                            } else {
                                console.warn('[MobileNotifications] ❌ No se encontró solicitud con id_conexion:', idConexion);
                                if (window.NotificationModal) {
                                    window.NotificationModal.openModalWithNotification(notificationId);
                                }
                            }
                        } else {
                            console.log('[MobileNotifications] Abriendo modal de notificaciones normal');
                            if (window.NotificationModal) {
                                window.NotificationModal.openModalWithNotification(notificationId);
                            }
                        }
                    });
                });
            }

            // Renderizar item de notificación para móvil
            function renderMobileNotificationItem(notification) {
                const icon = window.NotificationSystem?.getNotificationIcon(notification.tipo) || '';
                const timeAgo = window.NotificationSystem?.formatRelativeTime(notification.fecha) || '';
                const unreadClass = !notification.leida ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-principal-500 dark:border-l-blue-400' : 'bg-white dark:bg-dark-bg-card';
                const unreadDot = !notification.leida ? '<span class="w-2 h-2 bg-principal-500 dark:bg-blue-400 rounded-full"></span>' : '';

                const safeTitle = window.Sanitizer?.escapeHTML(notification.titulo) || notification.titulo || '';
                const safeMessage = window.Sanitizer?.escapeHTML(notification.mensaje) || notification.mensaje || '';
                const safeTipo = window.Sanitizer?.escapeHTML(notification.tipo) || notification.tipo || '';

                return `
                    <div 
                        class="mobile-notification-item px-4 py-4 border-b border-gray-100 dark:border-dark-border-primary active:bg-gray-50 dark:active:bg-dark-bg-hover cursor-pointer transition-colors ${unreadClass}"
                        data-notification-id="${notification.id}"
                        data-notification-read="${notification.leida}"
                        data-id-conexion="${notification.id_conexion || ''}"
                    >
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0 mt-0.5">
                                ${icon}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="inline-block px-2 py-0.5 text-xs font-semibold uppercase rounded bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary">
                                        ${safeTipo}
                                    </span>
                                    ${unreadDot}
                                </div>
                                <p class="text-sm font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
                                    ${safeTitle}
                                </p>
                                <p class="text-sm text-gray-600 dark:text-dark-text-secondary line-clamp-2">
                                    ${safeMessage}
                                </p>
                                <span class="text-xs text-gray-400 dark:text-dark-text-muted mt-2 inline-block">${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Escuchar evento de actualización de notificaciones
            window.addEventListener('notificationsUpdated', () => {
                if (isMobile() && !mobilePanel.classList.contains('hidden')) {
                    renderMobileNotifications();
                }
            });

            // Inicializar dropdown para desktop
            if (window.NotificationDropdown && typeof window.NotificationDropdown.init === 'function') {
                try {
                    window.NotificationDropdown.init('#notifications-button', null, true); // true = no auto-toggle
                    console.log('✅ NotificationDropdown inicializado correctamente');
                } catch (error) {
                    console.error('❌ Error inicializando NotificationDropdown:', error);
                }
            } else {
                console.error('❌ NotificationDropdown no está disponible. Verifica que menu-notificaciones.js esté cargado.');
            }

            // Actualizar altura del header como variable CSS
            const header = document.querySelector('header');
            if (header) {
                const updateHeaderHeight = () => {
                    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
                };
                updateHeaderHeight();
                window.addEventListener('resize', updateHeaderHeight);
            }
        }, 500);

        // Marcar que el header está listo y disparar evento
        console.log('✅ header-dashboard.js completamente inicializado');

        // Disparar evento para que dashboard.js sepa que estamos listos
        // Esperamos un poco más para asegurar que dashboard.js ya configuró su listener
        setTimeout(() => {
            console.log('📢 Preparando para disparar evento dashboard:ready');
            console.log('📊 Estado:', {
                dashboardJsReady: !!window.__dashboardJsReady,
                loadContentAvailable: !!window.loadContent
            });

            const event = new CustomEvent('dashboard:ready');
            window.dispatchEvent(event);
            console.log('✅ Evento dashboard:ready disparado');
        }, 150);
    });
}
