package rutas

import (
	"database/sql"

	"contrato_one_internet_modelo/internal/config"
	personas "contrato_one_internet_modelo/internal/handlers"
	"contrato_one_internet_modelo/internal/handlers/auth"
	cargo "contrato_one_internet_modelo/internal/handlers/cargo"
	conexion "contrato_one_internet_modelo/internal/handlers/conexion"
	contrato_firma "contrato_one_internet_modelo/internal/handlers/contrato_firma"
	direccion "contrato_one_internet_modelo/internal/handlers/direccion"
	estado_conexion "contrato_one_internet_modelo/internal/handlers/estado_conexion"
	estado_contrato "contrato_one_internet_modelo/internal/handlers/estado_contrato"
	"contrato_one_internet_modelo/internal/handlers/geografia" // Importa el paquete correcto
	notificaciones "contrato_one_internet_modelo/internal/handlers/notificaciones"
	perfil "contrato_one_internet_modelo/internal/handlers/perfil"
	permiso "contrato_one_internet_modelo/internal/handlers/permiso"
	planes "contrato_one_internet_modelo/internal/handlers/planes"
	rol "contrato_one_internet_modelo/internal/handlers/rol"
	tipo_empresa "contrato_one_internet_modelo/internal/handlers/tipo_empresa"
	tipo_iva "contrato_one_internet_modelo/internal/handlers/tipo_iva"
	vinculo "contrato_one_internet_modelo/internal/handlers/vinculo"
	"contrato_one_internet_modelo/internal/middleware"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/servicios"

	"github.com/gorilla/mux"
)

