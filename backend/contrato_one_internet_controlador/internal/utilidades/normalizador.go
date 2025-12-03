package utilidades

import (
	"regexp"
	"sort"
	"strings"
	"unicode"

	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// Mapa de abreviaturas para normalización de calles
var dict = map[string]string{
	"AVENIDA": "AV",
	"AV.":     "AV",
	"AVDA":    "AV",
	"CALLE":   "CALLE",
	"C.":      "CALLE",
	"PASAJE":  "PJE",
	"PAS":     "PJE",
	"PJE.":    "PJE",
	"MANZANA": "MZ",
	"RUTA":    "RUTA",
}

// removeAccents elimina acentos y diacríticos
func removeAccents(s string) string {
	t := transform.Chain(
		norm.NFD,
		transform.RemoveFunc(func(r rune) bool { return unicode.Is(unicode.Mn, r) }),
		norm.NFC,
	)
	result, _, _ := transform.String(t, s)
	return result
}

// normalizeSpaces reduce múltiples espacios a uno solo
func normalizeSpaces(s string) string {
	re := regexp.MustCompile(`\s+`)
	return re.ReplaceAllString(strings.TrimSpace(s), " ")
}

// NormalizeCalle estandariza y limpia la calle
func NormalizeCalle(calle string) string {
	if calle == "" {
		return ""
	}

	// 1) pasar a mayúsculas
	s := strings.ToUpper(calle)

	// 2) normalizar/elimnar puntuación que rompe los match de palabras
	//    reemplazamos puntos, comas, puntos y comas, dos puntos, y barras por espacios
	s = strings.ReplaceAll(s, ".", " ")
	s = strings.ReplaceAll(s, ",", " ")
	s = strings.ReplaceAll(s, ";", " ")
	s = strings.ReplaceAll(s, ":", " ")
	s = strings.ReplaceAll(s, "/", " ")

	// 3) quitar acentos y reducir espacios
	s = removeAccents(s)
	s = normalizeSpaces(s)

	// 4) aplicar reemplazos por abreviaturas (ordenados por longitud para evitar colisiones)
	keys := make([]string, 0, len(dict))
	for k := range dict {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool { return len(keys[i]) > len(keys[j]) })

	for _, k := range keys {
		v := dict[k]
		re := regexp.MustCompile(`\b` + regexp.QuoteMeta(k) + `\b`)
		s = re.ReplaceAllString(s, v)
	}

	// 5) normalizar espacios finales y devolver
	s = normalizeSpaces(s)
	return s
}

// NormalizeNumero limpia y estandariza el número de dirección
func NormalizeNumero(n string) string {
	s := strings.ToUpper(strings.TrimSpace(n))
	// Permitimos números, letras, guion y barra
	re := regexp.MustCompile(`[^A-Z0-9/-]`)
	s = re.ReplaceAllString(s, "")
	return s
}

// NormalizeCodigoPostal limpia el código postal
func NormalizeCodigoPostal(cp string) string {
	s := strings.ToUpper(strings.TrimSpace(cp))
	re := regexp.MustCompile(`[^A-Z0-9]`)
	s = re.ReplaceAllString(s, "")
	return s
}

// NormalizeOptionalField limpia campos opcionales como piso o depto
func NormalizeOptionalField(s *string) *string {
	if s == nil {
		return nil
	}
	val := strings.ToUpper(strings.TrimSpace(*s))
	if val == "" {
		return nil
	}
	val = removeAccents(val)
	return &val
}
