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