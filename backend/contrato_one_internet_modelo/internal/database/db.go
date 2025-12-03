package database

import (
	"database/sql"
	"fmt"
	"log"
	"sync"
	"time"

	"contrato_one_internet_modelo/internal/config"

	_ "github.com/go-sql-driver/mysql"
)

var (
	dbInstance *sql.DB
	once       sync.Once
)

// ConnectDB inicializa y devuelve una instancia singleton de la conexión a la base de datos.
// Utiliza sync.Once para asegurar que la inicialización ocurra solo una vez.
func ConnectDB(cfg config.DBConfig) *sql.DB {
	once.Do(func() {
		// DSN (Data Source Name) con configuración de zona horaria para Argentina.
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=America%%2FArgentina%%2FBuenos_Aires",
			cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName)

		db, err := sql.Open("mysql", dsn)
		if err != nil {
			log.Fatalf("Error fatal al abrir la conexión a la base de datos: %v", err)
		}

		// Verificar que la conexión es válida antes de continuar.
		if err := db.Ping(); err != nil {
			log.Fatalf("No se pudo hacer ping a la base de datos: %v", err)
		}

		dbInstance = db
		log.Println("Conexión a la base de datos establecida exitosamente (singleton).")
	})

	return dbInstance
}

// Cargar la localización de Argentina una sola vez.
var argLocation, _ = time.LoadLocation("America/Argentina/Buenos_Aires")

// NowInArgentina es una función de ayuda para obtener la hora actual en la zona horaria de Argentina.
func NowInArgentina() time.Time {
	return time.Now().In(argLocation)
}