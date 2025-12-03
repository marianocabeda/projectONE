package servicios

import (
    "context"
    "database/sql"
    "fmt"
    "strings"

    "contrato_one_internet_modelo/internal/modelos"
    "contrato_one_internet_modelo/internal/utilidades"
)

// PlanService encapsula consultas a tipo_plan y plan.
type PlanService struct {
    db *sql.DB
}

func NewPlanService(db *sql.DB) *PlanService {
    return &PlanService{db: db}
}

// ObtenerTipoPlanes retorna todos los tipo_plan no borrados.
func (s *PlanService) ObtenerTipoPlanes(ctx context.Context) ([]modelos.TipoPlan, error) {
    rows, err := s.db.QueryContext(ctx, `SELECT id_tipo_plan, nombre, descripcion FROM tipo_plan WHERE borrado IS NULL`)
    if err != nil {
        return nil, fmt.Errorf("error consultando tipo_plan: %w", err)
    }
    defer rows.Close()

    var tipos []modelos.TipoPlan
    for rows.Next() {
        var t modelos.TipoPlan
        if err := rows.Scan(&t.IDTipoPlan, &t.Nombre, &t.Descripcion); err != nil {
            return nil, err
        }
        tipos = append(tipos, t)
    }
    if err := rows.Err(); err != nil {
        return nil, err
    }
    return tipos, nil
}

// Filtros soportados: id_tipo_plan (int), min_velocidad (int), max_precio (decimal)
func (s *PlanService) ObtenerPlanes(ctx context.Context, idTipoPlan *int, minVel *int, maxPrecio *float64) ([]modelos.Plan, error) {
    // Base query: active plans
    q := `SELECT id_plan, id_tipo_plan, nombre, velocidad_mbps, precio, descripcion FROM plan WHERE (borrado IS NULL) AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())` 
    args := []interface{}{}

    if idTipoPlan != nil {
        q += " AND id_tipo_plan = ?"
        args = append(args, *idTipoPlan)
    }
    if minVel != nil {
        q += " AND velocidad_mbps >= ?"
        args = append(args, *minVel)
    }
    if maxPrecio != nil {
        q += " AND precio <= ?"
        args = append(args, *maxPrecio)
    }

    q += " ORDER BY velocidad_mbps ASC"

    rows, err := s.db.QueryContext(ctx, q, args...)
    if err != nil {
        return nil, utilidades.TraducirErrorBD(err)
    }
    defer rows.Close()

    var planes []modelos.Plan
    for rows.Next() {
        var p modelos.Plan
        if err := rows.Scan(&p.IDPlan, &p.IDTipoPlan, &p.Nombre, &p.VelocidadMbps, &p.Precio, &p.Descripcion); err != nil {
            return nil, err
        }
        planes = append(planes, p)
    }
    if err := rows.Err(); err != nil {
        return nil, err
    }
    return planes, nil
}

func (s *PlanService) ObtenerPlanPorID(ctx context.Context, id int) (*modelos.Plan, error) {
    var p modelos.Plan
    err := s.db.QueryRowContext(ctx, `SELECT id_plan, id_tipo_plan, nombre, velocidad_mbps, precio, descripcion FROM plan WHERE id_plan = ? AND (borrado IS NULL) LIMIT 1`, id).Scan(&p.IDPlan, &p.IDTipoPlan, &p.Nombre, &p.VelocidadMbps, &p.Precio, &p.Descripcion)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, utilidades.ErrNoEncontrado
        }
        return nil, utilidades.TraducirErrorBD(err)
    }
    return &p, nil
}

