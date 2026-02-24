/**
 * Roadmap — módulos + archivos adjuntos por módulo
 * Bucket: make-75638143-module-files
 * KV keys:
 *   roadmap:modules            → estado de todos los módulos
 *   module-files:{moduleId}    → array de ModuleFileEntry
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const roadmap = new Hono();

const BUCKET = "make-75638143-module-files";

const getSupabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

/* ── Inicializar bucket al arrancar ─────────────────── */
(async () => {
  try {
    const supabase = getSupabase();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, { public: false });
      console.log(`[roadmap] Bucket ${BUCKET} creado`);
    }
  } catch (err) {
    console.log(`[roadmap] Error inicializando bucket: ${err}`);
  }
})();

/* ══════════════════════════════════════════════════════
   MÓDULOS — estado del roadmap
══════════════════════════════════════════════════════ */

/** GET /modules — carga todos los estados */
roadmap.get("/modules", async (c) => {
  try {
    const data = await kv.get("roadmap:modules");
    return c.json({ modules: data ?? [] });
  } catch (err) {
    console.log(`[roadmap] GET /modules error: ${err}`);
    return c.json({ error: `Error cargando módulos: ${err}` }, 500);
  }
});

/** POST /modules-bulk — guarda todos los estados */
roadmap.post("/modules-bulk", async (c) => {
  try {
    const { modules } = await c.req.json();
    await kv.set("roadmap:modules", modules);
    return c.json({ ok: true });
  } catch (err) {
    console.log(`[roadmap] POST /modules-bulk error: ${err}`);
    return c.json({ error: `Error guardando módulos: ${err}` }, 500);
  }
});

/** POST /modules/:moduleId — guarda el estado de un módulo individual */
roadmap.post("/modules/:moduleId", async (c) => {
  try {
    const moduleId = c.req.param("moduleId");
    const updatedModule = await c.req.json();

    // Load existing array, replace or append this module
    const existing: any[] = ((await kv.get("roadmap:modules")) ?? []) as any[];
    const idx = existing.findIndex((m: any) => m.id === moduleId);
    if (idx !== -1) {
      existing[idx] = updatedModule;
    } else {
      existing.push(updatedModule);
    }
    await kv.set("roadmap:modules", existing);
    console.log(`[roadmap] POST /modules/${moduleId} — estado actualizado`);
    return c.json({ ok: true });
  } catch (err) {
    console.log(`[roadmap] POST /modules/:moduleId error: ${err}`);
    return c.json({ error: `Error actualizando módulo: ${err}` }, 500);
  }
});

/** DELETE /modules/reset — limpia todos los estados guardados (fuerza resync desde manifest) */
roadmap.delete("/modules/reset", async (c) => {
  try {
    await kv.set("roadmap:modules", []);
    console.log("[roadmap] DELETE /modules/reset — KV borrado, próximo load recomputa desde manifest");
    return c.json({ ok: true, message: "Estado del roadmap reseteado. El próximo load aplicará el manifest." });
  } catch (err) {
    console.log(`[roadmap] DELETE /modules/reset error: ${err}`);
    return c.json({ error: `Error reseteando: ${err}` }, 500);
  }
});

/* ══════════════════════════════════════════════════════
   ARCHIVOS — adjuntos por módulo
   Tipos: definicion | variables | otros
══════════════════════════════════════════════════════ */

/** GET /files/:moduleId — lista archivos + URLs firmadas (1h) */
roadmap.get("/files/:moduleId", async (c) => {
  try {
    const moduleId = c.req.param("moduleId");
    const files = ((await kv.get(`module-files:${moduleId}`)) ?? []) as any[];

    const supabase = getSupabase();
    const filesWithUrls = await Promise.all(
      files.map(async (f: any) => {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(f.path, 3600);
        return { ...f, url: data?.signedUrl ?? null };
      })
    );

    return c.json({ files: filesWithUrls });
  } catch (err) {
    console.log(`[roadmap] GET /files/:moduleId error: ${err}`);
    return c.json({ error: `Error cargando archivos: ${err}` }, 500);
  }
});

/** POST /files/upload — sube un archivo al bucket */
roadmap.post("/files/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file     = formData.get("file")     as File   | null;
    const moduleId = formData.get("moduleId") as string | null;
    const fileType = formData.get("fileType") as string | null; // definicion | variables | otros

    if (!file || !moduleId || !fileType) {
      return c.json({ error: "Faltan campos requeridos: file, moduleId, fileType" }, 400);
    }

    const supabase = getSupabase();
    const fileId   = crypto.randomUUID();
    const parts    = file.name.split(".");
    const ext      = parts.length > 1 ? parts.pop()! : "bin";
    const safeName = parts.join(".").replace(/[^a-z0-9_\-]/gi, "_");
    const storagePath = `${moduleId}/${fileType}/${fileId}_${safeName}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream" });

    if (uploadErr) {
      console.log(`[roadmap] Storage upload error: ${uploadErr.message}`);
      return c.json({ error: `Error subiendo archivo: ${uploadErr.message}` }, 500);
    }

    const entry = {
      id:         fileId,
      moduleId,
      type:       fileType,
      name:       file.name,
      size:       file.size,
      path:       storagePath,
      uploadedAt: new Date().toISOString(),
    };

    const kvKey   = `module-files:${moduleId}`;
    const existing = ((await kv.get(kvKey)) ?? []) as any[];
    await kv.set(kvKey, [...existing, entry]);

    console.log(`[roadmap] Archivo subido: ${storagePath} (${file.size} bytes)`);
    return c.json({ ok: true, file: entry });
  } catch (err) {
    console.log(`[roadmap] POST /files/upload error: ${err}`);
    return c.json({ error: `Error en upload: ${err}` }, 500);
  }
});

/** DELETE /files/:moduleId/:fileId — elimina archivo de storage y KV */
roadmap.delete("/files/:moduleId/:fileId", async (c) => {
  try {
    const moduleId = c.req.param("moduleId");
    const fileId   = c.req.param("fileId");
    const kvKey    = `module-files:${moduleId}`;

    const files = ((await kv.get(kvKey)) ?? []) as any[];
    const file  = files.find((f: any) => f.id === fileId);

    if (!file) {
      return c.json({ error: "Archivo no encontrado" }, 404);
    }

    const supabase = getSupabase();
    const { error: delErr } = await supabase.storage
      .from(BUCKET)
      .remove([file.path]);

    if (delErr) {
      console.log(`[roadmap] Storage delete error: ${delErr.message}`);
    }

    await kv.set(kvKey, files.filter((f: any) => f.id !== fileId));
    return c.json({ ok: true });
  } catch (err) {
    console.log(`[roadmap] DELETE /files error: ${err}`);
    return c.json({ error: `Error eliminando archivo: ${err}` }, 500);
  }
});

export { roadmap };