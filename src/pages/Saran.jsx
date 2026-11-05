import { useState } from 'react';
import { initialSaran } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';

export default function Saran() {
  const { isDark } = useTheme();
  const [saran, setSaran] = useState(initialSaran);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const kirimSaran = () => {
    if (!input.trim()) return;
    const newSaran = {
      id: Date.now(),
      isi: input.trim(),
      waktu: new Date().toLocaleString('id-ID', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }).replace(',', ''),
      dibalas: false,
    };
    setSaran(prev => [newSaran, ...prev]);
    setInput('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black">💌 Kotak Saran Anonim</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sampaikan aspirasi, keluhan, atau saran tanpa perlu mencantumkan nama</p>
      </div>

      {/* Form kirim saran */}
      <div className={`rounded-3xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">💬</div>
          <div>
            <h2 className="font-bold text-base">Sampaikan Aspirasimu</h2>
            <p className="text-xs text-gray-400">Identitasmu sepenuhnya anonim — tidak ada yang tahu siapa kamu</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3 animate-bounce">🎉</div>
            <p className="font-semibold text-emerald-400">Aspirasimu sudah terkirim!</p>
            <p className="text-sm text-gray-400 mt-1">Pengurus kelas akan membaca pesanmu</p>
          </div>
        ) : (
          <>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={4}
              placeholder="Tulis saran, aspirasi, keluhan, atau curhatmu di sini... Kamu aman, tidak ada yang tahu siapa kamu 🙂"
              className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors
                ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-indigo-400'}`}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">{input.length} karakter</p>
              <button
                onClick={kirimSaran}
                disabled={!input.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${input.trim()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/25'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <span>✉️</span> Kirim Anonim
              </button>
            </div>
          </>
        )}
      </div>

      {/* Daftar saran */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>📬</span> Kotak Masuk Aspirasi
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{saran.length} pesan</span>
        </h2>
        <div className="space-y-3">
          {saran.map(s => (
            <div key={s.id} className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-base
                  ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  🎭
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-400">Anonim</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{s.waktu}</span>
                    {s.dibalas && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Dibalas</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{s.isi}</p>
                </div>
              </div>
            </div>
          ))}
          {saran.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl block mb-2">📭</span>
              <p>Belum ada aspirasi yang masuk</p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
        <h3 className="font-semibold text-sm text-indigo-400 mb-2">🔒 Jaminan Privasi</h3>
        <ul className="space-y-1">
          {[
            'Tidak ada data nama, akun, atau identitas yang dikumpulkan',
            'Semua pesan disimpan secara anonim tanpa jejak digital',
            'Pesan dibaca hanya oleh pengurus kelas untuk ditindaklanjuti',
          ].map(item => (
            <li key={item} className={`text-xs flex items-start gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="text-emerald-400 mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
