import NotificacionAgendamiento from "../services/notificacionAgendamiento.js";
import ReservaPacientes from "../model/ReservaPacientes.js";

export default class NotificacionAgendamientoController {

  // Endpoint para mostrar página de confirmación (GET) - NO ejecuta la acción
  static async confirmarCita(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio,
        ejecutar // Parámetro que indica si debe ejecutar la acción
      } = req.query;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      // Si NO viene el parámetro "ejecutar=true", mostrar página de confirmación
      if (ejecutar !== 'true') {
        const urlConfirmarReal = `/notificacion/confirmar?id_reserva=${id_reserva}&nombrePaciente=${encodeURIComponent(nombrePaciente)}&apellidoPaciente=${encodeURIComponent(apellidoPaciente)}&fechaInicio=${encodeURIComponent(fechaInicio)}&horaInicio=${encodeURIComponent(horaInicio)}&ejecutar=true`;

        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmar Cita - Silueta Chic</title>
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
              h1 { color: #10b981; margin-bottom: 20px; }
              p { color: #374151; line-height: 1.6; margin-bottom: 10px; }
              .icon { font-size: 64px; margin-bottom: 20px; }
              .btn {
                display: inline-block;
                padding: 14px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 16px;
                font-weight: 600;
                margin: 10px;
                cursor: pointer;
              }
              .btn-confirm { background: #10b981; color: white; }
              .btn-confirm:hover { background: #059669; }
              .btn-cancel { background: #6b7280; color: white; }
              .btn-cancel:hover { background: #4b5563; }
              .detail-box {
                background: #f3f4f6;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: left;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">📅</div>
              <h1>¿Confirmar tu cita?</h1>
              <p>Estás a punto de confirmar la siguiente cita:</p>
              <div class="detail-box">
                <p><strong>Paciente:</strong> ${nombrePaciente} ${apellidoPaciente}</p>
                <p><strong>Fecha:</strong> ${fechaInicio}</p>
                <p><strong>Hora:</strong> ${horaInicio}</p>
              </div>
              <p>Haz clic en el botón para confirmar tu asistencia:</p>
              <div style="margin-top: 20px;">
                <a href="${urlConfirmarReal}" class="btn btn-confirm">✅ Sí, confirmar mi cita</a>
              </div>
              <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                Si no solicitaste esta acción, puedes cerrar esta página.
              </p>
            </div>
          </body>
          </html>
        `);
      }

      // Si viene ejecutar=true, proceder con la confirmación real
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











  // Endpoint para cancelar una cita - Muestra página de confirmación primero
  static async cancelarCita(req, res) {
    try {
      const {
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        fechaInicio,
        horaInicio,
        ejecutar // Parámetro que indica si debe ejecutar la acción
      } = req.query;

      if (!id_reserva || !nombrePaciente || !apellidoPaciente || !fechaInicio || !horaInicio) {
        return res.status(400).json({
          ok: false,
          message: "Faltan parámetros requeridos"
        });
      }

      // Si NO viene el parámetro "ejecutar=true", mostrar página de confirmación
      if (ejecutar !== 'true') {
        const urlCancelarReal = `/notificacion/cancelar?id_reserva=${id_reserva}&nombrePaciente=${encodeURIComponent(nombrePaciente)}&apellidoPaciente=${encodeURIComponent(apellidoPaciente)}&fechaInicio=${encodeURIComponent(fechaInicio)}&horaInicio=${encodeURIComponent(horaInicio)}&ejecutar=true`;

        return res.send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cancelar Cita - Silueta Chic</title>
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
              h1 { color: #ef4444; margin-bottom: 20px; }
              p { color: #374151; line-height: 1.6; margin-bottom: 10px; }
              .icon { font-size: 64px; margin-bottom: 20px; }
              .btn {
                display: inline-block;
                padding: 14px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-size: 16px;
                font-weight: 600;
                margin: 10px;
                cursor: pointer;
              }
              .btn-cancel { background: #ef4444; color: white; }
              .btn-cancel:hover { background: #dc2626; }
              .btn-back { background: #6b7280; color: white; }
              .btn-back:hover { background: #4b5563; }
              .detail-box {
                background: #fef2f2;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: left;
                border: 1px solid #fecaca;
              }
              .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                font-size: 14px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">⚠️</div>
              <h1>¿Cancelar tu cita?</h1>
              <p>Estás a punto de cancelar la siguiente cita:</p>
              <div class="detail-box">
                <p><strong>Paciente:</strong> ${nombrePaciente} ${apellidoPaciente}</p>
                <p><strong>Fecha:</strong> ${fechaInicio}</p>
                <p><strong>Hora:</strong> ${horaInicio}</p>
              </div>
              <div class="warning">
                ⚠️ <strong>Importante:</strong> Esta acción no se puede deshacer. Si cancelas, deberás agendar una nueva cita.
              </div>
              <p>¿Estás seguro/a de que deseas cancelar?</p>
              <div style="margin-top: 20px;">
                <a href="${urlCancelarReal}" class="btn btn-cancel">❌ Sí, cancelar mi cita</a>
              </div>
              <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                Si no solicitaste esta acción, puedes cerrar esta página.
              </p>
            </div>
          </body>
          </html>
        `);
      }

      // Si viene ejecutar=true, proceder con la cancelación real
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


    } catch (error) {
      console.error("[CANCELAR CITA] Error:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al cancelar la cita"
      });
    }
  }
}
