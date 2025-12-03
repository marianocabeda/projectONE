package servicios

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	"contrato_one_internet_controlador/internal/modelos"
)

// ======================================
// 🧱 Definición del cliente Modelo
// ======================================

type ModeloClient struct {
	baseURL    string
	httpClient *http.Client
	mu         sync.Mutex
	token      string
}

// ======================================
// ❗ Tipo de error personalizado
// ======================================

type ModeloError struct {
	StatusCode int
	Message    string
}

func (e *ModeloError) Error() string {
	return fmt.Sprintf("modelo devolvió %d: %s", e.StatusCode, e.Message)
}

// ===============================
// 🔐 Inicialización y autenticación
// ===============================

func NewModeloClient(baseURL string) (*ModeloClient, error) {
	client := &ModeloClient{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
	if err := client.authenticate(); err != nil {
		return nil, fmt.Errorf("no se pudo autenticar con el servicio de modelo: %w", err)
	}
	log.Println("Cliente del servicio Modelo autenticado y listo.")
	return client, nil
}

// authenticate obtiene el token interno del servicio Modelo.
func (c *ModeloClient) authenticate() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	url := c.baseURL + "/api/v1/internal/auth/generate-token"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("error autenticando en modelo (status %d)", resp.StatusCode)
	}

	var tokenResp struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return err
	}

	c.token = tokenResp.Token
	log.Println("Token interno actualizado en ModeloClient")
	return nil
}

// GetBaseURL retorna la URL base del servicio modelo
func (c *ModeloClient) GetBaseURL() string {
	return c.baseURL
}

// GetToken retorna el token interno actual
func (c *ModeloClient) GetToken() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.token
}

// ===============================
// ⚙️ Método genérico central
// ===============================

func (c *ModeloClient) DoRequest(
    ctx context.Context,
    method, path string,
    body interface{},
    result interface{},
    useInternalToken bool,
    extraHeaders ...map[string]string, // 👈 variadic = backwards compatible
) error {

    // Convertir headers opcionales
    var headers map[string]string
    if len(extraHeaders) > 0 && extraHeaders[0] != nil {
        headers = extraHeaders[0]
    } else {
        headers = map[string]string{}
    }

    var jsonData []byte
    var err error
    var reqBody io.Reader

    if body != nil {
        jsonData, err = json.Marshal(body)
        if err != nil {
            return fmt.Errorf("error serializando body para %s %s: %w", method, path, err)
        }
        reqBody = bytes.NewBuffer(jsonData)
    }

	// Construir request inicial
	fullURL := c.baseURL + path
	fmt.Printf("DEBUG DoRequest: %s %s\n", method, fullURL)
	req, err := http.NewRequestWithContext(ctx, method, fullURL, reqBody)
	if err != nil {
		return fmt.Errorf("error creando request %s %s: %w", method, path, err)
	}
	
	req.Header.Set("Content-Type", "application/json")

    if useInternalToken {
        c.mu.Lock()
        token := c.token
        c.mu.Unlock()
        req.Header.Set("Authorization", "Bearer "+token)
    }

    // Aplicar headers personalizados
    for k, v := range headers {
        req.Header.Set(k, v)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return fmt.Errorf("error ejecutando request %s %s: %w", method, path, err)
    }
    defer resp.Body.Close()

    // Si expiró el token => reintentar
    if useInternalToken && resp.StatusCode == http.StatusUnauthorized {
        if err := c.authenticate(); err != nil {
            return fmt.Errorf("error renovando token: %w", err)
        }

        c.mu.Lock()
        newToken := c.token
        c.mu.Unlock()

        // Reconstruir body para el reintento
        var retryBody io.Reader
        if body != nil {
            retryBody = bytes.NewReader(jsonData)
        }

        req, err = http.NewRequestWithContext(ctx, method, c.baseURL+path, retryBody)
        if err != nil {
            return fmt.Errorf("error recreando request tras renovar token: %w", err)
        }

        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("Authorization", "Bearer "+newToken)

        for k, v := range headers {
            req.Header.Set(k, v)
        }

        resp, err = c.httpClient.Do(req)
        if err != nil {
            return fmt.Errorf("error reintentando request tras renovar token: %w", err)
        }
        defer resp.Body.Close()
    }

    respBytes, err := io.ReadAll(resp.Body)
    if err != nil {
        return fmt.Errorf("error leyendo respuesta de %s %s: %w", method, path, err)
    }

    if resp.StatusCode >= 300 {
        var apiErr map[string]interface{}
        _ = json.Unmarshal(respBytes, &apiErr)

        msg := string(respBytes)
        if m, ok := apiErr["error"].(string); ok {
            msg = m
        }

        return &ModeloError{StatusCode: resp.StatusCode, Message: msg}
    }

    if result != nil && len(respBytes) > 0 {
        if err := json.Unmarshal(respBytes, result); err != nil {
            return fmt.Errorf("error al decodificar respuesta del modelo en %s %s: %w", method, path, err)
        }
    }

    return nil
}

