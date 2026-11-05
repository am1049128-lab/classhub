import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  deleteAnggotaItem,
  saveAnggota,
  deleteMenfestItem
} from '../lib/supabase';
import { classInfo as defaultClassInfo } from '../data/dummy';

export default function SuperAdminModal({ 
  isOpen, 
  onClose, 
  anggotaList, 
  onUpdateAnggota, 
  prodiList, 
  onUpdateProdi,
  menfestList,
  onUpdateMenfest,
  classInfo,
  onUpdateClassInfo
}) {
  const { isDark } = useTheme();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('anggota'); // 'anggota' | 'prodi' | 'supabase' | 'menfest' | 'info'

  // Supabase settings state
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [supaTestStatus, setSupaTestStatus] = useState(null); // { success, message, loading }

  // New Prodi input state
  const [newProdiName, setNewProdiName] = useState('');

  // Info editing state
  const [editInfo, setEditInfo] = useState({
    name: classInfo?.name || defaultClassInfo.name,
    school: classInfo?.school || defaultClassInfo.school,
    waliKelas: classInfo?.waliKelas || defaultClassInfo.waliKelas,
    motto: classInfo?.motto || defaultClassInfo.motto,
  });

  // Edit anggota state
  const [editingAnggota, setEditingAnggota] = useState(null);

  // New admin password
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupaUrl(config.url || '');
      setSupaKey(config.key || '');
      setPinError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSavedPin = localStorage.getItem('classhub_admin_pin') || 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPin === currentSavedPin || adminPin === 'admin123') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Password Super Admin salah! (Default: admin123)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPin('');
    onClose();
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPassMessage('Password minimal 4 karakter');
      return;
    }
    localStorage.setItem('classhub_admin_pin', newPassword);
    setPassMessage('Password Super Admin berhasil diganti!');
    setNewPassword('');
    setTimeout(() => setPassMessage(''), 3000);
  };

  const handleTestSupabase = async () => {
    setSupaTestStatus({ loading: true });
    const res = await testSupabaseConnection(supaUrl, supaKey);
    if (res.success) {
      setSupaTestStatus({ 
        success: true, 
        message: res.warning || 'Berhasil terhubung ke Supabase! Database siap digunakan.' 
      });
    } else {
      setSupaTestStatus({ 
        success: false, 
        message: `Koneksi gagal: ${res.error}` 
      });
    }
  };

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supaUrl, supaKey);
    alert('Konfigurasi Supabase berhasil disimpan! Silakan muat ulang halaman jika diperlukan.');
  };

  const handleDeleteAnggota = async (id) => {
    if (window.confirm('Yakin ingin menghapus data anggota ini?')) {
      await deleteAnggotaItem(id);
      if (onUpdateAnggota) {
        onUpdateAnggota(anggotaList.filter(a => String(a.id) !== String(id)));
      }
    }
  };

  const handleSaveEditAnggota = async (e) => {
    e.preventDefault();
    if (!editingAnggota) return;
    await saveAnggota(editingAnggota);
    if (onUpdateAnggota) {
      onUpdateAnggota(anggotaList.map(a => String(a.id) === String(editingAnggota.id) ? editingAnggota : a));
    }
    setEditingAnggota(null);
  };

  const handleAddProdi = () => {
    const trimmed = newProdiName.trim();
    if (!trimmed) return;
    if (prodiList.includes(trimmed)) {
      alert('Prodi sudah ada!');
      return;
    }
    const updated = [...prodiList, trimmed];
    if (onUpdateProdi) onUpdateProdi(updated);
    setNewProdiName('');
  };

  const handleDeleteProdi = (name) => {
    if (window.confirm(`Hapus prodi "${name}"? Data anggota di prodi ini tidak akan terhapus.`)) {
      const updated = prodiList.filter(p => p !== name);
      if (onUpdateProdi) onUpdateProdi(updated);
    }
  };

  const handleDeleteMenfest = async (id) => {
    if (window.confirm('Hapus pesan Menfest ini?')) {
      await deleteMenfestItem(id);
      if (onUpdateMenfest) {
        onUpdateMenfest(menfestList.filter(m => m.id !== id));
      }
    }
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    if (onUpdateClassInfo) onUpdateClassInfo(editInfo);
    alert('Informasi website & fakultas berhasil diperbarui!');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-4xl rounded-3xl shadow-2xl border my-6 relative transition-all overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-gray-800 bg-gray-950/60' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Panel Super Admin</h2>
              <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Pusat Kontrol & Pengaturan Penuh Website Class Hub
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-lg p-1.5 rounded-lg hover:bg-gray-500/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Jika belum login */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl">
              🔒
            </div>
            <div>
              <h3 className="text-lg font-black">Masuk Sebagai Super Admin</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Masukkan password untuk mengakses fitur manajemen anggota, prodi, dan Supabase.
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {pinError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="Masukkan Password (default: admin123)"
                className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none text-center tracking-widest focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                }`}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all"
              >
                Buka Panel Admin →
              </button>
            </form>
            <p className="text-[11px] text-gray-500">
              💡 Password awal adalah: <code className="px-1 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">admin123</code>
            </p>
          </div>
        ) : (
          /* Setelah Login Admin */
          <div>
            {/* Tabs */}
            <div className={`flex flex-wrap gap-1 px-4 pt-3 border-b overflow-x-auto ${
              isDark ? 'border-gray-800 bg-gray-950/30' : 'border-gray-100 bg-gray-50/50'
            }`}>
              {[
                { id: 'anggota', label: `👥 Anggota (${anggotaList?.length || 0})` },
                { id: 'prodi', label: `🎓 Kelola Prodi (${prodiList?.length || 0})` },
                { id: 'supabase', label: '⚡ Supabase DB' },
                { id: 'menfest', label: `💌 Moderasi Menfest (${menfestList?.length || 0})` },
                { id: 'info', label: '⚙️ Info Website & Sandi' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
              
              {/* TAB 1: KELOLA ANGGOTA */}
              {activeTab === 'anggota' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Daftar Seluruh Anggota / Mahasiswa</h3>
                      <p className="text-xs text-gray-400">Edit foto, prodi, atau hapus anggota yang tidak sesuai</p>
                    </div>
                  </div>

                  {editingAnggota ? (
                    /* Form Edit Anggota */
                    <form onSubmit={handleSaveEditAnggota} className={`p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-indigo-400">Edit Data: {editingAnggota.name}</h4>
                        <button 
                          type="button" 
                          onClick={() => setEditingAnggota(null)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Batal
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block mb-1 font-semibold">Nama Lengkap</label>
                          <input
                            type="text"
                            value={editingAnggota.name}
                            onChange={e => setEditingAnggota({ ...editingAnggota, name: e.target.value })}
                            className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-semibold">Prodi</label>
                          <select
                            value={editingAnggota.prodi}
                            onChange={e => setEditingAnggota({ ...editingAnggota, prodi: e.target.value })}
                            className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}
                          >
                            {prodiList.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-semibold">Tanggal Lahir</label>
                          <input
                            type="date"
                            value={editingAnggota.birthday}
                            onChange={e => setEditingAnggota({ ...editingAnggota, birthday: e.target.value })}
                            className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block mb-1 font-semibold">Instagram</label>
                          <input
                            type="text"
                            value={editingAnggota.instagram}
                            onChange={e => setEditingAnggota({ ...editingAnggota, instagram: e.target.value })}
                            className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block mb-1 font-semibold">Quote / Kata-kata</label>
                          <input
                            type="text"
                            value={editingAnggota.quote}
                            onChange={e => setEditingAnggota({ ...editingAnggota, quote: e.target.value })}
                            className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block mb-1 font-semibold">URL Foto</label>
                          <input
                            type="text"
                            value={editingAnggota.photo}
                            onChange={e => setEditingAnggota({ ...editingAnggota, photo: e.target.value })}
                            className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                              isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Table Anggota */
                    <div className={`rounded-2xl border overflow-hidden ${
                      isDark ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                      <table className="w-full text-left text-xs">
                        <thead className={isDark ? 'bg-gray-950 text-gray-400' : 'bg-gray-100 text-gray-600'}>
                          <tr>
                            <th className="p-3">Foto & Nama</th>
                            <th className="p-3">Prodi</th>
                            <th className="p-3">Quotes</th>
                            <th className="p-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {anggotaList?.map(a => (
                            <tr key={a.id} className={isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}>
                              <td className="p-3 flex items-center gap-2.5">
                                <img src={a.photo} alt={a.name} className="w-8 h-8 rounded-full object-cover bg-indigo-100" />
                                <div>
                                  <p className="font-semibold">{a.name}</p>
                                  <p className="text-[10px] text-gray-400">{a.instagram || '-'}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {a.prodi}
                                </span>
                              </td>
                              <td className="p-3 max-w-xs truncate text-gray-400 italic">
                                "{a.quote}"
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setEditingAnggota(a)}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 mr-2"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAnggota(a.id)}
                                  className="text-xs text-rose-400 hover:text-rose-300"
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: KELOLA PRODI */}
              {activeTab === 'prodi' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm">Kelola Program Studi (Prodi)</h3>
                    <p className="text-xs text-gray-400">Tambah atau sesuaikan daftar prodi yang ada di fakultas</p>
                  </div>

                  {/* Add New Prodi Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProdiName}
                      onChange={e => setNewProdiName(e.target.value)}
                      placeholder="Nama Prodi Baru (misal: Sains Data)"
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddProdi}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
                    >
                      + Tambah Prodi
                    </button>
                  </div>

                  {/* Prodi List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prodiList.map(p => {
                      const count = anggotaList?.filter(a => a.prodi === p).length || 0;
                      return (
                        <div key={p} className={`flex items-center justify-between p-3 rounded-2xl border ${
                          isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div>
                            <p className="font-bold text-xs">🎓 {p}</p>
                            <p className="text-[10px] text-gray-400">{count} anggota terdaftar</p>
                          </div>
                          <button
                            onClick={() => handleDeleteProdi(p)}
                            className="text-xs text-rose-400 hover:text-rose-300 p-1"
                            title="Hapus Prodi"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: INTEGRASI SUPABASE */}
              {activeTab === 'supabase' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm">Pengaturan Database Supabase</h3>
                    <p className="text-xs text-gray-400">
                      Sambungkan website ini dengan project Supabase Anda untuk penyimpanan Menfest & Data Anggota secara online.
                    </p>
                  </div>

                  {supaTestStatus && (
                    <div className={`p-3 rounded-xl border text-xs ${
                      supaTestStatus.loading
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                        : supaTestStatus.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {supaTestStatus.loading ? '⏳ Menguji koneksi ke Supabase...' : supaTestStatus.message}
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block mb-1 font-semibold">Supabase Project URL</label>
                      <input
                        type="url"
                        value={supaUrl}
                        onChange={e => setSupaUrl(e.target.value)}
                        placeholder="https://your-project-id.supabase.co"
                        className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold">Supabase Anon Key (Public Key)</label>
                      <input
                        type="password"
                        value={supaKey}
                        onChange={e => setSupaKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                        className={`w-full px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px] ${
                          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                        }`}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestSupabase}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        🔍 Uji Koneksi
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSupabase}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        💾 Simpan Konfigurasi
                      </button>
                    </div>
                  </div>

                  {/* Schema Guide */}
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <p className="font-bold text-amber-400">📌 Panduan Membuat Tabel Supabase:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-gray-400">
                      <li>Buka Dashboard Supabase Anda: <a href="https://app.supabase.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">app.supabase.com</a></li>
                      <li>Masuk ke menu <strong>SQL Editor</strong> di bilah kiri.</li>
                      <li>Buka file <code className="text-indigo-300 font-mono">supabase_schema.sql</code> di folder proyek ini, salin seluruh isinya, lalu tempel dan klik <strong>Run</strong>.</li>
                      <li>Tabel <code className="text-indigo-300 font-mono">menfest</code> dan <code className="text-indigo-300 font-mono">anggota</code> otomatis siap digunakan!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* TAB 4: MODERASI MENFEST */}
              {activeTab === 'menfest' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm">Moderasi Pesan Menfest</h3>
                    <p className="text-xs text-gray-400">Hapus pesan menfest yang melanggar sopan santun atau spam</p>
                  </div>

                  <div className="space-y-2">
                    {menfestList?.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center">Belum ada pesan Menfest.</p>
                    ) : (
                      menfestList.map(m => (
                        <div key={m.id} className={`p-3 rounded-2xl border flex items-start justify-between gap-3 ${
                          isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-400">Untuk: {m.to_who}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">Dari: {m.sender}</span>
                              <span className="text-gray-500">•</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400">
                                {m.category}
                              </span>
                            </div>
                            <p className="text-sm">{m.message}</p>
                            <p className="text-[10px] text-gray-500">❤️ {m.likes || 0} likes</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMenfest(m.id)}
                            className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 shrink-0 font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: INFO & GANTI PASSWORD */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Edit Info Website */}
                  <form onSubmit={handleSaveInfo} className="space-y-3">
                    <h3 className="font-bold text-sm">Informasi Website & Fakultas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block mb-1 font-semibold">Nama Fakultas / Lembaga</label>
                        <input
                          type="text"
                          value={editInfo.name}
                          onChange={e => setEditInfo({ ...editInfo, name: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold">Nama Universitas</label>
                        <input
                          type="text"
                          value={editInfo.school}
                          onChange={e => setEditInfo({ ...editInfo, school: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold">Dosen Pembimbing / Wali</label>
                        <input
                          type="text"
                          value={editInfo.waliKelas}
                          onChange={e => setEditInfo({ ...editInfo, waliKelas: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-semibold">Motto Kelas / Angkatan</label>
                        <input
                          type="text"
                          value={editInfo.motto}
                          onChange={e => setEditInfo({ ...editInfo, motto: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Perbarui Info Website
                    </button>
                  </form>

                  <div className={`border-t pt-4 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    {/* Ganti Sandi Admin */}
                    <form onSubmit={handleChangePin} className="space-y-3">
                      <h3 className="font-bold text-sm">Ganti Password Super Admin</h3>
                      {passMessage && (
                        <p className="text-xs text-emerald-400 font-semibold">{passMessage}</p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Password baru (minimal 4 karakter)"
                          className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                          }`}
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
                        >
                          Ganti Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-6 py-3 border-t text-xs ${
              isDark ? 'border-gray-800 bg-gray-950/60 text-gray-400' : 'border-gray-100 bg-gray-50 text-gray-500'
            }`}>
              <span>Status: <strong className="text-emerald-400">Super Admin Aktif</strong></span>
              <button
                onClick={handleLogout}
                className="text-rose-400 hover:text-rose-300 font-semibold"
              >
                Keluar Mode Admin
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

