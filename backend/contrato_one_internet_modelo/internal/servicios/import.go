package servicios

import (
	"database/sql"
	"fmt"
	"log"

	"contrato_one_internet_modelo/internal/utilidades"
)

// --- 1. ESTRUCTURAS PARA MAPEAR LOS JSON ---

// Para provincias.json
type ProvinciasFileJSON struct {
	Provincias []struct {
		ID     string `json:"id"`
		Nombre string `json:"nombre"`
	} `json:"provincias"`
}

// Para departamentos.json (Aquí están las "Comunas" de CABA)
type DepartamentosFileJSON struct {
	Departamentos []struct {
		ID        string `json:"id"`
		Nombre    string `json:"nombre"`
		Provincia struct {
			ID string `json:"id"`
		} `json:"provincia"`
	} `json:"departamentos"`
}

// Para distritos/localidades.json (Aquí están los "Barrios" como Constitución)
type DistritosFileJSON struct {
	// El código intentará leer cualquiera de estas listas que encuentre en el archivo
	LocalidadesCensales []DatoDistritoJSON `json:"localidades_censales"`
	Localidades         []DatoDistritoJSON `json:"localidades"` // <--- Aquí caerá tu nuevo archivo
	Entidades           []DatoDistritoJSON `json:"entidades"`
}

type DatoDistritoJSON struct {
	ID           string `json:"id"`
	Nombre       string `json:"nombre"`
	// Usamos puntero (*string) para que si viene "id": null, no se rompa el programa
	Departamento struct {
		ID *string `json:"id"`
	} `json:"departamento"`
}

// --- 2. FUNCIÓN PRINCIPAL ---

func ImportarUbicaciones(db *sql.DB, pathProvincias, pathDepartamentos, pathDistritos string) error {
	log.Println("--- INICIANDO IMPORTACIÓN ---")

	// Iniciamos una transacción para velocidad y seguridad
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("error iniciando transacción: %v", err)
	}

	// =========================================================================
	// PASO 1: PROVINCIAS
	// =========================================================================
	var dataProvincias ProvinciasFileJSON
	if err := utilidades.LeerJSON(pathProvincias, &dataProvincias); err != nil {
		tx.Rollback()
		return fmt.Errorf("error leyendo provincias: %v", err)
	}

	// Mapa: ID JSON ("02" para CABA) -> ID DB (int64, ej: 1)
	provinciaMap := make(map[string]int64)

	log.Println(">> Insertando Provincias...")
	for _, p := range dataProvincias.Provincias {
		id, err := getOrCreateProvinciaTx(tx, p.Nombre)
		if err != nil {
			tx.Rollback()
			return err
		}
		provinciaMap[p.ID] = id
	}

	// =========================================================================
	// PASO 2: DEPARTAMENTOS (Incluye las Comunas de CABA)
	// =========================================================================
	var dataDeptos DepartamentosFileJSON
	if err := utilidades.LeerJSON(pathDepartamentos, &dataDeptos); err != nil {
		tx.Rollback()
		return fmt.Errorf("error leyendo departamentos: %v", err)
	}

	// Mapa: ID JSON ("02007" para Comuna 1) -> ID DB (int64)
	departamentoMap := make(map[string]int64)

	log.Println(">> Insertando Departamentos...")
	for _, d := range dataDeptos.Departamentos {
		// Buscamos el ID real de la provincia
		idProvReal, existe := provinciaMap[d.Provincia.ID]
		if !existe {
			continue // Si la provincia no existe, saltamos
		}

		id, err := getOrCreateDepartamentoTx(tx, idProvReal, d.Nombre)
		if err != nil {
			tx.Rollback()
			return err
		}
		departamentoMap[d.ID] = id
	}

	// =========================================================================
	// PASO 3: DISTRITOS (Barrios de CABA y Localidades del resto)
	// =========================================================================
	var dataDistritos DistritosFileJSON
	// Leemos tu archivo "localidades.json"
	if err := utilidades.LeerJSON(pathDistritos, &dataDistritos); err != nil {
		tx.Rollback()
		return fmt.Errorf("error leyendo distritos: %v", err)
	}

	// Unificamos todas las posibles listas en una sola
	var todos []DatoDistritoJSON
	todos = append(todos, dataDistritos.LocalidadesCensales...)
	todos = append(todos, dataDistritos.Localidades...) // <--- Tu archivo se cargará aquí
	todos = append(todos, dataDistritos.Entidades...)

	log.Printf(">> Procesando %d registros de distritos...", len(todos))
	
	insertados := 0
	
	for _, l := range todos {
		if l.Nombre == "" {
			continue
		}

		// 1. Obtenemos el ID del departamento del JSON (ej: "02007")
		// Si es null (como el aglomerado de CABA), lo saltamos
		if l.Departamento.ID == nil {
			continue
		}
		idDeptoJSON := *l.Departamento.ID

		// 2. Buscamos ese ID en el mapa que creamos en el Paso 2
		idDeptoReal, existe := departamentoMap[idDeptoJSON]
		if !existe {
			// Si no encontramos la "Comuna" padre, no podemos guardar el barrio
			continue
		}

		// 3. Insertamos el barrio (ej: "Constitución") vinculado a la Comuna
		_, err := getOrCreateDistritoTx(tx, idDeptoReal, l.Nombre)
		if err != nil {
			tx.Rollback()
			return err
		}
		insertados++
	}

	// Confirmamos los cambios en la BD
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error commit: %v", err)
	}

	log.Printf("--- IMPORTACIÓN EXITOSA ---")
	log.Printf("Total distritos insertados: %d", insertados)
	return nil
}

// --- 3. FUNCIONES SQL (IDEMPOTENTES) ---

func getOrCreateProvinciaTx(tx *sql.Tx, nombre string) (int64, error) {
	var id int64
	err := tx.QueryRow("SELECT id_provincia FROM provincia WHERE nombre = ?", nombre).Scan(&id)
	if err == sql.ErrNoRows {
		res, err := tx.Exec("INSERT INTO provincia (nombre) VALUES (?)", nombre)
		if err != nil { return 0, err }
		return res.LastInsertId()
	}
	return id, nil
}

func getOrCreateDepartamentoTx(tx *sql.Tx, idProv int64, nombre string) (int64, error) {
	var id int64
	// Buscamos por nombre Y provincia
	err := tx.QueryRow("SELECT id_departamento FROM departamento WHERE id_provincia = ? AND nombre = ?", idProv, nombre).Scan(&id)
	if err == sql.ErrNoRows {
		res, err := tx.Exec("INSERT INTO departamento (id_provincia, nombre) VALUES (?, ?)", idProv, nombre)
		if err != nil { return 0, err }
		return res.LastInsertId()
	}
	return id, nil
}

func getOrCreateDistritoTx(tx *sql.Tx, idDept int64, nombre string) (int64, error) {
	var id int64
	// Buscamos por nombre Y departamento
	err := tx.QueryRow("SELECT id_distrito FROM distrito WHERE id_departamento = ? AND nombre = ?", idDept, nombre).Scan(&id)
	if err == sql.ErrNoRows {
		res, err := tx.Exec("INSERT INTO distrito (id_departamento, nombre) VALUES (?, ?)", idDept, nombre)
		if err != nil { return 0, err }
		return res.LastInsertId()
	}
	return id, nil
}