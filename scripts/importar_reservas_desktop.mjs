#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, "..");
const PROJECT_DIR = path.resolve(BACKEND_DIR, "..");
const DESKTOP_DIR = "/Users/nicolas/Desktop";

const RESERVAS_XLSX = path.join(DESKTOP_DIR, "reservas_453521_1773150124.xlsx");
const CLIENTES_XLSX = path.join(DESKTOP_DIR, "BASE DE DATOS CLIENTES AL 10-03.xlsx");
const ENV_PATH = path.join(BACKEND_DIR, ".env");
const REPORTE_PATH = path.join(DESKTOP_DIR, "reporte_importacion_reservas.json");

const require = createRequire(path.join(BACKEND_DIR, "package.json"));
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");

dotenv.config({ path: ENV_PATH });

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG.split("=")[1]) : null;

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_DATABASE) {
    throw new Error(`Faltan variables DB_* en ${ENV_PATH}`);
}

function readWorkbookRows(xlsxPath) {
    const pythonScript = `
import json
import sys
from datetime import datetime, date, time
from openpyxl import load_workbook

def cast(value):
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%d %H:%M:%S')
    if isinstance(value, date):
        return value.strftime('%Y-%m-%d')
    if isinstance(value, time):
        return value.strftime('%H:%M:%S')
    return value

path = sys.argv[1]
wb = load_workbook(path, data_only=True)
ws = wb[wb.sheetnames[0]]
rows = list(ws.iter_rows(values_only=True))
headers = [str(h).strip() if h is not None else '' for h in rows[0]]
data = []
for row in rows[1:]:
    if not any(cell is not None and str(cell).strip() != '' for cell in row):
        continue
    item = {}
    for idx, header in enumerate(headers):
        item[header] = cast(row[idx] if idx < len(row) else None)
    data.append(item)
print(json.dumps(data, ensure_ascii=False))
`;

    const stdout = execFileSync("python3", ["-c", pythonScript, xlsxPath], {
        encoding: "utf8",
    });

    return JSON.parse(stdout);
}

function normalizeText(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length > 0 ? text : null;
}

function normalizeEmail(value) {
    const email = normalizeText(value);
    return email ? email.toLowerCase() : null;
}

function normalizePhone(value) {
    const phone = normalizeText(value);
    return phone || null;
}

