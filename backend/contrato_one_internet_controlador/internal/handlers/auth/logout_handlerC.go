package auth

import (
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"net/http"
)

// Logout invalida el refresh token.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Obtener refresh token desde cookie
	refreshToken := ""
	if c, err := r.Cookie("refresh_token"); err == nil {
		refreshToken = c.Value
	}

	// Log seguro (solo si existe token)
	if refreshToken != "" {
		logger.Info.Printf("Procesando logout para refresh token: %s", refreshToken)
		// Revocar refresh token en backend (best effort)
		_ = h.authService.Logout(ctx, refreshToken)
	}else {
		logger.Info.Println("Logout solicitado sin refresh token (Cookie no encontrada)")
	}

	// Borrar SIEMPRE la cookie, sin importar si había o no token
	h.deleteRefreshCookie(w)

	// Respuesta
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "logout exitoso"})
}