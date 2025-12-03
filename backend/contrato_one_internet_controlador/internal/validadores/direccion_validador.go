package validadores

import (
	"fmt"
	"regexp"
	"strings"

	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades"
)

// ValidarDireccion ejecuta todas las validaciones para el modelo Direccion
func ValidarDireccion(d modelos.Direccion) error {
	var errores []string

	// ======== CAMPOS REQUERIDOS ========

	// Calle
	calle := strings.TrimSpace(d.Calle)
	if calle == "" {
		errores = append(errores, "el campo 'calle' es requerido")
	} else if len(calle) > 100 {
		errores = append(errores, "el campo 'calle' no debe exceder los 100 caracteres")
	} else if !regexp.MustCompile(`^[A-Z0-9 .-]+$`).MatchString(calle) {
		errores = append(errores, "el campo 'calle' contiene caracteres inválidos")
	}

	// Número
	numero := strings.TrimSpace(d.Numero)
	if numero == "" {
		errores = append(errores, "el campo 'numero' es requerido")
	} else if len(numero) > 10 {
		errores = append(errores, "el campo 'numero' no debe exceder los 10 caracteres")
	} else if !regexp.MustCompile(`^[A-Z0-9/-]+$`).MatchString(numero) {
		errores = append(errores, "el campo 'numero' solo puede contener números, letras, '-' o '/'")
	}

	// Código Postal
	cp := strings.TrimSpace(d.CodigoPostal)
	if cp == "" {
		errores = append(errores, "el campo 'codigo_postal' es requerido")
	} else if len(cp) < 4 || len(cp) > 10 {
		errores = append(errores, "el campo 'codigo_postal' debe tener entre 4 y 10 caracteres")
	} else if !regexp.MustCompile(`^[A-Z0-9]+$`).MatchString(cp) {
		errores = append(errores, "el campo 'codigo_postal' solo puede contener letras y números")
	}

	// Distrito
	if d.IDDistrito <= 0 {
		errores = append(errores, "el campo 'id_distrito' es requerido y debe ser mayor que 0")
	}

	// ======== CAMPOS OPCIONALES ========

	validateOptional := func(fieldName string, val *string) {
	if val != nil {
		v := strings.TrimSpace(*val)

		// No puede estar vacío si se proporciona
		if v == "" {
			errores = append(errores, fmt.Sprintf("el campo '%s' no puede estar vacío si se proporciona", fieldName))
			return
		}

		// Longitud máxima
		if len(v) > 10 {
			errores = append(errores, fmt.Sprintf("el campo '%s' no debe exceder los 10 caracteres", fieldName))
		}

		// Solo caracteres válidos
		if !regexp.MustCompile(`^[A-Z0-9]+$`).MatchString(v) {
			errores = append(errores, fmt.Sprintf("el campo '%s' solo puede contener letras o números", fieldName))
		}
	}
}

	validateOptional("piso", d.Piso)
	validateOptional("depto", d.Depto)

	// ======== RESULTADO ========

	if len(errores) > 0 {
		return fmt.Errorf("errores de validación en dirección: %s: %w", strings.Join(errores, "; "), utilidades.ErrValidacion)
	}

	return nil
}
