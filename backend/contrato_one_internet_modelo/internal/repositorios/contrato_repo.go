package repositorios

import (
	"context"
	"database/sql"
	"fmt"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
)

// ContratoRepo maneja operaciones de contrato en la base de datos
type ContratoRepo struct {
	db Execer
}

// NewContratoRepo crea una nueva instancia de ContratoRepo
func NewContratoRepo(db Execer) *ContratoRepo {
	return &ContratoRepo{db: db}
}

// ObtenerIDEstadoContratoPorNombre obtiene el ID del estado de contrato por nombre
func (r *ContratoRepo) ObtenerIDEstadoContratoPorNombre(ctx context.Context, nombre string) (int, error) {
	var idEstado int
	query := `SELECT id_estado_contrato FROM estado_contrato 
	          WHERE nombre = ? AND borrado IS NULL LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, nombre).Scan(&idEstado)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, utilidades.ErrNotFound{
				Entity: "estado_contrato",
				Campo:  "nombre",
				Valor:  nombre,
			}
		}
		return 0, fmt.Errorf("error buscando estado_contrato: %w", err)
	}
	return idEstado, nil
}

// CrearContrato inserta un nuevo contrato y devuelve su ID
func (r *ContratoRepo) CrearContrato(ctx context.Context, c *modelos.Contrato) (int64, error) {
	query := `
		INSERT INTO contrato (
			id_persona, id_vinculo, id_empresa, id_conexion, id_plan,
			costo_instalacion, fecha_inicio, fecha_fin, id_estado_contrato,
			id_usuario_creador
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	res, err := r.db.ExecContext(ctx, query,
		c.IDPersona, c.IDVinculo, c.IDEmpresa, c.IDConexion, c.IDPlan,
		c.CostoInstalacion, c.FechaInicio, c.FechaFin, c.IDEstadoContrato,
		c.IDUsuarioCreador,
	)
	if err != nil {
		return 0, utilidades.TraducirErrorBD(err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error obteniendo ID de contrato insertado: %w", err)
	}
	return id, nil
}

// ActualizarEstadoContratoPorConexion actualiza el estado de un contrato asociado a una conexión
func (r *ContratoRepo) ActualizarEstadoContratoPorConexion(
	ctx context.Context,
	idConexion int,
	idNuevoEstado int,
) error {
	query := `
		UPDATE contrato
		SET id_estado_contrato = ?,
		    ultimo_cambio = CURRENT_TIMESTAMP
		WHERE id_conexion = ?
		  AND borrado IS NULL
	`
	
	result, err := r.db.ExecContext(ctx, query, idNuevoEstado, idConexion)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error verificando filas afectadas: %w", err)
	}
	
	if rowsAffected == 0 {
		return utilidades.ErrNotFound{
			Entity: "contrato",
			Campo:  "id_conexion",
			Valor:  fmt.Sprintf("%d", idConexion),
		}
	}
	
	return nil
}

// ListarContratosPorPersona obtiene los contratos de una persona con paginación y ordenamiento
func (r *ContratoRepo) ListarContratosPorPersona(
	ctx context.Context,
	idPersona int,
	limit int,
	offset int,
	sortBy string,
	sortOrder string,
) ([]modelos.ContratoDetalle, error) {
	// Validar campo de ordenamiento
	sortField := "c.creado"
	switch sortBy {
	case "fecha_inicio":
		sortField = "c.fecha_inicio"
	case "estado":
		sortField = "ec.nombre"
	case "plan":
		sortField = "pl.nombre"
	}

	// Validar dirección
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}

	query := fmt.Sprintf(`
		SELECT 
			c.id_contrato,
			ec.nombre AS estado,
			DATE_FORMAT(c.fecha_inicio, '%%Y-%%m-%%d') AS fecha_inicio,
			DATE_FORMAT(c.fecha_fin, '%%Y-%%m-%%d') AS fecha_fin,
			c.costo_instalacion,
			pl.id_plan,
			pl.nombre AS plan_nombre,
			pl.velocidad_mbps,
			cn.id_conexion,
			cn.nro_conexion,
			d.calle,
			d.numero,
			d.piso,
			d.depto,
			cn.distrito_nombre,
			cn.departamento_nombre,
			cn.provincia_nombre
		FROM contrato c
		INNER JOIN estado_contrato ec ON c.id_estado_contrato = ec.id_estado_contrato
		INNER JOIN plan pl ON c.id_plan = pl.id_plan
		INNER JOIN conexion cn ON c.id_conexion = cn.id_conexion
		LEFT JOIN direccion d ON cn.id_direccion = d.id_direccion
		WHERE c.id_persona = ?
		  AND c.borrado IS NULL
		ORDER BY %s %s
		LIMIT ? OFFSET ?
	`, sortField, sortOrder)

	rows, err := r.db.QueryContext(ctx, query, idPersona, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("error consultando contratos: %w", err)
	}
	defer rows.Close()

	var contratos []modelos.ContratoDetalle
	for rows.Next() {
		var c modelos.ContratoDetalle
		err := rows.Scan(
			&c.IDContrato,
			&c.Estado,
			&c.FechaInicio,
			&c.FechaFin,
			&c.CostoInstalacion,
			&c.Plan.IDPlan,
			&c.Plan.Nombre,
			&c.Plan.VelocidadMbps,
			&c.ConexionAsociada.IDConexion,
			&c.ConexionAsociada.NroConexion,
			&c.ConexionAsociada.DireccionInstalacion.Calle,
			&c.ConexionAsociada.DireccionInstalacion.Numero,
			&c.ConexionAsociada.DireccionInstalacion.Piso,
			&c.ConexionAsociada.DireccionInstalacion.Depto,
			&c.ConexionAsociada.DireccionInstalacion.Distrito,
			&c.ConexionAsociada.DireccionInstalacion.Departamento,
			&c.ConexionAsociada.DireccionInstalacion.Provincia,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando contrato: %w", err)
		}
		contratos = append(contratos, c)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterando contratos: %w", err)
	}

	return contratos, nil
}

