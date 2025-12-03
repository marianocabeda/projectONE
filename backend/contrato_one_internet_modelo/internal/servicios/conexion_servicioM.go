package servicios

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

// ConexionService gestiona la lógica de negocio para conexiones
type ConexionService struct {
	db *sql.DB
}

// NewConexionService crea una nueva instancia
func NewConexionService(db *sql.DB) *ConexionService {
	return &ConexionService{db: db}
}

// SolicitudConexionRequest representa la entrada para solicitar una conexión
type SolicitudConexionRequest struct {
	IDPlan      int                `json:"id_plan"`
	IDDireccion *int               `json:"id_direccion,omitempty"`
	Direccion   *modelos.Direccion `json:"direccion,omitempty"`
	Latitud     float64            `json:"latitud"`
	Longitud    float64            `json:"longitud"`

	// --- Nuevos campos para flujo de Atención al Público ---
	IDPersonaCliente      *int    `json:"id_persona_cliente,omitempty"`     // Si un empleado lo pide para otro
	FactibilidadInmediata bool    `json:"factibilidad_inmediata,omitempty"` // Para saltar verificación
	NAP                   string  `json:"nap,omitempty"`                    // Requerido si es inmediata
	VLAN                  int     `json:"vlan,omitempty"`                   // Requerido si es inmediata
	Puerto                *int    `json:"puerto,omitempty"`                 // Opcional
	Observaciones         string  `json:"observaciones,omitempty"`          // Opcional
}

// SolicitudConexionResponse representa la respuesta de solicitar conexión
type SolicitudConexionResponse struct {
	Mensaje      string `json:"mensaje"`
	IDConexion   int64  `json:"id_conexion"`
	NroConexion  int    `json:"nro_conexion"`
	IDContrato   int64  `json:"id_contrato"`
}

