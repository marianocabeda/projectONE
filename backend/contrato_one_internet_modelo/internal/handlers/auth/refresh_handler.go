package auth

import (
	"encoding/json"
	"net/http"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

type RefreshHandler struct {
    LoginService *servicios.LoginService
}

func NewRefreshHandler(ls *servicios.LoginService) *RefreshHandler {
    return &RefreshHandler{LoginService: ls}
}

func (h *RefreshHandler) RefreshTokenHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    var req struct{ 
        RefreshToken string `json:"refresh_token"` 
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RefreshToken == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "refresh_token requerido")
        return
    }

    resp, err := h.LoginService.RefreshConToken(ctx, req.RefreshToken)
    if err != nil {
        logger.Error.Printf("Error en RefreshConToken: %v", err)
        utilidades.ResponderError(w, http.StatusUnauthorized, "refresh token inválido")
        return
    }

    utilidades.ResponderJSON(w, http.StatusOK, resp)
}
