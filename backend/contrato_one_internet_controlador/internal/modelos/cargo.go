package modelos

// Cargo DTO usado por el controlador para responses del modelo
type Cargo struct {
    IDCargo int    `json:"id_cargo"`
    Nombre  string `json:"nombre"`
}
