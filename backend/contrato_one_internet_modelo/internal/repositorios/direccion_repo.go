package repositorios

import (
	"context"
	"contrato_one_internet_modelo/internal/modelos" 
	"contrato_one_internet_modelo/internal/utilidades" 
	"database/sql"
	"errors"
	"fmt"
)

// DireccionRepo maneja las operaciones de la base de datos para direcciones.
type DireccionRepo struct {
	db Execer
}

// NewDireccionRepo crea una instancia de DireccionRepo.
func NewDireccionRepo(db Execer) *DireccionRepo {
	return &DireccionRepo{db: db}
}

// =======================
//
//	MÉTODOS PRINCIPALES (CRUD y Lógica)
//
// =======================

// EncontrarOCrearDireccion busca una dirección por sus campos únicos y, si no la encuentra, la crea.
// Devuelve el ID de la dirección (ya sea existente o recién creada).
// Maneja condiciones de carrera (race conditions) en caso de inserciones concurrentes.
func (r *DireccionRepo) EncontrarOCrearDireccion(ctx context.Context, dir *modelos.Direccion) (int64, error) {

	// 1) Buscar dirección existente
	existingID, err := r.buscarDireccionExistente(ctx, dir)
	if err != nil {
		return 0, fmt.Errorf("error buscando dirección existente: %w", err)
	}
	if existingID > 0 {
		return existingID, nil
	}

	// 2) Intentar insertar nueva
	query := `
		INSERT INTO direccion (calle, numero, codigo_postal, piso, depto, id_distrito) 
		VALUES (?, ?, ?, ?, ?, ?)`
	res, err := r.db.ExecContext(ctx, query,
		dir.Calle, dir.Numero, dir.CodigoPostal, dir.Piso, dir.Depto, dir.IDDistrito,
	)

	if err != nil {
		// Manejo de error de clave duplicada
		if utilidades.IsDuplicateEntry(err) {
			// 3) Se produjo un race condition → recuperar ID existente
			existingID, err2 := r.buscarDireccionExistente(ctx, dir)
			if err2 != nil {
				return 0, fmt.Errorf("clave duplicada pero no se pudo recuperar dirección existente: %w", err2)
			}
			if existingID > 0 {
				return existingID, nil
			}
			// Si aun así no existe → devolver error traducido
			return 0, utilidades.TraducirErrorBD(err)
		}
		// Otro tipo de error
		return 0, utilidades.TraducirErrorBD(err)
	}

	// 4) Obtener ID insertado
	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error obteniendo ID insertado: %w", err)
	}

	return id, nil
}

