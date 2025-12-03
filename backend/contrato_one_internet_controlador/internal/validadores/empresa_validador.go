package validadores

import (
	"fmt"
	"strings"

	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades"
)

// ValidarEmpresa valida todos los campos del modelo Empresa
func ValidarEmpresa(e modelos.Empresa) error {
	var errores []string

	// ======== CAMPOS REQUERIDOS ========

	if strings.TrimSpace(e.NombreComercial) == "" {
		errores = append(errores, "el campo 'nombre_comercial' es requerido")
	} else if len(e.NombreComercial) > 150 {
		errores = append(errores, "el campo 'nombre_comercial' no debe exceder los 150 caracteres")
	}

	if strings.TrimSpace(e.RazonSocial) == "" {
		errores = append(errores, "el campo 'razon_social' es requerido")
	} else if len(e.RazonSocial) > 150 {
		errores = append(errores, "el campo 'razon_social' no debe exceder los 150 caracteres")
	}

	if strings.TrimSpace(e.Cuit) == "" {
		errores = append(errores, "el campo 'cuit' es requerido")
	} else if !cuitRegex.MatchString(e.Cuit) {
		errores = append(errores, "el campo 'cuit' debe contener 11 dígitos sin guiones")
	}

	if e.IDTipoEmpresa <= 0 {
		errores = append(errores, "el campo 'id_tipo_empresa' es requerido y debe ser mayor que 0")
	}

	if e.IDDireccion <= 0 {
		errores = append(errores, "el campo 'id_direccion' es requerido y debe ser mayor que 0")
	}

	if strings.TrimSpace(e.Telefono) == "" {
		errores = append(errores, "el campo 'telefono' es requerido")
	} else if err := ValidarTelefono(e.Telefono); err != nil {
		errores = append(errores, fmt.Sprintf("teléfono inválido: %v", err))
	}

	if strings.TrimSpace(e.Email) == "" {
		errores = append(errores, "el campo 'email' es requerido")
	} else if err := ValidarEmail(e.Email); err != nil {
		errores = append(errores, fmt.Sprintf("email inválido: %v", err))
	}

	// ======== CAMPOS OPCIONALES ========

	if err := CampoOpcionalValido("telefono_alternativo", e.TelefonoAlternativo, ValidarTelefono); err != nil {
		errores = append(errores, err.Error())
	}

	if err := CampoOpcionalValido("distrito_nombre", e.DistritoNombre, nil); err != nil {
		errores = append(errores, err.Error())
	}

	if err := CampoOpcionalValido("departamento_nombre", e.DepartamentoNombre, nil); err != nil {
		errores = append(errores, err.Error())
	}

	if err := CampoOpcionalValido("provincia_nombre", e.ProvinciaNombre, nil); err != nil {
		errores = append(errores, err.Error())
	}

	if e.IDTipoIva != nil && *e.IDTipoIva <= 0 {
		errores = append(errores, "el campo 'id_tipo_iva' debe ser mayor que 0 si se proporciona")
	}

	if e.IDUsuarioCreador != nil && *e.IDUsuarioCreador <= 0 {
		errores = append(errores, "el campo 'id_usuario_creador' debe ser mayor que 0 si se proporciona")
	}

	// ======== RESULTADO ========

	if len(errores) > 0 {
		return fmt.Errorf("errores de validación: %s: %w", strings.Join(errores, "; "), utilidades.ErrValidacion)
	}

	return nil
}

// CampoOpcionalValido valida campos opcionales (pueden ser nil, pero no vacíos si existen)
func CampoOpcionalValido(nombre string, valor *string, validar func(string) error) error {
	if valor == nil {
		return nil // no se envió, está bien
	}
	if strings.TrimSpace(*valor) == "" {
		return fmt.Errorf("el campo '%s' no puede estar vacío si se proporciona", nombre)
	}
	if validar != nil {
		if err := validar(*valor); err != nil {
			return fmt.Errorf("%s inválido: %v", nombre, err)
		}
	}
	return nil
}
