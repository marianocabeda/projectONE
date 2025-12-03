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