package utilidades

import "fmt"

// ToString convierte cualquier valor a string
func ToString(v interface{}) string {
return fmt.Sprintf("%v", v)
}
