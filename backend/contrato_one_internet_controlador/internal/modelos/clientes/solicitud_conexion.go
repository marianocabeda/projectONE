package clientes

import "contrato_one_internet_controlador/internal/modelos"

type SolicitudConexionRequest struct {
    IDPlan      int                `json:"id_plan"`
    IDDireccion *int               `json:"id_direccion,omitempty"`
    Direccion   *modelos.Direccion `json:"direccion,omitempty"`
    Latitud     float64            `json:"latitud"`
    Longitud    float64            `json:"longitud"`

    // --- Nuevos campos para flujo de Atención al Público ---
    IDPersonaCliente      *int    `json:"id_persona_cliente,omitempty"`     // Si un empleado lo pide para otro
    FactibilidadInmediata bool    `json:"factibilidad_inmediata,omitempty"` // Para saltar verificación
    NAP                   string  `json:"nap,omitempty"`                    // Requerido si es inmediata
    VLAN                  int     `json:"vlan,omitempty"`                   // Requerido si es inmediata
    Puerto                *int    `json:"puerto,omitempty"`                 // Opcional
    Observaciones         string  `json:"observaciones,omitempty"`
}

// SolicitudConexionResponse representa la respuesta al solicitar una conexión
type SolicitudConexionResponse struct {
	Mensaje     string `json:"mensaje"`
	IDConexion  int64  `json:"id_conexion"`
	NroConexion int    `json:"nro_conexion"`
	IDContrato  int64  `json:"id_contrato"`
}