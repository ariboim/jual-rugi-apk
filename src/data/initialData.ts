import { Listing, Category, PhotoAngle, ProductPhoto } from '../types';

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'bu-001',
    title: 'iPhone 14 Pro 128GB Deep Purple - BU Beli Susu Anak',
    category: 'Smartphone & Gadget',
    normalPrice: 14500000,
    sellingPrice: 8900000,
    discountPercentage: 39,
    location: 'Jakarta Selatan',
    condition: 'Layar mulus 100% TrueTone & FaceID on normal, battery health 86%. Ada lecet halus pemakaian di bezel bawah dekat port charger. Fullset box dan kabel original bawaan.',
    urgentReason: 'Butuh uang tunai hari ini buat nebus obat & susu anak. Siap COD di Blok M Plaza atau Gandaria City.',
    imageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan (Layar Aktif)',
        description: 'Layar OLED 120Hz mulus, Dynamic Island & Face ID 100% normal',
      },
      {
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Belakang & Kamera',
        description: 'Kaca belakang Deep Purple bersih tanpa retak, 3 lensa kamera bening',
      },
      {
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
        label: 'Sisi Bezel & Port Charger',
        description: 'Detail minus lecet halus pemakaian di dekat lubang charger',
      },
      {
        url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
        label: 'Kelengkapan Dus & Aksesoris',
        description: 'Fullset box original sesuai IMEI, kabel data Type-C to Lightning bawaan',
      },
    ],
    isSuperBU: true,
    superBUExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 mins ago
    seller: {
      id: 'seller-agus',
      name: 'Agus Setiawan (Seller)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      location: 'Jakarta Selatan',
      codVerified: true,
      rating: 4.9,
      dealsCompleted: 14,
      joinedDate: 'Januari 2024',
      phoneMasked: '0812-8899-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto fisik asli terverifikasi. Potongan harga 39% wajar untuk transaksi BU darurat.',
    views: 184,
    savedCount: 23,
  },
  {
    id: 'bu-002',
    title: 'Honda Beat Deluxe CBS ISS 2023 Surat Lengkap Pajak Hidup',
    category: 'Sepeda Motor',
    normalPrice: 18200000,
    sellingPrice: 11500000,
    discountPercentage: 37,
    location: 'Bekasi Barat',
    condition: 'Kilometer 14.xxx asli, mesin kering servis rutin AHASS. BPKB & STNK faktur lengkap tangan pertama. Minus baret tipis di sayap kiri bekas parkir sempit.',
    urgentReason: 'BU mendesak mau bayar uang muka kontrakan tahunan. COD wajib cek unit & tes jalan di Kantor Polsek Bekasi Barat.',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan & Lampu LED',
        description: 'Headlamp LED bening dan visor depan mulus tidak kusam',
      },
      {
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
        label: 'Profil Sisi Kanan Motor',
        description: 'Bodi samping striping Deluxe mulus bersih, ban masih tebal',
      },
      {
        url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
        label: 'Speedometer & Kunci Kontak',
        description: 'Odometer 14.xxx asli, indikator ISS & kelistrikan aki tokcer',
      },
      {
        url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1000&q=80',
        label: 'Sayap Kiri (Detail Minus)',
        description: 'Detail minus baret halus bekas gesekan parkiran sempit, tidak retak',
      },
    ],
    isSuperBU: true,
    superBUExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    seller: {
      id: 'seller-bambang',
      name: 'Bambang Riyadi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      location: 'Bekasi Barat',
      codVerified: true,
      rating: 4.8,
      dealsCompleted: 8,
      joinedDate: 'Maret 2024',
      phoneMasked: '0857-1234-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto fisik motor asli terbukti nyata. Diskon 37% memenuhi standar jual rugi.',
    views: 312,
    savedCount: 47,
  },
  {
    id: 'bu-003',
    title: 'MacBook Pro M1 2020 16GB 512GB Space Gray - BU Skripsi',
    category: 'Laptop & Komputer',
    normalPrice: 16500000,
    sellingPrice: 10200000,
    discountPercentage: 38,
    location: 'Bandung',
    condition: 'RAM 16GB langka (bukan 8GB), SSD 512GB. Cycle count baterai 210 Normal. Layar no dead pixel, keyboard lancar. Minus stiker di cover sudah dilepas ada sedikit bayangan halus.',
    urgentReason: 'Butuh dana segera bayar biaya ujian sidang skripsi. COD di Dago atau kampus ITB/Unpad.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan (Layar Nyala)',
        description: 'Layar Retina 13.3 inci jernih tanpa dead pixel atau flexgate',
      },
      {
        url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
        label: 'Cover Atas & Logo Apple',
        description: 'Cover aluminium kokoh, bayangan stiker tipis hampir tidak terlihat',
      },
      {
        url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
        label: 'Sisi Samping & Port Thunderbolt',
        description: 'Dua port Thunderbolt Type-C rapat dan engsel layar kokoh rapat',
      },
      {
        url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
        label: 'Keyboard, Touch Bar & Trackpad',
        description: 'Touch Bar responsif, Touch ID kilat, Magic Keyboard empuk normal',
      },
    ],
    isSuperBU: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    seller: {
      id: 'seller-dani',
      name: 'Dani Pratama',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      location: 'Bandung',
      codVerified: true,
      rating: 5.0,
      dealsCompleted: 6,
      joinedDate: 'November 2024',
      phoneMasked: '0813-7722-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto unit MacBook asli dan diskon 38% valid untuk distress sale.',
    views: 142,
    savedCount: 19,
  },
  {
    id: 'bu-004',
    title: 'Smart TV LG 55 Inch 4K UHD ThinQ AI Model 2023 Lengkap Remote Magic',
    category: 'Elektronik Rumah Tangga',
    normalPrice: 7800000,
    sellingPrice: 4200000,
    discountPercentage: 46,
    location: 'Tangerang Selatan',
    condition: 'Panel LED jernih 100% tanpa garis atau tompel. WebOS lancar, Netflix & YouTube 4K HDR. Lengkap kaki penyangga dan Magic Remote. Dus sudah dibuang.',
    urgentReason: 'Pindahan mendadak ke luar kota akhir pekan ini, repot bawa barang besar. Ambil langsung di Bintaro Sektor 7.',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan (Layar 4K Nyala)',
        description: 'Panel 55 inch 4K HDR mulus tanpa garis, warna kontras tajam',
      },
      {
        url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Belakang & Port Input',
        description: 'Port HDMI eARC, USB, Optical audio semua berfungsi normal',
      },
      {
        url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1000&q=80',
        label: 'Sisi Samping Bezel Tipis',
        description: 'Bodi slim frame modern, tidak ada lecet atau retak di casing',
      },
      {
        url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1000&q=80',
        label: 'Magic Remote & Kaki Penyangga',
        description: 'Remote pointer cursor lancar, kaki meja asli kokoh terpasang',
      },
    ],
    isSuperBU: true,
    superBUExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    seller: {
      id: 'seller-dewi',
      name: 'Ibu Dewi Sandra',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      location: 'Tangerang Selatan',
      codVerified: true,
      rating: 4.9,
      dealsCompleted: 11,
      joinedDate: 'Februari 2024',
      phoneMasked: '0821-4455-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto fisik perabotan rumah asli dan potongan 46% sesuai clearance pindahan.',
    views: 260,
    savedCount: 38,
  },
  {
    id: 'bu-005',
    title: 'Asus ROG Zephyrus G14 Ryzen 7 RTX 3060 16GB 512GB Gaming Laptop',
    category: 'Laptop & Komputer',
    normalPrice: 17500000,
    sellingPrice: 10800000,
    discountPercentage: 38,
    location: 'Surabaya',
    condition: 'Layar 120Hz IPS sRGB 100%, RTX 3060 6GB lancar libas game berat. Suhu normal, charger original 180W. Minus tombol huruf D agak pudar tintanya.',
    urgentReason: 'BU modal usaha konveksi yang lagi terdesak. COD di Tunjungan Plaza atau Marvel City.',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan (RGB Nyala)',
        description: 'Layar 120Hz IPS sRGB 100%, keyboard backlight menyala terang',
      },
      {
        url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80',
        label: 'Cover Belakang AniMe Matrix',
        description: 'Tutup casing metal kokoh bebas baret dan bebas dent sudut',
      },
      {
        url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
        label: 'Keyboard (Minus Huruf D)',
        description: 'Detail minus tinta tombol D agak pudar, fungsi sentuh 100% normal',
      },
      {
        url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
        label: 'Sisi Samping & Sirip Exhaust',
        description: 'Port HDMI, audio jack, Type-C, dan ventilasi udara bersih',
      },
    ],
    isSuperBU: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    seller: {
      id: 'seller-reza',
      name: 'Reza Ardiansyah',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
      location: 'Surabaya',
      codVerified: true,
      rating: 4.7,
      dealsCompleted: 5,
      joinedDate: 'Mei 2024',
      phoneMasked: '0896-3321-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto fisik unit ROG asli terdeteksi jelas.',
    views: 198,
    savedCount: 29,
  },
  {
    id: 'bu-006',
    title: 'Kulkas 2 Pintu Inverter Sharp No Frost Masih Dingin Salju',
    category: 'Elektronik Rumah Tangga',
    normalPrice: 3800000,
    sellingPrice: 1950000,
    discountPercentage: 49,
    location: 'Depok',
    condition: 'Tipe SJ-236ND, hemat listrik hanya 100 Watt inverter. Rak kaca tempered utuh, kompresor original belum pernah servis. Ada stiker anak-anak di pintu samping.',
    urgentReason: 'Rumah mau direnovasi total, kulkas cadangan tidak dipakai lagi. Angkut sendiri di Margonda.',
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan Pintu Ganda',
        description: 'Tampak depan mulus, handle ergonomis dan cat abu-abu bersih',
      },
      {
        url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1000&q=80',
        label: 'Interior Rak Tempered Glass',
        description: 'Kompartemen dalam bersih, lampu LED nyala, rak kaca utuh tanpa retak',
      },
      {
        url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80',
        label: 'Sisi Samping (Stiker Tempelan)',
        description: 'Ada sedikit stiker kartun anak di samping bodi, mudah dilepas',
      },
      {
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
        label: 'Kondisi Kompresor Belakang',
        description: 'Kompresor Sharp J-Tech Inverter orisinil segel belum pernah servis',
      },
    ],
    isSuperBU: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    seller: {
      id: 'seller-hendra',
      name: 'Hendra Gunawan',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      location: 'Depok',
      codVerified: true,
      rating: 4.8,
      dealsCompleted: 9,
      joinedDate: 'April 2024',
      phoneMasked: '0812-9900-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto kulkas fisik nyata di lingkungan rumah tangga.',
    views: 110,
    savedCount: 15,
  },
  {
    id: 'bu-007',
    title: 'Yamaha NMAX 155 Connected ABS 2022 Plat B Pajak Panjang',
    category: 'Sepeda Motor',
    normalPrice: 29500000,
    sellingPrice: 19800000,
    discountPercentage: 33,
    location: 'Jakarta Timur',
    condition: 'KM 19.xxx, kunci keyless remote lengkap 2 pcs. Ban depan belakang baru ganti Maxxis. Mesin halus tarikan responsif. Minus baret tipis di knalpot cover plastik.',
    urgentReason: 'Tutup utang pinjol keluarga hari ini juga. Wajib COD bawa teman di SPBU Raden Inten Duren Sawit.',
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan & Windshield',
        description: 'Headlamp LED ganda terang, visor depan smoke rapi tanpa baret',
      },
      {
        url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
        label: 'Profil Sisi Kiri & Jok',
        description: 'Bodi hitam doff mulus, busa jok empuk jahitan rapi orisinil',
      },
      {
        url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
        label: 'Speedometer Digital Y-Connect',
        description: 'Layar digital mulus, indikator ABS & Bluetooth terkoneksi normal',
      },
      {
        url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1000&q=80',
        label: 'Cover Knalpot (Detail Minus)',
        description: 'Baret tipis pada cover plastik pelindung knalpot akibat senggolan',
      },
    ],
    isSuperBU: true,
    superBUExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    seller: {
      id: 'seller-agus',
      name: 'Agus Setiawan (Seller)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      location: 'Jakarta Timur',
      codVerified: true,
      rating: 4.9,
      dealsCompleted: 14,
      joinedDate: 'Januari 2024',
      phoneMasked: '0812-8899-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Foto fisik Yamaha Nmax asli, STNK terverifikasi aman.',
    views: 420,
    savedCount: 63,
  },
  {
    id: 'bu-008',
    title: 'Samsung Galaxy S23 Ultra 512GB Phantom Black Snapdragon 8 Gen 2',
    category: 'Smartphone & Gadget',
    normalPrice: 17200000,
    sellingPrice: 10500000,
    discountPercentage: 39,
    location: 'Semarang',
    condition: 'S-Pen responsif, kamera 200MP zoom 100x jernih. Sinyal resmi SEIN aman seumur hidup. Minus layar ada goresan rambut (hairline scratch) tidak kelihatan kalau nyala.',
    urgentReason: 'Perlu dana darurat berobat orang tua di RS Kariadi Semarang. COD di Mall Ciputra.',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
    photoAngles: [
      {
        url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Depan (Layar Dynamic AMOLED)',
        description: 'Layar cerah 120Hz, ada hairline scratch tipis tidak tampak saat menyala',
      },
      {
        url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
        label: 'Tampak Belakang & Quad Kamera',
        description: 'Bodi kaca Phantom Black mulus, 4 lensa kamera 200MP bersih',
      },
      {
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
        label: 'Slot Stylus S-Pen & Bezel',
        description: 'Pena S-Pen orisinil mulus dengan sensor gesture Bluetooth aktif',
      },
      {
        url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
        label: 'Dus Box Resmi SEIN',
        description: 'Dus resmi Samsung Electronics Indonesia (SEIN) sinyal aman permanen',
      },
    ],
    isSuperBU: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    seller: {
      id: 'seller-fajar',
      name: 'Fajar Nugroho',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      location: 'Semarang',
      codVerified: true,
      rating: 4.9,
      dealsCompleted: 7,
      joinedDate: 'Desember 2023',
      phoneMasked: '0888-2233-XXXX',
    },
    aiVerified: true,
    aiVerificationReason: 'Unit Samsung asli kondisi wajar, diskon BU 39%.',
    views: 175,
    savedCount: 28,
  },
];

