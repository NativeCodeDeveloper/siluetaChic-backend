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
    estadoReserva
  }) {
    const { BREVO_API_KEY, CORREO_RECEPTOR, NOMBRE_EMPRESA } = process.env;

    // No romper el flujo principal si falta configuración
    if (!BREVO_API_KEY) {
      console.warn("[MAIL] BREVO_API_KEY no configurada. Correo no enviado.");
      return;
    }

    if (!to) {
      console.warn("[MAIL] Destinatario vacío. Correo no enviado.");
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

    const subject = "¡Tu cita con Silueta Chic ha sido confirmada! 🎉";

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
      `Saludos.`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>¡Tu cita con Silueta Chic ha sido confirmada! 🎉</h2>
        <p>Hola <b>${nombrePaciente} ${apellidoPaciente}</b>,</p>
        <p><b>Detalle de tu reserva:</b></p>
        <ul>
          <li><b>RUT:</b> ${rut}</li>
          <li><b>Teléfono:</b> ${telefono}</li>
          <li><b>Inicio:</b> ${fechaInicio} ${horaInicio}</li>
          <li><b>Término:</b> ${fechaFinalizacion} ${horaFinalizacion}</li>
          <li><b>Estado:</b> ${estadoReserva}</li>
        </ul>
        <hr />
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
        <p>Si necesitas modificar o cancelar tu reserva, responde este correo.</p>
        <p>Saludos.</p>
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

    // Si quieres debug, descomenta:
    // const data = await resp.json();
    // console.log("[MAIL] Enviado OK:", data);
  }
}
