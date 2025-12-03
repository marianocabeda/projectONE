package clientes

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"contrato_one_internet_controlador/internal/middleware"
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"contrato_one_internet_controlador/internal/validadores"
)

// PersonasHandler maneja las solicitudes HTTP relacionadas con personas.
type PersonasHandler struct {
	service *servicios.PersonaService
}

// NewPersonasHandler crea una nueva instancia del handler.
func NewPersonasHandler(service *servicios.PersonaService) *PersonasHandler {
	return &PersonasHandler{service: service}
}

// CrearPersonaConUsuarioHandler maneja la creación de una persona y su usuario asociado.
func (h *PersonasHandler) CrearPersonaConUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Obtener claims del contexto si el JWT existe (puede ser registro público).
	var idUsuario int64
	var esRegistroAsistido bool

	if claims, ok := middleware.GetClaimsFromContext(ctx); ok {
		logger.Info.Printf("Claims obtenidos: %+v\n", claims)

		// Verificar si el usuario creador es empleado (Admin o Atención)
		if claims.HasRole("admin") || claims.HasRole("atencion") {
			esRegistroAsistido = true
			idUsuario = int64(claims.IDUsuario)
		}
	} else {
		logger.Info.Printf("No se encontraron claims en el contexto.\n")
	}

	defer r.Body.Close()

	var req modelos.CrearPersonaConUsuarioRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	if err := validadores.ValidarPersona(req.Persona); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	req.Direccion.Normalizar()

	if err := validadores.ValidarDireccion(req.Direccion); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := validadores.ValidarPassword(req.Password); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Llamar al servicio pasando el flag 'esRegistroAsistido'
	respuesta, err := h.service.CrearPersonaConUsuario(ctx, req, idUsuario, esRegistroAsistido)
	if err != nil {
		// Manejo de errores (igual que antes)...
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error creando persona: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno")
		return
	}

	// Preparar respuesta según el tipo de registro
	if esRegistroAsistido {
		// Registro asistido: devolver id_persona para el siguiente paso (solicitud de conexión)
		utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{
			"mensaje":    "Usuario creado exitosamente por personal. Credenciales enviadas al cliente.",
			"id_persona": respuesta.IDPersona,
			"email":      respuesta.Email,
		})
	} else {
		// Auto-registro: solo mensaje
		utilidades.ResponderJSON(w, http.StatusCreated, map[string]string{
			"mensaje": "Usuario creado y correo de verificación enviado.",
		})
	}
}

/*
func (h *PersonasHandler) CrearPersonaConUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Obtener claims del contexto si el JWT existe (puede ser registro público).
	var idUsuario int64
	if claims, ok := middleware.GetClaimsFromContext(ctx); ok {
		fmt.Printf("Claims obtenidos: %+v\n", claims)
		idUsuario = int64(claims.IDUsuario)
	} else {
		fmt.Printf("No se encontraron claims en el contexto.\n")
	}

	defer r.Body.Close()

	var req modelos.CrearPersonaConUsuarioRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	if err := validadores.ValidarPersona(req.Persona); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	req.Direccion.Normalizar()

	if err := validadores.ValidarDireccion(req.Direccion); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := validadores.ValidarPassword(req.Password); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Llamar al servicio
	if err := h.service.CrearPersonaConUsuario(ctx, req, idUsuario); err != nil {

		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		logger.Error.Printf("Error creando persona con usuario: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusCreated, map[string]string{
		"mensaje": "Usuario creado y correo de verificación enviado.",
	})
}*/

// ObtenerPerfilPersonaHandler maneja GET /v1/api/perfil/persona
// Este endpoint utiliza el JWT para identificar al usuario autenticado y
// solicitar al servicio Modelo los datos completos de la persona.
func (h *PersonasHandler) ObtenerPerfilPersonaHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Obtener claims del contexto inyectados por JWTAuthMiddleware.
	claims, ok := middleware.GetClaimsFromContext(ctx)
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "claims no disponibles")
		return
	}

	idUsuario := int(claims.IDUsuario)

	// Llamar al servicio que contacta al Modelo
	resp, err := h.service.ObtenerPerfilPersona(ctx, idUsuario)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error obteniendo perfil: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ObtenerPerfilDireccionHandler maneja GET /v1/api/perfil/direccion
// Devuelve solo la dirección de la persona autenticada.
func (h *PersonasHandler) ObtenerPerfilDireccionHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Obtener claims del contexto. Si el JWT incluyera el id_persona se podría
	// usar directamente. Como la implementación actual expone IDUsuario, obtenemos
	// primero el perfil y luego extraemos la dirección.
	claims, ok := middleware.GetClaimsFromContext(ctx)
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "claims no disponibles")
		return
	}
	idUsuario := int(claims.IDUsuario)

	perfil, err := h.service.ObtenerPerfilPersona(ctx, idUsuario)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error obteniendo perfil para direccion: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Extraer id_persona de la respuesta para pedir solo la dirección.
	idPersonaFloat, ok := perfil["id_persona"].(float64)
	if !ok {
		// Si la respuesta no incluye id_persona, devolver 404
		utilidades.ResponderError(w, http.StatusNotFound, "persona no encontrada")
		return
	}
	idPersona := int(idPersonaFloat)

	direccionResp, err := h.service.ObtenerDireccionPersona(ctx, idPersona)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			if modeloErr.StatusCode == http.StatusNotFound {
				utilidades.ResponderError(w, http.StatusNotFound, "dirección no encontrada")
				return
			}
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error obteniendo direccion: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, direccionResp)
}

