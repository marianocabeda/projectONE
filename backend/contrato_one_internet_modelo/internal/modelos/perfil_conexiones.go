package modelos

// ConexionDetalleCliente representa el detalle completo de una conexión para el perfil del cliente
type ConexionDetalleCliente struct {
	IDConexion       int                      `json:"id_conexion"`
	NroConexion      int                      `json:"nro_conexion"`
	TipoConexion     string                   `json:"tipo_conexion"`
	EstadoConexion   string                   `json:"estado_conexion"`
	FechaInstalacion string                   `json:"fecha_instalacion"`
	FechaBaja        *string                  `json:"fecha_baja"`
	Direccion        DireccionConexionDetalle `json:"direccion"`
	Latitud          float64                  `json:"latitud"`
	Longitud         float64                  `json:"longitud"`
	Plan             PlanConexionDetalle      `json:"plan"`
	IDContrato       *int                     `json:"id_contrato"`
	IDContratoFirma  *int                     `json:"id_contrato_firma"`
	ContratoFirmado  bool                     `json:"contrato_firmado"`
}

// DireccionConexionDetalle representa la dirección de una conexión
type DireccionConexionDetalle struct {
	Calle        string  `json:"calle"`
	Numero       string  `json:"numero"`
	Piso         *string `json:"piso"`
	Depto        *string `json:"depto"`
	Distrito     string  `json:"distrito"`
	Departamento string  `json:"departamento"`
	Provincia    string  `json:"provincia"`
}

// PlanConexionDetalle representa la info del plan en la conexión
type PlanConexionDetalle struct {
	IDPlan        int     `json:"id_plan"`
	Nombre        string  `json:"nombre"`
	VelocidadMbps int     `json:"velocidad_mbps"`
}

// MisConexionesResponse representa la respuesta paginada de conexiones
type MisConexionesResponse struct {
	Conexiones []ConexionDetalleCliente `json:"conexiones"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	Total      int                      `json:"total"`
	TotalPages int                      `json:"totalPages"`
}
