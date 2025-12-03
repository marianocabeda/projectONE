package cargo

import (
    "net/http"
    "strconv"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type CargoHandler struct{
    service *servicios.CargoService
}

func NewHandler(s *servicios.CargoService) *CargoHandler { return &CargoHandler{service: s} }

func (h *CargoHandler) ListarCargos(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    list, err := h.service.Listar(ctx)
    if err != nil { utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor"); return }
    if len(list) == 0 { utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"cargos": []interface{}{}}); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"cargos": list})
}

func (h *CargoHandler) ObtenerCargoPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderError(w, http.StatusBadRequest, "id requerido"); return }
    // parse id
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    c, err := h.service.ObtenerPorID(ctx, id)
    if err != nil { utilidades.ResponderError(w, http.StatusNotFound, "Cargo no encontrado"); return }
    utilidades.ResponderJSON(w, http.StatusOK, c)
}
