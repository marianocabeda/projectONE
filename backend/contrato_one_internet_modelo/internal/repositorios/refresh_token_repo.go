package repositorios

import (
    "context"
    "time"

    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

type RefreshTokenRepo struct {
    db Execer
}

func NewRefreshTokenRepo(db Execer) *RefreshTokenRepo {
    return &RefreshTokenRepo{db: db}
}

// CrearRefreshToken inserta un nuevo refresh token para un usuario.
func (r *RefreshTokenRepo) CrearRefreshToken(ctx context.Context, t *modelos.RefreshToken) error {
    query := `INSERT INTO refresh_token (id_usuario, token, expiracion, creado, revocado) VALUES (?, ?, ?, ?, 0)`
    _, err := r.db.ExecContext(ctx, query, t.IDUsuario, t.Token, t.Expiracion, t.Creado)
    return err
}

// ValidarRefreshToken retorna el id_usuario asociado si el token existe y está válido (no revocado ni expirado)
func (r *RefreshTokenRepo) ValidarRefreshToken(ctx context.Context, token string) (int, error) {
    var idUsuario int
    var expiracion time.Time
    var revocado bool
    err := r.db.QueryRowContext(ctx, `SELECT id_usuario, expiracion, revocado FROM refresh_token WHERE token = ? LIMIT 1`, token).Scan(&idUsuario, &expiracion, &revocado)
    if err != nil {
        return 0, err
    }
    if revocado || time.Now().After(expiracion) {
        return 0, utilidades.ErrTokenInvalido
    }
    return idUsuario, nil
}

// RevocarRefreshToken marca como revocado un token determinado
func (r *RefreshTokenRepo) RevocarRefreshToken(ctx context.Context, token string) error {
    _, err := r.db.ExecContext(ctx, `UPDATE refresh_token SET revocado = 1 WHERE token = ?`, token)
    return err
}
