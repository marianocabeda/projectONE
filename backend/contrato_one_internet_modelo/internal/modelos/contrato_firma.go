package modelos

import "time"

// ContratoFirma representa el registro del proceso de firma digital de un contrato
type ContratoFirma struct {
	IDContratoFirma  int        `json:"id_contrato_firma"`
	IDContrato       int        `json:"id_contrato"`
	PdfOriginalPath  string     `json:"pdf_original_path"`
	PdfFirmadoPath   *string    `json:"pdf_firmado_path,omitempty"`
	FirmaPath        *string    `json:"firma_path,omitempty"`
	HashOriginal     string     `json:"hash_original"`
	HashFirmado      *string    `json:"hash_firmado,omitempty"`
	MetodoFirma      string     `json:"metodo_firma"`
	TokenFirma       string     `json:"-"` // No exponemos el token en JSON
	TokenExpira      time.Time  `json:"token_expira"`
	IntentosToken    int        `json:"intentos_token"`
	PdfGenerado      *time.Time `json:"pdf_generado,omitempty"`
	TokenEnviado     *time.Time `json:"token_enviado,omitempty"`
	Firmado          bool       `json:"firmado"`
	FechaFirma       *time.Time `json:"fecha_firma,omitempty"`
	IpFirma          *string    `json:"ip_firma,omitempty"`
	UserAgent        *string    `json:"user_agent,omitempty"`
}
