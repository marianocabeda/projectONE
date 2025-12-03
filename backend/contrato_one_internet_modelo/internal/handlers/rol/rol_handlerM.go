package rol

import (
    "net/http"
    "strconv"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type RolHandler struct{
    service *servicios.RolService
}

func NewHandler(s *servicios.RolService) *RolHandler { return &RolHandler{service: s} }

func (h *RolHandler) ListarRoles(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    list, err := h.service.Listar(ctx)
    if err != nil { utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor"); return }
    if len(list) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"roles": []interface{}{}}); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"roles": list})
}

func (h *RolHandler) ObtenerRolPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderError(w, http.StatusBadRequest, "id requerido"); return }
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    ro, err := h.service.ObtenerPorID(ctx, id)
    if err != nil { utilidades.ResponderError(w, http.StatusNotFound, "Rol no encontrado"); return }
    utilidades.ResponderJSON(w, http.StatusOK, ro)
}
