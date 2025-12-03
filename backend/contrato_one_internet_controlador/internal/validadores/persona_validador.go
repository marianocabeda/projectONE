package validadores

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades"
)

// ValidarPersona valida todos los campos del modelo Persona de forma exhaustiva.
func ValidarPersona(p modelos.Persona) error {
	var errores []string

	// ======== CAMPOS REQUERIDOS ========

	if strings.TrimSpace(p.Nombre) == "" {
		errores = append(errores, "el campo 'nombre' es requerido")
	} else if len(p.Nombre) > 100 {
		errores = append(errores, "el campo 'nombre' no debe exceder los 100 caracteres")
	}

	if strings.TrimSpace(p.Apellido) == "" {
		errores = append(errores, "el campo 'apellido' es requerido")
	} else if len(p.Apellido) > 100 {
		errores = append(errores, "el campo 'apellido' no debe exceder los 100 caracteres")
	}

	sexoNormalizado, err := NormalizarSexo(p.Sexo)
	if err != nil {
		errores = append(errores, err.Error())
	} else {
		p.Sexo = sexoNormalizado // Esto asegura que el valor se guarda tal como requiere el ENUM
	}

	if strings.TrimSpace(p.DNI) == "" {
		errores = append(errores, "el campo 'dni' es requerido")
	} else if !regexp.MustCompile(`^\d{7,8}$`).MatchString(p.DNI) {
		errores = append(errores, "el campo 'dni' debe contener solo números (7 u 8 dígitos)")
	}

	// Validar fecha de nacimiento y edad
	if strings.TrimSpace(p.FechaNacimiento) == "" {
		errores = append(errores, "el campo 'fecha_nacimiento' es requerido")
	} else {
		fecha, err := time.Parse("02-01-2006", p.FechaNacimiento) // DD-MM-YYYY
		if err != nil {
			errores = append(errores, "el campo 'fecha_nacimiento' tiene formato inválido (debe ser DD-MM-YYYY)")
		} else {
			hoy := time.Now()
			edad := hoy.Year() - fecha.Year()
			if hoy.YearDay() < fecha.YearDay() {
				edad--
			}
			if edad < 18 {
				errores = append(errores, "la persona debe ser mayor de 18 años")
			}
		}
	}

	/*if p.IDDireccion <= 0 {
		errores = append(errores, "el campo 'id_direccion' es requerido y debe ser mayor que 0")
	}*/

	if strings.TrimSpace(p.Telefono) == "" {
		errores = append(errores, "el campo 'telefono' es requerido")
	} else if err := ValidarTelefono(p.Telefono); err != nil {
		errores = append(errores, fmt.Sprintf("teléfono inválido: %v", err))
	}

	if strings.TrimSpace(p.Email) == "" {
		errores = append(errores, "el campo 'email' es requerido")
	} else if err := ValidarEmail(p.Email); err != nil {
		errores = append(errores, fmt.Sprintf("email inválido: %v", err))
	}

	// ======== CAMPOS OPCIONALES ========

	// CUIL (nullable, pero si existe no puede ser vacío)
	if p.Cuil != nil {
		if strings.TrimSpace(*p.Cuil) == "" {
			errores = append(errores, "el campo 'cuil' no puede estar vacío si se proporciona")
		} else if !cuilRegex.MatchString(*p.Cuil) {
			errores = append(errores, "el campo 'cuil' tiene formato inválido (debe ser 11 dígitos sin guiones)")
		}
	}

	// Teléfono alternativo (nullable)
	if p.TelefonoAlternativo != nil {
		if strings.TrimSpace(*p.TelefonoAlternativo) == "" {
			errores = append(errores, "el campo 'telefono_alternativo' no puede estar vacío si se proporciona")
		} else if err := ValidarTelefono(*p.TelefonoAlternativo); err != nil {
			errores = append(errores, fmt.Sprintf("teléfono alternativo inválido: %v", err))
		}
	}

	// Tipo de IVA (nullable, pero si existe debe ser > 0)
	if p.IDTipoIva != nil && *p.IDTipoIva <= 0 {
		errores = append(errores, "el campo 'id_tipo_iva' debe ser mayor que 0 si se proporciona")
	}

	// Usuario creador (nullable)
	if p.IDUsuarioCreador != nil && *p.IDUsuarioCreador <= 0 {
		errores = append(errores, "el campo 'id_usuario_creador' debe ser mayor que 0 si se proporciona")
	}

	// Área (nullable)
	if p.IDArea != nil && *p.IDArea <= 0 {
		errores = append(errores, "el campo 'id_area' debe ser mayor que 0 si se proporciona")
	}

	// Estado (nullable)
	if p.Estado != nil && (*p.Estado < 0 || *p.Estado > 3) {
		errores = append(errores, "el campo 'estado' debe ser 0, 1, 2 o 3 si se proporciona")
	}

	// CCT (nullable)
	if p.CCT != nil {
		if strings.TrimSpace(*p.CCT) == "" {
			errores = append(errores, "el campo 'cct' no puede estar vacío si se proporciona")
		} else if len(strings.TrimSpace(*p.CCT)) > 10 {
			errores = append(errores, "el campo 'cct' no debe exceder los 10 caracteres")
		}
	}

	// Observaciones (nullable)
	if p.Observaciones != nil {
		if strings.TrimSpace(*p.Observaciones) == "" {
			errores = append(errores, "el campo 'observaciones' no puede estar vacío si se proporciona")
		} else if len(strings.TrimSpace(*p.Observaciones)) > 300 {
			errores = append(errores, "el campo 'observaciones' no debe exceder los 300 caracteres")
		}
	}

	// ======== RESULTADO ========
	if len(errores) > 0 {
		return fmt.Errorf("errores de validación: %s: %w", strings.Join(errores, "; "), utilidades.ErrValidacion)
	}

	return nil
}

func NormalizarSexo(sexo string) (string, error) {
	s := strings.TrimSpace(sexo)
	if s == "" {
		return "", fmt.Errorf("el campo 'sexo' es requerido")
	}

	switch strings.ToLower(s) {
	case "masculino":
		return "Masculino", nil
	case "femenino":
		return "Femenino", nil
	case "otro":
		return "Otro", nil
	default:
		return "", fmt.Errorf("el campo 'sexo' debe ser 'Masculino', 'Femenino' u 'Otro'")
	}
}