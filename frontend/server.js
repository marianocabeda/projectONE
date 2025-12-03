const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5500;
const isProduction = process.env.NODE_ENV === 'production';

// Directorio base: /var/www/html (donde está el index.html real)
const BASE_DIR = path.join(__dirname, '..', '..');

// Configure trust proxy - necessary when behind Apache/nginx
app.set('trust proxy', 1);

// Parse cookies
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para generar nonce único por request (para CSP)
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet: Headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://unpkg.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "https://*.ytimg.com",
        "https://*.youtube.com",
        "https://*.googlevideo.com",
        (req, res) => `'nonce-${res.locals.cspNonce}'`
      ],
      styleSrc: [
        "'self'",
        "https://unpkg.com",
        "https://fonts.googleapis.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        (req, res) => `'nonce-${res.locals.cspNonce}'`
      ],
      // Permitir elementos de script/estilo cargados desde CDN (evita fallback warnings)
      scriptSrcElem: [
        "'self'",
        "https://unpkg.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "https://*.ytimg.com",
        "https://*.youtube.com",
        "https://*.googlevideo.com",
        (req, res) => `'nonce-${res.locals.cspNonce}'`
      ],
      styleSrcElem: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://unpkg.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        (req, res) => `'nonce-${res.locals.cspNonce}'`
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      connectSrc: [
        "'self'",
        isProduction ? "https://api.oneinternet.com.ar" : "http://localhost:8080",
        "https://nominatim.openstreetmap.org",
        "https://unpkg.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "https://*.googlevideo.com",
        "https://*.youtube.com",
      ],
      frameSrc: [
        "'self'",
        "blob:",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "https://www.google.com",
        "https://maps.google.com",
      ],
      mediaSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "blob:",
      ],
      childSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "blob:",
      ],
      objectSrc: ["'none'"],
      workerSrc: [
        "'self'",
        "blob:"
      ],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      scriptSrcAttr: ["'unsafe-inline'"], // Necesario para atributos de eventos inline de YouTube
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir carga de recursos externos
}));

// Rate limiting: Prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProduction ? 100 : 1000, // Límite por IP (más permisivo en desarrollo)
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  // Serve the 429 HTML page when limit is reached
  handler: (req, res /*, next */) => {
    try {
      const filePath = path.join(__dirname, "src/views/pages/errors/429.html");
      res.status(429).sendFile(filePath);
    } catch (err) {
      console.error('Error returning 429 page:', err);
      res.status(429).json({ error: 'Too many requests' });
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Excluir archivos estáticos del rate limiting
  skip: (req) => {
    // No aplicar rate limit a assets estáticos (CSS, JS, imágenes, fonts)
    const staticPaths = [
      '/public/',
      '/favicon.ico'
    ];
    return staticPaths.some(path => req.path.startsWith(path));
  }
});

// Aplicar rate limiting a todas las rutas (excepto assets estáticos)
app.use(limiter);

// Rate limiting más estricto para rutas de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isProduction ? 5 : 50, // 5 intentos en producción, 50 en desarrollo
  message: 'Demasiados intentos de autenticación. Por favor, espere 15 minutos.',
  handler: (req, res /*, next */) => {
    try {
      const filePath = path.join(__dirname, "src/views/pages/errors/429.html");
      res.status(429).sendFile(filePath);
    } catch (err) {
      console.error('Error returning 429 page (authLimiter):', err);
      res.status(429).json({ error: 'Too many requests' });
    }
  },
  skipSuccessfulRequests: false,
});

app.use('/login', authLimiter);
app.use('/registro', authLimiter);
app.use('/forgot-password', authLimiter);

// ============================================================================
// CSRF PROTECTION
// ============================================================================

// Generar token CSRF para cada sesión
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware para inyectar CSRF token en páginas HTML
app.use((req, res, next) => {
  // Solo para rutas HTML (no API, no assets)
  if (!req.path.startsWith('/api') && 
      !req.path.startsWith('/js') && 
      !req.path.startsWith('/public') &&
      !req.path.startsWith('/images')) {
    
    // Generar o reutilizar token CSRF
    let csrfToken = req.cookies._csrf;
    if (!csrfToken) {
      csrfToken = generateCsrfToken();
      res.cookie('_csrf', csrfToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 3600000, // 1 hora
      });
    }
    
    // Hacer disponible para las vistas
    res.locals.csrfToken = csrfToken;
  }
  next();
});

// Endpoint para obtener token CSRF via JavaScript
app.get('/api/csrf-token', (req, res) => {
  let csrfToken = req.cookies._csrf;
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie('_csrf', csrfToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 3600000,
    });
  }
  res.json({ csrfToken });
});

// ============================================================================
// MIDDLEWARE - Configuración de archivos estáticos y reescritura de URLs
// ============================================================================

// Rewrite middleware: Maneja URLs con prefijo `/contratos/`
app.use((req, res, next) => {
  if (req.url.startsWith('/contratos/')) {
    req.url = req.url.replace(/^\/contratos/, '');
  }
  next();
});

// Las rutas /api son manejadas directamente por Apache → Backend (puerto 8080)
// Express solo sirve el frontend

// Servir archivos estáticos desde /var/www/html/contratos/frontend
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/js', express.static(path.join(__dirname, 'src/assets/js')));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

// Servir archivos estáticos generales
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'src')));

// ============================================================================
// RUTA PRINCIPAL
// ============================================================================

app.get("/", (req, res) => {
  res.sendFile(path.join(BASE_DIR, "contratos", "index.html"));
});

// ============================================================================
// RUTAS DE AUTENTICACIÓN (6 rutas)
// ============================================================================

