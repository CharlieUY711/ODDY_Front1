import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";

const apiSecrets = new Hono();

const getSupabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

/* ────────────────────────────────────────────────────
   POST /api-secrets/sync
   Sincronizar un secret con Supabase Edge Functions
   Body: { envKey: string, value: string }
   ──────────────────────────────────────────────────── */
apiSecrets.post("/sync", async (c) => {
  try {
    const body = await c.req.json() as { envKey: string; value: string };
    
    if (!body.envKey || !body.value) {
      return c.json({ ok: false, error: "envKey y value son requeridos" }, 400);
    }

    // Obtener el project ID desde SUPABASE_URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const projectId = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    
    // Obtener el access token de gestión (debe estar configurado como secret)
    const managementToken = Deno.env.get("SUPABASE_ACCESS_TOKEN");
    
    if (!managementToken) {
      return c.json({ 
        ok: false, 
        error: "SUPABASE_ACCESS_TOKEN no está configurado. Configurá tu token de gestión en Supabase → Edge Functions → Secrets" 
      }, 500);
    }

    // Llamar a la API de Supabase Management para actualizar el secret
    // Nota: La API de Supabase Management requiere un access token de gestión
    // que se obtiene de: https://supabase.com/dashboard/account/tokens
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/secrets`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${managementToken}`,
          "Content-Type": "application/json",
          "apikey": managementToken, // Algunas APIs de Supabase requieren también apikey
        },
        body: JSON.stringify({
          name: body.envKey,
          value: body.value,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error sincronizando secret ${body.envKey}:`, errorText);
      return c.json({ 
        ok: false, 
        error: `Error al sincronizar: ${response.status} ${response.statusText}` 
      }, response.status);
    }

    const data = await response.json();
    console.log(`Secret ${body.envKey} sincronizado exitosamente`);
    
    return c.json({ ok: true, message: `Secret ${body.envKey} sincronizado con Supabase` });
  } catch (err) {
    console.error("Error en POST /api-secrets/sync:", err);
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

/* ────────────────────────────────────────────────────
   GET /api-secrets/status/:envKey
   Verificar si un secret está configurado en Supabase
   ──────────────────────────────────────────────────── */
apiSecrets.get("/status/:envKey", async (c) => {
  try {
    const envKey = c.req.param("envKey");
    
    // Obtener el project ID
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const projectId = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    
    // Obtener el access token de gestión
    const managementToken = Deno.env.get("SUPABASE_ACCESS_TOKEN");
    
    if (!managementToken) {
      return c.json({ ok: false, configured: false, error: "SUPABASE_ACCESS_TOKEN no configurado" });
    }

    // Listar todos los secrets
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/secrets`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${managementToken}`,
        },
      }
    );

    if (!response.ok) {
      return c.json({ ok: false, configured: false, error: "Error al verificar secrets" });
    }

    const secrets = await response.json();
    const isConfigured = Array.isArray(secrets) && secrets.some((s: any) => s.name === envKey);
    
    return c.json({ ok: true, configured: isConfigured });
  } catch (err) {
    console.error("Error en GET /api-secrets/status:", err);
    return c.json({ ok: false, configured: false, error: String(err) });
  }
});

export { apiSecrets };
