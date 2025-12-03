package main

import (
	"log"
	"net/http"
	"os"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/handlers/clientes"
	"contrato_one_internet_controlador/internal/handlers/geolocalizacion"
	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/rutas"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades/logger"

	"github.com/joho/godotenv"
)

func main() {
	// Cargar variables de entorno desde .env (para desarrollo local)
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró el archivo .env, usando variables de entorno del sistema.")
	}

	// Inicializar logger global
	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "desarrollo"
	}

	logger.Init(appEnv)
	logger.Info.Println("Logger inicializado correctamente")

	// Cargar configuración
	cfg := config.GetConfig()

	// Validar configuración
	if err := config.ValidarConfig(cfg); err != nil {
		logger.Error.Fatalf("Configuración inválida: %v", err)
	}

	// Crear el cliente para el servicio Modelo (se autentica al crearse)
	modeloClient, err := servicios.NewModeloClient(cfg.ModelURL)
	if err != nil {
		logger.Error.Fatalf("No se pudo inicializar el cliente del servicio modelo: %v", err)
	}

	logger.Info.Println("Cliente del servicio Modelo inicializado correctamente.")

	// Inyectar dependencias en servicios
	geografiaService := servicios.NewGeografiaService(modeloClient)
	clientesService := servicios.NewClientesService(modeloClient)
	authService := servicios.NewAuthService(modeloClient, &cfg) // <--- Crear AuthService
	conexionService := servicios.NewConexionService(modeloClient)

	// Inyectar servicios en handlers
	geografiaHandler := geolocalizacion.NewHandler(geografiaService)
	clientesHandler := clientes.NewClientesHandler(clientesService)
	//authHandler := auth.NewAuthHandler(authService) // <--- Crear AuthHandler
	conexionHandler := clientes.NewConexionHandler(conexionService)

	correoService := servicios.NewServicioCorreo(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUser,
		cfg.SMTPPass,
		cfg.FromEmail,
		cfg.FromName,
		cfg.EmailTemplatePath,
		cfg.EmailResetTemplatePath,
		cfg.EmailCredentialsTemplatePath,
		cfg.EmailTokenFirmaTemplatePath,
		//"mail-token-firma.html",
		cfg.LogoLightPath,
		cfg.LogoDarkPath,
	) // Servicios
	personaService := servicios.NewPersonaService(modeloClient, correoService)

	// Handlers
	personasHandler := clientes.NewPersonasHandler(personaService)

	// Configurar rutas y servidor HTTP, pasando todos los argumentos que espera SetupRutas
	r := rutas.SetupRutas(clientesHandler, geografiaHandler, authService, &cfg, personasHandler, conexionHandler)

	// Aplicar el middleware CORS
	handlerConCORS := middleware.CORS(r)

	logger.Info.Printf("Servidor Controlador escuchando en el puerto %s", cfg.APIPort)
	if err := http.ListenAndServe(":"+cfg.APIPort, handlerConCORS); err != nil {
		logger.Error.Fatalf("No se pudo iniciar el servidor: %v", err)
	}
}
