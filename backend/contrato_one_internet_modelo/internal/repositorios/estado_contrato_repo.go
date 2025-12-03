package repositorios

import (
    "context"
    "database/sql"
    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type EstadoContratoRepo struct{
    db Execer
}

func NewEstadoContratoRepo(db Execer) *EstadoContratoRepo { return &EstadoContratoRepo{db: db} }

func (r *EstadoContratoRepo) ObtenerEstadosActivos(ctx context.Context) ([]modelos.EstadoContrato, error) {
    query := `SELECT id_estado_contrato, nombre, descripcion FROM estado_contrato WHERE borrado IS NULL ORDER BY nombre`
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()
    var res []modelos.EstadoContrato
    for rows.Next() {
        var e modelos.EstadoContrato
        var desc sql.NullString
        if err := rows.Scan(&e.IDEstadoContrato, &e.NombreEstado, &desc); err != nil { return nil, err }
        if desc.Valid { s := desc.String; e.Descripcion = &s }
        res = append(res, e)
    }
    return res, nil
}

func (r *EstadoContratoRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.EstadoContrato, error) {
    var e modelos.EstadoContrato
    var desc sql.NullString
    query := `SELECT id_estado_contrato, nombre, descripcion FROM estado_contrato WHERE id_estado_contrato = ? AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, id).Scan(&e.IDEstadoContrato, &e.NombreEstado, &desc)
    if err != nil { return nil, err }
    if desc.Valid { s := desc.String; e.Descripcion = &s }
    return &e, nil
}

func (r *EstadoContratoRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
    var id int
    query := `SELECT id_estado_contrato FROM estado_contrato WHERE LOWER(nombre) = LOWER(?) AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows { return false, nil }
        return false, err
    }
    return id != 0, nil
}

func (r *EstadoContratoRepo) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
    query := `INSERT INTO estado_contrato (nombre, descripcion) VALUES (?, ?)`
    res, err := r.db.ExecContext(ctx, query, nombre, descripcion)
    if err != nil { return 0, utilidades.TraducirErrorBD(err) }
    return res.LastInsertId()
}

func (r *EstadoContratoRepo) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
    query := `UPDATE estado_contrato SET nombre = ?, descripcion = ? WHERE id_estado_contrato = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, nombre, descripcion, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}

func (r *EstadoContratoRepo) BorrarLogico(ctx context.Context, id int) error {
    query := `UPDATE estado_contrato SET borrado = NOW() WHERE id_estado_contrato = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}
