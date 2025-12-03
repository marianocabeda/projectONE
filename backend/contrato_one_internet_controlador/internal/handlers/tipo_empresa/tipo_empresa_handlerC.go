package tipo_empresa

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

type TipoEmpresaHandler struct {
    service *servicios.TipoEmpresaService
}

func NewHandler(s *servicios.TipoEmpresaService) *TipoEmpresaHandler { return &TipoEmpresaHandler{service: s} }

func (h *TipoEmpresaHandler) ListarTipoEmpresa(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tipos, err := h.service.ObtenerTiposEmpresa(ctx)
    if err != nil {
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."})
        return
    }
    if len(tipos) == 0 {
        utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos_empresa": []interface{}{} })
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos_empresa": tipos})
}

func (h *TipoEmpresaHandler) ObtenerTipoEmpresaPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"}); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    t, err := h.service.ObtenerTipoEmpresaPorID(ctx, id)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) && modeloErr.StatusCode == http.StatusNotFound {
            utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Tipo de empresa no encontrado"})
            return
        }
        utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Tipo de empresa no encontrado"})
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, t)
}

// Admin write handlers
func (h *TipoEmpresaHandler) CrearTipoEmpresa(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req map[string]string
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    nombre, present := req["nombre"]
    if !present || nombre == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El campo 'nombre' es obligatorio"}); return }
    // middleware.RequireRole("admin") applied on route; ensure claims exist
    _, ok := middleware.GetClaimsFromContext(ctx)
    if !ok {
        utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"})
        return
    }
    // include id_usuario_creador from JWT claims
    claims, ok := middleware.GetClaimsFromContext(ctx)
    var payload map[string]interface{}
    if ok {
        payload = map[string]interface{}{"nombre": nombre, "id_usuario_creador": int(claims.IDUsuario)}
    } else {
        payload = map[string]interface{}{"nombre": nombre}
    }
    _, err := h.service.CrearTipoEmpresa(ctx, payload)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) {
            utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
            return
        }
        // map simple errors
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Tipo de empresa creado correctamente"})
}

func (h *TipoEmpresaHandler) ActualizarTipoEmpresa(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    var req map[string]string
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    nombre, present := req["nombre"]
    if !present || nombre == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El campo 'nombre' es obligatorio"}); return }
    // middleware.RequireRole("admin") applied on route; ensure claims exist
    _, ok := middleware.GetClaimsFromContext(ctx)
    if !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    payload := map[string]string{"nombre": nombre}
    if err := h.service.ActualizarTipoEmpresa(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de empresa actualizado correctamente"})
}

func (h *TipoEmpresaHandler) EliminarTipoEmpresa(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    _, ok := middleware.GetClaimsFromContext(ctx)
    if !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.EliminarTipoEmpresa(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de empresa eliminado correctamente"})
}
