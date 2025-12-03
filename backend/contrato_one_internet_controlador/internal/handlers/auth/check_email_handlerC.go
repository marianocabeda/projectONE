package auth

import (
    "net/http"

    "contrato_one_internet_controlador/internal/utilidades"
    "contrato_one_internet_controlador/internal/utilidades/logger"
    "contrato_one_internet_controlador/internal/validadores"
)

// CheckEmail verifica si un email está disponible para registro.
func (h *AuthHandler) CheckEmail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	email := r.URL.Query().Get("email")
	if email == "" {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "email requerido"})
		return
	}

	if err := validadores.ValidarEmail(email); err != nil {
		utilidades.ResponderJSON(w, http.StatusBadRequest, map[string]string{"error": "El email proporcionado no tiene un formato válido"})
		return
	}

	disponible, err := h.authService.CheckEmail(ctx, email)
	if err != nil {
		logger.Error.Printf("Error check email %s: %v", email, err)
		utilidades.ResponderJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error interno del servidor"})
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]bool{"disponible": disponible})
}