// SolicitarConexionParticular gestiona la solicitud completa de conexión en una transacción
func (s *ConexionService) SolicitarConexionParticular(ctx context.Context, req SolicitudConexionRequest, IdUsuarioCreador int) (*SolicitudConexionResponse, error) {
	logger.Debug.Printf("Iniciando solicitud. Creador: %d, FactibilidadInmediata: %v", IdUsuarioCreador, req.FactibilidadInmediata)

	// 1. Determinar quién es la persona cliente (dueño de la conexión)
	var idPersonaCliente int
	
	if req.IDPersonaCliente != nil && *req.IDPersonaCliente > 0 {
        // Caso A: Empleado creando solicitud para un cliente
        idPersonaCliente = *req.IDPersonaCliente
        // Validar que la persona exista (opcional, pero recomendado)
		queryPersona := `SELECT COUNT(1) FROM persona WHERE id_persona = ? AND borrado IS NULL`
		var count int
		err := s.db.QueryRowContext(ctx, queryPersona, idPersonaCliente).Scan(&count)
		if err != nil {
			return nil, fmt.Errorf("error validando persona cliente: %w", err)
		}
		if count == 0 {
			return nil, utilidades.ErrNotFound{
				Entity: "persona",
				Campo:  "id_persona",
				Valor:  fmt.Sprintf("%d", idPersonaCliente),
			}
		}
    } else {
        // Caso B: Cliente auto-gestionándose (resolvemos IDPersona desde IDUsuario)
        queryUsuario := `SELECT id_persona FROM usuario WHERE id_usuario = ? AND borrado IS NULL`
        err := s.db.QueryRowContext(ctx, queryUsuario, IdUsuarioCreador).Scan(&idPersonaCliente)
        if err != nil {
            return nil, fmt.Errorf("error resolviendo persona del usuario creador: %w", err)
        }
    }

	// Validaciones básicas
	if req.Latitud < -90 || req.Latitud > 90 {
		return nil, utilidades.ErrValidation{
			Campo:   "latitud",
			Mensaje: "debe estar entre -90 y 90",
		}
	}
	if req.Longitud < -180 || req.Longitud > 180 {
		return nil, utilidades.ErrValidation{
			Campo:   "longitud",
			Mensaje: "debe estar entre -180 y 180",
		}
	}

	// Debe venir id_direccion O direccion, pero no ambos
	if req.IDDireccion == nil && req.Direccion == nil {
		return nil, utilidades.ErrValidation{
			Campo:   "direccion",
			Mensaje: "debe proporcionar id_direccion o el objeto direccion",
		}
	}
	if req.IDDireccion != nil && req.Direccion != nil {
		return nil, utilidades.ErrValidation{
			Campo:   "direccion",
			Mensaje: "no puede proporcionar id_direccion y direccion al mismo tiempo",
		}
	}

	// Iniciar transacción
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("Error iniciando transacción: %v", err)
		return nil, err
	}

	// Setear variable de sesión con el usuario que está creando
	_, err = tx.ExecContext(ctx, "SET @session_user_id = ?", IdUsuarioCreador)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("error seteando variable de sesión: %w", err)
	}

	defer tx.Rollback()

	// Repositorios
	direccionRepo := repositorios.NewDireccionRepo(tx)
	conexionRepo := repositorios.NewConexionRepo(tx)
	pveRepo := repositorios.NewPersonaVinculoEmpresaRepo(tx)
	contratoRepo := repositorios.NewContratoRepo(tx)

	// 1. Crear o usar dirección
	var idDireccion int64
	var distrito, departamento, provincia string

	if req.Direccion != nil {
		// Crear nueva dirección
		idDireccion, err = direccionRepo.EncontrarOCrearDireccion(ctx, req.Direccion)
		if err != nil {
			logger.Error.Printf("Error creando dirección: %v", err)
			return nil, err
		}
		// Obtener jerarquía geográfica
		distrito, departamento, provincia, err = direccionRepo.ObtenerJerarquiaGeografica(ctx, req.Direccion.IDDistrito)
		if err != nil {
			logger.Error.Printf("Error obteniendo jerarquía geográfica: %v", err)
			return nil, err
		}
	} else {
		// Usar dirección existente
		idDireccion = int64(*req.IDDireccion)
		// Obtener datos de la dirección existente
		dir, err := direccionRepo.ObtenerDireccionPorID(ctx, int(idDireccion))
		if err != nil {
			logger.Error.Printf("Error obteniendo dirección existente: %v", err)
			return nil, utilidades.ErrNotFound{
				Entity: "direccion",
				Campo:  "id_direccion",
				Valor:  fmt.Sprintf("%d", idDireccion),
			}
		}
		distrito, departamento, provincia, err = direccionRepo.ObtenerJerarquiaGeografica(ctx, dir.IDDistrito)
		if err != nil {
			logger.Error.Printf("Error obteniendo jerarquía geográfica: %v", err)
			return nil, err
		}
	}

	// 2. Determinar ESTADOS INICIALES según factibilidad_inmediata
    var nombreEstadoConexion string
    var nombreEstadoContrato string
    
    if req.FactibilidadInmediata {
        // Factibilidad inmediata = true: Conexión creada por empleado con verificación técnica ya realizada
        nombreEstadoConexion = "Factible"
        nombreEstadoContrato = "Pendiente de pago"
    } else {
        // Factibilidad inmediata = false: Requiere verificación técnica
        // Diferenciar según el origen:
        // - Cliente web autónomo → "En verificacion"
        // - Empleado derivando a verificador → "Pendiente verificación técnica"
        if req.IDPersonaCliente != nil && IdUsuarioCreador != *req.IDPersonaCliente {
            // Empleado creando para otra persona → derivar a verificador técnico
            nombreEstadoConexion = "Pendiente verificación técnica"
        } else {
            // Cliente creando para sí mismo → flujo normal
            nombreEstadoConexion = "En verificacion"
        }
        nombreEstadoContrato = "En verificacion"
    }

    idEstadoConexion, err := conexionRepo.ObtenerIDEstadoPorNombre(ctx, nombreEstadoConexion)
    if err != nil { 
        logger.Error.Printf("Error obteniendo estado de conexión '%s': %v", nombreEstadoConexion, err)
        return nil, err 
    }

    // 3. Crear Conexión
    nroConexion, _ := conexionRepo.ObtenerSiguienteNroConexion(ctx)

	// 4. Crear conexión
	conexion := &modelos.Conexion{
		NroConexion:        nroConexion,
		IDPersona:          idPersonaCliente, // Dueño de la conexión
		IDPlan:             req.IDPlan,
		IDDireccion:        int(idDireccion),
		DistritoNombre:     distrito,
		DepartamentoNombre: departamento,
		ProvinciaNombre:    provincia,
		Latitud:            req.Latitud,
		Longitud:           req.Longitud,
		TipoConexion:       "FTTH", // Valor por defecto, se podría parametrizar
		IDEstadoConexion:   idEstadoConexion,
		FechaInstalacion:   time.Now(),
		IDUsuarioCreador:   &IdUsuarioCreador,
	}

	// Si es factible inmediatamente, rellenar datos técnicos
    if req.FactibilidadInmediata {
        conexion.Observaciones = req.Observaciones
        // Nota: Tu modelo `Conexion` struct debe tener estos campos para mapearlos al INSERT
        // Si tu struct `Conexion` no tiene VLAN/NAP, debes agregarlos o pasarlos al repo
        // Asumiré que los agregas al struct o modificas el repo.
        conexion.VlanA = &req.VLAN
        conexion.DetalleNodo = &req.NAP // Asumiendo que NAP va en DetalleNodo
        if req.Puerto != nil {
            conexion.PuertoOLT = req.Puerto
        }
    }

	idConexion, err := conexionRepo.CrearConexion(ctx, conexion)
	if err != nil {
		logger.Error.Printf("Error creando conexión: %v", err)
		return nil, err
	}

	// 5. Obtener IDs de empresa "ONE Internet" y vínculo "cliente"
	idEmpresa, err := pveRepo.ObtenerIDEmpresaPorNombre(ctx, "ONE Internet")
	if err != nil {
		logger.Error.Printf("Error obteniendo empresa: %v", err)
		return nil, err
	}

	idVinculo, err := pveRepo.ObtenerIDVinculoPorNombre(ctx, "cliente")
	if err != nil {
		logger.Error.Printf("Error obteniendo vínculo: %v", err)
		return nil, err
	}

	// 6. Crear o actualizar vínculo persona-empresa
	err = pveRepo.CrearOActualizarVinculo(ctx, idPersonaCliente, idVinculo, idEmpresa)
	if err != nil {
		logger.Error.Printf("Error creando vínculo persona-empresa: %v", err)
		return nil, err
	}

	// 7. Obtener estado "En verificacion" para contrato
	idEstadoContrato, err := contratoRepo.ObtenerIDEstadoContratoPorNombre(ctx, nombreEstadoContrato)
	if err != nil {
		logger.Error.Printf("Error obteniendo estado_contrato: %v", err)
		return nil, err
	}

	costoInstalacion := 7000.0 // Asumir costo fijo, se puede modificar para obtener costo real
	// 8. Crear contrato
	contrato := &modelos.Contrato{
		IDPersona:        idPersonaCliente,
		IDVinculo:        idVinculo,
		IDEmpresa:        idEmpresa,
		IDConexion:       int(idConexion),
		IDPlan:           req.IDPlan,
		CostoInstalacion: &costoInstalacion, // Valor fijo por ahora
		FechaInicio:      time.Now(),
		IDEstadoContrato: idEstadoContrato,
		IDUsuarioCreador: &IdUsuarioCreador,
	}

	idContrato, err := contratoRepo.CrearContrato(ctx, contrato)
	if err != nil {
		logger.Error.Printf("Error creando contrato: %v", err)
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		logger.Error.Printf("Error haciendo commit: %v", err)
		return nil, err
	}

	logger.Info.Printf("Solicitud de conexión creada exitosamente: conexion=%d, contrato=%d", idConexion, idContrato)

	// === ENVIAR NOTIFICACIONES ===
	// Después del commit exitoso, enviar notificaciones de forma asíncrona para no bloquear la respuesta
	go func() {
		// Obtener datos del cliente para las notificaciones
		var nombreCliente, apellidoCliente, nombrePlan string
		queryCliente := `
			SELECT p.nombre, p.apellido, pl.nombre
			FROM persona p
			INNER JOIN plan pl ON pl.id_plan = ?
			WHERE p.id_persona = ?
		`
		err := s.db.QueryRow(queryCliente, req.IDPlan, idPersonaCliente).Scan(&nombreCliente, &apellidoCliente, &nombrePlan)
		if err != nil {
			logger.Error.Printf("Error obteniendo datos para notificación: %v", err)
			return
		}

		notifService := NewNotificacionEnvioService(s.db)

		if req.FactibilidadInmediata {
			// Notificar aprobación de factibilidad inmediata al cliente
			// A. Si se aprobó directo: Notificar al cliente "Factible" (saltar "Recibida")
			err = notifService.EnviarNotificacionSolicitudFactible(
				context.Background(),
				idPersonaCliente,
				int(idConexion),
				int(idContrato),
				fmt.Sprintf("%d", nroConexion),
			)
			if err != nil {
				logger.Error.Printf("Error enviando notificación de factibilidad aprobada al cliente: %v", err)
			}
			return
		} else {
			// // B. Flujo normal: Notificar Revisador y Cliente "Recibida"

			// 1. Notificación a verificadores (nueva solicitud pendiente)
			var observacionPtr *string
			if req.Observaciones != "" {
				observacionPtr = &req.Observaciones
			}
			
			err = notifService.EnviarNotificacionNuevaSolicitudVerificador(
				context.Background(),
				int(idConexion),
				int(idContrato),
				fmt.Sprintf("%d", nroConexion),
				nombreCliente,
				apellidoCliente,
				distrito,
				departamento,
				provincia,
				nombrePlan,
				time.Now().Format("02/01/2006"),
				observacionPtr,
			)
			if err != nil {
				logger.Error.Printf("Error enviando notificación a verificadores: %v", err)
			}

			// 2. Notificación al cliente (solicitud recibida)
			err = notifService.EnviarNotificacionSolicitudRecibidaCliente(
				context.Background(),
				idPersonaCliente,
				int(idConexion),
				int(idContrato),
				fmt.Sprintf("%d", nroConexion),
			)
			if err != nil {
				logger.Error.Printf("Error enviando notificación al cliente: %v", err)
			}
		}
	}()

	mensajeFinal := "Solicitud creada exitosamente."
    if req.FactibilidadInmediata {
        mensajeFinal = "Solicitud creada y factibilidad aprobada correctamente."
    }

	return &SolicitudConexionResponse{
		Mensaje:     mensajeFinal,
		IDConexion:  idConexion,
		NroConexion: nroConexion,
		IDContrato:  idContrato,
	}, nil
}

