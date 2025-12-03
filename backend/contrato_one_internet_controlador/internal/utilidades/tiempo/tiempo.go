package tiempo

import "fmt"
import "time"

// BuildHumanDuration convierte una duración en una representación legible por humanos
// Se admite minutos, horas y días para duraciones comunes como tiempo de expiración de tokens.
func BuildHumanDuration(dur time.Duration) string {
    minutes := int(dur.Minutes())
    hours := int(dur.Hours())
    days := hours / 24

    switch {
    case minutes < 60:
        if minutes == 1 {
            return "1 minuto"
        }
        return fmt.Sprintf("%d minutos", minutes)

    case hours < 24:
        if hours == 1 {
            return "1 hora"
        }
        return fmt.Sprintf("%d horas", hours)

    default:
        if days == 1 {
            return "1 día"
        }
        return fmt.Sprintf("%d días", days)
    }
}
