package servicios

import (
    "context"
    "strings"

    "contrato_one_internet_modelo/internal/repositorios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type TipoIvaService struct {
    repo *repositorios.TipoIvaRepo
}

func NewTipoIvaService(repo *repositorios.TipoIvaRepo) *TipoIvaService { return &TipoIvaService{repo: repo} }

func (s *TipoIvaService) Listar(ctx context.Context) ([]interface{}, error) {
    listas, err := s.repo.ObtenerTiposActivos(ctx)
    if err != nil { return nil, err }
    var out []interface{}
    for _, t := range listas {
        out = append(out, map[string]interface{}{"id_tipo_iva": t.IDTipoIVA, "tipo_iva": t.TipoIVA, "id_usuario_creador": t.IDUsuarioCreador})
    }
    return out, nil
}

func (s *TipoIvaService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
    t, err := s.repo.ObtenerPorID(ctx, id)
    if err != nil { return nil, utilidades.ErrNoEncontrado }
    return map[string]interface{}{"id_tipo_iva": t.IDTipoIVA, "tipo_iva": t.TipoIVA, "id_usuario_creador": t.IDUsuarioCreador}, nil
}

func (s *TipoIvaService) Crear(ctx context.Context, tipo string, idUsuarioCreador *int) (int64, error) {
    tipo = strings.TrimSpace(tipo)
    if tipo == "" || len(tipo) > 60 { return 0, utilidades.ErrValidacion }
    exists, err := s.repo.ExisteCaseInsensitive(ctx, tipo)
    if err != nil { return 0, err }
    if exists { return 0, utilidades.ErrDuplicado }
    return s.repo.Crear(ctx, tipo, idUsuarioCreador)
}

func (s *TipoIvaService) Actualizar(ctx context.Context, id int, tipo string) error {
    tipo = strings.TrimSpace(tipo)
    if tipo == "" || len(tipo) > 60 { return utilidades.ErrValidacion }
    // check exists
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    exists, err := s.repo.ExisteCaseInsensitive(ctx, tipo)
    if err != nil { return err }
    if exists { return utilidades.ErrDuplicado }
    return s.repo.Actualizar(ctx, id, tipo)
}

func (s *TipoIvaService) BorrarLogico(ctx context.Context, id int) error {
    if _, err := s.repo.ObtenerPorID(ctx, id); err != nil { return utilidades.ErrNoEncontrado }
    return s.repo.BorrarLogico(ctx, id)
}