/*
func (c *ModeloClient) DoRequest(
	ctx context.Context,
	method, path string,
	body interface{},
	result interface{},
	useInternalToken bool,
) error {
	var jsonData []byte
	var err error

	// 1️- Serializar el body si existe
	var reqBody io.Reader
	if body != nil {
		jsonData, err = json.Marshal(body)
		if err != nil {
			return fmt.Errorf("error serializando body para %s %s: %w", method, path, err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	// 2️- Construir la request inicial
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reqBody)
	if err != nil {
		return fmt.Errorf("error creando request %s %s: %w", method, path, err)
	}
	req.Header.Set("Content-Type", "application/json")

	// 3️- Agregar token interno si corresponde
	if useInternalToken {
		c.mu.Lock()
		token := c.token
		c.mu.Unlock()
		fmt.Printf("DEBUG: Usando token interno: %s...\n", token[:50])
		req.Header.Set("Authorization", "Bearer "+token)
	}

	// 4️- Ejecutar la request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("error ejecutando request %s %s: %w", method, path, err)
	}
	defer resp.Body.Close()

	// 5️- Si el token expiró, reautenticar y reintentar
	if useInternalToken && resp.StatusCode == http.StatusUnauthorized {
		if err := c.authenticate(); err != nil {
			return fmt.Errorf("error renovando token: %w", err)
		}

		c.mu.Lock()
		newToken := c.token
		c.mu.Unlock()

		// Recrear request con nuevo token y mismo body
		var retryBody io.Reader
		if body != nil {
			retryBody = bytes.NewReader(jsonData)
		}
		req, err = http.NewRequestWithContext(ctx, method, c.baseURL+path, retryBody)
		if err != nil {
			return fmt.Errorf("error recreando request tras renovar token: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+newToken)

		resp, err = c.httpClient.Do(req)
		if err != nil {
			return fmt.Errorf("error reintentando request tras renovar token: %w", err)
		}
		defer resp.Body.Close()
	}

	// 6️- Leer respuesta
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error leyendo respuesta de %s %s: %w", method, path, err)
	}

	// 7- Manejar errores del servicio Modelo
	if resp.StatusCode >= 300 {
		var apiErr map[string]interface{}
		_ = json.Unmarshal(respBytes, &apiErr)

		msg := string(respBytes)
		if m, ok := apiErr["error"].(string); ok {
			msg = m
		}
		// 👇 devolvemos un error tipado (no texto crudo)
		return &ModeloError{
			StatusCode: resp.StatusCode,
			Message:    msg,
		}
	}
	/*if resp.StatusCode >= 300 {
		var apiErr map[string]interface{}
		_ = json.Unmarshal(respBytes, &apiErr)

		if msg, ok := apiErr["error"].(string); ok {
			return fmt.Errorf("modelo (%s %s) devolvió error %d: %s", method, path, resp.StatusCode, msg)
		}
		return fmt.Errorf("modelo (%s %s) devolvió status %d: %s", method, path, resp.StatusCode, string(respBytes))
	}*/

	// 8- Decodificar respuesta (si hay)
	// ⚙️ Métodos para estados de conexión
	// ===============================
/*
	if result != nil && len(respBytes) > 0 {
		if err := json.Unmarshal(respBytes, result); err != nil {
			return fmt.Errorf("error al decodificar respuesta del modelo en %s %s: %w", method, path, err)
		}
	}

	return nil
}*/

