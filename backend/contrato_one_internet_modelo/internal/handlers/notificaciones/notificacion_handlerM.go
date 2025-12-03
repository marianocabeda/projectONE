package notificaciones

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type NotificacionHandler struct {
	NotificacionService *servicios.NotificacionService
}

func NewNotificacionHandler(ns *servicios.NotificacionService) *NotificacionHandler {
	return &NotificacionHandler{NotificacionService: ns}
}

// ObtenerNotificacionesHandler maneja GET /api/v1/internal/notificaciones
func (h *NotificacionHandler) ObtenerNotificacionesHandler(w http.ResponseWriter, r *http.Request) {
	// Obtener id_persona desde el contexto (autenticación interna)
	idPersona, ok := r.Context().Value("id_persona").(int)
	if !ok || idPersona == 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_persona no proporcionado")
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

	// Parámetro pageSize (default: 20)
	pageSize := 20
	if pageSizeStr := queryParams.Get("pageSize"); pageSizeStr != "" {
		pageSizeVal, err := strconv.Atoi(pageSizeStr)
		if err != nil || pageSizeVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "pageSize debe ser un entero mayor a 0")
			return
		}
		pageSize = pageSizeVal
	}

	// Parámetro sort_by (default: creado)
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

	// Llamar al servicio
	resp, err := h.NotificacionService.ObtenerNotificaciones(
		r.Context(),
		idPersona,
		leido,
		page,
		pageSize,
		sortBy,
		sortDirection,
	)
	if err != nil {
		log.Printf("Error al obtener notificaciones: %v", err)
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// MarcarComoLeidaHandler maneja POST /api/v1/internal/notificaciones/marcar-como-leida
func (h *NotificacionHandler) MarcarComoLeidaHandler(w http.ResponseWriter, r *http.Request) {
	// Obtener id_persona desde el contexto (autenticación interna)
	idPersona, ok := r.Context().Value("id_persona").(int)
	if !ok || idPersona == 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_persona no proporcionado")
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

	// Llamar al servicio
	err := h.NotificacionService.MarcarComoLeida(r.Context(), req.IDNotificacion, idPersona)
	if err != nil {
		log.Printf("Error al marcar notificación como leída: %v", err)
		
		// Verificar si es un error de notificación no encontrada
		if strings.Contains(err.Error(), "no encontrada") || strings.Contains(err.Error(), "no pertenece") {
			utilidades.ResponderError(w, http.StatusNotFound, "La notificación no existe o no pertenece a este usuario.")
			return
		}
		
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "Notificación marcada como leída",
	})
}
