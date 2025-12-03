package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type EstadoConexionService struct{
    client *ModeloClient
}

func NewEstadoConexionService(c *ModeloClient) *EstadoConexionService { return &EstadoConexionService{client: c} }

func (s *EstadoConexionService) ObtenerEstadosConexion(ctx context.Context) ([]modelos.EstadoConexion, error) {
    return s.client.GetEstadosConexion(ctx)
}

func (s *EstadoConexionService) ObtenerEstadoConexionPorID(ctx context.Context, id int) (*modelos.EstadoConexion, error) {
    return s.client.GetEstadoConexionByID(ctx, id)
}

func (s *EstadoConexionService) CrearEstadoConexion(ctx context.Context, payload interface{}) (int64, error) {
    return s.client.CreateEstadoConexion(ctx, payload)
}

func (s *EstadoConexionService) ActualizarEstadoConexion(ctx context.Context, id int, payload interface{}) error {
    return s.client.UpdateEstadoConexion(ctx, id, payload)
}

func (s *EstadoConexionService) EliminarEstadoConexion(ctx context.Context, id int) error {
    return s.client.DeleteEstadoConexion(ctx, id)
}
