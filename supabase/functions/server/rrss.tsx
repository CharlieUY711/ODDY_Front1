/* =====================================================
   RRSS — Redes Sociales Backend Module
   Gestión real de credenciales Meta (Instagram + Facebook)
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { Hono } from "npm:hono";
import * as kv  from "./kv_store.tsx";

export const rrss = new Hono();

/* ── KV key helpers ─────────────────────────────────── */
const CREDS_KEY    = (p: string) => `rrss_creds_${p}`;
const VERIFIED_KEY = (p: string) => `rrss_verified_${p}`;

type Platform = "instagram" | "facebook";

interface Creds {
  appId:     string;
  appSecret: string;
  token:     string;
  accountId?: string; // Instagram
  pageId?:    string; // Facebook
  savedAt:   string;
}

interface VerifiedState {
  verified:    boolean;
  accountName: string;
  accountId:   string;
  verifiedAt:  string;
  error?:      string;
}

/* ── Mask secret helper ─────────────────────────────── */
function mask(val: string | undefined): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••••••" + val.slice(-4);
}

/* ────────────────────────────────────────────────────
   GET /rrss/status
   Returns real connection status for all platforms
   ──────────────────────────────────────────────────── */
rrss.get("/status", async (c) => {
  try {
    const platforms: Platform[] = ["instagram", "facebook"];
    const result: Record<string, unknown> = {};

    for (const platform of platforms) {
      const creds    = await kv.get(CREDS_KEY(platform))    as Creds | null;
      const verified = await kv.get(VERIFIED_KEY(platform)) as VerifiedState | null;

      result[platform] = {
        hasCreds:    !!creds,
        savedAt:     creds?.savedAt ?? null,
        verified:    verified?.verified ?? false,
        accountName: verified?.accountName ?? null,
        accountId:   verified?.accountId ?? null,
        verifiedAt:  verified?.verifiedAt ?? null,
        error:       verified?.error ?? null,
        // status label for UI
        status: !creds
          ? "no_creds"
          : (verified?.verified ? "connected" : "pending"),
      };
    }

    // WhatsApp — no Meta Graph integration yet, mark as coming soon
    result.whatsapp = { status: "coming_soon", hasCreds: false, verified: false };

    return c.json({ ok: true, data: result });
  } catch (err) {
    console.log("Error GET /rrss/status:", err);
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

/* ────────────────────────────────────────────────────
   GET /rrss/creds/:platform
   Returns masked credentials + metadata
   ──────────────────────────────────────────────────── */
rrss.get("/creds/:platform", async (c) => {
  const platform = c.req.param("platform") as Platform;
  try {
    const creds    = await kv.get(CREDS_KEY(platform))    as Creds | null;
    const verified = await kv.get(VERIFIED_KEY(platform)) as VerifiedState | null;

    if (!creds) {
      return c.json({ ok: true, data: null });
    }

    return c.json({
      ok: true,
      data: {
        // Return real values so the form can display them (user already saved them)
        appId:     creds.appId,
        appSecret: creds.appSecret,
        token:     creds.token,
        accountId: creds.accountId ?? "",
        pageId:    creds.pageId    ?? "",
        savedAt:   creds.savedAt,
        // Masks for display in non-edit contexts
        masked: {
          appId:     mask(creds.appId),
          appSecret: mask(creds.appSecret),
          token:     mask(creds.token),
          accountId: mask(creds.accountId),
          pageId:    mask(creds.pageId),
        },
        verified: verified ?? null,
      },
    });
  } catch (err) {
    console.log(`Error GET /rrss/creds/${platform}:`, err);
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

/* ────────────────────────────────────────────────────
   POST /rrss/creds/:platform
   Save credentials (body: { appId, appSecret, token, accountId|pageId })
   ──────────────────────────────────────────────────── */
rrss.post("/creds/:platform", async (c) => {
  const platform = c.req.param("platform") as Platform;
  try {
    const body = await c.req.json() as Partial<Creds>;

    if (!body.appId || !body.appSecret || !body.token) {
      return c.json({ ok: false, error: "Faltan campos requeridos: appId, appSecret, token" }, 400);
    }

    const payload: Creds = {
      appId:     body.appId.trim(),
      appSecret: body.appSecret.trim(),
      token:     body.token.trim(),
      accountId: body.accountId?.trim() ?? undefined,
      pageId:    body.pageId?.trim()    ?? undefined,
      savedAt:   new Date().toISOString(),
    };

    await kv.set(CREDS_KEY(platform), payload);

    // Reset verification state when credentials change
    await kv.del(VERIFIED_KEY(platform));

    console.log(`RRSS: credentials saved for ${platform}`);
    return c.json({ ok: true, savedAt: payload.savedAt });
  } catch (err) {
    console.log(`Error POST /rrss/creds/${platform}:`, err);
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

/* ────────────────────────────────────────────────────
   DELETE /rrss/creds/:platform
   Remove credentials + verification
   ──────────────────────────────────────────────────── */
rrss.delete("/creds/:platform", async (c) => {
  const platform = c.req.param("platform") as Platform;
  try {
    await kv.del(CREDS_KEY(platform));
    await kv.del(VERIFIED_KEY(platform));
    console.log(`RRSS: credentials deleted for ${platform}`);
    return c.json({ ok: true });
  } catch (err) {
    console.log(`Error DELETE /rrss/creds/${platform}:`, err);
    return c.json({ ok: false, error: String(err) }, 500);
  }
});

/* ────────────────────────────────────────────────────
   POST /rrss/verify/:platform
   Verify credentials via Meta Graph API
   Saves verification result to KV
   ──────────────────────────────────────────────────── */
rrss.post("/verify/:platform", async (c) => {
  const platform = c.req.param("platform") as Platform;
  try {
    const creds = await kv.get(CREDS_KEY(platform)) as Creds | null;

    if (!creds) {
      return c.json({ ok: false, error: "No hay credenciales guardadas. Guardá primero." }, 400);
    }

    // Call Meta Graph API — verify Access Token
    let verifiedState: VerifiedState;
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(creds.token)}`
      );
      const data = await res.json() as { id?: string; name?: string; error?: { message: string; code: number } };

      if (data.error) {
        verifiedState = {
          verified:    false,
          accountName: "",
          accountId:   "",
          verifiedAt:  new Date().toISOString(),
          error:       `Meta API error ${data.error.code}: ${data.error.message}`,
        };
      } else {
        verifiedState = {
          verified:    true,
          accountName: data.name ?? "Desconocido",
          accountId:   data.id   ?? "",
          verifiedAt:  new Date().toISOString(),
        };
      }
    } catch (fetchErr) {
      verifiedState = {
        verified:    false,
        accountName: "",
        accountId:   "",
        verifiedAt:  new Date().toISOString(),
        error:       `Error de red al contactar Meta: ${String(fetchErr)}`,
      };
    }

    await kv.set(VERIFIED_KEY(platform), verifiedState);

    console.log(`RRSS: verification for ${platform} → ${verifiedState.verified}`);
    return c.json({ ok: true, data: verifiedState });
  } catch (err) {
    console.log(`Error POST /rrss/verify/${platform}:`, err);
    return c.json({ ok: false, error: String(err) }, 500);
  }
});
