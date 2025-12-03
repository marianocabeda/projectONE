package tipo_iva

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

type TipoIvaWriteHandler struct {
    service *servicios.TipoIvaService
}

func NewWriteHandler(s *servicios.TipoIvaService) *TipoIvaWriteHandler { return &TipoIvaWriteHandler{service: s} }

// POST /api/v1/internal/tipo-iva
func (h *TipoIvaWriteHandler) CrearTipoIvaHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req struct{ TipoIVA string `json:"tipo_iva"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    tipo := strings.TrimSpace(req.TipoIVA)
    if tipo == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'tipo_iva' es obligatorio"); return }
    // id_usuario_creador could be passed via context by the controller; in modelo internal handlers assume controller included it in body if necessary
    // But spec requires id_usuario_creador from token in controller; here we accept it optional if present
    var idUsuario *int = nil
    // call service
    id, err := h.service.Crear(ctx, tipo, idUsuario)
    if err != nil {
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un tipo de IVA con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'tipo_iva' es inválido o demasiado largo"); return }
        logger.Error.Printf("Error creando tipo_iva: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Tipo de IVA creado correctamente", "id_tipo_iva": id})
}

// PATCH /api/v1/internal/tipo-iva/{id}
func (h *TipoIvaWriteHandler) ActualizarTipoIvaHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    var req struct{ TipoIVA string `json:"tipo_iva"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    tipo := strings.TrimSpace(req.TipoIVA)
    if tipo == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'tipo_iva' es obligatorio"); return }
    if err := h.service.Actualizar(ctx, id, tipo); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Tipo de IVA no encontrado"); return }
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un tipo de IVA con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'tipo_iva' es inválido o demasiado largo"); return }
        logger.Error.Printf("Error actualizando tipo_iva %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de IVA actualizado correctamente"})
}

// DELETE /api/v1/internal/tipo-iva/{id}
func (h *TipoIvaWriteHandler) EliminarTipoIvaHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Tipo de IVA no encontrado"); return }
        logger.Error.Printf("Error borrando tipo_iva %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de IVA eliminado correctamente"})
}
