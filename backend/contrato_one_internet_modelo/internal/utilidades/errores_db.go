package utilidades

import (
	"contrato_one_internet_modelo/internal/utilidades/logger"
	"errors"
	"fmt"
	"strings"

	"github.com/go-sql-driver/mysql"
)

// Detecta errores de MySQL por número de código
func isMySQLError(err error, codes ...uint16) bool {
    var mysqlErr *mysql.MySQLError
    if errors.As(err, &mysqlErr) {
        for _, code := range codes {
            if mysqlErr.Number == code {
                return true
            }
        }
    }
    return false
}

// Detecta si el error proviene de una violación de clave duplicada (Error 1062)
func IsDuplicateEntry(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1062) || strings.Contains(err.Error(), "Duplicate entry")
}

// Detecta si el error proviene de una violación de clave primaria duplicada (Error 1586)
func IsPrimaryKeyDuplicate(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1586) || (strings.Contains(err.Error(), "Duplicate entry") && strings.Contains(err.Error(), "PRIMARY"))
}

// Detecta si el error proviene de una violación de clave foránea (Error 1451, 1452, 1216, 1217)
func IsForeignKeyError(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1451, 1452, 1216, 1217) || strings.Contains(err.Error(), "foreign key constraint fails")
}

// Detecta si el error proviene de un campo NOT NULL vacío (Error 1048)
func IsNotNullViolation(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1048) || strings.Contains(err.Error(), "cannot be null")
}

// Detecta si el error proviene de una violación de restricción CHECK (Error 3819)
func IsCheckConstraintError(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 3819) || strings.Contains(err.Error(), "check constraint")
}

// Detecta si el error proviene de una truncación de datos (Error 1265)
func IsDataTruncationError(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1265) || strings.Contains(err.Error(), "Data truncated")
}

// Detecta si el error proviene de un dato demasiado largo para la columna (Error 1406)
func IsDataTooLongError(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1406) || strings.Contains(err.Error(), "Data too long for column")
}

// Detecta si el error proviene de un valor fuera de rango (Error 1264)
func IsOutOfRangeError(err error) bool {
    if err == nil {
        return false
    }
    return isMySQLError(err, 1264) || strings.Contains(err.Error(), "Out of range value")
}

// Detecta si el error proviene de un deadlock (Error 1213)
func IsDeadlockError(err error) bool {
	if err == nil {
		return false
	}
	return isMySQLError(err, 1213) || strings.Contains(err.Error(), "Deadlock found")
}

// Detecta si el error proviene de un timeout de bloqueo (Error 1205)
func IsLockTimeoutError(err error) bool {
	if err == nil {
		return false
	}
	return isMySQLError(err, 1205) || strings.Contains(err.Error(), "Lock wait timeout")
}

// IsCampoDuplicado verifica si el error es por duplicado en un campo específico.
func IsCampoDuplicado(err error, campo string) bool {
    if err == nil || !IsDuplicateEntry(err) {
        return false
    }
    msg := strings.ToLower(err.Error())
    campo = strings.ToLower(campo)
    return strings.Contains(msg, campo)
}

var duplicateFieldErrors = map[string]error{
    "email":        ErrEmailDuplicado,
    "cuil":         ErrCuilDuplicado,
    "cuit":         ErrCuitDuplicado,
    "telefono":     ErrTelefonoDuplicado,
    "nro_conexion": ErrNroConexionDuplicado,
}

// TraducirErrorBD mapea errores de la base de datos a errores semánticos definidos.
func TraducirErrorBD(err error) error {
    if err == nil {
        return nil
    }

    for campo, campoErr := range duplicateFieldErrors {
        if IsCampoDuplicado(err, campo) {
            return campoErr
        }
    }

    switch {
	case IsPrimaryKeyDuplicate(err):
        return ErrDuplicadoClavePrimaria
    case IsDuplicateEntry(err):
        return ErrDuplicado
    case IsForeignKeyError(err):
        return ErrViolacionClaveForanea
    case IsNotNullViolation(err):
        return ErrViolacionClaveNoNulo
    case IsCheckConstraintError(err):
        return ErrViolacionRestriccionCheck
    case IsDataTruncationError(err):
        return ErrViolacionTruncamientoDatos
    case IsDataTooLongError(err):
        return ErrLongitudExcedida
    case IsOutOfRangeError(err):
        return ErrValorFueraDeRango
	case IsDeadlockError(err), IsLockTimeoutError(err):
    return ErrOperacionConcurrente
    default:
		logger.Error.Printf("Error no traducido de base de datos: %v", err)
        return fmt.Errorf("error de base de datos: %w", err)
    }
}