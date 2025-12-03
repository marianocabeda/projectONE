package servicios

import (
	"context"
	"database/sql"
	"fmt"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
)

type NotificacionService struct {
	db *sql.DB
}

func NewNotificacionService(db *sql.DB) *NotificacionService {
	return &NotificacionService{db: db}
}

// ObtenerNotificaciones obtiene las notificaciones de un usuario con validaciones, filtros y paginación
func (s *NotificacionService) ObtenerNotificaciones(
	ctx context.Context,
	idPersona int,
	leido *int,
	page, limit int,
	sortBy, sortDirection string,
) (*modelos.NotificacionesResponse, error) {
	// Validar id_persona
	if idPersona <= 0 {
		return nil, fmt.Errorf("id_persona inválido")
	}

	// Validar leído (debe ser 0 o 1 si viene)
	if leido != nil && (*leido != 0 && *leido != 1) {
		return nil, fmt.Errorf("leido debe ser 0 o 1")
	}

	// Validar page y limit
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// Validar sort_by
	if sortBy == "" {
		sortBy = "creado"
	}
	if sortBy != "creado" {
		return nil, fmt.Errorf("sort_by solo puede ser 'creado'")
	}

	// Validar sort_direction
	if sortDirection == "" {
		sortDirection = "DESC"
	}
	if sortDirection != "ASC" && sortDirection != "DESC" {
		return nil, fmt.Errorf("sort_direction solo puede ser ASC o DESC")
	}

	repo := repositorios.NewNotificacionRepo(s.db)

	// Contar total
	total, err := repo.ContarNotificaciones(ctx, idPersona, leido)
	if err != nil {
		return nil, fmt.Errorf("error al contar notificaciones: %w", err)
	}

	// Obtener notificaciones
	notificaciones, err := repo.ObtenerNotificaciones(ctx, idPersona, leido, page, limit, sortBy, sortDirection)
	if err != nil {
		return nil, fmt.Errorf("error al obtener notificaciones: %w", err)
	}

	// Si no hay notificaciones, devolver array vacío en lugar de nil
	if notificaciones == nil {
		notificaciones = []modelos.Notificacion{}
	}

	// Calcular total de páginas
	totalPages := (total + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}

	return &modelos.NotificacionesResponse{
		Notificaciones: notificaciones,
		Page:           page,
		Limit:          limit,
		Total:          total,
		TotalPages:     totalPages,
	}, nil
}

// MarcarComoLeida marca una notificación como leída solo si pertenece al usuario
func (s *NotificacionService) MarcarComoLeida(
	ctx context.Context,
	idNotificacion int,
	idPersona int,
) error {
	// Validar id_notificacion
	if idNotificacion <= 0 {
		return fmt.Errorf("id_notificacion inválido")
	}

	// Validar id_persona
	if idPersona <= 0 {
		return fmt.Errorf("id_persona inválido")
	}

	repo := repositorios.NewNotificacionRepo(s.db)

	// Intentar marcar como leída
	err := repo.MarcarComoLeida(ctx, idNotificacion, idPersona)
	if err != nil {
		if err == sql.ErrNoRows {
			// La notificación no existe o no pertenece al usuario
			return fmt.Errorf("notificación no encontrada o no pertenece al usuario")
		}
		return fmt.Errorf("error al marcar notificación como leída: %w", err)
	}

	return nil
}
