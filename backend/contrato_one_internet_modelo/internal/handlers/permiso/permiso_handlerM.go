package permiso

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type PermisoHandler struct {
	service *servicios.PermisoService
}

func NewHandler(s *servicios.PermisoService) *PermisoHandler { return &PermisoHandler{service: s} }

func (h *PermisoHandler) ListarPermisos(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	// parse query params: page, limit, nombre, orden
	q := r.URL.Query()
	page := 1
	limit := 50
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
	nombre := q.Get("nombre")
	orden := q.Get("orden")

	res, err := h.service.ListarPaginado(ctx, page, limit, nombre, orden)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, res)
}

func (h *PermisoHandler) ListarPermisosInactivos(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query()
	page := 1
	limit := 50
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
	nombre := q.Get("nombre")
	orden := q.Get("orden")

	res, err := h.service.ListarInactivos(ctx, page, limit, nombre, orden)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, res)
}

func (h *PermisoHandler) ObtenerPermisoPorID(w http.ResponseWriter, r *http.Request) {
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
	p, err := h.service.ObtenerPorID(ctx, id)
	if err != nil {
		utilidades.ResponderError(w, http.StatusNotFound, "Permiso no encontrado")
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, p)
}
