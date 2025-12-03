package repositorios

import (
	"context"
	"database/sql"
	"fmt"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
)

// ConexionRepo maneja operaciones de conexión en la base de datos
type ConexionRepo struct {
	db Execer
}

// NewConexionRepo crea una nueva instancia de ConexionRepo
func NewConexionRepo(db Execer) *ConexionRepo {
	return &ConexionRepo{db: db}
}

// ObtenerSiguienteNroConexion obtiene el siguiente número de conexión disponible
func (r *ConexionRepo) ObtenerSiguienteNroConexion(ctx context.Context) (int, error) {
	var nroConexion int
	query := `SELECT COALESCE(MAX(nro_conexion), 0) + 1 FROM conexion`
	err := r.db.QueryRowContext(ctx, query).Scan(&nroConexion)
	if err != nil {
		return 0, fmt.Errorf("error obteniendo siguiente nro_conexion: %w", err)
	}
	return nroConexion, nil
}

// ObtenerIDEstadoPorNombre obtiene el ID del estado de conexión por nombre
func (r *ConexionRepo) ObtenerIDEstadoPorNombre(ctx context.Context, nombre string) (int, error) {
	var idEstado int
	query := `SELECT id_estado_conexion FROM estado_conexion 
	          WHERE nombre = ? AND borrado IS NULL LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, nombre).Scan(&idEstado)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, utilidades.ErrNotFound{
				Entity: "estado_conexion",
				Campo:  "nombre",
				Valor:  nombre,
			}
		}
		return 0, fmt.Errorf("error buscando estado_conexion: %w", err)
	}
	return idEstado, nil
}

// CrearConexion inserta una nueva conexión y devuelve su ID
func (r *ConexionRepo) CrearConexion(ctx context.Context, c *modelos.Conexion) (int64, error) {
	query := `
		INSERT INTO conexion (
			nro_conexion, id_persona, id_instalador, id_plan, id_direccion,
			distrito_nombre, departamento_nombre, provincia_nombre,
			latitud, longitud, tipo_conexion, id_estado_conexion,
			fecha_instalacion, observaciones, id_usuario_creador, vlanA, detalleNodo, puertoOLT
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	res, err := r.db.ExecContext(ctx, query,
		c.NroConexion, c.IDPersona, c.IDInstalador, c.IDPlan, c.IDDireccion,
		c.DistritoNombre, c.DepartamentoNombre, c.ProvinciaNombre,
		c.Latitud, c.Longitud, c.TipoConexion, c.IDEstadoConexion,
		c.FechaInstalacion, c.Observaciones, c.IDUsuarioCreador,
		c.VlanA, c.DetalleNodo, c.PuertoOLT,
	)
	if err != nil {
		return 0, utilidades.TraducirErrorBD(err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error obteniendo ID de conexión insertada: %w", err)
	}
	return id, nil
}

// ObtenerSolicitudesPendientes obtiene todas las conexiones pendientes de verificación técnica
// Incluye tanto "En verificacion" (auto-servicio) como "Pendiente verificación técnica" (derivado desde atención)
func (r *ConexionRepo) ObtenerSolicitudesPendientes(ctx context.Context) ([]modelos.SolicitudPendiente, error) {
	query := `
		SELECT 
			c.id_conexion,
			c.nro_conexion,
			CONCAT(p.nombre, ' ', p.apellido) AS cliente,
			CONCAT(
				c.distrito_nombre, ', ',
				c.departamento_nombre, ', ',
				c.provincia_nombre
			) AS direccion,
			c.latitud,
			c.longitud,
			CONCAT(pl.nombre, ' ', pl.velocidad_mbps, ' Mbps') AS plan,
			c.creado AS fecha_solicitud,
			c.id_estado_conexion,
			ec.nombre AS estado_conexion
		FROM conexion c
		INNER JOIN persona p ON c.id_persona = p.id_persona
		INNER JOIN plan pl ON c.id_plan = pl.id_plan
		INNER JOIN estado_conexion ec ON c.id_estado_conexion = ec.id_estado_conexion
		WHERE (ec.nombre = 'En verificacion' OR ec.nombre = 'Pendiente verificación técnica')
		  AND c.borrado IS NULL
		ORDER BY c.creado DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error consultando solicitudes pendientes: %w", err)
	}
	defer rows.Close()

	var solicitudes []modelos.SolicitudPendiente
	for rows.Next() {
		var s modelos.SolicitudPendiente
		err := rows.Scan(
			&s.IDConexion,
			&s.NroConexion,
			&s.Cliente,
			&s.Direccion,
			&s.Latitud,
			&s.Longitud,
			&s.Plan,
			&s.FechaSolicitud,
			&s.IDEstadoConexion,
			&s.EstadoConexion,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando solicitud pendiente: %w", err)
		}
		solicitudes = append(solicitudes, s)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterando solicitudes pendientes: %w", err)
	}

	return solicitudes, nil
}

// ObtenerDetalleSolicitud obtiene el detalle completo de una solicitud por ID
func (r *ConexionRepo) ObtenerDetalleSolicitud(ctx context.Context, idConexion int) (*modelos.DetalleSolicitud, error) {
	query := `
		SELECT 
			-- Conexión
			c.id_conexion,
			c.nro_conexion,
			c.latitud,
			c.longitud,
			c.distrito_nombre,
			c.departamento_nombre,
			c.provincia_nombre,
			c.creado,
			-- Dirección
			d.calle,
			d.numero,
			d.codigo_postal,
			d.piso,
			d.depto,
			-- Cliente
			p.id_persona,
			p.nombre,
			p.apellido,
			p.dni,
			p.telefono,
			p.email,
			-- Plan
			pl.id_plan,
			pl.nombre,
			pl.velocidad_mbps,
			-- Estado
			ec.nombre
		FROM conexion c
		INNER JOIN persona p ON c.id_persona = p.id_persona
		INNER JOIN plan pl ON c.id_plan = pl.id_plan
		INNER JOIN estado_conexion ec ON c.id_estado_conexion = ec.id_estado_conexion
		LEFT JOIN direccion d ON c.id_direccion = d.id_direccion
		WHERE c.id_conexion = ?
		  AND c.borrado IS NULL
		LIMIT 1
	`

	var detalle modelos.DetalleSolicitud
	err := r.db.QueryRowContext(ctx, query, idConexion).Scan(
		// Conexión
		&detalle.Conexion.IDConexion,
		&detalle.Conexion.NroConexion,
		&detalle.Conexion.Latitud,
		&detalle.Conexion.Longitud,
		&detalle.Conexion.Distrito,
		&detalle.Conexion.Departamento,
		&detalle.Conexion.Provincia,
		&detalle.Conexion.FechaSolicitud,
		// Dirección
		&detalle.Direccion.Calle,
		&detalle.Direccion.Numero,
		&detalle.Direccion.CodigoPostal,
		&detalle.Direccion.Piso,
		&detalle.Direccion.Depto,
		// Cliente
		&detalle.Cliente.IDPersona,
		&detalle.Cliente.Nombre,
		&detalle.Cliente.Apellido,
		&detalle.Cliente.DNI,
		&detalle.Cliente.Telefono,
		&detalle.Cliente.Email,
		// Plan
		&detalle.Plan.IDPlan,
		&detalle.Plan.Nombre,
		&detalle.Plan.VelocidadMbps,
		// Estado
		&detalle.Estado,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, utilidades.ErrNotFound{
				Entity: "conexion",
				Campo:  "id_conexion",
				Valor:  fmt.Sprintf("%d", idConexion),
			}
		}
		return nil, fmt.Errorf("error obteniendo detalle de solicitud: %w", err)
	}

	return &detalle, nil
}

// VerificarEstadoConexion verifica que una conexión exista y esté en el estado esperado
func (r *ConexionRepo) VerificarEstadoConexion(ctx context.Context, idConexion int, nombreEstado string) error {
	query := `
		SELECT ec.nombre
		FROM conexion c
		INNER JOIN estado_conexion ec ON c.id_estado_conexion = ec.id_estado_conexion
		WHERE c.id_conexion = ? AND c.borrado IS NULL
		LIMIT 1
	`
	
	var estadoActual string
	err := r.db.QueryRowContext(ctx, query, idConexion).Scan(&estadoActual)
	if err != nil {
		if err == sql.ErrNoRows {
			return utilidades.ErrNotFound{
				Entity: "conexion",
				Campo:  "id_conexion",
				Valor:  fmt.Sprintf("%d", idConexion),
			}
		}
		return fmt.Errorf("error verificando estado de conexión: %w", err)
	}
	
	if estadoActual != nombreEstado {
		return utilidades.ErrValidation{
			Campo:   "estado",
			Mensaje: fmt.Sprintf("debe estar en estado '%s', actualmente está en '%s'", nombreEstado, estadoActual),
		}
	}
	
	return nil
}

// VerificarEstadoConexionMultiple verifica que una conexión exista y esté en uno de los estados permitidos
func (r *ConexionRepo) VerificarEstadoConexionMultiple(ctx context.Context, idConexion int, nombresEstado []string) error {
	query := `
		SELECT ec.nombre
		FROM conexion c
		INNER JOIN estado_conexion ec ON c.id_estado_conexion = ec.id_estado_conexion
		WHERE c.id_conexion = ? AND c.borrado IS NULL
		LIMIT 1
	`
	
	var estadoActual string
	err := r.db.QueryRowContext(ctx, query, idConexion).Scan(&estadoActual)
	if err != nil {
		if err == sql.ErrNoRows {
			return utilidades.ErrNotFound{
				Entity: "conexion",
				Campo:  "id_conexion",
				Valor:  fmt.Sprintf("%d", idConexion),
			}
		}
		return fmt.Errorf("error verificando estado de conexión: %w", err)
	}
	
	// Verificar si el estado actual está en la lista de permitidos
	for _, nombrePermitido := range nombresEstado {
		if estadoActual == nombrePermitido {
			return nil
		}
	}
	
	// Si no coincide con ninguno, devolver error
	return utilidades.ErrValidation{
		Campo:   "estado",
		Mensaje: fmt.Sprintf("debe estar en uno de los estados permitidos, actualmente está en '%s'", estadoActual),
	}
}

// ActualizarFactibilidadConexion actualiza los datos técnicos y el estado de una conexión
func (r *ConexionRepo) ActualizarFactibilidadConexion(
	ctx context.Context,
	idConexion int,
	nap string,
	vlan int,
	puerto *int,
	observaciones *string,
	idEstadoFactible int,
) error {
	query := `
		UPDATE conexion
		SET id_estado_conexion = ?,
		    detalleNodo = ?,
		    vlanA = ?,
		    puertoOLT = ?,
		    observaciones = CASE 
		        WHEN ? IS NOT NULL THEN ?
		        ELSE observaciones
		    END,
		    ultimo_cambio = CURRENT_TIMESTAMP
		WHERE id_conexion = ?
		  AND borrado IS NULL
	`
	
	result, err := r.db.ExecContext(ctx, query,
		idEstadoFactible,
		nap,
		vlan,
		puerto,
		observaciones,
		observaciones,
		idConexion,
	)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error verificando filas afectadas: %w", err)
	}
	
	if rowsAffected == 0 {
		return utilidades.ErrNotFound{
			Entity: "conexion",
			Campo:  "id_conexion",
			Valor:  fmt.Sprintf("%d", idConexion),
		}
	}
	
	return nil
}

// RechazarFactibilidadConexion actualiza el estado de una conexión a "No factible" y registra el motivo
func (r *ConexionRepo) RechazarFactibilidadConexion(
	ctx context.Context,
	idConexion int,
	motivo *string,
	idEstadoNoFactible int,
) error {
	query := `
		UPDATE conexion
		SET id_estado_conexion = ?,
		    observaciones = CASE 
		        WHEN ? IS NOT NULL THEN ?
		        ELSE observaciones
		    END,
		    ultimo_cambio = CURRENT_TIMESTAMP
		WHERE id_conexion = ?
		  AND borrado IS NULL
	`
	
	result, err := r.db.ExecContext(ctx, query,
		idEstadoNoFactible,
		motivo,
		motivo,
		idConexion,
	)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error verificando filas afectadas: %w", err)
	}
	
	if rowsAffected == 0 {
		return utilidades.ErrNotFound{
			Entity: "conexion",
			Campo:  "id_conexion",
			Valor:  fmt.Sprintf("%d", idConexion),
		}
	}
	
	return nil
}

// FiltrosSolicitudesPendientes representa los filtros para búsqueda de solicitudes
type FiltrosSolicitudesPendientes struct {
	Distrito      string
	Plan          *int
	Cliente       string
	FechaDesde    string
	FechaHasta    string
	Provincia     string
	Departamento  string
	SortBy        string
	SortDirection string
	Limit         int
	Offset        int
}

// ObtenerSolicitudesPendientesConFiltros obtiene solicitudes con paginación y filtros
func (r *ConexionRepo) ObtenerSolicitudesPendientesConFiltros(
	ctx context.Context,
	filtros FiltrosSolicitudesPendientes,
) ([]modelos.SolicitudPendiente, int, error) {
	// Query base
	baseQuery := `
		FROM conexion c
		INNER JOIN persona p ON c.id_persona = p.id_persona
		INNER JOIN plan pl ON c.id_plan = pl.id_plan
		INNER JOIN estado_conexion ec ON c.id_estado_conexion = ec.id_estado_conexion
		WHERE (ec.nombre = 'En verificacion' OR ec.nombre = 'Pendiente verificación técnica')
		  AND c.borrado IS NULL
	`

	// Construir condiciones WHERE dinámicas
	conditions := []string{}
	args := []interface{}{}

	if filtros.Distrito != "" {
		conditions = append(conditions, "c.distrito_nombre LIKE ?")
		args = append(args, "%"+filtros.Distrito+"%")
	}

	if filtros.Plan != nil {
		conditions = append(conditions, "c.id_plan = ?")
		args = append(args, *filtros.Plan)
	}

	if filtros.Cliente != "" {
		conditions = append(conditions, "(p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)")
		clienteLike := "%" + filtros.Cliente + "%"
		args = append(args, clienteLike, clienteLike, clienteLike)
	}

	if filtros.FechaDesde != "" {
		conditions = append(conditions, "DATE(c.creado) >= ?")
		args = append(args, filtros.FechaDesde)
	}

	if filtros.FechaHasta != "" {
		conditions = append(conditions, "DATE(c.creado) <= ?")
		args = append(args, filtros.FechaHasta)
	}

	if filtros.Provincia != "" {
		conditions = append(conditions, "c.provincia_nombre LIKE ?")
		args = append(args, "%"+filtros.Provincia+"%")
	}

	if filtros.Departamento != "" {
		conditions = append(conditions, "c.departamento_nombre LIKE ?")
		args = append(args, "%"+filtros.Departamento+"%")
	}

	// Agregar condiciones al query base
	whereClause := baseQuery
	if len(conditions) > 0 {
		whereClause += " AND " + conditions[0]
		for i := 1; i < len(conditions); i++ {
			whereClause += " AND " + conditions[i]
		}
	}

	// Contar total de registros
	countQuery := "SELECT COUNT(*) " + whereClause
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("error contando solicitudes pendientes: %w", err)
	}

	// Determinar campo de ordenamiento
	var sortField string
	switch filtros.SortBy {
	case "distrito":
		sortField = "c.distrito_nombre"
	case "cliente":
		sortField = "p.apellido"
	case "plan":
		sortField = "pl.nombre"
	default:
		sortField = "c.creado"
	}

	// Validar dirección de ordenamiento
	sortDir := "ASC"
	if filtros.SortDirection == "DESC" {
		sortDir = "DESC"
	}

	// Query de datos con paginación
	dataQuery := `
		SELECT 
			c.id_conexion,
			c.nro_conexion,
			CONCAT(p.nombre, ' ', p.apellido) AS cliente,
			CONCAT(
				c.distrito_nombre, ', ',
				c.departamento_nombre, ', ',
				c.provincia_nombre
			) AS direccion,
			c.latitud,
			c.longitud,
			CONCAT(pl.nombre, ' ', pl.velocidad_mbps, ' Mbps') AS plan,
			c.creado AS fecha_solicitud,
			c.id_estado_conexion,
			ec.nombre AS estado_conexion
	` + whereClause + `
		ORDER BY ` + sortField + ` ` + sortDir + `
		LIMIT ? OFFSET ?
	`

	// Agregar limit y offset a los argumentos
	queryArgs := append(args, filtros.Limit, filtros.Offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("error consultando solicitudes pendientes: %w", err)
	}
	defer rows.Close()

	var solicitudes []modelos.SolicitudPendiente
	for rows.Next() {
		var s modelos.SolicitudPendiente
		err := rows.Scan(
			&s.IDConexion,
			&s.NroConexion,
			&s.Cliente,
			&s.Direccion,
			&s.Latitud,
			&s.Longitud,
			&s.Plan,
			&s.FechaSolicitud,
			&s.IDEstadoConexion,
			&s.EstadoConexion,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("error escaneando solicitud pendiente: %w", err)
		}
		solicitudes = append(solicitudes, s)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("error iterando solicitudes pendientes: %w", err)
	}

	return solicitudes, total, nil
}

// ListarConexionesPorPersona obtiene las conexiones de una persona con paginación y ordenamiento
func (r *ConexionRepo) ListarConexionesPorPersona(
	ctx context.Context,
	idPersona int,
	limit int,
	offset int,
	sortBy string,
	sortOrder string,
) ([]modelos.ConexionDetalleCliente, error) {
	// Validar campo de ordenamiento
	sortField := "c.creado"
	switch sortBy {
	case "nro_conexion":
		sortField = "c.nro_conexion"
	case "estado":
		sortField = "ec.nombre"
	case "fecha_instalacion":
		sortField = "c.fecha_instalacion"
	case "distrito":
		sortField = "c.distrito_nombre"
	}

	// Validar dirección
	if sortOrder != "ASC" && sortOrder != "DESC" {
		sortOrder = "DESC"
	}

	query := fmt.Sprintf(`
		SELECT 
			c.id_conexion,
			c.nro_conexion,
			c.tipo_conexion,
			ec.nombre AS estado_conexion,
			DATE_FORMAT(c.fecha_instalacion, '%%Y-%%m-%%d') AS fecha_instalacion,
			DATE_FORMAT(c.fecha_baja, '%%Y-%%m-%%d') AS fecha_baja,
			d.calle,
			d.numero,
			d.piso,
			d.depto,
			c.distrito_nombre,
			c.departamento_nombre,
			c.provincia_nombre,
			c.latitud,
			c.longitud,
			pl.id_plan,
			pl.nombre AS plan_nombre,
			pl.velocidad_mbps,
			cont.id_contrato,
			cf.id_contrato_firma,
			COALESCE(cf.firmado, 0) AS firmado
	FROM conexion c
	INNER JOIN estado_conexion ec ON c.id_estado_conexion = ec.id_estado_conexion
	INNER JOIN plan pl ON c.id_plan = pl.id_plan
	LEFT JOIN direccion d ON c.id_direccion = d.id_direccion
	LEFT JOIN contrato cont ON c.id_conexion = cont.id_conexion AND cont.borrado IS NULL
	LEFT JOIN contrato_firma cf ON cont.id_contrato = cf.id_contrato
		WHERE c.id_persona = ?
		  AND c.borrado IS NULL
		ORDER BY %s %s
		LIMIT ? OFFSET ?
	`, sortField, sortOrder)

	rows, err := r.db.QueryContext(ctx, query, idPersona, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("error consultando conexiones: %w", err)
	}
	defer rows.Close()

	var conexiones []modelos.ConexionDetalleCliente
	for rows.Next() {
		var c modelos.ConexionDetalleCliente
		err := rows.Scan(
			&c.IDConexion,
			&c.NroConexion,
			&c.TipoConexion,
			&c.EstadoConexion,
			&c.FechaInstalacion,
			&c.FechaBaja,
			&c.Direccion.Calle,
			&c.Direccion.Numero,
			&c.Direccion.Piso,
			&c.Direccion.Depto,
			&c.Direccion.Distrito,
			&c.Direccion.Departamento,
			&c.Direccion.Provincia,
			&c.Latitud,
			&c.Longitud,
			&c.Plan.IDPlan,
			&c.Plan.Nombre,
			&c.Plan.VelocidadMbps,
			&c.IDContrato,
			&c.IDContratoFirma,
			&c.ContratoFirmado,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando conexión: %w", err)
		}
		conexiones = append(conexiones, c)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterando conexiones: %w", err)
	}

	return conexiones, nil
}

// ContarConexionesPorPersona cuenta el total de conexiones de una persona
func (r *ConexionRepo) ContarConexionesPorPersona(ctx context.Context, idPersona int) (int, error) {
	var total int
	query := `SELECT COUNT(*) FROM conexion WHERE id_persona = ? AND borrado IS NULL`
	err := r.db.QueryRowContext(ctx, query, idPersona).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("error contando conexiones: %w", err)
	}
	return total, nil
}

// ActualizarEstado actualiza el estado de una conexión
func (r *ConexionRepo) ActualizarEstado(ctx context.Context, idConexion, idNuevoEstado int) error {
	query := `
		UPDATE conexion
		SET id_estado_conexion = ?,
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
			Entity: "conexion",
			Campo:  "id_conexion",
			Valor:  fmt.Sprintf("%d", idConexion),
		}
	}
	
	return nil
}