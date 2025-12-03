package tipo_empresa

import (
    "encoding/json"
    "net/http"
    "strconv"
    "strings"

    "contrato_one_internet_modelo/internal/servicios"
    "contrato_one_internet_modelo/internal/utilidades"
    "contrato_one_internet_modelo/internal/utilidades/logger"

    "github.com/gorilla/mux"
)

type TipoEmpresaWriteHandler struct {
    service *servicios.TipoEmpresaService
}

func NewWriteHandler(s *servicios.TipoEmpresaService) *TipoEmpresaWriteHandler { return &TipoEmpresaWriteHandler{service: s} }

// POST /api/v1/internal/tipo-empresa
func (h *TipoEmpresaWriteHandler) CrearTipoEmpresaHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    var req struct{ Nombre string `json:"nombre"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
        return
    }
    nombre := strings.TrimSpace(req.Nombre)
    if nombre == "" {
        utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio")
        return
    }
    id, err := h.service.Crear(ctx, nombre)
    if err != nil {
        if err == utilidades.ErrDuplicado {
            utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un tipo de empresa con ese nombre")
            return
        }
        if err == utilidades.ErrValidacion {
            utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' debe tener entre 3 y 50 caracteres")
            return
        }
        logger.Error.Printf("Error creando tipo_empresa: %v", err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusCreated, map[string]interface{}{"mensaje": "Tipo de empresa creado correctamente", "id_tipo_empresa": id})
}

// PATCH /api/v1/internal/tipo-empresa/{id}
func (h *TipoEmpresaWriteHandler) ActualizarTipoEmpresaHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    defer r.Body.Close()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }

    var req struct{ Nombre string `json:"nombre"` }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utilidades.ResponderError(w, http.StatusBadRequest, "JSON inválido")
        return
    }
    nombre := strings.TrimSpace(req.Nombre)
    if nombre == "" { utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' es obligatorio"); return }

    if err := h.service.ActualizarNombre(ctx, id, nombre); err != nil {
        if err == utilidades.ErrNoEncontrado {
            utilidades.ResponderError(w, http.StatusNotFound, "Tipo de empresa no encontrado")
            return
        }
        if err == utilidades.ErrDuplicado {
            utilidades.ResponderError(w, http.StatusBadRequest, "Ya existe un tipo de empresa con ese nombre")
            return
        }
        if err == utilidades.ErrValidacion {
            utilidades.ResponderError(w, http.StatusBadRequest, "El campo 'nombre' debe tener entre 3 y 50 caracteres")
            return
        }
        logger.Error.Printf("Error actualizando tipo_empresa %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de empresa actualizado correctamente"})
}

// DELETE /api/v1/internal/tipo-empresa/{id}
func (h *TipoEmpresaWriteHandler) EliminarTipoEmpresaHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    vars := mux.Vars(r)
    idStr := vars["id"]
    id, err := strconv.Atoi(idStr)
    if err != nil || id <= 0 { utilidades.ResponderError(w, http.StatusBadRequest, "id inválido"); return }
    if err := h.service.BorrarLogico(ctx, id); err != nil {
        if err == utilidades.ErrNoEncontrado { utilidades.ResponderError(w, http.StatusNotFound, "Tipo de empresa no encontrado"); return }
        logger.Error.Printf("Error borrando tipo_empresa %d: %v", id, err)
        utilidades.ResponderError(w, http.StatusInternalServerError, "Error interno del servidor")
        return
    }
    utilidades.ResponderJSON(w, http.StatusOK, map[string]string{"mensaje": "Tipo de empresa eliminado correctamente"})
}
