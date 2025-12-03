package repositorios

import (
	"context"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
	"database/sql"
)

type VinculoRepo struct {
	db Execer
}

func NewVinculoRepo(db Execer) *VinculoRepo { return &VinculoRepo{db: db} }

func (r *VinculoRepo) ObtenerVinculosActivos(ctx context.Context) ([]modelos.Vinculo, error) {
	query := `SELECT id_vinculo, nombre_vinculo, descripcion FROM vinculo WHERE borrado IS NULL ORDER BY nombre_vinculo`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []modelos.Vinculo
	for rows.Next() {
		var v modelos.Vinculo
		var desc sql.NullString
		if err := rows.Scan(&v.IDVinculo, &v.NombreVinculo, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			s := desc.String
			v.Descripcion = &s
		}
		res = append(res, v)
	}
	return res, nil
}

func (r *VinculoRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.Vinculo, error) {
	var v modelos.Vinculo
	var desc sql.NullString
	query := `SELECT id_vinculo, nombre_vinculo, descripcion FROM vinculo WHERE id_vinculo = ? AND borrado IS NULL LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, id).Scan(&v.IDVinculo, &v.NombreVinculo, &desc)
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		s := desc.String
		v.Descripcion = &s
	}
	return &v, nil
}

func (r *VinculoRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
	var id int
	query := `SELECT id_vinculo FROM vinculo WHERE LOWER(nombre_vinculo) = LOWER(?) AND borrado IS NULL LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return id != 0, nil
}

func (r *VinculoRepo) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
	query := `INSERT INTO vinculo (nombre_vinculo, descripcion) VALUES (?, ?)`
	res, err := r.db.ExecContext(ctx, query, nombre, descripcion)
	if err != nil {
		return 0, utilidades.TraducirErrorBD(err)
	}
	return res.LastInsertId()
}

func (r *VinculoRepo) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
	query := `UPDATE vinculo SET nombre_vinculo = ?, descripcion = ? WHERE id_vinculo = ? AND borrado IS NULL`
	_, err := r.db.ExecContext(ctx, query, nombre, descripcion, id)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	return nil
}

func (r *VinculoRepo) BorrarLogico(ctx context.Context, id int) error {
	query := `UPDATE vinculo SET borrado = NOW() WHERE id_vinculo = ? AND borrado IS NULL`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	return nil
}

// ObtenerIDPorNombre busca un vínculo por su nombre y devuelve su ID.
func (r *VinculoRepo) ObtenerIDPorNombre(ctx context.Context, nombre string) (int, error) {
	var id int
	query := "SELECT id_vinculo FROM vinculo WHERE nombre_vinculo = ? AND borrado IS NULL"
	err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
	return id, err
}

func (r *VinculoRepo) CrearPersonaVinculoEmpresa(ctx context.Context, tx Execer, pve *modelos.PersonaVinculoEmpresa) error {
	query := `INSERT INTO persona_vinculo_empresa (id_persona, id_vinculo, id_empresa, id_cargo) VALUES (?, ?, ?, ?)`
	_, err := tx.ExecContext(ctx, query, pve.IDPersona, pve.IDVinculo, pve.IDEmpresa, pve.IDCargo)
	return err
}
