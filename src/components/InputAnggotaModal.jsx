import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { initialProdi } from '../data/dummy';
import { saveAnggota } from '../lib/supabase';

export default function InputAnggotaModal({ isOpen, onClose, onAnggotaAdded, prodiList = initialProdi }) {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    nickname: '',
    prodi: prodiList[0] || 'Ilmu Komputer',
    customProdi: '',
    birthday: '',
    quote: '',
    photo: '',
    instagram: '',
  });

  const [previewPhoto, setPreviewPhoto] = useState('');
  const [photoMode, setPhotoMode] = useState('upload'); // 'upload' | 'url' | 'avatar'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Handle upload foto dari komputer/HP
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, atau WEBP)');
      return;
    }

    // Maksimal 2MB untuk base64 di local storage / supabase
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      setPreviewPhoto(result);
      setForm(prev => ({ ...prev, photo: result }));
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlPhotoChange = (url) => {
    setForm(prev => ({ ...prev, photo: url }));
    setPreviewPhoto(url);
  };

  const handleGenerateAvatar = () => {
    const seed = form.nickname || form.name || 'avatar' + Date.now();
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,ffd5dc,c0aede,ffdfbf`;
    setForm(prev => ({ ...prev, photo: avatarUrl }));
    setPreviewPhoto(avatarUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!form.quote.trim()) {
      setErrorMsg('Kata-kata / quote wajib diisi');
      return;
    }

    const finalProdi = form.prodi === 'Lainnya' ? form.customProdi.trim() : form.prodi;
    if (!finalProdi) {
      setErrorMsg('Program studi wajib dipilih atau diisi');
      return;
    }

    // Default photo jika kosong
    const finalPhoto = form.photo || previewPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.nickname || form.name)}`;

    const newMember = {
      id: `mhs_${Date.now()}`,
      name: form.name.trim(),
      nickname: form.nickname.trim() || form.name.trim().split(' ')[0],
      prodi: finalProdi,
      birthday: form.birthday || '2005-01-01',
      quote: form.quote.trim(),
      photo: finalPhoto,
      instagram: form.instagram.trim() ? (form.instagram.startsWith('@') ? form.instagram : `@${form.instagram}`) : '',
    };

    try {
      setLoading(true);
      await saveAnggota(newMember);
      setSuccess(true);
      if (onAnggotaAdded) onAnggotaAdded(newMember);

      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setForm({
          name: '',
          nickname: '',
          prodi: prodiList[0] || 'Ilmu Komputer',
          customProdi: '',
          birthday: '',
          quote: '',
          photo: '',
          instagram: '',
        });
        setPreviewPhoto('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border my-8 relative transition-all ${
          isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-200 text-xl w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {success ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl animate-bounce">
              ✓
            </div>
            <h3 className="text-2xl font-black text-emerald-400">Data Berhasil Tersimpan!</h3>
            <p className="text-sm text-gray-400">Profil Anda kini sudah tampil di daftar mahasiswa program studi Anda.</p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Pendaftaran Mandiri
              </span>
              <h2 className="text-2xl font-black mt-2">✍️ Input Profil Anggota</h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Isi biodata, kata-kata mutiara, dan foto Anda sendiri untuk ditampilkan di halaman per prodi.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              
              {/* Foto Profil & Preview */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <label className="block text-xs font-bold mb-2">📸 Foto Profil Sendiri</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500 bg-indigo-50 flex items-center justify-center shadow-inner">
                      {previewPhoto ? (
                        <img src={previewPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-gray-400">👤</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    {/* Mode selector */}
                    <div className="flex gap-1.5 p-1 rounded-xl bg-black/10 dark:bg-white/5 text-xs">
                      <button
                        type="button"
                        onClick={() => setPhotoMode('upload')}
                        className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                          photoMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                        }`}
                      >
                        📁 Unggah File
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoMode('url')}
                        className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                          photoMode === 'url' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                        }`}
                      >
                        🔗 URL Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoMode('avatar');
                          handleGenerateAvatar();
                        }}
                        className={`flex-1 py-1 rounded-lg font-medium transition-colors ${
                          photoMode === 'avatar' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                        }`}
                      >
                        🎨 Avatar
                      </button>
                    </div>

                    {photoMode === 'upload' && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-500/50 hover:bg-indigo-500/10 text-xs font-semibold text-indigo-400 transition-colors flex items-center justify-center gap-2"
                        >
                          <span>📤</span> Pilih Foto dari Galeri / File
                        </button>
                      </div>
                    )}

                    {photoMode === 'url' && (
                      <input
                        type="url"
                        value={form.photo}
                        onChange={(e) => handleUrlPhotoChange(e.target.value)}
                        placeholder="https://example.com/foto-saya.jpg"
                        className={`w-full px-3 py-1.5 rounded-xl border text-xs outline-none ${
                          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      />
                    )}

                    {photoMode === 'avatar' && (
                      <button
                        type="button"
                        onClick={handleGenerateAvatar}
                        className="w-full py-1.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-semibold"
                      >
                        🎲 Acak Karakter Avatar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 2 kolom: Nama Lengkap & Panggilan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Muhammad Farhan"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Nama Panggilan *</label>
                  <input
                    type="text"
                    required
                    value={form.nickname}
                    onChange={e => setForm({ ...form, nickname: e.target.value })}
                    placeholder="Contoh: Farhan"
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Grid 2 kolom: Program Studi & Tanggal Lahir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Program Studi (Prodi) *</label>
                  <select
                    value={form.prodi}
                    onChange={e => setForm({ ...form, prodi: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {prodiList.map(p => (
                      <option key={p} value={p} className={isDark ? 'bg-gray-900' : 'bg-white'}>
                        {p}
                      </option>
                    ))}
                    <option value="Lainnya" className={isDark ? 'bg-gray-900' : 'bg-white'}>
                      + Ketik Prodi Lainnya
                    </option>
                  </select>

                  {form.prodi === 'Lainnya' && (
                    <input
                      type="text"
                      placeholder="Masukkan nama prodi baru..."
                      value={form.customProdi}
                      onChange={e => setForm({ ...form, customProdi: e.target.value })}
                      className={`w-full mt-2 px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Tanggal Lahir *</label>
                  <input
                    type="date"
                    required
                    value={form.birthday}
                    onChange={e => setForm({ ...form, birthday: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Kata-kata / Quote */}
              <div>
                <label className="block text-xs font-bold mb-1">Kata-kata / Motto Hidup / Quotes *</label>
                <textarea
                  rows={2}
                  required
                  value={form.quote}
                  onChange={e => setForm({ ...form, quote: e.target.value })}
                  placeholder="Contoh: Belajar konsisten tiap hari, pantang menyerah sebelum sukses! 🚀"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>

              {/* Instagram / Medsos */}
              <div>
                <label className="block text-xs font-bold mb-1">Instagram (Opsional)</label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={e => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@username"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Menyimpan...' : '💾 Simpan Profil Saya'}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
    </div>
  );
}

