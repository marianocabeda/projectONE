package logger

import (
	"io"
	"log"
	"os"
)

// Logger globales reutilizables
var (
	Debug *log.Logger
	Info  *log.Logger
	Warn  *log.Logger
	Error *log.Logger
)

// Init inicializa los loggers según el entorno
func Init(appEnv string) {
	var debugOutput io.Writer

	if appEnv == "desarrollo" {
		debugOutput = os.Stdout // Muestra DEBUG en la terminal
	} else {
		debugOutput = io.Discard // En producción, no muestra DEBUG
	}

	Debug = log.New(debugOutput, "[DEBUG] ", log.LstdFlags|log.Lshortfile)
	Info = log.New(os.Stdout, "[INFO] ", log.LstdFlags)
	Warn = log.New(os.Stdout, "[WARN] ", log.LstdFlags)
	Error = log.New(os.Stderr, "[ERROR] ", log.LstdFlags|log.Lshortfile)
}