// ObtenerSolicitudesPendientes obtiene la lista de solicitudes en estado "En verificacion"
func (s *ConexionService) ObtenerSolicitudesPendientes(ctx context.Context) ([]modelos.SolicitudPendiente, error) {
	repo := repositorios.NewConexionRepo(s.db)
	return repo.ObtenerSolicitudesPendientes(ctx)
}

// ObtenerDetalleSolicitud obtiene el detalle completo de una solicitud específica
func (s *ConexionService) ObtenerDetalleSolicitud(ctx context.Context, idConexion int) (*modelos.DetalleSolicitud, error) {
	logger.Debug.Printf("Obteniendo detalle de solicitud ID: %d", idConexion)
	
	repo := repositorios.NewConexionRepo(s.db)
	detalle, err := repo.ObtenerDetalleSolicitud(ctx, idConexion)
	if err != nil {
		logger.Error.Printf("Error obteniendo detalle solicitud %d: %v", idConexion, err)
		return nil, err
	}
	
	logger.Debug.Printf("Detalle de solicitud %d obtenido exitosamente", idConexion)
	return detalle, nil
}

// SolicitudesPendientesRequest representa los parámetros de consulta
type SolicitudesPendientesRequest struct {
	Page          int
	Limit         int
	SortBy        string
	SortDirection string
	Distrito      string
	Plan          *int
	Cliente       string
	FechaDesde    string
	FechaHasta    string
	Provincia     string
	Departamento  string
}

