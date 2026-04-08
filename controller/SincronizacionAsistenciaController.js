import ReservaPacientes from "../model/ReservaPacientes.js";
import FichaClinica from "../model/FichaClinica.js";
import Pacientes from "../model/Pacientes.js";

// Mapeo bidireccional de estados entre reservaPacientes (string) y fichaClinica (numero)
// 1 <-> "reservada"
// 2 <-> "confirmada"
// 3 <-> "anulada"
// 4 <-> "asiste"
// 5 <-> "no asiste"
function mapearEstadoReservaANumero(estado) {
    const e = (estado ?? "").toString().trim().toLowerCase();
    if (e === "reservada")  return 1;
    if (e === "confirmada") return 2;
    if (e === "anulada")    return 3;
    if (e === "asiste")     return 4;
    if (e === "no asiste")  return 5;
    return null;
}

function mapearEstadoFichaAString(estado) {
    const n = Number(estado);
    if (n === 1) return "reservada";
    if (n === 2) return "confirmada";
    if (n === 3) return "anulada";
    if (n === 4) return "asiste";
    if (n === 5) return "no asiste";
    return null;
}

// Parsea "Hora de Agendamiento: 10:00:00 - 10:30:00" -> { horaInicio, horaFinalizacion }
function parsearAnotacionConsulta(anotacionConsulta) {
    if (!anotacionConsulta) return null;
    const match = String(anotacionConsulta).match(
        /Hora de Agendamiento:\s*(\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2})/
    );
    if (!match) return null;
    return { horaInicio: match[1], horaFinalizacion: match[2] };
}

export default class SincronizacionAsistenciaController {

    // Llamado por calendarioGeneral en lugar de /reservaPacientes/actualizarEstado
    // Body: { estadoReserva, id_reserva }
    // 1) Actualiza el estado de la reserva (reutiliza el metodo existente).
    // 2) Si existe ficha automatica asociada (tipoAtencion = 'Agendamiento Automatico'),
    //    sincroniza tambien estadoFicha. Si no existe, no es error.
    static async sincronizarDesdeReserva(req, res) {
        try {
            const { estadoReserva, id_reserva } = req.body;
            console.log("[SYNC desdeReserva] body:", req.body);

            if (!estadoReserva || !id_reserva) {
                return res.status(400).send({ message: 'sindata' });
            }

            const claseReserva  = new ReservaPacientes();
            const claseFicha    = new FichaClinica();
            const clasePaciente = new Pacientes();

            // 1) Cargar la reserva original (necesitamos rut, fechaFinalizacion, horarios)
            const reservaArr = await claseReserva.seleccionarFichasReservadasEspecifica(id_reserva);
            const reserva = Array.isArray(reservaArr) ? reservaArr[0] : reservaArr;

            if (!reserva) {
                return res.status(404).send({ message: 'sindata' });
            }

            // 2) Actualizar el estado de la reserva
            const resultadoReserva = await claseReserva.actualizarEstado(estadoReserva, id_reserva);

            if (!(resultadoReserva && resultadoReserva.affectedRows > 0)) {
                return res.status(400).send({ message: false });
            }

            // 3) Intentar sincronizar la ficha automatica asociada (silencioso si falla)
            let id_fichaSincronizada = null;
            try {
                const estadoNumerico = mapearEstadoReservaANumero(estadoReserva);

                if (estadoNumerico !== null && reserva.rut) {
                    const pacienteRow = await clasePaciente.selectPacienteEspecificoPorRut(reserva.rut);
                    const id_paciente = pacienteRow?.id_paciente ?? null;

                    if (id_paciente) {
                        const anotacionEsperada = `Hora de Agendamiento: ${reserva.horaInicio} - ${reserva.horaFinalizacion}`;
                        const fichaAutomatica = await claseFicha.seleccionarFichaAutomaticaPorPacienteYAgenda(
                            id_paciente,
                            reserva.fechaFinalizacion,
                            anotacionEsperada
                        );

                        if (fichaAutomatica?.id_ficha) {
                            await claseFicha.actualizarEstadoFicha(estadoNumerico, fichaAutomatica.id_ficha);
                            id_fichaSincronizada = fichaAutomatica.id_ficha;
                            console.log(`[SYNC desdeReserva] Ficha ${id_fichaSincronizada} sincronizada a estado ${estadoNumerico}`);
                        } else {
                            console.log(`[SYNC desdeReserva] No se encontro ficha automatica para reserva ${id_reserva}`);
                        }
                    }
                }
            } catch (errSync) {
                console.error("[SYNC desdeReserva] Error sincronizando ficha:", errSync.message);
            }

            return res.status(200).send({ message: true, id_ficha: id_fichaSincronizada });

        } catch (error) {
            console.log("[SYNC desdeReserva] error:", error);
            return res.status(500).send({ message: error.message });
        }
    }


