
package servicios

import (
	"bytes"
	"contrato_one_internet_controlador/internal/utilidades/logger"
	"encoding/base64"
	"fmt"
	"html/template"
	"mime/quotedprintable"
	"net/smtp"
	"os"
	"strings"
	"time"
)

type ServicioCorreo struct {
	Host               string
	Port               string
	Usuario            string
	Password           string
	FromEmail          string
	FromName           string
	TemplatePath       string
	ResetTemplatePath  string // Plantilla para recuperación de contraseña
	CredentialsPath    string // Plantilla para envío de credenciales en registro asistido
	TokenTemplatePath  string // Plantilla para token de firma digital
	LogoLightPath      string
	LogoDarkPath       string
}

type EmailData struct {
	UserName         string
	VerificationLink string
	VerificationCode string
	ResetLink        string // Enlace para recuperar contraseña
	Token            string // Token de firma digital
	ShowToken        bool
	ExpirationHours  int
	Year             int
	Password        string // Nueva contraseña para registro asistido
}

func NewServicioCorreo(host, port, usuario, password, fromEmail, fromName, templatePath, resetTemplatePath, credentialsPath, tokenTemplatePath, logoLightPath, logoDarkPath string) *ServicioCorreo {
	return &ServicioCorreo{
		Host:              host,
		Port:              port,
		Usuario:           usuario,
		Password:          password,
		FromEmail:         fromEmail,
		FromName:          fromName,
		TemplatePath:      templatePath,
		ResetTemplatePath: resetTemplatePath,
		CredentialsPath:   credentialsPath,
		TokenTemplatePath: tokenTemplatePath,
		LogoLightPath:     logoLightPath,
		LogoDarkPath:      logoDarkPath,
	}
}

// EnviarCorreoCredenciales envía el email de bienvenida con usuario, contraseña y link de verificación
func (s *ServicioCorreo) EnviarCorreoCredenciales(destinatario, enlace, nombreCompleto, password string) error {
    userName := nombreCompleto
    if userName == "" {
        userName = extractNameFromEmail(destinatario)
    }

    // Datos para la plantilla
    data := EmailData{
        UserName:         userName,
        VerificationLink: enlace,
        Password:         password, // <--- Se pasa la contraseña plana
        ShowToken:        false,
        ExpirationHours:  24, // O el tiempo que se desee
        Year:             time.Now().Year(),
    }

    // Se usa el nuevo template y un asunto de Bienvenida
    return s.enviarEmailHTMLConPlantilla(destinatario, "Bienvenido a ONE Internet - Tus Credenciales", data, s.CredentialsPath)
}

// EnviarCorreoVerificacionConNombre permite especificar el nombre completo
func (s *ServicioCorreo) EnviarCorreoVerificacionConNombre(destinatario, enlace, nombreCompleto string) error {
	userName := nombreCompleto
	if userName == "" {
		userName = extractNameFromEmail(destinatario)
	}

	// Datos para la plantilla
	data := EmailData{
		UserName:         userName,
		VerificationLink: enlace,
		ShowToken:        false,
		ExpirationHours:  24,
		Year:             time.Now().Year(),
	}

	return s.enviarEmailHTML(destinatario, "Verificá tu cuenta - ONE Internet", data)
}

// EnviarCorreoReset envía un correo para restablecer la contraseña usando la plantilla mail-recuperar.html
func (s *ServicioCorreo) EnviarCorreoReset(destinatario, enlace string) error {
	// Datos para la plantilla
	data := EmailData{
		UserName:         extractNameFromEmail(destinatario),
		ResetLink:        enlace,
		ShowToken:        false,
		ExpirationHours:  2,
		Year:             time.Now().Year(),
	}

	return s.enviarEmailHTMLConPlantilla(destinatario, "Recuperá tu contraseña - ONE Internet", data, s.ResetTemplatePath)
}

