package servicios

import (
	"context"
	"fmt"

	"contrato_one_internet_controlador/internal/modelos"
)

// ClientesService contiene la lógica de negocio para clientes.
type ClientesService struct {
	modeloClient *ModeloClient
}

// NewClientesService crea una nueva instancia de ClientesService.
func NewClientesService(mc *ModeloClient) *ClientesService {
	return &ClientesService{modeloClient: mc}
}

// CrearClienteParticular envía la solicitud al servicio Modelo para registrar un cliente particular.
func (s *ClientesService) CrearClienteParticular(ctx context.Context, persona modelos.Persona, direccion modelos.Direccion) (map[string]interface{}, error) {
	reqPayload := map[string]interface{}{
		"persona":   persona,
		"direccion": direccion,
	}

	var result map[string]interface{}

	err := s.modeloClient.DoRequest(ctx, "POST", "/api/v1/clientes/particulares", reqPayload, &result, true)
	if err != nil {
		return nil, fmt.Errorf("error creando cliente particular en Modelo: %w", err)
	}
	return result, nil
}

// CrearClienteEmpresa envía la solicitud al servicio Modelo para registrar un cliente empresa.
func (s *ClientesService) CrearClienteEmpresa(ctx context.Context, apoderado modelos.Persona, dirApoderado modelos.Direccion, empresa modelos.Empresa, dirEmpresa modelos.Direccion) (map[string]interface{}, error) {
	reqPayload := map[string]interface{}{
		"apoderado":           apoderado,
		"direccion_apoderado": dirApoderado,
		"empresa":             empresa,
		"direccion_empresa":   dirEmpresa,
	}

	var result map[string]interface{}

	err := s.modeloClient.DoRequest(ctx, "POST", "/api/v1/clientes/empresas", reqPayload, &result, true)
	if err != nil {
		return nil, fmt.Errorf("error creando cliente empresa en Modelo: %w", err)
	}
	return result, nil	
}
