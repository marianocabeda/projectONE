package notificaciones

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
)

type NotificacionHandler struct {
	ModeloClient *servicios.ModeloClient
}

func NewNotificacionHandler(mc *servicios.ModeloClient) *NotificacionHandler {
	return &NotificacionHandler{ModeloClient: mc}
}

// ObtenerNotificacionesHandler maneja GET /api/v1/notificaciones
func (h *NotificacionHandler) ObtenerNotificacionesHandler(w http.ResponseWriter, r *http.Request) {
	// Obtener claims del JWT (ya validado por middleware)
	claims, ok := middleware.GetClaimsFromContext(r.Context())
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "no se pudo obtener información del token")
		return
	}

	// Extraer id_persona de los claims
	idPersona := claims.IDPersona
	if idPersona == 0 {
		utilidades.ResponderError(w, http.StatusUnauthorized, "id_persona no encontrado en el token")
		return
	}

	// Obtener parámetros de query
	queryParams := r.URL.Query()

	// Parámetro leido (opcional)
	var leido *int
	if leidoStr := queryParams.Get("leido"); leidoStr != "" {
		leidoVal, err := strconv.Atoi(leidoStr)
		if err != nil || (leidoVal != 0 && leidoVal != 1) {
			utilidades.ResponderError(w, http.StatusBadRequest, "leido debe ser 0 o 1")
			return
		}
		leido = &leidoVal
	}

	// Parámetro page (default: 1)
	page := 1
	if pageStr := queryParams.Get("page"); pageStr != "" {
		pageVal, err := strconv.Atoi(pageStr)
		if err != nil || pageVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "page debe ser un entero mayor a 0")
			return
		}
		page = pageVal
	}

	// Parámetro pageSize (default: 20, max: 100)
	pageSize := 20
	if pageSizeStr := queryParams.Get("pageSize"); pageSizeStr != "" {
		pageSizeVal, err := strconv.Atoi(pageSizeStr)
		if err != nil || pageSizeVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "pageSize debe ser un entero mayor a 0")
			return
		}
		if pageSizeVal > 100 {
			utilidades.ResponderError(w, http.StatusBadRequest, "pageSize máximo es 100")
			return
		}
		pageSize = pageSizeVal
	}

	// Parámetro sort_by (default: creado, solo permite "creado")
	sortBy := queryParams.Get("sort_by")
	if sortBy == "" {
		sortBy = "creado"
	}
	if sortBy != "creado" {
		utilidades.ResponderError(w, http.StatusBadRequest, "sort_by solo puede ser 'creado'")
		return
	}

	// Parámetro sort_direction (default: DESC)
	sortDirection := queryParams.Get("sort_direction")
	if sortDirection == "" {
		sortDirection = "DESC"
	}
	if sortDirection != "ASC" && sortDirection != "DESC" {
		utilidades.ResponderError(w, http.StatusBadRequest, "sort_direction solo puede ser ASC o DESC")
		return
	}

	// Llamar al servicio Modelo
	resp, err := h.ModeloClient.GetNotificaciones(
		r.Context(),
		idPersona,
		leido,
		page,
		pageSize,
		sortBy,
		sortDirection,
	)
	if err != nil {
		log.Printf("Error al obtener notificaciones del modelo: %v", err)
		// Verificar si es un error del Modelo con código de estado específico
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "error al obtener notificaciones")
		}
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// MarcarComoLeidaHandler maneja POST /v1/api/notificaciones/marcar-como-leida
func (h *NotificacionHandler) MarcarComoLeidaHandler(w http.ResponseWriter, r *http.Request) {
	// Obtener claims del JWT (ya validado por middleware)
	claims, ok := middleware.GetClaimsFromContext(r.Context())
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "no se pudo obtener información del token")
		return
	}

	// Extraer id_persona de los claims
	idPersona := claims.IDPersona
	if idPersona == 0 {
		utilidades.ResponderError(w, http.StatusUnauthorized, "id_persona no encontrado en el token")
		return
	}

	// Parsear cuerpo JSON
	var req struct {
		IDNotificacion int `json:"id_notificacion"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "El parámetro 'id_notificacion' es obligatorio y debe ser un número válido.")
		return
	}

	// Validar que id_notificacion sea mayor a 0
	if req.IDNotificacion <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "El parámetro 'id_notificacion' es obligatorio y debe ser un número válido.")
		return
	}

	// Llamar al servicio Modelo
	err := h.ModeloClient.MarcarNotificacionComoLeida(r.Context(), idPersona, req.IDNotificacion)
	if err != nil {
		log.Printf("Error al marcar notificación como leída: %v", err)
		// Verificar si es un error del Modelo con código de estado específico
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Ocurrió un error inesperado en el servidor.")
		}
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "Notificación marcada como leída",
	})
}
