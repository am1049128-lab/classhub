import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  getMenfestList,
  addMenfest,
  addMenfestReply,
  toggleLikeMenfest,
  isSupabaseConfigured 
} from '../lib/supabase';

const CATEGORIES = [
  { id: 'Semua', label: '🌟 Semua' },
  { id: 'Curhat', label: '💭 Curhat' },
  { id: 'Apresiasi', label: '💖 Apresiasi' },
  { id: 'Semangat', label: '🔥 Semangat' },
  { id: 'Info', label: '📢 Info & Spill' },
  { id: 'Lucu', label: '😂 Lucu / Meme' },
];

const CARD_COLORS = {
  purple: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300',
  blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300',
  emerald: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
  rose: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-300',
  amber: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
};

export default function Menfest({ onMenfestChange }) {
  const { isDark } = useTheme();

  const [menfestList, setMenfestList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSupabase, setIsSupabase] = useState(false);
  const [filterCat, setFilterCat] = useState('Semua');
  const [search, setSearch] = useState('');

  // Form input
  const [toWho, setToWho] = useState('');
  const [sender, setSender] = useState('');
  const [isAnon, setIsAnon] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replySender, setReplySender] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Load menfest
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getMenfestList();
      const nextList = res.data || [];
      setMenfestList(nextList);
      onMenfestChange?.(nextList);
      setIsSupabase(res.isSupabase || isSupabaseConfigured());
    } catch (err) {
      console.warn('Gagal memuat menfest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleKirim = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        to_who: toWho.trim() || 'Semua Orang',
        sender: isAnon ? 'Anonim 🎭' : (sender.trim() || 'Anonim 🎭'),
        message: message.trim(),
        category: 'Umum',
        color: selectedColor,
      };

      const res = await addMenfest(payload);
      setMenfestList(prev => {
        const nextList = [res, ...prev];
        onMenfestChange?.(nextList);
        return nextList;
      });

      // Reset form
      setMessage('');
      setToWho('');
      setSender('');
      setIsAnon(true);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      alert('Gagal mengirim Menfest: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id, currentLikes = 0) => {
    // Optimistic UI update
    setMenfestList(prev => prev.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m));
    await toggleLikeMenfest(id, currentLikes);
  };

  const handleReplySubmit = async (event, itemId) => {
    event.preventDefault();
    if (!replyText.trim()) return;

    try {
      setReplySubmitting(true);
      const reply = await addMenfestReply(itemId, {
        sender: replySender,
        text: replyText,
      });
      setMenfestList(prev => {
        const nextList = prev.map(item => item.id === itemId
          ? { ...item, replies: [...(Array.isArray(item.replies) ? item.replies : []), reply] }
          : item);
        onMenfestChange?.(nextList);
        return nextList;
      });
      setReplySender('');
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      alert(`Gagal mengirim balasan: ${error.message}`);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Pesan menfest berhasil disalin ke clipboard!');
  };

  const filtered = menfestList.filter(item => {
    const matchCat = filterCat === 'Semua' || item.category === filterCat;
    const matchSearch = 
      item.message?.toLowerCase().includes(search.toLowerCase()) ||
      item.to_who?.toLowerCase().includes(search.toLowerCase()) ||
      item.sender?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Supabase Status Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              💌 Menfest Campus Feed
            </span>
            
            {/* Supabase Indicator */}
            {isSupabase ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Connected
              </span>
            ) : (
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5"
                title="Konfigurasi Supabase tersedia di Admin Portal"
              >
                <span>⚡</span>
                <span>Mode Lokal</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">💌 Menfest & Aspirasi Mahasiswa</h1>
          <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Kirim pesan anonim, curahan hati, salam apresiasi, atau semangat untuk teman sekelas dan satu fakultas secara aman dan menyenangkan.
          </p>
          <p className={`text-xs mt-2 font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            ⏳ Feed Menfest otomatis di-reset setiap 7 hari agar selalu segar & relevan.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isDark ? 'border-gray-800 bg-gray-900 text-gray-300 hover:text-white' : 'border-gray-200 bg-white text-gray-700'
          }`}
        >
          <span>🔄</span>
          <span>{loading ? 'Memuat...' : 'Refresh Feed'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: FORM KIRIM MENFEST */}
        <div className="lg:col-span-1">
          <div className={`lg:sticky lg:top-20 rounded-3xl p-5 sm:p-6 border shadow-xl ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✍️</span>
              <div>
                <h2 className="font-extrabold text-base">Kirim Pesan Menfest</h2>
                <p className="text-xs text-gray-400">Identitasmu bisa dibuat anonim</p>
              </div>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-bold animate-bounce">
                🎉 Menfest kamu berhasil dikirim & diposting ke feed!
              </div>
            )}

            <form onSubmit={handleKirim} className="space-y-3.5 text-xs">
              
              {/* Kepada */}
              <div>
                <label className="block mb-1 font-bold">Kepada (To):</label>
                <input
                  type="text"
                  placeholder="Contoh: Teman-teman IF 2026 / Si dia di lab 3"
                  value={toWho}
                  onChange={e => setToWho(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              {/* Dari / Anonim Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Dari (From):</label>
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-indigo-400">
                    <input
                      type="checkbox"
                      checked={isAnon}
                      onChange={e => setIsAnon(e.target.checked)}
                      className="rounded"
                    />
                    <span>Kirim Anonim 🎭</span>
                  </label>
                </div>

                {!isAnon && (
                  <input
                    type="text"
                    placeholder="Nama pena / inisial kamu..."
                    value={sender}
                    onChange={e => setSender(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Pilihan Warna Kartu */}
              <div>
                <label className="block mb-1.5 font-bold">Warna Aksen Kartu:</label>
                <div className="flex gap-2">
                  {[
                    { id: 'purple', bg: 'bg-purple-500' },
                    { id: 'blue', bg: 'bg-blue-500' },
                    { id: 'emerald', bg: 'bg-emerald-500' },
                    { id: 'rose', bg: 'bg-rose-500' },
                    { id: 'amber', bg: 'bg-amber-500' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-6 h-6 rounded-full ${c.bg} transition-all ${
                        selectedColor === c.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Pesan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Isi Pesan Menfest *</label>
                  <span className="text-[10px] text-gray-500">{message.length}/500</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ketik pesan yang ingin kamu sampaikan... Bersikaplah sopan dan saling mendukung sesama mahasiswa! ✨"
                  className={`w-full px-3 py-2.5 rounded-2xl border outline-none resize-none focus:ring-2 focus:ring-pink-500 leading-relaxed ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-95 shadow-lg shadow-pink-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>{submitting ? 'Mengirim ke Supabase...' : 'Kirim Menfest Sekarang'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: FEED MENFEST (2 span) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filter & Search Bar */}
          <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            {/* Category pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterCat === cat.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-full sm:w-auto ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <span className="text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Cari menfest..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none w-full sm:w-36"
              />
            </div>
          </div>

          {/* Menfest Feed Cards */}
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <span className="text-3xl block animate-spin">⏳</span>
              <p className="text-xs">Sedang memuat pesan Menfest...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${
              isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
            }`}>
              <span className="text-5xl block mb-3">💌</span>
              <p className="font-bold text-base">Belum ada pesan Menfest</p>
              <p className="text-xs mt-1">Jadilah yang pertama mengirim pesan di form sebelah kiri!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(item => {
                const colorClass = CARD_COLORS[item.color] || CARD_COLORS['purple'];
                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl p-5 sm:p-6 border bg-gradient-to-br transition-all hover:shadow-xl ${colorClass} ${
                      isDark ? 'bg-gray-900/90' : 'bg-white shadow-sm'
                    }`}
                  >
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-indigo-400">
                            To: {item.to_who}
                          </span>
                          <span className="text-gray-500 text-xs">•</span>
                          <span className="text-xs text-gray-400 font-medium">
                            From: {item.sender}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {item.created_at ? new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                        {item.category}
                      </span>
                    </div>

                    {/* Pesan Menfest */}
                    <p className={`text-sm sm:text-base leading-relaxed my-3 font-medium whitespace-pre-wrap ${
                      isDark ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {item.message}
                    </p>

                    {/* Replies / thread */}
                    {(() => {
                      const replies = Array.isArray(item.replies) ? item.replies : [];
                      const isExpanded = Boolean(expandedReplies[item.id]);
                      const visibleReplies = isExpanded || replies.length <= 2 ? replies : replies.slice(-2);
                      return (
                        <div className="mt-4 space-y-2 border-l-2 border-white/10 pl-3 sm:pl-4">
                          {visibleReplies.map(reply => (
                            <div key={reply.id} className={`max-w-full rounded-2xl rounded-tl-sm px-3 py-2 ${isDark ? 'bg-black/20' : 'bg-white/60'}`}>
                              <div className="flex min-w-0 items-center justify-between gap-2">
                                <span className="truncate text-[11px] font-bold text-indigo-400">{reply.sender || 'Anonim 🎭'}</span>
                                <time className="shrink-0 text-[10px] text-gray-500">{reply.created_at ? new Date(reply.created_at).toLocaleDateString('id-ID') : 'Baru'}</time>
                              </div>
                              <p className="mt-1 break-words text-xs leading-relaxed text-gray-300">{reply.text}</p>
                            </div>
                          ))}
                          {replies.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setExpandedReplies(prev => ({ ...prev, [item.id]: !isExpanded }))}
                              className="min-h-10 px-2 text-left text-xs font-bold text-indigo-400 hover:text-indigo-300"
                            >
                              {isExpanded ? 'Sembunyikan balasan ☝️' : `Lihat ${replies.length - 2} balasan lainnya 👇`}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {replyingTo === item.id && (
                      <form onSubmit={(event) => handleReplySubmit(event, item.id)} className={`mt-3 space-y-2 rounded-2xl border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-gray-200 bg-white/60'}`}>
                        <input
                          type="text"
                          value={replySender}
                          onChange={event => setReplySender(event.target.value)}
                          placeholder="Nama pengirim (opsional / Anonim)"
                          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
                        />
                        <textarea
                          required
                          rows={2}
                          maxLength={500}
                          value={replyText}
                          onChange={event => setReplyText(event.target.value)}
                          placeholder="Tulis balasan..."
                          className={`w-full resize-none rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
                        />
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => setReplyingTo(null)} className="min-h-10 rounded-xl px-3 text-xs font-semibold text-gray-400 hover:bg-black/10">Batal</button>
                          <button type="submit" disabled={replySubmitting || !replyText.trim()} className="min-h-10 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white disabled:opacity-50">{replySubmitting ? 'Mengirim...' : 'Kirim Balasan'}</button>
                        </div>
                      </form>
                    )}

                    {/* Bottom Actions: Like, Reply & Copy */}
                    <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 ${
                      isDark ? 'border-gray-800/80' : 'border-gray-100'
                    }`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleLike(item.id, item.likes)}
                          className="flex min-h-10 items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 transition-all active:scale-90"
                        >
                          <span>❤️</span><span>{item.likes || 0}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                          className="flex min-h-10 items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-400"
                        >
                          💬 Balas {Array.isArray(item.replies) && item.replies.length > 0 ? `(${item.replies.length})` : ''}
                        </button>
                      </div>
                      <button
                        onClick={() => handleCopy(item.message)}
                        className="flex min-h-10 items-center gap-1 px-2 text-xs text-gray-400 hover:text-gray-200"
                        title="Salin isi pesan"
                      >
                        <span>📋</span><span className="hidden sm:inline">Salin</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

