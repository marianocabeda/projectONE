package modelos

// Persona representa la tabla 'persona' en la base de datos
type Persona struct {
	ID                  int        `json:"id_persona"`
	Nombre              string     `json:"nombre"`
	Apellido            string     `json:"apellido"`
	Sexo                string     `json:"sexo"`
	DNI                 string     `json:"dni"`
	Cuil                *string    `json:"cuil,omitempty"`
	FechaNacimiento     string     `json:"fecha_nacimiento"`
	IDDireccion         int        `json:"id_direccion"`
	DistritoNombre      *string    `json:"distrito_nombre,omitempty"`
	DepartamentoNombre  *string    `json:"departamento_nombre,omitempty"`
	ProvinciaNombre     *string    `json:"provincia_nombre,omitempty"`
	Telefono            string     `json:"telefono"`
	TelefonoAlternativo *string    `json:"telefono_alternativo,omitempty"`
	Email               string     `json:"email"`
	IDTipoIva           *int       `json:"id_tipo_iva,omitempty"`
	IDUsuarioCreador    *int       `json:"id_usuario_creador,omitempty"`

	// Campos de revisión
	IDArea        *int    `json:"id_area,omitempty"`
	CCT           *string `json:"cct,omitempty"`
	Estado        *int    `json:"estado,omitempty"`
	Observaciones *string `json:"observaciones,omitempty"`
}