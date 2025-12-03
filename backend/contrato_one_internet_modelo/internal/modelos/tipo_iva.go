package modelos

import "time"

// TipoIVA representa un tipo de IVA en el catálogo
type TipoIVA struct {
	IDTipoIVA        int        `json:"id_tipo_iva"`
	TipoIVA          string     `json:"tipo_iva"`
	IDUsuarioCreador *int       `json:"id_usuario_creador,omitempty"`
	Creado           time.Time  `json:"creado"`
	UltimoCambio     time.Time  `json:"ultimo_cambio"`
	Borrado          *time.Time `json:"borrado,omitempty"`
}