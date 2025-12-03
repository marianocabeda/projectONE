package modelos

type Vinculo struct {
    IDVinculo     int     `json:"id_vinculo"`
    NombreVinculo string  `json:"nombre_vinculo"`
    Descripcion   *string `json:"descripcion,omitempty"`
}
