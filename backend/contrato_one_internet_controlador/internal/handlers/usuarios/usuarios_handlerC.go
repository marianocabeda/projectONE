package usuarios

import (
    "net/http"
    "strconv"
    "strings"

    "contrato_one_internet_controlador/internal/servicios"
    "contrato_one_internet_controlador/internal/utilidades"
)

type UsuariosHandler struct {
    service *servicios.UsuarioService
}

func NewHandler(s *servicios.UsuarioService) *UsuariosHandler { return &UsuariosHandler{service: s} }

// ListarUsuarios maneja GET /v1/api/usuarios (admin)
func (h *UsuariosHandler) ListarUsuarios(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    q := r.URL.Query()
    page := 1
    limit := 20
    if p := q.Get("page"); p != "" {
        if v, err := strconv.Atoi(p); err == nil && v > 0 {
            page = v
        }
    }
    if l := q.Get("limit"); l != "" {
        if v, err := strconv.Atoi(l); err == nil && v > 0 {
            limit = v
        }
    }
    if limit > 100 {
        limit = 100
    }

    nombre := q.Get("nombre")
    apellido := q.Get("apellido")
    dni := q.Get("dni")
    cuil := q.Get("cuil")
    email := q.Get("email")
    idEmpresa := 0
    if ie := q.Get("id_empresa"); ie != "" {
        if v, err := strconv.Atoi(ie); err == nil && v > 0 {
            idEmpresa = v
        }
    }

    sortBy := strings.ToLower(q.Get("sort_by"))
    sortDir := strings.ToLower(q.Get("sort_dir"))
    // validar sort_by
    switch sortBy {
    case "nombre", "apellido", "email", "creado":
    default:
        sortBy = "nombre"
    }
    if sortDir != "asc" && sortDir != "desc" {
        sortDir = "desc"
    }

    resp, err := h.service.ListarUsuarios(ctx, page, limit, nombre, apellido, dni, cuil, email, idEmpresa, sortBy, sortDir)
    if err != nil {
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }

    // normalizar respuesta a la estructura solicitada
    // resp ya tiene page, limit, total, data
    out := map[string]interface{}{"success": true}
    if total, ok := resp["total"]; ok {
        out["total"] = total
    } else {
        out["total"] = 0
    }
    if p, ok := resp["page"]; ok {
        out["page"] = p
    } else {
        out["page"] = page
    }
    if l, ok := resp["limit"]; ok {
        out["limit"] = l
    } else {
        out["limit"] = limit
    }
    if data, ok := resp["data"]; ok {
        out["data"] = data
    } else {
        out["data"] = []interface{}{}
    }

    utilidades.ResponderJSON(w, http.StatusOK, out)
}
