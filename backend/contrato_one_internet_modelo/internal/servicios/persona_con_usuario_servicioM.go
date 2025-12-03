package servicios

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

// UsuarioService encapsula la lógica de negocio para la creación de usuarios.
type UsuarioService struct {
	db *sql.DB
}

// NewUsuarioService crea una nueva instancia de UsuarioService.
func NewUsuarioService(db *sql.DB) *UsuarioService {
	return &UsuarioService{db: db}
}

// CrearPersonaYUsuarioResponse es la estructura de la respuesta del servicio.
type CrearPersonaYUsuarioResponse struct {
	IDPersona       int64     `json:"id_persona"`
	IDUsuario       int64     `json:"id_usuario"`
	Token           string    `json:"token"`
	Email           string    `json:"email"`
	ExpiracionToken time.Time `json:"expiracion_token"`
}

// CrearPersonaYUsuario gestiona la creación transaccional completa.
func (s *UsuarioService) CrearPersonaYUsuario(ctx context.Context, persona modelos.Persona, direccion modelos.Direccion, password string) (*CrearPersonaYUsuarioResponse, error) {
	logger.Debug.Printf("Entrando a CrearPersonaYUsuario con email: %s", persona.Email)
	// En el flujo de registro público permitimos que IDUsuarioCreador sea nil.
	// Si no se provee, lo dejamos nil y no seteamos la variable de sesión en la BD.

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("Error al iniciar transacción: %v", err)
		return nil, err
	}

	// Si se proporciona IDUsuarioCreador, setear la variable de sesión para el trigger.
	if persona.IDUsuarioCreador != nil && *persona.IDUsuarioCreador != 0 {
		_, err = tx.ExecContext(ctx, "SET @session_user_id = ?", persona.IDUsuarioCreador)
		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("error seteando variable de sesión para auditoría: %v", err)
		}
	}

	defer tx.Rollback()

	// Repositorios que operan dentro de la transacción
	direccionRepo := repositorios.NewDireccionRepo(tx)
	personaRepo := repositorios.NewPersonaRepo(tx)
	usuarioRepo := repositorios.NewUsuarioRepo(tx)
	tokenRepo := repositorios.NewTokenRepo(tx)

	// 1. Crear Dirección
	idDireccion, err := direccionRepo.EncontrarOCrearDireccion(ctx, &direccion)
	if err != nil {
		logger.Error.Printf("Error al crear dirección: %v", err)
		return nil, err
	}
	persona.IDDireccion = int(idDireccion)

	// Obtener los nombres redundantes
	distrito, departamento, provincia, err := direccionRepo.ObtenerJerarquiaGeografica(ctx, direccion.IDDistrito)
	if err != nil {
		logger.Error.Printf("Error al obtener jerarquía geográfica: %v", err)
		return nil, fmt.Errorf("error obteniendo jerarquía geográfica: %w", err)
	}

	persona.DistritoNombre = &distrito
	persona.DepartamentoNombre = &departamento
	persona.ProvinciaNombre = &provincia

	// 2. Crear Persona
	idPersona, err := personaRepo.CrearPersona(ctx, &persona)
	if err != nil {
		logger.Error.Printf("Error al crear persona: %v", err)
		return nil, err
	}

	// 3. Hash de la contraseña
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error.Printf("Error al hashear la contraseña: %v", err)
		return nil, fmt.Errorf("error al hashear la contraseña: %v", err)
	}

	// 4. Crear Usuario
	now := time.Now()
	fechaCorte, _ := time.Parse("2006-01-02", "2025-01-01")
	requiereVerificacion := now.After(fechaCorte)

	nuevoUsuario := &modelos.Usuario{
		Email:                persona.Email,
		PasswordHash:         string(hashPassword),
		IDPersona:            int(idPersona),
		Borrado:              nil,
		EmailVerificado:      false,
		RequiereVerificacion: requiereVerificacion,
		Creado:               now,
		IDUsuarioCreador:     persona.IDUsuarioCreador,
	}
	idUsuario, err := usuarioRepo.CrearUsuario(ctx, nuevoUsuario)
	if err != nil {
		logger.Error.Printf("Error al crear usuario: %v", err)
		return nil, err
	}

	// 4.1 Asignar rol "cliente"
	usuarioRolRepo := repositorios.NewUsuarioRolRepo(tx)
	if err := usuarioRolRepo.AsignarRol(ctx, idUsuario, "cliente"); err != nil {
		logger.Error.Printf("Error al asignar rol cliente: %v", err)
		return nil, fmt.Errorf("no se pudo asignar el rol cliente: %w", err)
	}

	// 5. Generar y Crear Token de Verificación de Email
	tokenStr, err := utilidades.GenerarTokenSeguro(utilidades.TokenSize32)
	if err != nil {
		logger.Error.Printf("Error al generar token de verificación: %v", err)
		return nil, err
	}
	tokenRecord := &modelos.EmailVerificacionToken{
		IDUsuario:  int(idUsuario),
		Token:      tokenStr,
		Expiracion: now.Add(24 * time.Hour),
		Creado:     now,
	}
	if err := tokenRepo.CrearEmailVerificacionToken(ctx, tokenRecord); err != nil {
		logger.Error.Printf("Error al crear email de verificación: %v", err)
		return nil, err
	}

	// 6. Commit
	if err := tx.Commit(); err != nil {
		logger.Error.Printf("Error al hacer commit de la transacción: %v", err)
		return nil, err
	}

	return &CrearPersonaYUsuarioResponse{
		IDPersona: idPersona,
		IDUsuario: idUsuario,
		Token:     tokenStr,
		Email:     persona.Email,
		// incluir expiración del token para que el controlador pueda construir el link
		ExpiracionToken: tokenRecord.Expiracion,
	}, nil
}

