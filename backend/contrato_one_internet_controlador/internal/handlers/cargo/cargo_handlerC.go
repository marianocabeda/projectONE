package cargo

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

type CargoHandler struct{
    service *servicios.CargoService
}

func NewHandler(s *servicios.CargoService) *CargoHandler { return &CargoHandler{service: s} }

func (h *CargoHandler) ListarCargos(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    list, err := h.service.ObtenerCargos(ctx)
    if err != nil { utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."}); return }
    if len(list) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"cargos": []interface{}{} }); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"cargos": list})
}

func (h *CargoHandler) ObtenerCargoPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"}); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    e, err := h.service.ObtenerCargoPorID(ctx, id)
    if err != nil { utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Cargo no encontrado"}); return }
    utilidades.ResponderJSON(w, http.StatusOK, e)
}

// Admin create
func (h *CargoHandler) CrearCargo(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if claims, ok := middleware.GetClaimsFromContext(ctx); ok && claims != nil { req["id_usuario_creador"] = int(claims.IDUsuario) }
    id, err := h.service.CrearCargo(ctx, req)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Cargo creado correctamente", "id_cargo": id})
}

func (h *CargoHandler) ActualizarCargo(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if err := h.service.ActualizarCargo(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Cargo actualizado correctamente"})
}

func (h *CargoHandler) EliminarCargo(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.EliminarCargo(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Cargo eliminado correctamente"})
}
