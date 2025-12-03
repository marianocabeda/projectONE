package clientes

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	clientesModelos "contrato_one_internet_controlador/internal/modelos/clientes"
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"contrato_one_internet_controlador/internal/validadores"
)

type ConexionHandler struct {
	conexionService *servicios.ConexionService
}

func NewConexionHandler(conexionService *servicios.ConexionService) *ConexionHandler {
	return &ConexionHandler{
		conexionService: conexionService,
	}
}

// SolicitarConexionHandler maneja la solicitud de conexión de un cliente particular
func (h *ConexionHandler) SolicitarConexionHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Obtener el ID del usuario autenticado desde el contexto
	claims, ok := middleware.GetClaimsFromContext(r.Context())
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "usuario no autenticado")
		return
	}

	// 2. Decodificar el cuerpo de la solicitud
	var req clientesModelos.SolicitudConexionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "formato de solicitud inválido")
		return
	}

	// 3. Lógica de Roles (Asumiendo que claims tiene campo Rol o similar)
    esEmpleado := claims.HasRole("admin") || 
				claims.HasRole("verificador") || 
				claims.HasRole("atencion")

    // Validar intento de suplantación
    if req.IDPersonaCliente != nil && !esEmpleado {
        utilidades.ResponderError(w, http.StatusForbidden, "No tienes permisos para crear solicitudes a nombre de terceros")
        return
    }

    // Validar intento de auto-aprobación
    if req.FactibilidadInmediata && !esEmpleado {
        utilidades.ResponderError(w, http.StatusForbidden, "No tienes permisos para aprobar factibilidad")
        return
    }

    // 4. Validaciones Técnicas para Factibilidad Inmediata
    if req.FactibilidadInmediata {
        if req.NAP == "" || req.VLAN <= 0 {
            utilidades.ResponderError(w, http.StatusBadRequest, "Para factibilidad inmediata, NAP y VLAN son obligatorios")
            return
        }
    }

	// Validar plan seleccionado
	if req.IDPlan <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_plan es requerido y debe ser mayor que 0")
		return
	}

	// Validar que se proporcione exactamente una opción de dirección
	tieneIDDireccion := req.IDDireccion != nil
	tieneDireccion := req.Direccion != nil

	if tieneIDDireccion && tieneDireccion {
		utilidades.ResponderError(w, http.StatusBadRequest, "debe proporcionar id_direccion O direccion, no ambos")
		return
	}

	if !tieneIDDireccion && !tieneDireccion {
		utilidades.ResponderError(w, http.StatusBadRequest, "debe proporcionar id_direccion o direccion")
		return
	}

	// Si se proporciona una nueva dirección, normalizarla y validarla
	if req.Direccion != nil {
		// normarlizar campos obligatorios
		calle := utilidades.NormalizeCalle(req.Direccion.Calle)
		numero := utilidades.NormalizeNumero(req.Direccion.Numero)
		codigoPostal := utilidades.NormalizeCodigoPostal(req.Direccion.CodigoPostal)
		
		// normarlizar piso y depto
		// si vienen vacíos, poner en nil
		var piso *string
		if req.Direccion.Piso != nil {
			p := utilidades.NormalizeOptionalField(req.Direccion.Piso)
			if p != nil && *p != "" {
				piso = p
			} else {
				piso = nil
			}
		}

		var depto *string
		if req.Direccion.Depto != nil {
			d := utilidades.NormalizeOptionalField(req.Direccion.Depto)
			if d != nil && *d != "" {
				depto = d
			} else {
				depto = nil
			}
		}

		// Crear dirección normalizada para validar
		normalizarDireccion := modelos.Direccion{
			Calle:        calle,
			Numero:       numero,
			CodigoPostal: codigoPostal,
			Piso:         piso,
			Depto:        depto,
			IDDistrito:   req.Direccion.IDDistrito,
		}

		
		// Validar dirección
		if err := validadores.ValidarDireccion(normalizarDireccion); err != nil {
			utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Actualizar la dirección en la solicitud con la normalizada
		req.Direccion = &normalizarDireccion
	}

	logger.Info.Printf("Procesando solicitud de conexión para usuario %d: %+v", claims.IDUsuario, req)
	logger.Debug.Printf("Detalles de la solicitud de conexión: %+v", req)

	// Validar latitud y longitud
	if req.Latitud < -90 || req.Latitud > 90 {
		utilidades.ResponderError(w, http.StatusBadRequest, "latitud debe estar entre -90 y 90")
		return
	}

	if req.Longitud < -180 || req.Longitud > 180 {
		utilidades.ResponderError(w, http.StatusBadRequest, "longitud debe estar entre -180 y 180")
		return
	}

	// 5. Llamar al servicio para procesar la solicitud
	// Pasar el ID del usuario autenticado
	response, err := h.conexionService.SolicitarConexionParticular(r.Context(), &req, claims.IDUsuario)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		logger.Error.Printf("Error al procesar solicitud de conexión: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder con éxito - ResponderJSON ya envuelve en {"success": true, "data": ...}
	utilidades.ResponderJSON(w, http.StatusCreated, response)
}

// ObtenerSolicitudesPendientesHandler maneja GET /v1/revisacion/solicitudes-pendientes
func (h *ConexionHandler) ObtenerSolicitudesPendientesHandler(w http.ResponseWriter, r *http.Request) {
	// Extraer todos los query parameters
	query := r.URL.Query()
	queryParams := make(map[string]string)
	
	// Paginación
	if page := query.Get("page"); page != "" {
		queryParams["page"] = page
	}
	if limit := query.Get("limit"); limit != "" {
		queryParams["limit"] = limit
	}
	
	// Ordenamiento
	if sortBy := query.Get("sort_by"); sortBy != "" {
		queryParams["sort_by"] = sortBy
	}
	if sortDirection := query.Get("sort_direction"); sortDirection != "" {
		queryParams["sort_direction"] = sortDirection
	}
	
	// Filtros
	if distrito := query.Get("distrito"); distrito != "" {
		queryParams["distrito"] = distrito
	}
	if plan := query.Get("plan"); plan != "" {
		queryParams["plan"] = plan
	}
	if cliente := query.Get("cliente"); cliente != "" {
		queryParams["cliente"] = cliente
	}
	if desde := query.Get("desde"); desde != "" {
		queryParams["desde"] = desde
	}
	if hasta := query.Get("hasta"); hasta != "" {
		queryParams["hasta"] = hasta
	}
	if provincia := query.Get("provincia"); provincia != "" {
		queryParams["provincia"] = provincia
	}
	if departamento := query.Get("departamento"); departamento != "" {
		queryParams["departamento"] = departamento
	}

	response, err := h.conexionService.ObtenerSolicitudesPendientes(r.Context(), queryParams)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		logger.Error.Printf("Error al obtener solicitudes pendientes: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder con éxito
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// ObtenerDetalleSolicitudHandler maneja GET /v1/revisacion/solicitud/:id
func (h *ConexionHandler) ObtenerDetalleSolicitudHandler(w http.ResponseWriter, r *http.Request) {
	// Obtener el ID de la URL
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Convertir a int
	idConexion, err := strconv.Atoi(idStr)
	if err != nil || idConexion <= 0 {
		logger.Error.Printf("ID de conexión inválido: %s", idStr)
		utilidades.ResponderError(w, http.StatusBadRequest, "id debe ser un número entero positivo")
		return
	}

	// Llamar al servicio
	response, err := h.conexionService.ObtenerDetalleSolicitud(r.Context(), idConexion)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		logger.Error.Printf("Error al obtener detalle de solicitud %d: %v", idConexion, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder con éxito
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// ConfirmarFactibilidadHandler maneja POST /v1/api/revisacion/confirmar-factibilidad
func (h *ConexionHandler) ConfirmarFactibilidadHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	// Decodificar el cuerpo de la solicitud
	var req clientesModelos.ConfirmarFactibilidadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error.Printf("Error decodificando request: %v", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "formato de solicitud inválido")
		return
	}

	// Validaciones básicas
	if req.IDConexion <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_conexion es requerido y debe ser mayor que 0")
		return
	}

	if req.NAP == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "nap es requerido")
		return
	}

	if req.VLAN <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "vlan es requerido y debe ser mayor que 0")
		return
	}

	// Si puerto está presente, validar que sea positivo
	if req.Puerto != nil && *req.Puerto <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "puerto debe ser mayor que 0 si se proporciona")
		return
	}

	logger.Info.Printf("Confirmando factibilidad para conexión %d", req.IDConexion)

	// Llamar al servicio
	response, err := h.conexionService.ConfirmarFactibilidad(r.Context(), &req)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		logger.Error.Printf("Error confirmando factibilidad: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder con éxito
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// RechazarFactibilidadHandler maneja POST /v1/api/revisacion/rechazar-factibilidad
func (h *ConexionHandler) RechazarFactibilidadHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	// Decodificar el cuerpo de la solicitud
	var req clientesModelos.RechazarFactibilidadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error.Printf("Error decodificando request: %v", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "formato de solicitud inválido")
		return
	}

	// Validaciones básicas
	if req.IDConexion <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_conexion es requerido y debe ser mayor que 0")
		return
	}

	logger.Info.Printf("Rechazando factibilidad para conexión %d", req.IDConexion)

	// Llamar al servicio
	response, err := h.conexionService.RechazarFactibilidad(r.Context(), &req)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		logger.Error.Printf("Error rechazando factibilidad: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder con éxito
	utilidades.ResponderJSON(w, http.StatusOK, response)
}
