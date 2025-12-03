package utilidades

import (
    "strconv"
    "strings"
    "errors"
    "regexp"
	"fmt"
    "math"
)

func ParsePrecio(input string) (float64, error) {
    input = strings.TrimSpace(input)

    // eliminar separadores de miles "."
    input = strings.ReplaceAll(input, ".", "")

    // reemplazar separador decimal "," por "."
    input = strings.ReplaceAll(input, ",", ".")

    return strconv.ParseFloat(input, 64)
}

func ParsePrecioArgentino(input string) (float64, error) {
    input = strings.TrimSpace(input)
    if input == "" {
        return 0, errors.New("el precio no puede estar vacío")
    }

    regex := `^(\d{1,3}(\.\d{3})*|\d+)(,\d{1,2})?$`
    matched, _ := regexp.MatchString(regex, input)
    if !matched {
        return 0, errors.New("el precio debe estar en formato argentino: 13.750,99")
    }

    // Quitar separadores de miles
    input = strings.ReplaceAll(input, ".", "")
    // Reemplazar coma decimal por punto
    input = strings.ReplaceAll(input, ",", ".")

    precio, err := strconv.ParseFloat(input, 64)
    if err != nil {
        return 0, errors.New("precio inválido")
    }

    // Multiplicar por 1 si queremos asegurarnos que 17.500,00 → 17500
    precio = precio * 1

    return precio, nil
}


func FormatearPrecioAR(precio float64) string {
    // Redondear a 2 decimales
    precio = math.Round(precio*100) / 100

    // Separar parte entera y decimal
    enteros := int64(precio)
    decimales := int(math.Round((precio - float64(enteros)) * 100))

    // Formatear parte entera con separador de miles
    enteroStr := formatMiles(enteros)

    // Si los decimales son cero, solo devolver enteros
    if decimales == 0 {
        return enteroStr
    }

    // Mostrar siempre dos dígitos decimales
    decimalStr := fmt.Sprintf("%02d", decimales)

    return enteroStr + "," + decimalStr
}


// formatMiles agrega puntos como separador de miles
func formatMiles(n int64) string {
    s := fmt.Sprintf("%d", n)
    var res []string
    for len(s) > 3 {
        res = append([]string{s[len(s)-3:]}, res...)
        s = s[:len(s)-3]
    }
    if len(s) > 0 {
        res = append([]string{s}, res...)
    }
    return strings.Join(res, ".")
}