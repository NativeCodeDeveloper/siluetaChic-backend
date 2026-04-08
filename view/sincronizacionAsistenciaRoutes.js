import { Router } from "express";
import SincronizacionAsistenciaController from "../controller/SincronizacionAsistenciaController.js";

const router = Router();

// Sincroniza el estado desde el calendario (reserva) hacia la ficha asociada
router.post("/desdeReserva", SincronizacionAsistenciaController.sincronizarDesdeReserva);

// Sincroniza el estado desde la ficha hacia la reserva asociada
router.post("/desdeFicha", SincronizacionAsistenciaController.sincronizarDesdeFicha);

export default router;
