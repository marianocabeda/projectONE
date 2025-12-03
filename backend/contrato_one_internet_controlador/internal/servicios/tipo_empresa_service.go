package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type TipoEmpresaService struct {
    ModeloClient *ModeloClient
}

func NewTipoEmpresaService(mc *ModeloClient) *TipoEmpresaService { return &TipoEmpresaService{ModeloClient: mc} }

func (s *TipoEmpresaService) ObtenerTiposEmpresa(ctx context.Context) ([]modelos.TipoEmpresa, error) {
    return s.ModeloClient.GetTipoEmpresas(ctx)
}

func (s *TipoEmpresaService) ObtenerTipoEmpresaPorID(ctx context.Context, id int) (*modelos.TipoEmpresa, error) {
    return s.ModeloClient.GetTipoEmpresaByID(ctx, id)
}

func (s *TipoEmpresaService) CrearTipoEmpresa(ctx context.Context, payload interface{}) (int64, error) {
    return s.ModeloClient.CreateTipoEmpresa(ctx, payload)
}

func (s *TipoEmpresaService) ActualizarTipoEmpresa(ctx context.Context, id int, payload interface{}) error {
    return s.ModeloClient.UpdateTipoEmpresa(ctx, id, payload)
}

func (s *TipoEmpresaService) EliminarTipoEmpresa(ctx context.Context, id int) error {
    return s.ModeloClient.DeleteTipoEmpresa(ctx, id)
}
