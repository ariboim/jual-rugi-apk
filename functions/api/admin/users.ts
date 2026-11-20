/**
 * Cloudflare Pages Function: /api/admin/users
 * Mengambil dan menyimpan data pengguna terdaftar langsung di Edge Cloudflare + Supabase REST API.
 * Mendukung penyimpanan tunggal maupun batch backfill agar data pendaftar lama & baru selalu terakumulasi.
 */
import {
  listRegisteredUsers,
  setRuntimeSupabaseConfig,
  upsertRegisteredUser,
  upsertRegisteredUsersBatch,
} from '../../../shared/usersCore.js';

export async function onRequestGet(context: { request: Request; env: any }) {
  const { request, env } = context;
  try {
    const hUrl = request.headers.get('x-supabase-url');
    const hKey = request.headers.get('x-supabase-key');
    if (hUrl && hKey) setRuntimeSupabaseConfig(hUrl, hKey);

    const result = await listRegisteredUsers(env || {}, null, null, request.headers);
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Gagal memuat pengguna.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const body: any = await request.json().catch(() => ({}));
    if (body?.supabaseConfig?.url && body?.supabaseConfig?.anonKey) {
      setRuntimeSupabaseConfig(body.supabaseConfig.url, body.supabaseConfig.anonKey);
    }

    if (Array.isArray(body?.users)) {
      const batchResult = await upsertRegisteredUsersBatch(
        body.users,
        env || {},
        null,
        body?.supabaseConfig || null,
        request.headers
      );
      const latest = await listRegisteredUsers(
        env || {},
        null,
        body?.supabaseConfig || null,
        request.headers
      );
      return new Response(JSON.stringify({ ...batchResult, ...latest }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const result = await upsertRegisteredUser(
      body,
      env || {},
      null,
      body?.supabaseConfig || null,
      request.headers
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
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
