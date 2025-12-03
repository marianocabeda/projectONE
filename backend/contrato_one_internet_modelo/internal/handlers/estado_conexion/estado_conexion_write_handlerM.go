package estado_conexion

import (
    "encoding/json"
    "net/http"
    "strconv"
    "strings"

    "github.com/gorilla/mux"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
    "contrato_one_internet_modelo/internal/utilidades/logger"
)

type EstadoConexionWriteHandler struct {
    service *servicios.EstadoConexionService
}

func NewWriteHandler(s *servicios.EstadoConexionService) *EstadoConexionWriteHandler { return &EstadoConexionWriteHandler{service: s} }

// POST /api/v1/internal/estados-conexion
func (h *EstadoConexionWriteHandler) CrearEstadoConexionHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req struct{
        Nombre string `json:"nombre"`
        Descripcion *string `json:"descripcion"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.Nombre)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio"); return }
    id, err := h.service.Crear(ctx, nombre, req.Descripcion)
    if err != nil {
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un estado de conexión con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' debe tener entre 3 y 50 caracteres"); return }
        logger.Error.Printf("Error creando estado_conexion: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Estado de conexión creado correctamente", "id_estado_conexion": id})
}

// PATCH /api/v1/internal/estados-conexion/{id}
func (h *EstadoConexionWriteHandler) ActualizarEstadoConexionHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    var req struct{
        Nombre string `json:"nombre"`
        Descripcion *string `json:"descripcion"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.Nombre)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio"); return }
    if err := h.service.Actualizar(ctx, id, nombre, req.Descripcion); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Estado de conexión no encontrado"); return }
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un estado de conexión con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' debe tener entre 3 y 50 caracteres"); return }
        logger.Error.Printf("Error actualizando estado_conexion %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de conexión actualizado correctamente"})
}

// DELETE /api/v1/internal/estados-conexion/{id}
func (h *EstadoConexionWriteHandler) EliminarEstadoConexionHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Estado de conexión no encontrado"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "No se puede eliminar: el estado está en uso"); return }
        logger.Error.Printf("Error borrando estado_conexion %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Estado de conexión eliminado correctamente"})
}
