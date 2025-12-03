package personas

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"contrato_one_internet_modelo/internal/utilidades/logger"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type PersonasHandler struct {
	usuarioService *servicios.UsuarioService
}

func NewPersonasHandler(us *servicios.UsuarioService) *PersonasHandler {
	return &PersonasHandler{usuarioService: us}
}

func (h *PersonasHandler) CrearPersonaYUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close() // Liberar recursos

	var req struct {
		Persona   modelos.Persona   `json:"persona"`
		Direccion modelos.Direccion `json:"direccion"`
		Password  string             `json:"password"`
	}

	fecha := req.Persona.FechaNacimiento
	// Decodificar request JSON
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error.Printf("Error decodificando request: %v", err)
		if fecha.Time().IsZero() {
			utilidades.ManejarErrorHTTP(w, utilidades.ErrValidation{
				Campo:   "fecha_nacimiento",
				Mensaje: "fecha de nacimiento obligatoria y en formato DD-MM-YYYY",
			})
			return
		}
		utilidades.ResponderError(w, http.StatusBadRequest, "Estructura de datos inválida")
		return
	}

	// Context con timeout
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	// Registro público: si la petición no incluye Authorization (es pública) entonces
	// no confiamos en id_usuario_creador enviado por el cliente y lo nulificamos.
	// En cambio, si la petición es interna (Modelo recibe Authorization con token interno)
	// permitimos que el campo llegue para que el servicio pueda usarlo.
	if r.Header.Get("Authorization") == "" {
		req.Persona.IDUsuarioCreador = nil
	}

	// Llamada al servicio
	resp, err := h.usuarioService.CrearPersonaYUsuario(ctx, req.Persona, req.Direccion, req.Password)
	if err != nil {
		utilidades.ManejarErrorHTTP(w, err)
		return
	}

	// Respuesta exitosa
	utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{
		"mensaje":     "Usuario creado y correo de verificación enviado.",
		"id_persona":  resp.IDPersona,
		"id_usuario":  resp.IDUsuario,
		"email":       resp.Email,
		"token":       resp.Token,
		"token_expira": resp.ExpiracionToken,
	})
}