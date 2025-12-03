package modelos

// EstadoContrato representa un estado posible de un contrato
type EstadoContrato struct {
    IDEstadoContrato int     `json:"id_estado_contrato"`
    NombreEstado     string  `json:"nombre_estado"`
    Descripcion      *string `json:"descripcion,omitempty"`
}
