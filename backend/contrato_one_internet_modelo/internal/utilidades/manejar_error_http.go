package utilidades

import (
	"errors"
	"net/http"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

func ManejarErrorHTTP(w http.ResponseWriter, err error) {

	var (
        validationErr ErrValidation
        notFoundErr   ErrNotFound
    )

	switch {

	// --- Errores Estructurados ---
    // Captura errores de validación del Handler
    case errors.As(err, &validationErr):
        ResponderError(w, http.StatusBadRequest, validationErr.Error())

    // Captura errores 'No Encontrado' del Servicio
    case errors.As(err, &notFoundErr):
        ResponderError(w, http.StatusNotFound, notFoundErr.Error())


	// --- Errores No Estructurados ---
	// Errores de negocio
	case errors.Is(err, ErrContrasenaObligatoria),
		errors.Is(err, ErrContrasenaCorta),
		errors.Is(err, ErrContrasenaDebil),
		errors.Is(err, ErrTokenInvalido),
		errors.Is(err, ErrTokenUsado),
		errors.Is(err, ErrTokenExpirado),
		errors.Is(err, ErrEmailYaVerificado):
		ResponderError(w, http.StatusBadRequest, err.Error())

	// Errores de base de datos / conflictos
	case errors.Is(err, ErrEmailDuplicado),
		errors.Is(err, ErrCuilDuplicado),
		errors.Is(err, ErrCuitDuplicado),
		errors.Is(err, ErrTelefonoDuplicado),
		errors.Is(err, ErrDniDuplicado),
		errors.Is(err, ErrNroConexionDuplicado),
		errors.Is(err, ErrPersonaVinculoEmpresaDuplicado),
		errors.Is(err, ErrDuplicadoClavePrimaria):
		ResponderError(w, http.StatusConflict, err.Error())

	case errors.Is(err, ErrViolacionClaveForanea),
		errors.Is(err, ErrViolacionClaveNoNulo),
		errors.Is(err, ErrViolacionRestriccionCheck),
		errors.Is(err, ErrViolacionTruncamientoDatos):
		ResponderError(w, http.StatusBadRequest, err.Error())

	case errors.Is(err, ErrNoEncontrado):
	ResponderError(w, http.StatusNotFound, err.Error())

	// Error interno no mapeado
	default:
		logger.Error.Printf("Error interno: %v", err)
		ResponderError(w, http.StatusInternalServerError, ErrInterno.Error())
	}
}
