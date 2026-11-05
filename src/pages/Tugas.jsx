import { useState, useEffect } from 'react';
import { initialTugas, initialProdi } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';

const STATUS_COLORS = {
  'Belum': 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  'Proses': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'Selesai': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
};

const STATUS_CYCLE = { 'Belum': 'Proses', 'Proses': 'Selesai', 'Selesai': 'Belum' };

export default function Tugas({ prodiList = initialProdi }) {
  const { isDark } = useTheme();

  const [tugasList, setTugasList] = useState(() => {
    const saved = localStorage.getItem('classhub_tugas_v2') || localStorage.getItem('classhub_tugas_v1');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.map(t => t.prodi === 'Teknik Informatika' ? { ...t, prodi: 'Ilmu Komputer' } : t);
      } catch {}
    }
    return initialTugas;
  });

  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterProdi, setFilterProdi] = useState('Semua');
  const [showTambah, setShowTambah] = useState(false);

  const [formTugas, setFormTugas] = useState({
    mapel: '',
    judul: '',
    deskripsi: '',
    deadline: '',
    prodi: 'Semua',
    guru: '',
  });

  useEffect(() => {
    localStorage.setItem('classhub_tugas_v1', JSON.stringify(tugasList));
  }, [tugasList]);

  const toggleStatus = (id) => {
    setTugasList(prev => prev.map(t => t.id === id ? { ...t, status: STATUS_CYCLE[t.status] || 'Belum' } : t));
  };

  const handleTambahTugas = (e) => {
    e.preventDefault();
    if (!formTugas.mapel || !formTugas.judul || !formTugas.deadline) return;

    const newTask = {
      ...formTugas,
      id: Date.now(),
      status: 'Belum',
    };

    setTugasList(prev => [newTask, ...prev]);
    setFormTugas({
      mapel: '',
      judul: '',
      deskripsi: '',
      deadline: '',
      prodi: 'Semua',
      guru: '',
    });
    setShowTambah(false);
  };

  const handleHapusTugas = (id) => {
    if (window.confirm('Yakin ingin menghapus tugas ini?')) {
      setTugasList(prev => prev.filter(t => t.id !== id));
    }
  };

  const filteredTugas = tugasList.filter(t => {
    const matchStatus = filterStatus === 'Semua' || t.status === filterStatus;
    const matchProdi = filterProdi === 'Semua' || t.prodi === filterProdi || t.prodi === 'Semua';
    return matchStatus && matchProdi;
  });

  const countBelum = tugasList.filter(t => t.status === 'Belum').length;
  const countProses = tugasList.filter(t => t.status === 'Proses').length;
  const countSelesai = tugasList.filter(t => t.status === 'Selesai').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Task Manager
            </span>
            <span className="text-xs text-gray-400">• Deadline & Penugasan Kuliah</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">📝 Daftar Tugas Kuliah</h1>
          <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Kelola tugas perkuliahan, praktikum, dan deadline tugas per program studi. Klik status tugas untuk mengubahnya menjadi Proses atau Selesai.
          </p>
        </div>

        <button
          onClick={() => setShowTambah(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all shrink-0"
        >
          <span>➕</span>
          <span>Tambah Tugas Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div 
          onClick={() => setFilterStatus('Belum')}
          className={`cursor-pointer p-4 rounded-2xl border text-center transition-all hover:scale-105 ${
            filterStatus === 'Belum' ? 'ring-2 ring-rose-500' : ''
          } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <p className="text-2xl sm:text-3xl font-black text-rose-400">{countBelum}</p>
          <p className="text-xs text-gray-400 mt-1 font-semibold">📌 Belum Dikerjakan</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Proses')}
          className={`cursor-pointer p-4 rounded-2xl border text-center transition-all hover:scale-105 ${
            filterStatus === 'Proses' ? 'ring-2 ring-amber-500' : ''
          } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{countProses}</p>
          <p className="text-xs text-gray-400 mt-1 font-semibold">⏳ Sedang Proses</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Selesai')}
          className={`cursor-pointer p-4 rounded-2xl border text-center transition-all hover:scale-105 ${
            filterStatus === 'Selesai' ? 'ring-2 ring-emerald-500' : ''
          } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{countSelesai}</p>
          <p className="text-xs text-gray-400 mt-1 font-semibold">✅ Sudah Selesai</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['Semua', 'Belum', 'Proses', 'Selesai'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Prodi Select */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
          <span className="text-gray-400 font-semibold shrink-0">Prodi:</span>
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

      {/* Task Cards Grid */}
      {filteredTugas.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
        }`}>
          <span className="text-5xl block mb-3">🎉</span>
          <p className="font-bold text-base">Tidak ada tugas dengan kriteria ini!</p>
          <p className="text-xs mt-1">Semua tugas sudah diselesaikan atau belum ada tugas yang ditambahkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTugas.map(t => {
            const now = new Date();
            const dead = new Date(t.deadline + 'T23:59:59');
            const diffDays = Math.ceil((dead - now) / 86400000);
            const isUrgent = diffDays <= 1 && t.status !== 'Selesai';
            const isExpired = diffDays < 0 && t.status !== 'Selesai';

            return (
              <div
                key={t.id}
                className={`rounded-3xl p-5 border flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl ${
                  isUrgent 
                    ? 'border-rose-500/50 bg-rose-500/5' 
                    : isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 truncate max-w-[150px]">
                      {t.prodi || 'Semua Prodi'}
                    </span>
                    <button
                      onClick={() => toggleStatus(t.id)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all active:scale-95 ${
                        STATUS_COLORS[t.status] || STATUS_COLORS['Belum']
                      }`}
                      title="Klik untuk ubah status tugas"
                    >
                      {t.status === 'Belum' && '🔴 Belum'}
                      {t.status === 'Proses' && '🟡 Proses'}
                      {t.status === 'Selesai' && '🟢 Selesai'}
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-indigo-400 mb-1">{t.mapel}</p>
                  <h3 className="font-extrabold text-base leading-snug">{t.judul}</h3>
                  <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t.deskripsi}
                  </p>

                  {t.guru && (
                    <p className="text-[11px] text-gray-500 mt-2">👨‍🏫 {t.guru}</p>
                  )}
                </div>

                {/* Bottom: Deadline & Action */}
                <div className={`mt-5 pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span>⏰</span>
                    <span className={`font-semibold ${
                      isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      {isExpired ? ' (Lewat)' : isUrgent ? ' (Besok!)' : ` (${diffDays} hari lagi)`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleHapusTugas(t.id)}
                    className="text-gray-400 hover:text-rose-400 text-xs transition-colors p-1"
                    title="Hapus tugas"
                  >
                    🗑️
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH TUGAS */}
      {showTambah && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTambah(false)}
        >
          <div 
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative ${
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
            <h3 className="font-black text-lg mb-4">➕ Tambah Tugas Kuliah</h3>

            <form onSubmit={handleTambahTugas} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold">Prodi Target</label>
                  <select
                    value={formTugas.prodi}
                    onChange={e => setFormTugas({ ...formTugas, prodi: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <option value="Semua">Semua Prodi</option>
                    {prodiList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Tenggat (Deadline) *</label>
                  <input
                    type="date"
                    required
                    value={formTugas.deadline}
                    onChange={e => setFormTugas({ ...formTugas, deadline: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-none ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Mata Kuliah *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Algoritma & Struktur Data"
                  value={formTugas.mapel}
                  onChange={e => setFormTugas({ ...formTugas, mapel: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tugas Praktikum Linked List"
                  value={formTugas.judul}
                  onChange={e => setFormTugas({ ...formTugas, judul: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Deskripsi / Petunjuk Pengerjaan</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan format pengumpulan, link repository, atau instruksi soal..."
                  value={formTugas.deskripsi}
                  onChange={e => setFormTugas({ ...formTugas, deskripsi: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border outline-none resize-none ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Dosen Pengampu</label>
                <input
                  type="text"
                  placeholder="Dr. Agus Supriadi, M.Kom"
                  value={formTugas.guru}
                  onChange={e => setFormTugas({ ...formTugas, guru: e.target.value })}
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
                  Simpan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

