interface RewriterElement {
  setInnerContent(content: string): RewriterElement;
  setAttribute(name: string, value: string): RewriterElement;
  remove(): RewriterElement;
}

declare class HTMLRewriter {
  on(
    selector: string,
    handlers: {
      element?: (element: RewriterElement) => void | Promise<void>;
    }
  ): HTMLRewriter;
  transform(response: Response): Response;
}

interface Env {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SITE_URL?: string;
  APP_URL?: string;
}

interface CatalogOgItem {
  title: string;
  selling_price: number;
  discount_percentage: number;
  location: string;
  urgent_reason: string;
  condition?: string;
  image_url: string;
}

const CURATED_OG_CATALOG: Record<string, CatalogOgItem> = {
  'bu-001': {
    title: 'iPhone 14 Pro 128GB Deep Purple - BU Beli Susu Anak',
    selling_price: 8900000,
    discount_percentage: 39,
    location: 'Jakarta Selatan',
    urgent_reason:
      'Butuh uang tunai hari ini buat nebus obat & susu anak. Siap COD Blok M / Gandaria City.',
    image_url:
      'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
  'bu-002': {
    title: 'Honda Beat Deluxe CBS ISS 2023 Surat Lengkap Pajak Hidup',
    selling_price: 11500000,
    discount_percentage: 37,
    location: 'Bekasi Barat',
    urgent_reason: 'BU mendesak bayar kontrakan tahunan. COD & cek unit di Bekasi Barat.',
    image_url:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
  'bu-003': {
    title: 'MacBook Pro M1 2020 16GB 512GB Space Gray - BU Skripsi',
    selling_price: 10200000,
    discount_percentage: 38,
    location: 'Bandung',
    urgent_reason: 'Butuh dana segera bayar biaya ujian sidang skripsi. COD Dago / ITB / Unpad.',
    image_url:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
  'bu-004': {
    title: 'Smart TV LG 55 Inch 4K UHD ThinQ Model 2023 Lengkap Remote Magic',
    selling_price: 4200000,
    discount_percentage: 46,
    location: 'Tangerang Selatan',
    urgent_reason: 'Pindahan mendadak ke luar kota. Ambil langsung di Bintaro Sektor 7.',
    image_url:
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
  'bu-005': {
    title: 'Asus ROG Zephyrus G14 Ryzen 7 RTX 3060 16GB 512GB Gaming Laptop',
    selling_price: 10800000,
    discount_percentage: 38,
    location: 'Surabaya',
    urgent_reason: 'BU modal usaha konveksi terdesak. COD Tunjungan Plaza atau Marvel City.',
    image_url:
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
  'bu-006': {
    title: 'Kulkas 2 Pintu Inverter Sharp No Frost Masih Dingin Salju',
    selling_price: 1950000,
    discount_percentage: 49,
    location: 'Depok',
    urgent_reason: 'Rumah mau direnovasi total, kulkas cadangan tidak terpakai. COD Margonda.',
    image_url: 'https://jualrugi.my.id/assets/images/sharp_kulkas_2pintu.jpg',
  },
  'bu-007': {
    title: 'Yamaha NMAX 155 Connected ABS 2022 Plat B Pajak Panjang',
    selling_price: 19800000,
    discount_percentage: 33,
    location: 'Jakarta Timur',
    urgent_reason: 'Butuh dana cepat hari ini. Wajib COD di SPBU Raden Inten Duren Sawit.',
    image_url:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
  'bu-008': {
    title: 'Samsung Galaxy S23 Ultra 512GB Phantom Black Snapdragon 8 Gen 2',
    selling_price: 10500000,
    discount_percentage: 39,
    location: 'Semarang',
    urgent_reason: 'Perlu dana darurat berobat orang tua. COD Mall Ciputra Semarang.',
    image_url:
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80&fm=jpg',
  },
};

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const { request, env, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname === '/sitemap.xml') {
    return next();
  }

  const pathMatch = url.pathname.match(/^\/(?:product|iklan)\/([^/?#]+)/i);
  const requestedId = String(
    url.searchParams.get('id') ||
      url.searchParams.get('deal') ||
      (pathMatch ? decodeURIComponent(pathMatch[1]) : '')
  ).trim();

  const response = await next();
  const contentType = response.headers.get('content-type') || '';
  if (!requestedId || !contentType.includes('text/html') || typeof HTMLRewriter === 'undefined') {
    return response;
  }

  let listing: CatalogOgItem | null = null;
  const sbUrl = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  const sbKey = String(
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
  ).trim();

  if (sbUrl && sbUrl.startsWith('http') && !sbUrl.includes('your-project-id') && sbKey.length > 20) {
    try {
      const sbRes = await fetch(
        `${sbUrl}/rest/v1/listings?select=id,title,selling_price,normal_price,discount_percentage,location,urgent_reason,condition,image_url&id=eq.${encodeURIComponent(requestedId)}&limit=1`,
        {
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            Accept: 'application/json',
          },
        }
      );
      if (sbRes.ok) {
        const rows: any[] = await sbRes.json().catch(() => []);
        if (Array.isArray(rows) && rows[0]) {
          listing = rows[0];
        }
      }
    } catch {
      // Fallback to built-in catalog
    }
  }

  if (!listing) {
    listing =
      CURATED_OG_CATALOG[requestedId] || CURATED_OG_CATALOG[requestedId.toLowerCase()] || null;
  }

  if (!listing) {
    return response;
  }

  const siteOrigin = (env.SITE_URL || env.APP_URL || 'https://jualrugi.my.id').replace(/\/+$/, '');
  const rawImg = String(listing.image_url || '').trim();
  let ogImage = `${siteOrigin}/og-image.jpg?v=3`;
  let isCustomProductImage = false;

  if (rawImg && !rawImg.startsWith('data:') && !rawImg.startsWith('blob:')) {
    if (/^https?:\/\//i.test(rawImg)) {
      ogImage =
        rawImg.includes('images.unsplash.com') && !rawImg.includes('fm=')
          ? `${rawImg}${rawImg.includes('?') ? '&' : '?'}fm=jpg`
          : rawImg;
      isCustomProductImage = true;
    } else if (rawImg.startsWith('/')) {
      ogImage = `${siteOrigin}${rawImg}`;
      isCustomProductImage = true;
    }
  }

  const priceNum = Number(listing.selling_price || 0);
  const discNum = Number(listing.discount_percentage || 0);
  const priceText = priceNum > 0 ? `Rp ${priceNum.toLocaleString('id-ID')}` : 'Harga BU';
  const discText = discNum > 0 ? ` (Hemat ${discNum}%)` : '';
  const ogTitle = `${String(listing.title || 'Barang BU').trim()} - ${priceText}${discText} | JualRugi.my.id`;
  const locText = listing.location ? `COD ${listing.location}. ` : '';
  const rawReason = String(listing.urgent_reason || listing.condition || '').trim();
  const ogDescription = `${locText}${rawReason || 'Barang Butuh Uang (BU) siap COD aman di JualRugi.my.id.'}`.slice(
    0,
    200
  );
  const ogUrl = `${siteOrigin}/?id=${encodeURIComponent(requestedId)}`;

  let rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(ogTitle);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', ogDescription);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', ogUrl);
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', ogTitle);
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', ogDescription);
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', ogUrl);
      },
    })
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute('content', ogImage);
      },
    })
    .on('meta[property="og:image:secure_url"]', {
      element(el) {
        el.setAttribute('content', ogImage);
      },
    })
    .on('meta[property="og:image:alt"]', {
      element(el) {
        el.setAttribute('content', String(listing.title || 'JualRugi.my.id'));
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', ogTitle);
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', ogDescription);
      },
    })
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute('content', ogImage);
      },
    })
    .on('link[rel="image_src"]', {
      element(el) {
        el.setAttribute('href', ogImage);
      },
    });

  if (isCustomProductImage) {
    rewriter = rewriter
      .on('meta[property="og:image:type"]', {
        element(el) {
          el.remove();
        },
      })
      .on('meta[property="og:image:width"]', {
        element(el) {
          el.remove();
        },
      })
      .on('meta[property="og:image:height"]', {
        element(el) {
          el.remove();
        },
      });
  }

  return rewriter.transform(response);
}
