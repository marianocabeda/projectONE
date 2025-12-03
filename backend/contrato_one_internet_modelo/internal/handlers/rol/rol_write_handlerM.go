package rol

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

type RolWriteHandler struct{
    service *servicios.RolService
}

func NewWriteHandler(s *servicios.RolService) *RolWriteHandler { return &RolWriteHandler{service: s} }

func (h *RolWriteHandler) CrearRolHandler(w http.ResponseWriter, r *http.Request) {
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
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un rol con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "Validación: revisá los campos"); return }
        logger.Error.Printf("Error creando rol: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Rol creado correctamente", "id_rol": id})
}

func (h *RolWriteHandler) ActualizarRolHandler(w http.ResponseWriter, r *http.Request) {
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
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Rol no encontrado"); return }
        if err == utilidades.ErrDuplicado { utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un rol con ese nombre"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "Validación: revisá los campos"); return }
        logger.Error.Printf("Error actualizando rol %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Rol actualizado correctamente"})
}

func (h *RolWriteHandler) EliminarRolHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Rol no encontrado"); return }
        if err == utilidades.ErrValidacion { utilidades.ResponderError(w, http.StatusBadRequest, "No se puede eliminar: el rol está en uso"); return }
        logger.Error.Printf("Error borrando rol %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Rol eliminado correctamente"})
}
