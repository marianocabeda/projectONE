package modelos

import "contrato_one_internet_controlador/internal/utilidades"

// Direccion representa la estructura de datos para una dirección física.
type Direccion struct {
	Calle        string `json:"calle"`
	Numero       string `json:"numero"`
	CodigoPostal string `json:"codigo_postal"`
	Piso         *string `json:"piso,omitempty"`
	Depto        *string `json:"depto,omitempty"`
	IDDistrito   int    `json:"id_distrito"`
}

// Normalizar aplica las funciones de validadores para limpiar la dirección
func (d *Direccion) Normalizar() {
	d.Calle = utilidades.NormalizeCalle(d.Calle)
	d.Numero = utilidades.NormalizeNumero(d.Numero)
	d.CodigoPostal = utilidades.NormalizeCodigoPostal(d.CodigoPostal)
	d.Piso = utilidades.NormalizeOptionalField(d.Piso)
	d.Depto = utilidades.NormalizeOptionalField(d.Depto)
}