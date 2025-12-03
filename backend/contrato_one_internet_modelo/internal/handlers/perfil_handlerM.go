package personas

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

// PerfilHandler expone endpoints para obtener perfil y dirección de la persona.
type PerfilHandler struct {
	usuarioService *servicios.UsuarioService
}

func NewPerfilHandler(us *servicios.UsuarioService) *PerfilHandler {
	return &PerfilHandler{usuarioService: us}
}

// ObtenerPerfilPersonaHandler maneja GET /api/v1/internal/perfil/persona?id_usuario={id}
// Retorna datos personales y la dirección completa.
func (h *PerfilHandler) ObtenerPerfilPersonaHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query().Get("id_usuario")
	if q == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "parametro id_usuario requerido")
		return
	}
	id, err := strconv.Atoi(q)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_usuario inválido")
		return
	}

	resp, err := h.usuarioService.ObtenerPerfilPorUsuarioID(ctx, id)
	if err != nil {
		logger.Error.Printf("Error obteniendo perfil para usuario %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder JSON con la estructura ya construida por el servicio
	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ObtenerDireccionHandler maneja GET /api/v1/internal/perfil/direccion?id_persona={id}
// Retorna solo la dirección y los nombres geográficos.
func (h *PerfilHandler) ObtenerDireccionHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	q := r.URL.Query().Get("id_persona")
	if q == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "parametro id_persona requerido")
		return
	}
	id, err := strconv.Atoi(q)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_persona inválido")
		return
	}

	resp, err := h.usuarioService.ObtenerDireccionPorPersonaID(ctx, id)
	if err != nil {
		// Si no hay dirección registrada, devolver 404
		utilidades.ResponderError(w, http.StatusNotFound, "dirección no encontrada")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ActualizarPerfilPersonaHandler maneja PATCH /api/v1/internal/perfil/persona
// Espera en el body un JSON con id_usuario y los campos opcionales a modificar.
func (h *PerfilHandler) ActualizarPerfilPersonaHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	defer r.Body.Close()

	// Usar map para detectar la presencia de campos (incluyendo null)
	var rawReq map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&rawReq); err != nil {
		logger.Error.Printf("Error decodificando request UpdatePerfilPersona: %v", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	// Extraer id_usuario
	idUsuarioRaw, ok := rawReq["id_usuario"]
	if !ok {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_usuario requerido")
		return
	}
	idUsuarioFloat, ok := idUsuarioRaw.(float64)
	if !ok {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_usuario inválido")
		return
	}
	idUsuario := int(idUsuarioFloat)
	if idUsuario == 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_usuario requerido")
		return
	}

	// Llamar al servicio para ejecutar la actualización pasando el mapa completo
	enviado, token, email, err := h.usuarioService.ActualizarPerfilPorUsuarioID(ctx, idUsuario, rawReq)
	if err != nil {
		if errors.Is(err, utilidades.ErrEmailDuplicado) {
			utilidades.ResponderError(w, http.StatusConflict, "email duplicado")
			return
		}
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "registro no encontrado")
			return
		}
		logger.Error.Printf("Error actualizando perfil usuario %d: %v", idUsuario, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Responder con información para que el controlador pueda enviar correo si corresponde
	utilidades.ResponderJSON(w, http.StatusOK, map[string]interface{}{
		"mensaje":                    "Perfil actualizado correctamente",
		"email_verificacion_enviada": enviado,
		"token":                      token,
		"email":                      email,
	})
}
