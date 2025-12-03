package auth

import (
	"encoding/json"
	"net/http"

	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/linkconstructor"
	"contrato_one_internet_controlador/internal/utilidades/logger"
)

// ResendVerification maneja la solicitud de reenvío del email de verificación.
func (h *AuthHandler) ResendVerification(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "email es requerido en el body")
		return
	}

	token, _, err := h.authService.ResendVerification(ctx, req.Email)
	if err != nil {
		logger.Error.Printf("Error reenviando verificación: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error procesando solicitud, no se pudo reenviar el email de verificación")
		return
	}

	if token != "" {
		link := linkconstructor.BuildEmailVerificationLink(token)
		// Enviar correo
		_ = h.correoService.EnviarCorreoVerificacionConNombre(req.Email, link, "")
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Si el email existe, se ha reenviado el token"})
}