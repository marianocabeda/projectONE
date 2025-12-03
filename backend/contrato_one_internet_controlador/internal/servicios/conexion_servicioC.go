package servicios

import (
	"context"
	"fmt"

	clientesModelos "contrato_one_internet_controlador/internal/modelos/clientes"
	"contrato_one_internet_controlador/internal/modelos"
)

type ConexionService struct {
	modeloClient *ModeloClient
}

func NewConexionService(modeloClient *ModeloClient) *ConexionService {
	return &ConexionService{
		modeloClient: modeloClient,
	}
}

// SolicitudConexionInternaRequest representa la solicitud que se envía al servicio modelo
type SolicitudConexionInternaRequest struct {
	IDUsuario   		int		`json:"id_usuario"`
	IDPersonaCliente 	*int   	`json:"id_persona_cliente,omitempty"`

	IDPlan      		int  	`json:"id_plan"`
	IDDireccion 		*int   	`json:"id_direccion,omitempty"`
	Direccion   		*modelos.Direccion	`json:"direccion,omitempty"`
	Latitud     		float64	`json:"latitud"`
	Longitud     		float64	`json:"longitud"`

	// Datos Factibilidad Inmediata
    FactibilidadInmediata bool    `json:"factibilidad_inmediata"`
    NAP                   string  `json:"nap,omitempty"`
    VLAN                  int     `json:"vlan,omitempty"`
    Puerto                *int    `json:"puerto,omitempty"`
    Observaciones         string  `json:"observaciones,omitempty"`
}

// SolicitarConexionParticular envía la solicitud de conexión al servicio modelo
func (s *ConexionService) SolicitarConexionParticular(
	ctx context.Context,
	req *clientesModelos.SolicitudConexionRequest,
	idUsuario int,
) (*clientesModelos.SolicitudConexionResponse, error) {
	// Construir la solicitud interna con el id_usuario
	internalReq := SolicitudConexionInternaRequest{
		IDUsuario:   idUsuario,
		IDPersonaCliente: req.IDPersonaCliente, // pasar el id_persona_cliente si existe

		IDPlan:      req.IDPlan,
		IDDireccion: req.IDDireccion,
		Direccion:   req.Direccion,
		Latitud:     req.Latitud,
		Longitud:    req.Longitud,

		FactibilidadInmediata: req.FactibilidadInmediata,
		NAP:                   req.NAP,
		VLAN:                  req.VLAN,
		Puerto:                req.Puerto,
		Observaciones:         req.Observaciones,
	}

	// Realizar la solicitud al modelo
	var response clientesModelos.SolicitudConexionResponse
	err := s.modeloClient.DoRequest(
		ctx,
		"POST",
		"/api/v1/internal/solicitar-conexion-particular",
		internalReq,
		&response,
		true,
	)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// ObtenerSolicitudesPendientes obtiene solicitudes pendientes con filtros y paginación
func (s *ConexionService) ObtenerSolicitudesPendientes(
	ctx context.Context,
	queryParams map[string]string,
) (interface{}, error) {
	// Construir URL con query parameters
	url := "/api/v1/internal/revisacion/solicitudes-pendientes?"
	first := true
	for key, value := range queryParams {
		if value != "" {
			if !first {
				url += "&"
			}
			url += key + "=" + value
			first = false
		}
	}

	var response interface{}
	err := s.modeloClient.DoRequest(ctx, "GET", url, nil, &response, true)
	if err != nil {
		return nil, err
	}

	return response, nil
}

// ObtenerDetalleSolicitud obtiene el detalle completo de una solicitud específica
func (s *ConexionService) ObtenerDetalleSolicitud(
	ctx context.Context,
	idConexion int,
) (*clientesModelos.DetalleSolicitudResponse, error) {
	var response clientesModelos.DetalleSolicitudResponse
	
	url := fmt.Sprintf("/api/v1/internal/revisacion/solicitud/%d", idConexion)
	
	err := s.modeloClient.DoRequest(ctx, "GET", url, nil, &response, true)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// ConfirmarFactibilidad confirma la factibilidad de una conexión
func (s *ConexionService) ConfirmarFactibilidad(
	ctx context.Context,
	req *clientesModelos.ConfirmarFactibilidadRequest,
) (*clientesModelos.ConfirmarFactibilidadResponse, error) {
	var response clientesModelos.ConfirmarFactibilidadResponse
	
	url := "/api/v1/internal/revisacion/confirmar-factibilidad"
	
	err := s.modeloClient.DoRequest(ctx, "POST", url, req, &response, true)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// RechazarFactibilidad rechaza la factibilidad de una conexión
func (s *ConexionService) RechazarFactibilidad(
	ctx context.Context,
	req *clientesModelos.RechazarFactibilidadRequest,
) (*clientesModelos.RechazarFactibilidadResponse, error) {
	var response clientesModelos.RechazarFactibilidadResponse
	
	url := "/api/v1/internal/revisacion/rechazar-factibilidad"
	
	err := s.modeloClient.DoRequest(ctx, "POST", url, req, &response, true)
	if err != nil {
		return nil, err
	}

	return &response, nil
}
