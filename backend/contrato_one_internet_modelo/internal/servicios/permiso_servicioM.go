package servicios

import (
	"context"
	"math"
	"regexp"
	"strings"
	"time"

	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
	"contrato_one_internet_modelo/internal/utilidades/logger"
)

var permisoNombreRegexp = regexp.MustCompile(`^[a-z0-9_]+$`)

type PermisoService struct {
	repo *repositorios.PermisoRepo
}

func NewPermisoService(repo *repositorios.PermisoRepo) *PermisoService {
	return &PermisoService{repo: repo}
}

func (s *PermisoService) Listar(ctx context.Context) ([]interface{}, error) {
	listas, err := s.repo.ObtenerPermisosActivos(ctx)
	if err != nil {
		return nil, err
	}
	var out []interface{}
	for _, p := range listas {
		out = append(out, map[string]interface{}{"id_permiso": p.IDPermiso, "nombre": p.Nombre, "descripcion": p.Descripcion})
	}
	return out, nil
}

func (s *PermisoService) ObtenerPorID(ctx context.Context, id int) (map[string]interface{}, error) {
	p, err := s.repo.ObtenerPorID(ctx, id)
	if err != nil {
		return nil, utilidades.ErrNoEncontrado
	}
	return map[string]interface{}{"id_permiso": p.IDPermiso, "nombre": p.Nombre, "descripcion": p.Descripcion}, nil
}

func (s *PermisoService) Crear(ctx context.Context, nombre string, descripcion *string) (int64, error) {
	nombre = strings.TrimSpace(nombre)
	if len(nombre) < 3 || len(nombre) > 100 {
		return 0, utilidades.ErrValidacion
	}
	if !permisoNombreRegexp.MatchString(nombre) {
		return 0, utilidades.ErrValidacion
	}
	if descripcion != nil && len(*descripcion) > 255 {
		return 0, utilidades.ErrValidacion
	}
	exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, utilidades.ErrDuplicado
	}
	return s.repo.Crear(ctx, nombre, descripcion)
}

func (s *PermisoService) Actualizar(ctx context.Context, id int, nombre string, descripcion *string) error {
	nombre = strings.TrimSpace(nombre)
	if len(nombre) < 3 || len(nombre) > 100 {
		return utilidades.ErrValidacion
	}
	if !permisoNombreRegexp.MatchString(nombre) {
		return utilidades.ErrValidacion
	}
	if descripcion != nil && len(*descripcion) > 255 {
		return utilidades.ErrValidacion
	}
	if _, err := s.repo.ObtenerPorID(ctx, id); err != nil {
		return utilidades.ErrNoEncontrado
	}
	exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, nombre)
	if err != nil {
		return err
	}
	if exists {
		return utilidades.ErrDuplicado
	}
	return s.repo.Actualizar(ctx, id, nombre, descripcion)
}

func (s *PermisoService) BorrarLogico(ctx context.Context, id int) error {
	logger.Info.Printf("Borrando lógicamente permiso ID %d", id)
	if _, err := s.repo.ObtenerPorID(ctx, id); err != nil {
		return utilidades.ErrNoEncontrado
	}
	enUso, err := s.repo.EstaEnUso(ctx, id)
	logger.Info.Printf("¿El permiso ID %d está en uso? %v", id, enUso)
	if err != nil {
		return err
	}
	if enUso {
		return utilidades.ErrValidacion
	}
	logger.Info.Printf("Borrando lógicamente permiso ID %d", id)
	return s.repo.BorrarLogico(ctx, id)
}

// ListarPaginado devuelve permisos activos con paginación y filtros
func (s *PermisoService) ListarPaginado(ctx context.Context, page, limit int, nombre, orden string) (map[string]interface{}, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	// validar orden
	switch orden {
	case "nombre_asc", "nombre_desc", "creado_asc", "creado_desc":
	default:
		orden = "nombre_asc"
	}

	total, err := s.repo.CountPermisos(ctx, nombre, true)
	if err != nil {
		return nil, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	offset := (page - 1) * limit
	rows, err := s.repo.ListPermisosPaginated(ctx, offset, limit, nombre, orden, true)
	if err != nil {
		return nil, err
	}

	var permisos []map[string]interface{}
	for _, r := range rows {
		p := r.P
		permisos = append(permisos, map[string]interface{}{"id_permiso": p.IDPermiso, "nombre": p.Nombre, "descripcion": p.Descripcion})
	}

	return map[string]interface{}{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"permisos":    permisos,
	}, nil
}

// ListarInactivos devuelve permisos borrados con paginación y filtros (incluye campo borrado en ISO8601 UTC)
func (s *PermisoService) ListarInactivos(ctx context.Context, page, limit int, nombre, orden string) (map[string]interface{}, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	switch orden {
	case "nombre_asc", "nombre_desc", "creado_asc", "creado_desc":
	default:
		orden = "nombre_asc"
	}
	total, err := s.repo.CountPermisos(ctx, nombre, false)
	if err != nil {
		return nil, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if totalPages == 0 {
		totalPages = 1
	}
	offset := (page - 1) * limit
	rows, err := s.repo.ListPermisosPaginated(ctx, offset, limit, nombre, orden, false)
	if err != nil {
		return nil, err
	}

	var permisos []map[string]interface{}
	for _, r := range rows {
		p := r.P
		var borradoStr *string
		if r.Borrado.Valid {
			t := r.Borrado.Time.UTC().Format(time.RFC3339)
			borradoStr = &t
		}
		m := map[string]interface{}{"id_permiso": p.IDPermiso, "nombre": p.Nombre, "descripcion": p.Descripcion}
		if borradoStr != nil {
			m["borrado"] = *borradoStr
		}
		permisos = append(permisos, m)
	}

	return map[string]interface{}{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"permisos":    permisos,
	}, nil
}

// Reactivar intenta reactivar un permiso borrado. Retorna (reactivado bool, err error).
func (s *PermisoService) Reactivar(ctx context.Context, id int) (bool, error) {
	p, borrado, err := s.repo.ObtenerPorIDInclusoBorrado(ctx, id)
	if err != nil {
		return false, utilidades.ErrNoEncontrado
	}
	if !borrado.Valid {
		// Ya está activo
		return false, nil
	}
	// Verificar que no exista otro permiso activo con el mismo nombre
	exists, err := s.repo.ExisteNombreCaseInsensitive(ctx, p.Nombre)
	if err != nil {
		return false, err
	}
	if exists {
		return false, utilidades.ErrDuplicado
	}
	if err := s.repo.Reactivar(ctx, id); err != nil {
		return false, err
	}
	return true, nil
}
