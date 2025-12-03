package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type EstadoContratoService struct {
    client *ModeloClient
}

func NewEstadoContratoService(client *ModeloClient) *EstadoContratoService { return &EstadoContratoService{client: client} }

func (s *EstadoContratoService) ObtenerEstadosContrato(ctx context.Context) ([]modelos.EstadoContrato, error) {
    return s.client.GetEstadosContrato(ctx)
}

func (s *EstadoContratoService) ObtenerEstadoContratoPorID(ctx context.Context, id int) (*modelos.EstadoContrato, error) {
    return s.client.GetEstadoContratoByID(ctx, id)
}

func (s *EstadoContratoService) CrearEstadoContrato(ctx context.Context, payload interface{}) (int64, error) {
    return s.client.CreateEstadoContrato(ctx, payload)
}

func (s *EstadoContratoService) ActualizarEstadoContrato(ctx context.Context, id int, payload interface{}) error {
    return s.client.UpdateEstadoContrato(ctx, id, payload)
}

func (s *EstadoContratoService) EliminarEstadoContrato(ctx context.Context, id int) error {
    return s.client.DeleteEstadoContrato(ctx, id)
}
