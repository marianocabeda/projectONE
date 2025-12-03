package modelos

type TipoPlan struct {
    IDTipoPlan  int     `json:"id_tipo_plan"`
    Nombre      string  `json:"nombre"`
    Descripcion *string `json:"descripcion,omitempty"`
}

type Plan struct {
    IDPlan        int      `json:"id_plan"`
    IDTipoPlan    int      `json:"id_tipo_plan"`
    Nombre        string   `json:"nombre"`
    VelocidadMbps int      `json:"velocidad_mbps"`
    Precio        float64  `json:"precio"`
    PrecioAR      string  `json:"precio_ar"` // Se calcula antes de enviar la respuesta
    Descripcion   *string  `json:"descripcion,omitempty"`
}
