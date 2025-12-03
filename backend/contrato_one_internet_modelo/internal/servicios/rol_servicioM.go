package servicios

import (
    "context"
    "strings"

    "contrato_one_internet_modelo/internal/repositorios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type RolService struct{
    repo *repositorios.RolRepo
}

func NewRolService(repo *repositorios.RolRepo) *RolService { return &RolService{repo: repo} }

func (s *RolService) Listar(ctx context.Context) ([]interface{}, error) {
    listas, err := s.repo.ObtenerRolesActivos(ctx)
    if err != nil { return nil, err }
    var out []interface{}
    for _, r := range listas {
        out = append(out, map[string]interface{}{"id_rol": r.IDRol, "nombre": r.Nombre, "descripcion": r.Descripcion})
    }
    return out, nil
}

func (s *RolService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
    r, err := s.repo.ObtenerPorID(ctx, id)
    if err != nil { return nil, utilidades.ErrNoEncontrado }
    return map[string]interface{}{"id_rol": r.IDRol, "nombre": r.Nombre, "descripcion": r.Descripcion}, nil
}

func (s *RolService) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 50 { return 0, utilidades.ErrValidacion }
    if descripcion != nil && len(*descripcion) > 255 { return 0, utilidades.ErrValidacion }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return 0, err }
    if exists { return 0, utilidades.ErrDuplicado }
    return s.repo.Crear(ctx, nombre, descripcion)
}

func (s *RolService) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 50 { return utilidades.ErrValidacion }
    if descripcion != nil && len(*descripcion) > 255 { return utilidades.ErrValidacion }
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return err }
    if exists { return utilidades.ErrDuplicado }
    return s.repo.Actualizar(ctx, id, nombre, descripcion)
}

func (s *RolService) BorrarLogico(ctx context.Context, id int) error {
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    enUso, err := s.repo.EstaEnUso(ctx, id)
    if err != nil { return err }
    if enUso { return utilidades.ErrValidacion }
    return s.repo.BorrarLogico(ctx, id)
}