// PerfilPersonaResponse representa la respuesta combinada de persona + dirección
type PerfilPersonaResponse struct {
	IDPersona           int              `json:"id_persona"`
	Nombre              string           `json:"nombre"`
	Apellido            string           `json:"apellido"`
	Sexo                string           `json:"sexo"`
	DNI                 string           `json:"dni"`
	Cuil                *string          `json:"cuil,omitempty"`
	FechaNacimiento     utilidades.Fecha `json:"fecha_nacimiento"`
	Telefono            string           `json:"telefono"`
	TelefonoAlternativo *string          `json:"telefono_alternativo,omitempty"`
	Email               string           `json:"email"`
	Direccion           struct {
		Calle        string  `json:"calle"`
		Numero       string  `json:"numero"`
		Piso         *string `json:"piso,omitempty"`
		Depto        *string `json:"depto,omitempty"`
		Distrito     string  `json:"distrito"`
		Departamento string  `json:"departamento"`
		Provincia    string  `json:"provincia"`
		CodigoPostal string  `json:"codigo_postal"`
	} `json:"direccion"`
}

// ObtenerPerfilPorUsuarioID retorna los datos completos de la persona asociada a idUsuario.
func (s *UsuarioService) ObtenerPerfilPorUsuarioID(ctx context.Context, idUsuario int) (*PerfilPersonaResponse, error) {
	personaRepo := repositorios.NewPersonaRepo(s.db)
	direccionRepo := repositorios.NewDireccionRepo(s.db)

	// 1. Obtener la persona a partir del id de usuario
	p, err := personaRepo.ObtenerPersonaPorUsuarioID(ctx, idUsuario)
	if err != nil {
		return nil, err
	}

	// 2. Obtener la dirección por id
	d, err := direccionRepo.ObtenerDireccionPorID(ctx, p.IDDireccion)
	if err != nil {
		return nil, err
	}

	// 3. Obtener jerarquía geográfica (nombres)
	distrito, departamento, provincia, err := direccionRepo.ObtenerJerarquiaGeografica(ctx, d.IDDistrito)
	if err != nil {
		return nil, err
	}

	// 4. Construir respuesta
	var resp PerfilPersonaResponse
	resp.IDPersona = p.ID
	resp.Nombre = p.Nombre
	resp.Apellido = p.Apellido
	resp.Sexo = p.Sexo
	resp.DNI = p.DNI
	resp.Cuil = p.Cuil
	resp.FechaNacimiento = p.FechaNacimiento
	resp.Telefono = p.Telefono
	resp.TelefonoAlternativo = p.TelefonoAlternativo
	resp.Email = p.Email

	resp.Direccion.Calle = d.Calle
	resp.Direccion.Numero = d.Numero
	resp.Direccion.Piso = d.Piso
	resp.Direccion.Depto = d.Depto
	resp.Direccion.Distrito = distrito
	resp.Direccion.Departamento = departamento
	resp.Direccion.Provincia = provincia
	resp.Direccion.CodigoPostal = d.CodigoPostal

	return &resp, nil
}

// ObtenerDireccionPorPersonaID devuelve solo la dirección (y nombres geográficos) para la persona solicitada.
func (s *UsuarioService) ObtenerDireccionPorPersonaID(ctx context.Context, idPersona int) (map[string]interface{}, error) {
	// Obtener id_direccion desde tabla persona
	var idDireccion int
	err := s.db.QueryRowContext(ctx, `SELECT id_direccion FROM persona WHERE id_persona = ? LIMIT 1`, idPersona).Scan(&idDireccion)
	if err != nil {
		return nil, err
	}

	direccionRepo := repositorios.NewDireccionRepo(s.db)
	d, err := direccionRepo.ObtenerDireccionPorID(ctx, idDireccion)
	if err != nil {
		return nil, err
	}
	distrito, departamento, provincia, err := direccionRepo.ObtenerJerarquiaGeografica(ctx, d.IDDistrito)
	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"id_direccion":  d.ID,
		"calle":         d.Calle,
		"numero":        d.Numero,
		"piso":          d.Piso,
		"depto":         d.Depto,
		"distrito":      distrito,
		"departamento":  departamento,
		"provincia":     provincia,
		"codigo_postal": d.CodigoPostal,
	}
	return result, nil
}

