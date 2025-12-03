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




/*package utilidades

import (
	"encoding/json"
	"net/http"
)

// ResponderJSON envía una respuesta JSON estándar.
func ResponderJSON(w http.ResponseWriter, status int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(response)
}

// ResponderError envía una respuesta de error JSON estándar.
func ResponderError(w http.ResponseWriter, status int, message string) {
	ResponderJSON(w, status, map[string]string{"error": message})
}*/