function formatRut(value) {
    const raw = normalizeText(value);
    if (!raw) {
        return null;
    }

    const cleaned = raw.replace(/[^0-9kK]/g, "").toUpperCase();
    if (cleaned.length < 2) {
        return raw;
    }

    const dv = cleaned.slice(-1);
    const body = cleaned.slice(0, -1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formattedBody}-${dv}`;
}

function normalizeDate(value) {
    const text = normalizeText(value);
    if (!text) {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
        return text.slice(0, 10);
    }

    throw new Error(`Fecha no reconocida: ${value}`);
}

function normalizeTime(value) {
    const text = normalizeText(value);
    if (!text) {
        return null;
    }

    const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) {
        throw new Error(`Hora no reconocida: ${value}`);
    }

    const [, hh, mm, ss = "00"] = match;
    return `${hh.padStart(2, "0")}:${mm}:${ss}`;
}

function buildClientMap(rows) {
    const map = new Map();

    for (const row of rows) {
        const rut = formatRut(row.RUT);
        if (!rut) {
            continue;
        }

        map.set(rut, {
            nombre: normalizeText(row.Nombres),
            apellido: normalizeText(row.Apellidos),
            correo: normalizeEmail(row.Email),
            telefono: normalizePhone(row["Teléfono"]),
        });
    }

    return map;
}

function buildReservationRows(rows, clientMap) {
    return rows.map((row, index) => {
        const rut = formatRut(row.RUT);
        const client = clientMap.get(rut) ?? {};

        return {
            excelRow: index + 2,
            nombrePaciente: normalizeText(row.Nombre) ?? client.nombre,
            apellidoPaciente: normalizeText(row.Apellido) ?? client.apellido,
            rut,
            telefono: normalizePhone(row["Teléfono"]) ?? client.telefono,
            email: normalizeEmail(row["E-mail"]) ?? client.correo,
            fechaInicio: normalizeDate(row["FECHA INICIO"]),
            fechaFinalizacion: normalizeDate(row["FECHA FINAL"]),
            horaInicio: normalizeTime(row["HORA INICIO"]),
            horaFinalizacion: normalizeTime(row["HORA FINAL"]),
            estadoReserva: "reservada",
        };
    });
}

function validateReservationRow(row) {
    const requiredFields = [
        "nombrePaciente",
        "apellidoPaciente",
        "rut",
        "telefono",
        "email",
        "fechaInicio",
        "fechaFinalizacion",
        "horaInicio",
        "horaFinalizacion",
        "estadoReserva",
    ];

    const missing = requiredFields.filter((field) => !row[field]);
    if (missing.length > 0) {
        throw new Error(`faltan campos requeridos: ${missing.join(", ")}`);
    }

    if (row.fechaInicio !== row.fechaFinalizacion) {
        throw new Error("la reserva debe iniciar y terminar el mismo día");
    }
}

async function validarDisponibilidad(connection, row) {
    const query = `
        SELECT COUNT(*) AS cnt
        FROM reservaPacientes
        WHERE NOT (
            TIMESTAMP(fechaFinalizacion, horaFinalizacion) <= TIMESTAMP(?, ?)
            OR TIMESTAMP(fechaInicio, horaInicio) >= TIMESTAMP(?, ?)
        )
    `;

    const params = [row.fechaInicio, row.horaInicio, row.fechaFinalizacion, row.horaFinalizacion];
    const [rows] = await connection.query(query, params);
    return rows[0].cnt === 0;
}

async function buscarPacientePorRut(connection, rut) {
    const query = `
        SELECT *
        FROM pacienteDatos
        WHERE rut = ?
          AND estado_paciente <> 0
        LIMIT 1
    `;

    const [rows] = await connection.query(query, [rut]);
    return rows[0] ?? null;
}

async function insertarPaciente(connection, row) {
    const query = `
        INSERT INTO pacienteDatos (
            nombre,
            apellido,
            rut,
            nacimiento,
            sexo,
            prevision_id,
            telefono,
            correo,
            direccion,
            pais,
            observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        row.nombrePaciente,
        row.apellidoPaciente,
        row.rut,
        null,
        null,
        0,
        row.telefono,
        row.email,
        null,
        "chile",
        null,
    ];

    const [result] = await connection.query(query, params);
    return result;
}

async function insertarReserva(connection, row) {
    const query = `
        INSERT INTO reservaPacientes (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        row.nombrePaciente,
        row.apellidoPaciente,
        row.rut,
        row.telefono,
        row.email,
        row.fechaInicio,
        row.horaInicio,
        row.fechaFinalizacion,
        row.horaFinalizacion,
        row.estadoReserva,
    ];

    const [result] = await connection.query(query, params);
    return result;
}

async function insertarFicha(connection, idPaciente, row) {
    const query = `
        INSERT INTO fichaClinica (
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        idPaciente,
        "Agendamiento Automatico",
        null,
        null,
        null,
        `Hora de Agendamiento: ${row.horaInicio} - ${row.horaFinalizacion}`,
        null,
        null,
        null,
        null,
        row.fechaFinalizacion,
        null,
    ];

    const [result] = await connection.query(query, params);
    return result;
}

