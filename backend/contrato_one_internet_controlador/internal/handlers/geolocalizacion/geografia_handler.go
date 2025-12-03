package geolocalizacion 

import (
	
	"net/http"
	"strconv"

	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
)

type Handler struct { 
	service *servicios.GeografiaService
}

func NewHandler(service *servicios.GeografiaService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ObtenerProvinciasHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	provincias, err := h.service.ObtenerProvincias(ctx)

	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno al consultar provincias")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, provincias)
}

func (h *Handler) ObtenerDepartamentosHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	provinciaID, err := strconv.Atoi(r.URL.Query().Get("provincia_id"))
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "parámetro 'provincia_id' inválido")
		return
	}

	departamentos, err := h.service.ObtenerDepartamentos(ctx, provinciaID)
	if err != nil {
		if err.Error() == "no se encontraron departamentos para la provincia indicada" {
			utilidades.ResponderError(w, http.StatusNotFound, err.Error())
			return
		}
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno al consultar departamentos")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, departamentos)
}

func (h *Handler) ObtenerDistritosHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	departamentoID, err := strconv.Atoi(r.URL.Query().Get("departamento_id"))
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "parámetro 'departamento_id' inválido")
		return
	}

	distritos, err := h.service.ObtenerDistritos(ctx, departamentoID)
	if err != nil {
		if err.Error() == "no se encontraron distritos para el departamento indicado" {
			utilidades.ResponderError(w, http.StatusNotFound, err.Error())
			return
		}
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno al consultar distritos")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, distritos)
}