package contrato_firma

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"time"

	"contrato_one_internet_modelo/internal/servicios"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"

	"github.com/gorilla/mux"
)

type Handler struct {
	db                   *sql.DB
	firmaDigitalService  *servicios.FirmaDigitalService
}

func NewHandler(db *sql.DB, firmaDigitalService *servicios.FirmaDigitalService) *Handler {
	return &Handler{
		db:                  db,
		firmaDigitalService: firmaDigitalService,
	}
}

// SimularPago simula el pago de instalación e inicia el proceso de firma
func (h *Handler) SimularPago(w http.ResponseWriter, r *http.Request) {
	logger.Info.Printf("DEBUG MODELO: SimularPago llamado - Method=%s Path=%s", r.Method, r.URL.Path)
	ctx := r.Context()
	vars := mux.Vars(r)
	logger.Info.Printf("DEBUG MODELO: mux.Vars = %+v", vars)

	// 1. Obtener parámetros
	idPersonaStr := vars["id_persona"]
	idContratoStr := vars["id_contrato"]

	idPersona, err := strconv.Atoi(idPersonaStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_persona inválido")
		return
	}

	idContrato, err := strconv.Atoi(idContratoStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato inválido")
		return
	}

	// 2. Validar que persona existe y obtener email y nombre
	var email, nombre, apellido string
	err = h.db.QueryRowContext(ctx, "SELECT email, nombre, apellido FROM persona WHERE id_persona = ?", idPersona).Scan(&email, &nombre, &apellido)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utilidades.ResponderError(w, http.StatusNotFound, "persona no encontrada")
			return
		}
		logger.Error.Printf("Error consultando persona: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, utilidades.ErrInterno.Error())
		return
	}

	nombreCompleto := nombre + " " + apellido

	// 3. Validar que contrato existe y pertenece a la persona
	var contratoPersonaID int
	err = h.db.QueryRowContext(ctx, "SELECT id_persona FROM contrato WHERE id_contrato = ? AND borrado IS NULL", idContrato).Scan(&contratoPersonaID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato no encontrado")
			return
		}
		logger.Error.Printf("Error consultando contrato: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, utilidades.ErrInterno.Error())
		return
	}

	if contratoPersonaID != idPersona {
		utilidades.ResponderError(w, http.StatusForbidden, "el contrato no pertenece a esta persona")
		return
	}

	// 4. Iniciar proceso de firma (genera PDF, token)
	contratoFirma, err := h.firmaDigitalService.IniciarProcesoFirma(ctx, idContrato)
	if err != nil {
		if errors.Is(err, utilidades.ErrDuplicado) {
			utilidades.ResponderError(w, http.StatusConflict, "ya existe un proceso de firma activo para este contrato")
			return
		}
		logger.Error.Printf("Error iniciando proceso de firma: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error generando contrato")
		return
	}

	// 5. Preparar respuesta
	response := map[string]interface{}{
		"id_contrato_firma": contratoFirma.IDContratoFirma,
		"token":             contratoFirma.TokenFirma, // Para que controlador envíe por email
		"token_expira":      contratoFirma.TokenExpira.Format("2006-01-02 15:04:05"),
		"email_destinatario": email,
		"nombre_completo":    nombreCompleto,
		"pdf_generado":      contratoFirma.PdfGenerado != nil,
	}

	logger.Info.Printf("Proceso de firma iniciado para contrato %d (persona %d)", idContrato, idPersona)
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// GuardarFirma guarda la firma en canvas
func (h *Handler) GuardarFirma(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idContratoFirmaStr := vars["id"]
	idContratoFirma, err := strconv.Atoi(idContratoFirmaStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	var req struct {
		FirmaBase64 string `json:"firma_base64"`
		IpFirma     string `json:"ip_firma"`
		UserAgent   string `json:"user_agent"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.FirmaBase64 == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "firma_base64 es requerido")
		return
	}

	// Usar IP y User-Agent del request original (enviados por el controlador)
	// Si no vienen en el body, usar los del request actual (llamadas directas al modelo)
	ip := req.IpFirma
	if ip == "" {
		ip = r.RemoteAddr
	}
	userAgent := req.UserAgent
	if userAgent == "" {
		userAgent = r.UserAgent()
	}

	// Guardar firma
	if err := h.firmaDigitalService.GuardarFirmaCanvas(ctx, idContratoFirma, req.FirmaBase64, ip, userAgent); err != nil {
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato_firma no encontrado")
			return
		}
		logger.Error.Printf("Error guardando firma: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "firma guardada correctamente",
	})
}

// ValidarToken valida el token y genera el PDF firmado
func (h *Handler) ValidarToken(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idContratoFirmaStr := vars["id"]
	idContratoFirma, err := strconv.Atoi(idContratoFirmaStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	var req struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if req.Token == "" {
		utilidades.ResponderError(w, http.StatusBadRequest, "token es requerido")
		return
	}

	// Validar token y firmar
	if err := h.firmaDigitalService.ValidarTokenYFirmar(ctx, idContratoFirma, req.Token); err != nil {
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato_firma no encontrado")
			return
		}
		if errors.Is(err, utilidades.ErrTokenInvalido) {
			utilidades.ResponderError(w, http.StatusBadRequest, "token inválido")
			return
		}
		if errors.Is(err, utilidades.ErrTokenExpirado) {
			utilidades.ResponderError(w, http.StatusBadRequest, "token expirado")
			return
		}
		logger.Error.Printf("Error validando token: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{
		"mensaje": "contrato firmado exitosamente",
	})
}

// ObtenerContrato obtiene el estado actual del proceso de firma
func (h *Handler) ObtenerContrato(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idContratoFirmaStr := vars["id"]
	idContratoFirma, err := strconv.Atoi(idContratoFirmaStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	contratoFirma, err := h.firmaDigitalService.ObtenerContratoFirma(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato_firma no encontrado")
			return
		}
		logger.Error.Printf("Error obteniendo contrato_firma: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, utilidades.ErrInterno.Error())
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, contratoFirma)
}

// MarcarTokenEnviado marca la fecha/hora en que se envió el token al destinatario
func (h *Handler) MarcarTokenEnviado(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	cfRepo := repositorios.NewContratoFirmaRepo(h.db)
	if err := cfRepo.MarcarTokenEnviado(ctx, id, time.Now()); err != nil {
		logger.Error.Printf("Error marcando token_enviado para contrato_firma %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error actualizando token_enviado")
		return
	}

	utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "token marcado como enviado"})
}

// ReenviarToken regenera el token y lo retorna para que el controlador lo envíe por email
func (h *Handler) ReenviarToken(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	// Regenerar token con validaciones
	cf, err := h.firmaDigitalService.ReenviarToken(ctx, id)
	if err != nil {
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato_firma no encontrado")
			return
		}
		logger.Error.Printf("Error reenviando token para contrato_firma %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Obtener email y nombre de la persona
	var email, nombre, apellido string
	query := `
		SELECT p.email, p.nombre, p.apellido
		FROM contrato_firma cf
		INNER JOIN contrato c ON cf.id_contrato = c.id_contrato
		INNER JOIN persona p ON c.id_persona = p.id_persona
		WHERE cf.id_contrato_firma = ?
	`
	err = h.db.QueryRowContext(ctx, query, id).Scan(&email, &nombre, &apellido)
	if err != nil {
		logger.Error.Printf("Error obteniendo datos de persona para contrato_firma %d: %v", id, err)
		utilidades.ResponderError(w, http.StatusInternalServerError, "error obteniendo datos del destinatario")
		return
	}

	nombreCompleto := nombre + " " + apellido

	// Preparar respuesta para el controlador
	response := map[string]interface{}{
		"id_contrato_firma":  cf.IDContratoFirma,
		"token":              cf.TokenFirma,
		"token_expira":       cf.TokenExpira.Format("2006-01-02 15:04:05"),
		"email_destinatario": email,
		"nombre_completo":    nombreCompleto,
	}

	logger.Info.Printf("Token reenviado para contrato_firma %d", id)
	utilidades.ResponderJSON(w, http.StatusOK, response)
}

// ServirPDF sirve el PDF apropiado (firmado si existe, original si no)
func (h *Handler) ServirPDF(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idContratoFirmaStr := vars["id"]
	idContratoFirma, err := strconv.Atoi(idContratoFirmaStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	// Obtener info del contrato
	contratoFirma, err := h.firmaDigitalService.ObtenerContratoFirma(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato_firma no encontrado")
			return
		}
		logger.Error.Printf("Error obteniendo contrato_firma: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, utilidades.ErrInterno.Error())
		return
	}

	var pdfPath string
	var filename string

	// Si está firmado y existe el PDF firmado, servir ese
	if contratoFirma.Firmado && contratoFirma.PdfFirmadoPath != nil && *contratoFirma.PdfFirmadoPath != "" {
		pdfPath = *contratoFirma.PdfFirmadoPath
		filename = "contrato_firmado_" + idContratoFirmaStr + ".pdf"
	} else if contratoFirma.PdfOriginalPath != "" {
		// Si no está firmado o no hay PDF firmado, servir el original
		pdfPath = contratoFirma.PdfOriginalPath
		filename = "contrato_" + idContratoFirmaStr + ".pdf"
	} else {
		utilidades.ResponderError(w, http.StatusNotFound, "PDF no disponible")
		return
	}

	// Servir el archivo PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "inline; filename="+filename)
	http.ServeFile(w, r, pdfPath)
}

// DescargarPDF descarga el PDF apropiado (firmado si existe, original si no)
func (h *Handler) DescargarPDF(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	idContratoFirmaStr := vars["id"]
	idContratoFirma, err := strconv.Atoi(idContratoFirmaStr)
	if err != nil {
		utilidades.ResponderError(w, http.StatusBadRequest, "id_contrato_firma inválido")
		return
	}

	// Obtener info del contrato
	contratoFirma, err := h.firmaDigitalService.ObtenerContratoFirma(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, utilidades.ErrNoEncontrado) {
			utilidades.ResponderError(w, http.StatusNotFound, "contrato_firma no encontrado")
			return
		}
		logger.Error.Printf("Error obteniendo contrato_firma para descarga: %v", err)
		utilidades.ResponderError(w, http.StatusInternalServerError, utilidades.ErrInterno.Error())
		return
	}

	var pdfPath string
	var filename string

	// Si está firmado y existe el PDF firmado, descargar ese
	if contratoFirma.Firmado && contratoFirma.PdfFirmadoPath != nil && *contratoFirma.PdfFirmadoPath != "" {
		pdfPath = *contratoFirma.PdfFirmadoPath
		filename = "contrato_firmado_" + idContratoFirmaStr + ".pdf"
	} else if contratoFirma.PdfOriginalPath != "" {
		// Si no está firmado o no hay PDF firmado, descargar el original
		pdfPath = contratoFirma.PdfOriginalPath
		filename = "contrato_" + idContratoFirmaStr + ".pdf"
	} else {
		utilidades.ResponderError(w, http.StatusNotFound, "PDF no disponible")
		return
	}

	// Verificar que el archivo existe
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		logger.Error.Printf("Archivo PDF no encontrado: %s", pdfPath)
		utilidades.ResponderError(w, http.StatusInternalServerError, "Archivo no encontrado")
		return
	}

	// Descargar el archivo PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	http.ServeFile(w, r, pdfPath)
}
