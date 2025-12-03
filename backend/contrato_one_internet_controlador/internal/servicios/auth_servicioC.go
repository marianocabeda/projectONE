package servicios

import (
	"context"
	"fmt"
	"strings"
	"time"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/validadores"
)

// AuthService maneja toda la lógica de autenticación.
type AuthService struct {
	modeloClient *ModeloClient
	cfg          *config.Config
}

func NewAuthService(modeloClient *ModeloClient, cfg *config.Config) *AuthService {
	return &AuthService{
		modeloClient: modeloClient,
		cfg:          cfg,
	}
}

// GetModeloClient expone el ModeloClient de forma segura.
func (s *AuthService) GetModeloClient() *ModeloClient {
	return s.modeloClient
}

// Login valida credenciales y genera tokens JWT y refresh.
func (s *AuthService) Login(ctx context.Context, req *modelos.LoginRequest, clientIP, userAgent string) (*modelos.LoginResponse, error) {
	if err := validadores.ValidarLogin(req); err != nil {
		return nil, fmt.Errorf("%w: %v", utilidades.ErrValidacionLogin, err)
	}
	modeloResp, err := s.modeloClient.ValidarCredenciales(ctx, req.Email, req.Password, clientIP, userAgent)
	if err != nil {
		return nil, mapearErrorModelo(err)
	}
	return s.crearLoginResponse(modeloResp)
}

// Refresh genera un nuevo JWT usando un refresh token válido.
func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*modelos.LoginResponse, error) {
	modeloResp, err := s.modeloClient.Refresh(ctx, refreshToken)
	if err != nil {
		return nil, err
	}
	return s.crearLoginResponse(modeloResp)
}

// Logout invalida el refresh token.
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	return s.modeloClient.Logout(ctx, refreshToken)
}

// ChangePasswordAuthenticated cambia la contraseña de un usuario logueado.
func (s *AuthService) ChangePasswordAuthenticated(ctx context.Context, idUsuario int, actualPassword, nuevaPassword string) error {
	return s.modeloClient.ChangePasswordAuthenticated(ctx, idUsuario, actualPassword, nuevaPassword)
}

// SolicitarReset inicia el flujo de olvido de contraseña.
func (s *AuthService) SolicitarReset(ctx context.Context, email string) (string, time.Time, error) {
	return s.modeloClient.SolicitarReset(ctx, email)
}

// ResetPassword finaliza el flujo usando el token y la nueva contraseña.
func (s *AuthService) ResetPassword(ctx context.Context, token, nuevaPassword string) error {
	return s.modeloClient.CambiarPassword(ctx, token, nuevaPassword)
}

// ResendVerification solicita un nuevo token de validación de email.
func (s *AuthService) ResendVerification(ctx context.Context, email string) (string, time.Time, error) {
	return s.modeloClient.ResendVerification(ctx, email)
}

// VerificarEmail procesa el token de verificación.
func (s *AuthService) VerificarEmail(ctx context.Context, token string) error {
	return s.modeloClient.VerificarEmail(ctx, token) 
}

// CheckEmail verifica si un email está disponible/existe.
func (s *AuthService) CheckEmail(ctx context.Context, email string) (bool, error) {
	return s.modeloClient.CheckEmail(ctx, email)
}

// --- Utilidades privadas ---

func (s *AuthService) crearLoginResponse(modeloResp *modelos.ModeloLoginResponse) (*modelos.LoginResponse, error) {
	token, err := utilidades.GenerarJWT(modeloResp.IDUsuario, modeloResp.IDPersona, modeloResp.Roles, s.cfg)
	if err != nil {
		return nil, fmt.Errorf("error al generar el token: %w", err)
	}
	return &modelos.LoginResponse{
		Token:            token,
		RefreshToken:     modeloResp.RefreshToken,
		RefreshExpiresAt: modeloResp.RefreshExpiresAt,
	}, nil
}

func mapearErrorModelo(err error) error {
	errMsg := err.Error()
	switch {
	case strings.Contains(errMsg, "credenciales inválidas"):
		return fmt.Errorf("%w: %v", utilidades.ErrCredencialesInvalidas, err)
	case strings.Contains(errMsg, "verificación de email pendiente"):
		return fmt.Errorf("%w: %v", utilidades.ErrEmailNoVerificado, err)
	default:
		return fmt.Errorf("error del modelo: %w", err)
	}
}