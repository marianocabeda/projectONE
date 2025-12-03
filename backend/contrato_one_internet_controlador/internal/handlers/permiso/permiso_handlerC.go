package permiso

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
)

type PermisoHandler struct {
	service *servicios.PermisoService
}

func NewHandler(s *servicios.PermisoService) *PermisoHandler { return &PermisoHandler{service: s} }

func (h *PermisoHandler) ListarPermisos(w http.ResponseWriter, r *http.Request) {
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

	res, err := h.service.ObtenerPermisosPaginados(ctx, page, limit, nombre, orden)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
			return
		}
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."})
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

	res, err := h.service.ObtenerPermisosInactivosPaginados(ctx, page, limit, nombre, orden)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
			return
		}
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."})
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, res)
}

func (h *PermisoHandler) ObtenerPermisoPorID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	if idStr == "" {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"})
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"})
		return
	}
	e, err := h.service.ObtenerPermisoPorID(ctx, id)
	if err != nil {
		utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Permiso no encontrado"})
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, e)
}

// Admin create
func (h *PermisoHandler) CrearPermiso(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()
	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	if _, ok := middleware.GetClaimsFromContext(ctx); !ok {
		utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"})
		return
	}
	if claims, ok := middleware.GetClaimsFromContext(ctx); ok && claims != nil {
		req["id_usuario_creador"] = int(claims.IDUsuario)
	}
	id, err := h.service.CrearPermiso(ctx, req)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
			return
		}
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
		return
	}
	utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Permiso creado correctamente", "id_permiso": id})
}

func (h *PermisoHandler) ActualizarPermiso(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"})
		return
	}
	if _, ok := middleware.GetClaimsFromContext(ctx); !ok {
		utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"})
		return
	}
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	if err := h.service.ActualizarPermiso(ctx, id, payload); err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
			return
		}
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Permiso actualizado correctamente"})
}

func (h *PermisoHandler) EliminarPermiso(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"})
		return
	}
	if _, ok := middleware.GetClaimsFromContext(ctx); !ok {
		utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"})
		return
	}
	if err := h.service.EliminarPermiso(ctx, id); err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
			return
		}
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Permiso eliminado correctamente"})
}

func (h *PermisoHandler) ReactivarPermiso(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"})
		return
	}
	if _, ok := middleware.GetClaimsFromContext(ctx); !ok {
		utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"})
		return
	}
	resp, err := h.service.ReactivarPermiso(ctx, id)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
			return
		}
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
		return
	}
	// Forward the modelo response (usually {"mensaje": ...})
	if resp == nil {
		utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Permiso reactivado correctamente"})
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, resp)
}
