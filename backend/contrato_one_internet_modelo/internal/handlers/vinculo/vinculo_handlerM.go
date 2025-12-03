package vinculo

import (
    "fmt"
    "net/http"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type VinculoHandler struct {
    service *servicios.VinculoService
}

func NewHandler(s *servicios.VinculoService) *VinculoHandler { return &VinculoHandler{service: s} }

func (h *VinculoHandler) ListarVinculos(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    list, err := h.service.Listar(ctx)
    if err != nil { utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor"); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"vinculos": list})
}

func (h *VinculoHandler) ObtenerVinculoPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderError(w, http.StatusBadRequest, "id requerido"); return }
    var id int
    if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    v, err := h.service.ObtenerPorID(ctx, id)
    if err != nil { utilidades.ResponderError(w, http.StatusNotFound, "Vínculo no encontrado"); return }
    utilidades.ResponderJSON(w, http.StatusOK, v)
}