// SolicitudesPendientesResponse representa la respuesta paginada
type SolicitudesPendientesResponse struct {
	Page        int                            `json:"page"`
	Limit       int                            `json:"limit"`
	Total       int                            `json:"total"`
	TotalPages  int                            `json:"total_pages"`
	Solicitudes []modelos.SolicitudPendiente  `json:"solicitudes"`
}

// ObtenerSolicitudesPendientesConFiltros obtiene solicitudes con paginación y filtros
func (s *ConexionService) ObtenerSolicitudesPendientesConFiltros(
	ctx context.Context,
	req SolicitudesPendientesRequest,
) (*SolicitudesPendientesResponse, error) {
	// Validar y aplicar valores por defecto
	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 || req.Limit > 100 {
		req.Limit = 20
	}
	if req.SortBy == "" {
		req.SortBy = "fecha_solicitud"
	}
	if req.SortDirection == "" {
		req.SortDirection = "ASC"
	}

	// Validar sort_by permitidos
	validSortBy := map[string]bool{
		"fecha_solicitud": true,
		"distrito":        true,
		"cliente":         true,
		"plan":            true,
	}
	if !validSortBy[req.SortBy] {
		req.SortBy = "fecha_solicitud"
	}

	// Validar sort_direction
	if req.SortDirection != "ASC" && req.SortDirection != "DESC" {
		req.SortDirection = "ASC"
	}

	// Calcular offset
	offset := (req.Page - 1) * req.Limit

	// Crear filtros para el repositorio
	filtros := repositorios.FiltrosSolicitudesPendientes{
		Distrito:      req.Distrito,
		Plan:          req.Plan,
		Cliente:       req.Cliente,
		FechaDesde:    req.FechaDesde,
		FechaHasta:    req.FechaHasta,
		Provincia:     req.Provincia,
		Departamento:  req.Departamento,
		SortBy:        req.SortBy,
		SortDirection: req.SortDirection,
		Limit:         req.Limit,
		Offset:        offset,
	}

	repo := repositorios.NewConexionRepo(s.db)
	solicitudes, total, err := repo.ObtenerSolicitudesPendientesConFiltros(ctx, filtros)
	if err != nil {
		return nil, err
	}

	// Calcular total de páginas
	totalPages := (total + req.Limit - 1) / req.Limit
	if totalPages < 1 {
		totalPages = 1
	}

	return &SolicitudesPendientesResponse{
		Page:        req.Page,
		Limit:       req.Limit,
		Total:       total,
		TotalPages:  totalPages,
		Solicitudes: solicitudes,
	}, nil
}

