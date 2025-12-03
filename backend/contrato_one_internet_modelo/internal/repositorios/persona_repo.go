package repositorios

import (
	"context"
	"fmt"
	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/utilidades"
)

// PersonaRepo maneja las operaciones de la base de datos para personas.
type PersonaRepo struct {
	db Execer
}

// NewPersonaRepo crea una instancia de PersonaRepo.
func NewPersonaRepo(db Execer) *PersonaRepo {
	return &PersonaRepo{db: db}
}

// Crear inserta una nueva persona y devuelve su ID.
func (r *PersonaRepo) CrearPersona(ctx context.Context, p *modelos.Persona) (int64, error) {

	query := `
        INSERT INTO persona (nombre, apellido, sexo, dni, cuil, fecha_nacimiento, id_direccion, 
                            distrito_nombre, departamento_nombre, provincia_nombre,
                            telefono, telefono_alternativo, email, id_tipo_iva, id_usuario_creador)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	res, err := r.db.ExecContext(ctx, query,
		p.Nombre, p.Apellido, p.Sexo, p.DNI, p.Cuil, p.FechaNacimiento, p.IDDireccion,
		p.DistritoNombre, p.DepartamentoNombre, p.ProvinciaNombre,
		p.Telefono, p.TelefonoAlternativo, p.Email, p.IDTipoIva, p.IDUsuarioCreador,
	)
	if err != nil {
		return 0, utilidades.TraducirErrorBD(err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("error al obtener ID insertado: %w", err)
	}
	return id, nil	
}

// ObtenerPersonaPorUsuarioID retorna la persona asociada a un id_usuario dado.
func (r *PersonaRepo) ObtenerPersonaPorUsuarioID(ctx context.Context, idUsuario int) (*modelos.Persona, error) {
	var p modelos.Persona
	query := `
		SELECT p.id_persona, p.nombre, p.apellido, p.sexo, p.dni, p.cuil, p.fecha_nacimiento, p.id_direccion,
			   p.distrito_nombre, p.departamento_nombre, p.provincia_nombre, p.telefono, p.telefono_alternativo, p.email
		FROM usuario u
		JOIN persona p ON u.id_persona = p.id_persona
		WHERE u.id_usuario = ? AND (p.borrado IS NULL OR p.borrado = 0)
		LIMIT 1
	`

	err := r.db.QueryRowContext(ctx, query, idUsuario).Scan(
		&p.ID,
		&p.Nombre,
		&p.Apellido,
		&p.Sexo,
		&p.DNI,
		&p.Cuil,
		&p.FechaNacimiento,
		&p.IDDireccion,
		&p.DistritoNombre,
		&p.DepartamentoNombre,
		&p.ProvinciaNombre,
		&p.Telefono,
		&p.TelefonoAlternativo,
		&p.Email,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}