package utilidades

import (
	"fmt"
	"time"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"github.com/golang-jwt/jwt/v5"
)

// ClaimsJWT define los datos que se almacenan en el token JWT.
type ClaimsJWT struct {
	IDUsuario int      `json:"id_usuario"`
	IDPersona int      `json:"id_persona"`
	Roles     []string `json:"roles"`
	jwt.RegisteredClaims
}

// GenerarJWT crea un nuevo token JWT para un usuario con id_persona y roles
func GenerarJWT(idUsuario int, idPersona int, roles []string, cfg *config.Config) (string, error) {
	now := time.Now()
	expirationTime := now.Add(cfg.JWTExpiration)

	claims := &ClaimsJWT{
		IDUsuario: idUsuario,
		IDPersona: idPersona,
		Roles:     roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   fmt.Sprintf("%d", idUsuario),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		logger.Error.Printf("Error al firmar JWT para usuario %d: %v", idUsuario, err)
		return "", fmt.Errorf("error al firmar el token: %w", err)
	}

	// Log de información sobre el token generado
	logger.Info.Printf("JWT generado para usuario %d (persona %d) - Expira en %d minutos (%s)",
		idUsuario, idPersona, cfg.JWTExpirationMinutes, expirationTime.Format("2006-01-02 15:04:05"))
	//logger.Debug.Printf("JWT generado - Usuario: %d, Roles: %v, Issued: %s, Expires: %s",
		//idUsuario, roles, now.Format("15:04:05"), expirationTime.Format("15:04:05"))

	return tokenString, nil
}

func (c *ClaimsJWT) HasRole(role string) bool {
    for _, r := range c.Roles {
        if r == role {
            return true
        }
    }
    return false
}