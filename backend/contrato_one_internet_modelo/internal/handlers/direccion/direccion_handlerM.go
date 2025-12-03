package direccion

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

type DireccionHandler struct {
	service *servicios.DireccionService
}

func NewHandler(s *servicios.DireccionService) *DireccionHandler {
	return &DireccionHandler{service: s}
}

// ListarDirecciones maneja GET /api/v1/internal/direcciones
// Retorna lista paginada de direcciones activas con filtros opcionales.
func (h *DireccionHandler) ListarDirecciones(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()

	// Parsear parámetros de paginación
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

	// Llamar al servicio
	res, err := h.service.ListarDireccionesPaginado(ctx, page, limit, idDistrito, calle, codigoPostal, numero, orden)
	if err != nil {
		logger.Error.Printf("Error listando direcciones: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, res)
}

// ObtenerDireccionPorID maneja GET /api/v1/internal/direcciones/:id
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

	d, err := h.service.ObtenerDireccionPorID(ctx, id)
	if err != nil {
		if err == utilidades.ErrNoEncontrado {
			utilidades.ResponderError(w, http.StatusNotFound, "dirección no encontrada")
			return
		}
		logger.Error.Printf("Error obteniendo dirección %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, d)
}

// CrearDireccionHandler maneja POST /api/v1/internal/direcciones
// Crea una nueva dirección (o retorna existente si hay coincidencia).
func (h *DireccionHandler) CrearDireccionHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()

	var req modelos.Direccion
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	// Validaciones básicas (el validador completo se aplica en el controlador)
	if req.Calle == "" || req.Numero == "" || req.CodigoPostal == "" || req.IDDistrito <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "campos requeridos faltantes")
		return
	}

	idDireccion, err := h.service.CrearDireccion(ctx, &req)
	if err != nil {
		if err == utilidades.ErrValidacion {
			utilidades.ResponderError(w, http.StatusBadRequest, "datos inválidos")
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

// ActualizarDireccionHandler maneja PATCH /api/v1/internal/direcciones/:id
// Actualiza parcialmente una dirección existente.
func (h *DireccionHandler) ActualizarDireccionHandler(w http.ResponseWriter, r *http.Request) {
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

	// Validaciones básicas
	if req.Calle == "" || req.Numero == "" || req.CodigoPostal == "" || req.IDDistrito <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "campos requeridos faltantes")
		return
	}

	err = h.service.ActualizarDireccion(ctx, id, &req)
	if err != nil {
		if err == utilidades.ErrNoEncontrado {
			utilidades.ResponderError(w, http.StatusNotFound, "dirección no encontrada")
			return
		}
		if err == utilidades.ErrDuplicado {
			utilidades.ResponderError(w, http.StatusConflict, "ya existe una dirección con esa combinación")
			return
		}
		if err == utilidades.ErrValidacion {
			utilidades.ResponderError(w, http.StatusBadRequest, "datos inválidos")
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

// EliminarDireccionHandler maneja DELETE /api/v1/internal/direcciones/:id
// Ejecuta borrado lógico de una dirección.
func (h *DireccionHandler) EliminarDireccionHandler(w http.ResponseWriter, r *http.Request) {
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

	err = h.service.BorrarDireccion(ctx, id)
	if err != nil {
		if err == utilidades.ErrNoEncontrado {
			utilidades.ResponderError(w, http.StatusNotFound, "dirección no encontrada")
			return
		}
		if err == utilidades.ErrValidacion {
			utilidades.ResponderError(w, http.StatusBadRequest, "la dirección está en uso y no puede eliminarse")
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