// ContarContratosPorPersona cuenta el total de contratos de una persona
func (r *ContratoRepo) ContarContratosPorPersona(ctx context.Context, idPersona int) (int, error) {
	var total int
	query := `SELECT COUNT(*) FROM contrato WHERE id_persona = ? AND borrado IS NULL`
	err := r.db.QueryRowContext(ctx, query, idPersona).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error contando contratos: %w", err)
	}
	return total, nil
}

// ActualizarEstado actualiza el estado de un contrato
func (r *ContratoRepo) ActualizarEstado(ctx context.Context, idContrato, idNuevoEstado int) error {
	query := `
		UPDATE contrato
		SET id_estado_contrato = ?,
		    ultimo_cambio = CURRENT_TIMESTAMP
		WHERE id_contrato = ?
		  AND borrado IS NULL
	`
	
	result, err := r.db.ExecContext(ctx, query, idNuevoEstado, idContrato)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error verificando filas afectadas: %w", err)
	}
	
	if rowsAffected == 0 {
		return utilidades.ErrNotFound{
			Entity: "contrato",
			Campo:  "id_contrato",
			Valor:  fmt.Sprintf("%d", idContrato),
		}
	}
	
	return nil
}

// ObtenerIDConexionPorContrato obtiene el id_conexion asociado a un contrato
func (r *ContratoRepo) ObtenerIDConexionPorContrato(ctx context.Context, idContrato int) (int, error) {
	var idConexion int
	query := `SELECT id_conexion FROM contrato WHERE id_contrato = ? AND borrado IS NULL`
	err := r.db.QueryRowContext(ctx, query, idContrato).Scan(&idConexion)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, utilidades.ErrNotFound{
				Entity: "contrato",
				Campo:  "id_contrato",
				Valor:  fmt.Sprintf("%d", idContrato),
			}
		}
		return 0, fmt.Errorf("error obteniendo id_conexion: %w", err)
	}
	return idConexion, nil
}
