package auth

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"contrato_one_internet_controlador/internal/config"
	"contrato_one_internet_controlador/internal/utilidades"
)

// VerificarEmail maneja la verificación del email usando el token proporcionado.
func (h *AuthHandler) VerificarEmail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	token := r.URL.Query().Get("token")
	if token == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "token requerido para verificación de email")
		return
	}

	// Llamar al servicio para verificar el email
	err := h.authService.VerificarEmail(ctx, token)

	cfg := config.GetConfig()
	frontend := strings.TrimSuffix(cfg.FrontendURL, "/")
	status := "error"

	if err == nil {
		status = "success"
	} else {
		// Log para depuración
		fmt.Printf("[DEBUG] Error recibido: %v\n", err)
		fmt.Printf("[DEBUG] Error.Error(): %s\n", err.Error())
		
		errMsg := strings.ToLower(err.Error())
		fmt.Printf("[DEBUG] errMsg lowercase: %s\n", errMsg)
		
		switch {
		case strings.Contains(errMsg, "inválido"):
			status = "invalid"
		case strings.Contains(errMsg, "expirado"):
			status = "expired"
		case strings.Contains(errMsg, "usado"):
			status = "used"
		case strings.Contains(errMsg, "verificado"):
			status = "already-verified"
		}
	}

	redirectURL := fmt.Sprintf("%s/verificar-email?status=%s", frontend, url.QueryEscape(status))
	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}

/*

func (h *VerificarEmailHandler) VerificarEmail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

    // Se obtiene el token de verificación del query param
    token := r.URL.Query().Get("token")
    if token == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "token es requerido")
        return
    }

    // Se llama al servicio para procesar el token
    err := h.VerificarEmailService.VerificarEmail(ctx, token)

	cfg := config.GetConfig()
	frontend := strings.TrimSuffix(cfg.FrontendURL, "/")

	status := "error"
	switch {
	case err == nil:
		status = "success"
	case strings.Contains(strings.ToLower(err.Error()), "inválido"):
		status = "invalid"
	case strings.Contains(strings.ToLower(err.Error()), "expirado"):
		status = "expired"
	case strings.Contains(strings.ToLower(err.Error()), "usado"):
		status = "used"
	case strings.Contains(strings.ToLower(err.Error()), "ya ha sido verificado"):
		status = "already-verified"
	default:
		status = "error"
	}
	// Construir URL de redirección al front-end con el status
	redirectURL := fmt.Sprintf("%s?status=%s", frontend, url.QueryEscape(status))
	http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}
*/

/*
	// Si hay error, mapear a código y mensaje
	var statusCode int
	var userMsg string

	if err != nil {
		if strings.Contains(err.Error(), "token inválido") {
			statusCode = http.StatusBadRequest
			userMsg = err.Error()
		} else if strings.Contains(err.Error(), "token expirado") {
			statusCode = http.StatusGone
			userMsg = err.Error()
		} else {
			statusCode = http.StatusInternalServerError
			userMsg = "Error interno del servidor"
		}

		// Si el cliente esperaba HTML o solicita redirección, se redirige a página amigable
		if wantsHTML(r) || r.URL.Query().Get("redirect") == "true" {
			// Pasar mensaje en query (escaped)
			redirectURL := "/v1/email-verificado?status=error&msg=" + url.QueryEscape(userMsg)
			http.Redirect(w, r, redirectURL, http.StatusSeeOther)
			return
		}

		utilidades.ResponderError(w, statusCode, userMsg)
		return
	}

	// Si todo bien
	cfg := config.GetConfig()
	if wantsHTML(r) || r.URL.Query().Get("redirect") == "true" {
		// Si hay FrontendURL configurado, se redirige al front-end con params.
		if cfg.FrontendURL != "" {
			u := cfg.FrontendURL
			u = strings.TrimSuffix(u, "/")
			//redirectURL := u + "/login?status=success"
			redirectURL := u + "/contratos/src/views/pages/auth/verify-email.html"
			http.Redirect(w, r, redirectURL, http.StatusSeeOther)
			return
		}
		http.Redirect(w, r, "/v1/auth/verificar-email", http.StatusSeeOther)
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Email verificado correctamente"})
}

// wantsHTML determina si el request indica que el cliente prefiere HTML
func wantsHTML(r *http.Request) bool {
	accept := r.Header.Get("Accept")
	return strings.Contains(accept, "text/html")
}

// EmailVerificadoPage muestra una página simple con el resultado de la verificación
func EmailVerificadoPage(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	msg := r.URL.Query().Get("msg")
	if msg == "" {
		if status == "success" {
			msg = "Tu correo ha sido verificado correctamente."
		} else {
			msg = "Ocurrió un error validando el correo."
		}
	}

	// Si hay FrontendURL configurado, se prefiere redirigir al front con los params
	cfg := config.GetConfig()
	if cfg.FrontendURL != "" {
		// Construir URL del front con query params status y msg apuntando al login
		u := cfg.FrontendURL
		u = strings.TrimSuffix(u, "/")
		redirectURL := u + "/login?status=" + url.QueryEscape(status) + "&msg=" + url.QueryEscape(msg)
		http.Redirect(w, r, redirectURL, http.StatusSeeOther)
		return
	}

	// Plantilla HTML mínima
	const tpl = `<!doctype html>
	<html>
		<head><meta charset="utf-8"><title>Verificación de Email</title></head>
		<body>
			<h1>{{.Title}}</h1>
			<p>{{.Message}}</p>
		</body>
	</html>`

	t, _ := template.New("email").Parse(tpl)
	data := struct {
		Title   string
		Message string
	}{}
	if status == "success" {
		data.Title = "Verificación exitosa"
	} else {
		data.Title = "Verificación fallida"
	}
	data.Message = msg

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = t.Execute(w, data)
}*/
