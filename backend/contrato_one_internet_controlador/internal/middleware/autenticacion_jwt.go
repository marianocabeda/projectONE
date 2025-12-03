package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/utilidades"

	"github.com/golang-jwt/jwt/v5"
)

// claimsContextKey es la clave para guardar los claims en el contexto
type contextKey string
const claimsContextKey = contextKey("userClaims")

// JWTAuthMiddleware valida el token JWT y lo adjunta al contexto
func JWTAuthMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utilidades.ResponderError(w, http.StatusUnauthorized, "Se requiere token de autorización")
				return
			}

			headerParts := strings.Split(authHeader, " ")
			if len(headerParts) != 2 || headerParts[0] != "Bearer" {
				utilidades.ResponderError(w, http.StatusUnauthorized, "Formato de token inválido")
				return
			}
			tokenString := headerParts[1]

			// Usamos la nueva struct ClaimsJWT para los claims personalizados
			claims := &utilidades.ClaimsJWT{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
				}
				return []byte(cfg.JWTSecret), nil
			})

			if err != nil {
				// (Acá se puede manejar Errores de token expirado, etc.)
				utilidades.ResponderError(w, http.StatusUnauthorized, "Token expirado o inválido")
				return
			}

			if !token.Valid {
				utilidades.ResponderError(w, http.StatusUnauthorized, "Token inválido")
				return
			}

			// Adjuntamos los claims al contexto
			ctx := context.WithValue(r.Context(), claimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetClaimsFromContext helper para obtener los claims en los handlers
func GetClaimsFromContext(ctx context.Context) (*utilidades.ClaimsJWT, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*utilidades.ClaimsJWT)
	return claims, ok
}