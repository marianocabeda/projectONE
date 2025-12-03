package auth

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type UsuarioHandler struct {
	UsuarioService *servicios.UsuarioService
}

func NewUsuarioHandler(s *servicios.UsuarioService) *UsuarioHandler {
	return &UsuarioHandler{UsuarioService: s}
}

func (h *UsuarioHandler) VerificarEmailHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var VerificarEmailRequest struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&VerificarEmailRequest); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, utilidades.ErrTokenInvalido.Error())
		return
	}

	if VerificarEmailRequest.Token == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, utilidades.ErrTokenRequerido.Error())
		return
	}

	err := h.UsuarioService.VerificarTokenEmail(ctx, VerificarEmailRequest.Token)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "Email verificado correctamente",
	})
}

// SolicitarResetHandler maneja la solicitud pública para generar un token de reset.
func (h *UsuarioHandler) SolicitarResetHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "email requerido")
		return
	}

	token, expiresAt, err := h.UsuarioService.SolicitarResetPassword(ctx, req.Email)
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

// CambiarPasswordHandler recibe { token, new_password } y solicita al servicio
// cambiar la contraseña asociada al token.
func (h *UsuarioHandler) CambiarPasswordHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req struct {
		Token         string `json:"token"`
		NuevaPassword string `json:"nueva_password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Token == "" || req.NuevaPassword == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "token y nueva_password requeridos")
		return
	}

	if err := h.UsuarioService.CambiarPasswordConToken(ctx, req.Token, req.NuevaPassword); err != nil {
		// Mapear errores básicos
		msg := err.Error()
		switch {
		case msg == "token inválido o no encontrado":
			utilidades.ResponderError(w, http.StatusBadRequest, msg)
			return
		case msg == "token expirado":
			utilidades.ResponderError(w, http.StatusGone, msg)
			return
		case msg == "token ya fue usado":
			utilidades.ResponderError(w, http.StatusBadRequest, msg)
			return
		case strings.HasPrefix(msg, "contraseña inválida"):
			utilidades.ResponderError(w, http.StatusBadRequest, msg)
			return
		default:
			utilidades.ResponderError(w, http.StatusInternalServerError, "error interno")
			return
		}
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "contraseña cambiada correctamente"})
}

// CheckEmailHandler maneja GET /api/v1/internal/auth/check-email?email=...
// Retorna JSON {"disponible": true|false}
func (h *UsuarioHandler) CheckEmailHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	email := r.URL.Query().Get("email")
	if strings.TrimSpace(email) == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "email requerido")
		return
	}

	disponible, err := h.UsuarioService.EmailDisponible(ctx, email)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]bool{"disponible": disponible})
}