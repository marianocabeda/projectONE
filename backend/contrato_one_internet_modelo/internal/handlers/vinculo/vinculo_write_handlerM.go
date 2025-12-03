package vinculo

import (
    "encoding/json"
    "net/http"
    "strconv"
    "strings"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
    "contrato_one_internet_modelo/internal/utilidades/logger"

    "github.com/gorilla/mux"
)

type VinculoWriteHandler struct {
    service *servicios.VinculoService
}

func NewWriteHandler(s *servicios.VinculoService) *VinculoWriteHandler { return &VinculoWriteHandler{service: s} }

// POST /api/v1/internal/vinculos
func (h *VinculoWriteHandler) CrearVinculoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req struct{
        NombreVinculo string `json:"nombre_vinculo"`
        Descripcion    *string `json:"descripcion,omitempty"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.NombreVinculo)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_vinculo' es obligatorio"); return }
    id, err := h.service.Crear(ctx, nombre, req.Descripcion)
    if err != nil {
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un vínculo con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_vinculo' debe tener entre 3 y 100 caracteres"); return }
        logger.Error.Printf("Error creando vinculo: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Vínculo creado correctamente", "id_vinculo": id})
}

// PATCH /api/v1/internal/vinculos/{id}
func (h *VinculoWriteHandler) ActualizarVinculoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    var req struct{
        NombreVinculo string `json:"nombre_vinculo"`
        Descripcion    *string `json:"descripcion,omitempty"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.NombreVinculo)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_vinculo' es obligatorio"); return }
    if err := h.service.Actualizar(ctx, id, nombre, req.Descripcion); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Vínculo no encontrado"); return }
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un vínculo con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre_vinculo' debe tener entre 3 y 100 caracteres"); return }
        logger.Error.Printf("Error actualizando vinculo %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Vínculo actualizado correctamente"})
}

// DELETE /api/v1/internal/vinculos/{id}
func (h *VinculoWriteHandler) EliminarVinculoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Vínculo no encontrado"); return }
        logger.Error.Printf("Error borrando vinculo %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Vínculo eliminado correctamente"})
}
