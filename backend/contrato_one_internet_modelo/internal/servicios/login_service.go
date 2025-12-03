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

/*
import (
	"context"
	"database/sql"
	"errors"
	"time"
	"fmt"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"golang.org/x/crypto/bcrypt"
)

type LoginService struct {
	db *sql.DB
}

func NewLoginService(db *sql.DB) *LoginService {
	return &LoginService{db: db}
}

func (s *LoginService) ValidarCredenciales(ctx context.Context, email, password, clientIP, userAgent string) (*modelos.ModeloLoginResponse, error) {
	var (
		idUsuario          int
		idPersona          int
		emailDB            string
		passwordHash       string
		emailVerificado    bool
		requiereVerif      bool
	)

	err := s.db.QueryRowContext(ctx, `
		SELECT u.id_usuario, u.id_persona, u.email, u.password_hash, u.email_verificado, u.requiere_verificacion
		FROM usuario u WHERE u.email = ? AND u.borrado IS NULL
	`, email).Scan(&idUsuario, &idPersona, &emailDB, &passwordHash, &emailVerificado, &requiereVerif)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("credenciales inválidas")
		}
		return nil, err
	}

	if requiereVerif && !emailVerificado {
		return nil, errors.New("verificación de email pendiente")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, errors.New("credenciales inválidas")
	}

	// Obtener roles (ya no obtenemos permisos)
	roles, err := s.obtenerRoles(ctx, idUsuario)
	if err != nil {
		return nil, fmt.Errorf("error al obtener roles del usuario %d: %w", idUsuario, err)
	}

	const maxLen = 255

	safeString := func(s string, max int) string {
		if len(s) > max {
			return s[:max]
		}
		return s
	}

	// uso
	safeIP := safeString(clientIP, maxLen)
	safeUA := safeString(userAgent, maxLen)

	// --- Log de depuración ---
	fmt.Printf("[LOGIN] Usuario %s (ID %d) desde IP: %s | User-Agent: %s\n",
		emailDB, idUsuario, safeIP, safeUA)

	// Guardar IP y User-Agent en usuario
	_, _ = s.db.ExecContext(ctx, `
		UPDATE usuario SET ultima_ip = ?, ultimo_user_agent = ?, ultimo_login = ?
		WHERE id_usuario = ?
	`, safeIP, safeUA, time.Now(), idUsuario)

	// Generar refresh token y persistirlo
	refreshToken, err := generarTokenSeguro(32)
	if err != nil {
		return nil, err
	}
	refreshExp := time.Now().Add(30 * 24 * time.Hour) // 30 días

	rtRepo := repositorios.NewRefreshTokenRepo(s.db)
	rt := &modelos.RefreshToken{
		IDUsuario:  idUsuario,
		Token:      refreshToken,
		Expiracion: refreshExp,
		Creado:     time.Now(),
	}
	if err := rtRepo.CrearRefreshToken(ctx, rt); err != nil {
		return nil, err
	}

	s.logLogin(ctx, idUsuario, clientIP, userAgent, true, "login exitoso")

	return &modelos.ModeloLoginResponse{
		IDUsuario:        idUsuario,
		IDPersona:        idPersona,
		Roles:            roles,
		RefreshToken:     refreshToken,
		RefreshExpiresAt: refreshExp.Format(time.RFC3339),
	}, nil
}

func (s *LoginService) obtenerRoles(ctx context.Context, idUsuario int) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT r.nombre
		FROM usuario_rol ur
		JOIN rol r ON ur.id_rol = r.id_rol
		WHERE ur.id_usuario = ?
	`, idUsuario)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []string
	for rows.Next() {
		var rol string
		if err := rows.Scan(&rol); err != nil {
			return nil, err
		}
		roles = append(roles, rol)
	}
	return roles, nil
}

func (s *LoginService) obtenerPermisos(ctx context.Context, idUsuario int) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT DISTINCT p.nombre
		FROM usuario_rol ur
		JOIN rol_permiso rp ON ur.id_rol = rp.id_rol
		JOIN permiso p ON rp.id_permiso = p.id_permiso
		WHERE ur.id_usuario = ?
	`, idUsuario)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permisos []string
	for rows.Next() {
		var permiso string
		if err := rows.Scan(&permiso); err != nil {
			return nil, err
		}
		permisos = append(permisos, permiso)
	}
	return permisos, nil
}

// RefreshWithToken valida un refresh token, revoca el antiguo y genera uno nuevo
func (s *LoginService) RefreshWithToken(ctx context.Context, oldToken string) (*modelos.ModeloLoginResponse, error) {
	rtRepo := repositorios.NewRefreshTokenRepo(s.db)

	idUsuario, err := rtRepo.ValidarRefreshToken(ctx, oldToken)
	if err != nil {
		return nil, err
	}

	// Obtener datos del usuario: id_persona y roles (ya no email ni permisos)
	var idPersona int
	err = s.db.QueryRowContext(ctx, `SELECT id_persona FROM usuario WHERE id_usuario = ? LIMIT 1`, idUsuario).Scan(&idPersona)
	if err != nil {
		return nil, err
	}

	roles, err := s.obtenerRoles(ctx, idUsuario)
	if err != nil {
		return nil, err
	}

	// Generar nuevo refresh token y persistir
	newToken, err := generarTokenSeguro(32)
	if err != nil {
		return nil, err
	}
	newExp := time.Now().Add(30 * 24 * time.Hour)
	rt := &modelos.RefreshToken{IDUsuario: idUsuario, Token: newToken, Expiracion: newExp, Creado: time.Now()}
	if err := rtRepo.CrearRefreshToken(ctx, rt); err != nil {
		return nil, err
	}

	// Revocar el antiguo
	if err := rtRepo.RevocarRefreshToken(ctx, oldToken); err != nil {
		return nil, err
	}

	return &modelos.ModeloLoginResponse{
		IDUsuario:        idUsuario,
		IDPersona:        idPersona,
		Roles:            roles,
		RefreshToken:     newToken,
		RefreshExpiresAt: newExp.Format(time.RFC3339),
	}, nil
}

// logLogin registra cada intento de login (éxito o fallo)
func (s *LoginService) logLogin(ctx context.Context, idUsuario int, ip, userAgent string, exito bool, mensaje string) {
	_, _ = s.db.ExecContext(ctx, `
		INSERT INTO usuario_login_log (id_usuario, ip, user_agent, exito, mensaje, fecha)
		VALUES (?, ?, ?, ?, ?, NOW())
	`, idUsuario, ip, userAgent, exito, mensaje)
}

// LogoutWithToken revoca el refresh token proporcionado.
func (s *LoginService) LogoutWithToken(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	rtRepo := repositorios.NewRefreshTokenRepo(s.db)
	if err := rtRepo.RevocarRefreshToken(ctx, token); err != nil {
		return err
	}
	return nil
}*/