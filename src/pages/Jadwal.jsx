import { useState, useEffect, useCallback } from 'react';
import { initialProdi } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';
import { getJadwalList } from '../lib/supabase';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const PRODI_COLORS = {
  'Ilmu Komputer': 'from-blue-500 to-cyan-500 border-blue-500/40 text-blue-400',
  'Teknik Informatika': 'from-blue-500 to-cyan-500 border-blue-500/40 text-blue-400',
  'Sistem Informasi': 'from-purple-500 to-pink-500 border-purple-500/40 text-purple-400',
  'Aktuaria': 'from-amber-500 to-orange-500 border-amber-500/40 text-amber-400',
  'Semua': 'from-indigo-500 to-teal-500 border-indigo-500/40 text-indigo-400',
};

export default function Jadwal({ prodiList = initialProdi }) {
  const { isDark } = useTheme();
  const todayIdx = new Date().getDay();
  const hariToday = HARI[todayIdx - 1] || 'Senin';
  const [activeHari, setActiveHari] = useState(hariToday);
  const [filterProdi, setFilterProdi] = useState('Semua');
  const [jadwalFlat, setJadwalFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);

  const fetchJadwal = useCallback(async () => {
    setLoading(true);
    try {
      const { data, isSupabase } = await getJadwalList();
      setJadwalFlat(data);
      setIsCloud(isSupabase);
    } catch (err) {
      console.warn('Gagal fetch jadwal:', err);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

  const listJadwal = jadwalFlat.filter(item => (
    item.hari === activeHari && (filterProdi === 'Semua' || item.prodi === filterProdi || item.prodi === 'Semua')
  ));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Akademik & Perkuliahan</span><span className="text-xs text-gray-400">• Semester Ganjil 2026/2027</span>{isCloud && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">☁️ Cloud</span>}</div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">📅 Jadwal Kuliah</h1>
        <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Jadwal perkuliahan mingguan per program studi, ruangan kelas, dan laboratorium.</p>
      </div>
      <div className={`p-4 sm:p-5 rounded-3xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">{HARI.map(hari => <button key={hari} onClick={() => setActiveHari(hari)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${activeHari === hari ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{hari}{hari === hariToday && <span className="ml-1.5 inline-block w-2 h-2 bg-emerald-400 rounded-full" />}</button>)}</div>
          <label className="flex items-center gap-2 text-xs"><span className="text-gray-400 font-semibold">Filter Prodi:</span><select value={filterProdi} onChange={e => setFilterProdi(e.target.value)} className={`px-3 py-1.5 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}><option value="Semua">Semua Program Studi</option>{prodiList.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
        </div>
      </div>
      {loading ? <div className="text-center py-12 text-gray-400"><span className="text-4xl block animate-spin">⏳</span><p className="font-semibold text-sm">Memuat jadwal kuliah...</p></div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><section className={`lg:col-span-2 rounded-3xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}><div className="flex items-center justify-between mb-6"><h2 className="font-extrabold text-lg">📚 Mata Kuliah Hari {activeHari}</h2><span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold">{listJadwal.length} sesi perkuliahan</span></div>{listJadwal.length === 0 ? <div className="text-center py-12 text-gray-400"><span className="text-4xl block">🏖️</span><p className="font-semibold text-sm">Tidak ada jadwal kuliah untuk kriteria ini</p></div> : <div className="space-y-3">{listJadwal.map(item => { const color = PRODI_COLORS[item.prodi || 'Semua'] || PRODI_COLORS.Semua; return <article key={item.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? 'bg-gray-800/70 border-gray-700' : 'bg-gray-50 border-gray-200'}`}><div><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{item.prodi || 'Semua Prodi'}</span><h3 className="font-bold text-sm sm:text-base mt-2">{item.mapel}</h3>{item.guru && <p className="text-xs text-gray-400 mt-0.5">👨‍🏫 {item.guru}</p>}{item.ruangan && <p className="text-xs text-gray-400 mt-0.5">📍 {item.ruangan}</p>}</div><span className="text-xs font-bold text-indigo-400 px-2.5 py-1 rounded-xl bg-indigo-500/10">⏰ {item.jam}</span></article>; })}</div>}</section><aside className="rounded-3xl p-6 border bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border-indigo-500/30 h-fit"><h3 className="font-bold text-sm text-indigo-300 mb-2">💡 Catatan Akademik</h3><p className="text-xs text-gray-300 leading-relaxed">Mahasiswa wajib hadir 10 menit sebelum kelas dimulai. Presensi kehadiran minimal 75% sebagai syarat mengikuti Ujian Akhir Semester (UAS).</p></aside></div>}
    </div>
  );
}
