package servicios

import (
	"context"
	"math"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
	"contrato_one_internet_modelo/internal/utilidades"
)

type DireccionService struct {
	direccionRepo *repositorios.DireccionRepo
}

func NewDireccionService(repo *repositorios.DireccionRepo) *DireccionService {
	return &DireccionService{direccionRepo: repo}
}

// ListarDireccionesPaginado obtiene direcciones activas con filtros y retorna respuesta paginada.
func (s *DireccionService) ListarDireccionesPaginado(ctx context.Context, page, limit, idDistrito int, calle, codigoPostal, numero, orden string) (map[string]interface{}, error) {
	// Validar paginación
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// Obtener direcciones y total desde el repo
	direcciones, total, err := s.direccionRepo.ListarDirecciones(ctx, page, limit, idDistrito, calle, codigoPostal, numero, orden)
	if err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	// Construir respuesta
	var direccionesJSON []map[string]interface{}
	for _, d := range direcciones {
		direccionesJSON = append(direccionesJSON, map[string]interface{}{
			"id_direccion":  d.ID,
			"calle":         d.Calle,
			"numero":        d.Numero,
			"codigo_postal": d.CodigoPostal,
			"piso":          d.Piso,
			"depto":         d.Depto,
			"id_distrito":   d.IDDistrito,
		})
	}

	return map[string]interface{}{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"direcciones": direccionesJSON,
	}, nil
}

// ObtenerDireccionPorID obtiene una dirección específica por su ID.
func (s *DireccionService) ObtenerDireccionPorID(ctx context.Context, id int) (map[string]interface{}, error) {
	d, err := s.direccionRepo.ObtenerDireccionPorID(ctx, id)
	if err != nil {
		return nil, utilidades.ErrNoEncontrado
	}

	// Verificar que no esté borrada
	if d.Borrado != nil {
		return nil, utilidades.ErrNoEncontrado
	}

	return map[string]interface{}{
		"id_direccion":  d.ID,
		"calle":         d.Calle,
		"numero":        d.Numero,
		"codigo_postal": d.CodigoPostal,
		"piso":          d.Piso,
		"depto":         d.Depto,
		"id_distrito":   d.IDDistrito,
	}, nil
}

// CrearDireccion crea una nueva dirección utilizando la lógica de encontrar o crear.
func (s *DireccionService) CrearDireccion(ctx context.Context, nueva *modelos.Direccion) (int64, error) {
	// Validar que id_distrito sea válido (mayor que 0)
	if nueva.IDDistrito <= 0 {
		return 0, utilidades.ErrValidacion
	}

	// Usar EncontrarOCrearDireccion que maneja duplicados y race conditions
	idDireccion, err := s.direccionRepo.EncontrarOCrearDireccion(ctx, nueva)
	if err != nil {
		return 0, err
	}

	return idDireccion, nil
}

// ActualizarDireccion actualiza una dirección existente.
func (s *DireccionService) ActualizarDireccion(ctx context.Context, id int, nueva *modelos.Direccion) error {
	// Validar que id_distrito sea válido
	if nueva.IDDistrito <= 0 {
		return utilidades.ErrValidacion
	}

	// Intentar actualizar usando el repositorio
	err := s.direccionRepo.ActualizarDireccion(ctx, int64(id), nueva)
	if err != nil {
		return err
	}

	return nil
}

// BorrarDireccion ejecuta el borrado lógico de una dirección.
func (s *DireccionService) BorrarDireccion(ctx context.Context, id int) error {
	return s.direccionRepo.BorrarDireccion(ctx, int64(id))
}
