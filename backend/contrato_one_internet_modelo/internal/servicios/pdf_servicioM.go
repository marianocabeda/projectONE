package servicios

import (
	"bytes"
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"html/template"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

type PDFService struct {
	db               *sql.DB
	templatePath     string
	contractBasePath string
}

func NewPDFService(db *sql.DB, templatePath, contractBasePath string) *PDFService {
	return &PDFService{
		db:               db,
		templatePath:     templatePath,
		contractBasePath: contractBasePath,
	}
}

// DatosContrato estructura para pasar datos a la plantilla
type DatosContrato struct {
	// Persona
	NombreCompleto string
	DNI            string
	CUIL           string
	Email          string
	Telefono       string
	FechaNacimiento string // Nuevo
	CondicionIVA    string // Nuevo
	OtraDenominacion string // Nuevo (vacío si no aplica)

	// Dirección
	Calle          string
	Numero         string
	Piso           string
	Departamento   string
	CodigoPostal   string
	Localidad      string
	Provincia      string
	Pais           string
	
	// Domicilio Instalación (desde direccion de conexion)
	DomInstalacionCalle     string
	DomInstalacionNumero    string
	DomInstalacionPiso      string
	DomInstalacionCP        string
	DomInstalacionLocalidad string
	
	// Domicilio Legal (desde direccion de persona - mismo que instalación si coincide)
	DomLegalCalle     string
	DomLegalNumero    string
	DomLegalPiso      string
	DomLegalCP        string
	DomLegalLocalidad string

	// Contrato
	NumeroContrato     string
	FechaInicio        string
	CostoInstalacion   string
	CostoAlta          string // Nuevo (mismo que costo_instalacion)
	NombrePlan         string
	PlanNombre         string // Alias
	VelocidadMbps      string
	PlanVelocidad      string // Alias para template
	PrecioPlan         string
	PrecioMensual      string // Alias
	NumeroCuenta       string // Nuevo

	// Empresa
	NombreEmpresa string
	CUITEmpresa   string

	// Firma (para PDF firmado)
	FirmaSrcURL    template.URL
	FirmaImagenPath string
	MostrarFirma   bool
	FechaFirma     string
	
	// Fecha de generación del contrato
	FechaGeneracion string
}

// GenerarPDFOriginal genera el PDF original del contrato sin firma
func (s *PDFService) GenerarPDFOriginal(ctx context.Context, idContrato int) (pdfPath, hashSHA256 string, err error) {
	// 1. Obtener datos del contrato
	datos, err := s.obtenerDatosContrato(ctx, idContrato)
	if err != nil {
		logger.Error.Printf("Error obteniendo datos del contrato %d: %v", idContrato, err)
		return "", "", fmt.Errorf("error obteniendo datos del contrato: %w", err)
	}

	datos.MostrarFirma = false

	// 2. Generar HTML desde plantilla
	htmlContent, err := s.renderizarPlantilla(datos)
	if err != nil {
		logger.Error.Printf("Error renderizando plantilla: %v", err)
		return "", "", fmt.Errorf("error renderizando plantilla: %w", err)
	}

	// 3. Convertir HTML a PDF
	pdfPath = filepath.Join(s.contractBasePath, "original", fmt.Sprintf("%d.pdf", idContrato))
	if err := s.htmlToPDF(htmlContent, pdfPath); err != nil {
		logger.Error.Printf("Error generando PDF: %v", err)
		return "", "", fmt.Errorf("error generando PDF: %w", err)
	}

	// 4. Calcular hash SHA-256
	hashSHA256, err = s.calcularHashArchivo(pdfPath)
	if err != nil {
		logger.Error.Printf("Error calculando hash: %v", err)
		return "", "", fmt.Errorf("error calculando hash: %w", err)
	}

	logger.Info.Printf("PDF original generado: %s (hash: %s)", pdfPath, hashSHA256)
	return pdfPath, hashSHA256, nil
}

// GenerarPDFConFirma genera el PDF final con la firma embebida
func (s *PDFService) GenerarPDFConFirma(ctx context.Context, idContratoFirma int, firmaBase64 string) (pdfPath, hashSHA256 string, err error) {
	// 1. Obtener contrato_firma
	cfRepo := repositorios.NewContratoFirmaRepo(s.db)
	cf, err := cfRepo.ObtenerPorID(ctx, idContratoFirma)
	if err != nil {
		return "", "", fmt.Errorf("error obteniendo contrato_firma: %w", err)
	}

	// 2. Obtener datos del contrato
	datos, err := s.obtenerDatosContrato(ctx, cf.IDContrato)
	if err != nil {
		return "", "", fmt.Errorf("error obteniendo datos del contrato: %w", err)
	}

	// 3. Agregar firma y fecha
	datos.MostrarFirma = true
	// Copiar firma a ubicación accesible para wkhtmltopdf
	if cf.FirmaPath != nil && *cf.FirmaPath != "" {
		// Copiar firma al directorio firmado con nombre temporal
		firmaTempPath := filepath.Join(s.contractBasePath, "firmado", fmt.Sprintf("%d_firma.png", idContratoFirma))
		firmaBytes, err := os.ReadFile(*cf.FirmaPath)
		if err == nil {
			if err := os.WriteFile(firmaTempPath, firmaBytes, 0644); err == nil {
				// Usar ruta absoluta para wkhtmltopdf
				datos.FirmaSrcURL = template.URL(firmaTempPath)
			} else {
				logger.Error.Printf("ERROR: No se pudo copiar la firma: %v", err)
			}
		} else {
			logger.Error.Printf("ERROR: No se pudo leer la firma: %v", err)
		}
	}
	if cf.FechaFirma != nil {
		datos.FechaFirma = cf.FechaFirma.Format("02/01/2006 15:04")
	}

	// 4. Generar HTML con firma
	htmlContent, err := s.renderizarPlantilla(datos)
	if err != nil {
		return "", "", fmt.Errorf("error renderizando plantilla con firma: %w", err)
	}

	// 5. Convertir HTML a PDF
	pdfPath = filepath.Join(s.contractBasePath, "firmado", fmt.Sprintf("%d.pdf", idContratoFirma))
	if err := s.htmlToPDF(htmlContent, pdfPath); err != nil {
		return "", "", fmt.Errorf("error generando PDF firmado: %w", err)
	}

	// Limpiar archivos temporales
	firmaTempPath := filepath.Join(s.contractBasePath, "firmado", fmt.Sprintf("%d_firma.png", idContratoFirma))
	os.Remove(firmaTempPath)
	htmlTempPath := filepath.Join(s.contractBasePath, "firmado", fmt.Sprintf("%d.html", idContratoFirma))
	os.Remove(htmlTempPath)

	// 6. Calcular hash
	hashSHA256, err = s.calcularHashArchivo(pdfPath)
	if err != nil {
		return "", "", fmt.Errorf("error calculando hash del PDF firmado: %w", err)
	}

	logger.Info.Printf("PDF firmado generado: %s (hash: %s)", pdfPath, hashSHA256)
	return pdfPath, hashSHA256, nil
}

// obtenerDatosContrato consulta todos los datos necesarios para el contrato
func (s *PDFService) obtenerDatosContrato(ctx context.Context, idContrato int) (*DatosContrato, error) {
	query := `
		SELECT 
			p.nombre, p.apellido, p.dni, p.cuil, p.email, p.telefono, p.fecha_nacimiento,
			d_persona.calle AS persona_calle, d_persona.numero AS persona_numero, 
			d_persona.piso AS persona_piso, d_persona.depto AS persona_depto, 
			d_persona.codigo_postal AS persona_cp,
			dist_persona.nombre AS persona_distrito,
			dept_persona.nombre AS persona_departamento,
			prov_persona.nombre AS persona_provincia,
			d_conexion.calle AS conexion_calle, d_conexion.numero AS conexion_numero,
			d_conexion.piso AS conexion_piso, d_conexion.depto AS conexion_depto,
			d_conexion.codigo_postal AS conexion_cp,
			dist_conexion.nombre AS conexion_distrito,
			dept_conexion.nombre AS conexion_departamento,
			prov_conexion.nombre AS conexion_provincia,
			c.id_contrato, c.fecha_inicio, c.costo_instalacion,
			pl.nombre AS plan_nombre, pl.velocidad_mbps, pl.precio,
			e.razon_social AS empresa_nombre, e.cuit AS empresa_cuit
		FROM contrato c
		INNER JOIN persona p ON c.id_persona = p.id_persona
		LEFT JOIN direccion d_persona ON p.id_direccion = d_persona.id_direccion
		LEFT JOIN distrito dist_persona ON d_persona.id_distrito = dist_persona.id_distrito
		LEFT JOIN departamento dept_persona ON dist_persona.id_departamento = dept_persona.id_departamento
		LEFT JOIN provincia prov_persona ON dept_persona.id_provincia = prov_persona.id_provincia
		INNER JOIN conexion cn ON c.id_conexion = cn.id_conexion
		INNER JOIN direccion d_conexion ON cn.id_direccion = d_conexion.id_direccion
		INNER JOIN distrito dist_conexion ON d_conexion.id_distrito = dist_conexion.id_distrito
		INNER JOIN departamento dept_conexion ON dist_conexion.id_departamento = dept_conexion.id_departamento
		INNER JOIN provincia prov_conexion ON dept_conexion.id_provincia = prov_conexion.id_provincia
		INNER JOIN plan pl ON c.id_plan = pl.id_plan
		INNER JOIN empresa e ON c.id_empresa = e.id_empresa
		WHERE c.id_contrato = ?
	`

	datos := &DatosContrato{}
	var nombre, apellido string
	var cuil sql.NullString
	var fechaNacimiento sql.NullTime
	var personaPiso, personaDepto, personaCalle, personaNumero, personaCP sql.NullString
	var personaDistrito, personaDepartamento, personaProvincia sql.NullString
	var conexionPiso, conexionDepto sql.NullString
	var costoInstalacion sql.NullFloat64
	var conexionCalle, conexionNumero, conexionCP, conexionDistrito, conexionDepartamento, conexionProvincia string

	err := s.db.QueryRowContext(ctx, query, idContrato).Scan(
		&nombre, &apellido, &datos.DNI, &cuil, &datos.Email, &datos.Telefono, &fechaNacimiento,
		&personaCalle, &personaNumero, &personaPiso, &personaDepto, &personaCP,
		&personaDistrito, &personaDepartamento, &personaProvincia,
		&conexionCalle, &conexionNumero, &conexionPiso, &conexionDepto, &conexionCP,
		&conexionDistrito, &conexionDepartamento, &conexionProvincia,
		&datos.NumeroContrato, &datos.FechaInicio, &costoInstalacion,
		&datos.NombrePlan, &datos.VelocidadMbps, &datos.PrecioPlan,
		&datos.NombreEmpresa, &datos.CUITEmpresa,
	)

	if err != nil {
		return nil, err
	}

	// Construir nombre completo
	datos.NombreCompleto = nombre + " " + apellido
	
	// CUIL (puede ser NULL)
	if cuil.Valid {
		datos.CUIL = cuil.String
	}
	
	// Fecha de nacimiento
	if fechaNacimiento.Valid {
		datos.FechaNacimiento = fechaNacimiento.Time.Format("02/01/2006")
	}
	
	// Domicilio legal (de persona) - poner 0 si no tiene piso/depto
	if personaCalle.Valid {
		datos.DomLegalCalle = personaCalle.String
	}
	if personaNumero.Valid {
		datos.DomLegalNumero = personaNumero.String
	}
	if personaPiso.Valid && personaPiso.String != "" {
		datos.DomLegalPiso = personaPiso.String
	} else {
		datos.DomLegalPiso = "0"
	}
	if personaCP.Valid {
		datos.DomLegalCP = personaCP.String
	}
	if personaDistrito.Valid {
		datos.DomLegalLocalidad = personaDistrito.String
	}
	if personaProvincia.Valid {
		datos.Provincia = personaProvincia.String
	}
	
	// Domicilio de prestación de servicio (de conexión) - poner 0 si no tiene piso/depto
	datos.DomInstalacionCalle = conexionCalle
	datos.DomInstalacionNumero = conexionNumero
	if conexionPiso.Valid && conexionPiso.String != "" {
		datos.DomInstalacionPiso = conexionPiso.String
	} else {
		datos.DomInstalacionPiso = "0"
	}
	datos.DomInstalacionCP = conexionCP
	datos.DomInstalacionLocalidad = conexionDistrito
	
	// Datos generales de ubicación
	datos.Localidad = conexionDistrito
	datos.Pais = "Argentina"
	
	// Campos legacy (mantener por compatibilidad)
	datos.Calle = conexionCalle
	datos.Numero = conexionNumero
	datos.CodigoPostal = conexionCP
	if conexionPiso.Valid {
		datos.Piso = conexionPiso.String
	}
	if conexionDepto.Valid {
		datos.Departamento = conexionDepto.String
	}
	
	if costoInstalacion.Valid {
		datos.CostoInstalacion = fmt.Sprintf("%.2f", costoInstalacion.Float64)
		datos.CostoAlta = datos.CostoInstalacion // Alias
	}

	// Aliases para compatibilidad con template
	datos.PlanNombre = datos.NombrePlan
	datos.PlanVelocidad = datos.VelocidadMbps + " Mbps"
	datos.PrecioMensual = datos.PrecioPlan
	
	// Campos adicionales
	datos.CondicionIVA = "Consumidor Final" // Por defecto
	datos.OtraDenominacion = "" // Vacío si no aplica
	
	// Generar número de cuenta con año actual (ej: 2025-55)
	yearActual := time.Now().Year()
	datos.NumeroCuenta = fmt.Sprintf("%d-%d", yearActual, idContrato)

	// Formatear fecha
	fechaInicio, _ := time.Parse("2006-01-02", datos.FechaInicio)
	datos.FechaInicio = fechaInicio.Format("02/01/2006")

	datos.NumeroContrato = fmt.Sprintf("%d", idContrato)
	
	// Generar fecha actual en español
	datos.FechaGeneracion = generarFechaEspanol(time.Now())

	return datos, nil
}

// renderizarPlantilla procesa la plantilla HTML con los datos
func (s *PDFService) renderizarPlantilla(datos *DatosContrato) (string, error) {
	tmpl, err := template.ParseFiles(s.templatePath)
	if err != nil {
		return "", fmt.Errorf("error parseando plantilla %s: %w", s.templatePath, err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, datos); err != nil {
		return "", fmt.Errorf("error ejecutando plantilla: %w", err)
	}

	return buf.String(), nil
}

// generarFechaEspanol convierte una fecha a formato español legible
func generarFechaEspanol(t time.Time) string {
	meses := []string{
		"enero", "febrero", "marzo", "abril", "mayo", "junio",
		"julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
	}
	
	dia := t.Day()
	mes := meses[t.Month()-1]
	anio := t.Year()
	
	return fmt.Sprintf("%d de %s de %d", dia, mes, anio)
}

// htmlToPDF convierte HTML a PDF usando wkhtmltopdf
func (s *PDFService) htmlToPDF(htmlContent, outputPath string) error {
	// Crear directorio si no existe
	dir := filepath.Dir(outputPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("error creando directorio %s: %w", dir, err)
	}

	// Crear archivo temporal para el HTML
	tmpHTML, err := os.CreateTemp("", "contract-*.html")
	if err != nil {
		return fmt.Errorf("error creando archivo temporal: %w", err)
	}
	defer os.Remove(tmpHTML.Name())

	if _, err := tmpHTML.WriteString(htmlContent); err != nil {
		return fmt.Errorf("error escribiendo HTML temporal: %w", err)
	}
	tmpHTML.Close()

	// Ejecutar wkhtmltopdf
	cmd := exec.Command("wkhtmltopdf",
		"--enable-local-file-access",
		"--page-size", "A4",
		"--margin-top", "10mm",
		"--margin-bottom", "10mm",
		"--margin-left", "15mm",
		"--margin-right", "15mm",
		tmpHTML.Name(),
		outputPath,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("error ejecutando wkhtmltopdf: %w (stderr: %s)", err, stderr.String())
	}

	return nil
}

// calcularHashArchivo calcula el SHA-256 de un archivo
func (s *PDFService) calcularHashArchivo(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}
