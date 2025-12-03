package modelos

// Empresa representa la estructura de datos para una entidad comercial.
type Empresa struct {
	IDEmpresa         int    `json:"id_empresa,omitempty"`
	NombreComercial   string `json:"nombre_comercial"`
	RazonSocial       string `json:"razon_social"`
	Cuit              string `json:"cuit"`
	IDTipoEmpresa     int    `json:"id_tipo_empresa"`
	IDDireccion       int    `json:"id_direccion,omitempty"`
	DistritoNombre    *string `json:"distrito_nombre"`
	DepartamentoNombre *string `json:"departamento_nombre"`
	ProvinciaNombre   *string `json:"provincia_nombre"`
	Telefono          string `json:"telefono"`
	TelefonoAlternativo *string `json:"telefono_alternativo,omitempty"`
	Email             string `json:"email"`
	IDTipoIva         *int   `json:"id_tipo_iva,omitempty"`
	IDUsuarioCreador  *int   `json:"id_usuario_creador,omitempty"`
}
