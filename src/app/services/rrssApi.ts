/* =====================================================
   RRSS API Service — Frontend ↔ Backend
   Charlie Marketplace Builder v1.5
   ===================================================== */
import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-75638143/rrss`;
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

export type Platform = 'instagram' | 'facebook';

export interface PlatformStatus {
  hasCreds:    boolean;
  savedAt:     string | null;
  verified:    boolean;
  accountName: string | null;
  accountId:   string | null;
  verifiedAt:  string | null;
  error:       string | null;
  status:      'no_creds' | 'pending' | 'connected' | 'coming_soon';
}

export interface AllStatus {
  instagram: PlatformStatus;
  facebook:  PlatformStatus;
  whatsapp:  PlatformStatus;
}

export interface PlatformCreds {
  appId:     string;
  appSecret: string;
  token:     string;
  accountId: string;
  pageId:    string;
  savedAt:   string;
  masked: {
    appId:     string;
    appSecret: string;
    token:     string;
    accountId: string;
    pageId:    string;
  };
  verified: {
    verified:    boolean;
    accountName: string;
    accountId:   string;
    verifiedAt:  string;
    error?:      string;
  } | null;
}

export interface VerifyResult {
  verified:    boolean;
  accountName: string;
  accountId:   string;
  verifiedAt:  string;
  error?:      string;
}

/* ── Helpers ── */
async function apiGet<T>(path: string): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
    return await res.json();
  } catch (err) {
    console.error(`RRSS API GET ${path}:`, err);
    return { ok: false, error: String(err) };
  }
}

async function apiPost<T>(path: string, body?: unknown): Promise<{ ok: boolean; data?: T; error?: string } & Record<string, unknown>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: HEADERS,
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch (err) {
    console.error(`RRSS API POST ${path}:`, err);
    return { ok: false, error: String(err) };
  }
}

async function apiDelete(path: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: HEADERS });
    return await res.json();
  } catch (err) {
    console.error(`RRSS API DELETE ${path}:`, err);
    return { ok: false, error: String(err) };
  }
}

/* ── Public API ── */

/** Get real status of all platforms from the database */
export async function getStatus(): Promise<AllStatus | null> {
  const res = await apiGet<AllStatus>('/status');
  if (!res.ok || !res.data) return null;
  return res.data;
}

/** Get saved credentials for a platform (real values for editing) */
export async function getCreds(platform: Platform): Promise<PlatformCreds | null> {
  const res = await apiGet<PlatformCreds>(`/creds/${platform}`);
  if (!res.ok) return null;
  return res.data ?? null;
}

/** Save credentials to the database */
export async function saveCreds(
  platform: Platform,
  creds: { appId: string; appSecret: string; token: string; accountId?: string; pageId?: string }
): Promise<{ ok: boolean; savedAt?: string; error?: string }> {
  const res = await apiPost<never>(`/creds/${platform}`, creds);
  return { ok: res.ok, savedAt: res.savedAt as string | undefined, error: res.error };
}

/** Delete credentials from the database */
export async function deleteCreds(platform: Platform): Promise<{ ok: boolean; error?: string }> {
  return apiDelete(`/creds/${platform}`);
}

/** Verify credentials via Meta Graph API — result saved in DB */
export async function verifyCreds(platform: Platform): Promise<{ ok: boolean; data?: VerifyResult; error?: string }> {
  const res = await apiPost<VerifyResult>(`/verify/${platform}`);
  return { ok: res.ok, data: res.data, error: res.error };
}