export const DEMO_PRESET_IMAGES = [
  {
    label: '📱 iPhone 14 Pro Fisik Asli (Lolos AI)',
    url: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?auto=format&fit=crop&w=1000&q=80',
    type: 'valid',
    category: 'Smartphone & Gadget' as Category,
    sampleTitle: 'iPhone 13 128GB Midnight Garansi Resmi iBox Mulus',
    normal: 10500000,
    selling: 6200000,
    condition: 'Unit pemakaian pribadi, baterai 88%, bodi mulus pemakaian softcase, kabel ori lengkap.',
    urgentReason: 'BU cepat buat bayar uang sewa toko bulanan.',
  },
  {
    label: '💻 Laptop ASUS Bekas Asli (Lolos AI)',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
    type: 'valid',
    category: 'Laptop & Komputer' as Category,
    sampleTitle: 'ASUS VivoBook 14 Core i5 SSD 512GB Siap Kerja',
    normal: 8200000,
    selling: 4500000,
    condition: 'Fungsi 100% normal lancar jaya, minus baterai tahan 2 jam harus colok adaptor.',
    urgentReason: 'Lagi butuh uang tunai untuk bayar tagihan mendesak.',
  },
  {
    label: '🛵 Motor Matic Fisik Asli (Lolos AI)',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80',
    type: 'valid',
    category: 'Sepeda Motor' as Category,
    sampleTitle: 'Honda Scoopy Prestige 2022 Keyless Pajak Hidup',
    normal: 19500000,
    selling: 12800000,
    condition: 'Surat lengkap BPKB STNK, bodi mulus mesin standar tarikan enteng.',
    urgentReason: 'Butuh dana cepat untuk tambahan modal dagang.',
  },
  {
    label: '🚫 Brosur Flyer Canva / Promo Toko Baru (Uji Tolak AI)',
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80',
    type: 'flyer',
    category: 'Smartphone & Gadget' as Category,
    sampleTitle: 'PROMO FLASH SALE TOKO GADGET DISKON GILA-GILAAN',
    normal: 5000000,
    selling: 4900000, // discount too small (<15%) & flyer marketing
    condition: 'Baru gres bukan barang bekas.',
    urgentReason: 'Iklan promosi toko online.',
  },
];

