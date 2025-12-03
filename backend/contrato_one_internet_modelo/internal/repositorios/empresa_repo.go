package repositorios

import (
	"context"
	"contrato_one_internet_modelo/internal/modelos"
)

type EmpresaRepo struct{}

func NewEmpresaRepo() *EmpresaRepo {
	return &EmpresaRepo{}
}

func (r *EmpresaRepo) CrearEmpresa(ctx context.Context, tx Execer, e *modelos.Empresa) (int64, error) {
	query := `INSERT INTO empresa (nombre_comercial, razon_social, cuit, id_tipo_empresa, id_direccion,
		distrito_nombre, departamento_nombre, provincia_nombre,
		telefono, telefono_alternativo, email, id_tipo_iva, id_usuario_creador)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	res, err := tx.ExecContext(ctx, query,
		e.NombreComercial, e.RazonSocial, e.Cuit, e.IDTipoEmpresa, e.IDDireccion,
		e.DistritoNombre, e.DepartamentoNombre, e.ProvinciaNombre,
		e.Telefono, e.TelefonoAlternativo, e.Email, e.IDTipoIva, e.IDUsuarioCreador,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *EmpresaRepo) ObtenerIDPorCUIT(ctx context.Context, db Execer, cuit string) (int, error) {
	var id int
	query := "SELECT id_empresa FROM empresa WHERE cuit = ? AND borrado IS NULL"
	err := db.QueryRowContext(ctx, query, cuit).Scan(&id)
	return id, err
}









/*package repositorios

import (
	"context"
	"database/sql"
	"contrato_one_internet_modelo/internal/modelos"
)

// CrearEmpresa inserta una nueva empresa en la base de datos dentro de una transacción
// y devuelve el ID de la nueva fila.
func CrearEmpresa(ctx context.Context, tx *sql.Tx, e *modelos.Empresa) (int64, error) {
	query := `
        INSERT INTO empresa (nombre_comercial, razon_social, cuit, id_tipo_empresa, id_direccion,
                            distrito_nombre, departamento_nombre, provincia_nombre,
                            telefono, telefono_alternativo, email, id_tipo_iva, id_usuario_creador)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	res, err := stmt.ExecContext(ctx,
		e.NombreComercial, e.RazonSocial, e.Cuit, e.IDTipoEmpresa, e.IDDireccion,
		e.DistritoNombre, e.DepartamentoNombre, e.ProvinciaNombre,
		e.Telefono, e.TelefonoAlternativo, e.Email, e.IDTipoIva, e.IDUsuarioCreador,
	)
	if err != nil {
		return 0, err
	}

	return res.LastInsertId()
}

// ObtenerIDEmpresaPorCUIT busca una empresa por su CUIT y devuelve su ID.
// Es útil para encontrar la empresa "ONE Internet" automáticamente.
func ObtenerIDEmpresaPorCUIT(ctx context.Context, db *sql.DB, cuit string) (int, error) {
	var id int
	query := "SELECT id_empresa FROM empresa WHERE cuit = ? AND borrado IS NULL"
	err := db.QueryRowContext(ctx, query, cuit).Scan(&id)
	return id, err
}
*/