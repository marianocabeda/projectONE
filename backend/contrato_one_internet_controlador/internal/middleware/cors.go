package middleware

import (
    "net/http"
    "strings"
)

func CORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origin := r.Header.Get("Origin")
        
        // Lista de orígenes permitidos
        allowedOrigins := []string{
            "http://127.0.0.1:5501",
            "http://localhost:5500",
            "http://localhost:3000",
            "http://localhost:49400",
        }
        
        // Permitir cualquier origen de ngrok (para desarrollo)
        if strings.Contains(origin, ".ngrok-free.app") || strings.Contains(origin, ".ngrok-free.dev") ||strings.Contains(origin, ".ngrok.io") {
            allowedOrigins = append(allowedOrigins, origin)
        }
        
        // Verificar si el origen está permitido
        allowed := false
        for _, allowedOrigin := range allowedOrigins {
            if origin == allowedOrigin {
                allowed = true
                break
            }
        }
        
        // Si está permitido, establecer el header
        if allowed {
            w.Header().Set("Access-Control-Allow-Origin", origin)
        } else {
            // Fallback para desarrollo local
            w.Header().Set("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
        }

        // Permitir el uso de credenciales (cookies, auth headers)
        w.Header().Set("Access-Control-Allow-Credentials", "true")

        // Métodos permitidos
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")

        // Headers permitidos
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning")

        // Headers expuestos (si necesitas leer headers personalizados en el frontend)
        w.Header().Set("Access-Control-Expose-Headers", "Content-Type, Authorization, set-Cookie")

        // Max age para preflight cache (24 horas)
        w.Header().Set("Access-Control-Max-Age", "86400")

        // Manejo de preflight request
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}