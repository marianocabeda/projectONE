package cargo

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

type CargoWriteHandler struct{
    service *servicios.CargoService
}

func NewWriteHandler(s *servicios.CargoService) *CargoWriteHandler { return &CargoWriteHandler{service: s} }

func (h *CargoWriteHandler) CrearCargoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req struct{ Nombre string `json:"nombre"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.Nombre)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio"); return }
    id, err := h.service.Crear(ctx, nombre)
    if err != nil {
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un cargo con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' debe tener entre 3 y 50 caracteres"); return }
        logger.Error.Printf("Error creando cargo: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Cargo creado correctamente", "id_cargo": id})
}

func (h *CargoWriteHandler) ActualizarCargoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    var req struct{ Nombre string `json:"nombre"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil { utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido"); return }
    nombre := strings.TrimSpace(req.Nombre)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio"); return }
    if err := h.service.Actualizar(ctx, id, nombre); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Cargo no encontrado"); return }
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un cargo con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' debe tener entre 3 y 50 caracteres"); return }
        logger.Error.Printf("Error actualizando cargo %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Cargo actualizado correctamente"})
}

func (h *CargoWriteHandler) EliminarCargoHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Cargo no encontrado"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "No se puede eliminar: el cargo está en uso"); return }
        logger.Error.Printf("Error borrando cargo %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Cargo eliminado correctamente"})
}
