package perfil

import (
	"context"
	"math"
	"net/http"
	"strconv"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

// ConexionHandlerM maneja las solicitudes relacionadas con conexiones del perfil
type ConexionHandlerM struct {
	conexionRepo *repositorios.ConexionRepo
}

// NewConexionHandlerM crea un nuevo handler de conexiones
func NewConexionHandlerM(conexionRepo *repositorios.ConexionRepo) *ConexionHandlerM {
	return &ConexionHandlerM{
		conexionRepo: conexionRepo,
	}
}

func (h *ConexionHandlerM) ObtenerMisConexiones(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Extraer id_persona del header
	idPersonaStr := r.Header.Get("X-ID-Persona")
	if idPersonaStr == "" {
		logger.Error.Println("Header X-ID-Persona no proporcionado")
		utilidades.ResponderError(w, http.StatusUnauthorized, "no autorizado")
		return
	}

	idPersona, err := strconv.Atoi(idPersonaStr)
	if err != nil {
		logger.Error.Printf("X-ID-Persona inválido: %v\n", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de persona inválido")
		return
	}

	// Parsear parámetros de paginación
	page := 1
	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		pageVal, parseErr := strconv.Atoi(pageStr)
		if parseErr != nil || pageVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "page debe ser un entero mayor a 0")
			return
		}
		page = pageVal
	}

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		limitVal, parseErr := strconv.Atoi(limitStr)
		if parseErr != nil || limitVal <= 0 {
			utilidades.ResponderError(w, http.StatusBadRequest, "limit debe ser un entero mayor a 0")
			return
		}
		if limitVal > 50 {
			utilidades.ResponderError(w, http.StatusBadRequest, "limit máximo es 50")
			return
		}
		limit = limitVal
	}

	// Parsear ordenamiento
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

	// Calcular offset
	offset := (page - 1) * limit

	// Obtener total de conexiones
	total, err := h.conexionRepo.ContarConexionesPorPersona(ctx, idPersona)
	if err != nil {
		logger.Error.Printf("Error contando conexiones para persona %d: %v\n", idPersona, err)		
		utilidades.ResponderError(w, http.StatusInternalServerError, "error al contar conexiones")
		return
	}

	// Obtener conexiones
	conexiones, err := h.conexionRepo.ListarConexionesPorPersona(ctx, idPersona, limit, offset, sortBy, sortOrder)
	if err != nil {
		logger.Error.Printf("Error obteniendo conexiones para persona %d: %v\n", idPersona, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error al obtener conexiones")
		return
	}

	// Si no hay conexiones, devolver array vacío
	if conexiones == nil {
		conexiones = []modelos.ConexionDetalleCliente{}
	}

	// Calcular total de páginas
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	// Construir respuesta
	response := modelos.MisConexionesResponse{
		Conexiones: conexiones,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	utilidades.ResponderJSON(w, http.StatusOK, response)
}
