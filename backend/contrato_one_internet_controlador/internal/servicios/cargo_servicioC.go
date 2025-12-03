package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type CargoService struct{
    client *ModeloClient
}

func NewCargoService(c *ModeloClient) *CargoService { return &CargoService{client: c} }

func (s *CargoService) ObtenerCargos(ctx context.Context) ([]modelos.Cargo, error) { return s.client.GetCargos(ctx) }
func (s *CargoService) ObtenerCargoPorID(ctx context.Context, id int) (*modelos.Cargo, error) { return s.client.GetCargoByID(ctx, id) }
func (s *CargoService) CrearCargo(ctx context.Context, payload interface{}) (int64, error) { return s.client.CreateCargo(ctx, payload) }
func (s *CargoService) ActualizarCargo(ctx context.Context, id int, payload interface{}) error { return s.client.UpdateCargo(ctx, id, payload) }
func (s *CargoService) EliminarCargo(ctx context.Context, id int) error { return s.client.DeleteCargo(ctx, id) }