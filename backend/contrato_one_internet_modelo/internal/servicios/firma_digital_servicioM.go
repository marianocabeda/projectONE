package servicios

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

const (
	TokenLength        = 6
	TokenExpiracionHrs = 24
	MaxIntentosToken   = 3
)

type FirmaDigitalService struct {
	db               *sql.DB
	pdfService       *PDFService
	contractBasePath string
}

func NewFirmaDigitalService(db *sql.DB, pdfService *PDFService, contractBasePath string) *FirmaDigitalService {
	return &FirmaDigitalService{
		db:               db,
		pdfService:       pdfService,
		contractBasePath: contractBasePath,
	}
}

// IniciarProcesoFirma crea el registro de contrato_firma y genera PDF
// Retorna el contrato_firma con el token para que el controlador envíe el email
func (s *FirmaDigitalService) IniciarProcesoFirma(ctx context.Context, idContrato int) (*modelos.ContratoFirma, error) {
	// 1. Validar que no exista un proceso activo
	cfRepo := repositorios.NewContratoFirmaRepo(s.db)
	existente, err := cfRepo.ObtenerPorIDContrato(ctx, idContrato)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("error verificando contrato_firma existente: %w", err)
	}

	if existente != nil && !existente.Firmado {
		logger.Warn.Printf("Ya existe un proceso de firma activo para contrato %d", idContrato)
		return nil, utilidades.ErrDuplicado
	}

	// 2. Generar PDF original
	pdfPath, hashOriginal, err := s.pdfService.GenerarPDFOriginal(ctx, idContrato)
	if err != nil {
		return nil, fmt.Errorf("error generando PDF original: %w", err)
	}

	// 3. Generar token de firma
	token := generarToken(TokenLength)
	tokenExpira := time.Now().Add(TokenExpiracionHrs * time.Hour)

	// 4. Obtener id_persona del contrato para la notificación
	var idPersona int
	err = s.db.QueryRowContext(ctx, "SELECT id_persona FROM contrato WHERE id_contrato = ?", idContrato).Scan(&idPersona)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo persona del contrato: %w", err)
	}

	// 5. Crear registro contrato_firma
	ahora := time.Now()
	cf := &modelos.ContratoFirma{
		IDContrato:      idContrato,
		PdfOriginalPath: pdfPath,
		HashOriginal:    hashOriginal,
		MetodoFirma:     "canvas+token",
		TokenFirma:      token,
		TokenExpira:     tokenExpira,
		PdfGenerado:     &ahora,
	}

	idContratoFirma, err := cfRepo.Crear(ctx, cf)
	if err != nil {
		return nil, fmt.Errorf("error creando contrato_firma: %w", err)
	}
	cf.IDContratoFirma = int(idContratoFirma)

	// 6. Crear notificación para el cliente
	notifRepo := repositorios.NewNotificacionRepo(s.db)
	rolCliente := "CLIENTE"
	err = notifRepo.CrearNotificacion(
		ctx,
		idPersona,
		"CONTRATO",
		"Token de firma enviado",
		fmt.Sprintf("Se ha generado tu contrato. Revisá tu correo electrónico para obtener el token de firma digital. El token expira en %d horas.", TokenExpiracionHrs),
		&rolCliente,
		nil,
		&idContrato,
		nil,
		nil,
	)
	if err != nil {
		logger.Error.Printf("Error creando notificación de token enviado: %v", err)
		// No retornar error, continuar el flujo
	}

	logger.Info.Printf("Proceso de firma iniciado para contrato %d (contrato_firma %d)", idContrato, cf.IDContratoFirma)
	return cf, nil
}

