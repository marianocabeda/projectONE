/**
 * header-public.js
 * Header para usuarios no autenticados (visitantes)
 */

const publicHeaderContent = `
    <header class="bg-principal-500 text-white shadow-lg sticky top-0 z-50">
        <nav class="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <!-- Logo -->
            <a href="/" class="group flex items-center">
                <img 
                    src="/images/logos/one-blanco.png" 
                    alt="Logo" 
                    class="h-9 sm:h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                >
            </a>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex items-center space-x-6 lg:space-x-8">
                <!-- Menu Links -->
                <div class="flex items-center space-x-4 lg:space-x-6 text-sm font-medium">
                    <a href="/" 
                       class="hover:text-principal-200 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-principal-200 after:transition-all after:duration-300 hover:after:w-full">
                       Home
                    </a>
                    <a href="/contacto" 
                       class="hover:text-principal-200 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-principal-200 after:transition-all after:duration-300 hover:after:w-full">
                       Contacto
                    </a>
                    <a href="/acercade" 
                       class="hover:text-principal-200 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-principal-200 after:transition-all after:duration-300 hover:after:w-full">
                       Acerca de Nosotros
                    </a>
                    <a href="/login" 
                       class="font-semibold hover:text-white transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                       AUTOGESTIÓN
                    </a>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center space-x-3">
                    <a href="/login" 
                       class="boton boton-azul-claro text-sm font-medium shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200">
                        Iniciar sesión
                    </a>
                    <a href="/registro" 
                       class="boton boton-verde text-sm font-medium shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200">
                        Registrarse
                    </a>
                </div>
            </div>

            <!-- Mobile Menu Button -->
            <button 
                id="mobile-menu-button" 
                class="md:hidden p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                aria-label="Abrir menú móvil">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
            </button>
        </nav>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-principal-100 shadow-xl">
            <div class="px-4 py-4 space-y-1">
                <a href="/" 
                   class="block px-4 py-3 text-gray-700 font-medium hover:bg-principal-50 hover:text-principal-600 rounded-md transition-all duration-200">
                   Home
                </a>
                <a href="/contacto" 
                   class="block px-4 py-3 text-gray-700 font-medium hover:bg-principal-50 hover:text-principal-600 rounded-md transition-all duration-200">
                   Contacto
                </a>
                <a href="/acercade" 
                   class="block px-4 py-3 text-gray-700 font-medium hover:bg-principal-50 hover:text-principal-600 rounded-md transition-all duration-200">
                   Acerca de Nosotros
                </a>
                <a href="/login" 
                   class="block px-4 py-3 text-gray-700 font-medium hover:bg-principal-50 hover:text-principal-600 rounded-md transition-all duration-200 font-semibold">
                   AUTOGESTIÓN
                </a>

                <div class="pt-3 mt-3 border-t border-principal-100 space-y-2">
                    <a href="/login" 
                       class="block px-4 py-3 text-center font-medium boton boton-azul rounded-md shadow hover:shadow-md transition-all">
                       Iniciar sesión
                    </a>
                    <a href="/registro" 
                       class="block px-4 py-3 text-center font-medium boton boton-verde rounded-md shadow hover:shadow-md transition-all">
                       Registrarse
                    </a>
                </div>
            </div>
        </div>
    </header>
`;

// Inicialización del header público
if (!window.__publicHeaderInitialized) {
    window.__publicHeaderInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        const headerPlaceholder = document.getElementById('header');
        if (!headerPlaceholder) return;

        // Insertar contenido del header
        headerPlaceholder.innerHTML = publicHeaderContent;

        // Prevenir comportamiento por defecto del logo cuando ya estamos en home
        const logoLink = headerPlaceholder.querySelector('a.group[href="/"]');
        if (logoLink) {
            logoLink.addEventListener('click', (e) => {
                // Si ya estamos en la página principal, prevenir navegación
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    e.preventDefault();
                    console.log('🏠 Ya estás en home - Scroll al inicio (sin refresh)');
                    // Opcional: scroll suave al inicio
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        // Prevenir navegación si hacemos clic en el link "Home" del menú cuando ya estamos ahí
        const homeLinks = headerPlaceholder.querySelectorAll('a[href="/"]');
        homeLinks.forEach(link => {
            // Saltar el logo que ya tiene su listener
            if (link === logoLink) return;
            
            link.addEventListener('click', (e) => {
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    e.preventDefault();
                    console.log('🏠 Ya estás en home - Scroll al inicio (sin refresh)');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        // Lógica para el menú móvil
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            // Cerrar menú si se hace clic fuera de él
            document.addEventListener('click', (event) => {
                if (mobileMenu && mobileMenuButton && 
                    !mobileMenu.contains(event.target) && 
                    !mobileMenuButton.contains(event.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }
    });
}
