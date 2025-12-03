package servicios

import (
	"context"
	"time"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades/linkconstructor"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"contrato_one_internet_controlador/internal/utilidades/tiempo"
	"fmt"
	"net/url"
	"strings"
)

// CorreoSender define la interfaz mínima que necesita el servicio para enviar correos.
type CorreoSender interface {
	EnviarCorreoVerificacionConNombre(destinatario, enlace, nombreCompleto string) error
	// Nuevo método para registro asistido
	EnviarCorreoCredenciales(destinatario, enlace, nombre, password string) error
}

type PersonaService struct {
	ModeloClient  *ModeloClient
	CorreoService CorreoSender
}

func NewPersonaService(modeloClient *ModeloClient, correoService CorreoSender) *PersonaService {
	return &PersonaService{
		ModeloClient:  modeloClient,
		CorreoService: correoService,
	}
}

// ObtenerPerfilPersona llama al servicio Modelo para obtener los datos completos
// de la persona asociada al id de usuario proporcionado.
func (s *PersonaService) ObtenerPerfilPersona(ctx context.Context, idUsuario int) (map[string]interface{}, error) {
	var result map[string]interface{}
	path := fmt.Sprintf("/api/v1/internal/perfil/persona?id_usuario=%d", idUsuario)
	if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &result, true); err != nil {
		return nil, err
	}
	return result, nil
}

// ObtenerDireccionPersona llama al servicio Modelo para obtener solo la dirección
// de la persona indicada por id_persona.
func (s *PersonaService) ObtenerDireccionPersona(ctx context.Context, idPersona int) (map[string]interface{}, error) {
	var result map[string]interface{}
	path := fmt.Sprintf("/api/v1/internal/perfil/direccion?id_persona=%d", idPersona)
	if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &result, true); err != nil {
		return nil, err
	}
	return result, nil
}

func (s *PersonaService) CrearPersonaConUsuario(ctx context.Context, req modelos.CrearPersonaConUsuarioRequest, idUsuario int64, esRegistroAsistido bool) (*modelos.CrearPersonaConUsuarioResponse, error) {

	// 1️- Preparar datos para enviar al servicio Modelo
	data := map[string]interface{}{
		"persona":   req.Persona,
		"direccion": req.Direccion,
		"password":  req.Password,
	}

	// Incluir id_usuario_creador si es un usuario logueado
	if idUsuario != 0 {
		// No sobrescribimos todo el objeto persona (podría perder campos como fecha_nacimiento),
		// simplemente añadimos el id_usuario_creador como puntero en la estructura.
		uid := int(idUsuario)
		req.Persona.IDUsuarioCreador = &uid
		data["persona"] = req.Persona
	}

	// 2- Llamar al ModeloClient para crear la persona con usuario
	var respModelo modelos.CrearPersonaConUsuarioResponse
	err := s.ModeloClient.DoRequest(ctx, "POST", "/api/v1/internal/personas-con-usuario", data, &respModelo, true)
	if err != nil {
		logger.Error.Printf("Error creando persona con usuario en el servicio modelo: %v", err)
		return nil, err
	}

	// 3️- Construir link de verificación
	var link string
	if esRegistroAsistido {
		// Registro realizado por empleado - Usar link de credenciales
		link = linkconstructor.BuildCredentialsLink(respModelo.Token)
	} else {
		// Auto-registro - Usar link de verificación estándar
		link = linkconstructor.BuildEmailVerificationLink(respModelo.Token)
	}

	expTime, _ := time.Parse(time.RFC3339, respModelo.ExpiracionToken)
	dur := time.Until(expTime)
	duracion := tiempo.BuildHumanDuration(dur)
	logger.Info.Printf("El token de verificación para %s expira en %s", respModelo.Email, duracion)

	// 4️- Obtener nombre completo y capitalizar
	nombre := capitalizarNombre(req.Persona.Nombre)
	apellido := capitalizarNombre(req.Persona.Apellido)
	nombreCompleto := fmt.Sprintf("%s %s", nombre, apellido)

	// 5- Lógica de envío de correo diferenciada
	if esRegistroAsistido {
		// CASO A: Registro por Empleado (Admin/Atencion) -> Enviar Password
		// Usamos la contraseña ORIGINAL que vino en el request (req.Password)
		if err := s.CorreoService.EnviarCorreoCredenciales(respModelo.Email, link, nombreCompleto, req.Password); err != nil {
			return nil, fmt.Errorf("error enviando credenciales: %w", err)
		}
	} else {
		// CASO B: Auto-registro
		if err := s.CorreoService.EnviarCorreoVerificacionConNombre(respModelo.Email, link, nombreCompleto); err != nil {
			return nil, fmt.Errorf("error enviando verificación: %w", err)
		}
	}

	return &respModelo, nil
}

