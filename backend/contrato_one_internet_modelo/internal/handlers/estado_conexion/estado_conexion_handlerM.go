package estado_conexion

import (
    "fmt"
    "net/http"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type EstadoConexionHandler struct {
    service *servicios.EstadoConexionService
}

func NewHandler(s *servicios.EstadoConexionService) *EstadoConexionHandler { return &EstadoConexionHandler{service: s} }

func (h *EstadoConexionHandler) ListarEstadosConexion(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    estados, err := h.service.Listar(ctx)
    if err != nil { utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor"); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"estados_conexion": estados})
}

func (h *EstadoConexionHandler) ObtenerEstadoConexionPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderError(w, http.StatusBadRequest, "id requerido"); return }
    var id int
    if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    e, err := h.service.ObtenerPorID(ctx, id)
    if err != nil { utilidades.ResponderError(w, http.StatusNotFound, "Estado de conexión no encontrado"); return }
    utilidades.ResponderJSON(w, http.StatusOK, e)
}
