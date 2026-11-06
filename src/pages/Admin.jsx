import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSupabaseConfig, saveAnggota, saveSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { safeGet, safeSet } from '../utils/storage';
import { classInfo as defaultClassInfo, defaultStruktur, galeri as defaultGaleri } from '../data/dummy';

const ADMIN_USERNAME = 'ftiaakt26';
const ADMIN_PASSWORD = 'ftiatitut';

const sections = [
  { id: 'overview', label: 'Overview', icon: '⌂' },
  { id: 'anggota', label: 'Data Anggota', icon: '♙' },
  { id: 'prodi', label: 'Program Studi', icon: '⌘' },
  { id: 'struktur', label: 'Struktur Pengurus', icon: 'structure' },
  { id: 'menfest', label: 'Moderasi Menfest', icon: '✉' },
  { id: 'galeri', label: 'Kelola Galeri', icon: 'gallery' },
  { id: 'database', label: 'Database', icon: '◈' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙' },
];

const emptyMember = (prodi = '') => ({
  name: '',
  nickname: '',
  prodi,
  birthday: '',
  quote: '',
  photo: '',
  instagram: '',
});

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const tone = toast.type === 'error'
    ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
    : toast.type === 'success'
      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
      : 'border-indigo-400/30 bg-indigo-500/15 text-indigo-200';

  return (
    <div className={`fixed right-4 top-20 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${tone}`} role="status">
      <span className="mt-0.5 text-sm" aria-hidden="true">
        {toast.type === 'error' ? '!' : toast.type === 'success' ? '✓' : 'i'}
      </span>
      <p className="flex-1 text-sm font-semibold">{toast.message}</p>
      <button type="button" onClick={onClose} className="text-current/60 transition hover:text-current" aria-label="Tutup notifikasi">×</button>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-xs font-bold ${className}`}>
      <span className="mb-1.5 block opacity-80">{label}</span>
      {children}
    </label>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 4.5-4.5 3.5 3 2.5-2.5L20 17.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StructureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <rect x="9" y="3" width="6" height="5" rx="1" />
      <rect x="3" y="16" width="6" height="5" rx="1" />
      <rect x="15" y="16" width="6" height="5" rx="1" />
      <path d="M12 8v4m0 0H6v4m6-4h6v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StructurePhoto({ item, isDark }) {
  const fallback = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name || item.id)}`;

  return (
    <img
      src={item.photo || fallback}
      alt={item.name || 'Foto pengurus'}
      className={`h-12 w-12 rounded-xl border object-cover ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-slate-200 bg-slate-50'}`}
      onError={event => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallback;
      }}
    />
  );
}

function StructureFileInput({ onChange }) {
  const handleChange = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return <input type="file" accept="image/*" onChange={handleChange} className="sr-only" />;
}

function StructureCard({ item, index, isDark, inputClass, onChange }) {
  return (
    <article className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
      <div className="mb-4 flex items-center gap-3">
        <StructurePhoto item={item} isDark={isDark} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black">{item.role}</p>
          <p className="mt-1 text-[11px] text-slate-500">Posisi pengurus kelas</p>
        </div>
      </div>
      <div className="space-y-3">
        <Field label="Nama mahasiswa *">
          <input value={item.name || ''} onChange={event => onChange(index, 'name', event.target.value)} className={inputClass} placeholder="Nama mahasiswa" />
        </Field>
        <Field label="Jabatan *">
          <input value={item.role || ''} onChange={event => onChange(index, 'role', event.target.value)} className={inputClass} placeholder="Jabatan" />
        </Field>
        <Field label="Foto">
          <div className="flex gap-2">
            <input type="url" value={item.photo?.startsWith('data:') ? '' : (item.photo || '')} onChange={event => onChange(index, 'photo', event.target.value)} className={`${inputClass} min-w-0`} placeholder="URL foto" />
            <label className={`shrink-0 cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-bold transition ${isDark ? 'border-white/10 text-indigo-300 hover:bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
              Upload
              <StructureFileInput onChange={photo => onChange(index, 'photo', photo)} />
            </label>
          </div>
        </Field>
      </div>
    </article>
  );
}

function StatCard({ label, value, detail, icon, accent, isDark }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/[0.045]' : 'border-slate-200 bg-white shadow-sm'}`}>
      <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full blur-2xl ${accent}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
          <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{detail}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/15 text-lg text-indigo-400">{icon}</span>
      </div>
    </div>
  );
}

