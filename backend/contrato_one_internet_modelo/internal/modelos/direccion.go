package modelos

import "time"

// Direccion representa la tabla 'direccion' en la base de datos.
type Direccion struct {
	ID            int        `json:"id_direccion"`
	Calle         string     `json:"calle"`
	Numero        string     `json:"numero"`
	CodigoPostal  string     `json:"codigo_postal"`
	Piso          *string    `json:"piso,omitempty"`
	Depto         *string    `json:"depto,omitempty"`
	IDDistrito    int        `json:"id_distrito"`
	Creado        time.Time  `json:"creado"`
	UltimoCambio  time.Time  `json:"ultimo_cambio"`
	Borrado       *time.Time `json:"borrado,omitempty"`
}