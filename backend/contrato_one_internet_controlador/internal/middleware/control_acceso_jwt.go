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

// NOTA: Las funciones RequirePermission y RequireAllPermissions han sido removidas
// porque los permisos ya no se incluyen en el JWT. 
// Si necesitas verificar permisos, deberás implementar una consulta a la base de datos
// desde el handler correspondiente usando el id_usuario del JWT.







/*
import (
	
	"net/http"
	

	
	"contrato_one_internet_controlador/internal/utilidades"
)

func RBAC(requiredRole string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roles, ok := r.Context().Value("roles").([]string)
			if !ok || !contains(roles, requiredRole) {
				utilidades.EnviarRespuestaError(w, http.StatusForbidden, "Acceso denegado", nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Para admin-only, usa RBAC("admin")*/