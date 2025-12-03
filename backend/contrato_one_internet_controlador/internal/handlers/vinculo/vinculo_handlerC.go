package vinculo

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

type VinculoHandler struct {
    service *servicios.VinculoService
}

func NewHandler(s *servicios.VinculoService) *VinculoHandler { return &VinculoHandler{service: s} }

func (h *VinculoHandler) ListarVinculos(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    listas, err := h.service.ObtenerVinculos(ctx)
    if err != nil { utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."}); return }
    if len(listas) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"vinculos": []interface{}{} }); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"vinculos": listas})
}

func (h *VinculoHandler) ObtenerVinculoPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"}); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    v, err := h.service.ObtenerVinculoPorID(ctx, id)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) && modeloErr.StatusCode == http.StatusNotFound { utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Vínculo no encontrado"}); return }
        utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Vínculo no encontrado"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, v)
}

// Admin create
func (h *VinculoHandler) CrearVinculo(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    nombreI, ok := req["nombre_vinculo"]
    if !ok { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El campo 'nombre_vinculo' es obligatorio"}); return }
    _, _ = nombreI.(string)
    // ensure admin
    _, ok = middleware.GetClaimsFromContext(ctx)
    if !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    // add creator id
    claims, _ := middleware.GetClaimsFromContext(ctx)
    if claims != nil { req["id_usuario_creador"] = int(claims.IDUsuario) }
    _, err := h.service.CrearVinculo(ctx, req)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Vínculo creado correctamente"})
}

func (h *VinculoHandler) ActualizarVinculo(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.ActualizarVinculo(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Vínculo actualizado correctamente"})
}

func (h *VinculoHandler) EliminarVinculo(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.EliminarVinculo(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Vínculo eliminado correctamente"})
}
