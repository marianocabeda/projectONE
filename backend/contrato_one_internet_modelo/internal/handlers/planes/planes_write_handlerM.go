package planes

import (
    "encoding/json"
    "net/http"
    "strconv"
    "strings"
    "time"

    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
    "contrato_one_internet_modelo/internal/utilidades/logger"

    "github.com/gorilla/mux"
)

type PlanesWriteHandler struct {
    service *servicios.PlanService
}

func NewWriteHandler(s *servicios.PlanService) *PlanesWriteHandler { return &PlanesWriteHandler{service: s} }

// POST /api/v1/internal/planes
func (h *PlanesWriteHandler) CrearPlanHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()

    var req struct {
        IDTipoPlan int     `json:"id_tipo_plan"`
        Nombre     string  `json:"nombre"`
        Velocidad  int     `json:"velocidad_mbps"`
        Precio     float64 `json:"precio"`
        Descripcion *string `json:"descripcion,omitempty"`
        IDUsuarioCreador *int `json:"id_usuario_creador,omitempty"`
        FechaFin   *string `json:"fecha_fin,omitempty"` // YYYY-MM-DD
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
        return
    }
    // Validaciones
    if req.IDTipoPlan == 0 {
        utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'id_tipo_plan' es obligatorio")
        return
    }
    if strings.TrimSpace(req.Nombre) == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio")
        return
    }
    if req.Velocidad <= 0 {
        utilidades.ResponderError(w, http.StatusBadRequest, "La velocidad debe ser mayor a 0")
        return
    }
    if req.Precio < 0 {
        utilidades.ResponderError(w, http.StatusBadRequest, "El precio no puede ser negativo")
        return
    }
    if req.FechaFin != nil {
        // validar que fecha_fin >= hoy
        t, err := time.Parse("2006-01-02", *req.FechaFin)
        if err != nil {
            utilidades.ResponderError(w, http.StatusBadRequest, "fecha_fin inválida, usar YYYY-MM-DD")
            return
        }
        hoy := time.Now().Truncate(24 * time.Hour)
        if t.Before(hoy) {
            utilidades.ResponderError(w, http.StatusBadRequest, "fecha_fin no puede ser anterior a hoy")
            return
        }
    }

    plan := modelos.Plan{
        IDTipoPlan: req.IDTipoPlan,
        Nombre: req.Nombre,
        VelocidadMbps: req.Velocidad,
        Precio: req.Precio,
        Descripcion: req.Descripcion,
        IDUsuarioCreador: req.IDUsuarioCreador,
    }

    id, err := h.service.CrearPlan(ctx, plan)
    if err != nil {
        logger.Error.Printf("Error creando plan: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
        return
    }

    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Plan creado correctamente", "id_plan": id})
}

// PATCH /api/v1/internal/planes/{id}
func (h *PlanesWriteHandler) ActualizarPlanHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr, ok := vars["id"]
    if !ok {
        utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
        return
    }
    id, err := strconv.Atoi(idStr)
    if err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
        return
    }

    var payload map[string]interface{}
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
        return
    }
    if len(payload) == 0 {
        utilidades.ResponderError(w, http.StatusBadRequest, "al menos un campo requerido para actualizar")
        return
    }

    // Validaciones básicas sobre valores si vienen
    if v, ok := payload["velocidad_mbps"]; ok {
        // aceptar float64
        switch t := v.(type) {
        case float64:
            if int(t) <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "La velocidad debe ser mayor a 0"); return }
        default:
            utilidades.ResponderError(w, http.StatusBadRequest, "velocidad_mbps inválida")
            return
        }
    }
    if v, ok := payload["precio"]; ok {
        switch t := v.(type) {
        case float64:
            if t < 0 { utilidades.ResponderError(w, http.StatusBadRequest, "El precio no puede ser negativo"); return }
        default:
            utilidades.ResponderError(w, http.StatusBadRequest, "precio inválido")
            return
        }
    }
    if v, ok := payload["fecha_fin"]; ok {
        if s, ok2 := v.(string); ok2 {
            t, err := time.Parse("2006-01-02", s)
            if err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "fecha_fin inválida, usar YYYY-MM-DD"); return }
            hoy := time.Now().Truncate(24 * time.Hour)
            if t.Before(hoy) { utilidades.ResponderError(w, http.StatusBadRequest, "fecha_fin no puede ser anterior a hoy"); return }
        } else {
            utilidades.ResponderError(w, http.StatusBadRequest, "fecha_fin inválida")
            return
        }
    }

    // Delegar al servicio
    if err := h.service.ActualizarPlan(ctx, id, payload); err != nil {
        if err == utilidades.ErrNoEncontrado {
            utilidades.ResponderError(w, http.StatusNotFound, "Plan no encontrado")
            return
        }
        if strings.Contains(err.Error(), "borrado") {
            utilidades.ResponderError(w, http.StatusBadRequest, "No se puede modificar un plan borrado")
            return
        }
        logger.Error.Printf("Error actualizando plan %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
        return
    }

    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Plan actualizado correctamente"})
}

// DELETE /api/v1/internal/planes/{id}
func (h *PlanesWriteHandler) EliminarPlanHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr, ok := vars["id"]
    if !ok {
        utilidades.ResponderError(w, http.StatusBadRequest, "id requerido")
        return
    }
    id, err := strconv.Atoi(idStr)
    if err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "id inválido")
        return
    }

    if err := h.service.BorrarPlan(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado {
            utilidades.ResponderError(w, http.StatusNotFound, "Plan no encontrado")
            return
        }
        logger.Error.Printf("Error borrando plan %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
        return
    }

    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Plan eliminado correctamente"})
}
