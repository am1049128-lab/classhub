import { useState } from 'react';
import logoFtia from '../assets/logoftia.jpeg';
import { useTheme } from '../context/ThemeContext';

function MenuIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
  );
}

/* Ikon User Shield: perisai otoritas dengan siluet admin di dalamnya.
   Memakai currentColor agar otomatis mengikuti warna teks & hover navbar. */
function AdminShieldIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Siluet perisai */}
      <path d="M12 3l7 2.6v5.2c0 4.3-2.9 7.9-7 9.2-4.1-1.3-7-4.9-7-9.2V5.6L12 3z" />
      {/* Kepala admin */}
      <circle cx="12" cy="10" r="1.9" />
      {/* Bahu admin */}
      <path d="M8.6 16.2c.5-1.6 1.8-2.5 3.4-2.5s2.9.9 3.4 2.5" />
    </svg>
  );
}
import { classInfo } from '../data/dummy';

const navItems = [
  { id: 'beranda', label: 'Beranda', icon: '🏠' },
  { id: 'prodi', label: 'Prodi & Anggota', icon: '👥' },
  { id: 'jadwal', label: 'Jadwal Kuliah', icon: '📅' },
  { id: 'tugas', label: 'Tugas', icon: '📝' },
  { id: 'menfest', label: 'Menfest', icon: '💌' },
];

export default function Navbar({ 
  activePage,
  setActivePage,
  selectedProdi,
  setSelectedProdi,
  prodiList = []
}) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prodiDropdownOpen, setProdiDropdownOpen] = useState(false);
  const [mobileProdiOpen, setMobileProdiOpen] = useState(false);

  const handleNavClick = (pageId, prodiName = null) => {
    setActivePage(pageId);
    if (prodiName && setSelectedProdi) {
      setSelectedProdi(prodiName);
    }
    setMobileMenuOpen(false);
    setProdiDropdownOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md ${
      isDark 
        ? 'bg-gray-950/90 border-gray-800 text-white' 
        : 'bg-white/95 border-gray-200 text-gray-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('beranda')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none min-w-0 flex-1"
          >
            <img
              src={logoFtia}
              alt="Logo FTIA"
              className="h-10 w-10 sm:h-11 sm:w-11 object-cover rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Class Hub
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  FTIA
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate font-medium">
                {classInfo.name}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {navItems.map(item => {
              const isActive = activePage === item.id;

              if (item.id === 'prodi') {
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleNavClick('prodi', 'Semua')}
                      onMouseEnter={() => setProdiDropdownOpen(true)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                          : isDark
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800/80'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="text-xs opacity-70">▾</span>
                    </button>

                    {/* Dropdown Menu per Prodi */}
                    <div 
                      onMouseEnter={() => setProdiDropdownOpen(true)}
                       onMouseLeave={() => setProdiDropdownOpen(false)}
                      className={`absolute left-0 top-full mt-1 w-56 rounded-2xl p-2 border shadow-xl transition-all duration-200 ease-out transform z-[60] ${
                        prodiDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1 pointer-events-none'
                      } ${
                        isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <button
                        onClick={() => handleNavClick('prodi', 'Semua')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                          selectedProdi === 'Semua' && isActive
                            ? 'bg-indigo-600 text-white'
                            : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        }`}
                      >
                        <span>🌟 Semua Mahasiswa</span>
                        <span className="text-[10px] opacity-70">Semua Prodi</span>
                      </button>
                      <div className={`my-1 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`} />
                      {prodiList.map((prodi, idx) => {
                        const namaProdi = typeof prodi === 'string' ? prodi : prodi?.name || prodi?.nama;
                        if (!namaProdi) return null;
                        return (
                          <button
                            key={prodi?.id || idx}
                            onClick={() => handleNavClick('prodi', namaProdi)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                              selectedProdi === namaProdi && isActive
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <span className="truncate">🎓 {namaProdi}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800/80'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons (Admin Portal & Theme Toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Admin Portal: akses mandiri ke halaman login admin */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`group w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all ${
                isDark
                  ? 'border-gray-700/80 bg-transparent text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/10 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                  : 'border-gray-200 bg-transparent text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-[0_0_12px_rgba(99,102,241,0.15)]'
              }`}
              title="Buka Admin Portal"
              aria-label="Buka Admin Portal"
            >
              <AdminShieldIcon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl border text-sm flex items-center justify-center transition-all ${
                isDark
                  ? 'border-gray-800 bg-gray-900 text-amber-400 hover:bg-gray-800'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-9 h-9 md:hidden rounded-xl border text-base flex items-center justify-center ${
                isDark ? 'border-gray-800 bg-gray-900 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-black/30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
        <div onClick={(event) => event.stopPropagation()} className={`border-t px-4 pt-3 pb-5 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto ${
          isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-1.5">
            {navItems.map(item => (
              item.id === 'prodi' ? (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => setMobileProdiOpen(!mobileProdiOpen)}
                    className={`w-full flex items-center justify-between gap-2 min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      activePage === item.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  ><span className="flex items-center gap-2"><span>{item.icon}</span><span>{item.label}</span></span><span className={`transition-transform duration-200 ${mobileProdiOpen ? 'rotate-180' : ''}`}>▾</span></button>
                  <div className={`grid transition-all duration-200 ease-out ${mobileProdiOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden pl-3 space-y-1">
                      {['Semua', ...prodiList].map((prodi, idx) => {
                        const namaProdi = typeof prodi === 'string' ? prodi : prodi?.name || prodi?.nama;
                        if (!namaProdi) return null;
                        return <button key={prodi?.id || namaProdi || idx} onClick={() => handleNavClick('prodi', namaProdi)} className={`w-full min-h-[40px] px-3 rounded-lg text-left text-xs ${selectedProdi === namaProdi ? 'bg-indigo-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}>{namaProdi === 'Semua' ? '🌟 Semua Mahasiswa' : `🎓 ${namaProdi}`}</button>;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2 min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all hover:translate-x-0.5 ${
                    activePage === item.id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                ><span>{item.icon}</span><span>{item.label}</span></button>
              )
            ))}
          </div>

          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full min-h-[44px] flex items-center gap-2 px-3 rounded-xl text-sm font-semibold border ${
              isDark ? 'border-gray-700 text-gray-300 bg-gray-900' : 'border-gray-200 text-gray-600 bg-gray-50'
            }`}
          >
            <AdminShieldIcon className="w-4 h-4 shrink-0" /> Admin Portal
          </button>

          {/* Quick Prodi Links in Mobile */}
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Prodi:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleNavClick('prodi', 'Semua')}
                className={`min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center ${
                  selectedProdi === 'Semua' && activePage === 'prodi'
                    ? 'bg-indigo-600 text-white'
                    : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Semua
              </button>
              {prodiList.map((prodi, idx) => {
                const namaProdi = typeof prodi === 'string' ? prodi : prodi?.name || prodi?.nama;
                if (!namaProdi) return null;
                return (
                  <button
                    key={prodi?.id || idx}
                    onClick={() => handleNavClick('prodi', namaProdi)}
                    className={`min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center ${
                      selectedProdi === namaProdi && activePage === 'prodi'
                        ? 'bg-indigo-600 text-white'
                        : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {namaProdi}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}
    </header>
  );
}

