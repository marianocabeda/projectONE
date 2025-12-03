package middleware

import (
	"context"
	"contrato_one_internet_modelo/internal/utilidades"
	"net/http"
	"strconv"
	"strings"
	"log"
)

func AutenticacionInterna(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utilidades.ResponderError(w, http.StatusUnauthorized, "Cabecera de autorización requerida")
				return
			}

			log.Printf("Authorization header: %q", authHeader)

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenStr == authHeader {
				utilidades.ResponderError(w, http.StatusUnauthorized, "Formato de token inválido")
				return
			}

			log.Printf("Token recibido para validación: %s", tokenStr)

			err := utilidades.ValidarTokenInterno(tokenStr, []byte(jwtSecret))
			if err != nil {
				utilidades.ResponderError(w, http.StatusUnauthorized, "Token inválido o expirado")
				return
			}

			// Extraer id_persona del header si existe (para endpoints que lo requieren)
			ctx := r.Context()
			if idPersonaHeader := r.Header.Get("X-ID-Persona"); idPersonaHeader != "" {
				if idPersona, err := strconv.Atoi(idPersonaHeader); err == nil && idPersona > 0 {
					ctx = context.WithValue(ctx, "id_persona", idPersona)
				}
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}