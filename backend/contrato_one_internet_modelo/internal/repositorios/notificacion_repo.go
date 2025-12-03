package repositorios

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"contrato_one_internet_modelo/internal/modelos"
)

type NotificacionRepo struct {
	db Execer
}

func NewNotificacionRepo(db Execer) *NotificacionRepo {
	return &NotificacionRepo{db: db}
}

// ObtenerNotificaciones obtiene las notificaciones de un usuario con filtros y paginación
func (r *NotificacionRepo) ObtenerNotificaciones(
	ctx context.Context,
	idPersona int,
	leido *int,
	page, limit int,
	sortBy, sortDirection string,
) ([]modelos.Notificacion, error) {
	// Construir query con filtros
	query := `
		SELECT 
			id_notificacion,
			tipo,
			titulo,
			mensaje,
			leido,
			rol_destino,
			id_conexion,
			id_contrato,
			id_pago,
			observacion,
			creado
		FROM notificacion
		WHERE id_persona_receptor = ?
	`

	args := []interface{}{idPersona}

	// Filtro por leído
	if leido != nil {
		query += " AND leido = ?"
		args = append(args, *leido)
	}

	// Ordenamiento
	allowedSortBy := map[string]bool{"creado": true}
	if !allowedSortBy[sortBy] {
		sortBy = "creado"
	}

	allowedDirection := map[string]bool{"ASC": true, "DESC": true}
	if !allowedDirection[strings.ToUpper(sortDirection)] {
		sortDirection = "DESC"
	}

	query += fmt.Sprintf(" ORDER BY %s %s", sortBy, strings.ToUpper(sortDirection))

	// Paginación
	offset := (page - 1) * limit
	query += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notificaciones []modelos.Notificacion
	for rows.Next() {
		var n modelos.Notificacion
		var idConexion, idContrato, idPago sql.NullInt64
		var rolDestino, observacion sql.NullString

		err := rows.Scan(
			&n.IDNotificacion,
			&n.Tipo,
			&n.Titulo,
			&n.Mensaje,
			&n.Leido,
			&rolDestino,
			&idConexion,
			&idContrato,
			&idPago,
			&observacion,
			&n.Creado,
		)
		if err != nil {
			return nil, err
		}

		// Convertir sql.NullString a *string
		if rolDestino.Valid {
			n.RolDestino = &rolDestino.String
		}
		if observacion.Valid {
			n.Observacion = &observacion.String
		}

		// Convertir sql.NullInt64 a *int
		if idConexion.Valid {
			val := int(idConexion.Int64)
			n.IDConexion = &val
		}
		if idContrato.Valid {
			val := int(idContrato.Int64)
			n.IDContrato = &val
		}
		if idPago.Valid {
			val := int(idPago.Int64)
			n.IDPago = &val
		}

		notificaciones = append(notificaciones, n)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return notificaciones, nil
}

// ContarNotificaciones cuenta el total de notificaciones de un usuario con filtros
func (r *NotificacionRepo) ContarNotificaciones(
	ctx context.Context,
	idPersona int,
	leido *int,
) (int, error) {
	query := "SELECT COUNT(*) FROM notificacion WHERE id_persona_receptor = ?"
	args := []interface{}{idPersona}

	if leido != nil {
		query += " AND leido = ?"
		args = append(args, *leido)
	}

	var total int
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&total)
	if err != nil {
		return 0, err
	}

	return total, nil
}

// MarcarComoLeida actualiza una notificación como leída solo si pertenece al usuario
func (r *NotificacionRepo) MarcarComoLeida(
	ctx context.Context,
	idNotificacion int,
	idPersona int,
) error {
	query := `
		UPDATE notificacion 
		SET leido = 1 
		WHERE id_notificacion = ? 
		  AND id_persona_receptor = ?
	`

	result, err := r.db.ExecContext(ctx, query, idNotificacion, idPersona)
	if err != nil {
		return err
	}

	// Verificar si se actualizó alguna fila
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		// La notificación no existe o no pertenece al usuario
		return sql.ErrNoRows
	}

	return nil
}

// CrearNotificacion inserta una nueva notificación en la base de datos
func (r *NotificacionRepo) CrearNotificacion(
	ctx context.Context,
	idPersonaReceptor int,
	tipo, titulo, mensaje string,
	rolDestino *string,
	idConexion, idContrato, idPago *int,
	observacion *string,
) error {
	query := `
		INSERT INTO notificacion 
		(id_persona_receptor, tipo, titulo, mensaje, rol_destino, id_conexion, id_contrato, id_pago, observacion, leido, creado)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
	`

	_, err := r.db.ExecContext(ctx, query, idPersonaReceptor, tipo, titulo, mensaje, rolDestino, idConexion, idContrato, idPago, observacion)
	return err
}

// CrearNotificacionParaRol crea notificaciones para todos los usuarios con un rol específico
func (r *NotificacionRepo) CrearNotificacionParaRol(
	ctx context.Context,
	rol, tipo, titulo, mensaje string,
	idConexion, idContrato, idPago *int,
	observacion *string,
) error {
	// Obtener todos los usuarios con el rol especificado
	query := `
		SELECT DISTINCT u.id_persona
		FROM usuario u
		INNER JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
		INNER JOIN rol r ON ur.id_rol = r.id_rol
		WHERE r.nombre = ? AND u.borrado IS NULL
	`

	rows, err := r.db.QueryContext(ctx, query, rol)
	if err != nil {
		return err
	}
	defer rows.Close()

	var idPersonas []int
	for rows.Next() {
		var idPersona int
		if err := rows.Scan(&idPersona); err != nil {
			return err
		}
		idPersonas = append(idPersonas, idPersona)
	}

	if err = rows.Err(); err != nil {
		return err
	}

	// Crear notificación para cada persona con ese rol
	for _, idPersona := range idPersonas {
		if err := r.CrearNotificacion(ctx, idPersona, tipo, titulo, mensaje, &rol, idConexion, idContrato, idPago, observacion); err != nil {
			return err
		}
	}

	return nil
}
