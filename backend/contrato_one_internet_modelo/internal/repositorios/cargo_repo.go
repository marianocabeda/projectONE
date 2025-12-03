package repositorios

import (
    "context"
    "database/sql"

    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type CargoRepo struct{
    db Execer
}

func NewCargoRepo(db Execer) *CargoRepo { return &CargoRepo{db: db} }

func (r *CargoRepo) ObtenerCargosActivos(ctx context.Context) ([]modelos.Cargo, error) {
    query := `SELECT id_cargo, nombre FROM cargo WHERE borrado IS NULL ORDER BY nombre`
    rows, err := r.db.QueryContext(ctx, query)
    if err != nil { return nil, err }
    defer rows.Close()
    var res []modelos.Cargo
    for rows.Next() {
        var c modelos.Cargo
        if err := rows.Scan(&c.IDCargo, &c.Nombre); err != nil { return nil, err }
        res = append(res, c)
    }
    return res, nil
}

func (r *CargoRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.Cargo, error) {
    var c modelos.Cargo
    query := `SELECT id_cargo, nombre FROM cargo WHERE id_cargo = ? AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, id).Scan(&c.IDCargo, &c.Nombre)
    if err != nil { return nil, err }
    return &c, nil
}

func (r *CargoRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
    var id int
    query := `SELECT id_cargo FROM cargo WHERE LOWER(nombre) = LOWER(?) AND borrado IS NULL LIMIT 1`
    err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
    if err != nil {
        if err == sql.ErrNoRows { return false, nil }
        return false, err
    }
    return id != 0, nil
}

func (r *CargoRepo) Crear(ctx context.Context, nombre string) (int64, error) {
    query := `INSERT INTO cargo (nombre) VALUES (?)`
    res, err := r.db.ExecContext(ctx, query, nombre)
    if err != nil { return 0, utilidades.TraducirErrorBD(err) }
    return res.LastInsertId()
}

func (r *CargoRepo) Actualizar(ctx context.Context, id int, nombre string) error {
    query := `UPDATE cargo SET nombre = ? WHERE id_cargo = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, nombre, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}

func (r *CargoRepo) EstaEnUso(ctx context.Context, id int) (bool, error) {
    var cnt int
    query := `SELECT COUNT(1) FROM persona_vinculo_empresa WHERE id_cargo = ? AND borrado IS NULL`
    if err := r.db.QueryRowContext(ctx, query, id).Scan(&cnt); err != nil { return false, err }
    return cnt > 0, nil
}

func (r *CargoRepo) BorrarLogico(ctx context.Context, id int) error {
    query := `UPDATE cargo SET borrado = NOW() WHERE id_cargo = ? AND borrado IS NULL`
    _, err := r.db.ExecContext(ctx, query, id)
    if err != nil { return utilidades.TraducirErrorBD(err) }
    return nil
}
