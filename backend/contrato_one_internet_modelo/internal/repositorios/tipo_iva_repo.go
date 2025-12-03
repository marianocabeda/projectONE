package repositorios

import (
    "context"
    "database/sql"
    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type TipoIvaRepo struct{
    db Execer
}

func NewTipoIvaRepo(db Execer) *TipoIvaRepo { return &TipoIvaRepo{db: db} }

func (r *TipoIvaRepo) ObtenerTiposActivos(ctx context.Context) ([]modelos.TipoIVA, error) {
    query := `SELECT id_tipo_iva, tipo_iva, id_usuario_creador FROM tipo_iva WHERE borrado IS NULL ORDER BY tipo_iva`
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()
    var res []modelos.TipoIVA
    for rows.Next() {
        var t modelos.TipoIVA
        var idUsuario sql.NullInt64
        if err := rows.Scan(&t.IDTipoIVA, &t.TipoIVA, &idUsuario); err != nil { return nil, err }
        if idUsuario.Valid {
            v := int(idUsuario.Int64)
            t.IDUsuarioCreador = &v
        }
        res = append(res, t)
    }
    return res, nil
}

func (r *TipoIvaRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.TipoIVA, error) {
    var t modelos.TipoIVA
    var idUsuario sql.NullInt64
    query := `SELECT id_tipo_iva, tipo_iva, id_usuario_creador FROM tipo_iva WHERE id_tipo_iva = ? AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, id).Scan(&t.IDTipoIVA, &t.TipoIVA, &idUsuario)
    if err != nil { return nil, err }
    if idUsuario.Valid { v := int(idUsuario.Int64); t.IDUsuarioCreador = &v }
    return &t, nil
}

func (r *TipoIvaRepo) ExisteCaseInsensitive(ctx context.Context, tipo string) (bool, error) {
    var id int
    query := `SELECT id_tipo_iva FROM tipo_iva WHERE LOWER(tipo_iva) = LOWER(?) AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, tipo).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows { return false, nil }
        return false, err
    }
    return id != 0, nil
}

func (r *TipoIvaRepo) Crear(ctx context.Context, tipo string, idUsuarioCreador *int) (int64, error) {
    query := `INSERT INTO tipo_iva (tipo_iva, id_usuario_creador) VALUES (?, ?)`
    var uid interface{}
    if idUsuarioCreador != nil { uid = *idUsuarioCreador } else { uid = nil }
    res, err := r.db.ExecContext(ctx, query, tipo, uid)
    if err != nil { return 0, utilidades.TraducirErrorBD(err) }
    return res.LastInsertId()
}

func (r *TipoIvaRepo) Actualizar(ctx context.Context, id int, tipo string) error {
    query := `UPDATE tipo_iva SET tipo_iva = ? WHERE id_tipo_iva = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, tipo, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}

func (r *TipoIvaRepo) BorrarLogico(ctx context.Context, id int) error {
    query := `UPDATE tipo_iva SET borrado = NOW() WHERE id_tipo_iva = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}
