package modelos

import "time"

// Contrato representa la tabla contrato en la base de datos
type Contrato struct {
	IDContrato         int        `json:"id_contrato"`
	IDPersona          int        `json:"id_persona"`
	IDVinculo          int        `json:"id_vinculo"`
	IDEmpresa          int        `json:"id_empresa"`
	IDConexion         int        `json:"id_conexion"`
	IDPlan             int        `json:"id_plan"`
	CostoInstalacion   *float64   `json:"costo_instalacion,omitempty"`
	FechaInicio        time.Time  `json:"fecha_inicio"`
	FechaFin           *time.Time `json:"fecha_fin,omitempty"`
	IDEstadoContrato   int        `json:"id_estado_contrato"`
	IDUsuarioCreador   *int       `json:"id_usuario_creador,omitempty"`
	Creado             time.Time  `json:"creado"`
	UltimoCambio       time.Time  `json:"ultimo_cambio"`
	Borrado            *time.Time `json:"borrado,omitempty"`
}
