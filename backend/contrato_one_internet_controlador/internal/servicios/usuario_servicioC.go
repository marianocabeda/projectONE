package servicios

import (
    "context"
    "fmt"
    "net/url"
)

type UsuarioService struct {
    ModeloClient *ModeloClient
}

func NewUsuarioService(mc *ModeloClient) *UsuarioService {
    return &UsuarioService{ModeloClient: mc}
}

// ListarUsuarios llama al Modelo para obtener usuarios paginados.
func (s *UsuarioService) ListarUsuarios(ctx context.Context, page, limit int, nombre, apellido, dni, cuil, email string, idEmpresa int, sortBy, sortDir string) (map[string]interface{}, error) {
    path := fmt.Sprintf("/api/v1/internal/usuarios?page=%d&limit=%d", page, limit)
    if nombre != "" {
        path += fmt.Sprintf("&nombre=%s", url.QueryEscape(nombre))
    }
    if apellido != "" {
        path += fmt.Sprintf("&apellido=%s", url.QueryEscape(apellido))
    }
    if dni != "" {
        path += fmt.Sprintf("&dni=%s", url.QueryEscape(dni))
    }
    if cuil != "" {
        path += fmt.Sprintf("&cuil=%s", url.QueryEscape(cuil))
    }
    if email != "" {
        path += fmt.Sprintf("&email=%s", url.QueryEscape(email))
    }
    if idEmpresa > 0 {
        path += fmt.Sprintf("&id_empresa=%d", idEmpresa)
    }
    if sortBy != "" {
        path += fmt.Sprintf("&sort_by=%s", url.QueryEscape(sortBy))
    }
    if sortDir != "" {
        path += fmt.Sprintf("&sort_dir=%s", url.QueryEscape(sortDir))
    }

    var resp map[string]interface{}
    if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &resp, true); err != nil {
        return nil, err
    }
    return resp, nil
}