// GuardarFirmaCanvas guarda la imagen de la firma en formato base64
func (s *FirmaDigitalService) GuardarFirmaCanvas(ctx context.Context, idContratoFirma int, firmaBase64, ip, userAgent string) error {
	cfRepo := repositorios.NewContratoFirmaRepo(s.db)

	// 1. Validar que existe
	cf, err := cfRepo.ObtenerPorID(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNoEncontrado
		}
		return err
	}

	// 2. Validar que no esté firmado
	if cf.Firmado {
		return errors.New("el contrato ya fue firmado")
	}

	// 3. Limpiar base64 (remover prefijo data:image/png;base64,)
	logger.Info.Printf("DEBUG: firmaBase64 original length=%d", len(firmaBase64))
	firmaBase64 = strings.TrimPrefix(firmaBase64, "data:image/png;base64,")
	logger.Info.Printf("DEBUG: firmaBase64 después de TrimPrefix length=%d", len(firmaBase64))
	
	// Remover espacios y saltos de línea
	firmaBase64 = strings.ReplaceAll(firmaBase64, " ", "")
	firmaBase64 = strings.ReplaceAll(firmaBase64, "\n", "")
	firmaBase64 = strings.ReplaceAll(firmaBase64, "\r", "")
	logger.Info.Printf("DEBUG: firmaBase64 después de limpiar length=%d", len(firmaBase64))
	
	// Agregar padding si es necesario
	if mod := len(firmaBase64) % 4; mod != 0 {
		firmaBase64 += strings.Repeat("=", 4-mod)
		logger.Info.Printf("DEBUG: Se agregó padding, nueva length=%d", len(firmaBase64))
	}

	// 4. Decodificar y guardar imagen
	firmaBytes, err := base64.StdEncoding.DecodeString(firmaBase64)
	if err != nil {
		return fmt.Errorf("firma base64 inválida: %w", err)
	}

	firmaPath := filepath.Join(s.contractBasePath, "firma_img", fmt.Sprintf("%d.png", idContratoFirma))
	if err := os.MkdirAll(filepath.Dir(firmaPath), 0755); err != nil {
		return fmt.Errorf("error creando directorio de firma: %w", err)
	}

	if err := os.WriteFile(firmaPath, firmaBytes, 0644); err != nil {
		return fmt.Errorf("error guardando imagen de firma: %w", err)
	}

	// 5. Actualizar registro
	if err := cfRepo.ActualizarFirmaCanvas(ctx, idContratoFirma, firmaPath, ip, userAgent); err != nil {
		return fmt.Errorf("error actualizando contrato_firma: %w", err)
	}

	// 6. Obtener id_persona del contrato para la notificación
	var idPersona int
	err = s.db.QueryRowContext(ctx, "SELECT id_persona FROM contrato WHERE id_contrato = ?", cf.IDContrato).Scan(&idPersona)
	if err == nil {
		notifRepo := repositorios.NewNotificacionRepo(s.db)
		rolCliente := "CLIENTE"
		err = notifRepo.CrearNotificacion(
			ctx,
			idPersona,
			"CONTRATO",
			"Firma guardada",
			"Tu firma digital ha sido guardada correctamente. Ahora ingresá el token que recibiste por email para completar el proceso.",
			&rolCliente,
			nil,
			&cf.IDContrato,
			nil,
			nil,
		)
		if err != nil {
			logger.Error.Printf("Error creando notificación de firma guardada: %v", err)
		}
	}

	logger.Info.Printf("Firma canvas guardada para contrato_firma %d", idContratoFirma)
	return nil
}

