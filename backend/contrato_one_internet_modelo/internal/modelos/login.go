package modelos

type ModeloLoginResponse struct {
	IDUsuario        int      `json:"id_usuario"`
	IDPersona        int      `json:"id_persona"`
	Roles            []string `json:"roles"`
	RefreshToken     string   `json:"refresh_token,omitempty"`
	RefreshExpiresAt string   `json:"refresh_expires_at,omitempty"`
}
