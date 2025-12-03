package modelos

// Rol representa un rol de usuario
type Rol struct {
    IDRol      int     `json:"id_rol"`
    Nombre     string  `json:"nombre"`
    Descripcion *string `json:"descripcion,omitempty"`
}
