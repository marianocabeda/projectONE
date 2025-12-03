package modelos

// EstadoContrato represente un estado de contrato en el controlador (mirrors modelo)
type EstadoContrato struct {
    IDEstadoContrato int     `json:"id_estado_contrato"`
    NombreEstado     string  `json:"nombre_estado"`
    Descripcion      *string `json:"descripcion,omitempty"`
}
