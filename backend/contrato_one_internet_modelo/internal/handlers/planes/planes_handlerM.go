package planes

import (
    "net/http"
    "strconv"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

type PlanesHandler struct {
    service *servicios.PlanService
}

func NewHandler(s *servicios.PlanService) *PlanesHandler {
    return &PlanesHandler{service: s}
}

// GET /api/v1/tipo-plan
func (h *PlanesHandler) ListarTipoPlanes(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tipos, err := h.service.ObtenerTipoPlanes(ctx)
    if err != nil {
        utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
        return
    }
    if len(tipos) == 0 {
        utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos": []interface{}{}, "mensaje": "no hay registros"})
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos": tipos})
}

// GET /api/v1/planes
func (h *PlanesHandler) ListarPlanes(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    q := r.URL.Query()

    var idTipo *int
    if v := q.Get("id_tipo_plan"); v != "" {
        if id, err := strconv.Atoi(v); err == nil {
            idTipo = &id
        }
    }
    var minVel *int
    if v := q.Get("min_velocidad"); v != "" {
        if i, err := strconv.Atoi(v); err == nil {
            minVel = &i
        }
    }
    var maxPrecio *float64
    if v := q.Get("max_precio"); v != "" {
        if f, err := strconv.ParseFloat(v, 64); err == nil {
            maxPrecio = &f
        }
    }

    planes, err := h.service.ObtenerPlanes(ctx, idTipo, minVel, maxPrecio)
    if err != nil {
        utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
        return
    }

    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"planes": planes})
}

// GET /api/v1/planes/{id}
func (h *PlanesHandler) ObtenerPlanPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr, ok := vars["id"]
    if !ok || idStr == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
        return
    }
    id, err := strconv.Atoi(idStr)
    if err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
        return
    }

    plan, err := h.service.ObtenerPlanPorID(ctx, id)
    if err != nil {
        if err == utilidades.ErrNoEncontrado {
            utilidades.ResponderError(w, http.StatusNotFound, "plan no encontrado")
            return
        }
        utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
        return
    }

    utilidades.ResponderJSON(w, http.StatusOK, plan)
}
