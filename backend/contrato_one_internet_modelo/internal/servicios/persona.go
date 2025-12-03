package servicios

import (
	"context"
	"database/sql"
	"log"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
)

// PersonaService encapsula la lógica de negocio para las personas.
type PersonaService struct {
	db *sql.DB
}

// NewPersonaService crea una nueva instancia de PersonaService.
func NewPersonaService(db *sql.DB) *PersonaService {
	return &PersonaService{db: db}
}

// CrearPersonaCompleta gestiona la creación transaccional de una persona y su dirección.
func (s *PersonaService) CrearPersonaCompleta(ctx context.Context, persona modelos.Persona, direccion modelos.Direccion) (int64, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("Error al iniciar transacción: %v", err)
		return 0, err
	}
	defer tx.Rollback()

	direccionRepo := repositorios.NewDireccionRepo(tx)
	idDireccion, err := direccionRepo.EncontrarOCrearDireccion(ctx, &direccion)
	if err != nil {
		// Propagamos el error original para que el handler pueda inspeccionarlo.
		return 0, err
	}

	persona.IDDireccion = int(idDireccion)

	personaRepo := repositorios.NewPersonaRepo(tx)
	idPersona, err := personaRepo.CrearPersona(ctx, &persona)
	if err != nil {
		// Propagamos el error original.
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error al hacer commit de la transacción: %v", err)
		return 0, err
	}

	return idPersona, nil
}