package repositorios

import (
	"context"
	"database/sql"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
)

type PermisoRepo struct {
	db Execer
}

func NewPermisoRepo(db Execer) *PermisoRepo { return &PermisoRepo{db: db} }

func (r *PermisoRepo) ObtenerPermisosActivos(ctx context.Context) ([]modelos.Permiso, error) {
	query := `SELECT id_permiso, nombre, descripcion FROM permiso WHERE borrado IS NULL ORDER BY nombre`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var res []modelos.Permiso
	for rows.Next() {
		var p modelos.Permiso
		var desc sql.NullString
		if err := rows.Scan(&p.IDPermiso, &p.Nombre, &desc); err != nil {
			return nil, err
		}
		if desc.Valid {
			s := desc.String
			p.Descripcion = &s
		}
		res = append(res, p)
	}
	return res, nil
}

func (r *PermisoRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.Permiso, error) {
	var p modelos.Permiso
	var desc sql.NullString
	query := `SELECT id_permiso, nombre, descripcion FROM permiso WHERE id_permiso = ? AND borrado IS NULL LIMIT 1`
	if err := r.db.QueryRowContext(ctx, query, id).Scan(&p.IDPermiso, &p.Nombre, &desc); err != nil {
		return nil, err
	}
	if desc.Valid {
		s := desc.String
		p.Descripcion = &s
	}
	return &p, nil
}

func (r *PermisoRepo) ExisteNombreCaseInsensitive(ctx context.Context, nombre string) (bool, error) {
	var id int
	query := `SELECT id_permiso FROM permiso WHERE LOWER(nombre) = LOWER(?) AND borrado IS NULL LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, nombre).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return id != 0, nil
}

// CountPermisos cuenta permisos según filtro y estado (activo=true -> borrado IS NULL)
func (r *PermisoRepo) CountPermisos(ctx context.Context, nombre string, activo bool) (int, error) {
	var cnt int
	where := "borrado IS NULL"
	if !activo {
		where = "borrado IS NOT NULL"
	}
	if nombre != "" {
		nombre = "%" + nombre + "%"
		query := `SELECT COUNT(1) FROM permiso WHERE ` + where + ` AND LOWER(nombre) LIKE LOWER(?)`
		if err := r.db.QueryRowContext(ctx, query, nombre).Scan(&cnt); err != nil {
			return 0, err
		}
		return cnt, nil
	}
	query := `SELECT COUNT(1) FROM permiso WHERE ` + where
	if err := r.db.QueryRowContext(ctx, query).Scan(&cnt); err != nil {
		return 0, err
	}
	return cnt, nil
}

// ListPermisosPaginated devuelve permisos (activo/inactivo) con filtros, orden y paginación
func (r *PermisoRepo) ListPermisosPaginated(ctx context.Context, offset, limit int, nombre, orden string, activo bool) ([]struct {
	P       modelos.Permiso
	Borrado sql.NullTime
}, error) {
	where := "borrado IS NULL"
	if !activo {
		where = "borrado IS NOT NULL"
	}

	orderBy := "nombre ASC"
	switch orden {
	case "nombre_asc":
		orderBy = "nombre ASC"
	case "nombre_desc":
		orderBy = "nombre DESC"
	case "creado_asc":
		orderBy = "creado ASC"
	case "creado_desc":
		orderBy = "creado DESC"
	}

	var rows *sql.Rows
	var err error
	if nombre != "" {
		nombreParam := "%" + nombre + "%"
		query := `SELECT id_permiso, nombre, descripcion, borrado FROM permiso WHERE ` + where + ` AND LOWER(nombre) LIKE LOWER(?) ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`
		rows, err = r.db.QueryContext(ctx, query, nombreParam, limit, offset)
	} else {
		query := `SELECT id_permiso, nombre, descripcion, borrado FROM permiso WHERE ` + where + ` ORDER BY ` + orderBy + ` LIMIT ? OFFSET ?`
		rows, err = r.db.QueryContext(ctx, query, limit, offset)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var res []struct {
		P       modelos.Permiso
		Borrado sql.NullTime
	}
	for rows.Next() {
		var p modelos.Permiso
		var desc sql.NullString
		var borrado sql.NullTime
		if err := rows.Scan(&p.IDPermiso, &p.Nombre, &desc, &borrado); err != nil {
			return nil, err
		}
		if desc.Valid {
			s := desc.String
			p.Descripcion = &s
		}
		res = append(res, struct {
			P       modelos.Permiso
			Borrado sql.NullTime
		}{P: p, Borrado: borrado})
	}
	return res, nil
}

// ObtenerPorIDInclusoBorrado obtiene permiso por id sin filtrar por borrado y devuelve el valor de borrado
func (r *PermisoRepo) ObtenerPorIDInclusoBorrado(ctx context.Context, id int) (*modelos.Permiso, sql.NullTime, error) {
	var p modelos.Permiso
	var desc sql.NullString
	var borrado sql.NullTime
	query := `SELECT id_permiso, nombre, descripcion, borrado FROM permiso WHERE id_permiso = ? LIMIT 1`
	if err := r.db.QueryRowContext(ctx, query, id).Scan(&p.IDPermiso, &p.Nombre, &desc, &borrado); err != nil {
		return nil, borrado, err
	}
	if desc.Valid {
		s := desc.String
		p.Descripcion = &s
	}
	return &p, borrado, nil
}

// Reactivar pone borrado = NULL para un permiso que estaba borrado
func (r *PermisoRepo) Reactivar(ctx context.Context, id int) error {
	query := `UPDATE permiso SET borrado = NULL WHERE id_permiso = ? AND borrado IS NOT NULL`
	res, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *PermisoRepo) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
	query := `INSERT INTO permiso (nombre, descripcion) VALUES (?, ?)`
	res, err := r.db.ExecContext(ctx, query, nombre, descripcion)
	if err != nil {
		return 0, utilidades.TraducirErrorBD(err)
	}
	return res.LastInsertId()
}

func (r *PermisoRepo) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
	query := `UPDATE permiso SET nombre = ?, descripcion = ? WHERE id_permiso = ? AND borrado IS NULL`
	_, err := r.db.ExecContext(ctx, query, nombre, descripcion, id)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	return nil
}

func (r *PermisoRepo) EstaEnUso(ctx context.Context, id int) (bool, error) {
	var cnt int
	// assume mapping table rol_permiso (id_rol, id_permiso)
	query := `SELECT COUNT(1) FROM rol_permiso WHERE id_permiso = ? AND borrado IS NULL`
	if err := r.db.QueryRowContext(ctx, query, id).Scan(&cnt); err != nil {
		return false, err
	}
	return cnt > 0, nil
}

func (r *PermisoRepo) BorrarLogico(ctx context.Context, id int) error {
	query := `UPDATE permiso SET borrado = NOW() WHERE id_permiso = ? AND borrado IS NULL`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	return nil
}