// ===============================
// 📦 Endpoints públicos (sin token interno)
// ===============================

func (c *ModeloClient) ValidarCredenciales(ctx context.Context, email, password, clientIP, userAgent string) (*modelos.ModeloLoginResponse, error) {
	req := modelos.ModeloLoginRequest{
		Email:     email,
		Password:  password,
		ClientIP:  clientIP,
		UserAgent: userAgent,
	}
	var result modelos.ModeloLoginResponse
	if err := c.DoRequest(ctx, "POST", "/api/v1/auth/login", req, &result, false); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *ModeloClient) Refresh(ctx context.Context, refreshToken string) (*modelos.ModeloLoginResponse, error) {
	payload := map[string]string{"refresh_token": refreshToken}
	var result modelos.ModeloLoginResponse
	if err := c.DoRequest(ctx, "POST", "/api/v1/auth/refresh", payload, &result, false); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *ModeloClient) Logout(ctx context.Context, refreshToken string) error {
	payload := map[string]string{"refresh_token": refreshToken}
	return c.DoRequest(ctx, "POST", "/api/v1/auth/logout", payload, nil, false)
}

func (c *ModeloClient) VerificarEmail(ctx context.Context, token string) error {
	payload := map[string]string{"token": token}
	return c.DoRequest(ctx, "POST", "/api/v1/auth/verificar-email", payload, nil, true)
}

func (c *ModeloClient) ResendVerification(ctx context.Context, email string) (string, time.Time, error) {
	payload := map[string]string{"email": email}
	var resp map[string]string
	if err := c.DoRequest(ctx, "POST", "/api/v1/auth/resend-verification", payload, &resp, false); err != nil {
		return "", time.Time{}, err
	}
	token := resp["token"]
	expires, _ := time.Parse(time.RFC3339, resp["expires_at"])
	return token, expires, nil
}

func (c *ModeloClient) SolicitarReset(ctx context.Context, email string) (string, time.Time, error) {
	payload := map[string]string{"email": email}
	var resp map[string]string
	if err := c.DoRequest(ctx, "POST", "/api/v1/auth/solicitar-reset", payload, &resp, false); err != nil {
		return "", time.Time{}, err
	}
	token := resp["token"]
	expires, _ := time.Parse(time.RFC3339, resp["expires_at"])
	return token, expires, nil
}

func (c *ModeloClient) CambiarPassword(ctx context.Context, token, nuevaPassword string) error {
	payload := map[string]string{"token": token, "nueva_password": nuevaPassword}
	return c.DoRequest(ctx, "POST", "/api/v1/auth/cambiar-password", payload, nil, false)
}

// CheckEmail pregunta al servicio Modelo si un email está disponible.
func (c *ModeloClient) CheckEmail(ctx context.Context, email string) (bool, error) {
	var resp map[string]bool
	path := "/api/v1/internal/auth/check-email?email=" + url.QueryEscape(email)
	if err := c.DoRequest(ctx, "GET", path, nil, &resp, true); err != nil {
		return false, err
	}
	if v, ok := resp["disponible"]; ok {
		return v, nil
	}
	return false, fmt.Errorf("respuesta inválida del modelo")
}

// ===============================
// 🔒 Endpoints internos (requieren token interno)
// ===============================

func (c *ModeloClient) ChangePasswordAuthenticated(ctx context.Context, idUsuario int, ActualPassword, NuevaPassword string) error {
	payload := map[string]interface{}{
		"id_usuario":      idUsuario,
		"actual_password": ActualPassword,
		"nueva_password":  NuevaPassword,
	}
	return c.DoRequest(ctx, "POST", "/api/v1/internal/auth/change-password", payload, nil, true)
}

