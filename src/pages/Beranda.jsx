import { useState, useEffect } from 'react';
import { classInfo as defaultClassInfo, pengumuman, initialTugas, galeri, initialProdi } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';

function CountdownCard({ tugas }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const dead = new Date(tugas.deadline + 'T23:59:59');
      const diff = dead - now;
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        hari: Math.floor(diff / 86400000),
        jam: Math.floor((diff % 86400000) / 3600000),
        menit: Math.floor((diff % 3600000) / 60000),
      });
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [tugas.deadline]);

  const isUrgent = timeLeft.hari <= 1;
  return (
    <div className={`rounded-2xl p-4 border transition-all ${
      isUrgent ? 'border-rose-500/40 bg-rose-500/10' : 'border-indigo-500/30 bg-indigo-500/10'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {tugas.mapel}
          </span>
          <p className="font-bold text-sm mt-1">{tugas.judul}</p>
        </div>
        <span className="text-xl">{isUrgent ? '🚨' : '📌'}</span>
      </div>
      {timeLeft.expired ? (
        <p className="text-rose-400 text-xs font-bold">Tenggat sudah lewat!</p>
      ) : (
        <div className="flex gap-2 mt-2">
          {[['Hari', timeLeft.hari], ['Jam', timeLeft.jam], ['Menit', timeLeft.menit]].map(([label, val]) => (
            <div key={label} className={`flex-1 text-center rounded-xl py-1.5 ${isUrgent ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}>
              <p className={`text-base font-black ${isUrgent ? 'text-rose-300' : 'text-indigo-300'}`}>{val}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BirthdayWidget({ siswaList = [] }) {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const todayStr = `${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  
  const birthdays = siswaList.filter(s => {
    if (!s.birthday) return false;
    const [, month] = s.birthday.split('-');
    return parseInt(month) === thisMonth;
  }).sort((a,b) => {
    const da = a.birthday.slice(5);
    const db = b.birthday.slice(5);
    return da.localeCompare(db);
  });

  return (
    <div className="space-y-2">
      {birthdays.length === 0 ? (
        <p className="text-gray-400 text-xs py-4 text-center">Tidak ada ulang tahun di bulan ini 🎉</p>
      ) : birthdays.map(s => {
        const mmdd = s.birthday.slice(5);
        const isToday = mmdd === todayStr;
        return (
          <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
            isToday ? 'bg-yellow-500/20 border-yellow-500/40' : 'bg-white/5 border-transparent'
          }`}>
            <img src={s.photo} alt={s.name} className="w-9 h-9 rounded-xl object-cover bg-indigo-100" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{s.name}</p>
              <p className="text-[10px] text-indigo-400">{s.prodi}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-semibold text-gray-400">
                {new Date(s.birthday).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
              </span>
              {isToday && <span className="ml-1 text-sm animate-bounce">🎂</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Beranda({ 
  setActivePage, 
  setSelectedProdi, 
  onOpenInputModal,
  anggotaList = [],
  prodiList = initialProdi,
  classInfo = defaultClassInfo 
}) {
  const { isDark } = useTheme();

  const [tugasList] = useState(() => {
    const saved = localStorage.getItem('classhub_tugas_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialTugas;
  });

  const nearestTugas = [...tugasList]
    .filter(t => t.status !== 'Selesai')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 2);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[340px] flex flex-col justify-end p-6 sm:p-10 shadow-2xl">
        <img 
          src={classInfo.heroImage || defaultClassInfo.heroImage} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-sm">
              🏛️ {classInfo.school}
            </span>
            <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-sm">
              🗓️ {classInfo.academicYear}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {classInfo.name}
          </h1>

          <p className="text-indigo-200 text-sm sm:text-base font-medium max-w-2xl">
            {classInfo.motto}
          </p>

          <p className="text-gray-300 text-xs">
            Dosen Pembimbing / Wali: <strong className="text-white">{classInfo.waliKelas}</strong>
          </p>

          {/* Quick Action Buttons on Hero */}
          <div className="flex flex-wrap gap-2.5 pt-3">
            <button
              onClick={() => setActivePage('prodi')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-lg active:scale-95 transition-all"
            >
              👥 Direktori Prodi & Anggota
            </button>
            <button
              onClick={onOpenInputModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-95 shadow-lg active:scale-95 transition-all"
            >
              ✍️ Input Profil Mandiri
            </button>
            <button
              onClick={() => setActivePage('menfest')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-lg active:scale-95 transition-all"
            >
              💌 Menfest
            </button>
            <button
              onClick={() => setActivePage('jadwal')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600/80 hover:bg-indigo-600 text-white backdrop-blur-sm border border-indigo-400/30 transition-all"
            >
              📅 Cek Jadwal Kuliah
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { 
            icon: '🎓', 
            label: 'Total Mahasiswa', 
            value: anggotaList.length,
            action: () => {
              if (setSelectedProdi) setSelectedProdi('Semua');
              setActivePage('prodi');
            }
          },
          { 
            icon: '🏛️', 
            label: 'Program Studi', 
            value: prodiList.length,
            action: () => {
              if (setSelectedProdi) setSelectedProdi('Semua');
              setActivePage('prodi');
            }
          },
          { 
            icon: '📝', 
            label: 'Tugas Belum Selesai', 
            value: tugasList.filter(t => t.status !== 'Selesai').length,
            action: () => setActivePage('tugas')
          },
          { 
            icon: '🎂', 
            label: 'Ulang Tahun Bulan Ini', 
            value: anggotaList.filter(s => {
              if (!s.birthday) return false;
              return parseInt(s.birthday.slice(5,7)) === (new Date().getMonth()+1);
            }).length,
            action: () => setActivePage('prodi')
          },
        ].map(stat => (
          <div 
            key={stat.label} 
            onClick={stat.action}
            className={`cursor-pointer rounded-2xl p-4 text-center border transition-all hover:scale-105 ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {stat.value}
            </div>
            <div className={`text-xs mt-0.5 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 2 Column Layout: Pengumuman & Right widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Pengumuman Kampus (2 span) */}
        <div className={`lg:col-span-2 rounded-3xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span className="text-xl">📢</span> Papan Pengumuman Fakultas
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold">
              Terbaru
            </span>
          </div>

          <div className="space-y-3.5">
            {pengumuman.map(p => (
              <div 
                key={p.id} 
                className={`p-4 rounded-2xl border-l-4 transition-all hover:translate-x-1 ${
                  p.important 
                    ? 'border-rose-500 bg-rose-500/5' 
                    : 'border-indigo-500 bg-indigo-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm leading-snug">{p.title}</h3>
                  {p.important && (
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full shrink-0">
                      Penting
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {p.content}
                </p>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">
                  🗓️ {new Date(p.date).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Deadline Tugas & Ulang Tahun */}
        <div className="space-y-6">
          
          {/* Deadline Countdown */}
          <div className={`rounded-3xl p-6 border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <span>⏰</span> Deadline Terdekat
              </h2>
              <button
                onClick={() => setActivePage('tugas')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
              >
                Buka Tugas →
              </button>
            </div>

            {nearestTugas.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Tidak ada deadline mendesak saat ini! 🎉</p>
            ) : (
              <div className="space-y-3">
                {nearestTugas.map(t => <CountdownCard key={t.id} tugas={t} />)}
              </div>
            )}
          </div>

          {/* Birthday Widget */}
          <div className={`rounded-3xl p-6 border ${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <h2 className="font-extrabold text-base mb-3 flex items-center gap-2">
              <span>🎂</span> Ulang Tahun Bulan Ini
            </h2>
            <BirthdayWidget siswaList={anggotaList} />
          </div>

        </div>

      </div>

      {/* Galeri Kegiatan Mahasiswa */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
          <span>📸</span> Galeri Dokumentasi & Kegiatan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {galeri.map(g => (
            <div key={g.id} className="group relative rounded-2xl overflow-hidden aspect-video shadow-md">
              <img 
                src={g.url} 
                alt={g.caption} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <p className="text-white text-xs font-semibold">{g.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spotify Playlist */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
          <span>🎵</span> Playlist Belajar & Coding Mahasiswa
        </h2>
        <iframe
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DXdPec7aLTmlC?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-2xl"
          title="Spotify Playlist Mahasiswa"
        />
      </div>

    </div>
  );
}