// ActualizarMiPerfil llama al servicio modelo para aplicar actualizaciones parciales
// sobre la persona asociada al idUsuario. El mapa req puede contener campos
// opcionales: nombre, apellido, telefono, telefono_alternativo, email y direccion {...}.
// Retorna si se generó un token de verificación (y se envió el correo), el token y el email.
func (s *PersonaService) ActualizarMiPerfil(ctx context.Context, idUsuario int, req map[string]interface{}) (bool, string, string, error) {
	// Incluir id_usuario en la petición interna
	reqData := make(map[string]interface{})
	for k, v := range req {
		reqData[k] = v
	}
	reqData["id_usuario"] = idUsuario

	var resp map[string]interface{}
	if err := s.ModeloClient.DoRequest(ctx, "PATCH", "/api/v1/internal/perfil/persona", reqData, &resp, true); err != nil {
		logger.Error.Printf("Error llamando al modelo para actualizar perfil: %v", err)
		return false, "", "", err
	}

	// Parsear respuesta
	enviado := false
	token := ""
	email := ""
	if v, ok := resp["email_verificacion_enviada"]; ok {
		if b, ok2 := v.(bool); ok2 {
			enviado = b
		}
	}
	if v, ok := resp["token"]; ok {
		if s2, ok2 := v.(string); ok2 {
			token = s2
		}
	}
	if v, ok := resp["email"]; ok {
		if s2, ok2 := v.(string); ok2 {
			email = s2
		}
	}

	nombre := reqData["nombre"]
	apellido := reqData["apellido"]
	nombreCompleto := fmt.Sprintf("%s %s", capitalizarNombre(fmt.Sprintf("%v", nombre)), capitalizarNombre(fmt.Sprintf("%v", apellido)))

	// Si se generó token, construir link y enviar correo
	if enviado && token != "" && email != "" {
		cfg := config.GetConfig()
		var link string
		if cfg.FrontendURL != "" {
			tokenParam := "token=" + url.QueryEscape(token)
			if strings.Contains(cfg.FrontendURL, "?") {
				link = cfg.FrontendURL + "&" + tokenParam
			} else {
				link = cfg.FrontendURL + "?" + tokenParam
			}
		} else {
			link = fmt.Sprintf("https://tucontrolador.com/v1/auth/verificar-email?token=%s", url.QueryEscape(token))
		}

		if err := s.CorreoService.EnviarCorreoVerificacionConNombre(email, link, nombreCompleto); err != nil {
			logger.Error.Printf("Error enviando correo de verificación para %s: %v", email, err)
			return false, token, email, err
		}
	}

	return enviado, token, email, nil
}

// capitalizarNombre capitaliza correctamente un nombre (primera letra mayúscula, resto minúsculas)
func capitalizarNombre(nombre string) string {
	if nombre == "" {
		return ""
	}
	// Convertir a minúsculas primero
	nombre = strings.ToLower(strings.TrimSpace(nombre))
	// Capitalizar primera letra de cada palabra
	palabras := strings.Fields(nombre)
	for i, palabra := range palabras {
		if len(palabra) > 0 {
			palabras[i] = strings.ToUpper(string(palabra[0])) + palabra[1:]
		}
	}
	return strings.Join(palabras, " ")
}
