package modelos

// TipoPlan representa un tipo de plan en la BD.
type TipoPlan struct {
    IDTipoPlan  int     `json:"id_tipo_plan"`
    Nombre      string  `json:"nombre"`
    Descripcion *string `json:"descripcion,omitempty"`
}

// Plan representa un plan de internet.
type Plan struct {
    IDPlan        int      `json:"id_plan"`
    IDTipoPlan    int      `json:"id_tipo_plan"`
    Nombre        string   `json:"nombre"`
    VelocidadMbps int      `json:"velocidad_mbps"`
    Precio        float64  `json:"precio"`
    Descripcion   *string  `json:"descripcion,omitempty"`
    FechaInicio   *string  `json:"fecha_inicio,omitempty"`
    FechaFin      *string  `json:"fecha_fin,omitempty"`
    IDUsuarioCreador *int  `json:"id_usuario_creador,omitempty"`
}
