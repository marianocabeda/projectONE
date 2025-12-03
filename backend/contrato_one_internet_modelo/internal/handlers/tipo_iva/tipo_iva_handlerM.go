package tipo_iva

import (
    "fmt"
    "net/http"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type TipoIvaHandler struct {
    service *servicios.TipoIvaService
}

func NewHandler(s *servicios.TipoIvaService) *TipoIvaHandler { return &TipoIvaHandler{service: s} }

func (h *TipoIvaHandler) ListarTipoIva(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tipos, err := h.service.Listar(ctx)
    if err != nil { utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor"); return }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos_iva": tipos})
}

func (h *TipoIvaHandler) ObtenerTipoIvaPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" { utilidades.ResponderError(w, http.StatusBadRequest, "id requerido"); return }
    var id int
    if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    t, err := h.service.ObtenerPorID(ctx, id)
    if err != nil { utilidades.ResponderError(w, http.StatusNotFound, "Tipo de IVA no encontrado"); return }
    utilidades.ResponderJSON(w, http.StatusOK, t)
}
