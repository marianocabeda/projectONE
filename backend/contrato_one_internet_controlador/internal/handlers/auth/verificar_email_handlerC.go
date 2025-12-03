package auth

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/utilidades"
)

// VerificarEmail maneja la verificación del email usando el token proporcionado.
func (h *AuthHandler) VerificarEmail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	token := r.URL.Query().Get("token")
	if token == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "token requerido para verificación de email")
		return
	}

	// Llamar al servicio para verificar el email
	err := h.authService.VerificarEmail(ctx, token)

	cfg := config.GetConfig()
	frontend := strings.TrimSuffix(cfg.FrontendURL, "/")
	status := "error"

	if err == nil {
		status = "success"
	} else {
		// Log para depuración
		fmt.Printf("[DEBUG] Error recibido: %v\n", err)
		fmt.Printf("[DEBUG] Error.Error(): %s\n", err.Error())
		
		errMsg := strings.ToLower(err.Error())
		fmt.Printf("[DEBUG] errMsg lowercase: %s\n", errMsg)
		
		switch {
		case strings.Contains(errMsg, "inválido"):
			status = "invalid"
		case strings.Contains(errMsg, "expirado"):
			status = "expired"
		case strings.Contains(errMsg, "usado"):
			status = "used"
		case strings.Contains(errMsg, "verificado"):
			status = "already-verified"
		}
	}

	redirectURL := fmt.Sprintf("%s/verificar-email?status=%s", frontend, url.QueryEscape(status))
	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}