package modelos

// Rol DTO para controlador
type Rol struct {
    IDRol      int     `json:"id_rol"`
    Nombre     string  `json:"nombre"`
    Descripcion *string `json:"descripcion,omitempty"`
}
