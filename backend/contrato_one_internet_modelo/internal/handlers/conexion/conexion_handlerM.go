package conexion

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

// ConexionHandler maneja las solicitudes HTTP de conexión
type ConexionHandler struct {
	service *servicios.ConexionService
}

// NewConexionHandler crea una nueva instancia
func NewConexionHandler(s *servicios.ConexionService) *ConexionHandler {
	return &ConexionHandler{service: s}
}

// SolicitarConexionParticularHandler maneja POST /api/v1/internal/solicitar-conexion-particular
func (h *ConexionHandler) SolicitarConexionParticularHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var req struct {
		servicios.SolicitudConexionRequest
		IDUsuario int `json:"id_usuario"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error.Printf("Error decodificando request: %v", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "Estructura de datos inválida")
		return
	}

	// Validación básica
	if req.IDUsuario <= 0 {
		utilidades.ManejarErrorHTTP(w, utilidades.ErrValidation{
			Campo:   "id_usuario",
			Mensaje: "es requerido y debe ser mayor a cero",
		})
		return
	}

	if req.IDPlan <= 0 {
		utilidades.ManejarErrorHTTP(w, utilidades.ErrValidation{
			Campo:   "id_plan",
			Mensaje: "es requerido y debe ser mayor a cero",
		})
		return
	}

	// Llamar al servicio
	resp, err := h.service.SolicitarConexionParticular(
		r.Context(),
		req.SolicitudConexionRequest,
		req.IDUsuario,
	)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa - devolver solo los datos (sin envoltorio success/data)
	// porque el controlador ya agregará ese envoltorio
	utilidades.ResponderJSON(w, http.StatusCreated, resp)
}

// ObtenerSolicitudesPendientesHandler maneja GET /api/v1/internal/revisacion/solicitudes-pendientes
func (h *ConexionHandler) ObtenerSolicitudesPendientesHandler(w http.ResponseWriter, r *http.Request) {
	// Parsear query parameters
	query := r.URL.Query()
	
	// Paginación
	page := 1
	if p := query.Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	limit := 20
	if l := query.Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	// Ordenamiento
	sortBy := query.Get("sort_by")
	if sortBy == "" {
		sortBy = "fecha_solicitud"
	}

	sortDirection := query.Get("sort_direction")
	if sortDirection == "" {
		sortDirection = "ASC"
	}

	// Filtros
	var plan *int
	if planStr := query.Get("plan"); planStr != "" {
		if parsed, err := strconv.Atoi(planStr); err == nil && parsed > 0 {
			plan = &parsed
		}
	}

	req := servicios.SolicitudesPendientesRequest{
		Page:          page,
		Limit:         limit,
		SortBy:        sortBy,
		SortDirection: sortDirection,
		Distrito:      query.Get("distrito"),
		Plan:          plan,
		Cliente:       query.Get("cliente"),
		FechaDesde:    query.Get("desde"),
		FechaHasta:    query.Get("hasta"),
		Provincia:     query.Get("provincia"),
		Departamento:  query.Get("departamento"),
	}

	response, err := h.service.ObtenerSolicitudesPendientesConFiltros(r.Context(), req)
	if err != nil {
		logger.Error.Printf("Error obteniendo solicitudes pendientes: %v", err)
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// ObtenerDetalleSolicitudHandler maneja GET /api/v1/internal/revisacion/solicitud/:id
func (h *ConexionHandler) ObtenerDetalleSolicitudHandler(w http.ResponseWriter, r *http.Request) {
	// Obtener el ID de la URL
	vars := mux.Vars(r)
	idStr := vars["id"]
	
	idConexion, err := strconv.Atoi(idStr)
	if err != nil || idConexion <= 0 {
		logger.Error.Printf("ID de conexión inválido: %s", idStr)
		utilidades.ManejarErrorHTTP(w, utilidades.ErrValidation{
			Campo:   "id",
			Mensaje: "debe ser un número entero positivo",
		})
		return
	}

	// Obtener el detalle desde el servicio
	detalle, err := h.service.ObtenerDetalleSolicitud(r.Context(), idConexion)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusOK, detalle)
}

// ConfirmarFactibilidadHandler maneja POST /api/v1/internal/revisacion/confirmar-factibilidad
func (h *ConexionHandler) ConfirmarFactibilidadHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var req modelos.ConfirmarFactibilidadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error.Printf("Error decodificando request: %v", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "Estructura de datos inválida")
		return
	}

	// Llamar al servicio
	response, err := h.service.ConfirmarFactibilidad(r.Context(), req)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// RechazarFactibilidadHandler maneja POST /api/v1/internal/revisacion/rechazar-factibilidad
func (h *ConexionHandler) RechazarFactibilidadHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	var req modelos.RechazarFactibilidadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error.Printf("Error decodificando request: %v", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "Estructura de datos inválida")
		return
	}

	// Llamar al servicio
	response, err := h.service.RechazarFactibilidad(r.Context(), req)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusOK, response)
}
