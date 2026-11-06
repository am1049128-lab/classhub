import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { defaultStruktur, initialProdi } from '../data/dummy';
import { safeGet, safeSet } from '../utils/storage';

function OrgNode({ item, isDark }) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-center transition hover:border-slate-700 hover:-translate-y-0.5">
      <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-2xl border border-indigo-400/30 bg-slate-800">
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
      <span className="inline-flex max-w-full rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-300">
        {item.role}
      </span>
      <p className="mt-2 break-words text-sm font-extrabold text-white">{item.name}</p>
    </div>
  );
}

function StructureTree({ struktur, isDark }) {
  const leaders = struktur.filter(item => item.level === 1);
  const executors = struktur.filter(item => item.level === 2);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid grid-cols-1 gap-4 sm:mx-auto sm:max-w-lg sm:grid-cols-2 sm:gap-6">
        {leaders.map(item => <OrgNode key={item.id} item={item} isDark={isDark} />)}
      </div>
      <div className="relative mx-auto my-5 hidden h-8 max-w-lg sm:block" aria-hidden="true">
        <div className="absolute left-1/4 right-1/4 top-0 h-px bg-gradient-to-r from-indigo-500/40 via-purple-400/70 to-indigo-500/40" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-purple-400/60" />
        <div className="absolute left-1/4 top-0 h-8 w-px bg-indigo-400/50" />
        <div className="absolute right-1/4 top-0 h-8 w-px bg-indigo-400/50" />
      </div>
      <div className="mx-auto my-5 h-6 w-px bg-gradient-to-b from-indigo-400/60 to-purple-400/60 sm:hidden" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2"><span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-400">Mahasiswa & Sivitas</span><span className="text-xs text-gray-500">•</span><span className="text-xs text-gray-400">{anggotaList.length} Total Anggota Terdaftar</span></div>
          <h1 className="text-3xl font-black tracking-tight">🎓 Direktori Anggota Per Prodi</h1>
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
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">📸 Foto & Profil Anggota: <span className="text-indigo-400">{activeProdi}</span><span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">{filtered.length} mahasiswa</span></h2>
        {filtered.length === 0 ? <div className={`rounded-3xl border p-12 text-center ${isDark ? 'border-gray-800 bg-gray-900 text-gray-400' : 'border-gray-200 bg-white text-gray-500'}`}><span className="mb-3 block text-5xl">🔍</span><p className="font-bold">Tidak ada mahasiswa ditemukan di prodi ini</p></div> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{filtered.map(member => <div key={member.id} onClick={() => setSelectedAnggota(member)} className={`group relative flex cursor-pointer flex-col items-center justify-between overflow-hidden rounded-3xl border p-4 text-center transition-all hover:-translate-y-1.5 ${isDark ? 'border-gray-800 bg-gray-900/90 hover:border-indigo-500/50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}><div className="mb-3 h-20 w-20 overflow-hidden rounded-2xl border-2 border-indigo-500/40"><img src={member.photo} alt={member.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" /></div><div className="mb-2 w-full"><h3 className="line-clamp-1 text-xs font-bold sm:text-sm">{member.name}</h3><p className="mt-0.5 text-[11px] font-medium text-indigo-400">"{member.nickname || member.name.split(' ')[0]}"</p></div><div className={`mt-auto line-clamp-2 w-full rounded-xl p-2 text-[11px] italic ${isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>&quot;{member.quote}&quot;</div></div>)}</div>}
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl sm:p-8">
        <div className="mb-7"><h2 className="flex items-center gap-2 text-xl font-extrabold text-white"><span>🏛️</span> Struktur Pengurus Kelas</h2><p className="mt-1 text-xs text-slate-400">Ketua, Wakil Ketua, dan Jajaran Pengurus Angkatan</p></div>
        <StructureTree struktur={struktur} isDark={isDark} />
      </section>

      {selectedAnggota && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" onClick={() => setSelectedAnggota(null)}><div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-white shadow-2xl" onClick={event => event.stopPropagation()}><button onClick={() => setSelectedAnggota(null)} className="absolute right-4 top-4 text-xl text-gray-400">✕</button><img src={selectedAnggota.photo} alt={selectedAnggota.name} className="mx-auto h-32 w-32 rounded-2xl object-cover" /><h3 className="mt-4 text-xl font-bold">{selectedAnggota.name}</h3><p className="mt-1 text-slate-400">{selectedAnggota.nickname ? `&quot;${selectedAnggota.nickname}&quot;` : '—'}</p><span className="mt-3 inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400">🎓 {selectedAnggota.prodi}</span><p className="mt-4 rounded-xl border border-slate-700 bg-gray-800 p-3 text-sm italic">&quot;{selectedAnggota.quote}&quot;</p></div></div>}
    </div>
  );
}
