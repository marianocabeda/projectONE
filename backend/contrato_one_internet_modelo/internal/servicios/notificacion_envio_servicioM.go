package servicios

import (
	"context"
	"database/sql"
	"fmt"

	"contrato_one_internet_modelo/internal/repositorios"
)

type NotificacionEnvioService struct {
	db *sql.DB
}

func NewNotificacionEnvioService(db *sql.DB) *NotificacionEnvioService {
	return &NotificacionEnvioService{db: db}
}

// EnviarNotificacionNuevaSolicitudVerificador envía notificación a verificadores cuando hay nueva solicitud
func (s *NotificacionEnvioService) EnviarNotificacionNuevaSolicitudVerificador(
	ctx context.Context,
	idConexion, idContrato int,
	nroConexion, nombreCliente, apellidoCliente, distrito, departamento, provincia, nombrePlan, fechaSolicitud string,
	observacion *string,
) error {
	repo := repositorios.NewNotificacionRepo(s.db)

	mensaje := fmt.Sprintf(
		"El cliente %s %s generó una nueva solicitud de conexión (Nº %s). Dirección: %s, %s, %s. Plan solicitado: %s. Fecha: %s.",
		nombreCliente, apellidoCliente, nroConexion, distrito, departamento, provincia, nombrePlan, fechaSolicitud,
	)

	idConexionPtr := &idConexion
	idContratoPtr := &idContrato

	return repo.CrearNotificacionParaRol(
		ctx,
		"VERIFICADOR",
		"SOLICITUD",
		"Nueva solicitud de conexión pendiente de revisión",
		mensaje,
		idConexionPtr,
		idContratoPtr,
		nil,
		observacion,
	)
}

// EnviarNotificacionSolicitudRecibidaCliente envía notificación al cliente cuando crea solicitud
func (s *NotificacionEnvioService) EnviarNotificacionSolicitudRecibidaCliente(
	ctx context.Context,
	idPersonaCliente, idConexion, idContrato int,
	nroConexion string,
) error {
	repo := repositorios.NewNotificacionRepo(s.db)

	mensaje := fmt.Sprintf(
		"Hemos recibido tu solicitud de conexión (N.º %s). Nuestro equipo está evaluando la factibilidad técnica en tu zona. Te informaremos en cuanto tengamos una respuesta.",
		nroConexion,
	)

	idConexionPtr := &idConexion
	idContratoPtr := &idContrato
	rolCliente := "cliente"

	return repo.CrearNotificacion(
		ctx,
		idPersonaCliente,
		"SOLICITUD",
		"Tu solicitud fue recibida",
		mensaje,
		&rolCliente,
		idConexionPtr,
		idContratoPtr,
		nil,
		nil,
	)
}

// EnviarNotificacionSolicitudFactible envía notificación al cliente cuando solicitud es factible
func (s *NotificacionEnvioService) EnviarNotificacionSolicitudFactible(
	ctx context.Context,
	idPersonaCliente, idConexion, idContrato int,
	nroConexion string,
) error {
	repo := repositorios.NewNotificacionRepo(s.db)

	mensaje := fmt.Sprintf(
		"Buenas noticias, tu solicitud de conexión (Nº %s) es factible. Para continuar con la contratación, debés realizar el pago de la instalación. Una vez registrado el pago, el contrato entrará en vigencia y se coordinará la instalación.",
		nroConexion,
	)

	idConexionPtr := &idConexion
	idContratoPtr := &idContrato
	rolCliente := "cliente"

	return repo.CrearNotificacion(
		ctx,
		idPersonaCliente,
		"FACTIBILIDAD",
		"Tu solicitud es factible",
		mensaje,
		&rolCliente,
		idConexionPtr,
		idContratoPtr,
		nil,
		nil,
	)
}

// EnviarNotificacionSolicitudNoFactible envía notificación al cliente cuando solicitud no es factible
func (s *NotificacionEnvioService) EnviarNotificacionSolicitudNoFactible(
	ctx context.Context,
	idPersonaCliente, idConexion, idContrato int,
	nroConexion string,
) error {
	repo := repositorios.NewNotificacionRepo(s.db)

	mensaje := fmt.Sprintf(
		"Lamentamos informarte que tu solicitud de conexión (Nº %s) no es factible técnicamente en tu zona. Si necesitás más información, podés comunicarte con nuestro equipo de soporte.",
		nroConexion,
	)

	idConexionPtr := &idConexion
	idContratoPtr := &idContrato
	rolCliente := "cliente"

	return repo.CrearNotificacion(
		ctx,
		idPersonaCliente,
		"FACTIBILIDAD",
		"Tu solicitud no es factible",
		mensaje,
		&rolCliente,
		idConexionPtr,
		idContratoPtr,
		nil,
		nil,
	)
}
