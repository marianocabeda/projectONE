package validadores

import (
	"errors"
	"regexp"
)

// Expresiones regulares pre-compiladas para eficiencia.
var (
	emailRegex    = regexp.MustCompile(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$`)
	telefonoRegex = regexp.MustCompile(`^\+?[0-9\s\(\)-]{7,20}$`) // Flexible para varios formatos
	//cuitRegex     = regexp.MustCompile(`^\d{2}-\d{8}-\d$`)
	cuilRegex     = regexp.MustCompile(`^\d{11}$`)
	//cuilRegex     = regexp.MustCompile(`^\d{2}-\d{8}-\d$`)
	cuitRegex     = regexp.MustCompile(`^\d{11}$`)
)

// ValidarEmail verifica si un string tiene un formato de email válido.
func ValidarEmail(email string) error {
	if !emailRegex.MatchString(email) {
		return errors.New("formato de email inválido")
	}
	return nil
}

// ValidarTelefono verifica si un string parece ser un número de teléfono válido.
func ValidarTelefono(telefono string) error {
	if !telefonoRegex.MatchString(telefono) {
		return errors.New("formato de teléfono inválido")
	}
	return nil
}


var (
	reMayuscula = regexp.MustCompile(`[A-Z]`)
	reMinuscula = regexp.MustCompile(`[a-z]`)
	reNumero    = regexp.MustCompile(`[0-9]`)
	reEspecial  = regexp.MustCompile(`[!@#\$%\^&\*\(\)_\+\-\=\[\]\{\}\\|;:'",<\.>\/\?]`)
)

// ValidarPassword aplica reglas de seguridad OWASP básicas
func ValidarPassword(pass string) error {
	if pass == "" {
		return errors.New("la contraseña es requerida")
	}
	if len(pass) < 8 {
		return errors.New("la contraseña debe tener al menos 8 caracteres")
	}
	if len(pass) > 72 {
		return errors.New("la contraseña no puede tener más de 72 caracteres")
	}
	if !reMayuscula.MatchString(pass) {
		return errors.New("la contraseña debe incluir al menos una letra mayúscula")
	}
	if !reMinuscula.MatchString(pass) {
		return errors.New("la contraseña debe incluir al menos una letra minúscula")
	}
	if !reNumero.MatchString(pass) {
		return errors.New("la contraseña debe incluir al menos un número")
	}
	if !reEspecial.MatchString(pass) {
		return errors.New("la contraseña debe incluir al menos un carácter especial")
	}
	if regexp.MustCompile(`\s`).MatchString(pass) {
		return errors.New("la contraseña no debe contener espacios")
	}
	return nil
}