// CreatePlan solicita al Modelo la creación de un plan (interno, requiere token interno)
func (c *ModeloClient) CreatePlan(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/planes", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_plan"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) GetEstadosConexion(ctx context.Context) ([]modelos.EstadoConexion, error) {
	var resp map[string][]modelos.EstadoConexion
	if err := c.DoRequest(ctx, "GET", "/api/v1/estados-conexion", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["estados_conexion"], nil
}

func (c *ModeloClient) GetEstadoConexionByID(ctx context.Context, id int) (*modelos.EstadoConexion, error) {
	var e modelos.EstadoConexion
	path := fmt.Sprintf("/api/v1/estados-conexion/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &e, false); err != nil {
		return nil, err
	}
	return &e, nil
}

func (c *ModeloClient) CreateEstadoConexion(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/estados-conexion", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_estado_conexion"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateEstadoConexion(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/estados-conexion/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteEstadoConexion(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/estados-conexion/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}
func (c *ModeloClient) UpdatePlan(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/planes/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeletePlan(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/planes/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// GetTipoEmpresas obtiene lista pública de tipos de empresa desde el Modelo
func (c *ModeloClient) GetTipoEmpresas(ctx context.Context) ([]modelos.TipoEmpresa, error) {
	var resp map[string][]modelos.TipoEmpresa
	if err := c.DoRequest(ctx, "GET", "/api/v1/tipo-empresa", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["tipos_empresa"], nil
}

func (c *ModeloClient) GetTipoEmpresaByID(ctx context.Context, id int) (*modelos.TipoEmpresa, error) {
	var t modelos.TipoEmpresa
	path := fmt.Sprintf("/api/v1/tipo-empresa/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &t, false); err != nil {
		return nil, err
	}
	return &t, nil
}

// CreateTipoEmpresa crea un nuevo tipo de empresa (requiere token interno)
func (c *ModeloClient) CreateTipoEmpresa(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/tipo-empresa", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_tipo_empresa"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateTipoEmpresa(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/tipo-empresa/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteTipoEmpresa(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/tipo-empresa/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// === Tipo IVA client methods ===
func (c *ModeloClient) GetTiposIVA(ctx context.Context) ([]modelos.TipoIVA, error) {
	var resp map[string][]modelos.TipoIVA
	if err := c.DoRequest(ctx, "GET", "/api/v1/tipo-iva", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["tipos_iva"], nil
}

func (c *ModeloClient) GetTipoIVAByID(ctx context.Context, id int) (*modelos.TipoIVA, error) {
	var t modelos.TipoIVA
	path := fmt.Sprintf("/api/v1/tipo-iva/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &t, false); err != nil {
		return nil, err
	}
	return &t, nil
}

func (c *ModeloClient) CreateTipoIVA(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/tipo-iva", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_tipo_iva"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateTipoIVA(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/tipo-iva/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteTipoIVA(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/tipo-iva/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// === Vinculo client methods ===
func (c *ModeloClient) GetVinculos(ctx context.Context) ([]modelos.Vinculo, error) {
	var resp map[string][]modelos.Vinculo
	if err := c.DoRequest(ctx, "GET", "/api/v1/vinculos", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["vinculos"], nil
}

func (c *ModeloClient) GetVinculoByID(ctx context.Context, id int) (*modelos.Vinculo, error) {
	var v modelos.Vinculo
	path := fmt.Sprintf("/api/v1/vinculos/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &v, false); err != nil {
		return nil, err
	}
	return &v, nil
}

func (c *ModeloClient) CreateVinculo(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/vinculos", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_vinculo"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateVinculo(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/vinculos/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteVinculo(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/vinculos/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// === EstadoContrato client methods ===
func (c *ModeloClient) GetEstadosContrato(ctx context.Context) ([]modelos.EstadoContrato, error) {
	var resp map[string][]modelos.EstadoContrato
	if err := c.DoRequest(ctx, "GET", "/api/v1/estados-contrato", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["estados_contrato"], nil
}

func (c *ModeloClient) GetEstadoContratoByID(ctx context.Context, id int) (*modelos.EstadoContrato, error) {
	var e modelos.EstadoContrato
	path := fmt.Sprintf("/api/v1/estados-contrato/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &e, false); err != nil {
		return nil, err
	}
	return &e, nil
}

func (c *ModeloClient) CreateEstadoContrato(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/estados-contrato", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_estado_contrato"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateEstadoContrato(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/estados-contrato/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteEstadoContrato(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/estados-contrato/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// === Cargos client methods ===
func (c *ModeloClient) GetCargos(ctx context.Context) ([]modelos.Cargo, error) {
	var resp map[string][]modelos.Cargo
	if err := c.DoRequest(ctx, "GET", "/api/v1/cargos", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["cargos"], nil
}

func (c *ModeloClient) GetCargoByID(ctx context.Context, id int) (*modelos.Cargo, error) {
	var out modelos.Cargo
	path := fmt.Sprintf("/api/v1/cargos/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &out, false); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *ModeloClient) CreateCargo(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/cargos", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_cargo"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateCargo(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/cargos/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteCargo(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/cargos/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// === Roles client methods ===
func (c *ModeloClient) GetRoles(ctx context.Context) ([]modelos.Rol, error) {
	var resp map[string][]modelos.Rol
	if err := c.DoRequest(ctx, "GET", "/api/v1/roles", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["roles"], nil
}

func (c *ModeloClient) GetRoleByID(ctx context.Context, id int) (*modelos.Rol, error) {
	var out modelos.Rol
	path := fmt.Sprintf("/api/v1/roles/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &out, false); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *ModeloClient) CreateRole(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/roles", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_rol"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdateRole(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/roles/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeleteRole(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/roles/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

// === Permisos client methods ===
func (c *ModeloClient) GetPermisos(ctx context.Context) ([]modelos.Permiso, error) {
	var resp map[string][]modelos.Permiso
	if err := c.DoRequest(ctx, "GET", "/api/v1/permisos", nil, &resp, false); err != nil {
		return nil, err
	}
	return resp["permisos"], nil
}

// GetPermisosPaginados obtiene permisos activos con paginación y filtros desde el Modelo
func (c *ModeloClient) GetPermisosPaginados(ctx context.Context, page, limit int, nombre, orden string) (map[string]interface{}, error) {
	// construir query
	path := fmt.Sprintf("/api/v1/permisos?page=%d&limit=%d", page, limit)
	if nombre != "" {
		path = path + "&nombre=" + url.QueryEscape(nombre)
	}
	if orden != "" {
		path = path + "&orden=" + url.QueryEscape(orden)
	}
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "GET", path, nil, &resp, false); err != nil {
		return nil, err
	}
	return resp, nil
}

// GetPermisosInactivosPaginados obtiene permisos borrados con paginación y filtros desde el Modelo
func (c *ModeloClient) GetPermisosInactivosPaginados(ctx context.Context, page, limit int, nombre, orden string) (map[string]interface{}, error) {
	path := fmt.Sprintf("/api/v1/permisos/inactivos?page=%d&limit=%d", page, limit)
	if nombre != "" {
		path = path + "&nombre=" + url.QueryEscape(nombre)
	}
	if orden != "" {
		path = path + "&orden=" + url.QueryEscape(orden)
	}
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "GET", path, nil, &resp, false); err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *ModeloClient) ReactivarPermiso(ctx context.Context, id int) (map[string]interface{}, error) {
	path := fmt.Sprintf("/api/v1/internal/permisos/%d/reactivar", id)
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "PUT", path, nil, &resp, true); err != nil {
		return nil, err
	}
	return resp, nil
}

func (c *ModeloClient) GetPermisoByID(ctx context.Context, id int) (*modelos.Permiso, error) {
	var out modelos.Permiso
	path := fmt.Sprintf("/api/v1/permisos/%d", id)
	if err := c.DoRequest(ctx, "GET", path, nil, &out, false); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *ModeloClient) CreatePermiso(ctx context.Context, payload interface{}) (int64, error) {
	var resp map[string]interface{}
	if err := c.DoRequest(ctx, "POST", "/api/v1/internal/permisos", payload, &resp, true); err != nil {
		return 0, err
	}
	if idv, ok := resp["id_permiso"]; ok {
		switch t := idv.(type) {
		case float64:
			return int64(t), nil
		case int64:
			return t, nil
		case int:
			return int64(t), nil
		}
	}
	return 0, fmt.Errorf("respuesta inválida del modelo")
}

func (c *ModeloClient) UpdatePermiso(ctx context.Context, id int, payload interface{}) error {
	path := fmt.Sprintf("/api/v1/internal/permisos/%d", id)
	return c.DoRequest(ctx, "PATCH", path, payload, nil, true)
}

func (c *ModeloClient) DeletePermiso(ctx context.Context, id int) error {
	path := fmt.Sprintf("/api/v1/internal/permisos/%d", id)
	return c.DoRequest(ctx, "DELETE", path, nil, nil, true)
}

func (c *ModeloClient) GetNotificaciones(
    ctx context.Context,
    idPersona int,
    leido *int,
    page, pageSize int,
    sortBy, sortDirection string,
) (*modelos.NotificacionesResponse, error) {

    path := fmt.Sprintf(
        "/api/v1/internal/notificaciones?page=%d&pageSize=%d",
        page, pageSize,
    )

    if leido != nil {
        path += fmt.Sprintf("&leido=%d", *leido)
    }
    if sortBy != "" {
        path += "&sort_by=" + url.QueryEscape(sortBy)
    }
    if sortDirection != "" {
        path += "&sort_direction=" + url.QueryEscape(sortDirection)
    }

    headers := map[string]string{
        "X-ID-Persona": fmt.Sprintf("%d", idPersona),
    }

    var resp modelos.NotificacionesResponse
    if err := c.DoRequest(ctx, "GET", path, nil, &resp, true, headers); err != nil {
        return nil, err
    }

    return &resp, nil
}


func (c *ModeloClient) MarcarNotificacionComoLeida(
    ctx context.Context,
    idPersona int,
    idNotificacion int,
) error {

    payload := map[string]int{
        "id_notificacion": idNotificacion,
    }

    headers := map[string]string{
        "X-ID-Persona": fmt.Sprintf("%d", idPersona),
    }

    return c.DoRequest(
        ctx,
        "POST",
        "/api/v1/internal/notificaciones/marcar-como-leida",
        payload,
        nil,
        true,
        headers,
    )
}

// GetMisContratos obtiene los contratos del usuario autenticado
func (c *ModeloClient) GetMisContratos(
    ctx context.Context,
    idPersona int,
    page, limit int,
    sortBy, sortOrder string,
) (*modelos.MisContratosResponse, error) {

    path := fmt.Sprintf(
        "/api/v1/internal/perfil/contratos?page=%d&limit=%d",
        page, limit,
    )

    if sortBy != "" {
        path += "&sort=" + url.QueryEscape(sortBy)
    }
    if sortOrder != "" {
        path += "&order=" + url.QueryEscape(sortOrder)
    }

    headers := map[string]string{
        "X-ID-Persona": fmt.Sprintf("%d", idPersona),
    }

    var resp modelos.MisContratosResponse
    if err := c.DoRequest(ctx, "GET", path, nil, &resp, true, headers); err != nil {
        return nil, err
    }

    return &resp, nil
}

// GetMisConexiones obtiene las conexiones del usuario autenticado
func (c *ModeloClient) GetMisConexiones(
    ctx context.Context,
    idPersona int,
    page, limit int,
    sortBy, sortOrder string,
) (*modelos.MisConexionesResponse, error) {

    path := fmt.Sprintf(
        "/api/v1/internal/perfil/conexiones?page=%d&limit=%d",
        page, limit,
    )

    if sortBy != "" {
        path += "&sort=" + url.QueryEscape(sortBy)
    }
    if sortOrder != "" {
        path += "&order=" + url.QueryEscape(sortOrder)
    }

    headers := map[string]string{
        "X-ID-Persona": fmt.Sprintf("%d", idPersona),
    }

    var resp modelos.MisConexionesResponse
    if err := c.DoRequest(ctx, "GET", path, nil, &resp, true, headers); err != nil {
        return nil, err
    }

    return &resp, nil
}

// ===============================
// 📄 Métodos para Contrato Firma
// ===============================

// SimularPago simula el pago e inicia el proceso de firma
func (c *ModeloClient) SimularPago(ctx context.Context, idPersona, idContrato string) (map[string]interface{}, error) {
path := fmt.Sprintf("/api/v1/internal/simular-pago/%s/%s", idPersona, idContrato)

var result map[string]interface{}
if err := c.DoRequest(ctx, "POST", path, nil, &result, true); err != nil {
return nil, err
}

return result, nil
}

// GuardarFirma guarda la firma canvas
func (c *ModeloClient) GuardarFirma(ctx context.Context, idContratoFirma string, body map[string]interface{}) (map[string]interface{}, error) {
path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s/firma", idContratoFirma)

var result map[string]interface{}
if err := c.DoRequest(ctx, "POST", path, body, &result, true); err != nil {
return nil, err
}

return result, nil
}

// ValidarToken valida el token y firma el contrato
func (c *ModeloClient) ValidarToken(ctx context.Context, idContratoFirma string, body map[string]interface{}) (map[string]interface{}, error) {
path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s/validar-token", idContratoFirma)

var result map[string]interface{}
if err := c.DoRequest(ctx, "POST", path, body, &result, true); err != nil {
return nil, err
}

return result, nil
}

// ObtenerContratoFirma obtiene el estado del contrato_firma
func (c *ModeloClient) ObtenerContratoFirma(ctx context.Context, idContratoFirma string) (map[string]interface{}, error) {
path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s", idContratoFirma)

var result map[string]interface{}
	if err := c.DoRequest(ctx, "GET", path, nil, &result, true); err != nil {
		return nil, err
	}

	return result, nil
}

// MarcarTokenEnviado notifica al modelo que el token fue enviado al destinatario
func (c *ModeloClient) MarcarTokenEnviado(ctx context.Context, idContratoFirma string) error {
	path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s/token-enviado", idContratoFirma)
	// Usamos DoRequest sin esperar body de respuesta
	if err := c.DoRequest(ctx, "POST", path, nil, nil, true); err != nil {
		return err
	}
	return nil
}

// ReenviarToken solicita al modelo regenerar el token y obtener los datos para reenvío
func (c *ModeloClient) ReenviarToken(ctx context.Context, idContratoFirma string) (map[string]interface{}, error) {
	path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s/reenvio-token", idContratoFirma)

	var result map[string]interface{}
	if err := c.DoRequest(ctx, "POST", path, nil, &result, true); err != nil {
		return nil, err
	}

	return result, nil
}

// ServirPDF obtiene el PDF para visualización (inline)
func (c *ModeloClient) ServirPDF(ctx context.Context, idContratoFirma string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s/pdf", idContratoFirma)
	return c.doStreamRequest(ctx, "GET", path)
}

// DescargarPDF obtiene el PDF para descarga (attachment)
func (c *ModeloClient) DescargarPDF(ctx context.Context, idContratoFirma string) (*http.Response, error) {
	path := fmt.Sprintf("/api/v1/internal/contrato-firma/%s/descargar", idContratoFirma)
	return c.doStreamRequest(ctx, "GET", path)
}

// doStreamRequest maneja requests que retornan contenido binario (PDFs, imágenes, etc)
func (c *ModeloClient) doStreamRequest(ctx context.Context, method, path string) (*http.Response, error) {
	fullURL := c.baseURL + path
	
	req, err := http.NewRequestWithContext(ctx, method, fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creando request %s %s: %w", method, path, err)
	}

	// Agregar token interno
	c.mu.Lock()
	token := c.token
	c.mu.Unlock()
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error ejecutando request %s %s: %w", method, path, err)
	}

	// Si expiró el token, renovar y reintentar
	if resp.StatusCode == http.StatusUnauthorized {
		resp.Body.Close()
		
		if err := c.authenticate(); err != nil {
			return nil, fmt.Errorf("error renovando token: %w", err)
		}

		c.mu.Lock()
		newToken := c.token
		c.mu.Unlock()

		req, err = http.NewRequestWithContext(ctx, method, fullURL, nil)
		if err != nil {
			return nil, fmt.Errorf("error recreando request: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+newToken)

		resp, err = c.httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("error reintentando request: %w", err)
		}
	}

	// Verificar errores HTTP
	if resp.StatusCode >= 300 {
		defer resp.Body.Close()
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, &ModeloError{StatusCode: resp.StatusCode, Message: string(bodyBytes)}
	}

	// Retornar la respuesta completa (el caller debe cerrar el Body)
	return resp, nil
}
