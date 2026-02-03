import NotificacionAgendamiento from "../services/notificacionAgendamiento.js";
import ReservaPacientes from "../model/ReservaPacientes.js";

export default class NotificacionAgendamientoController {

  // Endpoint para confirmar una cita
  static async confirmarCita(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio
      } = req.query;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      const reservaPacienteClass = new ReservaPacientes();
      const estadoReserva = "CONFIRMADA";
      const respuestaBackend = await reservaPacienteClass.actualizarEstado(estadoReserva, id_reserva);

      if(respuestaBackend.affectedRows > 0) {
          console.log("[CONFIRMAR CITA] Reserva confirmada correctamente.");
          console.log(respuestaBackend);
      }else{
            console.log("[CONFIRMAR CITA] No se pudo confirmar la reserva: no existe o ya está confirmada.");
          console.log(respuestaBackend);
      }

          // Enviar correo de confirmación al equipo
          await NotificacionAgendamiento.enviarCorreoConfirmacionEquipo({
              nombrePaciente,
              apellidoPaciente,
              fechaInicio,
              horaInicio,
              accion: "CONFIRMADA",
              id_reserva
          });

          // Redirigir a una página de confirmación exitosa
          return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cita Confirmada</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #10b981;
              margin-bottom: 20px;
            }
            p {
              color: #374151;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            .actions {
              display: flex;
              justify-content: center;
              gap: 16px;
              margin-top: 30px;
            }
            button, .btn {
              padding: 12px 22px;
              border-radius: 8px;
              border: none;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>¡Cita Confirmada!</h1>
            <p><strong>${nombrePaciente} ${apellidoPaciente}</strong></p>
            <p>Tu cita para el <strong>${fechaInicio}</strong> a las <strong>${horaInicio}</strong> ha sido confirmada exitosamente.</p>
            <p>Hemos notificado a nuestro equipo de tu confirmación.</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Nos vemos pronto en Silueta Chic 💜
            </p>
          </div>
        </body>
        </html>
      `);



    } catch (error) {
      console.error("[CONFIRMAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al confirmar la cita"
      });
    }
  }











  // Endpoint para cancelar una cita
  static async cancelarCita(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio
      } = req.query;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      const reservaPacienteClass = new ReservaPacientes();
        const estadoReserva = "ANULADA";
      const respuestaBackend = await reservaPacienteClass.actualizarEstado(estadoReserva, id_reserva);


        if(respuestaBackend.affectedRows > 0) {
            console.log("[ANULAR CITA] Reserva ANULADA correctamente.");
            console.log(respuestaBackend);
        }else{
            console.log("[ANULAR CITA] No se pudo ANULAR la reserva: no existe o ya está ANULADA.");
            console.log(respuestaBackend);
        }

        // Enviar correo de cancelación al equipo
        await NotificacionAgendamiento.enviarCorreoConfirmacionEquipo({
          nombrePaciente,
          apellidoPaciente,
          fechaInicio,
          horaInicio,
          accion: "CANCELADA",
          id_reserva,
        });

        // Redirigir a una página de cancelación exitosa
        return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cita Cancelada</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #ef4444;
              margin-bottom: 20px;
            }
            p {
              color: #374151;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            .actions {
              display: flex;
              justify-content: center;
              gap: 16px;
              margin-top: 30px;
            }
            button, .btn {
              padding: 12px 22px;
              border-radius: 8px;
              border: none;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Cita Cancelada</h1>
            <p><strong>${nombrePaciente} ${apellidoPaciente}</strong></p>
            <p>Tu cita para el <strong>${fechaInicio}</strong> a las <strong>${horaInicio}</strong> ha sido cancelada.</p>
            <p>Hemos notificado a nuestro equipo de tu cancelación.</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Esperamos verte pronto en Silueta Chic 💜
            </p>
          </div>
        </body>
        </html>
      `);


      // Si no se actualizó nada, evita que el request quede colgado
      return res.status(404).json({
        ok: false,
        message: "No se pudo cancelar: la reserva no existe o ya estaba anulada",
      });

    } catch (error) {
      console.error("[CANCELAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al cancelar la cita"
      });
    }
  }
}
