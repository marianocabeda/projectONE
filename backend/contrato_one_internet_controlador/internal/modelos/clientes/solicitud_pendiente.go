package clientes

import "time"

// SolicitudPendiente representa una solicitud de conexión pendiente de revisión
type SolicitudPendiente struct {
	IDConexion     int       `json:"id_conexion"`
	NroConexion    int       `json:"nro_conexion"`
	Cliente        string    `json:"cliente"`
	Direccion      string    `json:"direccion"`
	Latitud        float64   `json:"latitud"`
	Longitud       float64   `json:"longitud"`
	Plan           string    `json:"plan"`
	FechaSolicitud time.Time `json:"fecha_solicitud"`
}
