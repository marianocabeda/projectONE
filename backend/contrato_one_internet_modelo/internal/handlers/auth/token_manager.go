package auth

import (
	"sync"
	"time"
	"contrato_one_internet_modelo/internal/utilidades"
	"log"
)

type TokenManager struct {
	jwtSecret []byte

	mu    sync.Mutex
	token string
	exp   time.Time
}

func NewTokenManager(secret string) *TokenManager {
	return &TokenManager{
		jwtSecret: []byte(secret),
	}
}

func (tm *TokenManager) GetToken() (string, error) {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	// Retorna el token si está vigente por más de 5 minutos
	if tm.token != "" && time.Until(tm.exp) > 5*time.Minute {
		return tm.token, nil
	}

	// Genera un token nuevo
	token, err := utilidades.GenerarTokenInterno(tm.jwtSecret)
	if err != nil {
		return "", err
	}

	tm.token = token
	tm.exp = time.Now().Add(24 * time.Hour)

	log.Printf("Token renovado en TokenManager")

	return token, nil
}