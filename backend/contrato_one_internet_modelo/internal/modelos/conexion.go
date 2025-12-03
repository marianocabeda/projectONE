package modelos

import "time"

// Conexion representa la tabla conexion en la base de datos
type Conexion struct {
	IDConexion         int       `json:"id_conexion"`
	NroConexion        int       `json:"nro_conexion"`
	IDPersona          int       `json:"id_persona"`
	IDInstalador       *int      `json:"id_instalador,omitempty"`
	IDPlan             int       `json:"id_plan"`
	IDDireccion        int       `json:"id_direccion"`
	DistritoNombre     string    `json:"distrito_nombre"`
	DepartamentoNombre string    `json:"departamento_nombre"`
	ProvinciaNombre    string    `json:"provincia_nombre"`
	Latitud            float64   `json:"latitud"`
	Longitud           float64   `json:"longitud"`
	TipoConexion       string    `json:"tipo_conexion"`
	IDEstadoConexion   int       `json:"id_estado_conexion"`
	FechaInstalacion   time.Time `json:"fecha_instalacion"`
	FechaBaja          *time.Time `json:"fecha_baja,omitempty"`
	Observaciones      string   `json:"observaciones,omitempty"`
	IDUsuarioCreador   *int      `json:"id_usuario_creador,omitempty"`
	VlanA              *int      `json:"vlan_a,omitempty"`
	DetalleNodo       *string   `json:"detalle_nodo,omitempty"`
	PuertoOLT         *int      `json:"puerto_olt,omitempty"`
	Creado             time.Time `json:"creado"`
	UltimoCambio       time.Time `json:"ultimo_cambio"`
	Borrado            *time.Time `json:"borrado,omitempty"`
}
