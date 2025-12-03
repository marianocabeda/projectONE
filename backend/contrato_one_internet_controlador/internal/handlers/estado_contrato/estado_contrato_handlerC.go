package estado_contrato

import (
    "encoding/json"
    "net/http"
    "strconv"
    "errors"

    "github.com/gorilla/mux"

    "contrato_one_internet_controlador/internal/middleware"
    "contrato_one_internet_controlador/internal/servicios"
    "contrato_one_internet_controlador/internal/utilidades"
)

type EstadoContratoHandler struct {
    service *servicios.EstadoContratoService
}

func NewHandler(s *servicios.EstadoContratoService) *EstadoContratoHandler { return &EstadoContratoHandler{service: s} }

func (h *EstadoContratoHandler) ListarEstadosContrato(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    list, err := h.service.ObtenerEstadosContrato(ctx)
    if err != nil { utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."}); return }
    if len(list) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"estados_contrato": []interface{}{} }); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"estados_contrato": list})
}

func (h *EstadoContratoHandler) ObtenerEstadoContratoPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"}); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    e, err := h.service.ObtenerEstadoContratoPorID(ctx, id)
    if err != nil { utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Estado de contrato no encontrado"}); return }
    utilidades.ResponderJSON(w, http.StatusOK, e)
}

// Admin create
func (h *EstadoContratoHandler) CrearEstadoContrato(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    // include creator id from claims if present
    if claims, ok := middleware.GetClaimsFromContext(ctx); ok && claims != nil { req["id_usuario_creador"] = int(claims.IDUsuario) }
    id, err := h.service.CrearEstadoContrato(ctx, req)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) {
            utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return
        }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Estado de contrato creado correctamente", "id_estado_contrato": id})
}

func (h *EstadoContratoHandler) ActualizarEstadoContrato(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if err := h.service.ActualizarEstadoContrato(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de contrato actualizado correctamente"})
}

func (h *EstadoContratoHandler) EliminarEstadoContrato(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.EliminarEstadoContrato(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de contrato eliminado correctamente"})
}
