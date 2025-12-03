package modelos

// RechazarFactibilidadRequest representa la solicitud de rechazo de factibilidad
type RechazarFactibilidadRequest struct {
	IDConexion int     `json:"id_conexion"`
	Motivo     *string `json:"motivo,omitempty"`
}

// RechazarFactibilidadResponse representa la respuesta
type RechazarFactibilidadResponse struct {
	Mensaje    string `json:"mensaje"`
	IDConexion int    `json:"id_conexion"`
}
