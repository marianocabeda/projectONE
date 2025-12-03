package servicios

import (
	"context"
)

type VerificarEmailService struct {
	modeloClient *ModeloClient
}

func NewVerificarEmailService(modeloClient *ModeloClient) *VerificarEmailService {
	return &VerificarEmailService{
		modeloClient: modeloClient,
	}
}

func (s *VerificarEmailService) VerificarEmail(ctx context.Context, token string) error {
    // Se llama al modelo para validar y procesar el token
    err := s.modeloClient.VerificarEmail(ctx, token)
    if err != nil {
        return err
    }
    return nil
}
