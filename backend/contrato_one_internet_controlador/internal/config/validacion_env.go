package config

import (
	"errors"
	"fmt"
)

func ValidarConfig(cfg Config) error {
	if cfg.APIPort == "" {
		return errors.New("API_PORT requerido")
	}
	if cfg.ModelURL == "" {
		return errors.New("MODEL_URL requerido")
	}
	if cfg.JWTSecret == "" {
		return errors.New("JWT_SECRET requerido")
	}
	if cfg.JWTExpiration <= 0 {
		return fmt.Errorf("JWT_EXPIRATION_HOURS debe ser mayor a 0 (actual: %s)", cfg.JWTExpiration)
	}
	if cfg.SMTPUser == "" {
		return errors.New("SMTP_USER requerido")
	}
	if cfg.SMTPPass == "" {
		return errors.New("SMTP_PASSWORD requerido")
	}
	if cfg.SMTPHost == "" {
		return errors.New("SMTP_HOST requerido")
	}
	if cfg.SMTPPort == "" {
		return errors.New("SMTP_PORT requerido")
	}
	return nil
}