// EnviarTokenFirma envía un correo con el token de firma digital usando la plantilla mail-token-firma.html
func (s *ServicioCorreo) EnviarTokenFirma(destinatario, token, nombreCompleto string, expirationHours int) error {
	userName := nombreCompleto
	if userName == "" {
		userName = extractNameFromEmail(destinatario)
	}

	// Datos para la plantilla
	data := EmailData{
		UserName:         userName,
		Token:            token,
		ShowToken:        false,
		ExpirationHours:  expirationHours,
		Year:             time.Now().Year(),
	}

	return s.enviarEmailHTMLConPlantilla(destinatario, "Token de Firma Digital - ONE Internet", data, s.TokenTemplatePath)
}

func (s *ServicioCorreo) enviarEmailHTML(destinatario, asunto string, data EmailData) error {
	return s.enviarEmailHTMLConPlantilla(destinatario, asunto, data, s.TemplatePath)
}

func (s *ServicioCorreo) enviarEmailHTMLConPlantilla(destinatario, asunto string, data EmailData, templatePath string) error {
	auth := smtp.PlainAuth("", s.Usuario, s.Password, s.Host)

	// Renderizar plantilla HTML
	htmlBody, err := s.renderTemplateFromPath(data, templatePath)
	if err != nil {
		logger.Error.Printf("Error renderizando plantilla: %v", err)		
		return err
	}

	// Leer imágenes
	logoLight, err := s.readImageAsBase64(s.LogoLightPath)
	if err != nil {
		logger.Error.Printf("⚠️ Advertencia: no se pudo cargar logo claro: %v", err)
		logoLight = ""
	}

	logoDark, err := s.readImageAsBase64(s.LogoDarkPath)
	if err != nil {
		logger.Error.Printf("⚠️ Advertencia: no se pudo cargar logo oscuro: %v", err)
		logoDark = ""
	}

	// Construir mensaje MIME
	mensaje := s.construirMensajeMIME(destinatario, asunto, htmlBody, logoLight, logoDark)

	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)

	err = smtp.SendMail(addr, auth, s.FromEmail, []string{destinatario}, mensaje)
	if err != nil {
		logger.Error.Printf("❌ Error al enviar correo: %v", err)
		return err
	}

	logger.Info.Printf("✅ Correo HTML enviado exitosamente a %s", destinatario)
	return nil
}

func (s *ServicioCorreo) construirMensajeMIME(destinatario, asunto, htmlBody, logoLight, logoDark string) []byte {
	var mensaje bytes.Buffer

	// Headers principales
	mensaje.WriteString(fmt.Sprintf("From: %s <%s>\r\n", s.FromName, s.FromEmail))
	mensaje.WriteString(fmt.Sprintf("To: %s\r\n", destinatario))
	mensaje.WriteString(fmt.Sprintf("Subject: %s\r\n", asunto))
	mensaje.WriteString("MIME-Version: 1.0\r\n")
	mensaje.WriteString("Content-Language: es\r\n") // Indicar idioma español

	// Boundary para multipart/alternative
	boundaryAlt := "----=_Part_Alt_" + generateBoundary()
	mensaje.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundaryAlt))
	mensaje.WriteString("\r\n")

	// Parte 1: Texto plano (fallback)
	mensaje.WriteString(fmt.Sprintf("--%s\r\n", boundaryAlt))
	mensaje.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	mensaje.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
	mensaje.WriteString("\r\n")
	textPlain := "Hola,\r\n\r\nPor favor verifica tu cuenta de ONE Internet haciendo clic en el siguiente enlace:\r\n\r\nGracias.\r\n"
	mensaje.WriteString(textPlain)
	mensaje.WriteString("\r\n")

	// Parte 2: HTML con imágenes (multipart/related)
	boundaryRel := "----=_Part_Rel_" + generateBoundary()
	mensaje.WriteString(fmt.Sprintf("--%s\r\n", boundaryAlt))
	mensaje.WriteString(fmt.Sprintf("Content-Type: multipart/related; boundary=\"%s\"\r\n", boundaryRel))
	mensaje.WriteString("\r\n")

	// HTML
	mensaje.WriteString(fmt.Sprintf("--%s\r\n", boundaryRel))
	mensaje.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	mensaje.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
	mensaje.WriteString("\r\n")
	mensaje.WriteString(encodeQuotedPrintable(htmlBody))
	mensaje.WriteString("\r\n")

	// Imagen logo claro
	if logoLight != "" {
		mensaje.WriteString(fmt.Sprintf("--%s\r\n", boundaryRel))
		mensaje.WriteString("Content-Type: image/png\r\n")
		mensaje.WriteString("Content-Transfer-Encoding: base64\r\n")
		mensaje.WriteString("Content-ID: <logo-light>\r\n")
		mensaje.WriteString("Content-Disposition: inline\r\n")
		mensaje.WriteString("\r\n")
		mensaje.WriteString(logoLight)
		mensaje.WriteString("\r\n")
	}

	// Imagen logo oscuro
	if logoDark != "" {
		mensaje.WriteString(fmt.Sprintf("--%s\r\n", boundaryRel))
		mensaje.WriteString("Content-Type: image/png\r\n")
		mensaje.WriteString("Content-Transfer-Encoding: base64\r\n")
		mensaje.WriteString("Content-ID: <logo-dark>\r\n")
		mensaje.WriteString("Content-Disposition: inline\r\n")
		mensaje.WriteString("\r\n")
		mensaje.WriteString(logoDark)
		mensaje.WriteString("\r\n")
	}

	// Cierre multipart/related
	mensaje.WriteString(fmt.Sprintf("--%s--\r\n", boundaryRel))

	// Cierre multipart/alternative
	mensaje.WriteString(fmt.Sprintf("--%s--\r\n", boundaryAlt))

	return mensaje.Bytes()
}

