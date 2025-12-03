package repositorios

import (
	"context"
	"database/sql"
	"time"

	"contrato_one_internet_modelo/internal/modelos"
)

type ContratoFirmaRepo struct {
	db *sql.DB
}

func NewContratoFirmaRepo(db *sql.DB) *ContratoFirmaRepo {
	return &ContratoFirmaRepo{db: db}
}

// Crear crea un nuevo registro de contrato_firma
func (r *ContratoFirmaRepo) Crear(ctx context.Context, cf *modelos.ContratoFirma) (int64, error) {
	query := `
		INSERT INTO contrato_firma (
			id_contrato, pdf_original_path, hash_original, metodo_firma,
			token_firma, token_expira, pdf_generado, token_enviado
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(ctx, query,
		cf.IDContrato,
		cf.PdfOriginalPath,
		cf.HashOriginal,
		cf.MetodoFirma,
		cf.TokenFirma,
		cf.TokenExpira,
		cf.PdfGenerado,
		cf.TokenEnviado,
	)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// ObtenerPorID obtiene un contrato_firma por su ID
func (r *ContratoFirmaRepo) ObtenerPorID(ctx context.Context, id int) (*modelos.ContratoFirma, error) {
	query := `
		SELECT 
			id_contrato_firma, id_contrato, pdf_original_path, pdf_firmado_path,
			firma_path, hash_original, hash_firmado, metodo_firma, token_firma,
			token_expira, intentos_token, pdf_generado, token_enviado, firmado,
			fecha_firma, ip_firma, user_agent
		FROM contrato_firma
		WHERE id_contrato_firma = ?
	`

	cf := &modelos.ContratoFirma{}
	var pdfFirmado, firmaPath, hashFirmado sql.NullString
	var pdfGenerado, tokenEnviado, fechaFirma sql.NullTime
	var ipFirma, userAgent sql.NullString
	var firmadoInt int

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&cf.IDContratoFirma,
		&cf.IDContrato,
		&cf.PdfOriginalPath,
		&pdfFirmado,
		&firmaPath,
		&cf.HashOriginal,
		&hashFirmado,
		&cf.MetodoFirma,
		&cf.TokenFirma,
		&cf.TokenExpira,
		&cf.IntentosToken,
		&pdfGenerado,
		&tokenEnviado,
		&firmadoInt,
		&fechaFirma,
		&ipFirma,
		&userAgent,
	)

	if err != nil {
		return nil, err
	}

	// Convertir tipos nullable
	if pdfFirmado.Valid {
		cf.PdfFirmadoPath = &pdfFirmado.String
	}
	if firmaPath.Valid {
		cf.FirmaPath = &firmaPath.String
	}
	if hashFirmado.Valid {
		cf.HashFirmado = &hashFirmado.String
	}
	if pdfGenerado.Valid {
		cf.PdfGenerado = &pdfGenerado.Time
	}
	if tokenEnviado.Valid {
		cf.TokenEnviado = &tokenEnviado.Time
	}
	if fechaFirma.Valid {
		cf.FechaFirma = &fechaFirma.Time
	}
	if ipFirma.Valid {
		cf.IpFirma = &ipFirma.String
	}
	if userAgent.Valid {
		cf.UserAgent = &userAgent.String
	}
	cf.Firmado = firmadoInt == 1

	return cf, nil
}

// ObtenerPorIDContrato obtiene el contrato_firma activo de un contrato (no firmado o reciente)
func (r *ContratoFirmaRepo) ObtenerPorIDContrato(ctx context.Context, idContrato int) (*modelos.ContratoFirma, error) {
	query := `
		SELECT 
			id_contrato_firma, id_contrato, pdf_original_path, pdf_firmado_path,
			firma_path, hash_original, hash_firmado, metodo_firma, token_firma,
			token_expira, intentos_token, pdf_generado, token_enviado, firmado,
			fecha_firma, ip_firma, user_agent
		FROM contrato_firma
		WHERE id_contrato = ?
		ORDER BY id_contrato_firma DESC
		LIMIT 1
	`

	cf := &modelos.ContratoFirma{}
	var pdfFirmado, firmaPath, hashFirmado sql.NullString
	var pdfGenerado, tokenEnviado, fechaFirma sql.NullTime
	var ipFirma, userAgent sql.NullString
	var firmadoInt int

	err := r.db.QueryRowContext(ctx, query, idContrato).Scan(
		&cf.IDContratoFirma,
		&cf.IDContrato,
		&cf.PdfOriginalPath,
		&pdfFirmado,
		&firmaPath,
		&cf.HashOriginal,
		&hashFirmado,
		&cf.MetodoFirma,
		&cf.TokenFirma,
		&cf.TokenExpira,
		&cf.IntentosToken,
		&pdfGenerado,
		&tokenEnviado,
		&firmadoInt,
		&fechaFirma,
		&ipFirma,
		&userAgent,
	)

	if err != nil {
		return nil, err
	}

	// Convertir tipos nullable
	if pdfFirmado.Valid {
		cf.PdfFirmadoPath = &pdfFirmado.String
	}
	if firmaPath.Valid {
		cf.FirmaPath = &firmaPath.String
	}
	if hashFirmado.Valid {
		cf.HashFirmado = &hashFirmado.String
	}
	if pdfGenerado.Valid {
		cf.PdfGenerado = &pdfGenerado.Time
	}
	if tokenEnviado.Valid {
		cf.TokenEnviado = &tokenEnviado.Time
	}
	if fechaFirma.Valid {
		cf.FechaFirma = &fechaFirma.Time
	}
	if ipFirma.Valid {
		cf.IpFirma = &ipFirma.String
	}
	if userAgent.Valid {
		cf.UserAgent = &userAgent.String
	}
	cf.Firmado = firmadoInt == 1

	return cf, nil
}

// ActualizarFirmaCanvas guarda la ruta de la firma canvas y metadata
func (r *ContratoFirmaRepo) ActualizarFirmaCanvas(ctx context.Context, id int, firmaPath, ip, userAgent string) error {
	query := `
		UPDATE contrato_firma
		SET firma_path = ?, ip_firma = ?, user_agent = ?
		WHERE id_contrato_firma = ?
	`

	_, err := r.db.ExecContext(ctx, query, firmaPath, ip, userAgent, id)
	return err
}

// IncrementarIntentos incrementa el contador de intentos de token
func (r *ContratoFirmaRepo) IncrementarIntentos(ctx context.Context, id int) error {
	query := `UPDATE contrato_firma SET intentos_token = intentos_token + 1 WHERE id_contrato_firma = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// MarcarComoFirmado marca el contrato como firmado y guarda el PDF firmado
func (r *ContratoFirmaRepo) MarcarComoFirmado(ctx context.Context, id int, pdfFirmadoPath, hashFirmado string) error {
	query := `
		UPDATE contrato_firma
		SET 
			pdf_firmado_path = ?,
			hash_firmado = ?,
			firmado = 1,
			fecha_firma = ?
		WHERE id_contrato_firma = ?
	`

	_, err := r.db.ExecContext(ctx, query, pdfFirmadoPath, hashFirmado, time.Now(), id)
	return err
}

// MarcarTokenEnviado actualiza la columna token_enviado con la fecha/hora proporcionada
func (r *ContratoFirmaRepo) MarcarTokenEnviado(ctx context.Context, id int, t time.Time) error {
	query := `
		UPDATE contrato_firma
		SET token_enviado = ?
		WHERE id_contrato_firma = ?
	`

	_, err := r.db.ExecContext(ctx, query, t, id)
	return err
}
