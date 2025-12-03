package modelos

type CatIdentificadorResponse []struct {
	IDIdentificador int    `json:"id_identificador"`
	Codigo          string `json:"codigo"`
	Descripcion     *string `json:"descripcion,omitempty"`
}

type CatTipoIvaResponse []struct {
	IDTipoIva int    `json:"id_tipo_iva"`
	TipoIva   string `json:"tipo_iva"`
}

type CatTipoEmpresaResponse []struct {
	IDTipoEmpresa int    `json:"id_tipo_empresa"`
	Nombre        string `json:"nombre"`
}

type CatVinculoResponse []struct {
	IDVinculo     int    `json:"id_vinculo"`
	NombreVinculo string `json:"nombre_vinculo"`
	Descripcion   *string `json:"descripcion,omitempty"`
}

type CatEstadoContratoResponse []struct {
	IDEstadoContrato int    `json:"id_estado_contrato"`
	Nombre           string `json:"nombre"`
	Descripcion      *string `json:"descripcion,omitempty"`
}

type CatTipoContratoResponse []struct {
	IDTipoContrato int    `json:"id_tipo_contrato"`
	Nombre         string `json:"nombre"`
	Descripcion    *string `json:"descripcion,omitempty"`
}

type CatEstadoConexionResponse []struct {
	IDEstadoConexion int    `json:"id_estado_conexion"`
	Nombre           string `json:"nombre"`
	Descripcion      *string `json:"descripcion,omitempty"`
}

type CatRolResponse []struct {
	IDRol        int    `json:"id_rol"`
	Nombre       string `json:"nombre"`
	Descripcion  *string `json:"descripcion,omitempty"`
}

type CatPermisoResponse []struct {
	IDPermiso    int    `json:"id_permiso"`
	Nombre       string `json:"nombre"`
	Descripcion  *string `json:"descripcion,omitempty"`
}