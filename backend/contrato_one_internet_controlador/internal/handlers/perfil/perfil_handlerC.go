package perfil

import (
	"net/http"
	"strconv"

	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/logger"
)

// PerfilHandlerC maneja las solicitudes de perfil del cliente
type PerfilHandlerC struct {
	ModeloClient *servicios.ModeloClient
}

// NewPerfilHandlerC crea un nuevo handler de perfil
func NewPerfilHandlerC(mc *servicios.ModeloClient) *PerfilHandlerC {
	return &PerfilHandlerC{
		ModeloClient: mc,
	}
}

// ObtenerMisContratos obtiene los contratos del usuario autenticado
func (h *PerfilHandlerC) ObtenerMisContratos(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extraer claims del JWT
	claims, ok := middleware.GetClaimsFromContext(ctx)
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "no se pudo obtener información del token")
		return
	}

	// Verificar que el usuario tenga el rol Cliente
	if !claims.HasRole("cliente"){
		logger.Warn.Printf("Usuario %d intentó acceder a contratos sin rol Cliente", claims.IDUsuario)
		utilidades.ResponderError(w, http.StatusForbidden, "acceso denegado: requiere rol Cliente")
		return
	}

	// Parsear parámetros de query
	page := 1
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		pageVal, err := strconv.Atoi(pageStr)
		if err != nil || pageVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "page debe ser un entero mayor a 0")
			return
		}
		page = pageVal
	}

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		limitVal, err := strconv.Atoi(limitStr)
		if err != nil || limitVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "limit debe ser un entero mayor a 0")
			return
		}
		if limitVal > 50 {
			utilidades.ResponderError(w, http.StatusBadRequest, "limit máximo es 50")
			return
		}
		limit = limitVal
	}

	sortBy := r.URL.Query().Get("sort")
	if sortBy == "" {
		sortBy = "fecha_inicio"
	}
	// Validar sortBy
	validSorts := map[string]bool{
		"fecha_inicio": true,
		"estado":       true,
		"plan":         true,
	}
	if !validSorts[sortBy] {
		utilidades.ResponderError(w, http.StatusBadRequest, "sort solo puede ser: fecha_inicio, estado, plan")
		return
	}

	sortOrder := r.URL.Query().Get("order")
	if sortOrder == "" {
		sortOrder = "DESC"
	}
	if sortOrder != "ASC" && sortOrder != "DESC" {
		utilidades.ResponderError(w, http.StatusBadRequest, "order solo puede ser ASC o DESC")
		return
	}

	// Llamar al servicio Modelo
	resp, err := h.ModeloClient.GetMisContratos(
		ctx,
		claims.IDPersona,
		page,
		limit,
		sortBy,
		sortOrder,
	)
	if err != nil {
		logger.Error.Printf("Error al obtener contratos del modelo para persona %d: %v", claims.IDPersona, err)
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "error al obtener contratos")
		}
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ObtenerMisConexiones obtiene las conexiones del usuario autenticado
func (h *PerfilHandlerC) ObtenerMisConexiones(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Extraer claims del JWT
	claims, ok := middleware.GetClaimsFromContext(ctx)
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "no se pudo obtener información del token")
		return
	}

	// Verificar que el usuario tenga el rol Cliente
	if !claims.HasRole("cliente") {
		logger.Warn.Printf("Usuario %d intentó acceder a conexiones sin rol Cliente", claims.IDUsuario)
		utilidades.ResponderError(w, http.StatusForbidden, "acceso denegado: requiere rol Cliente")
		return
	}

	// Parsear parámetros de query
	page := 1
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		pageVal, err := strconv.Atoi(pageStr)
		if err != nil || pageVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "page debe ser un entero mayor a 0")
			return
		}
		page = pageVal
	}

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		limitVal, err := strconv.Atoi(limitStr)
		if err != nil || limitVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "limit debe ser un entero mayor a 0")
			return
		}
		if limitVal > 50 {
			utilidades.ResponderError(w, http.StatusBadRequest, "limit máximo es 50")
			return
		}
		limit = limitVal
	}

	sortBy := r.URL.Query().Get("sort")
	if sortBy == "" {
		sortBy = "fecha_instalacion"
	}
	// Validar sortBy
	validSorts := map[string]bool{
		"nro_conexion":      true,
		"estado":            true,
		"fecha_instalacion": true,
		"distrito":          true,
	}
	if !validSorts[sortBy] {
		utilidades.ResponderError(w, http.StatusBadRequest, "sort solo puede ser: nro_conexion, estado, fecha_instalacion, distrito")
		return
	}

	sortOrder := r.URL.Query().Get("order")
	if sortOrder == "" {
		sortOrder = "DESC"
	}
	if sortOrder != "ASC" && sortOrder != "DESC" {
		utilidades.ResponderError(w, http.StatusBadRequest, "order solo puede ser ASC o DESC")
		return
	}

	// Llamar al servicio Modelo
	resp, err := h.ModeloClient.GetMisConexiones(
		ctx,
		claims.IDPersona,
		page,
		limit,
		sortBy,
		sortOrder,
	)
	if err != nil {
		logger.Error.Printf("Error al obtener conexiones del modelo para persona %d: %v", claims.IDPersona, err)
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "error al obtener conexiones")
		}
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}
