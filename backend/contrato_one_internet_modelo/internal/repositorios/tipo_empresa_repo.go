package repositorios

import (
    "context"
    "database/sql"
    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type TipoEmpresaRepo struct{
    db Execer
}

func NewTipoEmpresaRepo(db Execer) *TipoEmpresaRepo { return &TipoEmpresaRepo{db: db} }

func (r *TipoEmpresaRepo) ObtenerTiposActivos(ctx context.Context) ([]modelos.TipoEmpresa, error) {
    query := `SELECT id_tipo_empresa, nombre FROM tipo_empresa WHERE borrado IS NULL ORDER BY nombre` 
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()
    var res []modelos.TipoEmpresa
    for rows.Next() {
        var t modelos.TipoEmpresa
        if err := rows.Scan(&t.IDTipoEmpresa, &t.Nombre); err != nil { return nil, err }
        res = append(res, t)
    }
    return res, nil
}

func (r *TipoEmpresaRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.TipoEmpresa, error) {
    var t modelos.TipoEmpresa
    query := `SELECT id_tipo_empresa, nombre FROM tipo_empresa WHERE id_tipo_empresa = ? AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, id).Scan(&t.IDTipoEmpresa, &t.Nombre)
    if err != nil { return nil, err }
    return &t, nil
}

func (r *TipoEmpresaRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
    var id int
    query := `SELECT id_tipo_empresa FROM tipo_empresa WHERE LOWER(nombre) = LOWER(?) AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows {
            return false, nil
        }
        return false, err
    }
    return id != 0, nil
}

func (r *TipoEmpresaRepo) Crear(ctx context.Context, nombre string) (int64, error) {
    query := `INSERT INTO tipo_empresa (nombre) VALUES (?)`
    res, err := r.db.ExecContext(ctx, query, nombre)
    if err != nil { return 0, utilidades.TraducirErrorBD(err) }
    id, err := res.LastInsertId()
    if err != nil { return 0, err }
    return id, nil
}

func (r *TipoEmpresaRepo) ActualizarNombre(ctx context.Context, id int, nombre string) error {
    query := `UPDATE tipo_empresa SET nombre = ? WHERE id_tipo_empresa = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, nombre, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}

func (r *TipoEmpresaRepo) BorrarLogico(ctx context.Context, id int) error {
    query := `UPDATE tipo_empresa SET borrado = NOW() WHERE id_tipo_empresa = ? AND borrado IS NULL`
    res, err := r.db.ExecContext(ctx, query, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    _ = res
    return nil
}
