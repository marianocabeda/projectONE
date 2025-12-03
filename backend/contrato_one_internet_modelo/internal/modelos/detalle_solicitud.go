package modelos

import "time"

// DetalleSolicitud representa el detalle completo de una solicitud de conexión
type DetalleSolicitud struct {
	Conexion  ConexionDetalle  `json:"conexion"`
	Direccion DireccionDetalle `json:"direccion"`
	Cliente   ClienteDetalle   `json:"cliente"`
	Plan      PlanDetalle      `json:"plan"`
	Estado    string           `json:"estado"`
}

// ConexionDetalle representa los datos de la conexión
type ConexionDetalle struct {
	IDConexion      int       `json:"id_conexion"`
	NroConexion     int       `json:"nro_conexion"`
	Latitud         float64   `json:"latitud"`
	Longitud        float64   `json:"longitud"`
	Distrito        string    `json:"distrito"`
	Departamento    string    `json:"departamento"`
	Provincia       string    `json:"provincia"`
	FechaSolicitud  time.Time `json:"fecha_solicitud"`
}

// DireccionDetalle representa los datos de la dirección
type DireccionDetalle struct {
	Calle        string  `json:"calle"`
	Numero       string  `json:"numero"`
	CodigoPostal string  `json:"codigo_postal"`
	Piso         *string `json:"piso"`
	Depto        *string `json:"depto"`
}

// ClienteDetalle representa los datos del cliente
type ClienteDetalle struct {
	IDPersona int    `json:"id_persona"`
	Nombre    string `json:"nombre"`
	Apellido  string `json:"apellido"`
	DNI       string `json:"dni"`
	Telefono  string `json:"telefono"`
	Email     string `json:"email"`
}

// PlanDetalle representa los datos del plan
type PlanDetalle struct {
	IDPlan        int    `json:"id_plan"`
	Nombre        string `json:"nombre"`
	VelocidadMbps int    `json:"velocidad_mbps"`
}
