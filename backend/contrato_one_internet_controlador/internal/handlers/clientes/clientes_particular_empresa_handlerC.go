package clientes

import (
	"encoding/json"
	"log"
	"net/http"

	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/validadores"
)

// ClientesHandler maneja las peticiones HTTP para el recurso de clientes.
type ClientesHandler struct {
	service *servicios.ClientesService
}

// NewClientesHandler crea una nueva instancia de ClientesHandler.
func NewClientesHandler(s *servicios.ClientesService) *ClientesHandler {
	return &ClientesHandler{service: s}
}

// ****************************************************************************
// CrearClienteParticularHandler maneja la creación de clientes particulares.
// ****************************************************************************
func (h *ClientesHandler) CrearClienteParticularHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Persona   modelos.Persona   `json:"persona"`
		Direccion modelos.Direccion `json:"direccion"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	if err := validadores.ValidarDireccion(req.Direccion); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validadores.ValidarPersona(req.Persona); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.service.CrearClienteParticular(ctx,req.Persona, req.Direccion)
	if err != nil {
		log.Printf("Error desde el servicio de clientes: %v", err)
		utilidades.ResponderError(w, http.StatusConflict, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusCreated, resp)
}

// ****************************************************************************
// CrearClienteEmpresaHandler maneja la creación de clientes empresa.
// ****************************************************************************
func (h *ClientesHandler) CrearClienteEmpresaHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Apoderado          modelos.Persona   `json:"apoderado"`
		DireccionApoderado modelos.Direccion `json:"direccion_apoderado"`
		Empresa            modelos.Empresa   `json:"empresa"`
		DireccionEmpresa   modelos.Direccion `json:"direccion_empresa"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	// Validaciones
	if err := validadores.ValidarDireccion(req.DireccionApoderado); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Datos de dirección del apoderado inválidos: "+err.Error())
		return
	}
	if err := validadores.ValidarPersona(req.Apoderado); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Datos del apoderado inválidos: "+err.Error())
		return
	}
	if err := validadores.ValidarDireccion(req.DireccionEmpresa); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Datos de dirección de la empresa inválidos: "+err.Error())
		return
	}
	if err := validadores.ValidarEmpresa(req.Empresa); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Datos de la empresa inválidos: "+err.Error())
		return
	}

	// Llamar al servicio
	resp, err := h.service.CrearClienteEmpresa(ctx, req.Apoderado, req.DireccionApoderado, req.Empresa, req.DireccionEmpresa)
	if err != nil {
		log.Printf("Error desde el servicio de clientes: %v", err)
		utilidades.ResponderError(w, http.StatusConflict, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusCreated, resp)
}