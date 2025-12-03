package config

import (
	"errors"
    "os"
	"strconv"
	"time"
)

// AppConfig contiene toda la configuración de la aplicación.
type AppConfig struct {
	DBConfig
	ServerPort        string
	InternalJWTSecret string
	AppEnv            string
	RefreshTokenDuration  time.Duration 
}

// DBConfig contiene los parámetros de conexión para la base de datos.
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// LoadConfig lee las variables de entorno, las valida y devuelve una estructura AppConfig.
func LoadConfig() (AppConfig, error) {
	cfg := AppConfig{
		DBConfig: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", ""), 
			DBName:   getEnv("DB_NAME", "contratos_one_internet"),
		},
		ServerPort:        getEnv("SERVER_PORT", "8081"),
		InternalJWTSecret: getEnv("INTERNAL_JWT_SECRET", ""), // Dejar vacío por defecto para forzar su configuración
		AppEnv:            getEnv("APP_ENV", "desarrollo"),
		RefreshTokenDuration: time.Duration(getEnvInt("REFRESH_TOKEN_DAYS", 30)) * 24 * time.Hour, 
	}

	// Validar campos obligatorios
	if cfg.DBConfig.Host == "" {
		return cfg, errors.New("DB_HOST no puede estar vacío")
	}
	if cfg.DBConfig.Port == "" {
		return cfg, errors.New("DB_PORT no puede estar vacío")
	}
	if cfg.DBConfig.User == "" {
		return cfg, errors.New("DB_USER no puede estar vacío")
	}
	if cfg.DBConfig.DBName == "" {
		return cfg, errors.New("DB_NAME no puede estar vacío")
	}
	// No exigir JWT si se está ejecutando en modo "import"
	if cfg.AppEnv != "import" && cfg.InternalJWTSecret == "" {
		return cfg, errors.New("INTERNAL_JWT_SECRET no puede estar vacío")
	}

	return cfg, nil
}


// getEnv devuelve el valor de la variable de entorno o un valor por defecto si no existe.
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// getEnvInt obtiene una variable de entorno como entero, con valor por defecto.
func getEnvInt(key string, fallback int) int {
	if value, ok := os.LookupEnv(key); ok {
		v, err := strconv.Atoi(value)
		if err == nil {
			return v
		}
	}
	return fallback
}