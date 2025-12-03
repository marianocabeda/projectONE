package clientes
/*
import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type CrearParticularRequest struct {
	Persona   modelos.Persona   `json:"persona"`
	Direccion modelos.Direccion `json:"direccion"`
}

type CrearEmpresaRequest struct {
	Apoderado          modelos.Persona   `json:"apoderado"`
	DireccionApoderado modelos.Direccion `json:"direccion_apoderado"`
	Empresa            modelos.Empresa   `json:"empresa"`
	DireccionEmpresa   modelos.Direccion `json:"direccion_empresa"`
}

// ✅ Solo una definición de ClientesHandler
type ClientesHandler struct {
	servicio *servicios.ClientesService
}

func NewClientesHandler(s *servicios.ClientesService) *ClientesHandler {
	return &ClientesHandler{servicio: s}
}

// 🧾 Crear Cliente Particular
func (h *ClientesHandler) CrearClienteParticular(w http.ResponseWriter, r *http.Request) {
	var req CrearParticularRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Request body inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	idPersona, err := h.servicio.CrearClienteParticular(ctx, servicios.CrearParticularRequest{
		Persona:   req.Persona,
		Direccion: req.Direccion,
	})
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{
		"mensaje":    "Cliente particular creado exitosamente",
		"id_persona": idPersona,
	})
}

// 🧾 Crear Cliente Empresa
func (h *ClientesHandler) CrearClienteEmpresa(w http.ResponseWriter, r *http.Request) {
	var req CrearEmpresaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Request body inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	resultado, err := h.servicio.CrearClienteEmpresa(ctx, servicios.CrearEmpresaRequest{
		Apoderado:          req.Apoderado,
		DireccionApoderado: req.DireccionApoderado,
		Empresa:            req.Empresa,
		DireccionEmpresa:   req.DireccionEmpresa,
	})
	if err != nil {
		utilidades.ResponderErrorDB(w, err)
		return
	}

	utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{
		"mensaje":      "Cliente empresa creado exitosamente",
		"id_empresa":   resultado.IDEmpresa,
		"id_apoderado": resultado.IDApoderado,
	})
}*/