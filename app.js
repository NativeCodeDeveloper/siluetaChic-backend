import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import productoRoute from "./view/productoRoutes.js";
import tituloRoutes from "./view/tituloRoutes.js";
import textosRoutes from "./view/textosRoutes.js";
import categoriaRoutes from "./view/categoriaRoutes.js";
import publicacionesRoutes from "./view/publicacionesRoutes.js";
import contactoRouter from "./view/contactoRoutes.js";
import mercadoPagoRouter from "./view/mercadoPagoRoutes.js";
import pedidosRoutes from "./view/pedidosRoutes.js";
import cuponesRoutes from "./view/cuponesRoutes.js";
import correosRoutes from "./view/correosRoutes.js";
import cloudflareRoutes from "./view/CloudflareRoutes.js";
import subCategoriasRoutes from "./view/subCategoriaRoutes.js";
import reservaPacienteRoutes from "./view/reservaPacienteRoutes.js";


const app = express();
app.use(express.json());
app.use(cookieParser());


const corsConfig = {
    origin: true,           // refleja el origin de la petición (permite cualquier origen)
    credentials: true,      // permite envío de cookies; poner false si no quieres cookies
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsConfig));

app.get("/", (req, res) => { res.send("Hola mundo"); });
app.use("/pedidos", pedidosRoutes);
app.use("/reservaPacientes", reservaPacienteRoutes);
app.use("/cloudflare", cloudflareRoutes);
app.use("/correo", correosRoutes);
app.use("/cupon", cuponesRoutes);
app.use("/pagosMercadoPago", mercadoPagoRouter);
app.use("/producto", productoRoute);
app.use("/titulo", tituloRoutes);
app.use("/textos", textosRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/subcategorias", subCategoriasRoutes);
app.use("/publicaciones", publicacionesRoutes);
app.use('/contacto', contactoRouter );

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`BACKEND CORRIENDO SIN PROBLEMAS EN --->  http://localhost:${PORT}`);
})