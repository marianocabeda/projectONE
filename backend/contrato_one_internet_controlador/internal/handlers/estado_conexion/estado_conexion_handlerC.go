package estado_conexion

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

type EstadoConexionHandler struct {
    service *servicios.EstadoConexionService
}

func NewHandler(s *servicios.EstadoConexionService) *EstadoConexionHandler { return &EstadoConexionHandler{service: s} }

func (h *EstadoConexionHandler) ListarEstadosConexion(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    list, err := h.service.ObtenerEstadosConexion(ctx)
    if err != nil { utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."}); return }
    if len(list) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"estados_conexion": []interface{}{} }); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"estados_conexion": list})
}

func (h *EstadoConexionHandler) ObtenerEstadoConexionPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"}); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    e, err := h.service.ObtenerEstadoConexionPorID(ctx, id)
    if err != nil { utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "Estado de conexión no encontrado"}); return }
    utilidades.ResponderJSON(w, http.StatusOK, e)
}

// Admin create
func (h *EstadoConexionHandler) CrearEstadoConexion(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if claims, ok := middleware.GetClaimsFromContext(ctx); ok && claims != nil { req["id_usuario_creador"] = int(claims.IDUsuario) }
    id, err := h.service.CrearEstadoConexion(ctx, req)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) {
            utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return
        }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Estado de conexión creado correctamente", "id_estado_conexion": id})
}

func (h *EstadoConexionHandler) ActualizarEstadoConexion(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"}); return }
    if err := h.service.ActualizarEstadoConexion(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de conexión actualizado correctamente"})
}

func (h *EstadoConexionHandler) EliminarEstadoConexion(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }
    if _, ok := middleware.GetClaimsFromContext(ctx); !ok { utilidades.ResponderJSON(w, http.StatusForbidden, map[string]string{"error": "No tiene permisos para realizar esta acción"}); return }
    if err := h.service.EliminarEstadoConexion(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) { utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message}); return }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"}); return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de conexión eliminado correctamente"})
}
