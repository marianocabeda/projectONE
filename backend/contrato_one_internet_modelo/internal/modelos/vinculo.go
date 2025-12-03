package modelos

// Vinculo representa un vínculo entre persona y empresa
type Vinculo struct {
    IDVinculo     int     `json:"id_vinculo"`
    NombreVinculo string  `json:"nombre_vinculo"`
    Descripcion   *string `json:"descripcion,omitempty"`
}
// PersonaVinculoEmpresa representa la tabla de unión 'persona_vinculo_empresa'.
type PersonaVinculoEmpresa struct {
	IDPersona int  `json:"id_persona"`
	IDVinculo int  `json:"id_vinculo"`
	IDEmpresa int  `json:"id_empresa"`
	IDCargo   *int `json:"id_cargo,omitempty"`
}