// ListarUsuariosPaginado devuelve una lista paginada de personas activas (no borradas)
// con filtros opcionales y ordenamiento. Retorna un mapa listo para serializar.
func (s *UsuarioService) ListarUsuariosPaginado(ctx context.Context, page, limit int, nombre, apellido, dni, cuil, email string, idEmpresa int, sortBy, sortDir string) (map[string]interface{}, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// validar sort_by
	var sortCol string
	switch sortBy {
	case "nombre":
		sortCol = "p.nombre"
	case "apellido":
		sortCol = "p.apellido"
	case "email":
		sortCol = "p.email"
	case "creado":
		sortCol = "u.creado"
	default:
		sortCol = "p.nombre"
	}
	// validar sort_dir
	sd := strings.ToUpper(sortDir)
	if sd != "ASC" && sd != "DESC" {
		sd = "DESC"
	}

	// Construir filtros
	where := "WHERE (p.borrado IS NULL OR p.borrado = 0)"
	args := []interface{}{}
	if nombre != "" {
		where += " AND p.nombre LIKE ?"
		args = append(args, "%"+nombre+"%")
	}
	if apellido != "" {
		where += " AND p.apellido LIKE ?"
		args = append(args, "%"+apellido+"%")
	}
	if dni != "" {
		where += " AND p.dni = ?"
		args = append(args, dni)
	}
	if cuil != "" {
		where += " AND p.cuil = ?"
		args = append(args, cuil)
	}
	if email != "" {
		where += " AND p.email LIKE ?"
		args = append(args, "%"+email+"%")
	}
	if idEmpresa > 0 {
		where += " AND EXISTS (SELECT 1 FROM persona_vinculo_empresa v WHERE v.id_persona = p.id_persona AND v.id_empresa = ? AND (v.borrado IS NULL OR v.borrado = 0))"
		args = append(args, idEmpresa)
	}

	// Contar total
	var total int
	countQuery := "SELECT COUNT(1) FROM persona p " + where
	if err := s.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		logger.Error.Printf("Error contando personas: %v", err)
		return nil, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	offset := (page - 1) * limit

	// Traer filas
	// Unir usuario para poder ordenar por creado si corresponde
	selectQuery := `SELECT p.id_persona, p.nombre, p.apellido, p.sexo, p.dni, p.cuil, p.fecha_nacimiento, p.telefono, p.telefono_alternativo, p.email, p.id_direccion
		FROM persona p
		LEFT JOIN usuario u ON u.id_persona = p.id_persona AND (u.borrado IS NULL OR u.borrado = 0)` + " " + where + fmt.Sprintf(" ORDER BY %s %s LIMIT ? OFFSET ?", sortCol, sd)

	// agregar limit/offset a args finales
	argsWithLimit := append([]interface{}{}, args...)
	argsWithLimit = append(argsWithLimit, limit, offset)

	rows, err := s.db.QueryContext(ctx, selectQuery, argsWithLimit...)
	if err != nil {
		logger.Error.Printf("Error listando personas: %v", err)
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	direccionRepo := repositorios.NewDireccionRepo(s.db)
	for rows.Next() {
		var idPersona int
		var nombreVal, apellidoVal, sexo, dniVal, telefono, emailVal string
		var cuilPtr *string
		var fechaNacimiento utilidades.Fecha
		var telefonoAltPtr *string
		var idDireccion int

		if err := rows.Scan(&idPersona, &nombreVal, &apellidoVal, &sexo, &dniVal, &cuilPtr, &fechaNacimiento, &telefono, &telefonoAltPtr, &emailVal, &idDireccion); err != nil {
			logger.Error.Printf("Error scan persona: %v", err)
			return nil, err
		}

		// Obtener dirección
		dir, err := direccionRepo.ObtenerDireccionPorID(ctx, idDireccion)
		if err != nil {
			logger.Error.Printf("Error obteniendo dirección para persona %d: %v", idPersona, err)
			return nil, err
		}
		distrito, departamento, provincia, err := direccionRepo.ObtenerJerarquiaGeografica(ctx, dir.IDDistrito)
		if err != nil {
			logger.Error.Printf("Error obteniendo jerarquía geográfica: %v", err)
			return nil, err
		}

		direccionMap := map[string]interface{}{
			"calle":         dir.Calle,
			"numero":        dir.Numero,
			"piso":          dir.Piso,
			"depto":         dir.Depto,
			"distrito":      distrito,
			"departamento":  departamento,
			"provincia":     provincia,
			"codigo_postal": dir.CodigoPostal,
		}

		m := map[string]interface{}{
			"id_persona":           idPersona,
			"nombre":               nombreVal,
			"apellido":             apellidoVal,
			"sexo":                 sexo,
			"dni":                  dniVal,
			"cuil":                 cuilPtr,
			"fecha_nacimiento":     fechaNacimiento,
			"telefono":             telefono,
			"telefono_alternativo": telefonoAltPtr,
			"email":                emailVal,
			"direccion":            direccionMap,
		}
		results = append(results, m)
	}

	return map[string]interface{}{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"data":        results,
	}, nil
}

// PerfilUpdateRequest representa los campos permitidos para actualizar el perfil.
type PerfilUpdateRequest struct {
	Nombre              *string `json:"nombre,omitempty"`
	Apellido            *string `json:"apellido,omitempty"`
	Telefono            *string `json:"telefono,omitempty"`
	TelefonoAlternativo *string `json:"telefono_alternativo,omitempty"`
	Email               *string `json:"email,omitempty"`
	Direccion           *struct {
		Calle        *string `json:"calle,omitempty"`
		Numero       *string `json:"numero,omitempty"`
		Piso         *string `json:"piso,omitempty"`
		Depto        *string `json:"depto,omitempty"`
		CodigoPostal *string `json:"codigo_postal,omitempty"`
		IDDistrito   *int    `json:"id_distrito,omitempty"`
	} `json:"direccion,omitempty"`
}

// ActualizarPerfilPorUsuarioID actualiza los datos parciales de la persona asociada al idUsuario.
// Ejecuta una transacción que puede actualizar persona, direccion y usuario (si cambia el email).
// Devuelve (emailVerificacionEnviada, token, nuevoEmail, error)
func (s *UsuarioService) ActualizarPerfilPorUsuarioID(ctx context.Context, idUsuario int, req map[string]interface{}) (bool, string, string, error) {
	// 1) Obtener id_persona para este usuario
	var idPersona int
	err := s.db.QueryRowContext(ctx, `SELECT id_persona FROM usuario WHERE id_usuario = ? LIMIT 1`, idUsuario).Scan(&idPersona)
	if err != nil {
		return false, "", "", err
	}

	// 2) Iniciar transacción
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, "", "", err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	// Track whether we need to send verification email
	sendVerification := false
	var verificationToken string
	var newEmail string

	// 3) Actualizar persona (campos que vengan)
	personaUpdates := []string{}
	personaArgs := []interface{}{}

	// Helper para extraer string del mapa
	extractString := func(key string) (string, bool) {
		if val, exists := req[key]; exists {
			if val == nil {
				return "", true // null explícito
			}
			if str, ok := val.(string); ok {
				return str, true
			}
		}
		return "", false
	}

	if val, exists := extractString("nombre"); exists {
		personaUpdates = append(personaUpdates, "nombre = ?")
		if val == "" {
			personaArgs = append(personaArgs, nil)
		} else {
			personaArgs = append(personaArgs, val)
		}
	}
	if val, exists := extractString("apellido"); exists {
		personaUpdates = append(personaUpdates, "apellido = ?")
		if val == "" {
			personaArgs = append(personaArgs, nil)
		} else {
			personaArgs = append(personaArgs, val)
		}
	}
	if val, exists := extractString("telefono"); exists {
		personaUpdates = append(personaUpdates, "telefono = ?")
		if val == "" {
			personaArgs = append(personaArgs, nil)
		} else {
			personaArgs = append(personaArgs, val)
		}
	}

	// CRITICAL: TelefonoAlternativo debe poder pasar de null → valor → null
	if val, exists := extractString("telefono_alternativo"); exists {
		personaUpdates = append(personaUpdates, "telefono_alternativo = ?")
		if val == "" {
			// Si el valor es string vacío o null, establecer NULL en la BD
			personaArgs = append(personaArgs, nil)
		} else {
			personaArgs = append(personaArgs, val)
		}
	}

	// Email: si cambia, validar unicidad y actualizar en usuario + persona
	if emailVal, exists := extractString("email"); exists {
		// verificar que no exista en otro usuario
		var exists int
		err = tx.QueryRowContext(ctx, `SELECT COUNT(1) FROM usuario WHERE email = ? AND id_usuario != ? AND (borrado IS NULL OR borrado = 0)`, emailVal, idUsuario).Scan(&exists)
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		if exists > 0 {
			_ = tx.Rollback()
			return false, "", "", utilidades.ErrEmailDuplicado
		}
		// También verificar contra persona.email (por si hay duplicados en tabla persona)
		err = tx.QueryRowContext(ctx, `SELECT COUNT(1) FROM persona WHERE email = ? AND id_persona != ? AND (borrado IS NULL OR borrado = 0)`, emailVal, idPersona).Scan(&exists)
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		if exists > 0 {
			_ = tx.Rollback()
			return false, "", "", utilidades.ErrEmailDuplicado
		}

		// Si pasa validaciones, actualizar persona.email (más abajo) y usuario.email
		personaUpdates = append(personaUpdates, "email = ?")
		personaArgs = append(personaArgs, emailVal)

		// Actualizar usuario.email y flags
		if _, err := tx.ExecContext(ctx, `UPDATE usuario SET email = ?, email_verificado = 0, requiere_verificacion = 1 WHERE id_usuario = ?`, emailVal, idUsuario); err != nil {
			_ = tx.Rollback()
			return false, "", "", utilidades.TraducirErrorBD(err)
		}
		sendVerification = true
		newEmail = emailVal
	}

	// 4) Si hay actualizaciones de persona, ejecutar UPDATE
	if len(personaUpdates) > 0 {
		personaArgs = append(personaArgs, idPersona)
		q := "UPDATE persona SET " + strings.Join(personaUpdates, ", ") + " WHERE id_persona = ?"
		if _, err := tx.ExecContext(ctx, q, personaArgs...); err != nil {
			_ = tx.Rollback()
			return false, "", "", utilidades.TraducirErrorBD(err)
		}
	}

	// 5) Actualizar direccion si viene objeto direccion con al menos un campo
	if direccionRaw, ok := req["direccion"]; ok && direccionRaw != nil {
		// Convertir el map de direccion
		direccionMap, ok := direccionRaw.(map[string]interface{})
		if !ok {
			_ = tx.Rollback()
			return false, "", "", errors.New("formato inválido de direccion")
		}

		direccionRepo := repositorios.NewDireccionRepo(tx)

		// Obtener id_direccion actual de persona
		var idDireccion int
		if err := tx.QueryRowContext(ctx, `SELECT id_direccion FROM persona WHERE id_persona = ? LIMIT 1`, idPersona).Scan(&idDireccion); err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}

		// Obtener dirección actual completa
		actualDir, err := direccionRepo.ObtenerDireccionPorID(ctx, idDireccion)
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}

		// Construir nueva dirección empezando por los valores actuales
		nueva := *actualDir

		// Helper para extraer string de direccion
		extractDirString := func(key string) (string, bool) {
			if val, exists := direccionMap[key]; exists {
				if val == nil {
					return "", true // null explícito
				}
				if str, ok := val.(string); ok {
					return str, true
				}
			}
			return "", false
		}

		// Helper para extraer int de direccion
		extractDirInt := func(key string) (int, bool) {
			if val, exists := direccionMap[key]; exists {
				if val == nil {
					return 0, false
				}
				if num, ok := val.(float64); ok {
					return int(num), true
				}
			}
			return 0, false
		}

		if val, exists := extractDirString("calle"); exists {
			nueva.Calle = val
		}
		if val, exists := extractDirString("numero"); exists {
			nueva.Numero = val
		}
		if val, exists := extractDirString("piso"); exists {
			if val == "" {
				nueva.Piso = nil
			} else {
				nueva.Piso = &val
			}
		}
		if val, exists := extractDirString("depto"); exists {
			if val == "" {
				nueva.Depto = nil
			} else {
				nueva.Depto = &val
			}
		}
		if val, exists := extractDirString("codigo_postal"); exists {
			nueva.CodigoPostal = val
		}

		if val, exists := extractDirInt("id_distrito"); exists {
			// validar que distrito exista y no esté borrado
			var cnt int
			err = tx.QueryRowContext(ctx, `SELECT COUNT(1) FROM distrito WHERE id_distrito = ? AND (borrado IS NULL OR borrado = 0)`, val).Scan(&cnt)
			if err != nil {
				_ = tx.Rollback()
				return false, "", "", err
			}
			if cnt == 0 {
				_ = tx.Rollback()
				return false, "", "", utilidades.ErrNoEncontrado
			}
			nueva.IDDistrito = val
		}

		// Llamar al repositorio para actualizar/reenlazar la dirección y obtener id final
		finalID, err := direccionRepo.ActualizarDireccionUsuario(ctx, int64(idPersona), &nueva)
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}

		// Si finalID difiere de la anterior, asegurar persona.id_direccion (repositorio ya lo hizo en algunos casos,
		// pero no está de más asegurarlo aquí)
		if int(finalID) != idDireccion {
			if _, err := tx.ExecContext(ctx, `UPDATE persona SET id_direccion = ? WHERE id_persona = ?`, finalID, idPersona); err != nil {
				_ = tx.Rollback()
				return false, "", "", utilidades.TraducirErrorBD(err)
			}
		}

		// Actualizar nombres redundantes (distrito, departamento, provincia) a partir de la dirección final
		dFinal, err := direccionRepo.ObtenerDireccionPorID(ctx, int(finalID))
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		distrito, departamento, provincia, err := direccionRepo.ObtenerJerarquiaGeografica(ctx, dFinal.IDDistrito)
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		if _, err := tx.ExecContext(ctx, `UPDATE persona SET distrito_nombre = ?, departamento_nombre = ?, provincia_nombre = ? WHERE id_persona = ?`, distrito, departamento, provincia, idPersona); err != nil {
			_ = tx.Rollback()
			return false, "", "", utilidades.TraducirErrorBD(err)
		}
	}

	// 6) Si cambiamos email, generar token y persistir
	if sendVerification {
		// Invalidar tokens previos
		tokenRepo := repositorios.NewTokenRepo(tx)
		if err := tokenRepo.InvalidarTokensPrevios(ctx, idUsuario); err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		// Generar token seguro
		tkn, err := utilidades.GenerarTokenSeguro(utilidades.TokenSize32)
		if err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		tokenRecord := &modelos.EmailVerificacionToken{
			IDUsuario:  idUsuario,
			Token:      tkn,
			Expiracion: time.Now().Add(24 * time.Hour),
			Creado:     time.Now(),
		}
		if err := tokenRepo.CrearEmailVerificacionToken(ctx, tokenRecord); err != nil {
			_ = tx.Rollback()
			return false, "", "", err
		}
		verificationToken = tkn
	}

	// 7) Commit
	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return false, "", "", err
	}

	return sendVerification, verificationToken, newEmail, nil
}

