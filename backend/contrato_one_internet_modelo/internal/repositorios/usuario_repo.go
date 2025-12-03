package repositorios

import (
	"context"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
	"fmt"

	"database/sql"
)

// UsuarioRepo maneja las operaciones de la base de datos para usuarios.
type UsuarioRepo struct {
	db Execer
}

// NewUsuarioRepo crea una instancia de UsuarioRepo.
func NewUsuarioRepo(db Execer) *UsuarioRepo {
	return &UsuarioRepo{db: db}
}

// CrearUsuario inserta un nuevo usuario y devuelve su ID.
func (r *UsuarioRepo) CrearUsuario(ctx context.Context, u *modelos.Usuario) (int64, error) {
	query := `
        INSERT INTO usuario (email, password_hash, id_persona, borrado, email_verificado, requiere_verificacion, id_usuario_creador, creado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	res, err := r.db.ExecContext(ctx, query,
		u.Email, u.PasswordHash, u.IDPersona, u.Borrado, u.EmailVerificado, u.RequiereVerificacion, u.IDUsuarioCreador, u.Creado,
	)
	if err != nil {
		return 0, utilidades.TraducirErrorBD(err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID insertado: %w", err)
	}
	return id, nil	
}

// BuscarPorEmailParaLogin obtiene los datos críticos para validar un inicio de sesión.
// Nota: Los roles se obtienen desde UsuarioRolRepo.
func (r *UsuarioRepo) BuscarPorEmailParaLogin(ctx context.Context, email string) (*modelos.Usuario, error) {
	query := `
        SELECT id_usuario, id_persona, password_hash, email_verificado, requiere_verificacion
        FROM usuario 
        WHERE email = ? AND borrado IS NULL`

	var u modelos.Usuario
	// Escaneamos los datos básicos necesarios para que el servicio decida si aprueba el login
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&u.IDUsuario,
		&u.IDPersona,
		&u.PasswordHash,
		&u.EmailVerificado,
		&u.RequiereVerificacion,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			// Devolvemos un error genérico o nil para que el servicio decida el mensaje
			return nil, utilidades.ErrNotFound{Entity: "Usuario", Campo: "email", Valor: email}
		}
		return nil, err
	}
	return &u, nil
}

// ObtenerIDPersona recupera el ID de la persona asociada a un usuario.
// Se usa principalmente durante el refresco de tokens.
func (r *UsuarioRepo) ObtenerIDPersona(ctx context.Context, idUsuario int) (int, error) {
	var idPersona int
	err := r.db.QueryRowContext(ctx, "SELECT id_persona FROM usuario WHERE id_usuario = ?", idUsuario).Scan(&idPersona)
	if err != nil {
		return 0, err
	}
	return idPersona, nil
}

// ActualizarAuditoriaLogin actualiza los datos de rastreo del último acceso.
func (r *UsuarioRepo) ActualizarAuditoriaLogin(ctx context.Context, idUsuario int, ip, userAgent string) error {
	query := `UPDATE usuario SET ultimo_ip = ?, ultimo_user_agent = ?, ultimo_login = NOW() WHERE id_usuario = ?`
	_, err := r.db.ExecContext(ctx, query, ip, userAgent, idUsuario)
	return err
}

// RegistrarLogLogin inserta un registro histórico del intento de login.
func (r *UsuarioRepo) RegistrarLogLogin(ctx context.Context, idUsuario int, ip, userAgent string, exito bool, mensaje string) error {
	query := `INSERT INTO usuario_login_log (id_usuario, ip, user_agent, exito, mensaje, fecha) VALUES (?, ?, ?, ?, ?, NOW())`
	_, err := r.db.ExecContext(ctx, query, idUsuario, ip, userAgent, exito, mensaje)
	return err
}

// GetUsuarioPorEmail devuelve el usuario que no esté borrado
func (r *UsuarioRepo) GetUsuarioPorEmail(ctx context.Context, email string) (*modelos.Usuario, error) {
    var u modelos.Usuario
    err := r.db.QueryRowContext(ctx, `
        SELECT id_usuario, email_verificado, requiere_verificacion
        FROM usuario
        WHERE email = ? AND borrado IS NULL
        LIMIT 1
    `, email).Scan(&u.IDUsuario, &u.EmailVerificado, &u.RequiereVerificacion)

    if err != nil {
        return nil, err // sql.ErrNoRows se maneja en el servicio
    }
    return &u, nil
}








/*
package repositorios

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"

	"contrato_one_internet_modelo/internal/utilidades"
)

type RepositorioUsuarios struct {
	db *sql.DB
}

func NewRepositorioUsuarios(db *sql.DB) *RepositorioUsuarios {
	return &RepositorioUsuarios{db: db}
}

// CrearUsuario crea un usuario con email, id_persona y password opcional.
func (r *RepositorioUsuarios) CrearUsuario(tx *sql.Tx, email string, idPersona int, password *string) (int, error) {
	var passwordHash sql.NullString
	if password != nil {
		hash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
		if err != nil {
			return 0, fmt.Errorf("error hashing password: %w", err)
		}
		passwordHash.String = string(hash)
		passwordHash.Valid = true
	}

	query := `INSERT INTO usuario (email, password_hash, id_persona, activo, email_verificado) VALUES (?, ?, ?, 1, 0)`
	result, err := tx.ExecContext(context.Background(), query, email, passwordHash, idPersona)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") { // MySQL duplicate
			return 0, utilidades.ErrDuplicado
		}
		return 0, fmt.Errorf("error insert usuario: %w", err)
	}

	id64, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error obteniendo id_usuario: %w", err)
	}

	return int(id64), nil
}

// ObtenerRolID obtiene ID de rol por nombre.
func (r *RepositorioUsuarios) ObtenerRolID(tx *sql.Tx, nombreRol string) (int, error) {
	query := `SELECT id_rol FROM rol WHERE nombre = ? LIMIT 1`
	var id int
	err := tx.QueryRowContext(context.Background(), query, nombreRol).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, utilidades.ErrNoEncontrado
		}
		return 0, err
	}
	return id, nil
}

// AsignarRol asigna rol a usuario.
func (r *RepositorioUsuarios) AsignarRol(tx *sql.Tx, idUsuario, idRol int) error {
	query := `INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?) ON DUPLICATE KEY UPDATE id_rol = id_rol`
	_, err := tx.ExecContext(context.Background(), query, idUsuario, idRol)
	return err
}

// CrearTokenVerificacion crea token de verificación para el email.
func (r *RepositorioUsuarios) CrearTokenVerificacion(tx *sql.Tx, idUsuario int, exp time.Time) (string, error) {
	token, err := generarTokenUnico()
	if err != nil {
		return "", err
	}

	query := `INSERT INTO email_verificacion_token (id_usuario, token, expiracion, usado) VALUES (?, ?, ?, 0)`
	_, err = tx.ExecContext(context.Background(), query, idUsuario, token, exp)
	if err != nil {
		return "", err
	}
	return token, nil
}


// ValidarCredenciales valida email/password, retorna id_usuario y roles.
func (r *RepositorioUsuarios) ValidarCredenciales(ctx context.Context, email, password string) (int, []string, error) {
	var idUsuario int
	var passwordHash string
	var activo, verificado bool
	query := `SELECT id_usuario, password_hash, activo, email_verificado FROM usuario WHERE email = ?`
	err := r.db.QueryRowContext(ctx, query, email).Scan(&idUsuario, &passwordHash, &activo, &verificado)
	if err != nil {
		return 0, nil, utilidades.ErrNoEncontrado
	}
	if !activo || !verificado {
		return 0, nil, utilidades.ErrValidacion
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return 0, nil, utilidades.ErrValidacion
	}

	// Roles
	var roles []string
	rows, err := r.db.QueryContext(ctx, `SELECT r.nombre FROM rol r JOIN usuario_rol ur ON r.id_rol = ur.id_rol WHERE ur.id_usuario = ?`, idUsuario)
	if err != nil {
		return 0, nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var rol string
		rows.Scan(&rol)
		roles = append(roles, rol)
	}

	// Actualizar ultimo_login
	_, err = r.db.ExecContext(ctx, `UPDATE usuario SET ultimo_login = ? WHERE id_usuario = ?`, time.Now(), idUsuario)
	if err != nil {
		return 0, nil, err
	}

	return idUsuario, roles, nil
}

// VerificarEmail verifica token y actualiza usuario.
func (r *RepositorioUsuarios) VerificarEmail(tx *sql.Tx, token string) (int, error) {
	query := `SELECT id_usuario, expiracion, usado FROM email_verificacion_token WHERE token = ?`
	var idUsuario int
	var exp time.Time
	var usado bool
	err := tx.QueryRowContext(context.Background(), query, token).Scan(&idUsuario, &exp, &usado)
	if err != nil {
		return 0, utilidades.ErrNoEncontrado
	}
	if usado {
		return 0, utilidades.ErrTokenUsado
	}
	if time.Now().After(exp) {
		return 0, utilidades.ErrTokenExpirado
	}

	_, err = tx.Exec(`UPDATE email_verificacion_token SET usado = 1 WHERE token = ?`, token)
	if err != nil {
		return 0, err
	}
	_, err = tx.Exec(`UPDATE usuario SET email_verificado = 1 WHERE id_usuario = ?`, idUsuario)
	if err != nil {
		return 0, err
	}
	return idUsuario, nil
}

// CrearTokenReset crea token reset cuando se solicita cambiar la contraseña.
func (r *RepositorioUsuarios) CrearTokenReset(tx *sql.Tx, idUsuario int) (string, error) {
	// Invalida tokens activos previos (no usados y no expirados)
    _, err := tx.ExecContext(context.Background(), `
        UPDATE reset_password_token
        SET usado = 1
        WHERE id_usuario = ? AND usado = 0 AND expiracion > NOW()`, idUsuario)
    if err != nil {
        return "", fmt.Errorf("error invalidando tokens previos: %w", err)
    }

	// Crear nuevo token
	token, err := generarTokenUnico()
	if err != nil {
		return "", err
	}
	exp := time.Now().Add(1 * time.Hour)
	query := `INSERT INTO reset_password_token (id_usuario, token, expiracion, usado) VALUES (?, ?, ?, 0)`
	_, err = tx.ExecContext(context.Background(), query, idUsuario, token, exp)
	if err != nil {
		return "", fmt.Errorf("error insert token reset: %w", err)
	}
	return token, nil
}

// VerificarYUsarTokenReset verifica token reset y permite cambiar la contaseña.
func (r *RepositorioUsuarios) VerificarYUsarTokenReset(tx *sql.Tx, token string) (int, error) {
	query := `SELECT id_usuario, expiracion, usado FROM reset_password_token WHERE token = ?`
	var idUsuario int
	var exp time.Time
	var usado bool
	err := tx.QueryRowContext(context.Background(), query, token).Scan(&idUsuario, &exp, &usado)
	if err != nil {
		return 0, utilidades.ErrNoEncontrado
	}
	if usado {
		return 0, utilidades.ErrTokenUsado
	}
	if time.Now().After(exp) {
		return 0, utilidades.ErrTokenExpirado
	}

	_, err = tx.Exec(`UPDATE reset_password_token SET usado = 1 WHERE token = ?`, token)
	if err != nil {
		return 0, err
	}
	return idUsuario, nil
}

// CambiarPassword actualiza password con hash.
func (r *RepositorioUsuarios) CambiarPassword(tx *sql.Tx, idUsuario int, newPassword string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("error hashing new password: %w", err)
	}
	query := `UPDATE usuario SET password_hash = ? WHERE id_usuario = ?`
	_, err = tx.ExecContext(context.Background(), query, string(hash), idUsuario)
	if err != nil {
		return fmt.Errorf("error updating password: %w", err)
	}
	return nil
}

// generarTokenUnico genera un token hexadecimal aleatorio de 32 caracteres.
func generarTokenUnico() (string, error) {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("error generating token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// EstaVerificado verifica si el email del usuario está verificado.
func (r *RepositorioUsuarios) EstaVerificado(tx *sql.Tx, idUsuario int) (bool, error) {
	var verificado bool
	query := `SELECT email_verificado FROM usuario WHERE id_usuario = ? LIMIT 1`
	err := tx.QueryRowContext(context.Background(), query, idUsuario).Scan(&verificado)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, utilidades.ErrNoEncontrado
		}
		return false, err
	}
	return verificado, nil
}

// ObtenerUsuarioPorEmail obtiene id_usuario y si el email está verificado.
func (r *RepositorioUsuarios) ObtenerUsuarioPorEmail(tx *sql.Tx, email string) (int, bool, error) {
	var id int
	var verificado bool
	query := `SELECT id_usuario, email_verificado FROM usuario WHERE email = ? LIMIT 1`
	err := tx.QueryRowContext(context.Background(), query, email).Scan(&id, &verificado)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, false, utilidades.ErrNoEncontrado
		}
		return 0, false, err
	}
	return id, verificado, nil
}

// CrearTokenSetupInicial crea token para crear la contraseña inicial (similar a reset).
func (r *RepositorioUsuarios) CrearTokenSetupInicial(tx *sql.Tx, idUsuario int) (string, error) {
	// Invalida tokens activos previos (no usados y no expirados)
    _, err := tx.ExecContext(context.Background(), `
        UPDATE initial_setup_token
        SET usado = 1
        WHERE id_usuario = ? AND usado = 0 AND expiracion > NOW()`, idUsuario)
    if err != nil {
        return "", fmt.Errorf("error invalidando tokens previos: %w", err)
    }
	
    // Similar a CrearTokenReset, pero en tabla 'initial_setup_token' (crea si no existe)
    token, err := generarTokenUnico()
    if err != nil {
        return "", err
    }
    exp := time.Now().Add(24 * time.Hour) // Más tiempo para setup inicial
    query := `INSERT INTO initial_setup_token (id_usuario, token, expiracion, usado) VALUES (?, ?, ?, 0)`
    _, err = tx.ExecContext(context.Background(), query, idUsuario, token, exp)
    if err != nil {
        return "", fmt.Errorf("error insert token setup: %w", err)
    }
    return token, nil
}

// VerificarYUsarTokenSetup verifica token setup y permite crear la contraseña inicial.
func (r *RepositorioUsuarios) VerificarYUsarTokenSetup(tx *sql.Tx, token string) (int, error) {
    // Similar a VerificarYUsarTokenReset
    query := `SELECT id_usuario, expiracion, usado FROM initial_setup_token WHERE token = ?`
    var idUsuario int
    var exp time.Time
    var usado bool
    err := tx.QueryRowContext(context.Background(), query, token).Scan(&idUsuario, &exp, &usado)
    if err != nil {
        return 0, utilidades.ErrNoEncontrado
    }
    if usado || time.Now().After(exp) {
        return 0, utilidades.ErrTokenInvalido // O errores específicos
    }
    _, err = tx.Exec(`UPDATE initial_setup_token SET usado = 1 WHERE token = ?`, token)
    if err != nil {
        return 0, err
    }
    return idUsuario, nil
}*/