// ObtenerPerfilUsuarioHandler maneja GET /v1/api/usuarios/{id}/perfil
// Requisitos:
// - Solo administradores autenticados pueden acceder (RequireRole("admin")).
// - Obtiene {id} del path (mux.Vars) y valida que sea numérico.
// - Reutiliza el servicio para obtener el PerfilPersonaResponse y lo devuelve como JSON.
// - Maneja códigos HTTP: 401, 403, 404, 500 según corresponda.
func (h *PersonasHandler) ObtenerPerfilUsuarioHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// 1) Obtener el parámetro {id} desde la ruta
	vars := mux.Vars(r)
	idStr, ok := vars["id"]
	if !ok || idStr == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "id de usuario requerido en la ruta")
		return
	}

	// 2) Validar que el id sea numérico
	idUsuario, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id de usuario inválido")
		return
	}

	// 3) Llamar al servicio para obtener el perfil (reutiliza la llamada al Modelo)
	perfil, err := h.service.ObtenerPerfilPersona(ctx, idUsuario)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			// Si el Modelo devolvió un 404, reenvíamos 404 al cliente
			if modeloErr.StatusCode == http.StatusNotFound {
				utilidades.ResponderError(w, http.StatusNotFound, "usuario no encontrado")
				return
			}
			// Para otros códigos, reenviar el código y mensaje tal cual
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}

		// Error interno no mapeado
		logger.Error.Printf("Error obteniendo perfil de usuario %d: %v", idUsuario, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// 4) Responder con la misma estructura que PerfilPersonaResponse
	utilidades.ResponderJSON(w, http.StatusOK, perfil)
}

// UpdateMiPerfilHandler maneja PATCH /v1/api/perfil/persona para que el usuario
// autenticado actualice su propio perfil (campos parciales). Si cambia el email,
// el servicio enviará correo de verificación.
func (h *PersonasHandler) UpdateMiPerfilHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := middleware.GetClaimsFromContext(ctx)
	if !ok {
		utilidades.ResponderError(w, http.StatusUnauthorized, "claims no disponibles")
		return
	}
	idUsuario := int(claims.IDUsuario)

	defer r.Body.Close()

	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido o mal formado")
		return
	}

	// Validación mínima
	if len(payload) == 0 {
		utilidades.ResponderError(w, http.StatusBadRequest, "al menos un campo requerido para actualizar")
		return
	}

	// Validar sección de dirección si existe
	if d, ok := payload["direccion"]; ok {
		// Esperamos que el subobjeto sea un map[string]interface{}
		direccionMap, okMap := d.(map[string]interface{})
		if !okMap {
			utilidades.ResponderError(w, http.StatusBadRequest, "formato inválido en dirección")
			return
		}

		// Convertir el map a struct para normalizar y validar
		dirBytes, err := json.Marshal(direccionMap)
		if err != nil {
			utilidades.ResponderError(w, http.StatusBadRequest, "formato inválido en dirección")
			return
		}

		var dir modelos.Direccion
		if err := json.Unmarshal(dirBytes, &dir); err != nil {
			utilidades.ResponderError(w, http.StatusBadRequest, "error al interpretar la dirección")
			return
		}

		// Normalizar y validar
		dir.Normalizar()
		if err := validadores.ValidarDireccion(dir); err != nil {
			utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
			return
		}

		// Actualizar el map original con los valores normalizados.
		// Esto preserva la presencia explícita de claves (incluyendo null) para que
		// el servicio modelo pueda distinguir entre ausencia y null.
		direccionMap["calle"] = dir.Calle
		direccionMap["numero"] = dir.Numero
		direccionMap["codigo_postal"] = dir.CodigoPostal
		if dir.Piso == nil {
			// mantener la clave con valor nil (JSON null)
			direccionMap["piso"] = nil
		} else {
			direccionMap["piso"] = *dir.Piso
		}
		if dir.Depto == nil {
			direccionMap["depto"] = nil
		} else {
			direccionMap["depto"] = *dir.Depto
		}
		direccionMap["id_distrito"] = dir.IDDistrito

		payload["direccion"] = direccionMap
	}

	// Lógica de actualización
	enviado, _, email, err := h.service.ActualizarMiPerfil(ctx, idUsuario, payload)
	if err != nil {
		var modeloErr *servicios.ModeloError
		if errors.As(err, &modeloErr) {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
			return
		}
		logger.Error.Printf("Error actualizando perfil usuario %d: %v", idUsuario, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error interno del servidor")
		return
	}

	// Respuesta OK
	resp := map[string]interface{}{"mensaje": "Perfil actualizado correctamente"}
	if enviado {
		resp["email_verificacion_enviada"] = true
		resp["email"] = email
	}
	utilidades.ResponderJSON(w, http.StatusOK, resp)
}
