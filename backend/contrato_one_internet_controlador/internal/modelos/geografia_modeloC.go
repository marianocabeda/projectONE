package modelos

// Provincia representa una provincia
type Provincia struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
}

// Departamento representa un departamento dentro de una provincia
type Departamento struct {
	ID          int    `json:"id"`
	IDProvincia int    `json:"id_provincia"`
	Nombre      string `json:"nombre"`
}

// Distrito representa un distrito dentro de un departamento
type Distrito struct {
	ID             int    `json:"id"`
	IDDepartamento int    `json:"id_departamento"`
	Nombre         string `json:"nombre"`
}
