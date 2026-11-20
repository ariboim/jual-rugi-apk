/**
 * Cloudflare Pages Function: /api/supabase-config
 * Menyimpan dan membagikan kredensial publik Supabase (Project URL & Anon Key) ke runtime worker
 * agar pendaftaran baru dari browser/perangkat mana pun langsung tersimpan permanen ke Supabase.
 */
import {
  getRuntimeSupabaseConfig,
  resolveSupabaseUsersCredentials,
  setRuntimeSupabaseConfig,
} from '../../shared/usersCore.js';

export async function onRequestGet(context: { request: Request; env: any }) {
  const { request, env } = context;
  const resolved = resolveSupabaseUsersCredentials(env || {}, null, request.headers);
  const runtime = getRuntimeSupabaseConfig();
  return new Response(
    JSON.stringify({
      configured: resolved.valid,
      url: resolved.url || runtime.url || '',
      anonKey: resolved.key || runtime.anonKey || '',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestPost(context: { request: Request }) {
  const body: any = await context.request.json().catch(() => ({}));
  const saved = setRuntimeSupabaseConfig(body?.url, body?.anonKey);
  return new Response(
    JSON.stringify({
      success: saved,
      configured: saved,
    }),
    {
      status: saved ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-supabase-url, x-supabase-key',
    },
  });
}