func (s *UsuarioService) VerificarTokenEmail(ctx context.Context, token string) (err error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("Error al iniciar transacción: %v", err)
		return err
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		} else if err != nil {
			_ = tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	var (
		idUsuario       int
		expiracion      time.Time
		usado           bool
		requiereVerif   bool
		emailVerificado bool
	)

	// Obtener token + datos necesarios del usuario
	err = tx.QueryRowContext(ctx, `
		SELECT evt.id_usuario, evt.expiracion, evt.usado, u.requiere_verificacion, u.email_verificado
		FROM email_verificacion_token evt
		JOIN usuario u ON evt.id_usuario = u.id_usuario
		WHERE evt.token = ?
	`, token).Scan(&idUsuario, &expiracion, &usado, &requiereVerif, &emailVerificado)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			logger.Error.Printf("Token no encontrado: %v", err)
			return utilidades.ErrTokenInvalido
		}
		logger.Error.Printf("Error al buscar token: %v", err)
		return err
	}

	// 1 - El usuario ya estaba verificado
	if emailVerificado {
		logger.Info.Printf("Email ya verificado para usuarioID=%d", idUsuario)
		return utilidades.ErrEmailYaVerificado
	}

	// 2 - Token expirado
	if time.Now().After(expiracion) {
		logger.Warn.Printf("Token expirado: %s", token)
		return utilidades.ErrTokenExpirado
	}

	// 3 - Token usado (solo importa si el usuario no está verificado)
	if usado {
		logger.Warn.Printf("Token ya fue utilizado: %s", token)
		return utilidades.ErrTokenUsado
	}

	// 4 - Si no requiere verificación → retornar OK
	if !requiereVerif {
		logger.Debug.Printf("UsuarioID=%d no requiere verificación", idUsuario)
		return nil
	}

	// 5 - Marcar usuario como verificado
	_, err = tx.ExecContext(ctx, `
		UPDATE usuario
		SET email_verificado = 1
		WHERE id_usuario = ?
	`, idUsuario)
	if err != nil {
		logger.Error.Printf("Error al actualizar usuario: %v", err)
		return utilidades.TraducirErrorBD(err)
	}

	// 6 - Marcar token como usado
	_, err = tx.ExecContext(ctx, `
		UPDATE email_verificacion_token
		SET usado = 1
		WHERE token = ?
	`, token)
	if err != nil {
		logger.Error.Printf("Error al marcar token como usado: %v", err)
		return utilidades.TraducirErrorBD(err)
	}

	return nil
}

