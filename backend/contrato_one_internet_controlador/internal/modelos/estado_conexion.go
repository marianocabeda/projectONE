package modelos

// EstadoConexion representa un estado de conexión (mirrors modelo)
type EstadoConexion struct {
    IDEstadoConexion int     `json:"id_estado_conexion"`
    Nombre           string  `json:"nombre"`
    Descripcion      *string `json:"descripcion,omitempty"`
}
