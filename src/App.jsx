import { useState, useEffect } from 'react';
import { safeGet, safeSet, safeSessionGet, safeSessionSet, safeSessionRemove } from './utils/storage';
import Navbar from './components/Navbar';
import Beranda from './pages/Beranda';
import Anggota from './pages/Anggota';
import Jadwal from './pages/Jadwal';
import Tugas from './pages/Tugas';
import Menfest from './pages/Menfest';
import Admin from './pages/Admin';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { initialProdi, classInfo as defaultClassInfo } from './data/dummy';
import { getAnggotaList, getMenfestList, getTugasList } from './lib/supabase';

function AppContent() {
  const [activePage, setActivePage] = useState('beranda');
  const [selectedProdi, setSelectedProdi] = useState('Semua');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => (
    safeSessionGet('classhub_admin_session') === 'authenticated'
  ));

  const handleAdminLogin = () => {
    safeSessionSet('classhub_admin_session', 'authenticated');
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    safeSessionRemove('classhub_admin_session');
    setIsAdminLoggedIn(false);
    setActivePage('beranda');
  };
  const { isDark } = useTheme();

  const [prodiList, setProdiList] = useState(() => {
    const saved = safeGet('classhub_prodi_list', safeGet('classhub_prodi_list_v2', safeGet('classhub_prodi_list_v1')));
    if (Array.isArray(saved)) return saved.map(p => p === 'Teknik Informatika' ? 'Ilmu Komputer' : p);
    return initialProdi;
  });

  const [classInfo, setClassInfo] = useState(() => {
    const saved = safeGet('classhub_class_info_v1');
    return saved && typeof saved === 'object' ? saved : defaultClassInfo;
  });
  const handleUpdateProdi = (newProdiList) => {
    setProdiList(newProdiList);
    safeSet('classhub_prodi_list', newProdiList);
  };

  const handleUpdateClassInfo = (newInfo) => {
    setClassInfo(newInfo);
    safeSet('classhub_class_info_v1', newInfo);
  };

  const [anggotaList, setAnggotaList] = useState([]);
  const [menfestList, setMenfestList] = useState([]);
  const [tugasList, setTugasList] = useState([]);
  const [tugasLoading, setTugasLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      try {
        const [angRes, menRes, tugasRes] = await Promise.all([
          getAnggotaList(),
          getMenfestList(),
          getTugasList()
        ]);
        setAnggotaList(angRes.data || []);
        setMenfestList(menRes.data || []);
        setTugasList(tugasRes.data || []);
      } catch (e) {
        console.warn('Init data exception:', e);
      } finally {
        setTugasLoading(false);
      }
    }
    initData();
  }, []);


  const pages = {
    beranda: (
      <Beranda
        setActivePage={setActivePage}
        setSelectedProdi={setSelectedProdi}
        anggotaList={anggotaList}
        prodiList={prodiList}
        classInfo={classInfo}
        tugasList={tugasList}
        tugasLoading={tugasLoading}
        menfestList={menfestList}
      />
    ),
    prodi: (
      <Anggota
        anggotaList={anggotaList}
        prodiList={prodiList}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
      />
    ),
    anggota: (
      <Anggota
        anggotaList={anggotaList}
        prodiList={prodiList}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
      />
    ),
    jadwal: <Jadwal prodiList={prodiList} />,
    tugas: <Tugas prodiList={prodiList} onTugasChange={setTugasList} />,
    menfest: <Menfest onMenfestChange={setMenfestList} />,
    admin: (
      <Admin
        isLoggedIn={isAdminLoggedIn}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        anggotaList={anggotaList}
        onUpdateAnggota={setAnggotaList}
        prodiList={prodiList}
        onUpdateProdi={handleUpdateProdi}
        menfestList={menfestList}
        onUpdateMenfest={setMenfestList}
        classInfo={classInfo}
        onUpdateClassInfo={handleUpdateClassInfo}
      />
    ),
  };

  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-slate-50 text-gray-900'
    }`}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        prodiList={prodiList}
      />

      <main className="flex-1 pb-16">
        {pages[activePage] || pages.beranda}
      </main>

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
          <span>&copy; {new Date().getFullYear()} Class Hub. All rights reserved.</span>
        </div>
      </footer>
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
