# ONE Internet - Sistema de Gestión de Contratos

Sistema web completo para la gestión de contratos de servicios de internet, con frontend en Node.js/Express y backend en Go.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **Go** v1.25.0 o superior
- **MySQL** 8.0 o superior
- **Git**

## 🏗️ Estructura del Proyecto

```
.
├── index.html              # Página principal
├── frontend/               # Servidor web y frontend
│   ├── server.js          # Servidor Express
│   ├── src/               # Código fuente frontend
│   └── public/            # Recursos estáticos
└── backend/               # Servicios backend en Go
    ├── contrato_one_internet_controlador/  # Microservicio controlador
    └── contrato_one_internet_modelo/       # Microservicio modelo
```

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd projectONE
```

### 2. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Compilar CSS con Tailwind
npm run build:css
```

### 3. Configurar Backend - Controlador

```bash
cd backend/contrato_one_internet_controlador

# Descargar dependencias de Go
go mod download

# Compilar el binario
go build -o bin/controlador main.go
```

### 4. Configurar Backend - Modelo

```bash
cd ../contrato_one_internet_modelo

# Descargar dependencias de Go
go mod download

# Compilar el binario
go build -o bin/modelo main.go
```

### 5. Configurar Variables de Entorno

Crear archivos `.env` en cada microservicio con las siguientes variables:

#### Frontend (`frontend/.env`)
```env
PORT=5500
NODE_ENV=production
```

#### Controlador (`backend/contrato_one_internet_controlador/.env`)
```env
API_PORT=8080
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```

#### Modelo (`backend/contrato_one_internet_modelo/.env`)
```env
SERVER_PORT=8081
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=contratos_db
JWT_SECRET=your-secret-key
```

### 6. Configurar Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Crear base de datos
CREATE DATABASE contratos_db;

# Importar esquema (si existe archivo SQL)
mysql -u root -p contratos_db < database/schema.sql
```

## ▶️ Ejecución

### Desarrollo

#### Terminal 1 - Frontend
```bash
cd frontend
npm start
# Servidor corriendo en http://localhost:5500
```

#### Terminal 2 - Backend Controlador
```bash
cd backend/contrato_one_internet_controlador
go run main.go
# Servidor corriendo en puerto 8080
```

#### Terminal 3 - Backend Modelo
```bash
cd backend/contrato_one_internet_modelo
go run main.go
# Servidor corriendo en puerto 8081
```

#### Terminal 4 - Watch CSS (opcional)
```bash
cd frontend
npm run watch:css
# Compilación automática de Tailwind CSS
```

### Producción

#### Frontend
```bash
cd frontend
npm run build:css
npm start
```

#### Backend (usando binarios compilados)
```bash
# Controlador
cd backend/contrato_one_internet_controlador
./bin/controlador

# Modelo
cd backend/contrato_one_internet_modelo
./bin/modelo
```

## 🧪 Testing

```bash
cd frontend
npm test
```

## 📦 Dependencias Principales

### Frontend
- **Express** 5.1.0 - Servidor web
- **Tailwind CSS** 4.1.17 - Framework CSS
- **Helmet** 8.1.0 - Seguridad HTTP
- **jsonwebtoken** 9.0.2 - Autenticación JWT

### Backend
- **gorilla/mux** - Router HTTP
- **golang-jwt/jwt** - Manejo de JWT
- **go-sql-driver/mysql** - Driver MySQL
- **godotenv** - Variables de entorno

## 🔒 Seguridad

- Implementación de helmet.js para headers de seguridad
- Rate limiting en endpoints
- Autenticación JWT
- Content Security Policy (CSP)
- Validación de entradas

## 📝 Scripts Disponibles

### Frontend
```bash
npm start          # Iniciar servidor
npm test           # Ejecutar tests
npm run build:css  # Compilar CSS
npm run watch:css  # Watch mode para CSS
```

## 🛠️ Troubleshooting

### Puerto en uso
Si el puerto está ocupado, cambiar en `.env`:
```env
PORT=3000  # o cualquier otro puerto disponible
```

### Error de conexión a base de datos
Verificar credenciales en `backend/contrato_one_internet_modelo/.env` y que MySQL esté corriendo.

### Error al compilar Go
Asegurarse de tener Go 1.25.0 o superior:
```bash
go version
```

## 📄 Licencia

ISC

## 👥 Equipo

Choque Emiliano
Cabeda Mariano
Medina Lucas
Dávila Nicolás
Barroso Gonzalo
