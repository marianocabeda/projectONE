package repositorios

import (
    "context"
    "database/sql"
    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type EstadoConexionRepo struct{
    db Execer
}

func NewEstadoConexionRepo(db Execer) *EstadoConexionRepo { return &EstadoConexionRepo{db: db} }

func (r *EstadoConexionRepo) ObtenerEstadosActivos(ctx context.Context) ([]modelos.EstadoConexion, error) {
    query := `SELECT id_estado_conexion, nombre, descripcion FROM estado_conexion WHERE borrado IS NULL ORDER BY nombre`
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()
    var res []modelos.EstadoConexion
    for rows.Next() {
        var e modelos.EstadoConexion
        var desc sql.NullString
        if err := rows.Scan(&e.IDEstadoConexion, &e.Nombre, &desc); err != nil { return nil, err }
        if desc.Valid { s := desc.String; e.Descripcion = &s }
        res = append(res, e)
    }
    return res, nil
}

func (r *EstadoConexionRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.EstadoConexion, error) {
    var e modelos.EstadoConexion
    var desc sql.NullString
    query := `SELECT id_estado_conexion, nombre, descripcion FROM estado_conexion WHERE id_estado_conexion = ? AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, id).Scan(&e.IDEstadoConexion, &e.Nombre, &desc)
    if err != nil { return nil, err }
    if desc.Valid { s := desc.String; e.Descripcion = &s }
    return &e, nil
}

func (r *EstadoConexionRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
    var id int
    query := `SELECT id_estado_conexion FROM estado_conexion WHERE LOWER(nombre) = LOWER(?) AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows { return false, nil }
        return false, err
    }
    return id != 0, nil
}

func (r *EstadoConexionRepo) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
    query := `INSERT INTO estado_conexion (nombre, descripcion) VALUES (?, ?)`
    res, err := r.db.ExecContext(ctx, query, nombre, descripcion)
    if err != nil { return 0, utilidades.TraducirErrorBD(err) }
    return res.LastInsertId()
}

func (r *EstadoConexionRepo) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
    query := `UPDATE estado_conexion SET nombre = ?, descripcion = ? WHERE id_estado_conexion = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, nombre, descripcion, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}

func (r *EstadoConexionRepo) EstaEnUso(ctx context.Context, id int) (bool, error) {
    var cnt int
    // `conexion` table may reference id_estado_conexion; check active records
    query := `SELECT COUNT(1) FROM conexion WHERE id_estado_conexion = ? AND borrado IS NULL`
    if err := r.db.QueryRowContext(ctx, query, id).Scan(&cnt); err != nil { return false, err }
    return cnt > 0, nil
}

func (r *EstadoConexionRepo) BorrarLogico(ctx context.Context, id int) error {
    query := `UPDATE estado_conexion SET borrado = NOW() WHERE id_estado_conexion = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}
