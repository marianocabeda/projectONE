package validadores
/*
import (
	"contrato_one_internet_controlador/internal/modelos"
	"contrato_one_internet_controlador/internal/utilidades"
	"fmt"
)

func ValidarDireccion1(direccion *modelos.Direccion) error {
	if direccion == nil {
		return fmt.Errorf("dirección requerida: %w", utilidades.ErrValidacion)
	}
	if direccion.Calle == "" || len(direccion.Calle) > 100 {
		return fmt.Errorf("calle inválida: %w", utilidades.ErrValidacion)
	}
	if direccion.Numero == "" || len(direccion.Numero) > 10 {
		return fmt.Errorf("número inválido: %w", utilidades.ErrValidacion)
	}
	if direccion.CodigoPostal == "" || len(direccion.CodigoPostal) > 10 {
		return fmt.Errorf("código postal inválido: %w", utilidades.ErrValidacion)
	}
	if direccion.IDDistrito <= 0 {
		return fmt.Errorf("distrito requerido: %w", utilidades.ErrValidacion)
	}
	if direccion.Piso != nil && len(*direccion.Piso) > 10 {
		return fmt.Errorf("piso demasiado largo: %w", utilidades.ErrValidacion)
	}
	if direccion.Depto != nil && len(*direccion.Depto) > 10 {
		return fmt.Errorf("depto demasiado largo: %w", utilidades.ErrValidacion)
	}
	return nil
}

func ValidarClienteParticular(req modelos.CrearClienteParticularRequest) error {
	if err := ValidarPersona(req.Persona); err != nil {
		return err
	}
	if err := ValidarDireccion(req.DireccionReal); err != nil {
		return err
	}
	if req.DireccionLegal != nil {
		if err := ValidarDireccion(req.DireccionLegal); err != nil {
			return err
		}
	}
	return nil
}

func ValidarClienteEmpresa(req modelos.CrearClienteEmpresaRequest) error {
	if err := ValidarPersona(req.Apoderado); err != nil {
		return err
	}
	if err := ValidarDireccion(req.DireccionApoderadoReal); err != nil {
		return err
	}
	if req.DireccionApoderadoLegal != nil {
		if err := ValidarDireccion(req.DireccionApoderadoLegal); err != nil {
			return err
		}
	}
	if err := ValidarEmpresa(req.Empresa); err != nil {
		return err
	}
	if err := ValidarDireccion(req.DireccionEmpresaReal); err != nil {
		return err
	}
	if req.DireccionEmpresaLegal != nil {
		if err := ValidarDireccion(req.DireccionEmpresaLegal); err != nil {
			return err
		}
	}
	return nil
}*/