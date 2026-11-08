import { useState, useEffect } from "react";
import { safeGet, safeSet } from "./utils/storage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Beranda from "./pages/Beranda";
import Anggota from "./pages/Anggota";
import Jadwal from "./pages/Jadwal";
import Tugas from "./pages/Tugas";
import Menfest from "./pages/Menfest";
import Admin from "./pages/Admin";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { initialProdi, classInfo as defaultClassInfo } from "./data/dummy";
import {
  getAdminSession,
  getAnggotaList,
  getMenfestList,
  getTugasList,
  getJadwalList,
  onAuthStateChange,
  signOutAdmin,
} from "./lib/supabase";

function AppContent() {
  const [tugasLoading, setTugasLoading] = useState(false);
  const [activePage, setActivePage] = useState("beranda");
  const [selectedProdi, setSelectedProdi] = useState("Semua");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getAdminSession().then(({ data }) => {
      if (isMounted) setIsAdminLoggedIn(Boolean(data?.session));
    });

    const { data } = onAuthStateChange((_event, session) => {
      if (isMounted) setIsAdminLoggedIn(Boolean(session));
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = async () => {
    await signOutAdmin();
    setIsAdminLoggedIn(false);
    setActivePage("beranda");
  };
  const { isDark } = useTheme();

  const [prodiList, setProdiList] = useState(() => {
    const saved = safeGet(
      "classhub_prodi_list",
      safeGet("classhub_prodi_list_v2", safeGet("classhub_prodi_list_v1")),
    );
    if (Array.isArray(saved))
      return saved.map((p) =>
        p === "Teknik Informatika" ? "Ilmu Komputer" : p,
      );
    return initialProdi;
  });

  const [classInfo, setClassInfo] = useState(() => {
    const saved = safeGet("classhub_class_info_v1");
    return saved && typeof saved === "object" ? saved : defaultClassInfo;
  });
  const handleUpdateProdi = (newProdiList) => {
    setProdiList(newProdiList);
    safeSet("classhub_prodi_list", newProdiList);
  };

  const handleUpdateClassInfo = (newInfo) => {
    setClassInfo(newInfo);
    safeSet("classhub_class_info_v1", newInfo);
  };

  // Hydrate from cache immediately so Beranda has data on its first render,
  // then refresh all lists from the active Supabase/storage helpers below.
  const [anggotaList, setAnggotaList] = useState(() => {
    const saved = safeGet("classhub_anggota_v1", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [menfestList, setMenfestList] = useState(() => {
    const saved = safeGet("classhub_menfest_live_v2", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [tugasList, setTugasList] = useState(() => {
    const saved = safeGet(
      "classhub_tugas_v2",
      safeGet("classhub_tugas_v1", []),
    );
    return Array.isArray(saved) ? saved : [];
  });
  const [jadwalList, setJadwalList] = useState(() => {
    const saved = safeGet("classhub_jadwal_v2", []);
    return Array.isArray(saved) ? saved : [];
  });

  // Instant eager parallel data hydration on mount - no refresh needed
  useEffect(() => {
    let isMounted = true;

    async function hydrateAllData() {
      try {
        const results = await Promise.allSettled([
          getAnggotaList(),
          getMenfestList(),
          getTugasList(),
          getJadwalList(),
        ]);

        if (!isMounted) return;

        const [angRes, menRes, tugasRes, jadwalRes] = results;

        if (angRes.status === "fulfilled") {
          setAnggotaList(angRes.value?.data || []);
        }
        if (menRes.status === "fulfilled") {
          setMenfestList(menRes.value?.data || []);
        }
        if (tugasRes.status === "fulfilled") {
          setTugasList(tugasRes.value?.data || []);
        }
        if (jadwalRes.status === "fulfilled") {
          setJadwalList(jadwalRes.value?.data || []);
        }
      } catch (e) {
        console.warn("Data hydration exception:", e);
      } finally {
        if (isMounted) setTugasLoading(false);
      }
    }

    hydrateAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reactive refresh handlers for admin actions
  const refreshAnggota = async () => {
    try {
      const res = await getAnggotaList();
      setAnggotaList(res.data || []);
    } catch (e) {
      console.warn("Refresh anggota failed:", e);
    }
  };

  const refreshMenfest = async () => {
    try {
      const res = await getMenfestList();
      setMenfestList(res.data || []);
    } catch (e) {
      console.warn("Refresh menfest failed:", e);
    }
  };

  const pages = {
    beranda: (
      <Beranda
        setActivePage={setActivePage}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        anggotaList={anggotaList}
        prodiList={prodiList}
        classInfo={classInfo}
        tugasList={tugasList}
        tugasLoading={tugasLoading}
        menfestList={menfestList}
        jadwalList={jadwalList}
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
    jadwal: (
      <Jadwal
        prodiList={prodiList}
        jadwalList={jadwalList}
        onUpdateJadwal={setJadwalList}
      />
    ),
    tugas: (
      <Tugas
        prodiList={prodiList}
        tugasList={tugasList}
        tugasLoading={tugasLoading}
        onUpdateTugas={setTugasList}
      />
    ),
    menfest: (
      <Menfest onMenfestChange={setMenfestList} menfestList={menfestList} />
    ),
    admin: (
      <Admin
        isLoggedIn={isAdminLoggedIn}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        anggotaList={anggotaList}
        onUpdateAnggota={(list) => {
          setAnggotaList(list);
          refreshAnggota();
        }}
        prodiList={prodiList}
        onUpdateProdi={handleUpdateProdi}
        menfestList={menfestList}
        onUpdateMenfest={(list) => {
          setMenfestList(list);
          refreshMenfest();
        }}
        classInfo={classInfo}
        onUpdateClassInfo={handleUpdateClassInfo}
      />
    ),
  };

  // Daftar halaman publik mahasiswa yang boleh menampilkan Footer.
  // "admin" sengaja TIDAK dimasukkan ke daftar ini sehingga komponen Footer
  // lenyap total di seluruh mode Admin Dashboard — baik saat layar login
  // maupun setelah admin berhasil masuk (Data Anggota, Galeri, Tugas,
  // Jadwal, Database, Keamanan, dll).
  const PUBLIC_PAGES = ["beranda", "prodi", "anggota", "jadwal", "tugas", "menfest"];
  const showFooter = PUBLIC_PAGES.includes(activePage);

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden flex flex-col transition-colors duration-200 ${
        isDark ? "bg-gray-950 text-white" : "bg-slate-50 text-gray-900"
      }`}
    >
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        prodiList={prodiList}
      />

      <main className="flex-1">{pages[activePage] || pages.beranda}</main>

      {/* Footer hanya dirender di halaman publik mahasiswa.
          Di mode Admin Dashboard footer tidak dirender sama sekali (null)
          agar layout admin menjadi full-height yang bersih dan mandiri. */}
      {showFooter && <Footer setActivePage={setActivePage} />}
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
