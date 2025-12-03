package modelos

import "time"

// Empresa representa la tabla 'empresa' en la base de datos.
type Empresa struct {
	IDEmpresa         int        `json:"id_empresa"`
	NombreComercial   string     `json:"nombre_comercial"`
	RazonSocial       string     `json:"razon_social"`
	Cuit              string     `json:"cuit"`
	IDTipoEmpresa     int        `json:"id_tipo_empresa"`
	IDDireccion       int        `json:"id_direccion"`
	DistritoNombre    string     `json:"distrito_nombre"`
	DepartamentoNombre string    `json:"departamento_nombre"`
	ProvinciaNombre   string     `json:"provincia_nombre"`
	Telefono          string     `json:"telefono"`
	TelefonoAlternativo *string   `json:"telefono_alternativo,omitempty"`
	Email             string     `json:"email"`
	IDTipoIva         *int       `json:"id_tipo_iva,omitempty"`
	IDUsuarioCreador  *int       `json:"id_usuario_creador,omitempty"`
	Creado            time.Time  `json:"creado"`
	UltimoCambio      time.Time  `json:"ultimo_cambio"`
	Borrado           *time.Time `json:"borrado,omitempty"`
}