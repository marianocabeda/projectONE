package repositorios

import (
	"context"
	"database/sql"
	"fmt"

	"contrato_one_internet_modelo/internal/utilidades"
)

// PersonaVinculoEmpresaRepo maneja operaciones de persona_vinculo_empresa
type PersonaVinculoEmpresaRepo struct {
	db Execer
}

// NewPersonaVinculoEmpresaRepo crea una nueva instancia
func NewPersonaVinculoEmpresaRepo(db Execer) *PersonaVinculoEmpresaRepo {
	return &PersonaVinculoEmpresaRepo{db: db}
}

// ObtenerIDEmpresaPorNombre obtiene el ID de una empresa por nombre comercial
func (r *PersonaVinculoEmpresaRepo) ObtenerIDEmpresaPorNombre(ctx context.Context, nombreComercial string) (int, error) {
	var idEmpresa int
	query := `SELECT id_empresa FROM empresa 
	          WHERE nombre_comercial = ? AND (borrado IS NULL OR borrado = 0) LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, nombreComercial).Scan(&idEmpresa)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, utilidades.ErrNotFound{
				Entity: "empresa",
				Campo:  "nombre_comercial",
				Valor:  nombreComercial,
			}
		}
		return 0, fmt.Errorf("error buscando empresa: %w", err)
	}
	return idEmpresa, nil
}

// ObtenerIDVinculoPorNombre obtiene el ID de un vínculo por nombre
func (r *PersonaVinculoEmpresaRepo) ObtenerIDVinculoPorNombre(ctx context.Context, nombreVinculo string) (int, error) {
	var idVinculo int
	query := `SELECT id_vinculo FROM vinculo 
	          WHERE nombre_vinculo = ? AND (borrado IS NULL OR borrado = 0) LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, nombreVinculo).Scan(&idVinculo)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, utilidades.ErrNotFound{
				Entity: "vinculo",
				Campo:  "nombre_vinculo",
				Valor:  nombreVinculo,
			}
		}
		return 0, fmt.Errorf("error buscando vínculo: %w", err)
	}
	return idVinculo, nil
}

// CrearOActualizarVinculo crea o actualiza un vínculo persona-empresa
// Si existe y está borrado, lo reactiva
func (r *PersonaVinculoEmpresaRepo) CrearOActualizarVinculo(ctx context.Context, idPersona, idVinculo, idEmpresa int) error {
	// Verificar si ya existe
	var exists int
	var borrado sql.NullTime
	query := `SELECT 1, borrado FROM persona_vinculo_empresa 
	          WHERE id_persona = ? AND id_vinculo = ? AND id_empresa = ? LIMIT 1`
	err := r.db.QueryRowContext(ctx, query, idPersona, idVinculo, idEmpresa).Scan(&exists, &borrado)
	
	if err == sql.ErrNoRows {
		// No existe, insertar
		insertQuery := `INSERT INTO persona_vinculo_empresa 
		                (id_persona, id_vinculo, id_empresa, id_cargo) 
		                VALUES (?, ?, ?, NULL)`
		_, err = r.db.ExecContext(ctx, insertQuery, idPersona, idVinculo, idEmpresa)
		if err != nil {
			return utilidades.TraducirErrorBD(err)
		}
		return nil
	} else if err != nil {
		return fmt.Errorf("error verificando vínculo existente: %w", err)
	}

	// Existe - si está borrado, reactivar
	if borrado.Valid {
		updateQuery := `UPDATE persona_vinculo_empresa 
		                SET borrado = NULL 
		                WHERE id_persona = ? AND id_vinculo = ? AND id_empresa = ?`
		_, err = r.db.ExecContext(ctx, updateQuery, idPersona, idVinculo, idEmpresa)
		if err != nil {
			return utilidades.TraducirErrorBD(err)
		}
	}
	// Si no está borrado, no hacemos nada (ya existe activo)
	return nil
}
