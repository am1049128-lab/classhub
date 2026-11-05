import { useState } from 'react';
import { jadwalPelajaran, jadwalPiket, initialTugas } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis'];
const STATUS_COLORS = {
  'Belum': 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  'Proses': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'Selesai': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
};
const STATUS_CYCLE = { 'Belum': 'Proses', 'Proses': 'Selesai', 'Selesai': 'Belum' };
const MAPEL_COLORS = {
  'Matematika': 'from-blue-500 to-cyan-500',
  'Fisika': 'from-violet-500 to-purple-500',
  'Kimia': 'from-orange-500 to-red-500',
  'Biologi': 'from-green-500 to-emerald-500',
  'Bahasa Indonesia': 'from-pink-500 to-rose-500',
  'Bahasa Inggris': 'from-sky-500 to-blue-500',
  'Sejarah': 'from-amber-500 to-yellow-500',
  'default': 'from-indigo-500 to-purple-500',
};

export default function JadwalTugas() {
  const { isDark } = useTheme();
  const [tugas, setTugas] = useState(initialTugas);
  const [activeHari, setActiveHari] = useState('Senin');
  const [showTambahTugas, setShowTambahTugas] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [formTugas, setFormTugas] = useState({ mapel: '', judul: '', deskripsi: '', deadline: '', guru: '' });

  const toggleStatus = (id) => {
    setTugas(prev => prev.map(t => t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t));
  };

  const tambahTugas = () => {
    if (!formTugas.mapel || !formTugas.judul || !formTugas.deadline) return;
    setTugas(prev => [...prev, { ...formTugas, id: Date.now(), status: 'Belum' }]);
    setFormTugas({ mapel: '', judul: '', deskripsi: '', deadline: '', guru: '' });
    setShowTambahTugas(false);
  };

  const hapusTugas = (id) => setTugas(prev => prev.filter(t => t.id !== id));

  const filteredTugas = filterStatus === 'Semua' ? tugas : tugas.filter(t => t.status === filterStatus);
  const jadwalHari = jadwalPelajaran[activeHari] || [];

  const todayIdx = new Date().getDay(); // 0=Sun, 1=Mon
  const hariToday = HARI[todayIdx - 1] || 'Senin';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black">📋 Jadwal & Task Manager</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Jadwal pelajaran, piket, dan manajemen tugas interaktif</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Jadwal Pelajaran */}
        <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span>📚</span> Jadwal Pelajaran</h2>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {HARI.map(hari => (
              <button
                key={hari}
                onClick={() => setActiveHari(hari)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all relative
                  ${activeHari === hari
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {hari}
                {hari === hariToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {jadwalHari.map((j, i) => {
              const color = MAPEL_COLORS[j.mapel] || MAPEL_COLORS['default'];
              const isBreak = j.mapel.includes('Istirahat') || j.mapel.includes('Imtaq');
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <div className={`w-1 h-10 rounded-full bg-gradient-to-b ${isBreak ? 'from-gray-500 to-gray-600' : color} flex-shrink-0`}></div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${isBreak ? 'text-gray-400' : ''} bg-gradient-to-r ${isBreak ? '' : color} bg-clip-text ${isBreak ? '' : 'text-transparent'}`}>
                      {j.mapel}
                    </p>
                    {j.guru && <p className="text-xs text-gray-400">{j.guru}</p>}
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{j.jam}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Piket */}
        <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span>🧹</span> Jadwal Piket</h2>
          <div className="space-y-3">
            {jadwalPiket.map(p => (
              <div key={p.hari} className={`p-3 rounded-xl ${p.hari === hariToday ? 'bg-indigo-500/10 border border-indigo-500/30' : isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-indigo-400">{p.hari}</span>
                  {p.hari === hariToday && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full">Hari Ini</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.anggota.map(a => (
                    <span key={a} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Manager */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2"><span>✅</span> Task Manager</h2>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex gap-1.5">
              {['Semua', 'Belum', 'Proses', 'Selesai'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                    ${filterStatus === s
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTambahTugas(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
            >
              <span>+</span> Tugas Baru
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTugas.map(t => {
            const isUrgent = (() => {
              const now = new Date();
              const dead = new Date(t.deadline);
              const diff = (dead - now) / 86400000;
              return diff <= 2 && t.status !== 'Selesai';
            })();
            return (
              <div key={t.id} className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                ${isUrgent ? 'border-rose-500/40' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${MAPEL_COLORS[t.mapel] || MAPEL_COLORS['default']} text-white`}>
                    {t.mapel}
                  </span>
                  <button onClick={() => hapusTugas(t.id)} className="text-gray-500 hover:text-rose-400 transition-colors text-xs">✕</button>
                </div>
                <p className="font-semibold text-sm mb-1">{t.judul}</p>
                {t.deskripsi && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{t.deskripsi}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className={`text-xs ${isUrgent ? 'text-rose-400 font-semibold' : 'text-gray-400'}`}>
                    {isUrgent && '🚨 '}📅 {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                  <button
                    onClick={() => toggleStatus(t.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${STATUS_COLORS[t.status]}`}
                  >
                    {t.status === 'Selesai' ? '✓ ' : t.status === 'Proses' ? '⟳ ' : '○ '}{t.status}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {filteredTugas.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">🎉</span>
            <p>Tidak ada tugas di kategori ini!</p>
          </div>
        )}
      </div>

      {/* Modal Tambah Tugas */}
      {showTambahTugas && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 w-full max-w-md ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h3 className="font-bold text-lg mb-4">Tambah Tugas Baru</h3>
            <div className="space-y-3">
              {[
                { key: 'mapel', label: 'Mata Pelajaran *', placeholder: 'Matematika' },
                { key: 'judul', label: 'Judul Tugas *', placeholder: 'Latihan Soal Bab 5' },
                { key: 'guru', label: 'Guru Pengampu', placeholder: 'Bpk. Agus Supriadi' },
                { key: 'deskripsi', label: 'Deskripsi (opsional)', placeholder: 'Detail tugas...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <input
                    type="text"
                    value={formTugas[f.key]}
                    onChange={e => setFormTugas({ ...formTugas, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500
                      ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deadline *</label>
                <input
                  type="date"
                  value={formTugas.deadline}
                  onChange={e => setFormTugas({ ...formTugas, deadline: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500
                    ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowTambahTugas(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >Batal</button>
                <button
                  onClick={tambahTugas}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
                >Tambah</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
