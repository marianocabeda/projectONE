package servicios

import (
    "context"
    "strings"

    "contrato_one_internet_modelo/internal/repositorios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type EstadoContratoService struct {
    repo *repositorios.EstadoContratoRepo
}

func NewEstadoContratoService(repo *repositorios.EstadoContratoRepo) *EstadoContratoService { return &EstadoContratoService{repo: repo} }

func (s *EstadoContratoService) Listar(ctx context.Context) ([]interface{}, error) {
    listas, err := s.repo.ObtenerEstadosActivos(ctx)
    if err != nil { return nil, err }
    var out []interface{}
    for _, e := range listas {
        out = append(out, map[string]interface{}{"id_estado_contrato": e.IDEstadoContrato, "nombre_estado": e.NombreEstado, "descripcion": e.Descripcion})
    }
    return out, nil
}

func (s *EstadoContratoService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
    e, err := s.repo.ObtenerPorID(ctx, id)
    if err != nil { return nil, utilidades.ErrNoEncontrado }
    return map[string]interface{}{"id_estado_contrato": e.IDEstadoContrato, "nombre_estado": e.NombreEstado, "descripcion": e.Descripcion}, nil
}

func (s *EstadoContratoService) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 100 { return 0, utilidades.ErrValidacion }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return 0, err }
    if exists { return 0, utilidades.ErrDuplicado }
    return s.repo.Crear(ctx, nombre, descripcion)
}

func (s *EstadoContratoService) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 100 { return utilidades.ErrValidacion }
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return err }
    if exists { return utilidades.ErrDuplicado }
    return s.repo.Actualizar(ctx, id, nombre, descripcion)
}

func (s *EstadoContratoService) BorrarLogico(ctx context.Context, id int) error {
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    return s.repo.BorrarLogico(ctx, id)
}