func (s *ServicioCorreo) renderTemplateFromPath(data EmailData, templatePath string) (string, error) {
	// Leer el archivo de plantilla
	tmplContent, err := os.ReadFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("error leyendo plantilla %s: %w", templatePath, err)
	}

	// Parsear y ejecutar plantilla
	tmpl, err := template.New("email").Parse(string(tmplContent))
	if err != nil {
		return "", fmt.Errorf("error parseando plantilla: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("error ejecutando plantilla: %w", err)
	}

	return buf.String(), nil
}

func (s *ServicioCorreo) readImageAsBase64(path string) (string, error) {
	// Verificar si el archivo existe
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", fmt.Errorf("archivo no encontrado: %s", path)
	}

	// Leer imagen
	imageData, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("error leyendo imagen: %w", err)
	}

	// Codificar en base64 y dividir en líneas de 76 caracteres (estándar MIME)
	encoded := base64.StdEncoding.EncodeToString(imageData)
	var result strings.Builder
	for i := 0; i < len(encoded); i += 76 {
		end := i + 76
		if end > len(encoded) {
			end = len(encoded)
		}
		result.WriteString(encoded[i:end])
		result.WriteString("\r\n")
	}

	return result.String(), nil
}

func encodeQuotedPrintable(s string) string {
	var buf bytes.Buffer
	w := quotedprintable.NewWriter(&buf)
	w.Write([]byte(s))
	w.Close()
	return buf.String()
}

func generateBoundary() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func extractNameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) > 0 {
		return parts[0]
	}
	return "Usuario"
}
// EnviarEmailHTML envía un correo HTML directamente (sin plantilla)
func (s *ServicioCorreo) EnviarEmailHTML(destinatario, asunto, htmlBody string) error {
auth := smtp.PlainAuth("", s.Usuario, s.Password, s.Host)

// Leer imágenes
logoLight, err := s.readImageAsBase64(s.LogoLightPath)
if err != nil {
logoLight = ""
}

logoDark, err := s.readImageAsBase64(s.LogoDarkPath)
if err != nil {
logoDark = ""
}

// Construir mensaje MIME
mensaje := s.construirMensajeMIME(destinatario, asunto, htmlBody, logoLight, logoDark)

addr := fmt.Sprintf("%s:%s", s.Host, s.Port)

err = smtp.SendMail(addr, auth, s.FromEmail, []string{destinatario}, mensaje)
if err != nil {
return fmt.Errorf("error enviando email: %w", err)
}

fmt.Printf("✅ Correo HTML enviado exitosamente a %s\n", destinatario)
return nil
}
