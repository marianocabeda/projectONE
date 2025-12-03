package servicios

import (
	"context"
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"fmt"
	"log"
	"net/http"
)

type GeografiaService struct {
	cliente *ModeloClient
}

func NewGeografiaService(cliente *ModeloClient) *GeografiaService {
	if cliente == nil {
		log.Fatal("ModeloClient no puede ser nil")
	}
	return &GeografiaService{
		cliente: cliente,
	}
}

func (s *GeografiaService) ObtenerProvincias(ctx context.Context) ([]modelos.Provincia, error) {
	var provincias []modelos.Provincia
	
	path := "/api/v1/internal/provincias"
	err := s.cliente.DoRequest(ctx, "GET", path, nil, &provincias, true)
	if err != nil {
		logger.Error.Printf("Error del servicio modelo: %v", err)
		return nil, fmt.Errorf("error comunicándose con el servicio modelo: %w", err)
	}
	return provincias, nil
}

func (s *GeografiaService) ObtenerDepartamentos(ctx context.Context, provinciaID int) ([]modelos.Departamento, error) {
	var departamentos []modelos.Departamento
	path := fmt.Sprintf("/api/v1/internal/departamentos?provincia_id=%d", provinciaID)

	err := s.cliente.DoRequest(ctx, "GET", path, nil, &departamentos, true)
	if err != nil {
		if modeloErr, ok := err.(*ModeloError); ok {
			if modeloErr.StatusCode == http.StatusNotFound {
				return nil, fmt.Errorf("no se encontraron departamentos para la provincia indicada")
			}
			logger.Error.Printf("Error del servicio modelo (%d): %s", modeloErr.StatusCode, modeloErr.Message)
			return nil, fmt.Errorf("error interno al consultar departamentos")
		}
		return nil, fmt.Errorf("error comunicándose con el servicio modelo: %w", err)
	}
	return departamentos, nil
}

func (s *GeografiaService) ObtenerDistritos(ctx context.Context, departamentoID int) ([]modelos.Distrito, error) {
	var distritos []modelos.Distrito
	path := fmt.Sprintf("/api/v1/internal/distritos?departamento_id=%d", departamentoID)

	err := s.cliente.DoRequest(ctx, "GET", path, nil, &distritos, true)
	if err != nil {
		if modeloErr, ok := err.(*ModeloError); ok {
			if modeloErr.StatusCode == http.StatusNotFound {
				return nil, fmt.Errorf("no se encontraron distritos para el departamento indicado")
			}
			logger.Error.Printf("Error del servicio modelo (%d): %s", modeloErr.StatusCode, modeloErr.Message)
			return nil, fmt.Errorf("error interno al consultar distritos")
		}
		return nil, fmt.Errorf("error comunicándose con el servicio modelo: %w", err)
	}
	return distritos, nil
}