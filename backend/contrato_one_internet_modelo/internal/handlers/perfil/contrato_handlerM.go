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

// ContratoHandlerM maneja las solicitudes relacionadas con contratos del perfil
type ContratoHandlerM struct {
	contratoRepo *repositorios.ContratoRepo
}

// NewContratoHandlerM crea un nuevo handler de contratos
func NewContratoHandlerM(contratoRepo *repositorios.ContratoRepo) *ContratoHandlerM {
	return &ContratoHandlerM{
		contratoRepo: contratoRepo,
	}
}

func (h *ContratoHandlerM) ObtenerMisContratos(w http.ResponseWriter, r *http.Request) {
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

	// Calcular offset
	offset := (page - 1) * limit

	// Obtener total de contratos
	total, err := h.contratoRepo.ContarContratosPorPersona(ctx, idPersona)
	if err != nil {
		logger.Error.Printf("Error contando contratos para persona %d: %v\n", idPersona, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error al contar contratos")
		return
	}

	// Obtener contratos
	contratos, err := h.contratoRepo.ListarContratosPorPersona(ctx, idPersona, limit, offset, sortBy, sortOrder)
	if err != nil {
		logger.Error.Printf("Error obteniendo contratos para persona %d: %v\n", idPersona, err)		
		utilidades.ResponderError(w, http.StatusInternalServerError, "error al obtener contratos")
		return
	}

	// Si no hay contratos, devolver array vacío
	if contratos == nil {
		contratos = []modelos.ContratoDetalle{}
	}

	// Calcular total de páginas
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	// Construir respuesta
	response := modelos.MisContratosResponse{
		Contratos:  contratos,
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}

	utilidades.ResponderJSON(w, http.StatusOK, response)
}
