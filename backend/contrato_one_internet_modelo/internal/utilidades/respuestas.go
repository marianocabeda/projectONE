package utilidades

import (
	"encoding/json"
	"net/http"
)

// ResponderJSON envía una respuesta JSON estándar.
func ResponderJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	response, err := json.Marshal(payload)
	if err != nil {
		http.Error(w, "Error interno al generar la respuesta", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(status)
	w.Write(response)
}


// ResponderError envía una respuesta de error JSON estándar.
func ResponderError(w http.ResponseWriter, status int, message string) {
	ResponderJSON(w, status, map[string]string{"error": message})
}