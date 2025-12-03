package validadores

import (
	"errors"
	"strings"

	"contrato_one_internet_controlador/internal/modelos"
)

// ValidarLogin valida la solicitud de login.
func ValidarLogin(req *modelos.LoginRequest) error {
	if strings.TrimSpace(req.Email) == "" {
		return errors.New("el email es requerido")
	}

	if err := ValidarEmail(req.Email); err != nil {
		return err
	}

	if strings.TrimSpace(req.Password) == "" {
		return errors.New("la contraseña es requerida")
	}

	return nil
}
