package auth

import (
	"net/http"
	"time"

	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	
)

type AuthHandler struct {
	authService   *servicios.AuthService
	correoService *servicios.ServicioCorreo
}

// NewAuthHandler ahora requiere Auth Service y Correo Service
func NewAuthHandler(authService *servicios.AuthService, correoService *servicios.ServicioCorreo) *AuthHandler {
	return &AuthHandler{
		authService:   authService,
		correoService: correoService,
	}
}

// -------------------------------------------------------------------
// SECCIÓN: COOKIES (Privadas)
// -------------------------------------------------------------------

// setRefreshCookie centraliza la configuración de la cookie.
// Recibe el string de expiración del modelo, lo parsea y configura la cookie.
func (h *AuthHandler) setRefreshCookie(w http.ResponseWriter, refreshToken string, expiresAtStr string) {
	if refreshToken == "" {
		return
	}

	// Parsear la fecha que viene del modelo (RFC3339)
	expires, err := time.Parse(time.RFC3339, expiresAtStr)
	if err != nil {
		logger.Error.Printf("Error parseando fecha expiración: %v. Default 24h.", err)
		expires = time.Now().Add(24 * time.Hour) // Fallback de seguridad
	}

	// Configurar la cookie que almacena el refresh token
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true, 
		Secure:   true, // Solo viaja por HTTPS (false en desarrollo si no es HTTPS)
		Path:     "/",
		Expires:  expires,
		SameSite: http.SameSiteNoneMode, // Protección CSRF robusta
	}

	http.SetCookie(w, cookie)

	logger.Info.Printf("Seteada cookie refresh_token: %s", refreshToken)
}

// deleteRefreshCookie limpia la cookie (útil para logout)
func (h *AuthHandler) deleteRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}