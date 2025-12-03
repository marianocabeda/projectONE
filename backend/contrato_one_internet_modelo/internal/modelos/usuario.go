package modelos

import "time"

// Usuario representa la tabla 'usuario' de la base de datos.
type Usuario struct {
    IDUsuario        int        `json:"id_usuario"`
    Email            string     `json:"email"`
    PasswordHash     string     `json:"-"` 
    IDPersona        int        `json:"id_persona"`
    Borrado          *time.Time `json:"borrado,omitempty"`
    EmailVerificado  bool       `json:"email_verificado"`
    Creado           time.Time  `json:"creado"`
    UltimoCambio     time.Time  `json:"ultimo_cambio"`
    UltimoLogin      *time.Time `json:"ultimo_login,omitempty"`
    RequiereVerificacion bool   `json:"requiere_verificacion"`
    IDUsuarioCreador   *int       `json:"id_usuario_creador,omitempty"`
    UltimaIP         *string    `json:"ultima_ip,omitempty"`
    UltimoUserAgent  *string    `json:"ultimo_user_agent,omitempty"`
}