// ObtenerDireccionPorID devuelve la dirección con el id proporcionado.
func (r *DireccionRepo) ObtenerDireccionPorID(ctx context.Context, idDireccion int) (*modelos.Direccion, error) {
	var d modelos.Direccion
	query := `
		SELECT id_direccion, calle, numero, codigo_postal, piso, depto, id_distrito, 
		       creado, ultimo_cambio, borrado 
		FROM direccion 
		WHERE id_direccion = ? LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, idDireccion).Scan(
		&d.ID,
		&d.Calle,
		&d.Numero,
		&d.CodigoPostal,
		&d.Piso,
		&d.Depto,
		&d.IDDistrito,
		&d.Creado,
		&d.UltimoCambio,
		&d.Borrado,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, utilidades.ErrNoEncontrado
		}
		return nil, err
	}
	return &d, nil
}

// ListarDirecciones obtiene direcciones activas (no borradas) con filtros y paginación.
func (r *DireccionRepo) ListarDirecciones(ctx context.Context, page, limit, idDistrito int, calle, codigoPostal, numero, orden string) ([]modelos.Direccion, int, error) {
	// 1) Construir query base con filtros WHERE
	where := " WHERE d.borrado IS NULL"
	args := []interface{}{}

	if idDistrito > 0 {
		where += " AND d.id_distrito = ?"
		args = append(args, idDistrito)
	}
	if calle != "" {
		where += " AND d.calle LIKE ?"
		args = append(args, "%"+calle+"%")
	}
	if codigoPostal != "" {
		where += " AND d.codigo_postal = ?"
		args = append(args, codigoPostal)
	}
	if numero != "" {
		where += " AND d.numero LIKE ?"
		args = append(args, "%"+numero+"%")
	}

	// 2) Contar total de registros que cumplen filtros
	countQuery := "SELECT COUNT(*) FROM direccion d" + where
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	if total == 0 {
		return []modelos.Direccion{}, 0, nil
	}

	// 3) Determinar ordenamiento
	orderBy := " ORDER BY d.creado DESC" // Default
	switch orden {
	case "calle_asc":
		orderBy = " ORDER BY d.calle ASC"
	case "calle_desc":
		orderBy = " ORDER BY d.calle DESC"
	case "creado_asc":
		orderBy = " ORDER BY d.creado ASC"
	case "creado_desc":
		orderBy = " ORDER BY d.creado DESC"
	case "codigo_postal_asc":
		orderBy = " ORDER BY d.codigo_postal ASC"
	case "codigo_postal_desc":
		orderBy = " ORDER BY d.codigo_postal DESC"
	}

	// 4) Calcular offset
	offset := (page - 1) * limit

	// 5) Construir y ejecutar query principal
	query := "SELECT d.id_direccion, d.calle, d.numero, d.codigo_postal, d.piso, d.depto, " +
		"d.id_distrito, d.creado, d.ultimo_cambio, d.borrado FROM direccion d" +
		where + orderBy + " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var direcciones []modelos.Direccion
	for rows.Next() {
		var d modelos.Direccion
		if err := rows.Scan(&d.ID, &d.Calle, &d.Numero, &d.CodigoPostal, &d.Piso, &d.Depto, &d.IDDistrito, &d.Creado, &d.UltimoCambio, &d.Borrado); err != nil {
			return nil, 0, err
		}
		direcciones = append(direcciones, d)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return direcciones, total, nil
}

// ActualizarDireccion actualiza una dirección existente (genérica, no vinculada a persona).
// Solo actualiza la fila en la tabla direccion si existe y no está borrada.
// Retorna error si la dirección no existe, está borrada, o si la actualización genera duplicado.
func (r *DireccionRepo) ActualizarDireccion(ctx context.Context, idDireccion int64, nueva *modelos.Direccion) error {
	// 1) Verificar que la dirección exista y no esté borrada
	var borrado *string
	err := r.db.QueryRowContext(ctx, `SELECT borrado FROM direccion WHERE id_direccion = ?`, idDireccion).Scan(&borrado)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNoEncontrado
		}
		return err
	}
	if borrado != nil {
		return utilidades.ErrNoEncontrado
	}

	// 2) Intentar actualizar directamente
	_, err = r.db.ExecContext(ctx, `
		UPDATE direccion
		SET calle = ?, numero = ?, codigo_postal = ?, piso = ?, depto = ?, id_distrito = ?
		WHERE id_direccion = ?
	`, nueva.Calle, nueva.Numero, nueva.CodigoPostal, nueva.Piso, nueva.Depto, nueva.IDDistrito, idDireccion)

	if err != nil {
		if utilidades.IsDuplicateEntry(err) {
			return utilidades.ErrDuplicado
		}
		return utilidades.TraducirErrorBD(err)
	}

	return nil
}

// BorrarDireccion ejecuta borrado lógico de una dirección (establece borrado = NOW()).
// Solo puede borrar direcciones que no estén referenciadas por persona, empresa o conexion.
func (r *DireccionRepo) BorrarDireccion(ctx context.Context, idDireccion int64) error {
	// 1) Verificar que la dirección exista y no esté ya borrada
	var borrado *string
	err := r.db.QueryRowContext(ctx, `SELECT borrado FROM direccion WHERE id_direccion = ?`, idDireccion).Scan(&borrado)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNoEncontrado
		}
		return err
	}
	if borrado != nil {
		return utilidades.ErrNoEncontrado
	}

	// 2) Contar referencias a esta dirección en todas las tablas
	var totalRefs int
	row := r.db.QueryRowContext(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM persona WHERE id_direccion = ?) +
			(SELECT COUNT(*) FROM empresa WHERE id_direccion = ?) +
			(SELECT COUNT(*) FROM conexion WHERE id_direccion = ?)
	`, idDireccion, idDireccion, idDireccion)
	if err := row.Scan(&totalRefs); err != nil {
		return err
	}

	// 3) Si hay referencias, no permitir borrado
	if totalRefs > 0 {
		return utilidades.ErrValidacion // O un error más específico "ErrDireccionEnUso"
	}

	// 4) Ejecutar borrado lógico
	_, err = r.db.ExecContext(ctx, `UPDATE direccion SET borrado = NOW() WHERE id_direccion = ?`, idDireccion)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}

	return nil
}

