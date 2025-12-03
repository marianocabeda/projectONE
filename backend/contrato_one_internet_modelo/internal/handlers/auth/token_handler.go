package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"contrato_one_internet_modelo/internal/utilidades"
)

type AuthHandler struct {
	TokenManager *TokenManager
}

func NewAuthHandler(tokenManager *TokenManager) *AuthHandler {
	return &AuthHandler{
		TokenManager: tokenManager,
	}
}

func (h *AuthHandler) GenerateTokenHandler(w http.ResponseWriter, r *http.Request) {
	token, err := h.TokenManager.GetToken()
	if err != nil {
		log.Printf("Error al obtener token: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "No se pudo obtener el token")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}