function StrukturSection({ isDark, strukturList, strukturSaving, inputClass, panelClass, handleStrukturSubmit, handleStrukturReset, handleStrukturChange }) {
  return (
    <section className={panelClass}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-black">Struktur Pengurus</h2><p className={`mt-1 max-w-2xl text-xs leading-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Atur nama mahasiswa, jabatan, dan foto untuk setiap posisi pengurus kelas.</p></div><span className="inline-flex w-fit items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-400">{strukturList.length} posisi</span></div>
      <form onSubmit={handleStrukturSubmit}><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{strukturList.map((item, index) => <StructureCard key={item.id} item={item} index={index} isDark={isDark} inputClass={inputClass} onChange={handleStrukturChange} />)}</div><div className={`mt-6 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end ${isDark ? 'border-white/10' : 'border-slate-200'}`}><button type="button" onClick={handleStrukturReset} className={`rounded-xl border px-5 py-2.5 text-sm font-bold ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/[0.05]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Batalkan perubahan</button><button type="submit" disabled={strukturSaving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{strukturSaving ? 'Menyimpan...' : 'Simpan Struktur Pengurus'}</button></div></form>
    </section>
  );
}
export default function Admin({
  isLoggedIn,
  onLogin,
  onLogout,
  anggotaList = [],
  onUpdateAnggota,
  prodiList = [],
  onUpdateProdi,
  menfestList = [],
  onUpdateMenfest,
  classInfo = defaultClassInfo,
  onUpdateClassInfo,
}) {
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [memberForm, setMemberForm] = useState(() => emptyMember(prodiList[0] || ''));
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [newProdiName, setNewProdiName] = useState('');
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [supaStatus, setSupaStatus] = useState(null);
  const [galeriList, setGaleriList] = useState(defaultGaleri);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState(null);
  const [galleryForm, setGalleryForm] = useState({ url: '', caption: '', date: '', fileName: '' });
  const [strukturList, setStrukturList] = useState(defaultStruktur);

  const [strukturSaving, setStrukturSaving] = useState(false);
  const [editInfo, setEditInfo] = useState({
    name: classInfo.name || defaultClassInfo.name,
    school: classInfo.school || defaultClassInfo.school,
    motto: classInfo.motto || defaultClassInfo.motto,
  });

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupaUrl(config.url || '');
    setSupaKey(config.key || '');
    const savedStruktur = safeGet('classhub_struktur_data');
    setStrukturList(Array.isArray(savedStruktur) ? savedStruktur : defaultStruktur);
    if (!Array.isArray(savedStruktur)) safeSet('classhub_struktur_data', defaultStruktur);
    const savedGallery = safeGet('classhub_galeri_data');
    setGaleriList(Array.isArray(savedGallery) ? savedGallery : defaultGaleri);
    if (!Array.isArray(savedGallery)) safeSet('classhub_galeri_data', defaultGaleri);
  }, []);

  useEffect(() => {
    setEditInfo({
      name: classInfo.name || defaultClassInfo.name,
      school: classInfo.school || defaultClassInfo.school,
      motto: classInfo.motto || defaultClassInfo.motto,
    });
  }, [classInfo]);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onLogin();
      notify('Login berhasil. Selamat datang di Admin Dashboard.', 'success');
      return;
    }
    notify('Username atau Password Salah!', 'error');
  };

  const navigate = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const resetMemberForm = () => {
    setMemberForm(emptyMember(prodiList[0] || ''));
    setEditingMemberId(null);
  };

  const handleMemberSubmit = async (event) => {
    event.preventDefault();
    if (!memberForm.name.trim() || !memberForm.quote.trim() || !memberForm.prodi) {
      notify('Nama, prodi, dan quote wajib diisi.', 'error');
      return;
    }

    try {
      const record = await saveAnggota({
        ...memberForm,
        id: editingMemberId || undefined,
        name: memberForm.name.trim(),
        nickname: memberForm.nickname.trim() || memberForm.name.trim().split(' ')[0],
        quote: memberForm.quote.trim(),
        photo: memberForm.photo.trim() || undefined,
        instagram: memberForm.instagram.trim(),
      });
      const nextList = editingMemberId
        ? anggotaList.map(member => String(member.id) === String(record.id) ? record : member)
        : [record, ...anggotaList];
      onUpdateAnggota(nextList);
      notify(editingMemberId ? 'Data anggota berhasil diperbarui.' : 'Anggota baru berhasil ditambahkan.');
      resetMemberForm();
    } catch (error) {
      notify(error.message || 'Data anggota gagal disimpan.', 'error');
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Hapus data anggota ini?')) return;
    try {
      await deleteAnggotaItem(id);
      onUpdateAnggota(anggotaList.filter(member => String(member.id) !== String(id)));
      notify('Data anggota berhasil dihapus.');
    } catch (error) {
      notify(error.message || 'Data anggota gagal dihapus.', 'error');
    }
  };

  const handleAddProdi = () => {
    const name = newProdiName.trim();
    if (!name) return;
    if (prodiList.some(prodi => prodi.toLowerCase() === name.toLowerCase())) {
      notify('Program studi tersebut sudah ada.', 'error');
      return;
    }
    onUpdateProdi([...prodiList, name]);
    setNewProdiName('');
    notify('Program studi berhasil ditambahkan.');
  };

  const handleDeleteProdi = (name) => {
    if (!window.confirm(`Hapus program studi ${name}?`)) return;
    onUpdateProdi(prodiList.filter(prodi => prodi !== name));
    notify('Program studi berhasil dihapus.');
  };

  const handleDeleteMenfest = async (id) => {
    if (!window.confirm('Hapus pesan Menfest ini?')) return;
    try {
      await deleteMenfestItem(id);
      onUpdateMenfest(menfestList.filter(item => item.id !== id));
      notify('Pesan Menfest berhasil dihapus.');
    } catch (error) {
      notify(error.message || 'Pesan Menfest gagal dihapus.', 'error');
    }
  };

  const handleTestSupabase = async () => {
    setSupaStatus({ loading: true });
    const result = await testSupabaseConnection(supaUrl, supaKey);
    setSupaStatus(result.success
      ? { success: true, message: result.warning || 'Koneksi Supabase berhasil.' }
      : { success: false, message: `Koneksi gagal: ${result.error}` });
  };

  const handleSaveSupabase = () => {
    saveSupabaseConfig(supaUrl, supaKey);
    notify('Konfigurasi Supabase berhasil disimpan.');
  };

  const persistGallery = (nextList) => {
    setGaleriList(nextList);
    safeSet('classhub_galeri_data', nextList);
    window.dispatchEvent(new Event('classhub:galeri-updated'));
  };

  const openGalleryForm = (item = null) => {
    setEditingGalleryId(item?.id || null);
    setGalleryForm(item ? { url: item.url || '', caption: item.caption || '', date: item.date || '', fileName: item.fileName || 'Foto tersimpan' } : { url: '', caption: '', date: '', fileName: '' });
    setGalleryModalOpen(true);
  };

  const handleGalleryFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('File yang dipilih harus berupa gambar.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Ukuran foto maksimal 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setGalleryForm(prev => ({
      ...prev,
      url: String(reader.result),
      fileName: file.name,
    }));
    reader.onerror = () => notify('Foto gagal dibaca. Silakan coba lagi.', 'error');
    reader.readAsDataURL(file);
  };

  const handleGallerySubmit = (event) => {
    event.preventDefault();
    if (!galleryForm.url || !galleryForm.caption.trim()) {
      notify('Pilih foto dan isi judul kegiatan terlebih dahulu.', 'error');
      return;
    }
    if (!editingGalleryId && galeriList.length >= 6) {
      notify('Batas maksimal 6 foto telah tercapai! Hapus atau edit foto yang ada untuk menggantinya.', 'error');
      return;
    }
    const record = {
      id: editingGalleryId || `galeri_${Date.now()}`,
      url: galleryForm.url,
      fileName: galleryForm.fileName,
      caption: galleryForm.caption.trim(),
      date: galleryForm.date.trim(),
    };
    const nextList = editingGalleryId
      ? galeriList.map(item => String(item.id) === String(editingGalleryId) ? record : item)
      : [record, ...galeriList];
    persistGallery(nextList);
    setGalleryModalOpen(false);
    notify(editingGalleryId ? 'Foto galeri berhasil diedit.' : 'Foto galeri berhasil ditambahkan.');
  };

  const handleDeleteGallery = (id) => {
    if (!window.confirm('Hapus foto galeri ini?')) return;
    persistGallery(galeriList.filter(item => String(item.id) !== String(id)));
    notify('Foto galeri berhasil dihapus.');
  };

  const persistStruktur = (nextList) => {
    setStrukturList(nextList);
    safeSet('classhub_struktur_data', nextList);
    window.dispatchEvent(new Event('classhub:struktur-updated'));
  };

  const handleStrukturChange = (index, field, value) => {
    setStrukturList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleStrukturSubmit = event => {
    event.preventDefault();
    if (strukturList.some(item => !item.name?.trim() || !item.role?.trim())) {
      notify('Nama mahasiswa dan jabatan wajib diisi untuk semua posisi.', 'error');
      return;
    }
    setStrukturSaving(true);
    const nextList = strukturList.map(item => ({
      ...item,
      name: item.name.trim(),
      role: item.role.trim(),
      photo: item.photo?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name.trim())}`,
    }));
    persistStruktur(nextList);
    setStrukturSaving(false);
    notify('Struktur Pengurus Berhasil Disimpan!', 'success');
  };

  const handleStrukturReset = () => {
    setStrukturList(defaultStruktur.map(item => ({ ...item })));
    notify('Perubahan struktur dibatalkan.', 'info');
  };

  const renderStructureIcon = icon => {
    if (icon === 'gallery') return <GalleryIcon />;
    if (icon === 'structure') return <StructureIcon />;
    return icon;
  };


  const handleSaveInfo = (event) => {
    event.preventDefault();
    onUpdateClassInfo(editInfo);
    notify('Informasi website berhasil diperbarui.');
  };


  if (!isLoggedIn) {
    return (
      <section className={`relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden px-4 py-12 ${isDark ? 'bg-[#090b16]' : 'bg-slate-50'}`}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
        <Toast toast={toast} onClose={() => setToast(null)} />
        <div className={`relative w-full max-w-[460px] rounded-[2rem] border p-7 shadow-2xl sm:p-10 ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-slate-200 bg-white'}`}>
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/15 text-xl text-indigo-400">⌘</div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Class Hub FTIA</p>
              <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Secure administration portal</p>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Selamat datang kembali.</h1>
          <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Masuk untuk mengelola data fakultas, anggota, dan aktivitas Class Hub.</p>
          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <Field label="Username">
              <input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" placeholder="Masukkan username" className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`} />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Masukkan password" className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`} />
            </Field>
            <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">Masuk ke Dashboard <span aria-hidden="true">→</span></button>
          </form>
          <p className={`mt-6 text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Akses terbatas untuk administrator Class Hub.</p>
        </div>
      </section>
    );
  }

  const activeLabel = sections.find(section => section.id === activeSection)?.label || 'Overview';
  const inputClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`;
  const panelClass = `rounded-2xl border p-5 sm:p-6 ${isDark ? 'border-white/10 bg-white/[0.045]' : 'border-slate-200 bg-white shadow-sm'}`;

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${isDark ? 'bg-[#090b16]' : 'bg-slate-50'}`}>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="mx-auto flex max-w-[1600px]">
        {sidebarOpen && <button type="button" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r px-4 py-5 transition-transform lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'border-white/10 bg-[#0d1020]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between px-3 pb-7">
            <div>
              <p className="text-sm font-black tracking-tight">Class Hub <span className="text-indigo-400">/ Admin</span></p>
              <p className={`mt-1 text-[10px] uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>FTIA workspace</p>
            </div>
            <button type="button" className="text-xl text-slate-400 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar">×</button>
          </div>
          <p className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Workspace</p>
          <nav className="space-y-1">
            {sections.map(section => (
              <button key={section.id} type="button" onClick={() => navigate(section.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeSection === section.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-current/10 text-base">{renderStructureIcon(section.icon)}</span>
                {section.label}
                {section.id === 'menfest' && menfestList.length > 0 && <span className="ml-auto rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] text-pink-400">{menfestList.length}</span>}
              </button>
            ))}
          </nav>
          <div className={`absolute bottom-5 left-4 right-4 rounded-2xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50'}`}>
            <p className="text-xs font-bold">Admin aktif</p>
            <p className={`mt-1 truncate text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ADMIN_USERNAME}</p>
            <button type="button" onClick={onLogout} className="mt-3 text-xs font-bold text-rose-400 transition hover:text-rose-300">Keluar dari portal →</button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSidebarOpen(true)} className={`grid h-10 w-10 place-items-center rounded-xl border lg:hidden ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-slate-200 bg-white'}`} aria-label="Buka menu">☰</button>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Admin Dashboard / {activeLabel}</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{activeSection === 'overview' ? 'Selamat pagi, Admin.' : activeLabel}</h1>
              </div>
            </div>
            <div className={`hidden items-center gap-3 rounded-xl border px-3 py-2 sm:flex ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-white'}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>System online</span>
            </div>
          </header>

          {activeSection === 'overview' && (
            <div className="space-y-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Anggota" value={anggotaList.length} detail="Profil terdaftar" icon="♙" accent="bg-indigo-500/20" isDark={isDark} />
                <StatCard label="Program Studi" value={prodiList.length} detail="Prodi aktif" icon="⌘" accent="bg-violet-500/20" isDark={isDark} />
                <StatCard label="Pesan Menfest" value={menfestList.length} detail="Perlu moderasi" icon="✉" accent="bg-pink-500/20" isDark={isDark} />
                <StatCard label="Status Portal" value="Aktif" detail="Sesi tersimpan" icon="✓" accent="bg-emerald-500/20" isDark={isDark} />
              </div>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
                <section className={panelClass}>
                  <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-black">Aksi cepat</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kelola area penting dalam satu klik.</p></div><span className="text-xl text-indigo-400">✦</span></div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button type="button" onClick={() => navigate('anggota')} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50'}`}><span className="text-lg text-indigo-400">＋</span><p className="mt-3 text-sm font-bold">Tambah anggota</p><p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Buat profil baru</p></button>
                    <button type="button" onClick={() => navigate('menfest')} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50'}`}><span className="text-lg text-pink-400">✉</span><p className="mt-3 text-sm font-bold">Moderasi Menfest</p><p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Review pesan publik</p></button>
                    <button type="button" onClick={() => navigate('settings')} className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]' : 'border-slate-200 bg-slate-50 hover:bg-indigo-50'}`}><span className="text-lg text-amber-400">⚙</span><p className="mt-3 text-sm font-bold">Atur website</p><p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Info dan identitas</p></button>
                  </div>
                </section>
                <section className={panelClass}><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Anggota terbaru</h2><button type="button" onClick={() => navigate('anggota')} className="text-xs font-bold text-indigo-400">Lihat semua →</button></div>{anggotaList.slice(0, 5).map(member => <div key={member.id} className="flex items-center gap-3 border-b border-current/5 py-3 last:border-0"><img src={member.photo} alt="" className="h-9 w-9 rounded-xl bg-indigo-500/10 object-cover" /><div className="min-w-0"><p className="truncate text-xs font-bold">{member.name}</p><p className="truncate text-[11px] text-indigo-400">{member.prodi}</p></div></div>)}{anggotaList.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Belum ada data anggota.</p>}</section>
              </div>
            </div>
          )}

          {activeSection === 'anggota' && (
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[390px_1fr]">
              <section className={`${panelClass} h-fit`}>
                <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="font-black">{editingMemberId ? 'Edit anggota' : 'Tambah anggota'}</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Lengkapi profil mahasiswa.</p></div>{editingMemberId && <button type="button" onClick={resetMemberForm} className="text-xs font-bold text-slate-400">Batal</button>}</div>
                <form onSubmit={handleMemberSubmit} className="space-y-3">
                  <Field label="Nama lengkap *"><input required value={memberForm.name} onChange={event => setMemberForm({ ...memberForm, name: event.target.value })} className={inputClass} placeholder="Nama mahasiswa" /></Field>
                  <div className="grid grid-cols-2 gap-3"><Field label="Nama panggilan"><input value={memberForm.nickname} onChange={event => setMemberForm({ ...memberForm, nickname: event.target.value })} className={inputClass} placeholder="Panggilan" /></Field><Field label="Tanggal lahir"><input type="date" value={memberForm.birthday} onChange={event => setMemberForm({ ...memberForm, birthday: event.target.value })} className={inputClass} /></Field></div>
                  <Field label="Program studi *"><select required value={memberForm.prodi} onChange={event => setMemberForm({ ...memberForm, prodi: event.target.value })} className={inputClass}>{prodiList.map(prodi => <option key={prodi} value={prodi}>{prodi}</option>)}</select></Field>
                  <Field label="Quote / motto *"><textarea required rows={3} value={memberForm.quote} onChange={event => setMemberForm({ ...memberForm, quote: event.target.value })} className={`${inputClass} resize-none`} placeholder="Kata-kata atau motto hidup" /></Field>
                  <Field label="URL foto"><input type="url" value={memberForm.photo} onChange={event => setMemberForm({ ...memberForm, photo: event.target.value })} className={inputClass} placeholder="https://... (opsional)" /></Field>
                  <Field label="Instagram"><input value={memberForm.instagram} onChange={event => setMemberForm({ ...memberForm, instagram: event.target.value })} className={inputClass} placeholder="@username (opsional)" /></Field>
                  <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700">{editingMemberId ? 'Simpan perubahan' : '＋ Tambah anggota'}</button>
                </form>
              </section>
              <section className={`${panelClass} min-w-0`}><div className="mb-5 flex items-center justify-between"><div><h2 className="font-black">Direktori anggota</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{anggotaList.length} profil terdaftar</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className={`border-b text-[10px] uppercase tracking-wider ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}><th className="px-3 py-3">Profil</th><th className="px-3 py-3">Prodi</th><th className="px-3 py-3">Quote</th><th className="px-3 py-3 text-right">Aksi</th></tr></thead><tbody>{anggotaList.map(member => <tr key={member.id} className={`border-b last:border-0 ${isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-slate-100 hover:bg-slate-50'}`}><td className="px-3 py-3"><div className="flex items-center gap-3"><img src={member.photo} alt={member.name} className="h-9 w-9 rounded-xl object-cover" /><div><p className="font-bold">{member.name}</p><p className="text-[10px] text-slate-500">{member.instagram || 'Tanpa Instagram'}</p></div></div></td><td className="px-3 py-3"><span className="rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-400">{member.prodi}</span></td><td className="max-w-[240px] truncate px-3 py-3 text-slate-500">{member.quote}</td><td className="px-3 py-3 text-right"><button type="button" onClick={() => { setEditingMemberId(member.id); setMemberForm({ ...emptyMember(member.prodi), ...member }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mr-3 font-bold text-indigo-400">Edit</button><button type="button" onClick={() => handleDeleteMember(member.id)} className="font-bold text-rose-400">Hapus</button></td></tr>)}</tbody></table></div></section>
            </div>
          )}

          {activeSection === 'struktur' && <StrukturSection isDark={isDark} strukturList={strukturList} strukturSaving={strukturSaving} inputClass={inputClass} panelClass={panelClass} handleStrukturSubmit={handleStrukturSubmit} handleStrukturReset={handleStrukturReset} handleStrukturChange={handleStrukturChange} />}

          {activeSection === 'prodi' && <section className={panelClass}><div className="mb-6"><h2 className="font-black">Program studi</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Kelola daftar program studi yang tampil di Class Hub.</p></div><div className="flex flex-col gap-3 sm:flex-row"><input value={newProdiName} onChange={event => setNewProdiName(event.target.value)} onKeyDown={event => event.key === 'Enter' && handleAddProdi()} className={inputClass} placeholder="Contoh: Sains Data" /><button type="button" onClick={handleAddProdi} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">＋ Tambah prodi</button></div><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{prodiList.map(prodi => <div key={prodi} className={`flex items-center justify-between rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}><div><p className="text-sm font-bold">⌘ {prodi}</p><p className="mt-1 text-[11px] text-slate-500">{anggotaList.filter(member => member.prodi === prodi).length} anggota</p></div><button type="button" onClick={() => handleDeleteProdi(prodi)} className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10">×</button></div>)}</div></section>}

          {activeSection === 'menfest' && <section className={panelClass}><div className="mb-6"><h2 className="font-black">Moderasi Menfest</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Review dan hapus pesan yang tidak sesuai.</p></div><div className="space-y-3">{menfestList.length === 0 ? <p className="rounded-xl border border-dashed border-current/10 py-12 text-center text-xs text-slate-500">Belum ada pesan Menfest.</p> : menfestList.map(item => <article key={item.id} className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[11px]"><span className="font-bold text-indigo-400">Untuk: {item.to_who}</span><span className="text-slate-500">•</span><span className="text-slate-500">Dari: {item.sender}</span><span className="rounded bg-pink-500/10 px-2 py-0.5 text-pink-400">{item.category}</span></div><p className="mt-2 text-sm leading-6">{item.message}</p><p className="mt-2 text-[10px] text-slate-500">♥ {item.likes || 0} likes</p></div><button type="button" onClick={() => handleDeleteMenfest(item.id)} className="shrink-0 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20">Hapus</button></article>)}</div></section>}

          {activeSection === 'galeri' && (
            <section className={panelClass}>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-black">Kelola Galeri Dokumentasi</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${galeriList.length >= 6 ? 'border-rose-400/30 bg-rose-500/10 text-rose-400' : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-400'}`}>Kapasitas Galeri: {galeriList.length} / 6 Foto</span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Foto aktif di Beranda</span>
                  </div>
                </div>
                <button type="button" disabled={galeriList.length >= 6} onClick={() => openGalleryForm()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">＋ Tambah Foto Baru</button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {galeriList.map(item => (
                  <article key={item.id} className={`overflow-hidden rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                    <img src={item.url} alt={item.caption} className="aspect-video w-full object-cover" />
                    <div className="p-4"><h3 className="truncate text-sm font-bold">{item.caption}</h3><p className="mt-1 text-xs text-slate-500">{item.date || 'Tanggal belum diisi'}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => openGalleryForm(item)} className="min-h-10 flex-1 rounded-xl bg-indigo-500/10 px-3 text-xs font-bold text-indigo-400">Edit</button><button type="button" onClick={() => handleDeleteGallery(item.id)} className="min-h-10 flex-1 rounded-xl bg-rose-500/10 px-3 text-xs font-bold text-rose-400">Hapus</button></div></div>
                  </article>
                ))}
              </div>
              {galeriList.length === 0 && <p className="rounded-xl border border-dashed border-current/10 py-12 text-center text-xs text-slate-500">Belum ada foto galeri.</p>}
            </section>
          )}

          {activeSection === 'database' && <section className={`${panelClass} max-w-3xl`}><div className="mb-6"><h2 className="font-black">Koneksi database</h2><p className={`mt-1 text-xs leading-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Simpan konfigurasi Supabase untuk sinkronisasi data online. Kunci anon tetap berada di sisi client sesuai konfigurasi Vite.</p></div>{supaStatus && <div className={`mb-5 rounded-xl border p-3 text-xs ${supaStatus.loading ? 'border-indigo-400/20 bg-indigo-500/10 text-indigo-300' : supaStatus.success ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/20 bg-rose-500/10 text-rose-300'}`}>{supaStatus.loading ? 'Menguji koneksi...' : supaStatus.message}</div>}<div className="space-y-4"><Field label="Supabase project URL"><input type="url" value={supaUrl} onChange={event => setSupaUrl(event.target.value)} className={inputClass} placeholder="https://project.supabase.co" /></Field><Field label="Supabase anon key"><input type="password" value={supaKey} onChange={event => setSupaKey(event.target.value)} className={inputClass} placeholder="Public anon key" /></Field><div className="flex flex-wrap gap-3"><button type="button" onClick={handleTestSupabase} className={`rounded-xl border px-4 py-2.5 text-sm font-bold text-indigo-400 ${isDark ? 'border-indigo-400/30 hover:bg-indigo-500/10' : 'border-indigo-200 hover:bg-indigo-50'}`}>Uji koneksi</button><button type="button" onClick={handleSaveSupabase} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">Simpan konfigurasi</button></div></div></section>}

          {activeSection === 'settings' && <section className={`${panelClass} max-w-3xl`}><div className="mb-6"><h2 className="font-black">Pengaturan website</h2><p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Perbarui identitas yang tampil di halaman publik.</p></div><form onSubmit={handleSaveInfo} className="space-y-4"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Nama fakultas / lembaga"><input value={editInfo.name} onChange={event => setEditInfo({ ...editInfo, name: event.target.value })} className={inputClass} /></Field><Field label="Nama universitas"><input value={editInfo.school} onChange={event => setEditInfo({ ...editInfo, school: event.target.value })} className={inputClass} /></Field><Field label="Motto kelas / angkatan" className="sm:col-span-2"><input value={editInfo.motto} onChange={event => setEditInfo({ ...editInfo, motto: event.target.value })} className={inputClass} /></Field></div><button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">Simpan perubahan</button></form><div className={`mt-8 border-t pt-6 ${isDark ? 'border-white/10' : 'border-slate-200'}`}><p className="text-sm font-bold">Sesi admin</p><p className="mt-1 text-xs text-slate-500">Session tersimpan di browser ini dan akan berakhir saat sesi browser ditutup.</p><button type="button" onClick={onLogout} className="mt-4 rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10">Keluar dari portal</button></div></section>}
        </main>
      </div>

      {galleryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className={`my-8 w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-white/10 bg-[#121629]' : 'border-slate-200 bg-white'}`}>
            <div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-black">{editingGalleryId ? 'Edit Foto Galeri' : 'Tambah Foto Baru'}</h2><p className="mt-1 text-xs text-slate-500">Foto akan langsung tampil di Beranda.</p></div><button type="button" onClick={() => setGalleryModalOpen(false)} className="text-xl text-slate-400">×</button></div>
            <form onSubmit={handleGallerySubmit} className="space-y-4">
              <Field label="Foto kegiatan *">
                <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-slate-50'}`}>
                  {galleryForm.url ? (
                    <div className="space-y-3">
                      <img src={galleryForm.url} alt="Preview foto galeri" className="h-48 w-full rounded-xl border border-slate-700 object-cover" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-xs text-slate-500">{galleryForm.fileName || 'Foto tersimpan'}</span>
                        <label className="min-h-10 shrink-0 cursor-pointer rounded-xl bg-indigo-500/10 px-3 py-2.5 text-xs font-bold text-indigo-400 transition hover:bg-indigo-500/20">
                          Ganti Foto
                          <input type="file" accept="image/*" onChange={handleGalleryFileChange} className="sr-only" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-indigo-400/40 px-4 text-center transition hover:border-indigo-400 hover:bg-indigo-500/5">
                      <span className="text-3xl" aria-hidden="true">📷</span>
                      <span className="mt-3 text-sm font-bold">Pilih Foto dari Perangkat</span>
                      <span className="mt-1 text-xs text-slate-500">Klik untuk upload gambar · JPG, PNG, WEBP · Maks. 5 MB</span>
                      <input required={!editingGalleryId} type="file" accept="image/*" onChange={handleGalleryFileChange} className="sr-only" />
                    </label>
                  )}
                </div>
              </Field>
              <Field label="Judul kegiatan / momen *"><input required value={galleryForm.caption} onChange={event => setGalleryForm({ ...galleryForm, caption: event.target.value })} className={inputClass} placeholder="Contoh: Study Group di Perpus" /></Field>
              <Field label="Keterangan tanggal"><input value={galleryForm.date} onChange={event => setGalleryForm({ ...galleryForm, date: event.target.value })} className={inputClass} placeholder="Contoh: 12 Oktober 2026" /></Field>
              {galleryForm.url && <img src={galleryForm.url} alt="Preview" className="aspect-video w-full rounded-2xl object-cover" />}
              <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setGalleryModalOpen(false)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-500">Batal</button><button type="submit" className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white">{editingGalleryId ? 'Simpan perubahan' : 'Tambah foto'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
