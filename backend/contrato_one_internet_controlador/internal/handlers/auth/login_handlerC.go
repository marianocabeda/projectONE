package auth

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"
	
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades"
)

// Login maneja la autenticación y generación de tokens.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req modelos.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	// Obtener metadatos user-agent e IP
	userAgent := r.Header.Get("User-Agent")
	clientIP := obtenerIPClienteValida(r)

	resp, err := h.authService.Login(ctx, &req, clientIP, userAgent)

	if err != nil {
		msg := err.Error()
		switch {
		case errors.Is(err, utilidades.ErrCredencialesInvalidas):
			utilidades.ResponderError(w, http.StatusUnauthorized, "email o contraseña incorrectos")
		case errors.Is(err, utilidades.ErrEmailNoVerificado):
			utilidades.ResponderError(w, http.StatusForbidden, "verificación de email pendiente")
		case errors.Is(err, utilidades.ErrValidacionLogin):
			utilidades.ResponderError(w, http.StatusBadRequest, "validación fallida")
		default:
			utilidades.ResponderError(w, http.StatusInternalServerError, msg)
		}
		return
	}

	// setRefreshCookie establece la cookie segura HttpOnly para el refresh token
	h.setRefreshCookie(w, resp.RefreshToken, resp.RefreshExpiresAt)

	// Devolver solo el token de acceso en el cuerpo JSON
	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"token": resp.Token})
}


// obtenerIPClienteValida retorna la IP del cliente verificando cabeceras proxy y validando que sea una IP IPv4 o IPv6 válida.
func obtenerIPClienteValida(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if net.ParseIP(ip) != nil {
				return ip
			}
		}
	}
	if rip := strings.TrimSpace(r.Header.Get("X-Real-IP")); rip != "" {
		if net.ParseIP(rip) != nil {
			return rip
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && net.ParseIP(host) != nil {
		return host
	}
	return r.RemoteAddr
}