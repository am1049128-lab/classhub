import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function MenuIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
  );
}
import { classInfo, initialProdi } from '../data/dummy';

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
  onOpenInputModal, 
  onOpenAdminModal,
  selectedProdi,
  setSelectedProdi 
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
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b backdrop-blur-md ${
      isDark 
        ? 'bg-gray-950/90 border-gray-800 text-white' 
        : 'bg-white/95 border-gray-200 text-gray-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('beranda')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/25">
              CH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Class Hub
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  FTIA
                </span>
              </div>
              <p className={`text-[11px] truncate max-w-[180px] sm:max-w-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {classInfo.name}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
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
                      onMouseLeave={() => setProdiDropdownOpen(false)}
                      className={`absolute left-0 mt-1 w-56 rounded-2xl p-2 border shadow-xl transition-all duration-200 z-50 ${
                        prodiDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
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
                      {initialProdi.map(p => (
                        <button
                          key={p}
                          onClick={() => handleNavClick('prodi', p)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            selectedProdi === p && isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                              : isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="truncate">🎓 {p}</span>
                        </button>
                      ))}
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

          {/* Action Buttons (Input Mandiri, Super Admin, Theme Toggle) */}
          <div className="flex items-center gap-2">
            {/* Tombol Input Profil Mandiri (desktop/tablet) */}
            <button
              onClick={onOpenInputModal}
              className="hidden sm:flex min-h-[44px] items-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-95 hover:scale-[1.02] hover:brightness-105 shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-200"
              title="Isi biodata & foto anggota secara mandiri"
            >
              <span>✍️</span><span>Input Profil Mandiri</span>
            </button>

            {/* Tombol Super Admin */}
            <button
              onClick={onOpenAdminModal}
              className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                isDark 
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20' 
                  : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Panel Super Admin untuk mengatur seluruh website"
            >
              <span>🛡️</span>
              <span className="hidden md:inline">Super Admin</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`min-w-[44px] min-h-[44px] p-2 rounded-xl border text-sm flex items-center justify-center transition-all ${
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
              className={`lg:hidden min-w-[44px] min-h-[44px] p-2 rounded-xl border text-base flex items-center justify-center ${
                isDark ? 'border-gray-800 bg-gray-900 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
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
                      {['Semua', ...initialProdi].map(p => <button key={p} onClick={() => handleNavClick('prodi', p)} className={`w-full min-h-[40px] px-3 rounded-lg text-left text-xs ${selectedProdi === p ? 'bg-indigo-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}>{p === 'Semua' ? '🌟 Semua Mahasiswa' : `🎓 ${p}`}</button>)}
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
            onClick={onOpenInputModal}
            className="w-full min-h-[44px] flex items-center gap-2 px-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          >
            <span>✍️</span> Input Profil Mandiri
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
              {initialProdi.map(p => (
                <button
                  key={p}
                  onClick={() => handleNavClick('prodi', p)}
                  className={`min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-medium flex items-center ${
                    selectedProdi === p && activePage === 'prodi'
                      ? 'bg-indigo-600 text-white'
                      : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}
    </header>
  );
}

