package utilidades

import (
	"errors"
	"fmt"
)

// === Errores Estructurados ===

// ErrValidation para errores de campos específicos
type ErrValidation struct {
    Campo   string
    Mensaje string
}
func (e ErrValidation) Error() string {
    return fmt.Sprintf("error de validación en %s: %s", e.Campo, e.Mensaje)
}

// ErrNotFound para recursos no encontrados
type ErrNotFound struct {
	Entity string // Recurso o entidad (usuario, rol, empresa, etc.)
	Campo  string // Campo usado para buscar (ID, nombre, email, etc.)
	Valor  string // Valor buscado ("cliente", "123", etc.)
}

func (e ErrNotFound) Error() string {
	if e.Campo != "" && e.Valor != "" {
		return fmt.Sprintf("%s con %s '%s' no encontrado", e.Entity, e.Campo, e.Valor)
	}
	return fmt.Sprintf("%s no encontrado", e.Entity)
}


var (
	// === Errores de base de datos ===
	ErrViolacionClaveForanea   		= errors.New("violación de integridad referencial")
	ErrViolacionClaveNoNulo         = errors.New("campo obligatorio no puede ser nulo")
	ErrViolacionRestriccionCheck 	= errors.New("violación de restricción CHECK")
	ErrViolacionTruncamientoDatos 	= errors.New("dato demasiado largo o formato inválido")
	ErrValorFueraDeRango        	= errors.New("valor fuera de rango permitido")
	ErrLongitudExcedida         	= errors.New("longitud del dato excedida")
	ErrDuplicadoClavePrimaria      	= errors.New("clave primaria duplicada")
	ErrOperacionConcurrente         = errors.New("operación no pudo completarse debido a concurrencia")
	ErrDuplicado                	= errors.New("registro duplicado")

	// === Errores de campos duplicados específicos ===
	ErrEmailDuplicado           = errors.New("email duplicado")
	ErrCuilDuplicado            = errors.New("CUIL duplicado")
	ErrCuitDuplicado            = errors.New("CUIT duplicado")
	ErrTelefonoDuplicado        = errors.New("teléfono duplicado")
	ErrDniDuplicado             = errors.New("DNI duplicado")
	ErrNroConexionDuplicado     = errors.New("número de conexión duplicado")
	ErrPersonaVinculoEmpresaDuplicado = errors.New("vínculo persona-empresa duplicado")
	ErrTokenDuplicado           = errors.New("token duplicado")

	// === Errores de validación de datos ===
	ErrContrasenaObligatoria = errors.New("contraseña es obligatoria")
	ErrContrasenaCorta       = errors.New("contraseña inválida: debe tener al menos 8 caracteres")
	ErrContrasenaDebil       = errors.New("contraseña inválida: debe contener letras y números")
	ErrDatosInvalidos        = errors.New("datos inválidos")
	ErrValidacion            = errors.New("validación fallida")

	// === Errores de tokens y autenticación ===
	ErrEmailYaVerificado = errors.New("el email ya fue verificado")
	ErrTokenUsado        = errors.New("token ya fue usado")
	ErrTokenExpirado     = errors.New("token expirado")
	ErrTokenInvalido     = errors.New("token inválido")
	ErrTokenRequerido    = errors.New("token requerido")
	ErrTokenGeneracion   = errors.New("error al generar token de verificación")

	// === Errores de proceso ===
	ErrRolAsignacion = errors.New("no se pudo asignar el rol")

	// === Errores generales ===
	ErrNoEncontrado = errors.New("registro no encontrado")
	ErrInterno      = errors.New("error interno del servidor")
)