// ResendVerificationToken genera un nuevo token de verificación para el email
// proporcionado. Si el email no existe o no requiere verificación, devuelve
// "" sin error (para no filtrar la existencia del email).

func (s *UsuarioService) ResendVerificationToken(ctx context.Context, email string) (string, time.Time, error) {
	logger.Debug.Printf("Entrando a ResendVerificationToken con email: %s", email)

	// Iniciar transacción
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("No se pudo iniciar transacción: %v", err)
		return "", time.Time{}, err
	}
	defer tx.Rollback() // asegura rollback si hay error

	usuarioRepo := repositorios.NewUsuarioRepo(tx)
	tokenRepo := repositorios.NewTokenRepo(tx)

	// Obtener usuario por email
	usuario, err := usuarioRepo.GetUsuarioPorEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			logger.Debug.Printf("Usuario no encontrado: %s", email)
			return "", time.Time{}, nil // no filtramos existencia de email
		}
		logger.Error.Printf("Error al buscar usuario: %v", err)
		return "", time.Time{}, err
	}

	// Verificar si ya está verificado o no requiere verificación
	if usuario.EmailVerificado || !usuario.RequiereVerificacion {
		logger.Debug.Printf("No se genera token. EmailVerificado=%v, RequiereVerificacion=%v",
			usuario.EmailVerificado, usuario.RequiereVerificacion)
		return "", time.Time{}, nil
	}

	// Invalidar tokens previos no usados
	if err := tokenRepo.InvalidarTokensPrevios(ctx, usuario.IDUsuario); err != nil {
		logger.Error.Printf("Error al invalidar tokens previos: %v", err)
		return "", time.Time{}, err
	}

	// Generar nuevo token
	tokenStr, err := utilidades.GenerarTokenSeguro(utilidades.TokenSize32)
	if err != nil {
		logger.Error.Printf("Error al generar token: %v", err)
		return "", time.Time{}, err
	}

	expiracion := time.Now().Add(24 * time.Hour)
	token := &modelos.EmailVerificacionToken{
		IDUsuario:  usuario.IDUsuario,
		Token:      tokenStr,
		Expiracion: expiracion,
		Creado:     time.Now(),
	}

	// Guardar token
	if err := tokenRepo.CrearEmailVerificacionToken(ctx, token); err != nil {
		logger.Error.Printf("Error al insertar token: %v", err)
		return "", time.Time{}, err
	}

	// Commit de transacción
	if err := tx.Commit(); err != nil {
		logger.Error.Printf("Error al hacer commit: %v", err)
		return "", time.Time{}, err
	}

	logger.Debug.Printf("Token generado para usuario %d: %s, expiración: %v", usuario.IDUsuario, tokenStr, expiracion)
	return tokenStr, expiracion, nil
}

