package modelos

// Permiso DTO para controlador
type Permiso struct {
    IDPermiso   int     `json:"id_permiso"`
    Nombre      string  `json:"nombre"`
    Descripcion *string `json:"descripcion,omitempty"`
}
