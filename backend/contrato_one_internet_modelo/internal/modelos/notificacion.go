package modelos

import "time"

// Notificacion representa una notificación del sistema
type Notificacion struct {
	IDNotificacion int        `json:"id_notificacion"`
	Tipo           string     `json:"tipo"`
	Titulo         string     `json:"titulo"`
	Mensaje        string     `json:"mensaje"`
	Leido          int        `json:"leido"`
	RolDestino     *string    `json:"rol_destino"`
	IDConexion     *int       `json:"id_conexion"`
	IDContrato     *int       `json:"id_contrato"`
	IDPago         *int       `json:"id_pago"`
	Observacion    *string    `json:"observacion,omitempty"` // Detalle técnico/operativo interno opcional
	Creado         time.Time  `json:"creado"`
}

// NotificacionesResponse representa la respuesta paginada de notificaciones
type NotificacionesResponse struct {
	Notificaciones []Notificacion `json:"notificaciones"`
	Page           int            `json:"page"`
	Limit          int            `json:"limit"`
	Total          int            `json:"total"`
	TotalPages     int            `json:"totalPages"`
}
