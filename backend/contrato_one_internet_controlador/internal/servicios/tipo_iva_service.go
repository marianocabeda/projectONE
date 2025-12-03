package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type TipoIvaService struct {
    client *ModeloClient
}

func NewTipoIvaService(client *ModeloClient) *TipoIvaService { return &TipoIvaService{client: client} }

func (s *TipoIvaService) ObtenerTiposIva(ctx context.Context) ([]modelos.TipoIVA, error) {
    return s.client.GetTiposIVA(ctx)
}

func (s *TipoIvaService) ObtenerTipoIvaPorID(ctx context.Context, id int) (*modelos.TipoIVA, error) {
    return s.client.GetTipoIVAByID(ctx, id)
}

func (s *TipoIvaService) CrearTipoIva(ctx context.Context, payload interface{}) (int64, error) {
    return s.client.CreateTipoIVA(ctx, payload)
}

func (s *TipoIvaService) ActualizarTipoIva(ctx context.Context, id int, payload interface{}) error {
    return s.client.UpdateTipoIVA(ctx, id, payload)
}

func (s *TipoIvaService) EliminarTipoIva(ctx context.Context, id int) error {
    return s.client.DeleteTipoIVA(ctx, id)
}