// ===========================
//
//	MÉTODOS DE ACTUALIZACIÓN DE ENTIDAD 
//
// ===========================

// ActualizarDireccionUsuario actualiza la dirección de una persona.
func (r *DireccionRepo) ActualizarDireccionUsuario(ctx context.Context, idPersona int64, nueva *modelos.Direccion) (int64, error) {
	// 1. Obtener dirección actual de la persona
	var idDireccionActual int64
	row := r.db.QueryRowContext(ctx, `SELECT id_direccion FROM persona WHERE id_persona = ?`, idPersona)
	if err := row.Scan(&idDireccionActual); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, utilidades.ErrNoEncontrado
		}
		return 0, fmt.Errorf("error obteniendo dirección actual del usuario: %w", err)
	}

	// 2. Definir la función 'actualizadora'
	actualizador := func(ctx context.Context, nuevoIDDireccion int64) error {
		// Obtenemos la jerarquía de la nueva dirección
		distrito, depto, prov, errGeo := r.ObtenerJerarquiaGeografica(ctx, nueva.IDDistrito)
		if errGeo != nil {
			return fmt.Errorf("error obteniendo jerarquía geográfica: %w", errGeo)
		}

		_, err := r.db.ExecContext(ctx, `
            UPDATE persona 
            SET id_direccion = ?, 
                distrito_nombre = ?, 
                departamento_nombre = ?, 
                provincia_nombre = ?
            WHERE id_persona = ?`,
			nuevoIDDireccion, distrito, depto, prov, idPersona)
		return err
	}

	// 3. Llamar al motor genérico
	return r.actualizarDireccionGenerica(ctx, idDireccionActual, nueva, actualizador)
}

// ActualizarDireccionConexion actualiza la dirección de una conexión.
func (r *DireccionRepo) ActualizarDireccionConexion(ctx context.Context, idConexion int64, nueva *modelos.Direccion) (int64, error) {
	// 1. Obtener dirección actual de la conexión
	var idDireccionActual int64
	row := r.db.QueryRowContext(ctx, `SELECT id_direccion FROM conexion WHERE id_conexion = ?`, idConexion)
	if err := row.Scan(&idDireccionActual); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, utilidades.ErrNoEncontrado
		}
		return 0, fmt.Errorf("error obteniendo dirección actual de la conexión: %w", err)
	}

	// 2. Definir la función 'actualizadora'
	actualizador := func(ctx context.Context, nuevoIDDireccion int64) error {
		distrito, depto, prov, errGeo := r.ObtenerJerarquiaGeografica(ctx, nueva.IDDistrito)
		if errGeo != nil {
			return fmt.Errorf("error obteniendo jerarquía geográfica: %w", errGeo)
		}

		_, err := r.db.ExecContext(ctx, `
            UPDATE conexion 
            SET id_direccion = ?, 
                distrito_nombre = ?, 
                departamento_nombre = ?, 
                provincia_nombre = ?
            WHERE id_conexion = ?`,
			nuevoIDDireccion, distrito, depto, prov, idConexion)
		return err
	}

	// 3. Llamar al motor genérico
	return r.actualizarDireccionGenerica(ctx, idDireccionActual, nueva, actualizador)
}

