package geografia

import (
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"net/http"
	"strconv"
)

type Handler struct {
	Repo *repositorios.GeografiaRepository
}

func NewHandler(repo *repositorios.GeografiaRepository) *Handler {
	return &Handler{Repo: repo}
}

func (h *Handler) ObtenerProvincias(w http.ResponseWriter, r *http.Request) {
	provincias, err := h.Repo.ObtenerProvincias()
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	if len(provincias) == 0 {
		utilidades.ResponderError(w, http.StatusNotFound, "No se encontraron provincias")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, provincias)
}

func (h *Handler) ObtenerDepartamentos(w http.ResponseWriter, r *http.Request) {
	provinciaID, err := strconv.Atoi(r.URL.Query().Get("provincia_id"))
	if err != nil || provinciaID <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "El ID de provincia es requerido y debe ser mayor a 0")
		return
	}

	departamentos, err := h.Repo.ObtenerDepartamentosPorProvincia(provinciaID)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	if len(departamentos) == 0 {
		utilidades.ResponderError(w, http.StatusNotFound, "No se encontraron departamentos para la provincia indicada")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, departamentos)
}

func (h *Handler) ObtenerDistritos(w http.ResponseWriter, r *http.Request) {
	departamentoID, err := strconv.Atoi(r.URL.Query().Get("departamento_id"))
	if err != nil || departamentoID <= 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "El ID de departamento es requerido y debe ser mayor a 0")
		return
	}

	distritos, err := h.Repo.ObtenerDistritosPorDepartamento(departamentoID)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	if len(distritos) == 0 {
		utilidades.ResponderError(w, http.StatusNotFound, "No se encontraron distritos para el departamento indicado")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, distritos)
}