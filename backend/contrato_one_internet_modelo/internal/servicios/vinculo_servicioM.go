package servicios

import (
    "context"
    "strings"

    "contrato_one_internet_modelo/internal/repositorios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type VinculoService struct {
    repo *repositorios.VinculoRepo
}

func NewVinculoService(repo *repositorios.VinculoRepo) *VinculoService { return &VinculoService{repo: repo} }

func (s *VinculoService) Listar(ctx context.Context) ([]interface{}, error) {
    listas, err := s.repo.ObtenerVinculosActivos(ctx)
    if err != nil { return nil, err }
    var out []interface{}
    for _, v := range listas {
        out = append(out, map[string]interface{}{"id_vinculo": v.IDVinculo, "nombre_vinculo": v.NombreVinculo, "descripcion": v.Descripcion})
    }
    return out, nil
}

func (s *VinculoService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
    v, err := s.repo.ObtenerPorID(ctx, id)
    if err != nil { return nil, utilidades.ErrNoEncontrado }
    return map[string]interface{}{"id_vinculo": v.IDVinculo, "nombre_vinculo": v.NombreVinculo, "descripcion": v.Descripcion}, nil
}

func (s *VinculoService) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 100 { return 0, utilidades.ErrValidacion }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return 0, err }
    if exists { return 0, utilidades.ErrDuplicado }
    return s.repo.Crear(ctx, nombre, descripcion)
}

func (s *VinculoService) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 100 { return utilidades.ErrValidacion }
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return err }
    if exists { return utilidades.ErrDuplicado }
    return s.repo.Actualizar(ctx, id, nombre, descripcion)
}

func (s *VinculoService) BorrarLogico(ctx context.Context, id int) error {
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    return s.repo.BorrarLogico(ctx, id)
}
