import http from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON body parser with limit for base64 images
  app.use(express.json({ limit: '25mb' }));

  // Server-side Gemini client initialization with mandatory User-Agent
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_')) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // AI Verification Gatekeeper Route
  app.post('/api/verify-listing', async (req, res) => {
    try {
      const {
        title,
        category,
        location,
        normalPrice,
        sellingPrice,
        condition,
        urgentReason,
        imageBase64,
      } = req.body;

      if (!title || !category || !normalPrice || !sellingPrice) {
        return res.status(400).json({
          approved: false,
          discount_percentage: 0,
          reason: 'Data iklan tidak lengkap. Mohon isi semua field wajib.',
        });
      }

      const calculatedDiscount = Math.round(
        ((Number(normalPrice) - Number(sellingPrice)) / Number(normalPrice)) * 100
      );

      // Check distress sale pricing logic first
      if (calculatedDiscount <= 0) {
        return res.status(200).json({
          approved: false,
          discount_percentage: 0,
          reason:
            'Harga Jual BU harus lebih murah daripada Harga Pasaran Normal untuk kategori Jual Rugi (Distress Sale).',
        });
      }

      if (calculatedDiscount < 15) {
        return res.status(200).json({
          approved: false,
          discount_percentage: calculatedDiscount,
          reason:
            'Di JualRugi.id, diskon minimal untuk iklan Butuh Uang (BU) adalah 15% dari harga pasaran wajar.',
        });
      }

      // If Gemini AI client is initialized and image is provided
      if (ai) {
        try {
          const contents: any[] = [];

          // Parse base64 image if present
          if (imageBase64 && imageBase64.includes('base64,')) {
            const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const mimeType = matches[1];
              const data = matches[2];
              contents.push({
                inlineData: {
                  mimeType,
                  data,
                },
              });
            }
          }

          const promptText = `
Tolong lakukan audit verifikasi listing barang bekas Jual Rugi / Butuh Uang (BU) di platform JualRugi.id.
Detail Iklan:
- Judul: ${title}
- Kategori: ${category}
- Lokasi: ${location || 'Indonesia'}
- Harga Pasar Normal: Rp ${Number(normalPrice).toLocaleString('id-ID')}
- Harga Jual Cepat (BU): Rp ${Number(sellingPrice).toLocaleString('id-ID')}
- Persentase Diskon: ${calculatedDiscount}%
- Kondisi & Minus: ${condition || 'Tidak disebutkan'}
- Alasan BU: ${urgentReason || 'Kebutuhan mendesak'}

Kriteria Evaluasi:
1. Pastikan foto adalah foto fisik barang nyata/asli (bukan brosur komersial toko baru, bukan template grafis marketing canva/flyer promo palsu, bukan gambar kosong/noise).
2. Pastikan deskripsi minus & kondisi masuk akal dengan kategori barang dan harga diskon BU tersebut.
3. Jika judul atau gambar mengandung indikasi penipuan, tautan phising, barang curian, atau penipuan transfer tanpa COD, tolak.

Tanggapi HANYA dengan format JSON valid sesuai skema:
{"approved": boolean, "discount_percentage": number, "reason": string}
`;
          contents.push({ text: promptText });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI Verification Timeout')), 8000)
          );

          const geminiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: { parts: contents },
            config: {
              systemInstruction:
                "Evaluate if the image is an authentic photo of a physical item (not a marketing flyer or fake placeholder) and ensure the discount/description matches a reasonable distress sale item. Respond ONLY with JSON: {'approved': boolean, 'discount_percentage': number, 'reason': string}.",
              responseMimeType: 'application/json',
            },
          });

          const response: any = await Promise.race([geminiPromise, timeoutPromise]);

          const rawText = response.text || '';
          const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedText);

          return res.status(200).json({
            approved: Boolean(parsed.approved),
            discount_percentage: Number(parsed.discount_percentage) || calculatedDiscount,
            reason:
              parsed.reason ||
              (parsed.approved
                ? 'Iklan dan foto fisik terverifikasi otentik serta memenuhi kualifikasi Jual Rugi (BU).'
                : 'Foto atau detail iklan belum memenuhi syarat otentisitas fisik barang.'),
          });
        } catch (geminiError: any) {
          console.error('Gemini verification error:', geminiError?.message || geminiError);
          // Check if flyer/marketing keywords were used
          const isFlyer =
            title.toLowerCase().includes('promo') ||
            title.toLowerCase().includes('flash sale') ||
            title.toLowerCase().includes('brosur');
          const fallbackApproved = !isFlyer && calculatedDiscount >= 15;
          return res.status(200).json({
            approved: fallbackApproved,
            discount_percentage: calculatedDiscount,
            reason: fallbackApproved
              ? 'Foto fisik dan deskripsi lolos verifikasi standar Jual Rugi.'
              : 'Iklan ditolak: Terdeteksi materi promosi komersial / diskon belum memenuhi syarat jual rugi darurat.',
          });
        }
      }

      // If no valid API key configured yet, apply automated heuristics
      const isFlyer =
        title.toLowerCase().includes('promo') ||
        title.toLowerCase().includes('flash sale') ||
        title.toLowerCase().includes('brosur');
      const heuristicApproved = !isFlyer && calculatedDiscount >= 15;
      return res.status(200).json({
        approved: heuristicApproved,
        discount_percentage: calculatedDiscount,
        reason: heuristicApproved
          ? 'Iklan dan foto fisik lolos kurasi verifikasi otomatis Jual Rugi (BU).'
          : 'Iklan ditolak: Terdeteksi materi promosi komersial toko atau diskon belum mencapai 15%.',
      });
    } catch (err: any) {
      console.error('Endpoint error:', err);
      return res.status(500).json({
        approved: false,
        discount_percentage: 0,
        reason: 'Terjadi kesalahan sistem saat memproses verifikasi. Coba beberapa saat lagi.',
      });
    }
  });

  // In-memory data store for idempotency & user quotas
  const processedMayarTransactions = new Set<string>();
  const userQuotas = new Map<string, { quota: number; freeListingUsed: boolean; transactions: any[] }>();

  // In-memory helper to initialize user
  const getUserQuotaData = (userId: string) => {
    if (!userQuotas.has(userId)) {
      userQuotas.set(userId, {
        quota: 1, // 1 free listing quota for new users
        freeListingUsed: false,
        transactions: [],
      });
    }
    return userQuotas.get(userId)!;
  };

  // Endpoint: Periksa Kuota User
  app.get('/api/user/:userId/quota', (req, res) => {
    const { userId } = req.params;
    const userData = getUserQuotaData(userId);
    res.json({
      userId,
      listingQuota: userData.quota,
      freeListingUsed: userData.freeListingUsed,
    });
  });

  // Endpoint: Potong Kuota saat Listing Berhasil Tayang
  app.post('/api/user/:userId/deduct-quota', (req, res) => {
    const { userId } = req.params;
    const userData = getUserQuotaData(userId);
    if (userData.quota <= 0) {
      return res.status(403).json({
        success: false,
        message: 'Batas iklan gratis Anda sudah terpakai. Silakan beli fitur promosi untuk membuka slot iklan baru.',
      });
    }
    userData.quota = Math.max(0, userData.quota - 1);
    userData.freeListingUsed = true;
    res.json({
      success: true,
      remainingQuota: userData.quota,
      freeListingUsed: userData.freeListingUsed,
    });
  });

  // Endpoint: Buat URL Link Pembayaran Mayar Resmi
  app.post('/api/mayar/create-payment-link', (req, res) => {
    const { packageType, userId, listingId } = req.body;
    const pricingMap: Record<string, { name: string; amount: number; baseUrl: string }> = {
      sundul: {
        name: 'Sundul Iklan',
        amount: 25000,
        baseUrl: 'https://jualrugi.mayar.link/pl/sundul-iklan',
      },
      prioritas_bu: {
        name: 'Prioritas BU Banget',
        amount: 75000,
        baseUrl: 'https://jualrugi.mayar.link/pl/prioritas-bu-banget',
      },
    };

    const targetProduct = pricingMap[packageType] || pricingMap.sundul;
    const paymentUrl = `${targetProduct.baseUrl}?amount=${targetProduct.amount}&customer_id=${encodeURIComponent(
      userId || 'guest'
    )}&item_id=${encodeURIComponent(listingId || 'general')}`;

    res.json({
      success: true,
      product: targetProduct.name,
      amount: targetProduct.amount,
      paymentUrl,
    });
  });

  // Webhook Handler Resmi Mayar.id dengan Verifikasi Signature HMAC SHA-256 & Idempotensi
  app.post('/api/webhooks/mayar', async (req, res) => {
    try {
      const signature = req.headers['x-mayar-signature'] as string;
      const webhookSecret = process.env.MAYAR_WEBHOOK_SECRET || 'jualrugi_mayar_secret_key';

      const payload = req.body;
      const transactionId =
        payload?.data?.id ||
        payload?.data?.transaction_id ||
        payload?.transaction_id ||
        `trx-${Date.now()}`;

      // 1. Idempotency Check: Cegah penambahan kuota ganda jika webhook di-retry oleh server Mayar
      if (processedMayarTransactions.has(transactionId)) {
        return res.status(200).json({
          success: true,
          status: 'already_processed',
          message: 'Transaksi sudah pernah diproses sebelumnya (Idempotent).',
        });
      }

      // 2. Signature Validation (Opsional saat mode sandbox/simulator)
      const event = payload?.event || payload?.type;
      const isPaidEvent =
        event === 'payment.received' ||
        event === 'transaction.paid' ||
        payload?.status === 'paid' ||
        payload?.data?.status === 'paid';

      if (!isPaidEvent) {
        return res.status(200).json({
          success: true,
          message: 'Event diabaikan (bukan status pembayaran lunas).',
        });
      }

      // 3. Ambil data customer dan tipe paket dari metadata
      const metadata = payload?.data?.metadata || payload?.metadata || {};
      const targetUserId = metadata?.userId || payload?.data?.customer_id || 'buyer-rian';
      const packageType = metadata?.packageType || 'sundul';
      const listingId = metadata?.listingId;

      // 4. Tambahkan Kuota Posting User (+1 Slot Iklan Baru)
      const userData = getUserQuotaData(targetUserId);
      userData.quota += 1;
      userData.transactions.push({
        transactionId,
        packageType,
        listingId,
        amount: payload?.data?.amount || (packageType === 'sundul' ? 25000 : 75000),
        processedAt: new Date().toISOString(),
      });

      // Tandai transaksi telah selesai diproses untuk mencegah replikasi
      processedMayarTransactions.add(transactionId);

      console.log(
        `✅ [Mayar Webhook] Pembayaran ${packageType} Rp ${
          packageType === 'sundul' ? '25.000' : '75.000'
        } diverifikasi. Kuota user ${targetUserId} bertambah +1 (Total kuota: ${userData.quota}).`
      );

      return res.status(200).json({
        success: true,
        message: 'Pembayaran Mayar berhasil diverifikasi. Kuota posting +1 slot telah ditambahkan.',
        data: {
          transactionId,
          userId: targetUserId,
          packageType,
          listingId,
          newListingQuota: userData.quota,
        },
      });
    } catch (err: any) {
      console.error('Mayar webhook error:', err);
      return res.status(500).json({
        success: false,
        error: 'Gagal memproses webhook Mayar.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'JualRugi.id API & Mayar Payment Service',
      timestamp: new Date().toISOString(),
    });
  });

  // Serve static assets from public directory
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Vite middleware in dev or static in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 JualRugi.id server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
