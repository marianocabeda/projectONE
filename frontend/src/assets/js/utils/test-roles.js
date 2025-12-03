/**
 * Script de Testing de Roles
 * Usar en la consola del navegador para probar diferentes roles
 */

(function() {
    console.log('🔧 Script de Testing de Roles cargado');
    console.log('');
    console.log('Comandos disponibles:');
    console.log('  testAdmin()      - Cambia a rol administrador');
    console.log('  testVerificador() - Cambia a rol verificador');
    console.log('  testCliente()     - Cambia a rol cliente');
    console.log('  testEmpresa()     - Cambia a rol empresa');
    console.log('  showCurrentRole() - Muestra el rol actual');
    console.log('  resetRole()       - Resetea al rol por defecto');
    console.log('');

    /**
     * Cambia al rol de administrador
     */
    window.testAdmin = function() {
        console.log('🔐 Cambiando a rol: ADMINISTRADOR');
        if (window.RoleManager) {
            window.RoleManager.setRoles(['admin']);
            console.log('✅ Rol cambiado. Recargando página...');
            setTimeout(() => location.reload(), 500);
        } else {
            console.error('❌ RoleManager no está disponible');
        }
    };

    /**
     * Cambia al rol de verificador
     */
    window.testVerificador = function() {
        console.log('🔐 Cambiando a rol: VERIFICADOR');
        if (window.RoleManager) {
            window.RoleManager.setRoles(['verificador']);
            console.log('✅ Rol cambiado. Recargando página...');
            setTimeout(() => location.reload(), 500);
        } else {
            console.error('❌ RoleManager no está disponible');
        }
    };

    /**
     * Cambia al rol de cliente
     */
    window.testCliente = function() {
        console.log('🔐 Cambiando a rol: CLIENTE');
        if (window.RoleManager) {
            window.RoleManager.setRoles(['cliente']);
            console.log('✅ Rol cambiado. Recargando página...');
            setTimeout(() => location.reload(), 500);
        } else {
            console.error('❌ RoleManager no está disponible');
        }
    };

    /**
     * Cambia al rol de empresa
     */
    window.testEmpresa = function() {
        console.log('🔐 Cambiando a rol: EMPRESA');
        if (window.RoleManager) {
            window.RoleManager.setRoles(['empresa']);
            console.log('✅ Rol cambiado. Recargando página...');
            setTimeout(() => location.reload(), 500);
        } else {
            console.error('❌ RoleManager no está disponible');
        }
    };

    /**
     * Muestra el rol actual
     */
    window.showCurrentRole = function() {
        if (window.RoleManager) {
            const roles = window.RoleManager.getRoles();
            const primaryRole = window.RoleManager.getPrimaryRole();
            const homePage = window.RoleManager.getHomePage();
            
            console.log('📊 Información del rol actual:');
            console.log('  Roles:', roles);
            console.log('  Rol principal:', primaryRole);
            console.log('  Página de inicio:', homePage);
            console.log('  Es Admin?', window.RoleManager.isAdmin());
            console.log('  Es Verificador?', window.RoleManager.isVerificador());
            console.log('  Es Cliente?', window.RoleManager.isCliente());
        } else {
            console.error('❌ RoleManager no está disponible');
        }
    };

    /**
     * Resetea al rol por defecto
     */
    window.resetRole = function() {
        console.log('🔄 Reseteando roles...');
        if (window.RoleManager) {
            window.RoleManager.reset();
            console.log('✅ Roles reseteados. Recargando página...');
            setTimeout(() => location.reload(), 500);
        } else {
            console.error('❌ RoleManager no está disponible');
        }
    };

    /**
     * Genera un token JWT de prueba con el rol especificado
     */
    window.generateTestToken = function(role) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            user_id: 1,
            email: 'test@example.com',
            nombre: 'Usuario de Prueba',
            roles: [role],
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
        }));
        const signature = 'test_signature';
        
        return `${header}.${payload}.${signature}`;
    };

    /**
     * Guarda un token JWT de prueba en localStorage
     */
    window.setTestToken = function(role) {
        const token = window.generateTestToken(role);
        localStorage.setItem('access_token', token);
        console.log('✅ Token de prueba guardado para rol:', role);
        console.log('Token:', token);
        console.log('Recarga la página para aplicar los cambios');
    };

    console.log('✅ Script de testing listo. Usa los comandos listados arriba.');
})();
