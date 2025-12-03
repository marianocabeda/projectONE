package auth

import (
	"encoding/json"
	"net/http"

	mw "contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/validadores"
)

// ChangePassword cambia la contraseña del usuario autenticado.
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := mw.GetClaimsFromContext(ctx)
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "claims no disponibles")
		return
	}

	var req struct {
		ActualPassword string `json:"actual_password"`
		NuevaPassword  string `json:"nueva_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Solicitud inválida, formato JSON incorrecto")
		return
	}
	if req.ActualPassword == "" || req.NuevaPassword == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "actual_password y nueva_password requeridos")
		return
	}

	if err := validadores.ValidarPassword(req.NuevaPassword); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.authService.ChangePasswordAuthenticated(ctx, claims.IDUsuario, req.ActualPassword, req.NuevaPassword); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "contraseña cambiada correctamente"})
}