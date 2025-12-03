package repositorios

import (
	"contrato_one_internet_modelo/internal/modelos"
	"database/sql"
)

type GeografiaRepository struct {
	db *sql.DB
}

func NewGeografiaRepository(db *sql.DB) *GeografiaRepository {
	return &GeografiaRepository{db: db}
}

func (r *GeografiaRepository) ObtenerProvincias() ([]modelos.Provincia, error) {
	query := `
        SELECT id_provincia, nombre 
        FROM provincia 
        WHERE borrado IS NULL 
        ORDER BY nombre`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var provincias []modelos.Provincia
	for rows.Next() {
		var p modelos.Provincia
		if err := rows.Scan(&p.ID, &p.Nombre); err != nil {
			return nil, err
		}
		provincias = append(provincias, p)
	}
	return provincias, rows.Err()
}

func (r *GeografiaRepository) ObtenerDepartamentosPorProvincia(provinciaID int) ([]modelos.Departamento, error) {
	query := `
        SELECT id_departamento, id_provincia, nombre 
        FROM departamento 
        WHERE borrado IS NULL AND id_provincia = ? 
        ORDER BY nombre`

	rows, err := r.db.Query(query, provinciaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departamentos []modelos.Departamento
	for rows.Next() {
		var d modelos.Departamento
		if err := rows.Scan(&d.ID, &d.IDProvincia, &d.Nombre); err != nil {
			return nil, err
		}
		departamentos = append(departamentos, d)
	}
	return departamentos, rows.Err()
}

func (r *GeografiaRepository) ObtenerDistritosPorDepartamento(departamentoID int) ([]modelos.Distrito, error) {
	query := `
        SELECT id_distrito, id_departamento, nombre 
        FROM distrito 
        WHERE borrado IS NULL AND id_departamento = ? 
        ORDER BY nombre`

	rows, err := r.db.Query(query, departamentoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var distritos []modelos.Distrito
	for rows.Next() {
		var d modelos.Distrito
		if err := rows.Scan(&d.ID, &d.IDDepartamento, &d.Nombre); err != nil {
			return nil, err
		}
		distritos = append(distritos, d)
	}
	return distritos, rows.Err()
}