// ConfirmarFactibilidad confirma la factibilidad de una conexión y actualiza estados
func (s *ConexionService) ConfirmarFactibilidad(
	ctx context.Context,
	req modelos.ConfirmarFactibilidadRequest,
) (*modelos.ConfirmarFactibilidadResponse, error) {
	logger.Debug.Printf("Confirmando factibilidad para conexión ID: %d", req.IDConexion)

	// Validaciones de entrada
	if req.IDConexion <= 0 {
		return nil, utilidades.ErrValidation{
			Campo:   "id_conexion",
			Mensaje: "es requerido y debe ser mayor que 0",
		}
	}

	if req.NAP == "" {
		return nil, utilidades.ErrValidation{
			Campo:   "nap",
			Mensaje: "es requerido",
		}
	}

	if req.VLAN <= 0 {
		return nil, utilidades.ErrValidation{
			Campo:   "vlan",
			Mensaje: "es requerido y debe ser mayor que 0",
		}
	}

	// Si puerto está presente, validar que sea positivo
	if req.Puerto != nil && *req.Puerto <= 0 {
		return nil, utilidades.ErrValidation{
			Campo:   "puerto",
			Mensaje: "debe ser mayor que 0 si se proporciona",
		}
	}

	// Iniciar transacción
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("Error iniciando transacción: %v", err)
		return nil, fmt.Errorf("error iniciando transacción: %w", err)
	}
	defer tx.Rollback()

	conexionRepo := repositorios.NewConexionRepo(tx)
	contratoRepo := repositorios.NewContratoRepo(tx)

	// 1. Verificar que la conexión exista y esté en estado "En verificacion" o "Pendiente verificación técnica"
	err = conexionRepo.VerificarEstadoConexionMultiple(ctx, req.IDConexion, []string{"En verificacion", "Pendiente verificación técnica"})
	if err != nil {
		logger.Error.Printf("Error verificando estado de conexión %d: %v", req.IDConexion, err)
		return nil, err
	}

	// 2. Obtener ID del estado "Factible" para conexión
	idEstadoFactible, err := conexionRepo.ObtenerIDEstadoPorNombre(ctx, "Factible")
	if err != nil {
		logger.Error.Printf("Error obteniendo estado 'Factible': %v", err)
		return nil, fmt.Errorf("estado 'Factible' no encontrado en el sistema")
	}

	// 3. Actualizar conexión con datos técnicos y nuevo estado
	err = conexionRepo.ActualizarFactibilidadConexion(
		ctx,
		req.IDConexion,
		req.NAP,
		req.VLAN,
		req.Puerto,
		req.Observaciones,
		idEstadoFactible,
	)
	if err != nil {
		logger.Error.Printf("Error actualizando conexión %d: %v", req.IDConexion, err)
		return nil, err
	}

	// 4. Obtener ID del estado "Pendiente de pago" para contrato
	idEstadoPendientePago, err := contratoRepo.ObtenerIDEstadoContratoPorNombre(ctx, "Pendiente de pago")
	if err != nil {
		logger.Error.Printf("Error obteniendo estado 'Pendiente de pago': %v", err)
		return nil, fmt.Errorf("estado 'Pendiente de pago' no encontrado en el sistema")
	}

	// 5. Actualizar estado del contrato asociado
	err = contratoRepo.ActualizarEstadoContratoPorConexion(ctx, req.IDConexion, idEstadoPendientePago)
	if err != nil {
		logger.Error.Printf("Error actualizando contrato de conexión %d: %v", req.IDConexion, err)
		return nil, err
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		logger.Error.Printf("Error confirmando transacción: %v", err)
		return nil, fmt.Errorf("error confirmando transacción: %w", err)
	}

	logger.Info.Printf("Factibilidad confirmada para conexión %d", req.IDConexion)

	// === ENVIAR NOTIFICACIÓN AL CLIENTE ===
	go func() {
		// Obtener datos necesarios para la notificación
		var idPersona, idContrato, nroConexion int
		queryDatos := `
			SELECT c.id_persona, con.id_contrato, c.nro_conexion
			FROM conexion c
			INNER JOIN contrato con ON con.id_conexion = c.id_conexion
			WHERE c.id_conexion = ?
		`
		err := s.db.QueryRow(queryDatos, req.IDConexion).Scan(&idPersona, &idContrato, &nroConexion)
		if err != nil {
			logger.Error.Printf("Error obteniendo datos para notificación de factibilidad: %v", err)
			return
		}

		notifService := NewNotificacionEnvioService(s.db)
		err = notifService.EnviarNotificacionSolicitudFactible(
			context.Background(),
			idPersona,
			req.IDConexion,
			idContrato,
			fmt.Sprintf("%d", nroConexion),
		)
		if err != nil {
			logger.Error.Printf("Error enviando notificación de factibilidad al cliente: %v", err)
		}
	}()

	return &modelos.ConfirmarFactibilidadResponse{
		Mensaje:    "Factibilidad confirmada",
		IDConexion: req.IDConexion,
	}, nil
}

