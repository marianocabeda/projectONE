package modelos

// Permiso representa un permiso del sistema
type Permiso struct {
    IDPermiso   int     `json:"id_permiso"`
    Nombre      string  `json:"nombre"`
    Descripcion *string `json:"descripcion,omitempty"`
}