// ActualizarDireccionEmpresa actualiza la dirección de una empresa.
func (r *DireccionRepo) ActualizarDireccionEmpresa(ctx context.Context, idEmpresa int64, nueva *modelos.Direccion) (int64, error) {
	// 1. Obtener dirección actual de la empresa
	var idDireccionActual int64
	row := r.db.QueryRowContext(ctx, `SELECT id_direccion FROM empresa WHERE id_empresa = ?`, idEmpresa)
	if err := row.Scan(&idDireccionActual); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, utilidades.ErrNoEncontrado
		}
		return 0, fmt.Errorf("error obteniendo dirección actual de la empresa: %w", err)
	}

	// 2. Definir la función 'actualizadora'
	actualizador := func(ctx context.Context, nuevoIDDireccion int64) error {
		distrito, depto, prov, errGeo := r.ObtenerJerarquiaGeografica(ctx, nueva.IDDistrito)
		if errGeo != nil {
			return fmt.Errorf("error obteniendo jerarquía geográfica: %w", errGeo)
		}

		_, err := r.db.ExecContext(ctx, `
            UPDATE empresa 
            SET id_direccion = ?, 
                distrito_nombre = ?, 
                departamento_nombre = ?, 
                provincia_nombre = ?
            WHERE id_empresa = ?`,
			nuevoIDDireccion, distrito, depto, prov, idEmpresa)
		return err
	}

	// 3. Llamar al motor genérico
	return r.actualizarDireccionGenerica(ctx, idDireccionActual, nueva, actualizador)
}

// ===========================
//
//	MÉTODOS AUXILIARES
//
// ===========================

// buscarDireccionExistente busca una dirección por sus campos únicos.
// Devuelve el ID si la encuentra, o 0 si no existe.
func (r *DireccionRepo) buscarDireccionExistente(ctx context.Context, dir *modelos.Direccion) (int64, error) {
	var id int64
	query := `
        SELECT id_direccion
        FROM direccion
        WHERE calle = ?
        AND numero = ?
        AND piso <=> ?
        AND depto <=> ?
        AND id_distrito = ?
        AND codigo_postal = ?
        LIMIT 1`
	row := r.db.QueryRowContext(ctx, query,
		dir.Calle, dir.Numero, dir.Piso, dir.Depto, dir.IDDistrito, dir.CodigoPostal)
	err := row.Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil // No encontrado, no es un error
		}
		return 0, err // Error real de base de datos
	}

	return id, nil
}

// ObtenerJerarquiaGeografica devuelve los nombres de distrito, departamento y provincia para un ID de distrito.
func (r *DireccionRepo) ObtenerJerarquiaGeografica(ctx context.Context, idDistrito int) (string, string, string, error) {
	query := `
		SELECT 
			dt.nombre AS distrito,
			dp.nombre AS departamento,
			pr.nombre AS provincia
		FROM distrito dt
		INNER JOIN departamento dp ON dt.id_departamento = dp.id_departamento
		INNER JOIN provincia pr ON dp.id_provincia = pr.id_provincia
		WHERE dt.id_distrito = ?`
	var distrito, departamento, provincia string
	err := r.db.QueryRowContext(ctx, query, idDistrito).Scan(&distrito, &departamento, &provincia)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", "", "", utilidades.ErrNoEncontrado
		}
		return "", "", "", err
	}
	return distrito, departamento, provincia, nil
}

// =========================================
//
//	MÉTODO PRIVADO CENTRAL DE ACTUALIZACIÓN
//
// =========================================

