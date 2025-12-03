package tipo_iva

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

type TipoIvaHandler struct {
    service *servicios.TipoIvaService
}

func NewHandler(s *servicios.TipoIvaService) *TipoIvaHandler { return &TipoIvaHandler{service: s} }

func (h *TipoIvaHandler) ListarTipoIva(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tipos, err := h.service.ObtenerTiposIva(ctx)
    if err != nil { utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."}); return }
    if len(tipos) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos_iva": []interface{}{} }); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos_iva": tipos})
}

func (h *TipoIvaHandler) ObtenerTipoIvaPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"}); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    t, err := h.service.ObtenerTipoIvaPorID(ctx, id)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) && modeloErr.StatusCode == http.StatusNotFound { utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Tipo de IVA no encontrado"}); return }
        utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Tipo de IVA no encontrado"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, t)
}

// Admin handlers: Crear, Actualizar, Eliminar
func (h *TipoIvaHandler) CrearTipoIva(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req map[string]string
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    tipo, ok := req["tipo_iva"]
    if !ok || tipo == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El campo 'tipo_iva' es obligatorio"}); return }
    // Ensure admin (middleware.RequireRole should be applied on route)
    _, ok = middleware.GetClaimsFromContext(ctx)
    if !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    // include id_usuario_creador from JWT claims
    claims, ok := middleware.GetClaimsFromContext(ctx)
    var payload map[string]interface{}
    if ok {
        payload = map[string]interface{}{"tipo_iva": tipo, "id_usuario_creador": int(claims.IDUsuario)}
    } else {
        payload = map[string]interface{}{"tipo_iva": tipo}
    }
    _, err := h.service.CrearTipoIva(ctx, payload)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Tipo de IVA creado correctamente"})
}

func (h *TipoIvaHandler) ActualizarTipoIva(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    var req map[string]string
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    tipo, ok := req["tipo_iva"]
    if !ok || tipo == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El campo 'tipo_iva' es obligatorio"}); return }
    _, ok = middleware.GetClaimsFromContext(ctx)
    if !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    payload := map[string]string{"tipo_iva": tipo}
    if err := h.service.ActualizarTipoIva(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de IVA actualizado correctamente"})
}

func (h *TipoIvaHandler) EliminarTipoIva(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    _, ok := middleware.GetClaimsFromContext(ctx)
    if !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.EliminarTipoIva(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de IVA eliminado correctamente"})
}
