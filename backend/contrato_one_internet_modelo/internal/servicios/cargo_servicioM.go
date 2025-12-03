package servicios

import (
    "context"
    "strings"

    "contrato_one_internet_modelo/internal/repositorios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type CargoService struct{
    repo *repositorios.CargoRepo
}

func NewCargoService(repo *repositorios.CargoRepo) *CargoService { return &CargoService{repo: repo} }

func (s *CargoService) Listar(ctx context.Context) ([]interface{}, error) {
    listas, err := s.repo.ObtenerCargosActivos(ctx)
    if err != nil { return nil, err }
    var out []interface{}
    for _, c := range listas {
        out = append(out, map[string]interface{}{"id_cargo": c.IDCargo, "nombre": c.Nombre})
    }
    return out, nil
}

func (s *CargoService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
    c, err := s.repo.ObtenerPorID(ctx, id)
    if err != nil { return nil, utilidades.ErrNoEncontrado }
    return map[string]interface{}{"id_cargo": c.IDCargo, "nombre": c.Nombre}, nil
}

func (s *CargoService) Crear(ctx context.Context, nombre string) (int64, error) {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 50 { return 0, utilidades.ErrValidacion }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return 0, err }
    if exists { return 0, utilidades.ErrDuplicado }
    return s.repo.Crear(ctx, nombre)
}

func (s *CargoService) Actualizar(ctx context.Context, id int, nombre string) error {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 50 { return utilidades.ErrValidacion }
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return err }
    if exists { return utilidades.ErrDuplicado }
    return s.repo.Actualizar(ctx, id, nombre)
}

func (s *CargoService) BorrarLogico(ctx context.Context, id int) error {
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    enUso, err := s.repo.EstaEnUso(ctx, id)
    if err != nil { return err }
    if enUso { return utilidades.ErrValidacion }
    return s.repo.BorrarLogico(ctx, id)
}
