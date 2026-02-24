import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { personas } from "./personas.tsx";
import { organizaciones } from "./organizaciones.tsx";
import { roles } from "./roles.tsx";
import { pedidos } from "./pedidos.tsx";
import { metodosPago } from "./metodos_pago.tsx";
import { metodosEnvio } from "./metodos_envio.tsx";
import { etiquetas } from "./etiquetas.tsx";
import { roadmap } from "./roadmap.tsx";
import { ideasBoard } from "./ideas_board.tsx";
import { cargaMasiva } from "./carga_masiva.tsx";
import { ageVerification } from "./age_verification.tsx";
import { rrss } from "./rrss.tsx";
import { apiSecrets } from "./api_secrets.tsx";
import { productos } from "./productos.tsx";
import { departamentos } from "./departamentos.tsx";
import { preguntas } from "./preguntas.tsx";
import { ratings } from "./ratings.tsx";
import { catalogExtractor } from "./catalog_extractor.tsx";
import carrito from "./carrito.tsx";
import ordenes from "./ordenes.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Session-Id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-75638143/health", (c) => {
  return c.json({ status: "ok" });
});

// Personas, Organizaciones y Roles
app.route("/make-server-75638143/personas", personas);
app.route("/make-server-75638143/organizaciones", organizaciones);
app.route("/make-server-75638143/roles", roles);

// eCommerce
app.route("/make-server-75638143/pedidos", pedidos);
app.route("/make-server-75638143/metodos-pago", metodosPago);
app.route("/make-server-75638143/metodos-envio", metodosEnvio);

// Marketing
app.route("/make-server-75638143/etiquetas", etiquetas);

// Roadmap + archivos adjuntos
app.route("/make-server-75638143/roadmap", roadmap);

// Ideas Board
app.route("/make-server-75638143/ideas", ideasBoard);

// Carga Masiva de Archivos
app.route("/make-server-75638143/carga-masiva", cargaMasiva);

// Verificación de Edad + MetaMap
app.route("/make-server-75638143/age-verification", ageVerification);

// Redes Sociales — RRSS (Meta: Instagram + Facebook)
app.route("/make-server-75638143/rrss", rrss);

// Gestión de Secrets de APIs
app.route("/make-server-75638143/api-secrets", apiSecrets);

// Marketplace — Productos, Departamentos, Preguntas, Ratings
app.route("/make-server-75638143/productos", productos);
app.route("/make-server-75638143/departamentos", departamentos);
app.route("/make-server-75638143/preguntas", preguntas);
app.route("/make-server-75638143/ratings", ratings);

// Carrito y Órdenes
app.route("/make-server-75638143/carrito", carrito);
app.route("/make-server-75638143/ordenes", ordenes);

// Catalog Extractor — Extracción de productos desde catálogos
app.route("/make-server-75638143/catalog-extractor", catalogExtractor);

Deno.serve(app.fetch);