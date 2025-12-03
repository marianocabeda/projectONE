package servicios
/*
import (
	"context"
	"database/sql"

	"contrato_one_internet_modelo/internal/modelos"
	"contrato_one_internet_modelo/internal/repositorios"
)

type ClientesService struct {
	DB              *sql.DB
	RepoDireccion   repositorios.DireccionRepo
	RepoPersona     repositorios.PersonaRepo
	RepoEmpresa     repositorios.EmpresaRepo
	RepoVinculo     repositorios.VinculoRepo
}

func NewClientesService(db *sql.DB,
	dirRepo *repositorios.DireccionRepo,
	perRepo *repositorios.PersonaRepo,
	empRepo *repositorios.EmpresaRepo,
	vincRepo *repositorios.VinculoRepo,
) *ClientesService {
	return &ClientesService{
		DB:            db,
		RepoDireccion: *dirRepo,
		RepoPersona:   *perRepo,
		RepoEmpresa:   *empRepo,
		RepoVinculo:   *vincRepo,
	}
}

// Para el handler: para particulates
type CrearParticularRequest struct {
	Persona   modelos.Persona
	Direccion modelos.Direccion
}

func (s *ClientesService) CrearClienteParticular(ctx context.Context, req CrearParticularRequest) (int64, error) {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		}
	}()

	idDir, err := s.RepoDireccion.CrearDireccion(ctx, tx, &req.Direccion)
	if err != nil {
		return 0, err
	}

	req.Persona.IDDireccion = int(idDir)

	idPersona, err := s.RepoPersona.CrearPersona(ctx, tx, &req.Persona)
	if err != nil {
		return 0, err
	}

	err = tx.Commit()
	if err != nil {
		return 0, err
	}

	return idPersona, nil
}

// Para el handler: para empresas
type CrearEmpresaRequest struct {
	Apoderado          modelos.Persona
	DireccionApoderado modelos.Direccion
	Empresa            modelos.Empresa
	DireccionEmpresa   modelos.Direccion
}

type CrearEmpresaResponse struct {
	IDEmpresa   int64
	IDApoderado int64
}

func (s *ClientesService) CrearClienteEmpresa(ctx context.Context, req CrearEmpresaRequest) (*CrearEmpresaResponse, error) {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		}
	}()

	idDirApoderado, err := s.RepoDireccion.CrearDireccion(ctx, tx, &req.DireccionApoderado)
	if err != nil {
		return nil, err
	}
	req.Apoderado.IDDireccion = int(idDirApoderado)

	idApoderado, err := s.RepoPersona.CrearPersona(ctx, tx, &req.Apoderado)
	if err != nil {
		return nil, err
	}

	idDirEmpresa, err := s.RepoDireccion.CrearDireccion(ctx, tx, &req.DireccionEmpresa)
	if err != nil {
		return nil, err
	}
	req.Empresa.IDDireccion = int(idDirEmpresa)

	idEmpresa, err := s.RepoEmpresa.CrearEmpresa(ctx, tx, &req.Empresa)
	if err != nil {
		return nil, err
	}

	const VinculoApoderado = "Apoderado"

	idVinculoApoderado, err := s.RepoVinculo.ObtenerIDPorNombre(ctx, s.DB, VinculoApoderado)
	if err != nil {
		return nil, err
	}

	vinculo := &modelos.PersonaVinculoEmpresa{
		IDPersona: int(idApoderado),
		IDVinculo: idVinculoApoderado,
		IDEmpresa: int(idEmpresa),
	}

	if err := s.RepoVinculo.CrearPersonaVinculoEmpresa(ctx, tx, vinculo); err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return &CrearEmpresaResponse{
		IDEmpresa:   idEmpresa,
		IDApoderado: idApoderado,
	}, nil
}*/