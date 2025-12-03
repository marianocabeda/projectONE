package utilidades

import (
	"encoding/json"
	"net/http"
)

// APIResponse define el formato estándar de todas las respuestas
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ResponderJSON envía una respuesta de éxito
func ResponderJSON(w http.ResponseWriter, status int, data interface{}) {
	response := APIResponse{
		Success: true,
		Data:    data,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}

// ResponderError envía una respuesta de error
func ResponderError(w http.ResponseWriter, status int, message string) {
	response := APIResponse{
		Success: false,
		Error:   message,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(response)
}