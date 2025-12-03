package modelos

type CrearPersonaConUsuarioRequest struct {
    Persona   Persona   `json:"persona"`
    Direccion Direccion `json:"direccion"`
    Password  string    `json:"password"`
}

type CrearPersonaConUsuarioResponse struct {
	IDPersona int64  `json:"id_persona"`
	IDUsuario int64  `json:"id_usuario"`
	Token     string `json:"token"`
	Email     string `json:"email"`
	ExpiracionToken string `json:"token_expira"`
}
