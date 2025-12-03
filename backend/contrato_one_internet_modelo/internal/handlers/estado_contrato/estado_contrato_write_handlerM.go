package estado_contrato

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

type EstadoContratoWriteHandler struct {
    service *servicios.EstadoContratoService
}

func NewWriteHandler(s *servicios.EstadoContratoService) *EstadoContratoWriteHandler { return &EstadoContratoWriteHandler{service: s} }

// POST /api/v1/internal/estados-contrato
func (h *EstadoContratoWriteHandler) CrearEstadoContratoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req struct{
        NombreEstado string `json:"nombre_estado"`
        Descripcion   *string `json:"descripcion"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.NombreEstado)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_estado' es obligatorio"); return }
    id, err := h.service.Crear(ctx, nombre, req.Descripcion)
    if err != nil {
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un estado de contrato con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_estado' debe tener entre 3 y 100 caracteres"); return }
        logger.Error.Printf("Error creando estado_contrato: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Estado de contrato creado correctamente", "id_estado_contrato": id})
}

// PATCH /api/v1/internal/estados-contrato/{id}
func (h *EstadoContratoWriteHandler) ActualizarEstadoContratoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    var req struct{
        NombreEstado string `json:"nombre_estado"`
        Descripcion   *string `json:"descripcion"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.NombreEstado)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_estado' es obligatorio"); return }
    if err := h.service.Actualizar(ctx, id, nombre, req.Descripcion); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Estado de contrato no encontrado"); return }
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un estado de contrato con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_estado' debe tener entre 3 y 100 caracteres"); return }
        logger.Error.Printf("Error actualizando estado_contrato %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de contrato actualizado correctamente"})
}

// DELETE /api/v1/internal/estados-contrato/{id}
func (h *EstadoContratoWriteHandler) EliminarEstadoContratoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Estado de contrato no encontrado"); return }
        logger.Error.Printf("Error borrando estado_contrato %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de contrato eliminado correctamente"})
}
