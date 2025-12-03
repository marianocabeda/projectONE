package direccion

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"contrato_one_internet_controlador/internal/validadores"
)

type DireccionHandler struct {
	service *servicios.DireccionService
}

func NewHandler(service *servicios.DireccionService) *DireccionHandler {
	return &DireccionHandler{service: service}
}

// ListarDirecciones maneja GET /v1/api/direcciones
// Retorna lista paginada de direcciones activas con filtros opcionales.
func (h *DireccionHandler) ListarDirecciones(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	// Parsear parámetros de paginación con valores por defecto
	page := 1
	limit := 20
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if l := q.Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
		if limit > 100 {
			limit = 100
		}
	}

	// Parsear filtros opcionales
	idDistrito := 0
	if d := q.Get("id_distrito"); d != "" {
		if v, err := strconv.Atoi(d); err == nil && v > 0 {
			idDistrito = v
		}
	}
	calle := q.Get("calle")
	codigoPostal := q.Get("codigo_postal")
	numero := q.Get("numero")
	orden := q.Get("orden")

	// Llamar al servicio modelo
	resp, err := h.service.ListarDirecciones(ctx, page, limit, idDistrito, calle, codigoPostal, numero, orden)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error listando direcciones: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ObtenerDireccionPorID maneja GET /v1/api/direcciones/:id
// Retorna detalle de una dirección específica.
func (h *DireccionHandler) ObtenerDireccionPorID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	if idStr == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
		return
	}

	resp, err := h.service.ObtenerDireccionPorID(ctx, id)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error obteniendo dirección %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// CrearDireccion maneja POST /v1/api/direcciones
// Crea una nueva dirección (o retorna existente si hay coincidencia).
func (h *DireccionHandler) CrearDireccion(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()

	var req modelos.Direccion
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	// Normalizar dirección
	req.Normalizar()

	// Validar dirección
	if err := validadores.ValidarDireccion(req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Llamar al servicio modelo
	idDireccion, err := h.service.CrearDireccion(ctx, req)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error creando dirección: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{
		"mensaje":       "Dirección creada correctamente",
		"id_direccion":  idDireccion,
	})
}

// ActualizarDireccion maneja PATCH /v1/api/direcciones/:id
// Actualiza parcialmente una dirección existente.
func (h *DireccionHandler) ActualizarDireccion(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	if idStr == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
		return
	}

	defer r.Body.Close()
	var req modelos.Direccion
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	// Normalizar dirección
	req.Normalizar()

	// Validar dirección
	if err := validadores.ValidarDireccion(req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Llamar al servicio modelo
	err = h.service.ActualizarDireccion(ctx, id, req)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error actualizando dirección %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "Dirección actualizada correctamente",
	})
}

// EliminarDireccion maneja DELETE /v1/api/direcciones/:id
// Ejecuta borrado lógico de una dirección.
func (h *DireccionHandler) EliminarDireccion(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	if idStr == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
		return
	}

	// Llamar al servicio modelo
	err = h.service.BorrarDireccion(ctx, id)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error borrando dirección %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "Dirección eliminada correctamente",
	})
}
