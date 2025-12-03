package clientes

import "contrato_one_internet_controlador/internal/modelos"

// CrearClienteParticularRequest es el DTO para la solicitud de creación de cliente particular
type CrearClienteParticularRequest struct {
	Persona        modelos.Persona    `json:"persona"`
	Direccion      *modelos.Direccion  `json:"direccion"`
}

// CrearClienteParticularResponse es el DTO para la respuesta de creación
type CrearClienteParticularResponse struct {
	IDPersona int `json:"id_persona"`
	IDUsuario int `json:"id_usuario"`
	// Otros IDs si es necesario, como IDDireccion, IDVinculo
}

// CrearClienteEmpresaRequest es el DTO para la solicitud de creación de cliente empresa
type CrearClienteEmpresaRequest struct {
	Empresa       modelos.Empresa    `json:"empresa"`
	Direccion     *modelos.Direccion  `json:"direccion"`
	Apoderado     *modelos.Persona    `json:"apoderado"`
}

// CrearClienteEmpresaResponse es el DTO para la respuesta de creación
type CrearClienteEmpresaResponse struct {
	IDEmpresa   int `json:"id_empresa"`
	IDUsuario   int `json:"id_usuario"`
	// Otros IDs si es necesario, como IDDireccion, IDVinculo
}