// actualizarDireccionGenerica es el motor central para actualizar la dirección de cualquier entidad.
// Maneja la lógica de direcciones compartidas vs. no compartidas.
// Recibe el ID de la dirección actual y una función 'actualizarEntidadFn'.
// 'actualizarEntidadFn' es una función callback que sabe cómo apuntar la entidad (persona, empresa, etc.)
// al ID de la nueva dirección y actualizar sus campos redundantes.
func (r *DireccionRepo) actualizarDireccionGenerica(
	ctx context.Context,
	idDireccionActual int64,
	nueva *modelos.Direccion,
	actualizarEntidadFn func(ctx context.Context, nuevoIDDireccion int64) error,
) (int64, error) {

	// 1) Contar referencias a esta dirección en todas las tablas
	var totalRefs int
	row := r.db.QueryRowContext(ctx, `
        SELECT 
            (SELECT COUNT(*) FROM persona WHERE id_direccion = ?) +
            (SELECT COUNT(*) FROM empresa WHERE id_direccion = ?) +
            (SELECT COUNT(*) FROM conexion WHERE id_direccion = ?)
    `, idDireccionActual, idDireccionActual, idDireccionActual)
	if err := row.Scan(&totalRefs); err != nil {
		return 0, fmt.Errorf("error contando referencias a la dirección: %w", err)
	}

	// 2) Si está compartida, buscar o crear nueva dirección
	if totalRefs > 1 {
		idNueva, err := r.EncontrarOCrearDireccion(ctx, nueva)
		if err != nil {
			return 0, fmt.Errorf("error encontrando o creando nueva dirección: %w", err)
		}

		// Ejecutar la función callback para actualizar la entidad original
		if err := actualizarEntidadFn(ctx, idNueva); err != nil {
			return 0, fmt.Errorf("error asignando nueva dirección a la entidad: %w", err)
		}
		return idNueva, nil
	}

	// 3) No compartida (totalRefs = 1) → actualizar directamente
	_, err := r.db.ExecContext(ctx, `
        UPDATE direccion
        SET calle = ?, numero = ?, codigo_postal = ?, piso = ?, depto = ?, id_distrito = ?
        WHERE id_direccion = ?
    `, nueva.Calle, nueva.Numero, nueva.CodigoPostal, nueva.Piso, nueva.Depto, nueva.IDDistrito, idDireccionActual)

	if err != nil {
		// 3a) Manejo de colisión (la dirección actualizada es idéntica a otra existente)
		if utilidades.IsDuplicateEntry(err) {
			idExistente, err2 := r.buscarDireccionExistente(ctx, nueva)
			if err2 != nil {
				return 0, fmt.Errorf("clave duplicada pero no se pudo recuperar dirección existente: %w", err2)
			}
			if idExistente > 0 {
				// Ejecutar la función callback para actualizar la entidad original
				if err := actualizarEntidadFn(ctx, idExistente); err != nil {
					return 0, fmt.Errorf("error asignando dirección existente a la entidad: %w", err)
				}
				// Opcional: Borrar la 'idDireccionActual' que quedó huérfana.
				// Podrías llamar a r.BorrarDireccion(ctx, idDireccionActual)
				// BorrarDireccion ya verifica que no tenga referencias (y no debería tenerlas).
				return idExistente, nil
			}
			// Si no se encontró la dirección duplicada (raro), devolver el error original
			return 0, utilidades.TraducirErrorBD(err)
		} else {
			// 3b) Otro error de actualización
			return 0, fmt.Errorf("error actualizando dirección: %w", err)
		}
	}

	// 4) Si llegamos aquí, la dirección fue actualizada in-place.
	// Solo necesitamos actualizar los campos redundantes en la entidad.
	if err := actualizarEntidadFn(ctx, idDireccionActual); err != nil {
		return 0, fmt.Errorf("error actualizando campos redundantes en la entidad: %w", err)
	}

	return idDireccionActual, nil
}
/*
import (
	"context"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
	"database/sql"
	"errors"
	"fmt"
)

// DireccionRepo maneja las operaciones de la base de datos para direcciones.
type DireccionRepo struct {
	db Execer
}

// NewDireccionRepo crea una instancia de DireccionRepo.
func NewDireccionRepo(db Execer) *DireccionRepo {
	return &DireccionRepo{db: db}
}

// Crear inserta una nueva dirección y devuelve su ID.
//
// =======================
//
//	MÉTODO PRINCIPAL
//
// =======================
func (r *DireccionRepo) EncontrarOCrearDireccion(ctx context.Context, dir *modelos.Direccion) (int64, error) {

	// 1) Buscar dirección existente
	existingID, err := r.buscarDireccionExistente(ctx, dir)
	if err != nil {
		return 0, fmt.Errorf("error buscando dirección existente: %w", err)
	}
	if existingID > 0 {
		return existingID, nil
	}

	// 2) Intentar insertar nueva
	query := `INSERT INTO direccion (calle, numero, codigo_postal, piso, depto, id_distrito)
              VALUES (?, ?, ?, ?, ?, ?)`

	res, err := r.db.ExecContext(ctx, query,
		dir.Calle, dir.Numero, dir.CodigoPostal, dir.Piso, dir.Depto, dir.IDDistrito,
	)

	if err != nil {

		// ⚠️ Manejo de error de clave duplicada
		if utilidades.IsDuplicateEntry(err) {

			// 3) Se produjo un race condition → recuperar ID existente
			existingID, err2 := r.buscarDireccionExistente(ctx, dir)
			if err2 != nil {
				return 0, fmt.Errorf("clave duplicada pero no se pudo recuperar dirección existente: %w", err2)
			}
			if existingID > 0 {
				return existingID, nil
			}

			// Si aun así no existe → devolver error traducido
			return 0, utilidades.TraducirErrorBD(err)
		}

		// Otro tipo de error
		return 0, utilidades.TraducirErrorBD(err)
	}

	// 4) Obtener ID insertado
	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error obteniendo ID insertado: %w", err)
	}

	return id, nil
}

// ===========================
//
//	MÉTODO AUXILIAR
//
// ===========================
func (r *DireccionRepo) buscarDireccionExistente(ctx context.Context, dir *modelos.Direccion) (int64, error) {
	var id int64

	row := r.db.QueryRowContext(ctx, `
        SELECT id_direccion
        FROM direccion
        WHERE calle = ?
        AND numero = ?
        AND piso <=> ?
        AND depto <=> ?
        AND id_distrito = ?
        AND codigo_postal = ?
        LIMIT 1
    `, dir.Calle, dir.Numero, dir.Piso, dir.Depto, dir.IDDistrito, dir.CodigoPostal)

	err := row.Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}
		return 0, err
	}

	return id, nil
}

func (r *DireccionRepo) ObtenerJerarquiaGeografica(ctx context.Context, idDistrito int) (string, string, string, error) {
	query := `
		SELECT 
			dt.nombre AS distrito,
			dp.nombre AS departamento,
			pr.nombre AS provincia
		FROM distrito dt
		INNER JOIN departamento dp ON dt.id_departamento = dp.id_departamento
		INNER JOIN provincia pr ON dp.id_provincia = pr.id_provincia
		WHERE dt.id_distrito = ?
	`
	var distrito, departamento, provincia string
	err := r.db.QueryRowContext(ctx, query, idDistrito).Scan(&distrito, &departamento, &provincia)
	if err != nil {
		return "", "", "", err
	}
	return distrito, departamento, provincia, nil
}

// ObtenerDireccionPorID devuelve la dirección con el id proporcionado.
func (r *DireccionRepo) ObtenerDireccionPorID(ctx context.Context, idDireccion int) (*modelos.Direccion, error) {
	var d modelos.Direccion
	query := `SELECT id_direccion, calle, numero, codigo_postal, piso, depto, id_distrito, creado, ultimo_cambio, borrado FROM direccion WHERE id_direccion = ? LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, idDireccion).Scan(
		&d.ID,
		&d.Calle,
		&d.Numero,
		&d.CodigoPostal,
		&d.Piso,
		&d.Depto,
		&d.IDDistrito,
		&d.Creado,
		&d.UltimoCambio,
		&d.Borrado,
	)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *DireccionRepo) ActualizarDireccionUsuario(ctx context.Context, idPersona int64, nueva *modelos.Direccion) (int64, error) {
	// 1) Obtener dirección actual del usuario
	var idDireccionActual int64
	row := r.db.QueryRowContext(ctx, `
        SELECT id_direccion
        FROM persona
        WHERE id_persona = ?
    `, idPersona)

	if err := row.Scan(&idDireccionActual); err != nil {
		return 0, fmt.Errorf("error obteniendo dirección actual del usuario: %w", err)
	}

	// 2) Contar referencias a esta dirección en todas las tablas
	var totalRefs int
	row = r.db.QueryRowContext(ctx, `
        SELECT 
            (SELECT COUNT(*) FROM persona WHERE id_direccion = ?) +
            (SELECT COUNT(*) FROM empresa WHERE id_direccion = ?) +
            (SELECT COUNT(*) FROM conexion WHERE id_direccion = ?)
    `, idDireccionActual, idDireccionActual, idDireccionActual)

	if err := row.Scan(&totalRefs); err != nil {
		return 0, fmt.Errorf("error contando referencias a la dirección: %w", err)
	}

	// 3) Si está compartida, buscar o crear nueva dirección
	if totalRefs > 1 {
		idNueva, err := r.EncontrarOCrearDireccion(ctx, nueva)
		if err != nil {
			return 0, fmt.Errorf("error encontrando o creando nueva dirección: %w", err)
		}

		_, err = r.db.ExecContext(ctx, `UPDATE persona SET id_direccion = ? WHERE id_persona = ?`, idNueva, idPersona)
		if err != nil {
			return 0, fmt.Errorf("error asignando nueva dirección al usuario: %w", err)
		}

		return idNueva, nil
	}

	// 4) No compartida → actualizar directamente
	_, err := r.db.ExecContext(ctx, `
        UPDATE direccion
        SET calle = ?, numero = ?, codigo_postal = ?, piso = ?, depto = ?, id_distrito = ?
        WHERE id_direccion = ?
    `, nueva.Calle, nueva.Numero, nueva.CodigoPostal, nueva.Piso, nueva.Depto, nueva.IDDistrito, idDireccionActual)

	if err != nil {
		if utilidades.IsDuplicateEntry(err) {
			idExistente, err2 := r.buscarDireccionExistente(ctx, nueva)
			if err2 != nil {
				return 0, fmt.Errorf("clave duplicada pero no se pudo recuperar dirección existente: %w", err2)
			}
			if idExistente > 0 {
				_, err2 = r.db.ExecContext(ctx, `UPDATE persona SET id_direccion = ? WHERE id_persona = ?`, idExistente, idPersona)
				if err2 != nil {
					return 0, fmt.Errorf("error asignando dirección existente al usuario: %w", err2)
				}
				return idExistente, nil
			}
		} else {
			return 0, fmt.Errorf("error actualizando dirección: %w", err)
		}
	}

	// Si llegamos aquí, la dirección fue actualizada in-place.
	return idDireccionActual, nil
}

// ListarDirecciones obtiene direcciones activas (no borradas) con filtros y paginación.
// Parámetros:
//   - page: número de página (1-indexed)
//   - limit: cantidad de registros por página
//   - idDistrito: filtro opcional por distrito (0 = sin filtro)
//   - calle: filtro opcional por coincidencia parcial en calle (case-insensitive)
//   - codigoPostal: filtro opcional por código postal exacto
//   - numero: filtro opcional por coincidencia parcial en número
//   - orden: campo y dirección de ordenamiento (ej: "calle_asc", "creado_desc")
func (r *DireccionRepo) ListarDirecciones(ctx context.Context, page, limit, idDistrito int, calle, codigoPostal, numero, orden string) ([]modelos.Direccion, int, error) {
	// 1) Construir query base con filtros WHERE
	where := " WHERE d.borrado IS NULL"
	args := []interface{}{}

	if idDistrito > 0 {
		where += " AND d.id_distrito = ?"
		args = append(args, idDistrito)
	}
	if calle != "" {
		where += " AND d.calle LIKE ?"
		args = append(args, "%"+calle+"%")
	}
	if codigoPostal != "" {
		where += " AND d.codigo_postal = ?"
		args = append(args, codigoPostal)
	}
	if numero != "" {
		where += " AND d.numero LIKE ?"
		args = append(args, "%"+numero+"%")
	}

	// 2) Contar total de registros que cumplen filtros
	countQuery := "SELECT COUNT(*) FROM direccion d" + where
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// 3) Determinar ordenamiento
	orderBy := " ORDER BY d.creado DESC"
	switch orden {
	case "calle_asc":
		orderBy = " ORDER BY d.calle ASC"
	case "calle_desc":
		orderBy = " ORDER BY d.calle DESC"
	case "creado_asc":
		orderBy = " ORDER BY d.creado ASC"
	case "creado_desc":
		orderBy = " ORDER BY d.creado DESC"
	case "codigo_postal_asc":
		orderBy = " ORDER BY d.codigo_postal ASC"
	case "codigo_postal_desc":
		orderBy = " ORDER BY d.codigo_postal DESC"
	}

	// 4) Calcular offset
	offset := (page - 1) * limit

	// 5) Construir y ejecutar query principal
	query := "SELECT d.id_direccion, d.calle, d.numero, d.codigo_postal, d.piso, d.depto, d.id_distrito, d.creado, d.ultimo_cambio, d.borrado FROM direccion d" +
		where + orderBy + " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var direcciones []modelos.Direccion
	for rows.Next() {
		var d modelos.Direccion
		if err := rows.Scan(&d.ID, &d.Calle, &d.Numero, &d.CodigoPostal, &d.Piso, &d.Depto, &d.IDDistrito, &d.Creado, &d.UltimoCambio, &d.Borrado); err != nil {
			return nil, 0, err
		}
		direcciones = append(direcciones, d)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return direcciones, total, nil
}

// ActualizarDireccion actualiza una dirección existente (genérica, no vinculada a persona).
// Solo actualiza la fila en la tabla direccion si existe y no está borrada.
// Retorna error si la dirección no existe, está borrada, o si la actualización genera duplicate.
func (r *DireccionRepo) ActualizarDireccion(ctx context.Context, idDireccion int64, nueva *modelos.Direccion) error {
	// 1) Verificar que la dirección exista y no esté borrada
	var borrado *string
	err := r.db.QueryRowContext(ctx, `SELECT borrado FROM direccion WHERE id_direccion = ?`, idDireccion).Scan(&borrado)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNoEncontrado
		}
		return err
	}
	if borrado != nil {
		return utilidades.ErrNoEncontrado
	}

	// 2) Intentar actualizar directamente
	_, err = r.db.ExecContext(ctx, `
		UPDATE direccion
		SET calle = ?, numero = ?, codigo_postal = ?, piso = ?, depto = ?, id_distrito = ?
		WHERE id_direccion = ?
	`, nueva.Calle, nueva.Numero, nueva.CodigoPostal, nueva.Piso, nueva.Depto, nueva.IDDistrito, idDireccion)

	if err != nil {
		if utilidades.IsDuplicateEntry(err) {
			return utilidades.ErrDuplicado
		}
		return utilidades.TraducirErrorBD(err)
	}

	return nil
}

// BorrarDireccion ejecuta borrado lógico de una dirección (establece borrado = NOW()).
// Solo puede borrar direcciones que no estén referenciadas por persona, empresa o conexion.
func (r *DireccionRepo) BorrarDireccion(ctx context.Context, idDireccion int64) error {
	// 1) Verificar que la dirección exista y no esté ya borrada
	var borrado *string
	err := r.db.QueryRowContext(ctx, `SELECT borrado FROM direccion WHERE id_direccion = ?`, idDireccion).Scan(&borrado)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNoEncontrado
		}
		return err
	}
	if borrado != nil {
		return utilidades.ErrNoEncontrado
	}

	// 2) Contar referencias a esta dirección en todas las tablas
	var totalRefs int
	row := r.db.QueryRowContext(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM persona WHERE id_direccion = ?) +
			(SELECT COUNT(*) FROM empresa WHERE id_direccion = ?) +
			(SELECT COUNT(*) FROM conexion WHERE id_direccion = ?)
	`, idDireccion, idDireccion, idDireccion)
	if err := row.Scan(&totalRefs); err != nil {
		return err
	}

	// 3) Si hay referencias, no permitir borrado
	if totalRefs > 0 {
		return utilidades.ErrValidacion
	}

	// 4) Ejecutar borrado lógico
	_, err = r.db.ExecContext(ctx, `UPDATE direccion SET borrado = NOW() WHERE id_direccion = ?`, idDireccion)
	if err != nil {
		return utilidades.TraducirErrorBD(err)
	}

	return nil
}
*/