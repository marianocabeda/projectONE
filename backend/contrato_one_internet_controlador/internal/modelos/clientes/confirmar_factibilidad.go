package clientes

// ConfirmarFactibilidadRequest representa la solicitud de confirmación de factibilidad
type ConfirmarFactibilidadRequest struct {
	IDConexion    int     `json:"id_conexion"`
	NAP           string  `json:"nap"`
	VLAN          int     `json:"vlan"`
	Puerto        *int    `json:"puerto,omitempty"`
	Observaciones *string `json:"observaciones,omitempty"`
}

// ConfirmarFactibilidadResponse representa la respuesta
type ConfirmarFactibilidadResponse struct {
	Mensaje     string `json:"mensaje"`
	IDConexion  int    `json:"id_conexion"`
}
