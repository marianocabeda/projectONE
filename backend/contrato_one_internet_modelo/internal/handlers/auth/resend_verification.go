package auth

import (
	"encoding/json"
	"net/http"
	"time"

	"contrato_one_internet_modelo/internal/utilidades"
)

// ResendVerificationHandler maneja solicitudes para reenviar el token de verificación.
// Responde con { "token": "...", "email": "..." } cuando se genera un token,
// o con un mensaje genérico cuando el email no existe o ya está verificado.
func (h *UsuarioHandler) ResendVerificationHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req struct {
		Email string `json:"email"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "email requerido")
		return
	}

	token, expiresAt, err := h.UsuarioService.ResendVerificationToken(ctx, req.Email)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno")
		return
	}

	if token == "" {
		// No revelar si el email existe o no
		utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "si el email existe, se ha enviado el token"})
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"token": token, "email": req.Email, "expires_at": expiresAt.Format(time.RFC3339)})
}