// RechazarFactibilidad rechaza la factibilidad de una conexión
func (s *ConexionService) RechazarFactibilidad(
	ctx context.Context,
	req modelos.RechazarFactibilidadRequest,
) (*modelos.RechazarFactibilidadResponse, error) {
	logger.Debug.Printf("Rechazando factibilidad para conexión ID: %d", req.IDConexion)

	// Validaciones de entrada
	if req.IDConexion <= 0 {
		return nil, utilidades.ErrValidation{
			Campo:   "id_conexion",
			Mensaje: "es requerido y debe ser mayor que 0",
		}
	}

	// Iniciar transacción
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		logger.Error.Printf("Error iniciando transacción: %v", err)
		return nil, fmt.Errorf("error iniciando transacción: %w", err)
	}
	defer tx.Rollback()

	conexionRepo := repositorios.NewConexionRepo(tx)
	contratoRepo := repositorios.NewContratoRepo(tx)

	// 1. Verificar que la conexión exista y esté en estado "En verificacion" o "Pendiente verificación técnica"
	err = conexionRepo.VerificarEstadoConexionMultiple(ctx, req.IDConexion, []string{"En verificacion", "Pendiente verificación técnica"})
	if err != nil {
		logger.Error.Printf("Error verificando estado de conexión %d: %v", req.IDConexion, err)
		return nil, err
	}

	// 2. Obtener ID del estado "No factible" para conexión
	idEstadoNoFactible, err := conexionRepo.ObtenerIDEstadoPorNombre(ctx, "No factible")
	if err != nil {
		logger.Error.Printf("Error obteniendo estado 'No factible': %v", err)
		return nil, fmt.Errorf("estado 'No factible' no encontrado en el sistema")
	}

	// 3. Actualizar conexión con motivo de rechazo y nuevo estado
	err = conexionRepo.RechazarFactibilidadConexion(
		ctx,
		req.IDConexion,
		req.Motivo,
		idEstadoNoFactible,
	)
	if err != nil {
		logger.Error.Printf("Error actualizando conexión %d: %v", req.IDConexion, err)
		return nil, err
	}

	// 4. Obtener ID del estado "No factible" para contrato
	idEstadoRechazado, err := contratoRepo.ObtenerIDEstadoContratoPorNombre(ctx, "No factible")
	if err != nil {
		logger.Error.Printf("Error obteniendo estado 'No factible': %v", err)
		return nil, fmt.Errorf("estado 'No factible' no encontrado en el sistema")
	}

	// 5. Actualizar estado del contrato asociado
	err = contratoRepo.ActualizarEstadoContratoPorConexion(ctx, req.IDConexion, idEstadoRechazado)
	if err != nil {
		logger.Error.Printf("Error actualizando contrato de conexión %d: %v", req.IDConexion, err)
		return nil, err
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		logger.Error.Printf("Error confirmando transacción: %v", err)
		return nil, fmt.Errorf("error confirmando transacción: %w", err)
	}

	logger.Info.Printf("Factibilidad rechazada para conexión %d", req.IDConexion)

	// === ENVIAR NOTIFICACIÓN AL CLIENTE ===
	go func() {
		// Obtener datos necesarios para la notificación
		var idPersona, idContrato, nroConexion int
		queryDatos := `
			SELECT c.id_persona, con.id_contrato, c.nro_conexion
			FROM conexion c
			INNER JOIN contrato con ON con.id_conexion = c.id_conexion
			WHERE c.id_conexion = ?
		`
		err := s.db.QueryRow(queryDatos, req.IDConexion).Scan(&idPersona, &idContrato, &nroConexion)
		if err != nil {
			logger.Error.Printf("Error obteniendo datos para notificación de rechazo: %v", err)
			return
		}

		notifService := NewNotificacionEnvioService(s.db)
		err = notifService.EnviarNotificacionSolicitudNoFactible(
			context.Background(),
			idPersona,
			req.IDConexion,
			idContrato,
			fmt.Sprintf("%d", nroConexion),
		)
		if err != nil {
			logger.Error.Printf("Error enviando notificación de rechazo al cliente: %v", err)
		}
	}()

	return &modelos.RechazarFactibilidadResponse{
		Mensaje:    "Solicitud marcada como no factible",
		IDConexion: req.IDConexion,
	}, nil
}