    // Llamado por EdicionFicha DESPUES del flujo normal de actualizacion de ficha.
    // Solo actualiza la reserva asociada (no toca la ficha porque ya fue actualizada).
    // Body: { estadoFicha, id_ficha }
    static async sincronizarDesdeFicha(req, res) {
        try {
            const { estadoFicha, id_ficha } = req.body;
            console.log("[SYNC desdeFicha] body:", req.body);

            if (estadoFicha === undefined || estadoFicha === null || !id_ficha) {
                return res.status(400).send({ message: 'sindata' });
            }

            const estadoString = mapearEstadoFichaAString(estadoFicha);

            if (estadoString === null) {
                // Estado no mapeable a reserva: nada que sincronizar pero no es error
                return res.status(200).send({ message: true, id_reserva: null });
            }

            const claseReserva  = new ReservaPacientes();
            const claseFicha    = new FichaClinica();
            const clasePaciente = new Pacientes();

            // 1) Cargar la ficha (necesitamos tipoAtencion, id_paciente, fechaConsulta, anotacionConsulta)
            const fichaArr = await claseFicha.seleccionarPorIdFicha(id_ficha);
            const ficha = Array.isArray(fichaArr) ? fichaArr[0] : fichaArr;

            if (!ficha) {
                return res.status(200).send({ message: true, id_reserva: null });
            }

            // 2) Solo se sincroniza si la ficha proviene del flujo de agendamiento automatico
            if (ficha.tipoAtencion !== "Agendamiento Automatico") {
                console.log(`[SYNC desdeFicha] Ficha ${id_ficha} no es de Agendamiento Automatico, omitiendo sync`);
                return res.status(200).send({ message: true, id_reserva: null });
            }

            // 3) Obtener el rut del paciente via id_paciente
            const pacienteRowsArr = await clasePaciente.selectPacienteEspecifico(ficha.id_paciente);
            const pacienteRow = Array.isArray(pacienteRowsArr) ? pacienteRowsArr[0] : pacienteRowsArr;
            const rut = pacienteRow?.rut ?? null;

            if (!rut) {
                console.log(`[SYNC desdeFicha] No se encontro rut para id_paciente ${ficha.id_paciente}`);
                return res.status(200).send({ message: true, id_reserva: null });
            }

            // 4) Parsear anotacionConsulta para obtener horarios
            const horarios = parsearAnotacionConsulta(ficha.anotacionConsulta);

            if (!horarios) {
                console.log(`[SYNC desdeFicha] anotacionConsulta sin formato esperado: ${ficha.anotacionConsulta}`);
                return res.status(200).send({ message: true, id_reserva: null });
            }

            // 5) Buscar la reserva exacta (rut + fecha + horarios)
            const reservaEncontrada = await claseReserva.seleccionarReservaPorRutFechaHorario(
                rut,
                ficha.fechaConsulta,
                horarios.horaInicio,
                horarios.horaFinalizacion
            );

            if (!reservaEncontrada?.id_reserva) {
                console.log(`[SYNC desdeFicha] No se encontro reserva para rut ${rut} en ${ficha.fechaConsulta} ${horarios.horaInicio}-${horarios.horaFinalizacion}`);
                return res.status(200).send({ message: true, id_reserva: null });
            }

            // 6) Actualizar el estado de la reserva
            await claseReserva.actualizarEstado(estadoString, reservaEncontrada.id_reserva);
            console.log(`[SYNC desdeFicha] Reserva ${reservaEncontrada.id_reserva} sincronizada a estado '${estadoString}'`);

            return res.status(200).send({ message: true, id_reserva: reservaEncontrada.id_reserva });

        } catch (error) {
            console.log("[SYNC desdeFicha] error:", error);
            return res.status(500).send({ message: error.message });
        }
    }
}
