package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type VinculoService struct {
    client *ModeloClient
}

func NewVinculoService(client *ModeloClient) *VinculoService { return &VinculoService{client: client} }

func (s *VinculoService) ObtenerVinculos(ctx context.Context) ([]modelos.Vinculo, error) {
    return s.client.GetVinculos(ctx)
}

func (s *VinculoService) ObtenerVinculoPorID(ctx context.Context, id int) (*modelos.Vinculo, error) {
    return s.client.GetVinculoByID(ctx, id)
}

func (s *VinculoService) CrearVinculo(ctx context.Context, payload interface{}) (int64, error) {
    return s.client.CreateVinculo(ctx, payload)
}

func (s *VinculoService) ActualizarVinculo(ctx context.Context, id int, payload interface{}) error {
    return s.client.UpdateVinculo(ctx, id, payload)
}

func (s *VinculoService) EliminarVinculo(ctx context.Context, id int) error {
    return s.client.DeleteVinculo(ctx, id)
}
