package modelos

type TipoIVA struct {
    IDTipoIVA        int   `json:"id_tipo_iva"`
    TipoIVA          string `json:"tipo_iva"`
    IDUsuarioCreador *int   `json:"id_usuario_creador,omitempty"`
}