// SolicitarResetPassword genera un token de reseteo y lo persiste. Si el email
// no existe o no está verificado, devuelve token=="" (para no filtrar existencia).
func (s *UsuarioService) SolicitarResetPassword(ctx context.Context, email string) (string, time.Time, error) {
	logger.Debug.Printf("Entrando a SolicitarResetPassword con email: %s", email)

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("No se pudo iniciar transacción en SolicitarResetPassword: %v", err)
		return "", time.Time{}, err
	}
	defer tx.Rollback()

	var idUsuario int
	var emailVerificado bool
	// Buscar usuario por email
	err = tx.QueryRowContext(ctx, `SELECT id_usuario, email_verificado FROM usuario WHERE email = ? AND borrado IS NULL LIMIT 1`, email).Scan(&idUsuario, &emailVerificado)
	if err != nil {
		// No exponer si no existe: devolver token vacío y sin error
		logger.Debug.Printf("No se encontró usuario para email: %s", email)
		return "", time.Time{}, nil
	}

	// Si el email no está verificado, no crear token
	if !emailVerificado {
		logger.Debug.Printf("No se genera token de reseteo. Email no verificado para usuarioID=%d", idUsuario)
		return "", time.Time{}, nil
	}

	// Invalidar tokens previos no usados para este usuario
	if _, err := tx.ExecContext(ctx, `UPDATE reset_password_token SET usado = 1 WHERE id_usuario = ? AND usado = 0`, idUsuario); err != nil {
		logger.Error.Printf("Error al invalidar tokens previos de reseteo en SolicitarResetPassword: %v", err)
		return "", time.Time{}, err
	}

	// Generar token seguro
	tokenStr, err := utilidades.GenerarTokenSeguro(utilidades.TokenSize32)
	if err != nil {
		logger.Error.Printf("Error al generar token seguro en SolicitarResetPassword: %v", err)
		return "", time.Time{}, err
	}

	expiracion := time.Now().Add(1 * time.Hour)
	// Insertar token
	_, err = tx.ExecContext(ctx, `INSERT INTO reset_password_token (id_usuario, token, expiracion, creado, usado) VALUES (?, ?, ?, ?, 0)`, idUsuario, tokenStr, expiracion, time.Now())
	if err != nil {
		logger.Error.Printf("Error al insertar token en SolicitarResetPassword: %v", err)
		return "", time.Time{}, err
	}

	if err := tx.Commit(); err != nil {
		logger.Error.Printf("Error al hacer commit en SolicitarResetPassword: %v", err)
		return "", time.Time{}, err
	}

	return tokenStr, expiracion, nil
}

