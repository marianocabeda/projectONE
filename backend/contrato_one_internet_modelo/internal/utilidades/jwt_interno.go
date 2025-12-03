package utilidades

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Genera un token JWT interno válido por 24 horas
func GenerarTokenInterno(secretKey []byte) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "internal-service",
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString(secretKey)
}

// Valida un token JWT firmado con clave secreta
func ValidarTokenInterno(tokenStr string, secretKey []byte) error {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma de token inesperado")
		}
		return secretKey, nil
	})

	if err != nil {
		return errors.New("error al parsear el token")
	}

	if !token.Valid {
		return errors.New("token inválido o expirado")
	}

	return nil
}