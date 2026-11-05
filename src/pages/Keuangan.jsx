import { useState } from 'react';
import { siswa, iuranMingguan, initialKasData } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Keuangan() {
  const { isDark } = useTheme();
  const [iuran, setIuran] = useState(iuranMingguan.map(w => ({ ...w, data: { ...w.data } })));
  const [kas, setKas] = useState(initialKasData);
  const [showTambahPengeluaran, setShowTambahPengeluaran] = useState(false);
  const [formPengeluaran, setFormPengeluaran] = useState({ deskripsi: '', jumlah: '' });
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);

  const toggleIuran = (weekIdx, siswaId) => {
    setIuran(prev => {
      const updated = prev.map((w, i) => {
        if (i !== weekIdx) return w;
        const wasLunas = w.data[siswaId];
        const newKas = wasLunas
          ? { ...kas, totalPemasukan: kas.totalPemasukan - 5000, saldo: kas.saldo - 5000 }
          : { ...kas, totalPemasukan: kas.totalPemasukan + 5000, saldo: kas.saldo + 5000 };
        setKas(newKas);
        return { ...w, data: { ...w.data, [siswaId]: !wasLunas } };
      });
      return updated;
    });
  };

  const tambahPengeluaran = () => {
    if (!formPengeluaran.deskripsi || !formPengeluaran.jumlah) return;
    const jumlah = parseInt(formPengeluaran.jumlah);
    const newEntry = {
      id: Date.now(),
      deskripsi: formPengeluaran.deskripsi,
      jumlah,
      tanggal: new Date().toISOString().slice(0,10),
    };
    setKas(prev => ({
      ...prev,
      pengeluaran: [newEntry, ...prev.pengeluaran],
      totalPengeluaran: prev.totalPengeluaran + jumlah,
      saldo: prev.saldo - jumlah,
    }));
    setFormPengeluaran({ deskripsi: '', jumlah: '' });
    setShowTambahPengeluaran(false);
  };

  const activeWeek = iuran[activeWeekIdx];
  const lunasCount = Object.values(activeWeek.data).filter(Boolean).length;
  const lunasPercent = Math.round((lunasCount / siswa.length) * 100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black">💰 Keuangan & Kas Kelas</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Transparansi pengelolaan iuran dan pengeluaran kelas</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Pemasukan', value: kas.totalPemasukan, icon: '📈', color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
          { label: 'Total Pengeluaran', value: kas.totalPengeluaran, icon: '📉', color: 'from-rose-400 to-red-500', bg: 'bg-rose-500/10 border-rose-500/30' },
          { label: 'Saldo Akhir', value: kas.saldo, icon: '💳', color: 'from-indigo-400 to-purple-500', bg: 'bg-indigo-500/10 border-indigo-500/30' },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl p-5 border ${card.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className={`text-xl font-bold mt-1 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{fmt(card.value)}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Iuran Mingguan */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2"><span>📊</span> Matriks Iuran Mingguan</h2>
            <p className="text-xs text-gray-400 mt-1">Klik sel untuk toggle status pembayaran</p>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lunasPercent >= 85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {lunasPercent}% lunas
            </div>
            <div className="w-24 h-2 rounded-full bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${lunasPercent >= 85 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                style={{ width: `${lunasPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Week tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {iuran.map((w, i) => (
            <button
              key={i}
              onClick={() => setActiveWeekIdx(i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                ${activeWeekIdx === i
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {w.week}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-semibold rounded-l-xl">Nama Siswa</th>
                <th className="px-4 py-2.5 text-xs text-gray-400 font-semibold rounded-r-xl text-center">Status Iuran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {siswa.map(s => {
                const isLunas = activeWeek.data[s.id];
                return (
                  <tr key={s.id} className={`transition-colors ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={s.photo} alt={s.name} className="w-6 h-6 rounded-full" />
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => toggleIuran(activeWeekIdx, s.id)}
                        className={`px-4 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 ${
                          isLunas
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                        }`}
                      >
                        {isLunas ? '✓ Lunas' : '✗ Belum'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pengeluaran */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2"><span>🧾</span> Riwayat Pengeluaran</h2>
          <button
            onClick={() => setShowTambahPengeluaran(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
          >
            <span>+</span> Tambah
          </button>
        </div>
        <div className="space-y-2">
          {kas.pengeluaran.map(p => (
            <div key={p.id} className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-sm">💸</div>
                <div>
                  <p className="text-sm font-medium">{p.deskripsi}</p>
                  <p className="text-xs text-gray-400">{new Date(p.tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}</p>
                </div>
              </div>
              <span className="text-rose-400 font-semibold text-sm">-{fmt(p.jumlah)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Pengeluaran */}
      {showTambahPengeluaran && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 w-full max-w-md ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h3 className="font-bold text-lg mb-4">Catat Pengeluaran Baru</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Deskripsi Pengeluaran</label>
                <input
                  type="text"
                  value={formPengeluaran.deskripsi}
                  onChange={e => setFormPengeluaran({...formPengeluaran, deskripsi: e.target.value})}
                  placeholder="Contoh: Beli spidol whiteboard"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500
                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Jumlah (Rp)</label>
                <input
                  type="number"
                  value={formPengeluaran.jumlah}
                  onChange={e => setFormPengeluaran({...formPengeluaran, jumlah: e.target.value})}
                  placeholder="50000"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500
                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowTambahPengeluaran(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >Batal</button>
                <button
                  onClick={tambahPengeluaran}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
                >Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
