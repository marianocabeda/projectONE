package servicios

import (
	"context"

	"contrato_one_internet_controlador/internal/modelos"
)

type PermisoService struct {
	client *ModeloClient
}

func NewPermisoService(c *ModeloClient) *PermisoService { return &PermisoService{client: c} }

func (s *PermisoService) GetPermisos(ctx context.Context) ([]modelos.Permiso, error) {
	return s.client.GetPermisos(ctx)
}
func (s *PermisoService) ObtenerPermisosPaginados(ctx context.Context, page, limit int, nombre, orden string) (map[string]interface{}, error) {
	return s.client.GetPermisosPaginados(ctx, page, limit, nombre, orden)
}
func (s *PermisoService) ObtenerPermisosInactivosPaginados(ctx context.Context, page, limit int, nombre, orden string) (map[string]interface{}, error) {
	return s.client.GetPermisosInactivosPaginados(ctx, page, limit, nombre, orden)
}
func (s *PermisoService) ObtenerPermisoPorID(ctx context.Context, id int) (*modelos.Permiso, error) {
	return s.client.GetPermisoByID(ctx, id)
}
func (s *PermisoService) CrearPermiso(ctx context.Context, payload interface{}) (int64, error) {
	return s.client.CreatePermiso(ctx, payload)
}
func (s *PermisoService) ActualizarPermiso(ctx context.Context, id int, payload interface{}) error {
	return s.client.UpdatePermiso(ctx, id, payload)
}
func (s *PermisoService) EliminarPermiso(ctx context.Context, id int) error {
	return s.client.DeletePermiso(ctx, id)
}
func (s *PermisoService) ReactivarPermiso(ctx context.Context, id int) (map[string]interface{}, error) {
	return s.client.ReactivarPermiso(ctx, id)
}
