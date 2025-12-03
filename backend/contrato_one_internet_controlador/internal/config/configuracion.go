package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	APIPort                  string
	ModelURL                 string
	JWTSecret                string
	JWTExpiration            time.Duration
	JWTExpirationMinutes     int // Valor en minutos para logs
	SMTPHost                 string
	SMTPPort                 string
	SMTPUser                 string
	SMTPPass                 string
	FromName                 string
	FromEmail                string
	FrontendURL              string
	BackendPublicURL         string
	EmailTemplatePath        string
	EmailResetTemplatePath   string // Plantilla para recuperación de contraseña
	EmailCredentialsTemplatePath string // Plantilla para envío de credenciales en registro asistido
	EmailTokenFirmaTemplatePath   string // Plantilla para envío de token de firma digital
	LogoLightPath            string
	LogoDarkPath             string
	FrontendPasswordResetURL string
}

func GetConfig() Config {
	jwtExpiration, jwtMinutes := getJWTExpirationConfig()

	return Config{
		APIPort:              getEnv("API_PORT", "8080"),
		ModelURL:             getEnv("MODEL_URL", "http://localhost:8081"),
		JWTSecret:            getEnv("JWT_SECRET", "default-secret"),
		JWTExpiration:        jwtExpiration,
		JWTExpirationMinutes: jwtMinutes,
		SMTPHost:             getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:             getEnv("SMTP_PORT", "587"),
		SMTPUser:             getEnv("SMTP_USER", ""),
		SMTPPass:             getEnv("SMTP_PASSWORD", ""),
		FromName:             getEnv("FROM_NAME", "ONE Internet"),
		FromEmail:            getEnv("FROM_EMAIL", ""),
		FrontendURL:          getEnv("FRONTEND_URL", ""),
		//FrontendURL:            frontendURL,
		BackendPublicURL:       getEnv("BACKEND_PUBLIC_URL", ""),
		EmailTemplatePath:      getEnv("EMAIL_TEMPLATE_PATH", "assets/mail_templates/mail.html"),
		EmailResetTemplatePath: getEnv("EMAIL_RESET_TEMPLATE_PATH", "assets/mail_templates/mail-recuperar.html"),
		EmailCredentialsTemplatePath: getEnv("EMAIL_CREDENCIALES_TEMPLATE_PATH", "assets/mail_templates/mail-credenciales.html"),
		EmailTokenFirmaTemplatePath: getEnv("EMAIL_TOKEN_FIRMA_TEMPLATE_PATH", "assets/mail_templates/mail-token-firma.html"),
		LogoLightPath:          getEnv("LOGO_LIGHT_PATH", "assets/logo-light.png"),
		LogoDarkPath:           getEnv("LOGO_DARK_PATH", "assets/logo-dark.png"),
		FrontendPasswordResetURL: getEnv("FRONTEND_PASSWORD_RESET_URL", ""),
		//FrontendPasswordResetURL: passwordResetURL,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// getJWTExpirationConfig lee la configuración de expiración JWT
// Prioriza JWT_EXPIRATION_MINUTES, luego JWT_EXPIRATION_HOURS
// Retorna (duration, minutos) para usar en logs
func getJWTExpirationConfig() (time.Duration, int) {
	// Prioridad 1: JWT_EXPIRATION_MINUTES
	if minutesStr, exists := os.LookupEnv("JWT_EXPIRATION_MINUTES"); exists {
		if minutes, err := strconv.Atoi(minutesStr); err == nil && minutes > 0 {
			return time.Duration(minutes) * time.Minute, minutes
		}
	}

	// Prioridad 2: JWT_EXPIRATION_HOURS
	if hoursStr, exists := os.LookupEnv("JWT_EXPIRATION_HOURS"); exists {
		if hours, err := strconv.Atoi(hoursStr); err == nil && hours > 0 {
			minutes := hours * 60
			return time.Duration(hours) * time.Hour, minutes
		}
	}

	// Valor por defecto: 60 minutos (1 hora)
	defaultMinutes := 60
	return time.Duration(defaultMinutes) * time.Minute, defaultMinutes
}
