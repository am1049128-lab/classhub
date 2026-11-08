import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { defaultStruktur, initialProdi } from '../data/dummy';
import { safeGet, safeSet } from '../utils/storage';

function OrgNode({ item, isDark }) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4 text-center transition hover:border-slate-700 hover:-translate-y-0.5">
      <div className="mx-auto mb-3 h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-full border-2 border-indigo-400/40 bg-slate-800 shadow-lg">
        <img
          src={item.photo}
          alt={item.name}
          className="h-full w-full object-cover"
          onError={event => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`;
          }}
        />
      </div>
      <span className="inline-flex max-w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
        {item.role}
      </span>
      <p className="mt-2 break-words text-xs sm:text-sm font-extrabold text-white leading-tight">{item.name}</p>
    </div>
  );
}

function StructureTree({ struktur, isDark }) {
  const leaders = struktur.filter(item => item.level === 1);
  const executors = struktur.filter(item => item.level === 2);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid grid-cols-1 gap-3 sm:mx-auto sm:max-w-lg sm:grid-cols-2 sm:gap-5">
        {leaders.map(item => <OrgNode key={item.id} item={item} isDark={isDark} />)}
      </div>
      <div className="relative mx-auto my-4 hidden h-8 max-w-lg sm:block" aria-hidden="true">
        <div className="absolute left-1/4 right-1/4 top-0 h-px bg-gradient-to-r from-indigo-500/40 via-purple-400/70 to-indigo-500/40" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-purple-400/60" />
        <div className="absolute left-1/4 top-0 h-8 w-px bg-indigo-400/50" />
        <div className="absolute right-1/4 top-0 h-8 w-px bg-indigo-400/50" />
      </div>
      <div className="mx-auto my-4 h-5 w-px bg-gradient-to-b from-indigo-400/60 to-purple-400/60 sm:hidden" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
        {executors.map(item => <OrgNode key={item.id} item={item} isDark={isDark} />)}
      </div>
    </div>
  );
}

export default function Anggota({
  anggotaList = [],
  prodiList = initialProdi,
  selectedProdi = 'Semua',
  setSelectedProdi,
}) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedAnggota, setSelectedAnggota] = useState(null);
  const [struktur, setStruktur] = useState(defaultStruktur);

  useEffect(() => {
    const loadStruktur = () => {
      const saved = safeGet('classhub_struktur_data', null);
      if (!Array.isArray(saved)) {
        safeSet('classhub_struktur_data', defaultStruktur);
        setStruktur(defaultStruktur);
        return;
      }

      const savedById = new Map(saved.map(item => [item?.id, item]));
      setStruktur(defaultStruktur.map(defaultItem => ({
        ...defaultItem,
        ...(savedById.get(defaultItem.id) || {}),
        id: defaultItem.id,
        level: defaultItem.level,
      })));
    };

    loadStruktur();
    window.addEventListener('storage', loadStruktur);
    window.addEventListener('classhub:struktur-updated', loadStruktur);
    return () => {
      window.removeEventListener('storage', loadStruktur);
      window.removeEventListener('classhub:struktur-updated', loadStruktur);
    };
  }, []);

  const activeProdi = selectedProdi || 'Semua';
  const filtered = anggotaList.filter(item => {
    const matchProdi = activeProdi === 'Semua' || (item.prodi && item.prodi.toLowerCase() === activeProdi.toLowerCase());
    const query = search.toLowerCase();
    return matchProdi && (
      item.name.toLowerCase().includes(query) ||
      (item.nickname && item.nickname.toLowerCase().includes(query)) ||
      (item.quote && item.quote.toLowerCase().includes(query))
    );
  });
  const formatTanggalIndo = value => {
    const date = new Date(`${value}T00:00:00`);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : value;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2"><span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-400">Mahasiswa & Sivitas</span><span className="text-xs text-gray-500">•</span><span className="text-xs text-gray-400">{anggotaList.length} Total Anggota Terdaftar</span></div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">🎓 Direktori Anggota Per Prodi</h1>
          <p className={`mt-1 max-w-2xl text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Temukan dan kenali seluruh mahasiswa di setiap Program Studi.</p>
        </div>
      </div>

      <div className={`rounded-3xl border p-4 transition-all sm:p-5 ${isDark ? 'border-gray-800 bg-gray-900 shadow-xl' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0">
            <button onClick={() => setSelectedProdi?.('Semua')} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeProdi === 'Semua' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>🌟 Semua Prodi ({anggotaList.length})</button>
            {prodiList.map(prodi => {
              const count = anggotaList.filter(item => item.prodi?.toLowerCase() === prodi.toLowerCase()).length;
              return <button key={prodi} onClick={() => setSelectedProdi?.(prodi)} className={`flex whitespace-nowrap items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold ${activeProdi === prodi ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>🎓 {prodi} <span className="rounded-full bg-white/15 px-1.5">{count}</span></button>;
            })}
          </div>
          <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}><span className="text-gray-400">🔍</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari anggota..." className="w-full bg-transparent outline-none sm:w-60" /></div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            📸 Foto & Profil Anggota: <span className="text-indigo-400">{activeProdi}</span>
          </h2>
          <span className="shrink-0 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
            {filtered.length} mahasiswa
          </span>
        </div>
        {filtered.length === 0 ? <div className={`rounded-3xl border p-12 text-center ${isDark ? 'border-gray-800 bg-gray-900 text-gray-400' : 'border-gray-200 bg-white text-gray-500'}`}><span className="mb-3 block text-5xl">🔍</span><p className="font-bold">Tidak ada mahasiswa ditemukan di prodi ini</p></div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{filtered.map(member => <div key={member.id} onClick={() => setSelectedAnggota(member)} className={`group relative flex cursor-pointer flex-col items-center justify-between overflow-hidden rounded-3xl border p-4 text-center transition-all hover:-translate-y-1.5 ${isDark ? 'border-gray-800 bg-gray-900/90 hover:border-indigo-500/50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}><div className="mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 border-indigo-500/40"><img src={member.photo} alt={member.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" /></div><div className="mb-2 w-full"><h3 className="line-clamp-1 text-xs font-bold sm:text-sm">{member.name}</h3><p className="mt-0.5 text-[11px] font-medium text-indigo-400">"{member.nickname || member.name.split(' ')[0]}"</p>{member.nim && member.nim !== '-' && <p className="mt-1 text-[10px] text-gray-500">NIM: {member.nim}</p>}</div><div className={`mt-auto min-h-[64px] h-auto w-full rounded-xl p-3 text-xs italic leading-relaxed break-words ${isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>"{member.quote}"</div></div>)}</div>}
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl sm:p-8">
        <div className="mb-7"><h2 className="flex items-center gap-2 text-xl font-extrabold text-white"><span>🏛️</span> Struktur Pengurus Kelas</h2><p className="mt-1 text-xs text-slate-400">Ketua, Wakil Ketua, dan Jajaran Pengurus Angkatan</p></div>
        <StructureTree struktur={struktur} isDark={isDark} />
      </section>

      {selectedAnggota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={() => setSelectedAnggota(null)}>
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-white shadow-2xl" onClick={event => event.stopPropagation()}>
            <button onClick={() => setSelectedAnggota(null)} aria-label="Tutup detail anggota" className="absolute right-4 top-4 text-xl text-gray-400 transition hover:text-white">✕</button>
            <img src={selectedAnggota.photo} alt={selectedAnggota.name} className="mx-auto h-32 w-32 rounded-2xl object-cover" />
            <h3 className="mt-4 text-xl font-bold">{selectedAnggota.name}</h3>
            <p className="mt-1 text-slate-400">{selectedAnggota.nickname ? `"${selectedAnggota.nickname.replace(/&quot;/g, '').trim()}"` : selectedAnggota.name}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {selectedAnggota.prodi && <span className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400">🎓 {selectedAnggota.prodi}</span>}
              {selectedAnggota.nim && selectedAnggota.nim !== '-' && <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">🎫 NIM: {selectedAnggota.nim}</span>}
              {selectedAnggota.birthday && <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">🎂 {formatTanggalIndo(selectedAnggota.birthday)}</span>}
              {selectedAnggota.instagram && (
                <a
                  href={`https://instagram.com/${selectedAnggota.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-300 transition hover:bg-pink-500/20"
                >
                  ◎ @{selectedAnggota.instagram.replace(/^@/, '')}
                </a>
              )}
            </div>
            {selectedAnggota.quote && <p className="mt-5 rounded-xl border border-slate-700 bg-gray-800 p-3 text-sm italic">&quot;{selectedAnggota.quote}&quot;</p>}
          </div>
        </div>
      )}
    </div>
  );
}
