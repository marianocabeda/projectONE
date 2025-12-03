package utilidades

import (
	"database/sql/driver"
	"fmt"
	"time"
)

// Fecha representa un time.Time que se serializa/deserializa como "DD-MM-YYYY"
type Fecha time.Time

const formatoFecha = "02-01-2006" // DD-MM-YYYY

// UnmarshalJSON convierte un string JSON en Fecha (por ejemplo: "15-07-1985")
func (f *Fecha) UnmarshalJSON(b []byte) error {
	s := string(b)
	if len(s) < 2 {
		return fmt.Errorf("fecha vacía")
	}
	// Quitar las comillas del string JSON
	s = s[1 : len(s)-1]
	
	// Cargar zona horaria de Argentina
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		// Fallback a Local si no se puede cargar la zona horaria
		loc = time.Local
	}
	
	// Parsear fecha en zona horaria local (mediodía para evitar cambios de día)
	t, err := time.ParseInLocation(formatoFecha, s, loc)
	if err != nil {
		return err
	}
	// Ajustar a mediodía (12:00:00) para evitar problemas de zona horaria
	t = time.Date(t.Year(), t.Month(), t.Day(), 12, 0, 0, 0, loc)
	
	*f = Fecha(t)
	return nil
}

// MarshalJSON convierte Fecha en string JSON (por ejemplo: "15-07-1985")
func (f Fecha) MarshalJSON() ([]byte, error) {
	s := fmt.Sprintf("\"%s\"", time.Time(f).Format(formatoFecha))
	return []byte(s), nil
}

// Time devuelve el valor como time.Time nativo
func (f Fecha) Time() time.Time {
	return time.Time(f)
}

// Value implementa la interfaz driver.Valuer para permitir guardar Fecha en la base de datos
func (f Fecha) Value() (driver.Value, error) {
	if time.Time(f).IsZero() {
		return nil, nil
	}
	return time.Time(f), nil
}

// Scan implementa la interfaz sql.Scanner para leer el valor desde la base de datos
func (f *Fecha) Scan(value interface{}) error {
	if value == nil {
		*f = Fecha(time.Time{})
		return nil
	}

	// Cargar zona horaria de Argentina
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		loc = time.Local
	}

	switch v := value.(type) {
	case time.Time:
		// Asegurar que la fecha esté en la zona horaria correcta
		*f = Fecha(v.In(loc))
		return nil
	case []byte:
		t, err := time.ParseInLocation(formatoFecha, string(v), loc)
		if err != nil {
			return err
		}
		*f = Fecha(t)
		return nil
	case string:
		t, err := time.ParseInLocation(formatoFecha, v, loc)
		if err != nil {
			return err
		}
		*f = Fecha(t)
		return nil
	default:
		return fmt.Errorf("tipo inesperado para Fecha: %T", value)
	}
}