package permiso

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

type PermisoWriteHandler struct {
	service *servicios.PermisoService
}

func NewWriteHandler(s *servicios.PermisoService) *PermisoWriteHandler {
	return &PermisoWriteHandler{service: s}
}

func (h *PermisoWriteHandler) CrearPermisoHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()
	var req struct {
		Nombre      string  `json:"nombre"`
		Descripcion *string `json:"descripcion"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	nombre := strings.TrimSpace(req.Nombre)
	if nombre == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio")
		return
	}
	id, err := h.service.Crear(ctx, nombre, req.Descripcion)
	if err != nil {
		if err == utilidades.ErrDuplicado {
			utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un permiso con ese nombre")
			return
		}
		if err == utilidades.ErrValidacion {
			utilidades.ResponderError(w, http.StatusBadRequest, "Validación: revisá los campos")
			return
		}
		logger.Error.Printf("Error creando permiso: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Permiso creado correctamente", "id_permiso": id})
}

func (h *PermisoWriteHandler) ActualizarPermisoHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
		return
	}
	var req struct {
		Nombre      string  `json:"nombre"`
		Descripcion *string `json:"descripcion"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	nombre := strings.TrimSpace(req.Nombre)
	if nombre == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio")
		return
	}
	if err := h.service.Actualizar(ctx, id, nombre, req.Descripcion); err != nil {
		if err == utilidades.ErrNoEncontrado {
			utilidades.ResponderError(w, http.StatusNotFound, "Permiso no encontrado")
			return
		}
		if err == utilidades.ErrDuplicado {
			utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un permiso con ese nombre")
			return
		}
		if err == utilidades.ErrValidacion {
			utilidades.ResponderError(w, http.StatusBadRequest, "Validación: revisá los campos")
			return
		}
		logger.Error.Printf("Error actualizando permiso %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Permiso actualizado correctamente"})
}

func (h *PermisoWriteHandler) EliminarPermisoHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
		return
	}
	if err := h.service.BorrarLogico(ctx, id); err != nil {
		if err == utilidades.ErrNoEncontrado {
			utilidades.ResponderError(w, http.StatusNotFound, "Permiso no encontrado")
			return
		}
		if err == utilidades.ErrValidacion {
			utilidades.ResponderError(w, http.StatusBadRequest, "No se puede eliminar: el permiso está en uso por roles")
			return
		}
		logger.Error.Printf("Error borrando permiso %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Permiso eliminado correctamente"})
}

func (h *PermisoWriteHandler) ReactivarPermisoHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
		return
	}
	reactivated, err := h.service.Reactivar(ctx, id)
	if err != nil {
		if err == utilidades.ErrNoEncontrado {
			utilidades.ResponderError(w, http.StatusNotFound, "Permiso no encontrado")
			return
		}
		if err == utilidades.ErrDuplicado {
			utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un permiso con ese nombre")
			return
		}
		logger.Error.Printf("Error reactivando permiso %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	if !reactivated {
		utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "El permiso ya está activo"})
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Permiso reactivado correctamente"})
}
