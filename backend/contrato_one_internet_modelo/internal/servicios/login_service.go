package servicios

import (
	"context"
	"errors"
	"time"

	"contrato_one_internet_modelo/internal/config"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"

	"golang.org/x/crypto/bcrypt"
)

type LoginService struct {
	usuarioRepo    *repositorios.UsuarioRepo
	usuarioRolRepo *repositorios.UsuarioRolRepo
	refreshRepo    *repositorios.RefreshTokenRepo
	cfg            *config.AppConfig
}

func NewLoginService(uRepo *repositorios.UsuarioRepo, urRepo *repositorios.UsuarioRolRepo, rtRepo *repositorios.RefreshTokenRepo, cfg *config.AppConfig) *LoginService {
	return &LoginService{
		usuarioRepo:    uRepo,
		usuarioRolRepo: urRepo,
		refreshRepo:    rtRepo,
		cfg:            cfg,
	}
}

// =============================================================================
// LÓGICA PRINCIPAL
// =============================================================================

func (s *LoginService) ValidarCredenciales(ctx context.Context, email, password, clientIP, userAgent string) (*modelos.ModeloLoginResponse, error) {
	// 1. Buscar usuario (Usando el Repo refactorizado del paso anterior)
	u, err := s.usuarioRepo.BuscarPorEmailParaLogin(ctx, email)
	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	// 2. Validar pass y estado
	if u.RequiereVerificacion && !u.EmailVerificado {
		return nil, errors.New("verificación de email pendiente")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	// 3. Auditoría
	if err := s.usuarioRepo.ActualizarAuditoriaLogin(ctx, u.IDUsuario, clientIP, userAgent); err != nil {
		logger.Error.Printf("Error actualizando auditoría de login para usuario %d: %v", u.IDUsuario, err)
	}

	// Registrar log de login exitoso. Para aplicar más adelante.
	/*
	go func(ctx context.Context) {
		if err := s.usuarioRepo.RegistrarLogLogin(context.Background(), u.IDUsuario, clientIP, userAgent, true, "login exitoso"); err != nil {
			logger.Error.Printf("Error registrando log de login para usuario %d: %v", u.IDUsuario, err)
		}
	}(ctx)*/

	// 4. Generar Token y Respuesta (Lógica centralizada)
	return s.generarSesionYRespuesta(ctx, u.IDUsuario, u.IDPersona)
}

func (s *LoginService) RefreshConToken(ctx context.Context, oldToken string) (*modelos.ModeloLoginResponse, error) {
	// 1. Validar token opaco en BD
	idUsuario, err := s.refreshRepo.ValidarRefreshToken(ctx, oldToken)
	if err != nil {
		return nil, err
	}

	// 2. Revocar el anterior (Rotación de tokens para detectar robo)
	if err := s.refreshRepo.RevocarRefreshToken(ctx, oldToken); err != nil {
		return nil, err
	}

	// 3. Obtener datos FRESCOS del usuario (Importante por seguridad)
	idPersona, err := s.usuarioRepo.ObtenerIDPersona(ctx, idUsuario)
	if err != nil {
		return nil, err
	}

	// 4. Generar Token y Respuesta (Reutilizamos la lógica)
	return s.generarSesionYRespuesta(ctx, idUsuario, idPersona)
}

// LogoutConToken revoca el refresh token proporcionado.
func (s *LoginService) LogoutConToken(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}

	if err := s.refreshRepo.RevocarRefreshToken(ctx, token); err != nil {
		return err
	}
	return nil
}

// =============================================================================
// MÉTODO PRIVADO AUXILIAR
// =============================================================================

func (s *LoginService) generarSesionYRespuesta(ctx context.Context, idUsuario, idPersona int) (*modelos.ModeloLoginResponse, error) {
	// A. Obtener roles actuales
	roles, err := s.usuarioRolRepo.ObtenerRolesPorUsuario(ctx, idUsuario)
	if err != nil {
		return nil, err
	}

	// B. Generar el Refresh Token Opaco
	refreshToken, err := utilidades.GenerarTokenSeguro(utilidades.TokenSize64)
	if err != nil {
		return nil, err
	}

	// C. Calcular expiración desde configuración
	refreshExp := time.Now().Add(s.cfg.RefreshTokenDuration)

	// D. Guardar en BD
	rt := &modelos.RefreshToken{
		IDUsuario:  idUsuario,
		Token:      refreshToken,
		Expiracion: refreshExp,
		Creado:     time.Now(),
	}
	if err := s.refreshRepo.CrearRefreshToken(ctx, rt); err != nil {
		return nil, err
	}

	// E. Retornar estructura unificada
	return &modelos.ModeloLoginResponse{
		IDUsuario:        idUsuario,
		IDPersona:        idPersona,
		Roles:            roles,
		RefreshToken:     refreshToken,
		RefreshExpiresAt: refreshExp.Format(time.RFC3339),
	}, nil
}