// CrearPlan inserta un nuevo plan y retorna su id.
func (s *PlanService) CrearPlan(ctx context.Context, p modelos.Plan) (int64, error) {
    // Validar id_tipo_plan existe
    var cnt int
    if err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM tipo_plan WHERE id_tipo_plan = ? AND (borrado IS NULL OR borrado = 0)`, p.IDTipoPlan).Scan(&cnt); err != nil {
        return 0, utilidades.TraducirErrorBD(err)
    }
    if cnt == 0 {
        return 0, utilidades.ErrNoEncontrado
    }

    // Insertar
    res, err := s.db.ExecContext(ctx, `INSERT INTO plan (id_tipo_plan, nombre, velocidad_mbps, precio, descripcion, id_usuario_creador, borrado, fecha_inicio) VALUES (?, ?, ?, ?, ?, ?, NULL, NOW())`, p.IDTipoPlan, p.Nombre, p.VelocidadMbps, p.Precio, p.Descripcion, p.IDUsuarioCreador)
    if err != nil {
        return 0, utilidades.TraducirErrorBD(err)
    }
    id, err := res.LastInsertId()
    if err != nil {
        return 0, err
    }
    return id, nil
}

// ActualizarPlan aplica actualizaciones parciales.
func (s *PlanService) ActualizarPlan(ctx context.Context, id int, updates map[string]interface{}) error {
    // Verificar existe y no borrado
    var borrado sql.NullTime
    if err := s.db.QueryRowContext(ctx, `SELECT borrado FROM plan WHERE id_plan = ? LIMIT 1`, id).Scan(&borrado); err != nil {
        if err == sql.ErrNoRows {
            return utilidades.ErrNoEncontrado
        }
        return utilidades.TraducirErrorBD(err)
    }
    if borrado.Valid {
        return fmt.Errorf("plan borrado")
    }

    // Si id_tipo_plan viene en updates, validar existencia
    if v, ok := updates["id_tipo_plan"]; ok {
        // Aceptar números float64 (JSON decode) o int
        var idTipo int
        switch t := v.(type) {
        case float64:
            idTipo = int(t)
        case int:
            idTipo = t
        case int64:
            idTipo = int(t)
        default:
            return fmt.Errorf("id_tipo_plan inválido")
        }
        var cnt int
        if err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM tipo_plan WHERE id_tipo_plan = ? AND (borrado IS NULL OR borrado = 0)`, idTipo).Scan(&cnt); err != nil {
            return utilidades.TraducirErrorBD(err)
        }
        if cnt == 0 {
            return utilidades.ErrNoEncontrado
        }
    }

    // Construir SET dinámico
    sets := []string{}
    args := []interface{}{}
    if v, ok := updates["nombre"]; ok {
        sets = append(sets, "nombre = ?"); args = append(args, v)
    }
    if v, ok := updates["velocidad_mbps"]; ok {
        sets = append(sets, "velocidad_mbps = ?"); args = append(args, v)
    }
    if v, ok := updates["precio"]; ok {
        sets = append(sets, "precio = ?"); args = append(args, v)
    }
    if v, ok := updates["descripcion"]; ok {
        sets = append(sets, "descripcion = ?"); args = append(args, v)
    }
    if v, ok := updates["id_tipo_plan"]; ok {
        sets = append(sets, "id_tipo_plan = ?"); args = append(args, v)
    }
    if v, ok := updates["fecha_fin"]; ok {
        sets = append(sets, "fecha_fin = ?"); args = append(args, v)
    }

    if len(sets) == 0 {
        return nil
    }

    // Añadir id al final
    args = append(args, id)
    q := "UPDATE plan SET " + strings.Join(sets, ", ") + " WHERE id_plan = ?"
    if _, err := s.db.ExecContext(ctx, q, args...); err != nil {
        return utilidades.TraducirErrorBD(err)
    }
    return nil
}

// BorrarPlan realiza borrado lógico (set borrado = NOW()).
func (s *PlanService) BorrarPlan(ctx context.Context, id int) error {
    // Verificar existe
    var exists int
    if err := s.db.QueryRowContext(ctx, `SELECT COUNT(1) FROM plan WHERE id_plan = ? AND (borrado IS NULL)`, id).Scan(&exists); err != nil {
        return utilidades.TraducirErrorBD(err)
    }
    if exists == 0 {
        return utilidades.ErrNoEncontrado
    }
    if _, err := s.db.ExecContext(ctx, `UPDATE plan SET borrado = NOW() WHERE id_plan = ?`, id); err != nil {
        return utilidades.TraducirErrorBD(err)
    }
    return nil
}
