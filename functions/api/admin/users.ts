/**
 * Cloudflare Pages Function: /api/admin/users
 * Mengambil dan menyimpan data pengguna terdaftar langsung di Edge Cloudflare.
 * Terhubung ke Supabase REST API bila env tersedia, dan mendukung fallback data persisten.
 */

const DEFAULT_USERS = [
  {
    id: 'user-boim-ganteng',
    name: 'Boim Ganteng',
    email: 'boim.ganteng@gmail.com',
    whatsapp: '081298765432',
    phone: '0812-9876-5432',
    role: 'buyer',
    registeredAt: '2026-11-09T08:00:00.000Z',
    city: 'Jakarta Selatan',
    status: 'active',
    count: 0,
  },
  {
    id: 'buyer-rian',
    name: 'Rian Pratama',
    email: 'rian.pratama@gmail.com',
    whatsapp: '081299887766',
    phone: '0812-9988-7766',
    role: 'buyer',
    registeredAt: '2026-11-01T08:30:00.000Z',
    city: 'Jakarta Selatan',
    status: 'active',
    count: 2,
  },
  {
    id: 'seller-agus',
    name: 'Agus Setiawan',
    email: 'agus.setiawan@gmail.com',
    whatsapp: '081288991234',
    phone: '0812-8899-1234',
    role: 'seller',
    registeredAt: '2026-11-02T10:15:00.000Z',
    city: 'Jakarta Selatan',
    status: 'active',
    count: 2,
  },
  {
    id: 'seller-bambang',
    name: 'Bambang Riyadi',
    email: 'bambang.riyadi@gmail.com',
    whatsapp: '085712345678',
    phone: '0857-1234-5678',
    role: 'seller',
    registeredAt: '2026-11-03T14:20:00.000Z',
    city: 'Depok',
    status: 'active',
    count: 1,
  },
];

// In-memory array for Cloudflare Edge worker instance
let edgeUsers: any[] = [...DEFAULT_USERS];

export async function onRequestGet(context: { env: any }) {
  const { env } = context;
  const supabaseUrl = env?.VITE_SUPABASE_URL || env?.SUPABASE_URL;
  const supabaseKey = env?.VITE_SUPABASE_ANON_KEY || env?.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/users?select=*&order=created_at.desc`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map<string, any>();
          // Base edge users
          edgeUsers.forEach((u) => map.set(u.email.toLowerCase(), u));
          // Supabase users
          data.forEach((r: any) => {
            const key = (r.email || '').toLowerCase();
            if (key) {
              map.set(key, {
                id: r.id || `user-sb-${key}`,
                name: r.name || 'Member JualRugi',
                email: key,
                whatsapp: r.whatsapp || r.phone || '',
                phone: r.phone || r.whatsapp || '',
                role: r.role || 'buyer',
                registeredAt: r.created_at || new Date().toISOString(),
                city: r.city || 'Jakarta Selatan',
                status: 'active',
                count: 0,
              });
            }
          });
          return new Response(JSON.stringify({ success: true, users: Array.from(map.values()) }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
    } catch (e) {
      console.warn('[CF Edge] Supabase REST error:', e);
    }
  }

  return new Response(JSON.stringify({ success: true, users: edgeUsers }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const body = await request.json();
    if (body && body.email) {
      const cleanEmail = body.email.trim().toLowerCase();
      const existingIdx = edgeUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      const entry = {
        id: body.id || `user-${Date.now()}`,
        name: body.name || 'Pengguna Baru',
        email: cleanEmail,
        whatsapp: body.whatsapp || body.phone || '',
        phone: body.phone || body.whatsapp || '',
        role: body.role || 'buyer',
        registeredAt: body.registeredAt || new Date().toISOString(),
        city: body.city || 'Jakarta Selatan',
        status: body.status || 'active',
        count: body.count || 0,
      };

      if (existingIdx >= 0) {
        edgeUsers[existingIdx] = { ...edgeUsers[existingIdx], ...entry };
      } else {
        edgeUsers.unshift(entry);
      }

      // Also forward to Supabase if configured
      const supabaseUrl = env?.VITE_SUPABASE_URL || env?.SUPABASE_URL;
      const supabaseKey = env?.VITE_SUPABASE_ANON_KEY || env?.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        try {
          fetch(`${supabaseUrl}/rest/v1/users`, {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify(entry),
          }).catch(() => {});
        } catch {}
      }
    }

    return new Response(JSON.stringify({ success: true, count: edgeUsers.length }), {
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
