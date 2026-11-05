import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { initialProdi, pengurus } from '../data/dummy';

function OrgNode({ item }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-2xl border text-center min-w-[130px] transition-all hover:scale-105 ${isDark ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
      }`}>
      <img src={item.photo} alt={item.name} className="w-11 h-11 rounded-full mb-1 bg-indigo-100 object-cover" />
      <p className="text-[11px] font-bold text-indigo-400">{item.role}</p>
      <p className="text-xs font-semibold mt-0.5 leading-tight">{item.name}</p>
    </div>
  );
}

export default function Anggota({
  anggotaList = [],
  prodiList = initialProdi,
  selectedProdi = 'Semua',
  setSelectedProdi,
  onOpenInputModal
}) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedAnggota, setSelectedAnggota] = useState(null);

  const activeProdi = selectedProdi || 'Semua';

  // Filter berdasarkan prodi & search
  const filtered = anggotaList.filter(item => {
    const matchProdi = activeProdi === 'Semua' || (item.prodi && item.prodi.toLowerCase() === activeProdi.toLowerCase());
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nickname && item.nickname.toLowerCase().includes(search.toLowerCase())) ||
      (item.quote && item.quote.toLowerCase().includes(search.toLowerCase()));
    return matchProdi && matchSearch;
  });

  const level0 = pengurus.filter(p => p.level === 0);
  const level1 = pengurus.filter(p => p.level === 1);
  const level2 = pengurus.filter(p => p.level === 2);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Mahasiswa & Sivitas
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{anggotaList.length} Total Anggota Terdaftar</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">🎓 Direktori Anggota Per Prodi</h1>
          <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Temukan dan kenali seluruh mahasiswa di setiap Program Studi. Setiap anggota memiliki profil dan foto masing-masing yang dapat diinput secara mandiri.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpenInputModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-95 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all shrink-0"
        >
          <span>✍️</span>
          <span>Input Profil Saya Sendiri</span>
        </button>
      </div>

      {/* PRODI TABS & SEARCH BAR */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${isDark ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-gray-200 shadow-sm'
        }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Tabs per Prodi */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedProdi && setSelectedProdi('Semua')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeProdi === 'Semua'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              🌟 Semua Prodi ({anggotaList.length})
            </button>

            {prodiList.map(prodi => {
              const count = anggotaList.filter(a => a.prodi && a.prodi.toLowerCase() === prodi.toLowerCase()).length;
              const isSelected = activeProdi === prodi;
              return (
                <button
                  key={prodi}
                  onClick={() => setSelectedProdi && setSelectedProdi(prodi)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${isSelected
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  <span>🎓 {prodi}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, panggilan, atau quote..."
              className="bg-transparent outline-none w-48 sm:w-60 placeholder-gray-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-200">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ANGGOTA GRID PER PRODI */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>📸</span>
            <span>Foto & Profil Anggota: <span className="text-indigo-400">{activeProdi}</span></span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold">
              {filtered.length} mahasiswa
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
            }`}>
            <span className="text-5xl block mb-3">🔍</span>
            <p className="font-bold text-base">Tidak ada mahasiswa ditemukan di prodi ini</p>
            <p className="text-xs mt-1">Belum ada anggota yang terdaftar atau kata kunci pencarian tidak cocok.</p>
            <button
              onClick={onOpenInputModal}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
            >
              + Jadilah yang Pertama Mendaftar!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {filtered.map(member => (
              <div
                key={member.id}
                onClick={() => setSelectedAnggota(member)}
                className={`group cursor-pointer rounded-3xl p-4 border text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col items-center justify-between relative overflow-hidden ${isDark
                    ? 'bg-gray-900/90 border-gray-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-indigo-100'
                  }`}
              >
                {/* Top Badge Prodi */}
                <div className="w-full flex justify-end mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 truncate max-w-[120px]">
                    {member.prodi}
                  </span>
                </div>

                {/* Foto Profil Anggota */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/40 group-hover:border-indigo-500 transition-colors shadow-md bg-indigo-50/10">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`;
                      }}
                    />
                  </div>
                  {/* Subtle Glow */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-indigo-400/50 transition-all pointer-events-none" />
                </div>

                {/* Nama & Nickname */}
                <div className="w-full mb-2">
                  <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-[11px] text-indigo-400 font-medium mt-0.5">
                    "{member.nickname || member.name.split(' ')[0]}"
                  </p>
                </div>

                {/* Quote / Kata-kata */}
                <div className={`w-full p-2 rounded-xl text-[11px] italic line-clamp-2 mt-auto ${isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-50 text-gray-600'
                  }`}>
                  "{member.quote}"
                </div>

                {/* Instagram Handle if available */}
                {member.instagram && (
                  <p className="text-[10px] text-pink-400 font-semibold mt-2 truncate w-full">
                    📷 {member.instagram}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STRUKTUR PENGURUS ORGANISASI */}
      <div className={`rounded-3xl p-6 sm:p-8 border ${isDark ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-gray-200 shadow-sm'
        }`}>
        <div className="mb-6">
          <h2 className="font-extrabold text-lg flex items-center gap-2">
            <span>🏛️</span> Struktur Pengurus & Pembimbing Fakultas
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Dosen Pembimbing, Ketua Angkatan, dan jajaran pengurus
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 overflow-x-auto pb-4">
          {/* Level 0: Dosen Pembimbing */}
          <div className="flex gap-4">
            {level0.map(p => <OrgNode key={p.name} item={p} />)}
          </div>
          <div className="w-px h-6 bg-gradient-to-b from-indigo-500 to-purple-500"></div>

          {/* Level 1: Ketua & Wakil */}
          <div className="flex gap-6">
            {level1.map(p => <OrgNode key={p.name} item={p} />)}
          </div>
          <div className="flex gap-12">
            {level1.map((_, idx) => (
              <div key={idx} className="w-px h-6 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
            ))}
          </div>

          {/* Level 2: Sekretaris & Bendahara */}
          <div className="flex flex-wrap justify-center gap-4">
            {level2.map(p => <OrgNode key={p.name + p.role} item={p} />)}
          </div>
        </div>
      </div>

      {/* MODAL DETAIL PROFIL SAAT KARTU DIKLIK */}
      {selectedAnggota && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAnggota(null)}
        >
          <div
            className={`rounded-3xl p-6 sm:p-8 w-full max-w-sm text-center relative border shadow-2xl transition-all ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAnggota(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-xl w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {/* Foto Besar */}
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-indigo-50">
                <img
                  src={selectedAnggota.photo}
                  alt={selectedAnggota.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              🎓 {selectedAnggota.prodi}
            </span>

            <h3 className="text-xl font-black mt-3 leading-tight">{selectedAnggota.name}</h3>
            <p className="text-indigo-400 text-xs font-semibold mt-1">"{selectedAnggota.nickname}"</p>

            {/* Quote */}
            <div className={`mt-4 p-4 rounded-2xl italic text-xs leading-relaxed ${isDark ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
              "{selectedAnggota.quote}"
            </div>

            {/* Info Tambahan */}
            <div className="mt-4 space-y-2 text-xs">
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'
                }`}>
                <span className="text-gray-400 font-medium">🎂 Tanggal Lahir</span>
                <span className="font-semibold">
                  {selectedAnggota.birthday
                    ? new Date(selectedAnggota.birthday).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '-'}
                </span>
              </div>

              {selectedAnggota.instagram && (
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'
                  }`}>
                  <span className="text-gray-400 font-medium">📷 Instagram</span>
                  <a
                    href={`https://instagram.com/${selectedAnggota.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-pink-400 hover:text-pink-300"
                  >
                    {selectedAnggota.instagram}
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
