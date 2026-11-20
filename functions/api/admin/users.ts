/**
 * Cloudflare Pages Function: /api/admin/users
 * Mengambil dan menyimpan data pengguna terdaftar langsung di Edge Cloudflare + Supabase REST API.
 */
import { listRegisteredUsers, upsertRegisteredUser } from '../../../shared/usersCore.js';

export async function onRequestGet(context: { request: Request; env: any }) {
  const { request, env } = context;
  try {
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
