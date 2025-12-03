package utilidades

import (
    "crypto/rand"
    "encoding/hex"
)

// TokenSize define el tamaño estándar (en bytes) para generar tokens seguros.
// 32 bytes = 256 bits → seguridad muy alta.
const TokenSize32 = 32
const TokenSize64 = 64

// GenerarTokenSeguro genera un token seguro de longitud bytesLength bytes y lo devuelve como una cadena hexadecimal.
// Se usa para tokens de verificación, reset de password, refresh tokens, etc.
func GenerarTokenSeguro(bytesLength int) (string, error) {
    b := make([]byte, bytesLength)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    return hex.EncodeToString(b), nil
}