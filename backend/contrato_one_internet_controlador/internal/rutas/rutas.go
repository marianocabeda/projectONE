package rutas

import (
	"net/http"

	"github.com/gorilla/mux"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/handlers"
	"contrato_one_internet_controlador/internal/handlers/auth"
	cargo "contrato_one_internet_controlador/internal/handlers/cargo"
	"contrato_one_internet_controlador/internal/handlers/clientes"
	direccion "contrato_one_internet_controlador/internal/handlers/direccion"
	estado_conexion "contrato_one_internet_controlador/internal/handlers/estado_conexion"
	estado_contrato "contrato_one_internet_controlador/internal/handlers/estado_contrato"
	"contrato_one_internet_controlador/internal/handlers/geolocalizacion"
	notificaciones "contrato_one_internet_controlador/internal/handlers/notificaciones"
	perfil "contrato_one_internet_controlador/internal/handlers/perfil"
	permiso "contrato_one_internet_controlador/internal/handlers/permiso"
	"contrato_one_internet_controlador/internal/handlers/planes"
	rol "contrato_one_internet_controlador/internal/handlers/rol"
	tipo_empresa "contrato_one_internet_controlador/internal/handlers/tipo_empresa"
	tipo_iva "contrato_one_internet_controlador/internal/handlers/tipo_iva"
	usuarios "contrato_one_internet_controlador/internal/handlers/usuarios"
	vinculo "contrato_one_internet_controlador/internal/handlers/vinculo"
	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/servicios"
)

