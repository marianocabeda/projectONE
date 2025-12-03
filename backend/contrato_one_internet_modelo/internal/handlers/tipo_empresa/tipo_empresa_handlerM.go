package tipo_empresa

import (
    "fmt"
    "net/http"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type TipoEmpresaHandler struct {
    service *servicios.TipoEmpresaService
}

func NewHandler(s *servicios.TipoEmpresaService) *TipoEmpresaHandler { return &TipoEmpresaHandler{service: s} }

// GET /api/v1/tipo-empresa
func (h *TipoEmpresaHandler) ListarTipoEmpresa(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tipos, err := h.service.ListarTipos(ctx)
    if err != nil {
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos_empresa": tipos})
}

// GET /api/v1/tipo-empresa/{id}
func (h *TipoEmpresaHandler) ObtenerTipoEmpresaPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    if idStr == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
        return
    }
    // parse
    // Reuse existing helpers from servicios or simple parse here
    id := 0
    _, err := fmt.Sscanf(idStr, "%d", &id)
    if err != nil || id <= 0 {
        utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
        return
    }
    t, err := h.service.ObtenerPorID(ctx, id)
    if err != nil {
        utilidades.ResponderError(w, http.StatusNotFound, "Tipo de empresa no encontrado")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, t)
}
