package repositorios

import (
    "context"
    "database/sql"

    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type RolRepo struct{
    db Execer
}

func NewRolRepo(db Execer) *RolRepo { return &RolRepo{db: db} }

func (r *RolRepo) ObtenerRolesActivos(ctx context.Context) ([]modelos.Rol, error) {
    query := `SELECT id_rol, nombre, descripcion FROM rol WHERE borrado IS NULL ORDER BY nombre`
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()
    var res []modelos.Rol
    for rows.Next() {
        var ro modelos.Rol
        var desc sql.NullString
        if err := rows.Scan(&ro.IDRol, &ro.Nombre, &desc); err != nil { return nil, err }
        if desc.Valid { s := desc.String; ro.Descripcion = &s }
        res = append(res, ro)
    }
    return res, nil
}

func (r *RolRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.Rol, error) {
    var ro modelos.Rol
    var desc sql.NullString
    query := `SELECT id_rol, nombre, descripcion FROM rol WHERE id_rol = ? AND borrado IS NULL LIMIT 1`
    if err := r.db.QueryRowContext(ctx, query, id).Scan(&ro.IDRol, &ro.Nombre, &desc); err != nil { return nil, err }
    if desc.Valid { s := desc.String; ro.Descripcion = &s }
    return &ro, nil
}

func (r *RolRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
    var id int
    query := `SELECT id_rol FROM rol WHERE LOWER(nombre) = LOWER(?) AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows { return false, nil }
        return false, err
    }
    return id != 0, nil
}

func (r *RolRepo) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
    query := `INSERT INTO rol (nombre, descripcion) VALUES (?, ?)`
    res, err := r.db.ExecContext(ctx, query, nombre, descripcion)
    if err != nil { return 0, utilidades.TraducirErrorBD(err) }
    return res.LastInsertId()
}

func (r *RolRepo) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
    query := `UPDATE rol SET nombre = ?, descripcion = ? WHERE id_rol = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, nombre, descripcion, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}

func (r *RolRepo) EstaEnUso(ctx context.Context, id int) (bool, error) {
    var cnt int
    query := `SELECT COUNT(1) FROM usuario WHERE id_rol = ? AND borrado IS NULL`
    if err := r.db.QueryRowContext(ctx, query, id).Scan(&cnt); err != nil { return false, err }
    return cnt > 0, nil
}

func (r *RolRepo) BorrarLogico(ctx context.Context, id int) error {
    query := `UPDATE rol SET borrado = NOW() WHERE id_rol = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}
