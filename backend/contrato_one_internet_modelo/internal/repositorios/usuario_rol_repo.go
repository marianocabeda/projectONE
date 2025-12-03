package repositorios

import (
	"context"
	"contrato_one_internet_modelo/internal/utilidades"
	"database/sql"
	"errors"
)

type UsuarioRolRepo struct {
	db Execer
}

func NewUsuarioRolRepo(db Execer) *UsuarioRolRepo {
	return &UsuarioRolRepo{db: db}
}

func (r *UsuarioRolRepo) AsignarRol(ctx context.Context, idUsuario int64, nombreRol string) error {
	// Busca el id_rol según el nombre
	var idRol int
	err := r.db.QueryRowContext(ctx, `SELECT id_rol FROM rol WHERE nombre = ?`, nombreRol).Scan(&idRol)
	if err != nil {
		// Caso: el rol no existe → error de negocio (no técnico)
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNotFound{Entity: "rol", Campo: "nombre", Valor: nombreRol}
		}

		// Otros errores técnicos → se traducen si es necesario
		return utilidades.TraducirErrorBD(err)
	}

	// Asigna el rol al usuario
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO usuario_rol (id_usuario, id_rol)
		VALUES (?, ?)
	`, idUsuario, idRol)

	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}

	return nil
}

func (r *UsuarioRolRepo) ObtenerRolesPorUsuario(ctx context.Context, idUsuario int) ([]string, error) {
    rows, err := r.db.QueryContext(ctx, `
        SELECT r.nombre
        FROM usuario_rol ur
        JOIN rol r ON ur.id_rol = r.id_rol
        WHERE ur.id_usuario = ?
    `, idUsuario)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var roles []string
    for rows.Next() {
        var rol string
        if err := rows.Scan(&rol); err != nil {
            return nil, err
        }
        roles = append(roles, rol)
    }
    return roles, nil
}