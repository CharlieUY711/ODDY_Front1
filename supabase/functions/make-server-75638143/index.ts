import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "../server/kv_store.tsx";
import { personas } from "../server/personas.tsx";
import { organizaciones } from "../server/organizaciones.tsx";
import { roles } from "../server/roles.tsx";
import { pedidos } from "../server/pedidos.tsx";
import { metodosPago } from "../server/metodos_pago.tsx";
import { metodosEnvio } from "../server/metodos_envio.tsx";
import { etiquetas } from "../server/etiquetas.tsx";
import { roadmap } from "../server/roadmap.tsx";
import { ideasBoard } from "../server/ideas_board.tsx";
import { cargaMasiva } from "../server/carga_masiva.tsx";
import { ageVerification } from "../server/age_verification.tsx";
import { rrss } from "../server/rrss.tsx";
import { apiSecrets } from "../server/api_secrets.tsx";
import { productos } from "../server/productos.tsx";
import { departamentos } from "../server/departamentos.tsx";
import { preguntas } from "../server/preguntas.tsx";
import { ratings } from "../server/ratings.tsx";
import { catalogExtractor } from "../server/catalog_extractor.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
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

// Catalog Extractor — Extracción de productos desde catálogos
app.route("/make-server-75638143/catalog-extractor", catalogExtractor);

Deno.serve(app.fetch);
