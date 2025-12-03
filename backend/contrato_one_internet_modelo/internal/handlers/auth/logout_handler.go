package auth

import (
    "encoding/json"
    "net/http"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
    "contrato_one_internet_modelo/internal/utilidades/logger"
)

// LogoutHandler maneja la revocación del refresh token (logout).
type LogoutHandler struct {
    LoginService *servicios.LoginService
}

func NewLogoutHandler(ls *servicios.LoginService) *LogoutHandler {
    return &LogoutHandler{LoginService: ls}
}

func (h *LogoutHandler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req struct{ RefreshToken string `json:"refresh_token"` }
    // intentar leer body (JSON)
    _ = json.NewDecoder(r.Body).Decode(&req)

    // Si no vino en body, intentar desde cookie
    if req.RefreshToken == "" {
        if c, err := r.Cookie("refresh_token"); err == nil {
            req.RefreshToken = c.Value
        }
    }

    // Revocar en DB (si está presente). Si no hay token, devolvemos OK para permitir logout stateless.
    if err := h.LoginService.LogoutConToken(ctx, req.RefreshToken); err != nil {
        logger.Error.Printf("Error en LogoutConToken: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "error al revocar refresh token")
        return
    }

    // Responder OK (el controlador/cliente debe eliminar la cookie). En el modelo no manejamos cookies,
    // ésto lo hace el controlador. Devolvemos mensaje simple.
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "logout exitoso"})
}
