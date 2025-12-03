package modelos

import "time"

// EmailVerificacionToken representa la tabla 'email_verificacion_token'.
type EmailVerificacionToken struct {
	ID         int       `json:"id"`
	IDUsuario  int       `json:"id_usuario"`
	Token      string    `json:"token"`
	Creado     time.Time `json:"creado"`
	Expiracion time.Time `json:"expiracion"`
	Usado      bool      `json:"usado"`
}