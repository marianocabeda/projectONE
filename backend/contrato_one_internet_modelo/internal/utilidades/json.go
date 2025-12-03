package utilidades

import (
	"encoding/json"
	"os"
)

// LeerJSON lee un archivo JSON de manera eficiente usando streams
func LeerJSON(path string, target interface{}) error {
	// 1. Abrir el archivo (no lo lee todavía)
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	// Aseguramos que el archivo se cierre al terminar la función
	defer file.Close()

	// 2. Decodificar directamente desde el archivo
	return json.NewDecoder(file).Decode(target)
}