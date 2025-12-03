# Instrucciones para las imágenes del correo

## Archivos requeridos

Para que el sistema de correo electrónico funcione correctamente, necesitas copiar las siguientes imágenes en esta carpeta:

1. **logo-light.png** - Logo de ONE Internet para modo claro (la imagen con las letras de colores naranja, verde y azul)
2. **logo-dark.png** - Logo de ONE Internet para modo oscuro (la imagen con fondo oscuro y letras blancas)

## Ubicación de las imágenes originales

Las imágenes originales que necesitas copiar son:
- `one-blanco.png` → renombrar/copiar como `logo-light.png`
- `one-negro.png` → renombrar/copiar como `logo-dark.png`

## Formato recomendado

- Formato: PNG (con transparencia si es posible)
- Dimensiones sugeridas: 400px de ancho (mínimo)
- Tamaño de archivo: < 100KB cada una para mejor rendimiento de email

## Verificación

Una vez copiadas las imágenes, la carpeta `assets/` debería contener:
```
assets/
├── README.md
├── INSTRUCCIONES.md
├── logo-light.png
└── logo-dark.png
```

## Configuración

Las rutas están configuradas en el archivo `.env`:
```
LOGO_LIGHT_PATH=assets/logo-light.png
LOGO_DARK_PATH=assets/logo-dark.png
```
