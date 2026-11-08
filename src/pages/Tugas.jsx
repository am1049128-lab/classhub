import { useState, useEffect, useCallback } from 'react';
import { initialProdi } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';
import { getTugasList } from '../lib/supabase';


const isValidDeadline = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T23:59:59`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
};

export default function Tugas({ prodiList = initialProdi }) {
  const { isDark } = useTheme();

  const [tugasList, setTugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterProdi, setFilterProdi] = useState('Semua');

  // Fetch tugas dari Supabase / localStorage
  const fetchTugas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, isSupabase } = await getTugasList();
      setTugasList(data);
      setIsCloud(isSupabase);
    } catch (err) {
      console.warn('Gagal fetch tugas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTugas();
  }, [fetchTugas]);


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
            {isCloud && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Data tersinkron dengan Supabase">
                ☁️ Cloud
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">📝 Daftar Tugas Kuliah</h1>
          <p className={`text-sm mt-1 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Kelola tugas perkuliahan, praktikum, dan deadline tugas per program studi. Halaman ini bersifat read-only untuk pengguna publik.
          </p>
        </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div
          onClick={() => setFilterStatus('Belum')}
          className={`cursor-pointer p-3 sm:p-4 rounded-2xl border text-center transition-all hover:scale-105 ${
            filterStatus === 'Belum' ? 'ring-2 ring-rose-500' : ''
          } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <p className="text-2xl sm:text-3xl font-black text-rose-400">{countBelum}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">📌 Belum</p>
        </div>

        <div
          onClick={() => setFilterStatus('Proses')}
          className={`cursor-pointer p-3 sm:p-4 rounded-2xl border text-center transition-all hover:scale-105 ${
            filterStatus === 'Proses' ? 'ring-2 ring-amber-500' : ''
          } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{countProses}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">⏳ Proses</p>
        </div>

        <div
          onClick={() => setFilterStatus('Selesai')}
          className={`cursor-pointer p-3 sm:p-4 rounded-2xl border text-center transition-all hover:scale-105 ${
            filterStatus === 'Selesai' ? 'ring-2 ring-emerald-500' : ''
          } ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
        >
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{countSelesai}</p>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-semibold">✅ Selesai</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['Semua', 'Belum', 'Proses', 'Selesai'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-gray-400 font-semibold shrink-0">Prodi:</span>
          <select
            value={filterProdi}
            onChange={e => setFilterProdi(e.target.value)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border outline-none font-medium ${
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-400 space-y-2">
          <span className="text-4xl block animate-spin">⏳</span>
          <p className="font-semibold text-sm">Memuat daftar tugas...</p>
        </div>
      )}

      {/* Task Cards Grid */}
      {!loading && filteredTugas.length === 0 && (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
        }`}>
          <span className="text-5xl block mb-3">🎉</span>
          <p className="font-bold text-base">Tidak ada tugas dengan kriteria ini!</p>
          <p className="text-xs mt-1">Semua tugas sudah diselesaikan atau belum ada tugas yang ditambahkan.</p>
        </div>
      )}

      {!loading && filteredTugas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTugas.map(t => {
            const deadlineValue = String(t.deadline || '');
            const isValidDate = isValidDeadline(deadlineValue)
              || (deadlineValue.includes('T') && Number.isFinite(new Date(deadlineValue).getTime()));
            const deadlineDate = isValidDate
              ? new Date(deadlineValue + (deadlineValue.includes('T') ? '' : 'T23:59:59'))
              : null;
            const timestamp = deadlineDate?.getTime();
            const diffDays = isValidDate ? Math.ceil((timestamp - Date.now()) / 86400000) : null;
            const isExpired = isValidDate && diffDays < 0 && t.status !== 'Selesai';
            const isUrgent = isValidDate && !isExpired && diffDays <= 1 && t.status !== 'Selesai';

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

                {/* Deadline */}
                <div className={`mt-5 pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span>⏰</span>
                    <span className={`font-semibold ${
                      isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-gray-400'
                    }`}>
                      {isValidDate ? deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Format tanggal tidak valid'}
                      {isValidDate && (isExpired ? ' (Lewat)' : isUrgent ? ' (Besok!)' : ` (${Math.max(0, diffDays)} hari lagi)`)}
                    </span>
                  </div>


                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
