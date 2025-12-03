package servicios

import (
    "context"

    "contrato_one_internet_controlador/internal/modelos"
)

type RolService struct{
    client *ModeloClient
}

func NewRolService(c *ModeloClient) *RolService { return &RolService{client: c} }

func (s *RolService) ObtenerRoles(ctx context.Context) ([]modelos.Rol, error) { return s.client.GetRoles(ctx) }
func (s *RolService) ObtenerRolPorID(ctx context.Context, id int) (*modelos.Rol, error) { return s.client.GetRoleByID(ctx, id) }
func (s *RolService) CrearRol(ctx context.Context, payload interface{}) (int64, error) { return s.client.CreateRole(ctx, payload) }
func (s *RolService) ActualizarRol(ctx context.Context, id int, payload interface{}) error { return s.client.UpdateRole(ctx, id, payload) }
func (s *RolService) EliminarRol(ctx context.Context, id int) error { return s.client.DeleteRole(ctx, id) }