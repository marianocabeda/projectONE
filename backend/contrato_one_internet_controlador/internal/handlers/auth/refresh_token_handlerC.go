package auth

import (
	"encoding/json"
	"net/http"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/logger"
)

// Refresh genera un nuevo token de acceso usando el refresh token.
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {

	// Intentar obtener token de Cookie primero (prioridad en seguridad)
	refreshToken := ""
	if c, err := r.Cookie("refresh_token"); err == nil {
		refreshToken = c.Value
	}

	// Si no hay cookie, buscar en body (opcional, si es necesario pero menos seguro)
	if refreshToken == "" {
		var req struct{ RefreshToken string `json:"refresh_token"` }
		if err := json.NewDecoder(r.Body).Decode(&req); err == nil {
			refreshToken = req.RefreshToken
		}
	}

	if refreshToken == "" {
		utilidades.ResponderError(w, http.StatusUnauthorized, "refresh_token no encontrado")
		return
	}

	// Llamar al servicio (Rotación de tokens)
	resp, err := h.authService.Refresh(r.Context(), refreshToken)
	if err != nil {
		// Si falla el refresh, asegura de borrar cualquier cookie vieja
		h.deleteRefreshCookie(w)
		logger.Error.Printf("Error al refrescar token: %v", err)
		utilidades.ResponderError(w, http.StatusUnauthorized, "sesión expirada o inválida")
		return
	}

	// Actualizar la cookie con el nuevo refresh token
	h.setRefreshCookie(w, resp.RefreshToken, resp.RefreshExpiresAt)

	// Responder con el nuevo token de acceso
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"token": resp.Token})
}