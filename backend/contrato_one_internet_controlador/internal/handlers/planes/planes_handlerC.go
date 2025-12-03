package planes

import (
    "encoding/json"
    "errors"
    "net/http"
    "strconv"

    "github.com/gorilla/mux"

    "contrato_one_internet_controlador/internal/middleware"
    "contrato_one_internet_controlador/internal/servicios"
    "contrato_one_internet_controlador/internal/utilidades"
)

type PlanesHandler struct {
    service *servicios.PlanService
}

func NewHandler(s *servicios.PlanService) *PlanesHandler { return &PlanesHandler{service: s} }

func (h *PlanesHandler) ListarTipoPlanes(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    tipos, err := h.service.ObtenerTipoPlanes(ctx)
    if err != nil {
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."})
        return
    }
    if len(tipos) == 0 {
        utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos": []interface{}{}, "mensaje": "no hay registros"})
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"tipos": tipos})
}

func (h *PlanesHandler) ListarPlanes(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    q := r.URL.Query()
    var idTipo *int
    if v := q.Get("id_tipo_plan"); v != "" {
        if id, err := strconv.Atoi(v); err == nil { idTipo = &id }
    }
    var minVel *int
    if v := q.Get("min_velocidad"); v != "" {
        if i, err := strconv.Atoi(v); err == nil { minVel = &i }
    }
    var maxPrecio *float64
    if v := q.Get("max_precio"); v != "" {
        if f, err := strconv.ParseFloat(v, 64); err == nil { maxPrecio = &f }
    }

    planes, err := h.service.ObtenerPlanes(ctx, idTipo, minVel, maxPrecio)
    if err != nil {
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor."})
        return
    }

    // Formatear PrecioAR antes de responder
    for i := range planes {
        planes[i].PrecioAR = utilidades.FormatearPrecioAR(planes[i].Precio)
    }

    utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{"planes": planes})
}

func (h *PlanesHandler) ObtenerPlanPorID(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr, ok := vars["id"]
    if !ok || idStr == "" {
        utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id requerido"})
        return
    }
    id, err := strconv.Atoi(idStr)
    if err != nil {
        utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"})
        return
    }
    p, err := h.service.ObtenerPlanPorID(ctx, id)
    if err != nil {
        // If Modelo returned a ModeloError with 404, it's propagated by ModeloClient as ModeloError.
        utilidades.ResponderJSON(w, http.StatusNotFound, map[string]string{"error": "plan no encontrado"})
        return
    }

    // Formatear PrecioAR antes de responder
    p.PrecioAR = utilidades.FormatearPrecioAR(p.Precio)

    utilidades.ResponderJSON(w, http.StatusOK, p)
}

// CrearPlan -> POST /v1/api/planes (admin)
func (h *PlanesHandler) CrearPlan(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()

    // Parse payload
    var req map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
        return
    }

    // Validar campos obligatorios
    required := []string{"id_tipo_plan", "nombre", "velocidad_mbps", "precio"}
    for _, f := range required {
        if v, ok := req[f]; !ok || v == nil {
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{
                "error": "El campo '" + f + "' es obligatorio",
            })
            return
        }
    }

    // Validar velocidad
    if v, ok := req["velocidad_mbps"]; ok {
        switch t := v.(type) {
        case float64:
            if int(t) <= 0 { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "La velocidad debe ser mayor a 0"}); return }
        default:
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "velocidad_mbps inválida"}); return
        }
    }

    // Validar precio
    /*
    if v, ok := req["precio"]; ok {
        switch t := v.(type) {
        case float64:
            if t < 0 { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El precio no puede ser negativo"}); return }
        default:
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "precio inválido"}); return
        }
    }*/

    // Validar y parsear precio argentino
    precioStr, ok := req["precio"].(string)
    if !ok {
        utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El precio debe enviarse como string"})
        return
    }

    precio, err := utilidades.ParsePrecioArgentino(precioStr)
    if err != nil {
        utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
        return
    }
    req["precio"] = precio // Guardamos float64 en DB

    // Obtener usuario creador
    claims, ok := middleware.GetClaimsFromContext(ctx)
    if !ok {
        utilidades.ResponderJSON(w, http.StatusUnauthorized, map[string]string{"error": "claims no disponibles"})
        return
    }
    req["id_usuario_creador"] = int(claims.IDUsuario)

    // Llamar al modelo para crear el plan
    _, err = h.service.ModeloClient.CreatePlan(ctx, req)
    if err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) {
            utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
            return
        }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
        return
    }

    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Plan creado correctamente"})
}

// ActualizarPlan -> PATCH /v1/api/planes/{id} (admin)
func (h *PlanesHandler) ActualizarPlan(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }

    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
        return
    }
    if len(payload) == 0 { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "al menos un campo requerido para actualizar"}); return }

    // Validar velocidad
    if v, ok := payload["velocidad_mbps"]; ok {
        switch t := v.(type) {
        case float64:
            if int(t) <= 0 { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "La velocidad debe ser mayor a 0"}); return }
        default:
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "velocidad_mbps inválida"}); return
        }
    }

    // Validar precio
    /*
    if v, ok := payload["precio"]; ok {
        switch t := v.(type) {
        case float64:
            if t < 0 { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El precio no puede ser negativo"}); return }
        default:
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "precio inválido"}); return
        }
    }*/

    if v, ok := payload["precio"]; ok {
        precioStr, ok := v.(string)
        if !ok {
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El precio debe enviarse como string"})
            return
        }
        precio, err := utilidades.ParsePrecioArgentino(precioStr)
        if err != nil {
            utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
            return
        }
        payload["precio"] = precio
    }


    if err := h.service.ModeloClient.UpdatePlan(ctx, id, payload); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) {
            utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
            return
        }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Plan actualizado correctamente"})
}

// EliminarPlan -> DELETE /v1/api/planes/{id} (admin)
func (h *PlanesHandler) EliminarPlan(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil { utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "id inválido"}); return }

    if err := h.service.ModeloClient.DeletePlan(ctx, id); err != nil {
        var modeloErr *servicios.ModeloError
        if errors.As(err, &modeloErr) {
            utilidades.ResponderJSON(w, modeloErr.StatusCode, map[string]string{"error": modeloErr.Message})
            return
        }
        utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Plan eliminado correctamente"})
}
