package modelos

// LoginRequest es el DTO para la solicitud de login (público)
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse es el DTO para la respuesta de login (público)
type LoginResponse struct {
	Token string `json:"token"`
	RefreshToken string `json:"refresh_token,omitempty"`
	RefreshExpiresAt string `json:"refresh_expires_at,omitempty"`
}

// -----------------------------------------------------------------
// DTOs para la comunicación interna con el Servicio Modelo
// -----------------------------------------------------------------

// ModeloLoginRequest es lo que enviamos al servicio Modelo
type ModeloLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	ClientIP string `json:"client_ip"`
	UserAgent string `json:"user_agent"`
}

// ModeloLoginResponse es lo que esperamos del servicio Modelo
type ModeloLoginResponse struct {
	IDUsuario        int      `json:"id_usuario"`
	IDPersona        int      `json:"id_persona"`
	Roles            []string `json:"roles"`
	RefreshToken     string   `json:"refresh_token,omitempty"`
	RefreshExpiresAt string   `json:"refresh_expires_at,omitempty"`
}