import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Beranda from './pages/Beranda';
import Anggota from './pages/Anggota';
import Jadwal from './pages/Jadwal';
import Tugas from './pages/Tugas';
import Menfest from './pages/Menfest';
import Blog from './pages/Blog';
import InputAnggotaModal from './components/InputAnggotaModal';
import SuperAdminModal from './components/SuperAdminModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { initialProdi, classInfo as defaultClassInfo } from './data/dummy';
import { getAnggotaList, getMenfestList } from './lib/supabase';

function AppContent() {
  const [activePage, setActivePage] = useState('beranda');
  const [selectedProdi, setSelectedProdi] = useState('Semua');
  const { isDark } = useTheme();

  // State modals
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Dynamic state
  const [prodiList, setProdiList] = useState(() => {
    const saved = localStorage.getItem('classhub_prodi_list_v2') || localStorage.getItem('classhub_prodi_list_v1');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Migrasikan jika ada "Teknik Informatika" menjadi "Ilmu Komputer"
        const migrated = parsed.map(p => p === 'Teknik Informatika' ? 'Ilmu Komputer' : p);
        return migrated;
      } catch {}
    }
    return initialProdi;
  });

  const [classInfo, setClassInfo] = useState(() => {
    const saved = localStorage.getItem('classhub_class_info_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return defaultClassInfo;
  });

  const [anggotaList, setAnggotaList] = useState([]);
  const [menfestList, setMenfestList] = useState([]);

  // Load Anggota & Menfest from Supabase / LocalStorage on mount
  useEffect(() => {
    async function initData() {
      try {
        const [angRes, menRes] = await Promise.all([
          getAnggotaList(),
          getMenfestList()
        ]);
        setAnggotaList(angRes.data || []);
        setMenfestList(menRes.data || []);
      } catch (e) {
        console.warn('Init data exception:', e);
      }
    }
    initData();
  }, []);

  const handleUpdateProdi = (newProdiList) => {
    setProdiList(newProdiList);
    localStorage.setItem('classhub_prodi_list_v2', JSON.stringify(newProdiList));
  };

  const handleUpdateClassInfo = (newInfo) => {
    setClassInfo(newInfo);
    localStorage.setItem('classhub_class_info_v1', JSON.stringify(newInfo));
  };

  const handleAnggotaAdded = (newMember) => {
    setAnggotaList(prev => [newMember, ...prev]);
  };

  const pages = {
    beranda: (
      <Beranda 
        setActivePage={setActivePage} 
        setSelectedProdi={setSelectedProdi}
        onOpenInputModal={() => setIsInputModalOpen(true)}
        anggotaList={anggotaList}
        prodiList={prodiList}
        classInfo={classInfo}
      />
    ),
    prodi: (
      <Anggota 
        anggotaList={anggotaList}
        prodiList={prodiList}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        onOpenInputModal={() => setIsInputModalOpen(true)}
      />
    ),
    anggota: (
      <Anggota 
        anggotaList={anggotaList}
        prodiList={prodiList}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        onOpenInputModal={() => setIsInputModalOpen(true)}
      />
    ),
    jadwal: <Jadwal prodiList={prodiList} />,
    tugas: <Tugas prodiList={prodiList} />,
    menfest: <Menfest onOpenAdminModal={() => setIsAdminModalOpen(true)} />,
    blog: <Blog />,
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-slate-50 text-gray-900'
    }`}>
      
      {/* Top Navbar Header */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage}
        onOpenInputModal={() => setIsInputModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {pages[activePage] || pages.beranda}
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 px-4 text-center text-xs transition-colors ${
        isDark ? 'border-gray-900 bg-gray-950 text-gray-500' : 'border-gray-200 bg-white text-gray-400'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Class Hub
            </span>
            <span>—</span>
            <span>{classInfo.name} • {classInfo.school}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsInputModalOpen(true)} className="hover:text-indigo-400">
              ✍️ Input Mandiri
            </button>
            <button onClick={() => setIsAdminModalOpen(true)} className="hover:text-indigo-400">
              🛡️ Super Admin
            </button>
            <span className="text-gray-600">|</span>
            <span>&copy; {new Date().getFullYear()} Class Hub. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Modal Input Mandiri Anggota */}
      <InputAnggotaModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onAnggotaAdded={handleAnggotaAdded}
        prodiList={prodiList}
      />

      {/* Modal Super Admin Panel */}
      <SuperAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        anggotaList={anggotaList}
        onUpdateAnggota={setAnggotaList}
        prodiList={prodiList}
        onUpdateProdi={handleUpdateProdi}
        menfestList={menfestList}
        onUpdateMenfest={setMenfestList}
        classInfo={classInfo}
        onUpdateClassInfo={handleUpdateClassInfo}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
