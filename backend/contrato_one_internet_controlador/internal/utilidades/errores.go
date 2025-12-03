package utilidades

import "errors"

var (
	ErrDuplicado             = errors.New("elemento ya existe")
	ErrNoEncontrado          = errors.New("elemento no encontrado")
	ErrValidacion            = errors.New("validación fallida")
	ErrTokenExpirado 		 = errors.New("token expirado")
	ErrTokenUsado            = errors.New("token ya usado")
	ErrCredencialesInvalidas = errors.New("credenciales inválidas")
	ErrEmailNoVerificado     = errors.New("verificación de email pendiente")
	ErrValidacionLogin       = errors.New("validación login fallida")
)