// SetupRutas configura las rutas públicas del controlador.
func SetupRutas(clientesHandler *clientes.ClientesHandler,
	geografiaHandler *geolocalizacion.Handler,
	// Ya no se inyecta el AuthHandler aquí, se crea dentro con los servicios necesarios
	AuthService *servicios.AuthService,
	cfg *config.Config,
	personasHandler *clientes.PersonasHandler,
	conexionHandler *clientes.ConexionHandler,
) *mux.Router {

	r := mux.NewRouter()

	// ---------------------------------------------------------
	// 1. INSTANCIACIÓN DE SERVICIOS Y HANDLERS COMPARTIDOS
	// ---------------------------------------------------------

	// Servicio de Correo (Necesario para Auth)
	correoService := servicios.NewServicioCorreo(
		cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass,
		cfg.FromEmail, cfg.FromName, cfg.EmailTemplatePath,
		cfg.EmailResetTemplatePath,
		cfg.EmailCredentialsTemplatePath,
		cfg.EmailTokenFirmaTemplatePath,
		cfg.LogoLightPath, cfg.LogoDarkPath,
	)

	// Handler de Autenticación UNIFICADO
	authHandler := auth.NewAuthHandler(AuthService, correoService)

	// Servicios Admin / Crud (Instanciados una sola vez)
	planService := servicios.NewPlanService(AuthService.GetModeloClient())
	planHandler := planes.NewHandler(planService)

	tipoEmpresaService := servicios.NewTipoEmpresaService(AuthService.GetModeloClient())
	tipoEmpresaHandler := tipo_empresa.NewHandler(tipoEmpresaService)

	tipoIvaService := servicios.NewTipoIvaService(AuthService.GetModeloClient())
	tipoIvaHandler := tipo_iva.NewHandler(tipoIvaService)

	estadoContratoService := servicios.NewEstadoContratoService(AuthService.GetModeloClient())
	estadoContratoHandler := estado_contrato.NewHandler(estadoContratoService)

	estadoConexionService := servicios.NewEstadoConexionService(AuthService.GetModeloClient())
	estadoConexionHandler := estado_conexion.NewHandler(estadoConexionService)

	cargoService := servicios.NewCargoService(AuthService.GetModeloClient())
	cargoHandler := cargo.NewHandler(cargoService)

	rolHandler := rol.NewHandler(servicios.NewRolService(AuthService.GetModeloClient()))
	permisoHandler := permiso.NewHandler(servicios.NewPermisoService(AuthService.GetModeloClient()))
	vinculoService := servicios.NewVinculoService(AuthService.GetModeloClient())
	vinculoHandler := vinculo.NewHandler(vinculoService)
	direccionHandler := direccion.NewHandler(servicios.NewDireccionService(AuthService.GetModeloClient()))
	notificacionHandler := notificaciones.NewNotificacionHandler(AuthService.GetModeloClient())
	userHandler := usuarios.NewHandler(servicios.NewUsuarioService(AuthService.GetModeloClient()))
	
	// Perfil
	perfilHandler := perfil.NewPerfilHandlerC(AuthService.GetModeloClient())

	// Middleware JWT Base
	jwtAuth := middleware.JWTAuthMiddleware(cfg)

	// ---------------------------------------------------------
	// 2. RUTAS PÚBLICAS (/v1)
	// ---------------------------------------------------------
	publicRouter := r.PathPrefix("/v1").Subrouter()

	// --- Auth Público ---
	// Todo manejado por authHandler
	publicRouter.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	publicRouter.HandleFunc("/auth/refresh", authHandler.Refresh).Methods("POST")
	publicRouter.HandleFunc("/auth/check-email", authHandler.CheckEmail).Methods("GET")
	publicRouter.HandleFunc("/auth/verificar-email", authHandler.VerificarEmail).Methods("GET")
	publicRouter.HandleFunc("/auth/reenvio-email-verificacion", authHandler.ResendVerification).Methods("POST")

	// Reset de Contraseña (Flujo público)
	publicRouter.HandleFunc("/auth/solicitar-cambio-password", authHandler.SolicitarReset).Methods("POST")
	publicRouter.HandleFunc("/auth/cambiar-password", authHandler.EjecutarResetPassword).Methods("POST")

	// --- Geografía ---
	publicRouter.HandleFunc("/provincias", geografiaHandler.ObtenerProvinciasHandler).Methods("GET")
	publicRouter.HandleFunc("/departamentos", geografiaHandler.ObtenerDepartamentosHandler).Methods("GET")
	publicRouter.HandleFunc("/distritos", geografiaHandler.ObtenerDistritosHandler).Methods("GET")

	// --- Registro Público ---
	publicRouter.HandleFunc("/registro", personasHandler.CrearPersonaConUsuarioHandler).Methods("POST")

	// --- Listados Públicos (Tablas auxiliares) ---
	publicRouter.HandleFunc("/tipo-plan", planHandler.ListarTipoPlanes).Methods("GET")
	publicRouter.HandleFunc("/planes", planHandler.ListarPlanes).Methods("GET")
	publicRouter.HandleFunc("/planes/{id}", planHandler.ObtenerPlanPorID).Methods("GET")
	publicRouter.HandleFunc("/tipo-empresa", tipoEmpresaHandler.ListarTipoEmpresa).Methods("GET")
	publicRouter.HandleFunc("/tipo-empresa/{id}", tipoEmpresaHandler.ObtenerTipoEmpresaPorID).Methods("GET")
	publicRouter.HandleFunc("/tipo-iva", tipoIvaHandler.ListarTipoIva).Methods("GET")
	publicRouter.HandleFunc("/tipo-iva/{id}", tipoIvaHandler.ObtenerTipoIvaPorID).Methods("GET")
	publicRouter.HandleFunc("/vinculos", vinculoHandler.ListarVinculos).Methods("GET")
	publicRouter.HandleFunc("/vinculos/{id}", vinculoHandler.ObtenerVinculoPorID).Methods("GET")
	publicRouter.HandleFunc("/estados-contrato", estadoContratoHandler.ListarEstadosContrato).Methods("GET")
	publicRouter.HandleFunc("/estados-contrato/{id}", estadoContratoHandler.ObtenerEstadoContratoPorID).Methods("GET")
	publicRouter.HandleFunc("/estados-conexion", estadoConexionHandler.ListarEstadosConexion).Methods("GET")
	publicRouter.HandleFunc("/estados-conexion/{id}", estadoConexionHandler.ObtenerEstadoConexionPorID).Methods("GET")
	publicRouter.HandleFunc("/cargos", cargoHandler.ListarCargos).Methods("GET")
	publicRouter.HandleFunc("/cargos/{id}", cargoHandler.ObtenerCargoPorID).Methods("GET")

	// ---------------------------------------------------------
	// 3. RUTAS PROTEGIDAS (/v1/api) - Requieren JWT
	// ---------------------------------------------------------
	apiRouter := r.PathPrefix("/v1/api").Subrouter()
	apiRouter.Use(jwtAuth) // Aplica middleware a todo este grupo

	// --- Auth Protegido ---
	apiRouter.HandleFunc("/auth/logout", authHandler.Logout).Methods("POST")
	// Cambio de contraseña estando logueado
	apiRouter.HandleFunc("/auth/cambiar-password-auth", authHandler.ChangePassword).Methods("POST")

	// --- Perfil de Usuario ---
	apiRouter.HandleFunc("/perfil/persona", personasHandler.ObtenerPerfilPersonaHandler).Methods("GET")
	apiRouter.HandleFunc("/perfil/persona", personasHandler.UpdateMiPerfilHandler).Methods("PATCH")
	apiRouter.HandleFunc("/perfil/direccion", personasHandler.ObtenerPerfilDireccionHandler).Methods("GET")

	// --- Notificaciones ---
	apiRouter.HandleFunc("/notificaciones", notificacionHandler.ObtenerNotificacionesHandler).Methods("GET")
	apiRouter.HandleFunc("/notificaciones/marcar-como-leida", notificacionHandler.MarcarComoLeidaHandler).Methods("POST")

	// --- Perfil - Contratos y Conexiones ---
	apiRouter.HandleFunc("/perfil/contratos", perfilHandler.ObtenerMisContratos).Methods("GET")
	apiRouter.HandleFunc("/perfil/conexiones", perfilHandler.ObtenerMisConexiones).Methods("GET")

	// --- Solicitudes de Conexión ---
	apiRouter.HandleFunc("/cliente-particular/solicitar-conexion", conexionHandler.SolicitarConexionHandler).Methods("POST")

	// --- Administración y Roles (Requieren Roles específicos) ---

	// Revisación Técnica
	apiRouter.Handle("/revisacion/solicitudes-pendientes",
		middleware.RequireRole("admin", "verificador")(http.HandlerFunc(conexionHandler.ObtenerSolicitudesPendientesHandler)),
	).Methods("GET")
	apiRouter.Handle("/revisacion/solicitud/{id}",
		middleware.RequireRole("admin", "verificador")(http.HandlerFunc(conexionHandler.ObtenerDetalleSolicitudHandler)),
	).Methods("GET")
	apiRouter.Handle("/revisacion/confirmar-factibilidad",
		middleware.RequireRole("admin", "verificador")(http.HandlerFunc(conexionHandler.ConfirmarFactibilidadHandler)),
	).Methods("POST")
	apiRouter.Handle("/revisacion/rechazar-factibilidad",
		middleware.RequireRole("admin", "verificador")(http.HandlerFunc(conexionHandler.RechazarFactibilidadHandler)),
	).Methods("POST")

	// Gestión de Usuarios (Admin)
	apiRouter.Handle("/usuarios/{id}/perfil",
		middleware.RequireRole("admin", "atencion")(http.HandlerFunc(personasHandler.ObtenerPerfilUsuarioHandler)),
	).Methods("GET")
	apiRouter.Handle("/usuarios",
		middleware.RequireRole("admin", "atencion")(http.HandlerFunc(userHandler.ListarUsuarios)),
	).Methods("GET")
	apiRouter.Handle("/usuarios",
		middleware.RequireRole("admin", "atencion")(http.HandlerFunc(personasHandler.CrearPersonaConUsuarioHandler)),
	).Methods("POST")

	// ABMs Administrativos (Crear, Actualizar, Eliminar)

	// Planes
	apiRouter.Handle("/planes", middleware.RequireRole("admin")(http.HandlerFunc(planHandler.CrearPlan))).Methods("POST")
	apiRouter.Handle("/planes/{id}", middleware.RequireRole("admin")(http.HandlerFunc(planHandler.ActualizarPlan))).Methods("PATCH")
	apiRouter.Handle("/planes/{id}", middleware.RequireRole("admin")(http.HandlerFunc(planHandler.EliminarPlan))).Methods("DELETE")

	// Tipo Empresa
	apiRouter.Handle("/tipo-empresa", middleware.RequireRole("admin")(http.HandlerFunc(tipoEmpresaHandler.CrearTipoEmpresa))).Methods("POST")
	apiRouter.Handle("/tipo-empresa/{id}", middleware.RequireRole("admin")(http.HandlerFunc(tipoEmpresaHandler.ActualizarTipoEmpresa))).Methods("PATCH")
	apiRouter.Handle("/tipo-empresa/{id}", middleware.RequireRole("admin")(http.HandlerFunc(tipoEmpresaHandler.EliminarTipoEmpresa))).Methods("DELETE")

	// Tipo IVA
	apiRouter.Handle("/tipo-iva", middleware.RequireRole("admin")(http.HandlerFunc(tipoIvaHandler.CrearTipoIva))).Methods("POST")
	apiRouter.Handle("/tipo-iva/{id}", middleware.RequireRole("admin")(http.HandlerFunc(tipoIvaHandler.ActualizarTipoIva))).Methods("PATCH")
	apiRouter.Handle("/tipo-iva/{id}", middleware.RequireRole("admin")(http.HandlerFunc(tipoIvaHandler.EliminarTipoIva))).Methods("DELETE")

	// Estados Contrato
	apiRouter.Handle("/estados-contrato", middleware.RequireRole("admin")(http.HandlerFunc(estadoContratoHandler.CrearEstadoContrato))).Methods("POST")
	apiRouter.Handle("/estados-contrato/{id}", middleware.RequireRole("admin")(http.HandlerFunc(estadoContratoHandler.ActualizarEstadoContrato))).Methods("PATCH")
	apiRouter.Handle("/estados-contrato/{id}", middleware.RequireRole("admin")(http.HandlerFunc(estadoContratoHandler.EliminarEstadoContrato))).Methods("DELETE")

	// Estados Conexión
	apiRouter.Handle("/estados-conexion", middleware.RequireRole("admin")(http.HandlerFunc(estadoConexionHandler.CrearEstadoConexion))).Methods("POST")
	apiRouter.Handle("/estados-conexion/{id}", middleware.RequireRole("admin")(http.HandlerFunc(estadoConexionHandler.ActualizarEstadoConexion))).Methods("PATCH")
	apiRouter.Handle("/estados-conexion/{id}", middleware.RequireRole("admin")(http.HandlerFunc(estadoConexionHandler.EliminarEstadoConexion))).Methods("DELETE")

	// Cargos
	apiRouter.Handle("/cargos", middleware.RequireRole("admin")(http.HandlerFunc(cargoHandler.CrearCargo))).Methods("POST")
	apiRouter.Handle("/cargos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(cargoHandler.ActualizarCargo))).Methods("PATCH")
	apiRouter.Handle("/cargos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(cargoHandler.EliminarCargo))).Methods("DELETE")

	// Vínculos
	apiRouter.Handle("/vinculos", middleware.RequireRole("admin")(http.HandlerFunc(vinculoHandler.CrearVinculo))).Methods("POST")
	apiRouter.Handle("/vinculos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(vinculoHandler.ActualizarVinculo))).Methods("PATCH")
	apiRouter.Handle("/vinculos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(vinculoHandler.EliminarVinculo))).Methods("DELETE")

	// Direcciones
	direccionRouter := apiRouter.PathPrefix("/direcciones").Subrouter()
	direccionRouter.Use(middleware.RequireRole("admin"))
	direccionRouter.HandleFunc("", direccionHandler.ListarDirecciones).Methods("GET")
	direccionRouter.HandleFunc("/{id}", direccionHandler.ObtenerDireccionPorID).Methods("GET")
	direccionRouter.HandleFunc("", direccionHandler.CrearDireccion).Methods("POST")
	direccionRouter.HandleFunc("/{id}", direccionHandler.ActualizarDireccion).Methods("PATCH")
	direccionRouter.HandleFunc("/{id}", direccionHandler.EliminarDireccion).Methods("DELETE")
	// Roles y Permisos
	apiRouter.Handle("/roles", middleware.RequireRole("admin")(http.HandlerFunc(rolHandler.ListarRoles))).Methods("GET")
	apiRouter.Handle("/roles/{id}", middleware.RequireRole("admin")(http.HandlerFunc(rolHandler.ObtenerRolPorID))).Methods("GET")
	apiRouter.Handle("/roles", middleware.RequireRole("admin")(http.HandlerFunc(rolHandler.CrearRol))).Methods("POST")
	apiRouter.Handle("/roles/{id}", middleware.RequireRole("admin")(http.HandlerFunc(rolHandler.ActualizarRol))).Methods("PATCH")
	apiRouter.Handle("/roles/{id}", middleware.RequireRole("admin")(http.HandlerFunc(rolHandler.EliminarRol))).Methods("DELETE")
	apiRouter.Handle("/permisos", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.ListarPermisos))).Methods("GET")
	apiRouter.Handle("/permisos/inactivos", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.ListarPermisosInactivos))).Methods("GET")
	apiRouter.Handle("/permisos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.ObtenerPermisoPorID))).Methods("GET")
	apiRouter.Handle("/permisos", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.CrearPermiso))).Methods("POST")
	apiRouter.Handle("/permisos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.ActualizarPermiso))).Methods("PATCH")
	apiRouter.Handle("/permisos/{id}", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.EliminarPermiso))).Methods("DELETE")
	apiRouter.Handle("/permisos/{id}/reactivar", middleware.RequireRole("admin")(http.HandlerFunc(permisoHandler.ReactivarPermiso))).Methods("PUT")

	// Firma Digital de Contratos
	contratoFirmaHandler := handlers.NewContratoFirmaHandlerC(AuthService.GetModeloClient(), correoService)
	// Solo clientes pueden simular pago y firmar contratos
	apiRouter.HandleFunc("/simular-pago/{id_persona}/{id_contrato}", contratoFirmaHandler.SimularPago).Methods("POST")
	apiRouter.HandleFunc("/contrato-firma/{id}/firma", contratoFirmaHandler.GuardarFirma).Methods("POST")
	apiRouter.HandleFunc("/contrato-firma/{id}/validar-token", contratoFirmaHandler.ValidarToken).Methods("POST")
	apiRouter.HandleFunc("/contrato-firma/{id}/reenvio-token", contratoFirmaHandler.ReenviarToken).Methods("POST")
	apiRouter.HandleFunc("/contrato-firma/{id}", contratoFirmaHandler.ObtenerContrato).Methods("GET")
	apiRouter.HandleFunc("/contrato-firma/{id}/pdf", contratoFirmaHandler.ServirPDF).Methods("GET")
	apiRouter.HandleFunc("/contrato-firma/{id}/descargar", contratoFirmaHandler.DescargarPDF).Methods("GET")

	return r
}