package modelos

// TipoEmpresa representa el catálogo de tipos de empresa
type TipoEmpresa struct {
    IDTipoEmpresa int    `json:"id_tipo_empresa"`
    Nombre        string `json:"nombre"`
}
