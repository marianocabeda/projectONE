package modelos

import "time"

// RefreshToken representa un token de refresco persistido en la base de datos.
type RefreshToken struct {
    ID         int       `json:"id"`
    IDUsuario  int       `json:"id_usuario"`
    Token      string    `json:"token"`
    Creado     time.Time `json:"creado"`
    Expiracion time.Time `json:"expiracion"`
    Revocado   bool      `json:"revocado"`
}
