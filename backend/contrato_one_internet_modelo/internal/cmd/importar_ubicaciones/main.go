package main

import (
    "os"
    "contrato_one_internet_modelo/internal/config"
    "contrato_one_internet_modelo/internal/database"
    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades/logger"

    "github.com/joho/godotenv"
)

func main() {

    // Indicar modo importación
    os.Setenv("APP_ENV", "import")

    // Cargar el archivo .env MANUALMENTE
    // siempre desde la raíz del proyecto
    err := godotenv.Overload("../../../.env")
    if err != nil {
        panic("❌ No se pudo cargar el archivo .env: " + err.Error())
    }

    // Inicializar logger
    logger.Init("desarrollo")

    // Cargar configuración ahora sí usando .env
    appCfg, err := config.LoadConfig()
    if err != nil {
        logger.Error.Fatalf("Error al cargar config: %v", err)
    }

    // Conectar a DB
    db := database.ConnectDB(appCfg.DBConfig)

    // Importar JSON
    err = servicios.ImportarUbicaciones(db,
		"../../data/provincias.json",
		"../../data/departamentos.json",
		"../../data/localidades.json",
	)

    if err != nil {
        logger.Error.Fatalf("Error en importación: %v", err)
    }

    logger.Info.Println("✔ Importación completada exitosamente.")
}