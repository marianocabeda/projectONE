package personas

import (
	"net/http"
	"strconv"

	"contrato_one_internet_modelo/internal/utilidades"
)

// ListUsuariosHandler maneja GET /api/v1/internal/usuarios
func (h *PersonasHandler) ListarUsuariosHandler(w http.ResponseWriter, r *http.Request) {
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
	sortBy := q.Get("sort_by")
	sortDir := q.Get("sort_dir")

	res, err := h.usuarioService.ListarUsuariosPaginado(ctx, page, limit, nombre, apellido, dni, cuil, email, idEmpresa, sortBy, sortDir)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, res)
}
