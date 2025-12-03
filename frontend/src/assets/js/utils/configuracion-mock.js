/**
 * Configuración de datos mock para desarrollo
 * 
 * INSTRUCCIONES:
 * - Modifica estos datos según tus necesidades de prueba
 * - Los cambios se aplicarán automáticamente en modo 'development'
 * - Puedes agregar más usuarios, planes, facturas, etc.
 */

window.MOCK_CONFIG = {
  
  // ============================================
  // CONFIGURACIÓN DE AUTO-LOGIN
  // ============================================
  autoLogin: {
    enabled: true,  // Cambiar a false para desactivar el login automático
    redirectToDashboard: false, // Cambiar a true para redirigir automáticamente al dashboard
  },

  // ============================================
  // USUARIOS DE PRUEBA
  // ============================================
  users: {
    // Usuario por defecto que se usa en auto-login
    default: {
      id: 1,
      nombre: 'Usuario Demo',
      apellido: 'Desarrollo',
      email: 'demo@desarrollo.com',
      telefono: '+54 9 11 1234-5678',
      dni: '12345678',
      cuil: '20-12345678-9',
      fecha_nacimiento: '1990-05-15',
      sexo: 'M',
      rol: 'admin',
    },

    // Usuarios adicionales para pruebas
    client: {
      id: 2,
      nombre: 'Cliente',
      apellido: 'Prueba',
      email: 'cliente@desarrollo.com',
      telefono: '+54 9 11 8765-4321',
      dni: '87654321',
      cuil: '20-87654321-9',
      fecha_nacimiento: '1985-08-20',
      sexo: 'F',
      rol: 'cliente',
    },

    operator: {
      id: 3,
      nombre: 'Operador',
      apellido: 'Soporte',
      email: 'operador@desarrollo.com',
      telefono: '+54 9 11 5555-5555',
      dni: '11111111',
      cuil: '20-11111111-9',
      fecha_nacimiento: '1995-03-10',
      sexo: 'M',
      rol: 'operador',
    }
  },

  // ============================================
  // CONFIGURACIÓN DE INTERCEPTORES
  // ============================================
  intercept: {
    enabled: true,        // Habilitar/deshabilitar interceptor de fetch
    logRequests: true,    // Mostrar logs de peticiones interceptadas
    delay: 300,           // Delay en ms para simular latencia de red (0 = sin delay)
  },

  // ============================================
  // ENDPOINTS MOCK
  // ============================================
  // Puedes deshabilitar endpoints específicos para usar la API real
  endpoints: {
    login: true,
    user: true,
    planes: true,
    facturas: true,
    empresas: true,
    notificaciones: true,
    refresh: true,
    logout: true,
  },

  // ============================================
  // DATOS PERSONALIZABLES
  // ============================================
  
  // Agregar más planes si es necesario
  customPlans: [],
  
  // Agregar más facturas si es necesario
  customFacturas: [],
  
  // Agregar más empresas si es necesario
  customEmpresas: [],
  
  // Agregar más notificaciones si es necesario
  customNotifications: [],
};

// Mensaje de configuración cargada
if (window.ENV && window.ENV.isDevelopment) {
  console.log('⚙️ Configuración de mocks cargada (window.MOCK_CONFIG)');
}
