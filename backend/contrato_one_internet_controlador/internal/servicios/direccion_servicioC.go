package servicios

import (
	"context"
	"fmt"
	"net/url"
)

type DireccionService struct {
	ModeloClient *ModeloClient
}

func NewDireccionService(modeloClient *ModeloClient) *DireccionService {
	return &DireccionService{ModeloClient: modeloClient}
}

// ListarDirecciones obtiene direcciones activas con paginación y filtros desde el Modelo.
func (s *DireccionService) ListarDirecciones(ctx context.Context, page, limit, idDistrito int, calle, codigoPostal, numero, orden string) (map[string]interface{}, error) {
	// Construir query string
	path := fmt.Sprintf("/api/v1/internal/direcciones?page=%d&limit=%d", page, limit)
	if idDistrito > 0 {
		path += fmt.Sprintf("&id_distrito=%d", idDistrito)
	}
	if calle != "" {
		path += "&calle=" + url.QueryEscape(calle)
	}
	if codigoPostal != "" {
		path += "&codigo_postal=" + url.QueryEscape(codigoPostal)
	}
	if numero != "" {
		path += "&numero=" + url.QueryEscape(numero)
	}
	if orden != "" {
		path += "&orden=" + url.QueryEscape(orden)
	}

	var resp map[string]interface{}
	if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &resp, true); err != nil {
		return nil, err
	}
	return resp, nil
}

// ObtenerDireccionPorID obtiene una dirección específica por su ID desde el Modelo.
func (s *DireccionService) ObtenerDireccionPorID(ctx context.Context, id int) (map[string]interface{}, error) {
	var resp map[string]interface{}
	path := fmt.Sprintf("/api/v1/internal/direcciones/%d", id)
	if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &resp, true); err != nil {
		return nil, err
	}
	return resp, nil
}

// CrearDireccion crea una nueva dirección en el Modelo.
func (s *DireccionService) CrearDireccion(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := s.ModeloClient.DoRequest(ctx, "POST", "/api/v1/internal/direcciones", payload, &resp, true); err != nil {
		return 0, err
	}

	// Extraer id_direccion de la respuesta
	if idv, ok := resp["id_direccion"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

// ActualizarDireccion actualiza una dirección existente en el Modelo.
func (s *DireccionService) ActualizarDireccion(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/direcciones/%d", id)
	return s.ModeloClient.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

// BorrarDireccion ejecuta borrado lógico de una dirección en el Modelo.
func (s *DireccionService) BorrarDireccion(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/direcciones/%d", id)
	return s.ModeloClient.DoRequest(ctx, "DELETE", path, nil, nil, true)
}
