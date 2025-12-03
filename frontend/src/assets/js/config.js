// Configuración centralizada de la aplicación
(function() {
  const config = {
    // URL base de la API (obtenida de env.js)
    API_BASE_URL: window.ENV?.API_BASE_URL,
    
    // Endpoints del backend API
    endpoints: {
      // ==================== ENDPOINTS PÚBLICOS ====================
      //                No requieren autenticación JWT
      // ============================================================
      
      // Autenticación pública (según backend /v1)
      login: '/auth/login', // Login de usuarios
      register: '/registro', // Registro de nuevos usuarios
      refresh: '/auth/refresh', // Refresh de token
      verifyEmail: '/auth/verificar-email', // Verificación de email (link desde correo) - ruta en backend: /auth/verificar-email
      resendVerification: '/auth/reenvio-email-verificacion', // Reenviar email de verificación
      forgotPassword: '/auth/solicitar-cambio-password', // Solicitar reset de contraseña
      resetPassword: '/auth/cambiar-password', // Reset de contraseña con token
      checkEmail: '/auth/check-email', // Validar si email existe (formularios)

      // Geografía y ubicación (públicos)
      provincias: '/provincias', // Listado de provincias
      departamentos: '/departamentos', // Departamentos por provincia
      distritos: '/distritos', // Distritos por departamento

      // Planes (públicos)
      tipoPlanes: '/tipo-plan', // Tipos de planes disponibles
      planes: '/planes', // Listado de planes
      planById: '/planes/:id', // Detalle de un plan específico
      // Tablas auxiliares públicas
      tipoEmpresaList: '/tipo-empresa', // Listado de tipos de empresa
      tipoEmpresaById: '/tipo-empresa/:id',
      tipoIvaList: '/tipo-iva', // Listado de tipos IVA
      tipoIvaById: '/tipo-iva/:id',
      vinculos: '/vinculos',
      vinculoById: '/vinculos/:id',
      estadosContrato: '/estados-contrato',
      estadoContratoById: '/estados-contrato/:id',
      estadosConexion: '/estados-conexion',
      estadoConexionById: '/estados-conexion/:id',
      cargos: '/cargos',
      cargoById: '/cargos/:id',

      // ==================== ENDPOINTS PROTEGIDOS ====================
      //            Requieren autenticación JWT (prefijo /api)
      // ==============================================================

      // Autenticación protegida
      logout: '/api/auth/logout', // Cerrar sesión (backend: /v1/api/auth/logout)
      changePassword: '/api/auth/cambiar-password-auth', // Cambio de contraseña autenticado
      //authVerifyPassword: '/api/auth/verify-password', // Verificar contraseña del usuario actual
      
      // Soporte técnico (atención al público)
      //soporteCambiarPasswordCliente: '/api/soporte/cambiar-password-cliente', // Cambiar contraseña de un cliente (requiere auth operador)

      // Perfil de usuario
      getUserProfile: '/api/perfil/persona', // Obtener perfil del usuario autenticado
      updateUserProfile: '/api/perfil/persona', // Actualizar perfil
      usarDireccionRegistrada: '/api/perfil/direccion', // Obtener dirección de perfil (GET)
      conexiones: '/api/perfil/conexiones', // Obtener conexiones del usuario autenticado
      // Usuarios / Personas (admin)
      usuarioPerfilById: '/api/usuarios/:id/perfil', // Obtener perfil de un usuario (admin)

      // Notificaciones (según backend)
      notifications: '/api/notificaciones', // GET - Listado de notificaciones del usuario
      notificationMarkRead: '/api/notificaciones/marcar-como-leida', // POST - Marcar una notificación como leída

      // Solicitudes de contrato (endpoint valido para clientes/factibilidad inmediata/derivar)
      crearSolicitud: '/api/cliente-particular/solicitar-conexion', // Crear solicitud de contrato
      revisacionSolicitudesPendientes: '/api/revisacion/solicitudes-pendientes', // GET
      revisacionDetalleSolicitud: '/api/revisacion/solicitud/:id', // GET
      revisacionConfirmarFactibilidad: '/api/revisacion/confirmar-factibilidad', // POST
      revisacionRechazarFactibilidad: '/api/revisacion/rechazar-factibilidad', // POST

      // Firma de contratos
      contratoFirmaPdf: '/api/contrato-firma/:id/pdf', // GET - Obtener PDF del contrato
      contratoFirmaEnviar: '/api/contrato-firma/:id/firma', // POST - Enviar firma en Base64
      contratoFirmaValidarToken: '/api/contrato-firma/:id/validar-token', // POST - Validar token de verificación
      contratoFirmaReenvioToken: '/api/contrato-firma/:id/reenvio-token', // POST - Reenviar token de verificación
      simularPago: '/api/simular-pago/:id_persona/:id_contrato', // POST - Simular pago de contrato


      // Admin - usuarios
      usuarios: '/api/usuarios', // Listado y creación de usuarios (admin) (POST)
      usuariobuscar: '/api/usuarios', // Obtener usuario por filtros (admin) (GET)
      // Planes (admin CRUD)
      planesCreate: '/api/planes', // POST
      planesUpdate: '/api/planes/:id', // PATCH
      planesDelete: '/api/planes/:id', // DELETE

      // Tipo Empresa (admin CRUD)
      tipoEmpresaCreate: '/api/tipo-empresa',
      tipoEmpresaUpdate: '/api/tipo-empresa/:id',
      tipoEmpresaDelete: '/api/tipo-empresa/:id',

      // Tipo IVA (admin CRUD)
      tipoIvaCreate: '/api/tipo-iva',
      tipoIvaUpdate: '/api/tipo-iva/:id',
      tipoIvaDelete: '/api/tipo-iva/:id',

      // Estados Contrato (admin CRUD)
      estadoContratoCreate: '/api/estados-contrato',
      estadoContratoUpdate: '/api/estados-contrato/:id',
      estadoContratoDelete: '/api/estados-contrato/:id',

      // Estados Conexion (admin CRUD)
      estadoConexionCreate: '/api/estados-conexion',
      estadoConexionUpdate: '/api/estados-conexion/:id',
      estadoConexionDelete: '/api/estados-conexion/:id',

      // Cargos (admin CRUD)
      cargoCreate: '/api/cargos',
      cargoUpdate: '/api/cargos/:id',
      cargoDelete: '/api/cargos/:id',

      // Vínculos (admin CRUD)
      vinculoCreate: '/api/vinculos',
      vinculoUpdate: '/api/vinculos/:id',
      vinculoDelete: '/api/vinculos/:id',

      // Direcciones (admin - subrouter /direcciones)
      direcciones: '/api/direcciones', // GET list, POST create
      direccionById: '/api/direcciones/:id', // GET, PATCH, DELETE

      // Roles y permisos (admin)
      roles: '/api/roles',
      roleById: '/api/roles/:id',
      permisos: '/api/permisos',
      permisosInactivos: '/api/permisos/inactivos',
      permisoById: '/api/permisos/:id',
      permisoCreate: '/api/permisos',
      permisoUpdate: '/api/permisos/:id',
      permisoDelete: '/api/permisos/:id',
      permisoReactivar: '/api/permisos/:id/reactivar',

      // API-protegido provincias (existe también público)
      apiProvincias: '/api/provincias',

    },
    
    // Rutas del frontend (rutas servidas por el servidor Express)
    routes: {
      login: '/login',
      register: '/registro',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password',
      dashboard: '/dashboard',
      home: '/home',
      registerCompany: '/registrar-empresa',
    },
    
    // Configuración de tokens
    token: {
      refreshBufferSeconds: 30, // 30 segundos antes de expirar (ajustado para tokens de corta duración en desarrollo)
      storageKey: 'access_token',
      userKey: 'auth_user',
    },
    
    // Configuración de notificaciones
    notifications: {
      pollInterval: 5000, // 5 segundos
      maxNotifications: 10, // Máximo a mostrar en el dropdown
      autoMarkReadDelay: 3000, // 3 segundos antes de marcar como leída
    },
  };

  // Función helper para construir URL completa
  config.getUrl = function(endpoint) {
    // Logging reducido - solo en desarrollo
    const isDev = window.ENV?.isDevelopment === true;
    
    if (isDev) {
      console.log(`🔧 config.getUrl: "${endpoint}" → ${config.endpoints[endpoint] || endpoint}`);
    }
    
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    if (config.endpoints[endpoint]) {
      const fullUrl = config.API_BASE_URL + config.endpoints[endpoint];
      return fullUrl;
    }
    if (endpoint.startsWith('/')) {
      const fullUrl = config.API_BASE_URL + endpoint;
      return fullUrl;
    }
    return endpoint;
  };

  // Exportar configuración global
  window.AppConfig = config;
})();
