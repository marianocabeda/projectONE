package modelos

// ContratoDetalle representa el detalle completo de un contrato para el perfil del cliente
type ContratoDetalle struct {
	IDContrato        int                   `json:"id_contrato"`
	Estado            string                `json:"estado"`
	FechaInicio       string                `json:"fecha_inicio"`
	FechaFin          *string               `json:"fecha_fin"`
	CostoInstalacion  *float64              `json:"costo_instalacion"`
	Plan              PlanContratoDetalle   `json:"plan"`
	ConexionAsociada  ConexionContratoDetalle `json:"conexion_asociada"`
}

// PlanContratoDetalle representa la info del plan en el contrato
type PlanContratoDetalle struct {
	IDPlan        int     `json:"id_plan"`
	Nombre        string  `json:"nombre"`
	VelocidadMbps int     `json:"velocidad_mbps"`
}

// ConexionContratoDetalle representa la info de la conexión en el contrato
type ConexionContratoDetalle struct {
	IDConexion           int                        `json:"id_conexion"`
	NroConexion          int                        `json:"nro_conexion"`
	DireccionInstalacion DireccionContratoDetalle   `json:"direccion_instalacion"`
}

// DireccionContratoDetalle representa la dirección de instalación
type DireccionContratoDetalle struct {
	Calle        string  `json:"calle"`
	Numero       string  `json:"numero"`
	Piso         *string `json:"piso"`
	Depto        *string `json:"depto"`
	Distrito     string  `json:"distrito"`
	Departamento string  `json:"departamento"`
	Provincia    string  `json:"provincia"`
}

// MisContratosResponse representa la respuesta paginada de contratos
type MisContratosResponse struct {
	Contratos  []ContratoDetalle `json:"contratos"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	Total      int               `json:"total"`
	TotalPages int               `json:"totalPages"`
}