async function main() {
    if (!fs.existsSync(RESERVAS_XLSX)) {
        throw new Error(`No existe ${RESERVAS_XLSX}`);
    }

    if (!fs.existsSync(CLIENTES_XLSX)) {
        throw new Error(`No existe ${CLIENTES_XLSX}`);
    }

    const clientesRows = readWorkbookRows(CLIENTES_XLSX);
    const reservasRows = readWorkbookRows(RESERVAS_XLSX);
    const clientMap = buildClientMap(clientesRows);
    const reservationRows = buildReservationRows(reservasRows, clientMap);
    const rowsToProcess = LIMIT ? reservationRows.slice(0, LIMIT) : reservationRows;

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        port: Number(process.env.DB_PORT || 3306),
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
    });

    const summary = {
        dryRun: DRY_RUN,
        processed: 0,
        insertedPatients: 0,
        reusedPatients: 0,
        insertedReservations: 0,
        insertedClinicalRecords: 0,
        skippedConflicts: 0,
        skippedInvalidRows: 0,
        errors: 0,
        details: [],
    };

    try {
        for (const row of rowsToProcess) {
            const detail = {
                excelRow: row.excelRow,
                rut: row.rut,
                nombrePaciente: row.nombrePaciente,
                fechaInicio: row.fechaInicio,
                horaInicio: row.horaInicio,
                horaFinalizacion: row.horaFinalizacion,
            };

            summary.processed += 1;

            try {
                validateReservationRow(row);

                const connection = await pool.getConnection();
                try {
                    const disponible = await validarDisponibilidad(connection, row);
                    if (!disponible) {
                        summary.skippedConflicts += 1;
                        detail.status = "conflicto";
                        detail.message = "La reserva se superpone con un bloque ya existente";
                        summary.details.push(detail);
                        continue;
                    }

                    let paciente = await buscarPacientePorRut(connection, row.rut);

                    if (!paciente) {
                        if (!DRY_RUN) {
                            await insertarPaciente(connection, row);
                            paciente = await buscarPacientePorRut(connection, row.rut);
                        }

                        if (paciente) {
                            summary.insertedPatients += 1;
                            detail.patientAction = "insertado";
                            detail.id_paciente = paciente.id_paciente;
                        } else if (DRY_RUN) {
                            summary.insertedPatients += 1;
                            detail.patientAction = "insertado_dry_run";
                        } else {
                            throw new Error("No se pudo recuperar el paciente después de insertarlo");
                        }
                    } else {
                        summary.reusedPatients += 1;
                        detail.patientAction = "existente";
                        detail.id_paciente = paciente.id_paciente;
                    }

                    if (!DRY_RUN) {
                        const reservaResult = await insertarReserva(connection, row);
                        summary.insertedReservations += 1;
                        detail.id_reserva = reservaResult.insertId;

                        if (paciente?.id_paciente) {
                            const fichaResult = await insertarFicha(connection, paciente.id_paciente, row);
                            summary.insertedClinicalRecords += 1;
                            detail.id_ficha = fichaResult.insertId;
                            detail.status = "ok";
                        } else {
                            detail.status = "sin_ficha";
                            detail.message = "La reserva se insertó, pero no fue posible generar la ficha clínica";
                        }
                    } else {
                        summary.insertedReservations += 1;
                        summary.insertedClinicalRecords += 1;
                        detail.status = "dry_run_ok";
                    }

                    summary.details.push(detail);
                } finally {
                    connection.release();
                }
            } catch (error) {
                summary.errors += 1;
                summary.skippedInvalidRows += 1;
                detail.status = "error";
                detail.message = error.message;
                summary.details.push(detail);
            }
        }
    } finally {
        await pool.end();
    }

    fs.writeFileSync(REPORTE_PATH, JSON.stringify(summary, null, 2), "utf8");

    console.log("");
    console.log(`Proyecto: ${PROJECT_DIR}`);
    console.log(`Modo: ${DRY_RUN ? "dry-run" : "ejecucion"}`);
    console.log(`Filas procesadas: ${summary.processed}`);
    console.log(`Pacientes insertados: ${summary.insertedPatients}`);
    console.log(`Pacientes existentes: ${summary.reusedPatients}`);
    console.log(`Reservas insertadas: ${summary.insertedReservations}`);
    console.log(`Fichas insertadas: ${summary.insertedClinicalRecords}`);
    console.log(`Conflictos: ${summary.skippedConflicts}`);
    console.log(`Errores: ${summary.errors}`);
    console.log(`Reporte: ${REPORTE_PATH}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
