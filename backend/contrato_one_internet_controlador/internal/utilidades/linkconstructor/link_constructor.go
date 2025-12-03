package linkconstructor

import (
	"fmt"
	"net/url"
	"strings"
	"contrato_one_internet_controlador/internal/config"
)

// Base universal del frontend
func buildFrontendLink(path, token string) string {
	cfg := config.GetConfig()
	base := strings.TrimRight(cfg.FrontendURL, "/")
	path = strings.TrimLeft(path, "/")

	return fmt.Sprintf("%s/%s?token=%s", base, path, url.QueryEscape(token))
}

// Base opcional del backend
func buildBackendLink(path, token string) string {
	cfg := config.GetConfig()
	base := strings.TrimRight(cfg.BackendPublicURL, "/")
	path = strings.TrimLeft(path, "/")

	return fmt.Sprintf("%s/%s?token=%s", base, path, url.QueryEscape(token))
}

// ----- Public Builders -----

func BuildEmailVerificationLink(token string) string {
	return buildBackendLink("v1/auth/verificar-email", token)
}

func BuildPasswordResetLink(token string) string {
	return buildFrontendLink("cambiar-password", token)
}

func BuildCredentialsLink(token string) string {
	return buildBackendLink("v1/auth/verificar-email", token)
}