// Login y registro
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/auth/login.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/auth/registro.html"));
});

app.get("/formulario", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/auth/form.html"));
});

// Recuperación de contraseña
app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/auth/forgot-password.html"));
});

app.get("/cambiar-password", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/auth/cambiar-pass-olvidada.html"));
});

// Verificación de email
app.get("/verificar-email", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/auth/verificar-email.html"));
});

// ============================================================================
// RUTAS DEL DASHBOARD (13 rutas)
// ============================================================================

// Middleware para detectar si es navegación directa (URL en barra de direcciones) 
// vs carga interna (fetch desde dashboard.js)
const dashboardRedirectMiddleware = (htmlFile, panel) => {
  return (req, res) => {
    const secFetchDest = req.headers['sec-fetch-dest'];
    const secFetchMode = req.headers['sec-fetch-mode'];
    
    // Si sec-fetch-dest es 'document', es navegación directa del navegador
    // Si es undefined o 'empty', es fetch() desde JavaScript
    if (secFetchDest === 'document' || secFetchMode === 'navigate') {
      // Navegación directa: NO redirigimos a /dashboard?panel=...
      // El dashboard principal sólo se maneja desde /dashboard. Si alguien
      // intenta navegar directamente a un partial como /home o /admin-panel
      // devolvemos 404 para evitar embebidos incorrectos.
      console.warn(`Direct navigation to a partial route (${req.path}) detected — returning 404 to avoid embedding.`);
      res.status(404).sendFile(path.join(__dirname, "src/views/pages/errors/404.html"));
    } else {
      // Fetch interno: servir el HTML para carga dinámica
      // Verificar si el archivo existe
      const filePath = path.join(__dirname, htmlFile);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error(`Error al servir archivo: ${htmlFile}`, err);
          res.status(404).sendFile(path.join(__dirname, "src/views/pages/errors/404.html"));
        }
      });
    }
  };
};

// Dashboard principal
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/dashboard/dashboard.html"));
});

app.get("/home", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/home.html", "home"));

// Gestión de usuario
app.get("/usuario", dashboardRedirectMiddleware("src/views/pages/dashboard/usuario.html", "usuario"));

app.get("/ajustes", dashboardRedirectMiddleware("src/views/pages/dashboard/ajustes.html", "ajustes"));

app.get("/cambiar-contrasena", dashboardRedirectMiddleware("src/views/pages/dashboard/cambiar-contrasena.html", "cambiar-contrasena"));

// Gestión de empresas y conexiones
app.get("/registrar-empresa", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/registrar-empresa.html", "registrar-empresa"));

app.get("/conexiones", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/conexiones.html", "conexiones"));

// Servicios y facturación
app.get("/planes", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/planes.html", "planes"));

app.get("/facturas", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/facturas.html", "facturas"));

app.get("/promociones", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/promociones.html", "promociones"));

// Soporte y solicitudes
app.get("/soporte", dashboardRedirectMiddleware("src/views/pages/dashboard/soporte.html", "soporte"));

app.get("/solicitudes-cola", dashboardRedirectMiddleware("src/views/pages/dashboard/verificador/solicitudes-cola.html", "solicitudes-cola"));

// Panel de administración
app.get("/admin-panel", dashboardRedirectMiddleware("src/views/pages/dashboard/admin/admin-panel.html", "admin-panel"));

app.get("/historial-solicitudes", dashboardRedirectMiddleware("src/views/pages/dashboard/verificador/historial-solicitudes.html", "historial-solicitudes"));

app.get("/ver-contrato", dashboardRedirectMiddleware("src/views/pages/dashboard/cliente/ver-contrato.html", "ver-contrato"));

// Panel de Atención al Público
// Panel de Atención: el 'home' de atención apunta al módulo principal de atención
app.get("/atencion-panel", dashboardRedirectMiddleware("src/views/pages/dashboard/atencion/atencion-panel.html", "atencion-panel"));

app.get("/atencion-nuevas-conexiones", dashboardRedirectMiddleware("src/views/pages/dashboard/atencion/atencion-nuevas-conexiones.html", "atencion-nuevas-conexiones"));

app.get("/atencion-cambio-plan", dashboardRedirectMiddleware("src/views/pages/dashboard/atencion/atencion-cambio-plan.html", "atencion-cambio-plan"));

app.get("/atencion-modificar-datos", dashboardRedirectMiddleware("src/views/pages/dashboard/atencion/atencion-modificar-datos.html", "atencion-modificar-datos"));

app.get("/atencion-soporte", dashboardRedirectMiddleware("src/views/pages/dashboard/atencion/atencion-soporte.html", "atencion-soporte"));

// ============================================================================
// RUTAS DE CONTACTO (2 rutas)
// ============================================================================

app.get("/contacto", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/contact/contacto.html"));
});

app.get("/acercade", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/contact/acercade.html"));
});

// ============================================================================
// RUTAS DE CONTRATOS (1 ruta)
// ============================================================================

app.get("/contrato", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/pages/contract/formulario.html"));
});

// ============================================================================
// RUTA 404 EXPLÍCITA
// ============================================================================

app.get("/404", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "src/views/pages/errors/404.html"));
});

// Explicit route for Too Many Requests page (useful for testing and direct navigation)
app.get('/429', (req, res) => {
  res.status(429).sendFile(path.join(__dirname, 'src/views/pages/errors/429.html'));
});

// ============================================================================
// MANEJO DE ERRORES 404 (catch-all)
// ============================================================================

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "src/views/pages/errors/404.html"));
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Base directory: ${BASE_DIR}`);
  console.log(`📂 Frontend directory: ${__dirname}`);
});
