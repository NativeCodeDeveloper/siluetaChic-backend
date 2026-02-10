export default class NotificacionAgendamiento {
  static async enviarCorreoConfirmacionReserva({
    to,
    nombrePaciente,
    apellidoPaciente,
    rut,
    telefono,
    fechaInicio,
    horaInicio,
    fechaFinalizacion,
    horaFinalizacion,
    estadoReserva,
    id_reserva
  }) {
    const { BREVO_API_KEY, CORREO_RECEPTOR, NOMBRE_EMPRESA, API_URL } = process.env;

    // No romper el flujo principal si falta configuración
    if (!BREVO_API_KEY) {
      console.warn("[MAIL] BREVO_API_KEY no configurada. Correo no enviado.");
      return;
    }

    if (!to) {
      console.warn("[MAIL] Destinatario vacío. Correo no enviado.");
      return;
    }

    const emailOk = typeof to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
    if (!emailOk) {
      console.warn("[MAIL] Email inválido:", to, "Correo no enviado.");
      return;
    }

    // En Brevo, el 'from' debe ser un remitente verificado.
    // Usamos CORREO_RECEPTOR como remitente por defecto (sin tocar tu .env).
    const fromEmail = CORREO_RECEPTOR;
    const fromName = NOMBRE_EMPRESA || "SiluetaChic";

    if (!fromEmail) {
      console.warn("[MAIL] CORREO_RECEPTOR no configurado (se usa como remitente). Correo no enviado.");
      return;
    }

    const subject = `¡Tu cita con ${fromName} ha sido confirmada! 🎉`;

    // Construir URLs
    const baseUrl = process.env.BACKEND_URL || "https://siluetachic.nativecode.cl";
    const frontendUrl = process.env.FRONTEND_URL || "https://siluetachic.cl";
    const urlConfirmar = `${baseUrl}/notificacion/confirmar?id_reserva=${id_reserva}&nombrePaciente=${encodeURIComponent(nombrePaciente)}&apellidoPaciente=${encodeURIComponent(apellidoPaciente)}&fechaInicio=${encodeURIComponent(fechaInicio)}&horaInicio=${encodeURIComponent(horaInicio)}`;
    const urlCancelar = `${baseUrl}/notificacion/cancelar?id_reserva=${id_reserva}&nombrePaciente=${encodeURIComponent(nombrePaciente)}&apellidoPaciente=${encodeURIComponent(apellidoPaciente)}&fechaInicio=${encodeURIComponent(fechaInicio)}&horaInicio=${encodeURIComponent(horaInicio)}`;
    const urlTerminos = `${frontendUrl}/terminosCondiciones`;

    const text =
      `¡Tu cita con Silueta Chic ha sido confirmada! 🎉\n\n` +
      `Detalle de tu reserva:\n` +
      `• Nombre: ${nombrePaciente} ${apellidoPaciente}\n` +
      `• RUT: ${rut}\n` +
      `• Teléfono: ${telefono}\n` +
      `• Inicio: ${fechaInicio} ${horaInicio}\n` +
      `• Término: ${fechaFinalizacion} ${horaFinalizacion}\n` +
      `• Estado: ${estadoReserva}\n\n` +
      `Para asegurar una sesión exitosa, revisa estos puntos clave:\n\n` +
      `1) Preparación Obligatoria:\n` +
      `- La zona debe asistir rasurada con rasuradora de varón (máx. 24h antes) y limpia e higienizada (sin cremas, maquillaje, desodorantes, etc.).\n` +
      `- Si no cumple la preparación, la sesión se pierde y se descuenta del paquete.\n\n` +
      `2) Políticas de Asistencia:\n` +
      `- Puntualidad: Tolerancia de 10 minutos de atraso. Si se excede, la sesión se pierde.\n` +
      `- Cancelación: Avise con al menos 24 horas de anticipación. El aviso tardío o No-Show resultará pérdida de la sesión.\n\n` +
      `3) Recordatorio de Cuidados PRE Y POST:\n` +
      `Antes:\n` +
      `- Suspender sol/bronceado (30 días antes) y métodos de arranque (cera/pinzas).\n` +
      `- Suspender ácidos tópicos (1 semana antes).\n` +
      `- Suspender medicación fotosensibilizante/anticoagulante bajo supervisión médica.\n` +
      `- Si hay vacuna, esperar 15 días.\n` +
      `Después:\n` +
      `- Evitar sol/bronceado (48 horas).\n` +
      `- Usar protector solar FPS 50.\n` +
      `- Evitar calor/sudor (24 horas).\n` +
      `- No depilar con métodos de arranque.\n\n` +
      `Si necesitas modificar o cancelar tu reserva, responde este correo.\n\n` +
      `Términos y Condiciones: ${frontendUrl}/terminosCondiciones\n\n` +
      `Saludos.`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">¡Tu cita con ${fromName} ha sido confirmada! 🎉</h2>
        <p>Hola <b>${nombrePaciente} ${apellidoPaciente}</b>,</p>
        <p><b>Detalle de tu reserva:</b></p>
        <ul style="list-style: none; padding: 0; background: #f3f4f6; padding: 15px; border-radius: 8px;">
          <li style="margin-bottom: 8px;"><b>RUT:</b> ${rut}</li>
          <li style="margin-bottom: 8px;"><b>Teléfono:</b> ${telefono}</li>
          <li style="margin-bottom: 8px;"><b>Inicio:</b> ${fechaInicio} ${horaInicio}</li>
          <li style="margin-bottom: 8px;"><b>Término:</b> ${fechaFinalizacion} ${horaFinalizacion}</li>
          <li><b>Estado:</b> ${estadoReserva}</li>
        </ul>

        <!-- Botones de acción -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="margin-bottom: 15px; font-weight: bold; color: #374151;">¿Confirmas tu asistencia?</p>
          <a href="${urlConfirmar}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">✅ Confirmar Cita</a>
          <a href="${urlCancelar}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">❌ Cancelar Cita</a>
        </div>

        <!-- Botón de Términos y Condiciones -->
        <div style="text-align: center; margin: 15px 0;">
          <p style="margin-bottom: 10px; font-size: 13px; color: #6b7280;">Al confirmar tu cita, aceptas nuestros términos y condiciones:</p>
          <a href="${urlTerminos}" style="display: inline-block; background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">📋 Términos y Condiciones</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p><b>Preparación Obligatoria:</b></p>
        <ul>
          <li>La zona debe asistir rasurada con rasuradora de varón (máx. 24h antes) y limpia e higienizada (sin cremas, maquillaje, desodorantes, etc.).</li>
          <li>Si no cumple la preparación, la sesión se pierde y se descuenta del paquete.</li>
        </ul>
        <p><b>Políticas de Asistencia:</b></p>
        <ul>
          <li><b>Puntualidad:</b> Tolerancia de 10 minutos de atraso. Si se excede, la sesión se pierde.</li>
          <li><b>Cancelación:</b> Avise con al menos 24 horas de anticipación. El aviso tardío o No-Show resultará pérdida de la sesión.</li>
        </ul>
        <p><b>Cuidados PRE y POST:</b></p>
        <p style="margin: 6px 0;"><b>Antes:</b></p>
        <ul>
          <li>Suspender sol/bronceado (30 días antes) y métodos de arranque (cera/pinzas).</li>
          <li>Suspender ácidos tópicos (1 semana antes).</li>
          <li>Suspender medicación fotosensibilizante/anticoagulante bajo supervisión médica.</li>
          <li>Si hay vacuna, esperar 15 días.</li>
        </ul>
        <p style="margin: 6px 0;"><b>Después:</b></p>
        <ul>
          <li>Evitar sol/bronceado (48 horas).</li>
          <li>Usar protector solar FPS 50.</li>
          <li>Evitar calor/sudor (24 horas).</li>
          <li>No depilar con métodos de arranque.</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="text-align: center; color: #6b7280; font-size: 14px;">
          Si tienes dudas, responde este correo o contáctanos directamente.
        </p>
        <p style="text-align: center; color: #667eea; font-weight: bold;">
          ¡Nos vemos pronto! 💜
        </p>
      </div>
    `;

    const payload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html
    };

    // Node 18+ trae fetch. Si tu runtime es más antiguo, actualiza Node.
    if (typeof fetch !== "function") {
      console.warn("[MAIL] Tu Node no tiene fetch (requiere Node 18+). Correo no enviado.");
      return;
    }

    console.log("[MAIL] Enviando a:", to, "| id_reserva:", id_reserva, "| from:", fromEmail);

    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[MAIL] Brevo error:", resp.status, errText);
      return;
    }

    console.log("[MAIL] Enviado OK a:", to, "| id_reserva:", id_reserva);
  }

  // Envía notificación al equipo cuando un paciente confirma, cancela o agenda una cita
  static async enviarCorreoConfirmacionEquipo({
    nombrePaciente,
    apellidoPaciente,
    fechaInicio,
    horaInicio,
    accion, // "CONFIRMADA", "CANCELADA" o "AGENDADA"
    id_reserva
  }) {
    const { BREVO_API_KEY, CORREO_RECEPTOR, NOMBRE_EMPRESA } = process.env;

    if (!BREVO_API_KEY) {
      console.warn("[MAIL EQUIPO] BREVO_API_KEY no configurada. Correo no enviado.");
      return;
    }

    const fromEmail = CORREO_RECEPTOR;
    const fromName = NOMBRE_EMPRESA || "SiluetaChic";

    if (!fromEmail) {
      console.warn("[MAIL EQUIPO] CORREO_RECEPTOR no configurado. Correo no enviado.");
      return;
    }

    const destinatario = "desarrollo.native.code@gmail.com";

    let subject, text, colorAccion, iconoAccion, textoAccion, detalleAccion;

    switch (accion) {
      case "CONFIRMADA":
        subject = `✅ Cita CONFIRMADA por ${nombrePaciente} ${apellidoPaciente}`;
        textoAccion = "CONFIRMADA";
        iconoAccion = "✅";
        colorAccion = "#10b981";
        detalleAccion = "El paciente confirmó su cita desde el enlace del correo.";
        text = `El paciente ${nombrePaciente} ${apellidoPaciente} ha CONFIRMADO su cita.\n\n` +
               `• ID Reserva: ${id_reserva}\n` +
               `• Fecha: ${fechaInicio}\n` +
               `• Hora: ${horaInicio}\n\n` +
               `${detalleAccion}`;
        break;
      
      case "AGENDADA":
        subject = `🗓️ Nueva Reserva (Agenda Clínica) - ${nombrePaciente} ${apellidoPaciente}`;
        textoAccion = "NUEVA RESERVA";
        iconoAccion = "🗓️";
        colorAccion = "#3b82f6"; // Azul para nueva reserva
        detalleAccion = "La reserva fue creada manualmente desde la agenda clínica.";
        text = `Se ha creado una nueva reserva desde la agenda clínica para ${nombrePaciente} ${apellidoPaciente}.\n\n` +
               `• ID Reserva: ${id_reserva}\n` +
               `• Fecha: ${fechaInicio}\n` +
               `• Hora: ${horaInicio}\n\n` +
               `${detalleAccion}`;
        break;

      case "CANCELADA":
      default:
        subject = `❌ Cita CANCELADA por ${nombrePaciente} ${apellidoPaciente}`;
        textoAccion = "CANCELADA";
        iconoAccion = "❌";
        colorAccion = "#ef4444";
        detalleAccion = "El paciente canceló su cita desde el enlace del correo.";
        text = `El paciente ${nombrePaciente} ${apellidoPaciente} ha CANCELADO su cita.\n\n` +
               `• ID Reserva: ${id_reserva}\n` +
               `• Fecha: ${fechaInicio}\n` +
               `• Hora: ${horaInicio}\n\n` +
               `${detalleAccion}`;
        break;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <div style="background: ${colorAccion}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 24px;">${iconoAccion} Cita ${textoAccion}</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p><b>Paciente:</b> ${nombrePaciente} ${apellidoPaciente}</p>
          <p><b>ID Reserva:</b> ${id_reserva}</p>
          <p><b>Fecha:</b> ${fechaInicio}</p>
          <p><b>Hora:</b> ${horaInicio}</p>
          <p><b>Acción:</b> ${detalleAccion}</p>
          <hr style="border: none; border-top: 1px solid #d1d5db; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            Este es un correo automático del sistema de agendamiento de ${fromName}.
          </p>
        </div>
      </div>
    `;

    const payload = {
      sender: { name: fromName, email: fromEmail },
      to: [{ email: destinatario }],
      subject,
      textContent: text,
      htmlContent: html
    };

    if (typeof fetch !== "function") {
      console.warn("[MAIL EQUIPO] Tu Node no tiene fetch (requiere Node 18+). Correo no enviado.");
      return;
    }

    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[MAIL EQUIPO] Brevo error:", resp.status, errText);
      return;
    }

    console.log(`[MAIL EQUIPO] Notificación enviada: Cita ${textoAccion}`);
  }
}
