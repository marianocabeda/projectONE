package auth

import (
    "encoding/json"
    "net/http"
    "strconv"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
)

// CambiarPasswordAutenticadoHandler maneja peticiones internas para cambiar
// la contraseña de un usuario autenticado (llamada por el controlador interno).
type CambiarPasswordAutenticadoHandler struct {
    UsuarioService *servicios.UsuarioService
}

func NewCambiarPasswordAutenticadoHandler(s *servicios.UsuarioService) *CambiarPasswordAutenticadoHandler {
    return &CambiarPasswordAutenticadoHandler{UsuarioService: s}
}

func (h *CambiarPasswordAutenticadoHandler) CambiarPasswordAutenticado(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req struct {
        IDUsuario      int    `json:"id_usuario"`
        ActualPassword string `json:"actual_password"`
        NuevaPassword  string `json:"nueva_password"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "request inválido")
        return
    }

    if req.IDUsuario == 0 || req.ActualPassword == "" || req.NuevaPassword == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "id_usuario, actual_password y nueva_password son requeridos")
        return
    }

    if err := h.UsuarioService.CambiarPasswordAutenticado(ctx, req.IDUsuario, req.ActualPassword, req.NuevaPassword); err != nil {
        switch err.Error() {
        case "usuario no encontrado":
            utilidades.ResponderError(w, http.StatusNotFound, err.Error())
            return
        case "contraseña actual incorrecta":
            utilidades.ResponderError(w, http.StatusUnauthorized, err.Error())
            return
        case "la nueva contraseña no puede ser igual a la actual":
            utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
            return
        default:
            // If mensaje de error contiene 'contraseña inválida' retornar 400
            if len(err.Error()) >= 11 && err.Error()[:11] == "contraseña" {
                utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
                return
            }
            utilidades.ResponderError(w, http.StatusInternalServerError, "error interno")
            return
        }
    }

    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "contraseña actualizada", "id_usuario": strconv.Itoa(req.IDUsuario)})
}
