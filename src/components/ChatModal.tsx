import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  CheckCheck,
  Building2,
  Coffee,
  ShoppingBag,
  Car,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, Listing, UserProfile } from '../types';

interface ChatModalProps {
  onClose: () => void;
  listing: Listing;
  currentUser: UserProfile;
  initialOfferText?: string;
}

const SENSITIVE_REGEX =
  /(rekening|transfer|dp\b|bca\b|mandiri\b|bri\b|bni\b|dana\b|gopay\b|ovo\b|\b\d{10,16}\b)/i;

export const ChatModal: React.FC<ChatModalProps> = ({
  onClose,
  listing,
  currentUser,
  initialOfferText,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialList: ChatMessage[] = [
      {
        id: 'msg-init-1',
        listingId: listing.id,
        senderId: listing.seller.id,
        senderName: listing.seller.name,
        senderRole: 'seller',
        text: `Halo! Saya jual cepat ${listing.title} karena lagi Butuh Uang (BU). Silakan cek kondisi dan ajukan jadwal COD tatap muka ya.`,
        timestamp: 'Hari ini, 10:15',
        hasSensitiveWarning: false,
      },
    ];

    if (initialOfferText) {
      const hasSensitive = SENSITIVE_REGEX.test(initialOfferText);
      initialList.push({
        id: 'msg-init-2',
        listingId: listing.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        text: initialOfferText,
        timestamp: 'Baru saja',
        hasSensitiveWarning: hasSensitive,
      });
    }

    return initialList;
  });

  const [inputText, setInputText] = useState('');
  const [showCodSpotsModal, setShowCodSpotsModal] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'buyer' | 'seller'>(currentUser.role);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkSensitiveKeywords = (text: string) => {
    return SENSITIVE_REGEX.test(text);
  };

  const handleSendMessage = (textToSend?: string, isCod?: boolean, codSpot?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const hasWarning = checkSensitiveKeywords(text);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      listingId: listing.id,
      senderId: activeSpeaker === 'buyer' ? currentUser.id : listing.seller.id,
      senderName: activeSpeaker === 'buyer' ? currentUser.name : listing.seller.name,
      senderRole: activeSpeaker,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      hasSensitiveWarning: hasWarning,
      isCodProposal: isCod,
      codLocation: codSpot,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    if (activeSpeaker === 'buyer' && !isCod) {
      setTimeout(() => {
        const replyText = hasWarning
          ? 'Maaf kak, saya patuh aturan JualRugi.id. TIDAK TERIMA TRANSFER ATAU DP. Wajib COD ketemuan langsung, tes unit baru bayar cash.'
          : 'Bisa kak! Unit siap dibawa. Mau COD di minimarket terdekat atau mall mana biar sama-sama aman?';

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            listingId: listing.id,
            senderId: listing.seller.id,
            senderName: listing.seller.name,
            senderRole: 'seller',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            hasSensitiveWarning: false,
          },
        ]);
      }, 1200);
    }
  };

  const handleSelectCodSpot = (spotName: string, spotDesc: string) => {
    const proposal = `📍 [AJUKAN TITIK COD AMAN]\nLokasi: ${spotName} (${spotDesc})\n"Halo kak, saya minat serius unit ini. Yuk kita ketemuan COD di sini untuk cek barang langsung & bayar di tempat. Jam berapa bisa?"`;
    handleSendMessage(proposal, true, spotName);
    setShowCodSpotsModal(false);
  };

  const SAFE_COD_SPOTS = [
    {
      name: 'Indomaret Point / Alfamart Ramai',
      desc: 'Area terang, banyak CCTV & kasir',
      icon: ShoppingBag,
      color: 'text-sky-700 bg-sky-50',
    },
    {
      name: 'Pos Satpam / Kantor Polsek Terdekat',
      desc: 'Sangat aman, 100% bebas kriminalitas',
      icon: Building2,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      name: 'Kafe / Food Court Mall Terbuka',
      desc: 'Ramai pengunjung, ada stopkontak tes unit',
      icon: Coffee,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      name: 'SPBU Pertamina Terbuka (Depan Bright)',
      desc: 'Akses parkir luas & terang benderang',
      icon: Car,
      color: 'text-red-700 bg-red-50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 backdrop-blur-xs p-2 sm:p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-2xl flex flex-col h-[92vh] max-h-[750px] overflow-hidden text-slate-800">
        {/* Chat Header */}
        <div className="px-4 py-2.5 bg-white border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={listing.seller.avatar}
                alt={listing.seller.name}
                className="w-10 h-10 rounded-full object-cover border border-sky-200"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-sky-950 truncate max-w-[150px]">
                  {listing.seller.name}
                </h3>
                <span className="text-[10px] text-sky-800 font-bold bg-sky-100 px-1.5 py-0.2 rounded-xs">
                  COD Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[190px]">
                Iklan: {listing.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setActiveSpeaker((prev) => (prev === 'buyer' ? 'seller' : 'buyer'))
              }
              title="Beralih peran chat"
              className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[10px] font-bold text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5 text-sky-600" />
              <span>{activeSpeaker === 'buyer' ? 'Ketik sbg Pembeli' : 'Ketik sbg Penjual'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-sky-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Warning Banner */}
        <div className="bg-amber-300 text-amber-950 px-3.5 py-2 text-[11px] font-bold shrink-0 flex items-start gap-2 shadow-xs border-b border-amber-400">
          <AlertTriangle className="w-4 h-4 text-amber-900 shrink-0 mt-0.5" />
          <div className="leading-snug">
            ⚠️ PERINGATAN KEAMANAN: Aplikasi tidak bertanggung jawab atas kerugian atau penipuan. Wajib transaksi tatap muka (COD) di tempat umum ramai. JANGAN PERNAH transfer DP atau uang muka!
          </div>
        </div>

        {/* Product Mini Header Bar */}
        <div className="px-3 py-2 bg-sky-50/60 border-b border-sky-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 truncate">
            <img
              src={listing.imageUrl}
              alt=""
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-sky-200"
            />
            <div className="truncate">
              <span className="font-bold text-sky-950 block truncate">{listing.title}</span>
              <span className="text-[11px] text-sky-800 font-black">
                Rp {listing.sellingPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-500 text-white shrink-0">
            Diskon {listing.discountPercentage}% BU
          </span>
        </div>

        {/* Chat Messages List */}
        <div className="grow overflow-y-auto p-4 space-y-3.5 bg-sky-50/40">
          {messages.map((msg) => {
            const isMe = msg.senderRole === activeSpeaker;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-slate-500 mb-1 px-1">
                  {msg.senderName} ({msg.senderRole === 'seller' ? 'Penjual' : 'Pembeli'})
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 shadow-xs ${
                    isMe
                      ? 'bg-sky-500 text-white rounded-tr-xs shadow-sky-500/20'
                      : 'bg-white text-slate-800 rounded-tl-xs border border-sky-100'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Sensitive Keyword Guard Red Pop-up */}
                  {msg.hasSensitiveWarning && (
                    <div className="mt-2 p-2.5 rounded-xl bg-red-50 border-2 border-red-500 text-red-950 text-[11px] font-bold flex items-start gap-2 shadow-xs animate-pulse">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-red-700 uppercase tracking-wide block font-black">
                          🚨 Terdeteksi ajakan transfer jarak jauh!
                        </span>
                        <span className="text-red-900 font-semibold">
                          Tolak pembayaran non-COD untuk mencegah penipuan.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center justify-end gap-1 text-[9px] pt-1 ${isMe ? 'text-sky-100' : 'text-slate-400'}`}>
                    <span>{msg.timestamp}</span>
                    <CheckCheck className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Demo Triggers */}
        <div className="px-3 py-1.5 bg-white border-t border-sky-100 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 no-scrollbar">
          <span className="text-slate-500 font-bold shrink-0">Tes:</span>
          <button
            onClick={() =>
              handleSendMessage(
                'Boleh minta nomor rekening BCA buat transfer DP 100rb biar barang di-booking?'
              )
            }
            className="px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-medium shrink-0 cursor-pointer"
          >
            ⚠️ Uji Trigger Rekening / Transfer DP
          </button>
          <button
            onClick={() =>
              handleSendMessage('Saya siap bayar tunai waktu ketemu COD langsung. Lokasi aman ya.')
            }
            className="px-2 py-1 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-medium shrink-0 cursor-pointer"
          >
            ✅ Respon Aman COD
          </button>
        </div>

        {/* Bottom Input & Quick Action Bar */}
        <div className="p-3 bg-white border-t border-sky-100 shrink-0 space-y-2">
          {/* "Ajukan Titik COD" Button - Sky Blue */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCodSpotsModal(true)}
              className="py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-200" />
              <span>📍 Ajukan Titik COD Aman</span>
            </button>
            <span className="text-[10px] text-slate-500">
              Kirim saran lokasi umum & ramai
            </span>
          </div>

          {/* Text Input Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Tulis pesan sbg ${activeSpeaker === 'buyer' ? 'Pembeli' : 'Penjual'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="grow px-3.5 py-2.5 rounded-xl bg-sky-50/50 border border-sky-200 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-xs outline-none shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white transition active:scale-95 cursor-pointer shadow-xs shadow-sky-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Modal: Ajukan Titik COD Selector */}
        {showCodSpotsModal && (
          <div className="absolute inset-0 z-50 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-sky-100 p-4 shadow-2xl space-y-3 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <h4 className="text-sm font-bold text-sky-950">Pilih Titik COD Ramai & Aman</h4>
                </div>
                <button
                  onClick={() => setShowCodSpotsModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {SAFE_COD_SPOTS.map((spot, idx) => {
                  const Icon = spot.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectCodSpot(spot.name, spot.desc)}
                      className="w-full p-2.5 rounded-xl bg-sky-50/50 hover:bg-sky-100 border border-sky-100 flex items-start gap-2.5 transition text-left cursor-pointer group active:scale-98"
                    >
                      <div className={`p-2 rounded-lg ${spot.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-sky-950 group-hover:text-sky-600">
                          {spot.name}
                        </h5>
                        <p className="text-[10px] text-slate-500">{spot.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowCodSpotsModal(false)}
                className="w-full py-2 rounded-xl bg-sky-50 text-sky-800 text-xs font-semibold hover:bg-sky-100 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