// EmailDisponible chequea si un email ya existe en usuario o persona (no revela dónde).
// Retorna true si está disponible (no encontrado), false si está registrado.
func (s *UsuarioService) EmailDisponible(ctx context.Context, email string) (bool, error) {
	var exists int
	// Usamos UNION para chequear ambas tablas en una sola consulta y LIMIT 1.
	query := `SELECT 1 FROM usuario WHERE email = ? AND (borrado IS NULL OR borrado = 0) UNION SELECT 1 FROM persona WHERE email = ? AND (borrado IS NULL OR borrado = 0) LIMIT 1`
	err := s.db.QueryRowContext(ctx, query, email, email).Scan(&exists)
	if err != nil {
		// Si no hay filas, el email está disponible
		if err == sql.ErrNoRows {
			return true, nil
		}
		logger.Error.Printf("Error chequeando disponibilidad de email %s: %v", email, err)
		return false, err
	}
	// Si llegamos aquí, existe al menos una fila => no disponible
	return false, nil
}

// CambiarPasswordConToken verifica el token de reseteo y actualiza la contraseña.
func (s *UsuarioService) CambiarPasswordConToken(ctx context.Context, token, nuevaPassword string) error {
	logger.Debug.Printf("Entrando a CambiarPasswordConToken con token: %s", token)

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("No se pudo iniciar transacción en CambiarPasswordConToken: %v", err)
		return err
	}
	defer tx.Rollback()

	var idUsuario int
	var expiracion time.Time
	var usado bool
	err = tx.QueryRowContext(ctx, `SELECT id_usuario, expiracion, usado FROM reset_password_token WHERE token = ?`, token).Scan(&idUsuario, &expiracion, &usado)
	if err != nil {
		logger.Error.Printf("Error al buscar token en CambiarPasswordConToken: %v", err)
		return errors.New("token inválido o no encontrado")
	}
	if usado {
		logger.Warn.Printf("Token ya fue usado en CambiarPasswordConToken: %s", token)
		return errors.New("token ya fue usado")
	}
	if time.Now().After(expiracion) {
		logger.Warn.Printf("Token expirado en CambiarPasswordConToken: %s", token)
		return errors.New("token expirado")
	}

	// Validar fuerza de la nueva contraseña (mínimo 8, letras y números)
	np := strings.TrimSpace(nuevaPassword)
	if len(np) < 8 {
		return errors.New("contraseña inválida: debe tener al menos 8 caracteres")
	}
	var hasLetter, hasNumber bool
	for _, r := range np {
		switch {
		case r >= '0' && r <= '9':
			hasNumber = true
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z'):
			hasLetter = true
		}
	}
	if !hasLetter || !hasNumber {
		return errors.New("contraseña inválida: debe contener letras y números")
	}

	// Hash contraseña nueva
	hash, err := bcrypt.GenerateFromPassword([]byte(nuevaPassword), bcrypt.DefaultCost)
	if err != nil {
		logger.Error.Printf("Error al hashear la contraseña en CambiarPasswordConToken: %v", err)
		return fmt.Errorf("error al hashear la contraseña: %w", err)
	}

	// Marcar token como usado y actualizar password
	if _, err := tx.ExecContext(ctx, `UPDATE reset_password_token SET usado = 1 WHERE token = ?`, token); err != nil {
		logger.Error.Printf("Error al marcar token como usado en CambiarPasswordConToken: %v", err)
		return err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE usuario SET password_hash = ? WHERE id_usuario = ?`, string(hash), idUsuario); err != nil {
		logger.Error.Printf("Error al actualizar contraseña en CambiarPasswordConToken: %v", err)
		return err
	}

	return tx.Commit()
}

// CambiarPasswordAutenticado permite a un usuario autenticado cambiar su contraseña
// verificando la contraseña actual.
func (s *UsuarioService) CambiarPasswordAutenticado(ctx context.Context, idUsuario int, ActualPassword, NuevaPassword string) error {
	logger.Debug.Printf("Entrando a CambiarPasswordAutenticado con idUsuario: %d", idUsuario)
	// Obtener hash actual
	var passwordHash string
	err := s.db.QueryRowContext(ctx, `SELECT password_hash FROM usuario WHERE id_usuario = ? LIMIT 1`, idUsuario).Scan(&passwordHash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			logger.Error.Printf("Usuario no encontrado en CambiarPasswordAutenticado: %d", idUsuario)
			return errors.New("usuario no encontrado")
		}
		return err
	}

	// Verificar password actual
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(ActualPassword)); err != nil {
		logger.Warn.Printf("Contraseña actual incorrecta en CambiarPasswordAutenticado para usuarioID=%d", idUsuario)
		return errors.New("contraseña actual incorrecta")
	}

	// Nueva password no puede ser igual a la actual
	if ActualPassword == NuevaPassword {
		logger.Warn.Printf("Nueva contraseña es igual a la actual en CambiarPasswordAutenticado para usuarioID=%d", idUsuario)
		return errors.New("la nueva contraseña no puede ser igual a la actual")
	}

	// Hash y actualizar
	hash, err := bcrypt.GenerateFromPassword([]byte(NuevaPassword), bcrypt.DefaultCost)
	if err != nil {
		logger.Error.Printf("Error al hashear la contraseña en CambiarPasswordAutenticado: %v", err)
		return fmt.Errorf("error al hashear la contraseña: %w", err)
	}

	_, err = s.db.ExecContext(ctx, `UPDATE usuario SET password_hash = ? WHERE id_usuario = ?`, string(hash), idUsuario)
	if err != nil {
		logger.Error.Printf("Error al actualizar contraseña en CambiarPasswordAutenticado: %v", err)
		return err
	}
	return nil
}
