package repositorios

import (
	"context"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
)

// TokenRepo maneja las operaciones de la base de datos para los tokens.
type TokenRepo struct {
	db Execer
}

// NewTokenRepo crea una instancia de TokenRepo.
func NewTokenRepo(db Execer) *TokenRepo {
	return &TokenRepo{db: db}
}

// CrearEmailVerificacionToken inserta un nuevo token de verificación.
func (r *TokenRepo) CrearEmailVerificacionToken(ctx context.Context, t *modelos.EmailVerificacionToken) error {
	query := `
        INSERT INTO email_verificacion_token (id_usuario, token, expiracion, creado)
        VALUES (?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, t.IDUsuario, t.Token, t.Expiracion, t.Creado)
	return utilidades.TraducirErrorBD(err)
}

// InvalidarTokensPrevios marca como usados los tokens previos no usados o expirados
func (r *TokenRepo) InvalidarTokensPrevios(ctx context.Context, idUsuario int) error {
    _, err := r.db.ExecContext(ctx, `
        UPDATE email_verificacion_token
        SET usado = 1
        WHERE id_usuario = ? AND (usado = 0 OR expiracion < NOW())
    `, idUsuario)
    return err
}