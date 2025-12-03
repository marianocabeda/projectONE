package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"contrato_one_internet_controlador/internal/servicios"
	"contrato_one_internet_controlador/internal/utilidades"

	"github.com/gorilla/mux"
)

type ContratoFirmaHandlerC struct {
	modeloClient  *servicios.ModeloClient
	correoService *servicios.ServicioCorreo
}

func NewContratoFirmaHandlerC(modeloClient *servicios.ModeloClient, correoService *servicios.ServicioCorreo) *ContratoFirmaHandlerC {
	return &ContratoFirmaHandlerC{
		modeloClient:  modeloClient,
		correoService: correoService,
	}
}

// SimularPago llama al modelo y envía el email con el token
func (h *ContratoFirmaHandlerC) SimularPago(w http.ResponseWriter, r *http.Request) {
	fmt.Println("DEBUG: SimularPago handler llamado")
	fmt.Printf("DEBUG: Method=%s Path=%s\n", r.Method, r.URL.Path)
	
	vars := mux.Vars(r)
	fmt.Printf("DEBUG: mux.Vars = %+v\n", vars)
	
	idPersonaStr := vars["id_persona"]
	idContratoStr := vars["id_contrato"]
	
	fmt.Printf("DEBUG: idPersonaStr=%s idContratoStr=%s\n", idPersonaStr, idContratoStr)

	// Validar que sean números
	_, err := strconv.Atoi(idPersonaStr)
	if err != nil {
		fmt.Printf("DEBUG: Error validando idPersona: %v\n", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de persona inválido")
		return
	}

	_, err = strconv.Atoi(idContratoStr)
	if err != nil {
		fmt.Printf("DEBUG: Error validando idContrato: %v\n", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato inválido")
		return
	}
	
	fmt.Println("DEBUG: IDs validados, llamando a modeloClient.SimularPago...")

	// Llamar al modelo para iniciar el proceso (enviamos strings)
	resp, err := h.modeloClient.SimularPago(r.Context(), idPersonaStr, idContratoStr)
	if err != nil {
		fmt.Printf("DEBUG: Error en SimularPago: %v\n", err)
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error al simular pago: "+err.Error())
		}
		return
	}

	fmt.Println("DEBUG: Respuesta del modelo recibida")
	fmt.Printf("DEBUG: resp = %+v\n", resp)

	// El modelo devuelve los campos directamente
	token := utilidades.ToString(resp["token"])
	email := utilidades.ToString(resp["email_destinatario"])
	nombreCompleto := utilidades.ToString(resp["nombre_completo"])
	idContratoFirma := resp["id_contrato_firma"]

	// El token siempre se genera con 24 horas de validez
	expirationHours := 24

	// Enviar email con el token usando la plantilla
	err = h.correoService.EnviarTokenFirma(email, token, nombreCompleto, expirationHours)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error enviando email: "+err.Error())
		return
	}

	// Marcar token_enviado en el modelo (no bloquear el flujo si falla)
	idCFStr := utilidades.ToString(idContratoFirma)
	if err := h.modeloClient.MarcarTokenEnviado(r.Context(), idCFStr); err != nil {
		fmt.Printf("WARN: no se pudo marcar token_enviado en modelo para %s: %v\n", idCFStr, err)
	}

	// Construir respuesta para el frontend
	response := map[string]interface{}{
		"mensaje":           "Se ha enviado un token de firma a su correo electrónico",
		"id_contrato_firma": idContratoFirma,
		"token":             token, // Para testing, en producción no enviar
	}

	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// GuardarFirma recibe la firma en canvas y la envía al modelo
func (h *ContratoFirmaHandlerC) GuardarFirma(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("DEBUG GuardarFirma: Method=%s Path=%s\n", r.Method, r.URL.Path)
	vars := mux.Vars(r)
	fmt.Printf("DEBUG GuardarFirma: vars=%+v\n", vars)
	idStr := vars["id"]
	fmt.Printf("DEBUG GuardarFirma: idStr='%s'\n", idStr)

	// Validar que sea número
	_, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Printf("DEBUG GuardarFirma: Error en Atoi: %v\n", err)
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato firma inválido")
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	// Obtener IP y User-Agent del request
	body["ip_firma"] = r.RemoteAddr
	body["user_agent"] = r.UserAgent()

	// Llamar al modelo (enviamos string)
	resp, err := h.modeloClient.GuardarFirma(r.Context(), idStr, body)
	if err != nil {
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error al guardar firma: "+err.Error())
		}
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ValidarToken valida el token y genera el PDF firmado
func (h *ContratoFirmaHandlerC) ValidarToken(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Validar que sea número
	_, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato firma inválido")
		return
	}

	var body map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "Cuerpo de solicitud inválido")
		return
	}

	// Llamar al modelo (enviamos string)
	resp, err := h.modeloClient.ValidarToken(r.Context(), idStr, body)
	if err != nil {
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error al validar token: "+err.Error())
		}
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ObtenerContrato obtiene el estado del contrato firma
func (h *ContratoFirmaHandlerC) ObtenerContrato(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Validar que sea número
	_, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato firma inválido")
		return
	}

	// Llamar al modelo (enviamos string)
	resp, err := h.modeloClient.ObtenerContratoFirma(r.Context(), idStr)
	if err != nil {
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error al obtener contrato: "+err.Error())
		}
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, resp)
}

