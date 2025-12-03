package auth

import (
	"encoding/json"
	"net/http"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type LoginHandler struct {
	LoginService *servicios.LoginService
}

func NewLoginHandler(loginService *servicios.LoginService) *LoginHandler {
	return &LoginHandler{LoginService: loginService}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	ClientIP string `json:"client_ip"`
	UserAgent string `json:"user_agent"`
}

func (h *LoginHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Email == "" || req.Password == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "Email y contraseña son obligatorios")
		return
	}


	ctx := r.Context()
	result, err := h.LoginService.ValidarCredenciales(ctx, req.Email, req.Password, req.ClientIP, req.UserAgent)
	if err != nil {
		utilidades.ResponderError(w, http.StatusUnauthorized, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, result)
}