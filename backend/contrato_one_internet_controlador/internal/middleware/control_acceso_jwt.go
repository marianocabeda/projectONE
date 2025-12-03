package middleware

import (
	"net/http"

	"contrato_one_internet_controlador/internal/utilidades"
)

// RequireRole verifica si el usuario tiene uno de los roles permitidos
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := GetClaimsFromContext(r.Context())
			if !ok {
				utilidades.ResponderError(w, http.StatusInternalServerError, "Error al leer claims de usuario")
				return
			}

			rolesPermitidos := make(map[string]bool)
			for _, role := range allowedRoles {
				rolesPermitidos[role] = true
			}

			autorizado := false
			for _, userRole := range claims.Roles {
				if rolesPermitidos[userRole] {
					autorizado = true
					break
				}
			}

			if !autorizado {
				utilidades.ResponderError(w, http.StatusForbidden, "No tiene el rol suficiente para esta acción")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// NOTA: Las funciones RequirePermiso y RequireTodosLosPermisos se puede implementar si los permisos se incluyen en el JWT.
// Si se necesita verificar permisos, se debe implementar una consulta a la base de datos desde el handler correspondiente 
// usando el id_usuario del JWT.
