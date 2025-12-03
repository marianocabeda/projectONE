package servicios

import (
    "context"
    "strings"

    "contrato_one_internet_modelo/internal/repositorios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type TipoEmpresaService struct {
    repo *repositorios.TipoEmpresaRepo
}

func NewTipoEmpresaService(repo *repositorios.TipoEmpresaRepo) *TipoEmpresaService {
    return &TipoEmpresaService{repo: repo}
}

func (s *TipoEmpresaService) ListarTipos(ctx context.Context) ([]interface{}, error) {
    tipos, err := s.repo.ObtenerTiposActivos(ctx)
    if err != nil {
        return nil, err
    }
    var out []interface{}
    for _, t := range tipos {
        out = append(out, map[string]interface{}{"id_tipo_empresa": t.IDTipoEmpresa, "nombre": t.Nombre})
    }
    return out, nil
}

func (s *TipoEmpresaService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
    t, err := s.repo.ObtenerPorID(ctx, id)
    if err != nil {
        return nil, utilidades.ErrNoEncontrado
    }
    return map[string]interface{}{"id_tipo_empresa": t.IDTipoEmpresa, "nombre": t.Nombre}, nil
}

func (s *TipoEmpresaService) Crear(ctx context.Context, nombre string) (int64, error) {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 50 {
        return 0, utilidades.ErrValidacion
    }
    // verificar duplicado (case-insensitive)
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil {
        return 0, err
    }
    if exists {
        return 0, utilidades.ErrDuplicado
    }
    return s.repo.Crear(ctx, nombre)
}

func (s *TipoEmpresaService) ActualizarNombre(ctx context.Context, id int, nombre string) error {
    nombre = strings.TrimSpace(nombre)
    if len(nombre) < 3 || len(nombre) > 50 {
        return utilidades.ErrValidacion
    }
    // verificar existencia del registro
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil {
        return utilidades.ErrNoEncontrado
    }
    exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
    if err != nil { return err }
    if exists {
        return utilidades.ErrDuplicado
    }
    return s.repo.ActualizarNombre(ctx, id, nombre)
}

func (s *TipoEmpresaService) BorrarLogico(ctx context.Context, id int) error {
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil {
        return utilidades.ErrNoEncontrado
    }
    return s.repo.BorrarLogico(ctx, id)
}
