import express from "express";
import NotificacionAgendamientoController from "../controller/NotificacionAgendamientoController.js";

const router = express.Router();

// Ruta para confirmar una cita
router.get("/confirmar", NotificacionAgendamientoController.confirmarCita);

// Ruta para cancelar una cita
router.get("/cancelar", NotificacionAgendamientoController.cancelarCita);

export default router;