// ValidarTokenYFirmar valida el token y genera el PDF firmado
func (s *FirmaDigitalService) ValidarTokenYFirmar(ctx context.Context, idContratoFirma int, tokenIngresado string) error {
	cfRepo := repositorios.NewContratoFirmaRepo(s.db)

	// 1. Obtener contrato_firma
	cf, err := cfRepo.ObtenerPorID(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return utilidades.ErrNoEncontrado
		}
		return err
	}

	// 2. Validaciones previas
	if cf.Firmado {
		return errors.New("el contrato ya fue firmado")
	}

	if cf.FirmaPath == nil || *cf.FirmaPath == "" {
		return errors.New("debe cargar la firma antes de validar el token")
	}

	if cf.IntentosToken >= MaxIntentosToken {
		return errors.New("excediste el máximo de intentos. Solicitá un nuevo token desde la opción 'Reenviar token'")
	}

	// 3. Validar token (primero verificar si es correcto)
	if cf.TokenFirma != tokenIngresado {
		// Incrementar intentos
		if err := cfRepo.IncrementarIntentos(ctx, idContratoFirma); err != nil {
			logger.Error.Printf("Error incrementando intentos: %v", err)
		}
		return utilidades.ErrTokenInvalido
	}

	// 4. Si el token es correcto, verificar expiración
	if time.Now().After(cf.TokenExpira) {
		return utilidades.ErrTokenExpirado
	}

	// 4. Leer firma para embeber en PDF
	firmaBytes, err := os.ReadFile(*cf.FirmaPath)
	if err != nil {
		return fmt.Errorf("error leyendo firma: %w", err)
	}
	firmaBase64 := base64.StdEncoding.EncodeToString(firmaBytes)

	// 5. Generar PDF firmado
	pdfFirmadoPath, hashFirmado, err := s.pdfService.GenerarPDFConFirma(ctx, idContratoFirma, "data:image/png;base64,"+firmaBase64)
	if err != nil {
		return fmt.Errorf("error generando PDF firmado: %w", err)
	}

	// 6. Marcar como firmado
	if err := cfRepo.MarcarComoFirmado(ctx, idContratoFirma, pdfFirmadoPath, hashFirmado); err != nil {
		return fmt.Errorf("error marcando contrato como firmado: %w", err)
	}

	// 7. Actualizar estado del contrato a "Vigente" (id_estado_contrato = 3)
	contratoRepo := repositorios.NewContratoRepo(s.db)
	if err := contratoRepo.ActualizarEstado(ctx, cf.IDContrato, 3); err != nil {
		logger.Error.Printf("Error actualizando estado de contrato a Vigente: %v", err)
		// No retornamos error, el contrato ya se firmó
	}

	// 8. Obtener id_conexion y actualizar estado a "Por configurar" (id_estado_conexion = 7)
	idConexion, err := contratoRepo.ObtenerIDConexionPorContrato(ctx, cf.IDContrato)
	if err != nil {
		logger.Error.Printf("Error obteniendo id_conexion del contrato: %v", err)
	} else {
		conexionRepo := repositorios.NewConexionRepo(s.db)
		if err := conexionRepo.ActualizarEstado(ctx, idConexion, 7); err != nil {
			logger.Error.Printf("Error actualizando estado de conexión a Por configurar: %v", err)
		}
	}

	// 9. Crear notificación de contrato firmado (para cliente)
	var idPersona int
	err = s.db.QueryRowContext(ctx, "SELECT id_persona FROM contrato WHERE id_contrato = ?", cf.IDContrato).Scan(&idPersona)
	if err == nil {
		notifRepo := repositorios.NewNotificacionRepo(s.db)
		rolCliente := "CLIENTE"
		err = notifRepo.CrearNotificacion(
			ctx,
			idPersona,
			"CONTRATO",
			"¡Contrato firmado exitosamente!",
			"Tu contrato ha sido firmado digitalmente y ahora está vigente. En breve un técnico se pondrá en contacto para configurar tu conexión.",
			&rolCliente,
			nil,
			&cf.IDContrato,
			nil,
			nil,
		)
		if err != nil {
			logger.Error.Printf("Error creando notificación de contrato firmado: %v", err)
		}
	}

	// 10. Crear notificación para técnicos (rol 'TECNICO')
	notifRepo := repositorios.NewNotificacionRepo(s.db)
	err = notifRepo.CrearNotificacionParaRol(
		ctx,
		"TECNICO",
		"INSTALACION",
		"Nuevo contrato firmado - Configuración pendiente",
		fmt.Sprintf("El contrato #%d ha sido firmado y está listo para configuración de conexión.", cf.IDContrato),
		&idConexion,
		&cf.IDContrato,
		nil,
		nil,
	)
	if err != nil {
		logger.Error.Printf("Error creando notificación para técnicos: %v", err)
	}

	logger.Info.Printf("Contrato %d firmado exitosamente (contrato_firma %d)", cf.IDContrato, idContratoFirma)
	return nil
}