func SetupRutas(db *sql.DB, cfg config.AppConfig) *mux.Router {
	r := mux.NewRouter()
	apiV1 := r.PathPrefix("/api/v1").Subrouter()

	// Repositorios
	geografiaRepo := repositorios.NewGeografiaRepository(db)

	// TokenManager para manejar el token con concurrencia segura
	tokenManager := auth.NewTokenManager(cfg.InternalJWTSecret)
	authHandler := auth.NewAuthHandler(tokenManager)

	//clientesHandler := clientes.NewClientesHandler(clientesService)
	geografiaHandler := geografia.NewHandler(geografiaRepo)
	// Nueva inyección para el flujo de Personas
	//personaService := servicios.NewPersonaService(db)
	//personasHandler := personas.NewPersonasHandler(personaService)
	usuarioService := servicios.NewUsuarioService(db) // Nuevo servicio
	personasHandler := personas.NewPersonasHandler(usuarioService)
	perfilesHandler := personas.NewPerfilHandler(usuarioService)

	// Planes
	planService := servicios.NewPlanService(db)
	planesHandler := planes.NewHandler(planService)

	// Tipos de IVA
	tipoIvaRepo := repositorios.NewTipoIvaRepo(db)
	tipoIvaService := servicios.NewTipoIvaService(tipoIvaRepo)
	tipoIvaHandler := tipo_iva.NewHandler(tipoIvaService)
	tipoIvaWriteHandler := tipo_iva.NewWriteHandler(tipoIvaService)

	// Vínculos
	vinculoRepo := repositorios.NewVinculoRepo(db)
	vinculoService := servicios.NewVinculoService(vinculoRepo)
	vinculoHandler := vinculo.NewHandler(vinculoService)
	vinculoWriteHandler := vinculo.NewWriteHandler(vinculoService)

	// Tipos de empresa
	tipoEmpresaRepo := repositorios.NewTipoEmpresaRepo(db)
	tipoEmpresaService := servicios.NewTipoEmpresaService(tipoEmpresaRepo)
	tipoEmpresaHandler := tipo_empresa.NewHandler(tipoEmpresaService)
	tipoEmpresaWriteHandler := tipo_empresa.NewWriteHandler(tipoEmpresaService)

	// Estados de contrato
	estadoContratoRepo := repositorios.NewEstadoContratoRepo(db)
	estadoContratoService := servicios.NewEstadoContratoService(estadoContratoRepo)
	estadoContratoHandler := estado_contrato.NewHandler(estadoContratoService)
	estadoContratoWriteHandler := estado_contrato.NewWriteHandler(estadoContratoService)

	// Estados de conexión
	estadoConexionRepo := repositorios.NewEstadoConexionRepo(db)
	estadoConexionService := servicios.NewEstadoConexionService(estadoConexionRepo)
	estadoConexionHandler := estado_conexion.NewHandler(estadoConexionService)
	estadoConexionWriteHandler := estado_conexion.NewWriteHandler(estadoConexionService)

	// Cargos
	cargoRepo := repositorios.NewCargoRepo(db)
	cargoService := servicios.NewCargoService(cargoRepo)
	cargoHandler := cargo.NewHandler(cargoService)
	cargoWriteHandler := cargo.NewWriteHandler(cargoService)

	// Direcciones
	direccionRepo := repositorios.NewDireccionRepo(db)
	direccionService := servicios.NewDireccionService(direccionRepo)
	direccionHandler := direccion.NewHandler(direccionService)

	// Conexiones
	conexionService := servicios.NewConexionService(db)
	conexionHandler := conexion.NewConexionHandler(conexionService)

	// Notificaciones
	notificacionService := servicios.NewNotificacionService(db)
	notificacionHandler := notificaciones.NewNotificacionHandler(notificacionService)

	// Perfil - Contratos y Conexiones
	contratoRepo := repositorios.NewContratoRepo(db)
	conexionRepo := repositorios.NewConexionRepo(db)
	perfilContratoHandler := perfil.NewContratoHandlerM(contratoRepo)
	perfilConexionHandler := perfil.NewConexionHandlerM(conexionRepo)

	// Firma Digital de Contratos
	templatePath := "/var/www/html/contratos/backend/contrato_one_internet_controlador/contratos.html"
	contractBasePath := "/var/www/contracts"
	pdfService := servicios.NewPDFService(db, templatePath, contractBasePath)
	firmaDigitalService := servicios.NewFirmaDigitalService(db, pdfService, contractBasePath)
	contratoFirmaHandler := contrato_firma.NewHandler(db, firmaDigitalService)

	// Rutas públicas
	apiV1.HandleFunc("/internal/auth/generate-token", authHandler.GenerateTokenHandler).Methods("GET")

	// Rutas protegidas con middleware usando el secreto para validar token
	protectedRouter := apiV1.PathPrefix("/internal").Subrouter()
	protectedRouter.Use(middleware.AutenticacionInterna(cfg.InternalJWTSecret))

	protectedRouter.HandleFunc("/provincias", geografiaHandler.ObtenerProvincias).Methods("GET")
	protectedRouter.HandleFunc("/departamentos", geografiaHandler.ObtenerDepartamentos).Methods("GET")
	protectedRouter.HandleFunc("/distritos", geografiaHandler.ObtenerDistritos).Methods("GET")

	// Nuevo endpoint para crear persona con dirección
	//protectedRouter.HandleFunc("/personas", personasHandler.CrearPersonaCompletaHandler).Methods("POST")
	// Endpoint para el nuevo flujo completo. Este endpoint debe estar protegido en el servicio
	// 'modelo' (solo accesible desde el controlador interno). Por eso lo dejamos en el subrouter
	// protegido por AutenticacionInterna.
	protectedRouter.HandleFunc("/personas-con-usuario", personasHandler.CrearPersonaYUsuarioHandler).Methods("POST")

	// Endpoints internos para obtener perfil y dirección de una persona
	protectedRouter.HandleFunc("/perfil/persona", perfilesHandler.ObtenerPerfilPersonaHandler).Methods("GET")
	protectedRouter.HandleFunc("/perfil/direccion", perfilesHandler.ObtenerDireccionHandler).Methods("GET")
	// Endpoint interno para actualizar perfil (parcial) de la persona
	protectedRouter.HandleFunc("/perfil/persona", perfilesHandler.ActualizarPerfilPersonaHandler).Methods("PATCH")
	// Endpoints internos para consultar contratos y conexiones del perfil (protegidos)
	protectedRouter.HandleFunc("/perfil/contratos", perfilContratoHandler.ObtenerMisContratos).Methods("GET")
	protectedRouter.HandleFunc("/perfil/conexiones", perfilConexionHandler.ObtenerMisConexiones).Methods("GET")

	// (registered later, after se crean handlers de email)
	usuarioRepo := repositorios.NewUsuarioRepo(db)
	usuarioRolRepo := repositorios.NewUsuarioRolRepo(db)
	refreshRepo := repositorios.NewRefreshTokenRepo(db)
	loginService := servicios.NewLoginService(usuarioRepo, usuarioRolRepo, refreshRepo, &cfg)      // servicio para login
	loginHandler := auth.NewLoginHandler(loginService) // handler del login
	// Rutas públicas (no requieren token)
	apiV1.HandleFunc("/auth/login", loginHandler.LoginHandler).Methods("POST")

	refreshHandler := auth.NewRefreshHandler(loginService)
	apiV1.HandleFunc("/auth/refresh", refreshHandler.RefreshTokenHandler).Methods("POST")

	// Logout (revocar refresh token)
	logoutHandler := auth.NewLogoutHandler(loginService)
	apiV1.HandleFunc("/auth/logout", logoutHandler.LogoutHandler).Methods("POST")

	emailService := servicios.NewUsuarioService(db) // servicio para verificación de email
	emailHandler := auth.NewUsuarioHandler(emailService)
	// Ruta para verificar email
	apiV1.HandleFunc("/auth/verificar-email", emailHandler.VerificarEmailHandler).Methods("POST")
	// Ruta para reenviar token de verificación (público)
	apiV1.HandleFunc("/auth/resend-verification", emailHandler.ResendVerificationHandler).Methods("POST")

	// Registrar endpoint interno para chequear disponibilidad de email (protegido)
	protectedRouter.HandleFunc("/auth/check-email", emailHandler.CheckEmailHandler).Methods("GET")

	// Endpoints internos para gestionar planes (protegidos)
	planesWriteHandler := planes.NewWriteHandler(planService)
	protectedRouter.HandleFunc("/planes", planesWriteHandler.CrearPlanHandler).Methods("POST")
	protectedRouter.HandleFunc("/planes/{id}", planesWriteHandler.ActualizarPlanHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/planes/{id}", planesWriteHandler.EliminarPlanHandler).Methods("DELETE")

	// Endpoints internos para gestionar tipos de IVA (protegidos)
	protectedRouter.HandleFunc("/tipo-iva", tipoIvaWriteHandler.CrearTipoIvaHandler).Methods("POST")
	protectedRouter.HandleFunc("/tipo-iva/{id}", tipoIvaWriteHandler.ActualizarTipoIvaHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/tipo-iva/{id}", tipoIvaWriteHandler.EliminarTipoIvaHandler).Methods("DELETE")

	// Endpoints internos para gestionar vínculos (protegidos)
	protectedRouter.HandleFunc("/vinculos", vinculoWriteHandler.CrearVinculoHandler).Methods("POST")
	protectedRouter.HandleFunc("/vinculos/{id}", vinculoWriteHandler.ActualizarVinculoHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/vinculos/{id}", vinculoWriteHandler.EliminarVinculoHandler).Methods("DELETE")

	// Endpoints internos para gestionar tipos de empresa (protegidos)
	protectedRouter.HandleFunc("/tipo-empresa", tipoEmpresaWriteHandler.CrearTipoEmpresaHandler).Methods("POST")
	protectedRouter.HandleFunc("/tipo-empresa/{id}", tipoEmpresaWriteHandler.ActualizarTipoEmpresaHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/tipo-empresa/{id}", tipoEmpresaWriteHandler.EliminarTipoEmpresaHandler).Methods("DELETE")

	// Endpoints internos para gestionar estados de contrato (protegidos)
	protectedRouter.HandleFunc("/estados-contrato", estadoContratoWriteHandler.CrearEstadoContratoHandler).Methods("POST")
	protectedRouter.HandleFunc("/estados-contrato/{id}", estadoContratoWriteHandler.ActualizarEstadoContratoHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/estados-contrato/{id}", estadoContratoWriteHandler.EliminarEstadoContratoHandler).Methods("DELETE")

	// Endpoints internos para gestionar estados de conexión (protegidos)
	protectedRouter.HandleFunc("/estados-conexion", estadoConexionWriteHandler.CrearEstadoConexionHandler).Methods("POST")
	protectedRouter.HandleFunc("/estados-conexion/{id}", estadoConexionWriteHandler.ActualizarEstadoConexionHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/estados-conexion/{id}", estadoConexionWriteHandler.EliminarEstadoConexionHandler).Methods("DELETE")

	// Endpoints internos para gestionar roles (protegidos)
	rolRepo := repositorios.NewRolRepo(db)
	rolService := servicios.NewRolService(rolRepo)
	rolHandler := rol.NewHandler(rolService)
	rolWriteHandler := rol.NewWriteHandler(rolService)
	protectedRouter.HandleFunc("/roles", rolWriteHandler.CrearRolHandler).Methods("POST")
	protectedRouter.HandleFunc("/roles/{id}", rolWriteHandler.ActualizarRolHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/roles/{id}", rolWriteHandler.EliminarRolHandler).Methods("DELETE")

	// Endpoints internos para gestionar permisos (protegidos)
	permisoRepo := repositorios.NewPermisoRepo(db)
	permisoService := servicios.NewPermisoService(permisoRepo)
	permisoHandler := permiso.NewHandler(permisoService)
	permisoWriteHandler := permiso.NewWriteHandler(permisoService)
	protectedRouter.HandleFunc("/permisos", permisoWriteHandler.CrearPermisoHandler).Methods("POST")
	protectedRouter.HandleFunc("/permisos/{id}", permisoWriteHandler.ActualizarPermisoHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/permisos/{id}", permisoWriteHandler.EliminarPermisoHandler).Methods("DELETE")
	// Reactivar permiso (PUT /permisos/{id}/reactivar)
	protectedRouter.HandleFunc("/permisos/{id}/reactivar", permisoWriteHandler.ReactivarPermisoHandler).Methods("PUT")

	// Endpoints internos para gestionar cargos (protegidos)
	protectedRouter.HandleFunc("/cargos", cargoWriteHandler.CrearCargoHandler).Methods("POST")
	protectedRouter.HandleFunc("/cargos/{id}", cargoWriteHandler.ActualizarCargoHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/cargos/{id}", cargoWriteHandler.EliminarCargoHandler).Methods("DELETE")

	// Endpoints internos para gestionar direcciones (protegidos)
	protectedRouter.HandleFunc("/direcciones", direccionHandler.ListarDirecciones).Methods("GET")
	protectedRouter.HandleFunc("/direcciones/{id}", direccionHandler.ObtenerDireccionPorID).Methods("GET")
	protectedRouter.HandleFunc("/direcciones", direccionHandler.CrearDireccionHandler).Methods("POST")
	protectedRouter.HandleFunc("/direcciones/{id}", direccionHandler.ActualizarDireccionHandler).Methods("PATCH")
	protectedRouter.HandleFunc("/direcciones/{id}", direccionHandler.EliminarDireccionHandler).Methods("DELETE")
	// Endpoint interno para solicitar conexión (protegido)
	protectedRouter.HandleFunc("/solicitar-conexion-particular", conexionHandler.SolicitarConexionParticularHandler).Methods("POST")

	// Endpoint interno para obtener solicitudes pendientes (protegido)
	protectedRouter.HandleFunc("/revisacion/solicitudes-pendientes", conexionHandler.ObtenerSolicitudesPendientesHandler).Methods("GET")

	// Endpoint interno para obtener detalle de una solicitud específica (protegido)
	protectedRouter.HandleFunc("/revisacion/solicitud/{id}", conexionHandler.ObtenerDetalleSolicitudHandler).Methods("GET")

	// Endpoint interno para confirmar factibilidad de una solicitud (protegido)
	protectedRouter.HandleFunc("/revisacion/confirmar-factibilidad", conexionHandler.ConfirmarFactibilidadHandler).Methods("POST")

	// Endpoint interno para rechazar factibilidad de una solicitud (protegido)
	protectedRouter.HandleFunc("/revisacion/rechazar-factibilidad", conexionHandler.RechazarFactibilidadHandler).Methods("POST")

	// Endpoint interno para obtener notificaciones del usuario (protegido)
	protectedRouter.HandleFunc("/notificaciones", notificacionHandler.ObtenerNotificacionesHandler).Methods("GET")

	// Endpoint interno para marcar notificación como leída (protegido)
	protectedRouter.HandleFunc("/notificaciones/marcar-como-leida", notificacionHandler.MarcarComoLeidaHandler).Methods("POST")

	// Endpoint interno para listar usuarios (persona + dirección)
	protectedRouter.HandleFunc("/usuarios", personasHandler.ListarUsuariosHandler).Methods("GET")

	// Endpoint interno protegido para cambiar contraseña autenticada
	changePassHandler := auth.NewCambiarPasswordAutenticadoHandler(usuarioService)
	protectedRouter.HandleFunc("/auth/change-password", changePassHandler.CambiarPasswordAutenticado).Methods("POST")

	// Endpoints públicos para reset de contraseña
	apiV1.HandleFunc("/auth/solicitar-reset", emailHandler.SolicitarResetHandler).Methods("POST")
	apiV1.HandleFunc("/auth/cambiar-password", emailHandler.CambiarPasswordHandler).Methods("POST")

	// Rutas de negocio protegidas (ejemplo)
	businessRouter := apiV1.PathPrefix("").Subrouter()
	businessRouter.Use(middleware.AutenticacionInterna(cfg.InternalJWTSecret))
	/*
		businessRouter.HandleFunc("/clientes/particulares", clientesHandler.CrearClienteParticular).Methods("POST")
		businessRouter.HandleFunc("/clientes/empresas", clientesHandler.CrearClienteEmpresa).Methods("POST")
	*/
	// Rutas publicas de planes
	apiV1.HandleFunc("/tipo-plan", planesHandler.ListarTipoPlanes).Methods("GET")
	apiV1.HandleFunc("/planes", planesHandler.ListarPlanes).Methods("GET")
	apiV1.HandleFunc("/planes/{id}", planesHandler.ObtenerPlanPorID).Methods("GET")
	// Rutas publicas de tipos de IVA
	apiV1.HandleFunc("/tipo-iva", tipoIvaHandler.ListarTipoIva).Methods("GET")
	apiV1.HandleFunc("/tipo-iva/{id}", tipoIvaHandler.ObtenerTipoIvaPorID).Methods("GET")
	// Rutas publicas de vínculos
	apiV1.HandleFunc("/vinculos", vinculoHandler.ListarVinculos).Methods("GET")
	apiV1.HandleFunc("/vinculos/{id}", vinculoHandler.ObtenerVinculoPorID).Methods("GET")
	// Rutas publicas de estados de contrato
	apiV1.HandleFunc("/estados-contrato", estadoContratoHandler.ListarEstadosContrato).Methods("GET")
	apiV1.HandleFunc("/estados-contrato/{id}", estadoContratoHandler.ObtenerEstadoContratoPorID).Methods("GET")
	// Rutas publicas de roles
	apiV1.HandleFunc("/roles", rolHandler.ListarRoles).Methods("GET")
	apiV1.HandleFunc("/roles/{id}", rolHandler.ObtenerRolPorID).Methods("GET")
	// Rutas publicas de permisos
	apiV1.HandleFunc("/permisos", permisoHandler.ListarPermisos).Methods("GET")
	apiV1.HandleFunc("/permisos/inactivos", permisoHandler.ListarPermisosInactivos).Methods("GET")
	apiV1.HandleFunc("/permisos/{id}", permisoHandler.ObtenerPermisoPorID).Methods("GET")
	// Rutas publicas de tipos de empresa
	apiV1.HandleFunc("/tipo-empresa", tipoEmpresaHandler.ListarTipoEmpresa).Methods("GET")
	apiV1.HandleFunc("/tipo-empresa/{id}", tipoEmpresaHandler.ObtenerTipoEmpresaPorID).Methods("GET")
	// Rutas públicas de estados de conexión
	apiV1.HandleFunc("/estados-conexion", estadoConexionHandler.ListarEstadosConexion).Methods("GET")
	apiV1.HandleFunc("/estados-conexion/{id}", estadoConexionHandler.ObtenerEstadoConexionPorID).Methods("GET")
	// Rutas públicas de cargos
	apiV1.HandleFunc("/cargos", cargoHandler.ListarCargos).Methods("GET")
	apiV1.HandleFunc("/cargos/{id}", cargoHandler.ObtenerCargoPorID).Methods("GET")

	// Endpoints internos para firma digital de contratos (protegidos)
	protectedRouter.HandleFunc("/simular-pago/{id_persona}/{id_contrato}", contratoFirmaHandler.SimularPago).Methods("POST")
	protectedRouter.HandleFunc("/contrato-firma/{id}/firma", contratoFirmaHandler.GuardarFirma).Methods("POST")
	protectedRouter.HandleFunc("/contrato-firma/{id}/validar-token", contratoFirmaHandler.ValidarToken).Methods("POST")
	protectedRouter.HandleFunc("/contrato-firma/{id}", contratoFirmaHandler.ObtenerContrato).Methods("GET")
	protectedRouter.HandleFunc("/contrato-firma/{id}/token-enviado", contratoFirmaHandler.MarcarTokenEnviado).Methods("POST")
	protectedRouter.HandleFunc("/contrato-firma/{id}/reenvio-token", contratoFirmaHandler.ReenviarToken).Methods("POST")
	protectedRouter.HandleFunc("/contrato-firma/{id}/pdf", contratoFirmaHandler.ServirPDF).Methods("GET")
	protectedRouter.HandleFunc("/contrato-firma/{id}/descargar", contratoFirmaHandler.DescargarPDF).Methods("GET")

	return r
}