// ServirPDF sirve el PDF del contrato (firmado o original según estado)
func (h *ContratoFirmaHandlerC) ServirPDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Validar que sea número
	_, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato firma inválido")
		return
	}

	// Llamar al modelo usando el método del cliente
	resp, err := h.modeloClient.ServirPDF(r.Context(), idStr)
	if err != nil {
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error obteniendo PDF: "+err.Error())
		}
		return
	}
	defer resp.Body.Close()

	// Copiar headers del PDF
	w.Header().Set("Content-Type", "application/pdf")
	if contentDisposition := resp.Header.Get("Content-Disposition"); contentDisposition != "" {
		w.Header().Set("Content-Disposition", contentDisposition)
	}

	// Copiar el contenido del PDF
	io.Copy(w, resp.Body)
}

// ReenviarToken regenera el token y reenvía el email
func (h *ContratoFirmaHandlerC) ReenviarToken(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Validar que sea número
	_, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato firma inválido")
		return
	}

	// Llamar al modelo para regenerar token
	resp, err := h.modeloClient.ReenviarToken(r.Context(), idStr)
	if err != nil {
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error reenviando token: "+err.Error())
		}
		return
	}

	// Extraer datos de la respuesta
	token := utilidades.ToString(resp["token"])
	email := utilidades.ToString(resp["email_destinatario"])
	nombreCompleto := utilidades.ToString(resp["nombre_completo"])
	idContratoFirma := resp["id_contrato_firma"]

	// El token siempre se regenera con 24 horas de validez
	expirationHours := 24

	// Enviar email con el nuevo token
	err = h.correoService.EnviarTokenFirma(email, token, nombreCompleto, expirationHours)
	if err != nil {
		utilidades.ResponderError(w, http.StatusInternalServerError, "Error enviando email: "+err.Error())
		return
	}

	// Marcar token_enviado en el modelo
	idCFStr := utilidades.ToString(idContratoFirma)
	if err := h.modeloClient.MarcarTokenEnviado(r.Context(), idCFStr); err != nil {
		fmt.Printf("WARN: no se pudo marcar token_enviado en modelo para %s: %v\n", idCFStr, err)
	}

	// Respuesta exitosa
	response := map[string]interface{}{
		"mensaje":           "Token regenerado y enviado exitosamente",
		"id_contrato_firma": idContratoFirma,
		"token":             token, // Para testing, en producción no enviar
	}

	utilidades.ResponderJSON(w, http.StatusOK, response)
}
// DescargarPDF descarga el PDF del contrato con disposition attachment
func (h *ContratoFirmaHandlerC) DescargarPDF(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Validar que sea número
	_, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "ID de contrato firma inválido")
		return
	}

	// Llamar al modelo usando el método del cliente
	resp, err := h.modeloClient.DescargarPDF(r.Context(), idStr)
	if err != nil {
		if modeloErr, ok := err.(*servicios.ModeloError); ok {
			utilidades.ResponderError(w, modeloErr.StatusCode, modeloErr.Message)
		} else {
			utilidades.ResponderError(w, http.StatusInternalServerError, "Error descargando PDF: "+err.Error())
		}
		return
	}
	defer resp.Body.Close()

	// Copiar headers del PDF
	w.Header().Set("Content-Type", "application/pdf")
	if contentDisposition := resp.Header.Get("Content-Disposition"); contentDisposition != "" {
		w.Header().Set("Content-Disposition", contentDisposition)
	}

	// Copiar el contenido del PDF
	io.Copy(w, resp.Body)
}
