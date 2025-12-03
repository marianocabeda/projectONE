package auth

import (
	"encoding/json"
	"net/http"

	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/linkconstructor"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"contrato_one_internet_controlador/internal/validadores"
)

// SolicitarReset inicia el flujo de recuperación de contraseña
func (h *AuthHandler) SolicitarReset(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "email es requerido en el body")
		return
	}

	logger.Debug.Printf("Solicitud de reseteo de contraseña para email: %s", req.Email)

	token, _, err := h.authService.SolicitarReset(ctx, req.Email)
	if err != nil {
		logger.Error.Printf("Error solicitando reset: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error procesando la solicitud de reseteo de contraseña")
		return
	}

	if token != "" {
		link := linkconstructor.BuildPasswordResetLink(token)
		// Enviar correo
		_ = h.correoService.EnviarCorreoReset(req.Email, link)
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Si el email existe, se ha enviado el link de reseteo"})
}

// EjecutarResetPassword finaliza el flujo de recuperación de contraseña con el token recibido y la nueva contraseña.
func (h *AuthHandler) EjecutarResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token         string `json:"token"`
		NuevaPassword string `json:"nueva_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" || req.NuevaPassword == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "token y nueva_password requeridos")
		return
	}

	// Validar fuerza de contraseña antes de enviarla al modelo
	if err := validadores.ValidarPassword(req.NuevaPassword); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.authService.ResetPassword(r.Context(), req.Token, req.NuevaPassword); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "contraseña cambiada correctamente"})
}