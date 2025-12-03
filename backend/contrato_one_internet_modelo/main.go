package main

import (
	"net/http"
	"os"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"

	"contrato_one_internet_modelo/internal/config"
	"contrato_one_internet_modelo/internal/database"
	"contrato_one_internet_modelo/internal/rutas"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

func main() {
	// Detectar entorno actual
	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "desarrollo" // valor por defecto
	}

	// Cargar el archivo .env según el entorno
	envFile := ".env"
	if appEnv == "produccion" {
		envFile = ".env.produccion"
	}

	if err := godotenv.Overload(envFile); err != nil {
		log.Printf("⚠️ No se pudo cargar %s: %v", envFile, err)
	}

	// Inicializar logger
	logger.Init(appEnv)

	logger.Info.Printf("✅ Entorno: %s, usando archivo %s", appEnv, envFile)

	// Cargar configuración
	appCfg, err := config.LoadConfig()
	if err != nil {
		logger.Error.Fatalf("Error fatal al cargar configuración: %v", err)
	}

	// Conectar a la base de datos
	db := database.ConnectDB(appCfg.DBConfig)

	// Configurar rutas
	router := rutas.SetupRutas(db, appCfg)

	// Configurar servidor
	server := &http.Server{
		Addr:         ":" + appCfg.ServerPort,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	logger.Info.Printf("🚀 Servidor iniciado en puerto %s (entorno: %s)", appCfg.ServerPort, appEnv)

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error.Fatalf("No se pudo iniciar el servidor: %v", err)
	}
}