/**
 * Returns an array of photo angles for any listing,
 * guaranteeing at least 4 distinct inspection angles.
 */
export function getListingPhotoAngles(listing: Listing): PhotoAngle[] {
  if (listing.photoAngles && listing.photoAngles.length > 0) {
    return listing.photoAngles;
  }

  if (listing.images && listing.images.length > 0) {
    const defaultLabels = [
      'Tampak Depan (Utama)',
      'Tampak Belakang',
      'Sisi Samping & Bezel',
      'Detail Fisik / Minus',
    ];
    return listing.images.map((img, idx) => ({
      url: img,
      label: defaultLabels[idx] || `Sudut ${idx + 1}`,
      description: idx === 0 ? 'Tampilan utama fisik barang' : `Tampak sudut ke-${idx + 1}`,
    }));
  }

  // Smart fallback angles based on category if listing only has 1 image
  const categoryAnglePresets: Record<Category, { label: string; desc: string; url: string }[]> = {
    'Smartphone & Gadget': [
      {
        label: 'Tampak Belakang & Bodi',
        desc: 'Bodi belakang dan modul kamera',
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Sisi Samping & Bezel Port',
        desc: 'Sisi samping frame dan lubang port charger',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Kelengkapan & Dus Box',
        desc: 'Aksesoris dan kelengkapan unit bawaan',
        url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    'Sepeda Motor': [
      {
        label: 'Profil Sisi Kanan Kendaraan',
        desc: 'Tampak bodi samping dan knalpot',
        url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Speedometer & Indikator Mesin',
        desc: 'Odometer dan panel kemudi',
        url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Detail Fisik & Kejujuran Minus',
        desc: 'Kondisi riil bodi dan lecet pemakaian',
        url: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    'Laptop & Komputer': [
      {
        label: 'Cover Atas & Logo',
        desc: 'Tampak casing belakang luar monitor',
        url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Keyboard & Trackpad',
        desc: 'Tata letak tuts keyboard dan touchpad',
        url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Sisi Port & Ventilasi Kipas',
        desc: 'Port sambungan kabel dan engsel laptop',
        url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
      },
    ],
    'Elektronik Rumah Tangga': [
      {
        label: 'Tampak Belakang & Port Daya',
        desc: 'Stiker spesifikasi daya dan kabel listrik',
        url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Sisi Samping & Detail Bodi',
        desc: 'Ramping bodi dan sudut casing samping',
        url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=1000&q=80',
      },
      {
        label: 'Kelengkapan Aksesoris / Remote',
        desc: 'Remote kontrol atau kelengkapan bawaan',
        url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=1000&q=80',
      },
    ],
  };

  const presets = categoryAnglePresets[listing.category] || categoryAnglePresets['Smartphone & Gadget'];

  return [
    {
      url: listing.imageUrl,
      label: 'Tampak Depan (Utama)',
      description: 'Foto fisik asli tampak depan produk',
    },
    ...presets.map((p) => ({
      url: p.url,
      label: p.label,
      description: p.desc,
    })),
  ];
}

/**
 * Mengambil array foto produk bertipe ProductPhoto[] dari sebuah Listing
 * Format terintegrasi:
 * [
 *   { id: 'p1', url: 'https://...', caption: '...' }
 * ]
 */
export function getListingPhotos(listing: Listing): ProductPhoto[] {
  if (listing.photos && listing.photos.length > 0) {
    return listing.photos;
  }

  if (listing.photoAngles && listing.photoAngles.length > 0) {
    return listing.photoAngles.map((angle, idx) => ({
      id: `photo-${listing.id}-${idx}`,
      url: angle.url,
      caption: angle.description || angle.label,
      label: angle.label,
      description: angle.description,
    }));
  }

  // Fallback to getListingPhotoAngles
  const angles = getListingPhotoAngles(listing);
  return angles.map((angle, idx) => ({
    id: `photo-${listing.id}-${idx}`,
    url: angle.url,
    caption: angle.description || angle.label,
    label: angle.label,
    description: angle.description,
  }));
}

