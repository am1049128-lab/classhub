import { useState, useEffect, useCallback } from 'react';
import { jadwalPiket, initialProdi } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';
import { getJadwalList, addJadwal, deleteJadwalItem } from '../lib/supabase';

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

  // Ambil hari ini
  const todayIdx = new Date().getDay(); // 0=Minggu, 1=Senin
  const hariToday = HARI[todayIdx - 1] || 'Senin';

  const [activeHari, setActiveHari] = useState(hariToday);
  const [filterProdi, setFilterProdi] = useState('Semua');
  const [jadwalFlat, setJadwalFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [showTambah, setShowTambah] = useState(false);
  const [newJadwal, setNewJadwal] = useState({
    hari: hariToday,
    mapel: '',
    jam: '',
    guru: '',
    prodi: 'Semua',
    ruangan: '',
  });

  // Fetch jadwal dari Supabase / localStorage
  const fetchJadwal = useCallback(async () => {
    setLoading(true);
    try {
      const { data, isSupabase } = await getJadwalList();
      setJadwalFlat(data);
      setIsCloud(isSupabase);
    } catch (err) {
      console.warn('Gagal fetch jadwal:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  // Filter jadwal berdasarkan hari aktif dan prodi
  const listJadwal = jadwalFlat.filter(j => {
    const matchHari = j.hari === activeHari;
    if (!matchHari) return false;
    if (filterProdi === 'Semua') return true;
    return j.prodi === filterProdi || j.prodi === 'Semua';
  });

  const piketHari = jadwalPiket.find(p => p.hari === activeHari)?.anggota || [];

  const handleTambahJadwal = async (e) => {
    e.preventDefault();
    if (!newJadwal.mapel || !newJadwal.jam) return;

    try {
      const record = await addJadwal(newJadwal);
      setJadwalFlat(prev => [record, ...prev]);
    } catch (err) {
      console.warn('Gagal tambah jadwal:', err);
    }

    setNewJadwal({
      hari: activeHari,
      mapel: '',
      jam: '',
      guru: '',
      prodi: 'Semua',
      ruangan: '',
    });
    setShowTambah(false);
  };

  const handleHapusJadwal = async (id) => {
    if (window.confirm('Hapus mata kuliah ini dari jadwal?')) {
      try {
        await deleteJadwalItem(id);
        setJadwalFlat(prev => prev.filter(j => j.id !== id));
      } catch (err) {
        console.warn('Gagal hapus jadwal:', err);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Akademik & Perkuliahan
            </span>
            <span className="text-xs text-gray-400">• Semester Ganjil 2026/2027</span>
            {isCloud && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Data tersinkron dengan Supabase">
                ☁️ Cloud
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">📅 Jadwal Kuliah & Piket</h1>
          <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Jadwal perkuliahan mingguan per program studi, ruangan kelas, laboratorium, dan jadwal piket harian.
          </p>
        </div>

        <button
          onClick={() => setShowTambah(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all shrink-0"
        >
          <span>➕</span>
          <span>Tambah Jadwal Kuliah</span>
        </button>
      </div>

      {/* Control bar: Pilihan Hari & Filter Prodi */}
      <div className={`p-4 sm:p-5 rounded-3xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Hari tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {HARI.map(hari => {
              const isActive = activeHari === hari;
              const isToday = hari === hariToday;
              return (
                <button
                  key={hari}
                  onClick={() => setActiveHari(hari)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {hari}
                  {isToday && (
                    <span className="ml-1.5 inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" title="Hari Ini"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter Prodi */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-semibold shrink-0">Filter Prodi:</span>
            <select
              value={filterProdi}
              onChange={e => setFilterProdi(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border outline-none font-medium ${
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <option value="Semua">Semua Program Studi</option>
              {prodiList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <span className="text-4xl block animate-spin">⏳</span>
          <p className="font-semibold text-sm">Memuat jadwal kuliah...</p>
        </div>
      )}

      {/* Main Grid: Jadwal Kuliah & Piket */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Kolom Jadwal Kuliah (2 span) */}
          <div className={`lg:col-span-2 rounded-3xl p-6 border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <span>📚</span>
                <span>Mata Kuliah Hari {activeHari}</span>
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold">
                {listJadwal.length} sesi perkuliahan
              </span>
            </div>

            {listJadwal.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <span className="text-4xl block">🏖️</span>
                <p className="font-semibold text-sm">Tidak ada jadwal kuliah untuk kriteria ini</p>
                <p className="text-xs">Silakan pilih hari lain atau ubah filter prodi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listJadwal.map((item) => {
                  const prodiKey = item.prodi || 'Semua';
                  const styleColor = PRODI_COLORS[prodiKey] || PRODI_COLORS['Semua'];
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDark ? 'bg-gray-800/70 border-gray-700' : 'bg-gray-50 border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-12 rounded-full bg-gradient-to-b ${styleColor.split(' ')[0]} ${styleColor.split(' ')[1]} shrink-0 mt-0.5`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styleColor}`}>
                              {item.prodi || 'Semua Prodi'}
                            </span>
                            {item.ruangan && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                                📍 {item.ruangan}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm sm:text-base leading-tight">{item.mapel}</h3>
                          {item.guru && (
                            <p className="text-xs text-gray-400 mt-0.5">👨‍🏫 {item.guru}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-800">
                        <div className="text-right">
                          <span className="text-xs font-bold text-indigo-400 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            ⏰ {item.jam}
                          </span>
                        </div>
                        <button
                          onClick={() => handleHapusJadwal(item.id)}
                          className="text-gray-500 hover:text-rose-400 text-xs p-1"
                          title="Hapus sesi ini"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Jadwal Piket & Info Kampus */}
          <div className="space-y-6">

            {/* Jadwal Piket / Lab */}
            <div className={`rounded-3xl p-6 border ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <h2 className="font-extrabold text-base mb-4 flex items-center gap-2">
                <span>🧹</span>
                <span>Piket / Tim Lab Hari {activeHari}</span>
              </h2>

              {piketHari.length === 0 ? (
                <p className="text-xs text-gray-400">Tidak ada jadwal piket hari ini.</p>
              ) : (
                <div className="space-y-2">
                  {piketHari.map((nama, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold">{nama}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-4 italic">
                💡 Bertanggung jawab merapikan Lab Komputer dan memastikan proyektor/AC mati setelah kuliah.
              </p>
            </div>

            {/* Quick tips */}
            <div className={`rounded-3xl p-6 border bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border-indigo-500/30`}>
              <h3 className="font-bold text-sm text-indigo-300 mb-2 flex items-center gap-1.5">
                <span>💡</span> Catatan Akademik
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Mahasiswa wajib hadir 10 menit sebelum kelas dimulai. Presensi kehadiran minimal 75% sebagai syarat mengikuti Ujian Akhir Semester (UAS).
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Modal Tambah Jadwal Kuliah */}
      {showTambah && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setShowTambah(false)}
        >
          <div
            className={`w-[92%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto pb-8 rounded-3xl p-5 sm:p-6 border shadow-2xl relative ${
              isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTambah(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="font-black text-lg mb-4">➕ Tambah Jadwal Kuliah Baru</h3>

            <form onSubmit={handleTambahJadwal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold">Hari</label>
                  <select
                    value={newJadwal.hari}
                    onChange={e => setNewJadwal({ ...newJadwal, hari: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    {HARI.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Prodi</label>
                  <select
                    value={newJadwal.prodi}
                    onChange={e => setNewJadwal({ ...newJadwal, prodi: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <option value="Semua">Semua Prodi</option>
                    {prodiList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Mata Kuliah *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemrograman Berorientasi Objek"
                  value={newJadwal.mapel}
                  onChange={e => setNewJadwal({ ...newJadwal, mapel: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold">Jam Kuliah *</label>
                  <input
                    type="text"
                    required
                    placeholder="08.00–09.40"
                    value={newJadwal.jam}
                    onChange={e => setNewJadwal({ ...newJadwal, jam: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Ruangan / Lab</label>
                  <input
                    type="text"
                    placeholder="Lab Komputer 2"
                    value={newJadwal.ruangan}
                    onChange={e => setNewJadwal({ ...newJadwal, ruangan: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Dosen Pengampu</label>
                <input
                  type="text"
                  placeholder="Dr. Agus Supriadi, M.Kom"
                  value={newJadwal.guru}
                  onChange={e => setNewJadwal({ ...newJadwal, guru: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTambah(false)}
                  className="px-4 py-2 rounded-xl text-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