// ObtenerContratoFirma obtiene un contrato_firma por ID
func (s *FirmaDigitalService) ObtenerContratoFirma(ctx context.Context, idContratoFirma int) (*modelos.ContratoFirma, error) {
	cfRepo := repositorios.NewContratoFirmaRepo(s.db)
	cf, err := cfRepo.ObtenerPorID(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, utilidades.ErrNoEncontrado
		}
		return nil, err
	}
	return cf, nil
}

// ReenviarToken regenera el token y actualiza la fecha de expiración para un contrato_firma
// Valida que el contrato no esté firmado, que el token haya expirado o esté próximo a expirar
func (s *FirmaDigitalService) ReenviarToken(ctx context.Context, idContratoFirma int) (*modelos.ContratoFirma, error) {
	cfRepo := repositorios.NewContratoFirmaRepo(s.db)

	// 1. Obtener contrato_firma
	cf, err := cfRepo.ObtenerPorID(ctx, idContratoFirma)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, utilidades.ErrNoEncontrado
		}
		return nil, err
	}

	// 2. Validar que no esté firmado
	if cf.Firmado {
		return nil, errors.New("el contrato ya fue firmado, no se puede reenviar token")
	}

	// 3. Validar que el token haya expirado O se hayan excedido los intentos
	tokenExpirado := time.Now().After(cf.TokenExpira)
	intentosExcedidos := cf.IntentosToken >= MaxIntentosToken

	if !tokenExpirado && !intentosExcedidos {
		tiempoRestante := time.Until(cf.TokenExpira)
		return nil, fmt.Errorf("el token aún es válido por %.0f horas y tenés %d intentos disponibles. No es necesario reenviar", tiempoRestante.Hours(), MaxIntentosToken-cf.IntentosToken)
	}

	// Log del motivo del reenvío
	if tokenExpirado {
		logger.Info.Printf("Regenerando token para contrato_firma %d: token expirado", idContratoFirma)
	} else if intentosExcedidos {
		logger.Info.Printf("Regenerando token para contrato_firma %d: intentos excedidos (%d/%d)", idContratoFirma, cf.IntentosToken, MaxIntentosToken)
	}

	// 4. Generar nuevo token y nueva fecha de expiración
	nuevoToken := generarToken(TokenLength)
	nuevaExpiracion := time.Now().Add(TokenExpiracionHrs * time.Hour)

	// 5. Actualizar en base de datos
	query := `
		UPDATE contrato_firma
		SET token_firma = ?,
		    token_expira = ?,
		    intentos_token = 0,
		    token_enviado = NULL
		WHERE id_contrato_firma = ?
	`

	_, err = s.db.ExecContext(ctx, query, nuevoToken, nuevaExpiracion, idContratoFirma)
	if err != nil {
		return nil, fmt.Errorf("error actualizando token: %w", err)
	}

	// 6. Actualizar objeto y retornar
	cf.TokenFirma = nuevoToken
	cf.TokenExpira = nuevaExpiracion
	cf.IntentosToken = 0
	cf.TokenEnviado = nil

	// 7. Crear notificación de token reenviado
	var idPersona int
	err = s.db.QueryRowContext(ctx, "SELECT id_persona FROM contrato WHERE id_contrato = ?", cf.IDContrato).Scan(&idPersona)
	if err == nil {
		notifRepo := repositorios.NewNotificacionRepo(s.db)
		rolCliente := "CLIENTE"
		err = notifRepo.CrearNotificacion(
			ctx,
			idPersona,
			"CONTRATO",
			"Nuevo token de firma enviado",
			fmt.Sprintf("Se ha generado un nuevo token de firma para tu contrato. Revisá tu correo electrónico. El token expira en %d horas.", TokenExpiracionHrs),
			&rolCliente,
			nil,
			&cf.IDContrato,
			nil,
			nil,
		)
		if err != nil {
			logger.Error.Printf("Error creando notificación de token reenviado: %v", err)
		}
	}

	logger.Info.Printf("Token regenerado para contrato_firma %d (contrato %d)", idContratoFirma, cf.IDContrato)
	return cf, nil
}

// generarToken genera un token aleatorio alfanumérico
func generarToken(length int) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		// Fallback en caso de error
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}

	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}
