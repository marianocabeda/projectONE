package servicios

import (
    "context"
    "fmt"
    "net/url"
    "strconv"

    "contrato_one_internet_controlador/internal/modelos"
)

type PlanService struct {
    ModeloClient *ModeloClient
}

func NewPlanService(mc *ModeloClient) *PlanService {
    return &PlanService{ModeloClient: mc}
}

func (s *PlanService) ObtenerTipoPlanes(ctx context.Context) ([]modelos.TipoPlan, error) {
    var resp struct{
        Tipos []modelos.TipoPlan `json:"tipos"`
    }
    if err := s.ModeloClient.DoRequest(ctx, "GET", "/api/v1/tipo-plan", nil, &resp, false); err != nil {
        return nil, err
    }
    return resp.Tipos, nil
}

func (s *PlanService) ObtenerPlanes(ctx context.Context, idTipo *int, minVel *int, maxPrecio *float64) ([]modelos.Plan, error) {
    q := url.Values{}
    if idTipo != nil { q.Set("id_tipo_plan", strconv.Itoa(*idTipo)) }
    if minVel != nil { q.Set("min_velocidad", strconv.Itoa(*minVel)) }
    if maxPrecio != nil { q.Set("max_precio", fmt.Sprintf("%v", *maxPrecio)) }
    path := "/api/v1/planes"
    if len(q) > 0 { path += "?" + q.Encode() }

    var resp struct{
        Planes []modelos.Plan `json:"planes"`
    }
    if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &resp, false); err != nil {
        return nil, err
    }
    return resp.Planes, nil
}

func (s *PlanService) ObtenerPlanPorID(ctx context.Context, id int) (*modelos.Plan, error) {
    var p modelos.Plan
    path := fmt.Sprintf("/api/v1/planes/%d", id)
    if err := s.ModeloClient.DoRequest(ctx, "GET", path, nil, &p, false); err != nil {
        return nil, err
    }
    return &p, nil
}
