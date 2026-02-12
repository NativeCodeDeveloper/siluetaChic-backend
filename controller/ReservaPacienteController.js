import ReservaPacientes from "../model/ReservaPacientes.js";
import Pacientes from "../model/Pacientes.js";
import NotificacionAgendamiento from "../services/notificacionAgendamiento.js";
import FichaClinica from "../model/FichaClinica.js";

export default class ReservaPacienteController {
    constructor() {
    }


    static async validacionDisponibilidad(req, res) {
        try {
            const {fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion} = req.body;
            console.log(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);

            if (!fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const respuestaBackend = await claseReservaPaciente.validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);

            if (respuestaBackend) {
                return res.status(200).send({message: true});
            } else {
                return res.status(404).send({message: false});
            }

        } catch (e) {
            throw e;
        }
    }


    static async seleccionarSegunEstado(req, res) {
        try {
            const {estadoReserva} = req.body;
            console.log(estadoReserva);

            if (!estadoReserva) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarReservaEstado(estadoReserva)

            if (resultadoQuery) {
                return res.status(200).json(resultadoQuery);
            } else {
                return res.status(400).send({message: 'sindata'});
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});
        }
    }


    static async actualizarEstado(req, res) {
        try {
            const {estadoReserva, id_reserva} = req.body;
            console.log(estadoReserva, id_reserva);

            if (!estadoReserva || !id_reserva) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.actualizarEstado(estadoReserva, id_reserva);

            if (resultadoQuery.affectedRows > 0) {
                return res.status(200).send({message: true})
            } else {
                return res.status(400).send({message: 'sindata'});
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});
        }
    }


    static async buscarEntreFechas(req, res) {
        try {
            const {fechaInicio, fechaFinalizacion} = req.body;
            console.log(fechaInicio, fechaFinalizacion);

            if (!fechaInicio || !fechaFinalizacion) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarEntreFechas(fechaInicio, fechaFinalizacion);

            if (Array.isArray(resultadoQuery)) {

                return res.status(200).json(resultadoQuery);

            } else {

                return res.status(400).send({message: 'sindata'});
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});

        }
    }


    static async buscarSimilitudRut(req, res) {
        try {
            const {rut} = req.body;
            console.log(rut);

            if (!rut) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarSimilitudRut(rut);

            if (Array.isArray(resultadoQuery)) {

                return res.status(200).json(resultadoQuery);

            } else {

                return res.status(400).send({message: 'sindata'});
            }

        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});

        }
    }


    static async buscarSimilitudNombre(req, res) {
        try {
            const {nombrePaciente} = req.body;
            console.log(nombrePaciente);

            if (!nombrePaciente) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarSimilitudNombre(nombrePaciente);

            if (Array.isArray(resultadoQuery)) {

                return res.status(200).json(resultadoQuery);

            } else {

                return res.status(400).send({message: 'sindata'});
            }

        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});

        }
    }


    static async actualizarInformacionReserva(req, res) {
        try {
            const {
                nombrePaciente,
                apellidoPaciente,
                rut,
                telefono,
                email,
                fechaInicio,
                horaInicio,
                fechaFinalizacion,
                horaFinalizacion,
                estadoReserva,
                id_reserva
            } = req.body;

            console.log(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_reserva);

            if (!id_reserva) {
                return res.status(404).send({message: 'sindata'})
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.actualizarReserva(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_reserva);

            if (resultadoQuery.affectedRows > 0) {
                return res.status(200).json({message: true});
            } else {
                return res.status(200).json({message: false});
            }

        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async seleccionarReservaEspecifica(req, res) {
        try {

            const {id_reserva} = req.body;
            console.log(id_reserva);

            if (!id_reserva) {
                return res.status(404).send({message: 'sindata'})
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarFichasReservadasEspecifica(id_reserva);

            if (resultadoQuery) {
                return res.status(200).json(resultadoQuery);
            } else {
                return res.status(200).json({message: "sindata"});
            }

        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async eliminarReserva(req, res) {
        try {
            const {id_reserva} = req.body;
            console.log(id_reserva);

            if (!id_reserva) {
                return res.status(404).send({message: 'sindata'})
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.eliminarReservaPaciente(id_reserva);

            if (resultadoQuery.affectedRows > 0) {
                return res.status(200).json({message: true});
            } else {
                return res.status(200).json({message: false});
            }

        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async seleccionarReservados(req, res) {
        try {
            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarFichasReservadas();

            if (Array.isArray(resultadoQuery)) {
                return res.status(200).json(resultadoQuery);
            } else {
                return res.status(400).json({message: "sindata"});
            }
        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async insertarReservaPaciente(req, res) {
        try {
            const {
                nombrePaciente,
                apellidoPaciente,
                rut,
                telefono,
                email,
                fechaInicio,
                horaInicio,
                fechaFinalizacion,
                horaFinalizacion,
                estadoReserva

            } = req.body;

            console.log(req.body);

            if (!nombrePaciente || !apellidoPaciente || !rut || !telefono || !email || !fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !estadoReserva) {
                return res.status(400).send({message: "sindata"})
            }

            const claseReservaPaciente = new ReservaPacientes();

            const validacionHoras = await claseReservaPaciente.validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);
            if (!validacionHoras) {
                return res.status(400).send({message: "conflicto"})
            } else {

                const resultadoQuery = await claseReservaPaciente.insertarReservaPaciente(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva)

                if (resultadoQuery.affectedRows > 0) {

                    // Enviar correo de confirmación (no bloquear la respuesta si falla)


                    return res.status(200).send({message: true})
                } else {
                    return res.status(200).send({message: false})
                }
            }

        } catch (error) {
            console.error(error);
            return res.status(500).send({message: error.message});
        }
    }



    //FUNCION PARA INSERTAR PACIENTE Y FICHAS SEGUN SI EXITES O NO PREVIAMENTE INGRESADOS, RUT MANDA.
    static async insertarReservaPacienteFicha(req, res) {
        try {
            const {
                nombrePaciente,
                apellidoPaciente,
                rut,
                telefono,
                email,
                fechaInicio,
                horaInicio,
                fechaFinalizacion,
                horaFinalizacion,
                estadoReserva
            } = req.body;

            console.log(req.body);

            if (!nombrePaciente || !apellidoPaciente || !rut || !telefono || !email || !fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !estadoReserva) {
                return res.status(400).send({message: "sindata"})
            }


            let nombre = nombrePaciente;
            let apellido = apellidoPaciente;
            let nacimiento = null;
            let sexo = null;
            let prevision_id = 0;
            let correo = null;
            let direccion = null;
            let pais = 'chile';



            const clasePacientes = new Pacientes();
            const respuestaBackendPaciente = await clasePacientes.insertPacientemp(nombre,apellido,rut,nacimiento,sexo,prevision_id,telefono,correo,direccion,pais);

            if (respuestaBackendPaciente.affectedRows > 0) {
                console.log("Paciente ingresado correctamente desde reserva");

            }else if (respuestaBackendPaciente.duplicado === true) {
                console.log("Error al ingresar paciente desde reserva : Paciente ya existe");

            }




            const claseReservaPaciente = new ReservaPacientes();

            const validacionHoras = await claseReservaPaciente.validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);
            if (!validacionHoras) {
                return res.status(400).send({message: "conflicto"})


            } else {

                const resultadoQuery = await claseReservaPaciente.insertarReservaPaciente(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva)

                if (resultadoQuery.affectedRows > 0) {
                    // Enviar correo de confirmación al paciente
                    try {
                        await NotificacionAgendamiento.enviarCorreoConfirmacionReserva({
                            to: email,
                            nombrePaciente,
                            apellidoPaciente,
                            rut,
                            telefono,
                            fechaInicio,
                            horaInicio,
                            fechaFinalizacion,
                            horaFinalizacion,
                            estadoReserva,
                            id_reserva: resultadoQuery.insertId
                        });
                    } catch (err) {
                        console.error("[MAIL] Error:", err.message);
                    }

                    // Enviar correo de notificación al equipo
                    NotificacionAgendamiento.enviarCorreoConfirmacionEquipo({
                        nombrePaciente,
                        apellidoPaciente,
                        fechaInicio,
                        horaInicio,
                        accion: "AGENDADA",
                        id_reserva: resultadoQuery.insertId
                    }).catch(err => {
                        console.error("[MAIL EQUIPO] Error:", err.message);
                    });

                    return res.status(200).send({message: true})
                } else {
                    return res.status(200).send({message: false})
                }
            }

        } catch (error) {
            console.error(error);
            return res.status(500).send({message: error.message});
        }
    }












    static async insertarReservaFichaDia(req, res) {
        try {
            const {
                nombrePaciente,
                apellidoPaciente,
                rut,
                telefono,
                email,
                fechaInicio,
                horaInicio,
                fechaFinalizacion,
                horaFinalizacion,
                estadoReserva
            } = req.body;

            console.log(req.body);

            if (!nombrePaciente || !apellidoPaciente || !rut || !telefono || !email || !fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !estadoReserva) {
                return res.status(400).send({message: "sindata"});
            }

            // 1) Validar disponibilidad antes de crear cualquier cosa
            const claseReservaPaciente = new ReservaPacientes();
            const validacionHoras = await claseReservaPaciente.validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);
            if (!validacionHoras) {
                return res.status(400).send({message: "conflicto"});
            }

            // 2) Insertar/asegurar paciente (si ya existe, el modelo debería marcar duplicado)
            const nombre = nombrePaciente;
            const apellido = apellidoPaciente;
            const nacimiento = null;
            const sexo = null;
            const prevision_id = 0;
            const correo = email; // usar el email real, no null
            const direccion = null;
            const pais = "chile";

            const clasePacientes = new Pacientes();
            const respuestaBackendPaciente = await clasePacientes.insertPacientemp(
                nombre,
                apellido,
                rut,
                nacimiento,
                sexo,
                prevision_id,
                telefono,
                correo,
                direccion,
                pais
            );

            if (respuestaBackendPaciente?.affectedRows > 0) {
                console.log("Paciente ingresado correctamente desde reserva");
            } else if (respuestaBackendPaciente?.duplicado === true) {
                console.log("Paciente ya existe (OK)");
            } else {
                console.log("No se pudo insertar paciente (continuando para intentar obtenerlo por RUT)");
            }

            // 3) Insertar la reserva (primero). Si esto falla, NO generamos ficha.
            const resultadoQuery = await claseReservaPaciente.insertarReservaPaciente(
                nombrePaciente,
                apellidoPaciente,
                rut,
                telefono,
                email,
                fechaInicio,
                horaInicio,
                fechaFinalizacion,
                horaFinalizacion,
                estadoReserva
            );

            if (!(resultadoQuery && resultadoQuery.affectedRows > 0)) {
                return res.status(200).send({message: false});
            }

            // 4) Obtener id_paciente de forma robusta (puede venir array u objeto)
            let id_paciente = null;
            try {
                const pacienteClass = new Pacientes();
                const seleccionarPacienteData = await pacienteClass.selectPacienteEspecificoPorRut(rut);

                if (Array.isArray(seleccionarPacienteData)) {
                    id_paciente = seleccionarPacienteData[0]?.id_paciente ?? null;
                } else {
                    id_paciente = seleccionarPacienteData?.id_paciente ?? null;
                }
            } catch (err) {
                console.error("[PACIENTE] Error obteniendo paciente por RUT:", err.message);
            }

            // 5) Generar ficha SOLO si tenemos id_paciente
            if (id_paciente) {
                try {
                    const fichaClinicaClass = new FichaClinica();

                    const tipoAtencion = "Agendamiento Automatico";
                    const motivoConsulta = null;
                    const signosVitales = null;
                    const observaciones = null;
                    const anotacionConsulta = "Ficha generada de forma automatica desde el agendamiento";
                    const anamnesis = null;
                    const diagnostico = null;
                    const indicaciones = null;
                    const archivosAdjuntos = null;
                    const fechaConsulta = fechaFinalizacion;
                    const consentimientoFirmado = null;

                    const resultadoInsercionFichaClinica = await fichaClinicaClass.insertarFichaNueva(
                        id_paciente,
                        tipoAtencion,
                        motivoConsulta,
                        signosVitales,
                        observaciones,
                        anotacionConsulta,
                        anamnesis,
                        diagnostico,
                        indicaciones,
                        archivosAdjuntos,
                        fechaConsulta,
                        consentimientoFirmado
                    );

                    if (resultadoInsercionFichaClinica?.affectedRows > 0) {
                        console.log("NUEVA FICHA AUTOMATICA GENERADA CON EXITO : FECHA : -> " + fechaConsulta);
                        console.log("fechaConsulta =>", fechaConsulta, typeof fechaConsulta);

                    } else {
                        console.log("NO SE PUDO GENERAR FICHA");
                    }
                } catch (err) {
                    console.error("[FICHA] Error generando ficha:", err.message);
                }
            } else {
                console.log("[FICHA] No se generó ficha: no se pudo obtener id_paciente");
            }

            // 6) Correos (no deben romper la respuesta)
            try {
                await NotificacionAgendamiento.enviarCorreoConfirmacionReserva({
                    to: email,
                    nombrePaciente,
                    apellidoPaciente,
                    rut,
                    telefono,
                    fechaInicio,
                    horaInicio,
                    fechaFinalizacion,
                    horaFinalizacion,
                    estadoReserva,
                    id_reserva: resultadoQuery.insertId
                });
            } catch (err) {
                console.error("[MAIL] Error:", err.message);
            }

            NotificacionAgendamiento.enviarCorreoConfirmacionEquipo({
                nombrePaciente,
                apellidoPaciente,
                fechaInicio,
                horaInicio,
                accion: "AGENDADA",
                id_reserva: resultadoQuery.insertId
            }).catch(err => {
                console.error("[MAIL EQUIPO] Error:", err.message);
            });

            return res.status(200).send({message: true});

        } catch (error) {
            console.error(error);
            return res.status(500).send({message: error.message});
        }
    }
}