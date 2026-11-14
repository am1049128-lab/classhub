import { useState, useEffect } from 'react';
import { classInfo as defaultClassInfo, galeri as defaultGaleri, initialProdi } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';
import { safeGet, safeSet } from '../utils/storage';
import {
  getWIBTodayParts,
  getWIBTodayKey,
  parseBirthdayMonthDay,
  isBirthdayToday,
  formatBirthdayIndo,
} from '../utils/birthday';
import JadwalHariIniLive from '../components/JadwalHariIniLive';
import { getPengumumanList } from '../lib/supabase';

const ANNOUNCEMENT_PAGE_SIZE = 3;

/**
 * Menentukan waktu aktivitas pengumuman.
 * - Tugas/pengumuman buatan admin bisa tidak punya `created_at` (data dummy lama
 *   atau database sebelum kolom tersebut terisi); memakai tanggal deadline akan
 *   menyembunyikan pengumuman dari jendela 7 hari, jadi `updated_at` dipakai dulu,
 *   lalu waktu "sekarang" agar pengumuman tetap tampil alih-alih hilang diam-diam.
 * - Menfest selalu punya `created_at` di Supabase maupun storage lokal.
 */
function getActivityTimestamp(item, activityType) {
  const candidates =
    activityType === 'menfest'
      ? [item.created_at]
      : [item.created_at, item.createdAt, item.updated_at];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const time = typeof candidate === 'number' ? candidate : new Date(candidate).getTime();
    if (Number.isFinite(time)) return time;
  }

  return Date.now();
}

function AnimatedCounter({ value, duration = 1350 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Number(value) || 0);
    const start = performance.now();
    let frameId;
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{displayValue.toLocaleString('id-ID')}</>;
}

function CountdownCard({ tugas }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const update = () => {
      const value = String(tugas.deadline || '');
      const deadline = new Date(value + (value.includes('T') ? '' : 'T23:59:59'));
      const timestamp = deadline.getTime();
      if (!Number.isFinite(timestamp)) return setTimeLeft({ invalid: true });
      const diff = timestamp - Date.now();
      if (diff <= 0) return setTimeLeft({ expired: true });
      const totalMinutes = Math.floor(diff / 60000);
      setTimeLeft({ hari: Math.floor(totalMinutes / 1440), jam: Math.floor((totalMinutes % 1440) / 60), menit: totalMinutes % 60 });
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [tugas.deadline]);
  const isUrgent = !timeLeft.invalid && !timeLeft.expired && timeLeft.hari <= 1;
  return (
    <div className="rounded-2xl p-3 bg-white/5">
      <div className="flex items-start justify-between mb-2">
        <div><span className="text-[10px] font-bold">{tugas.mapel}</span><p className="font-bold text-sm mt-1">{tugas.judul}</p><span className="mt-1 inline-block rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] text-indigo-300">{tugas.prodi || 'Semua Prodi'}</span></div>
        <span className="text-right text-[11px] font-bold text-amber-400">{tugas.diffDays === 0 ? 'Hari ini!' : tugas.diffDays === 1 ? 'Besok!' : `${tugas.diffDays} hari lagi`} {isUrgent ? '🚨' : '📌'}</span>
      </div>
      {timeLeft.invalid ? <p className="text-rose-400 text-xs font-bold">Format tanggal tidak valid</p> : timeLeft.expired ? <p className="text-rose-400 text-xs font-bold">Deadline Terlewat</p> : <div className="flex gap-2 mt-2">{[['Hari', timeLeft.hari], ['Jam', timeLeft.jam], ['Menit', timeLeft.menit]].map(([label, val]) => <div key={label} className="flex-1 text-center rounded-xl py-1.5"><p className="text-base font-black">{val}</p><p className="text-[10px] text-gray-400 font-semibold">{label}</p></div>)}</div>}
    </div>
  );
}

function AnnouncementItem({ activity }) {
  const isPengumuman = activity.activityType === 'pengumuman';
  const isTask = activity.activityType === 'tugas';
  const deadlineValue = String(activity.deadline || '');
  const deadline = new Date(deadlineValue + (deadlineValue.includes('T') ? '' : 'T00:00:00'));
  const activityText = isPengumuman
    ? `📣 ${activity.judul}${activity.kategori && activity.kategori !== 'Umum' ? ` (${activity.kategori})` : ''}`
    : isTask
      ? `📝 Tugas Baru: ${activity.judul} (${activity.mapel}) — Deadline ${Number.isFinite(deadline.getTime()) ? deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'tidak tersedia'}`
      : `💌 Menfest Baru dari ${activity.sender || 'Anonim'} untuk ${activity.to_who || 'Semua Orang'}`;
  const accentClass = isPengumuman
    ? 'border-amber-500 bg-amber-500/5'
    : isTask
      ? 'border-indigo-500 bg-indigo-500/5'
      : 'border-pink-500 bg-pink-500/5';

  return (
    <div className={`p-4 rounded-2xl border-l-4 transition-all hover:translate-x-1 ${accentClass}`}>
      <h3 className="font-bold text-sm leading-snug">{activityText}</h3>
      {isPengumuman && activity.isi && (
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">{activity.isi}</p>
      )}
      <p className="text-[10px] text-gray-500 mt-2 font-medium">
        🗓️ {new Date(activity.activityTimestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        {isPengumuman && activity.penulis ? ` · ${activity.penulis}` : ''}
      </p>
    </div>
  );
}

const MENFEST_COLOR_HEX = {
  violet: '#8B5CF6',
  'electric-blue': '#3B82F6',
  cyan: '#06B6D4',
  emerald: '#10B981',
  lime: '#84CC16',
  amber: '#F59E0B',
  orange: '#F97316',
  rose: '#F43F5E',
  magenta: '#EC4899',
  lavender: '#6366F1',
  purple: '#A855F7',
  blue: '#3B82F6',
};

function getTopMenfest(menfestList, sinceTime) {
  if (!Array.isArray(menfestList)) return null;
  const popular = menfestList
    .map(menfest => ({ ...menfest, likes: Number(menfest.likes) || 0, createdAtTime: new Date(menfest.created_at).getTime() }))
    .filter(menfest => menfest.likes > 0 && Number.isFinite(menfest.createdAtTime) && menfest.createdAtTime >= sinceTime)
    .sort((a, b) => b.likes - a.likes || b.createdAtTime - a.createdAtTime);
  return popular[0] || null;
}

function MenfestOfTheWeekCard({ menfest, onOpen }) {
  const accent = MENFEST_COLOR_HEX[menfest.color] || MENFEST_COLOR_HEX.violet;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-indigo-500/15 p-5 sm:p-6 shadow-xl"
      style={{ borderColor: `${accent}66` }}
    >
      <div aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl" />
      <div className="relative space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
          👑 MENFEST OF THE WEEK
        </span>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="rounded-lg border px-2 py-0.5 font-bold"
            style={{ backgroundColor: `${accent}20`, borderColor: `${accent}40`, color: accent }}
          >
            Kepada: {menfest.to_who || 'Semua Orang'}
          </span>
          <span className="rounded-lg border border-gray-500/20 bg-gray-500/10 px-2 py-0.5 font-medium text-gray-400">
            Dari: {menfest.sender || 'Anonim'}
          </span>
        </div>

        <blockquote
          className="border-l-4 pl-3 text-sm font-medium leading-relaxed"
          style={{ borderLeftColor: accent }}
        >
          {menfest.message}
        </blockquote>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-400">
              ❤️ {menfest.likes} suka
            </span>
            <span className="text-[10px] font-medium text-gray-500">
              {new Date(menfest.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            🔥 TERPOPULER MINGGU INI →
          </button>
        </div>
      </div>
    </div>
  );
}

function BirthdayWidget({ siswaList = [] }) {
  const today = getWIBTodayParts();
  const todayStr = getWIBTodayKey();

  // Selaras dengan Anggota.jsx: pakai parser aman + zona waktu WIB.
  const birthdays = siswaList
    .map(s => ({ member: s, parsed: parseBirthdayMonthDay(s?.birthday) }))
    .filter(entry => entry.parsed && entry.parsed.month === today.month)
    .sort((a, b) => {
      const keyA = `${String(a.parsed.month).padStart(2, '0')}-${String(a.parsed.day).padStart(2, '0')}`;
      const keyB = `${String(b.parsed.month).padStart(2, '0')}-${String(b.parsed.day).padStart(2, '0')}`;
      // Anggota yang ultah hari ini dinaikkan ke paling atas.
      const todayA = keyA === todayStr ? 0 : 1;
      const todayB = keyB === todayStr ? 0 : 1;
      return todayA - todayB || keyA.localeCompare(keyB);
    });

  const todayCount = birthdays.filter(entry => {
    const key = `${String(entry.parsed.month).padStart(2, '0')}-${String(entry.parsed.day).padStart(2, '0')}`;
    return key === todayStr;
  }).length;

  return (
    <div className="space-y-2">
      {todayCount > 0 && (
        <p className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-2.5 py-1.5 text-center text-[11px] font-bold text-amber-300 animate-pulse">
          🎉 {todayCount} anggota berulang tahun hari ini!
        </p>
      )}
      {birthdays.length === 0 ? (
        <p className="text-gray-400 text-xs py-4 text-center">Tidak ada ulang tahun di bulan ini 🎉</p>
      ) : birthdays.map(({ member: s }) => {
        const isToday = isBirthdayToday(s.birthday);
        return (
          <div
            key={s.id}
            className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
              isToday
                ? 'bg-amber-500/20 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                : 'bg-white/5 border-transparent'
            }`}
          >
            <img
              src={s.photo}
              alt={s.name}
              className={`w-9 h-9 rounded-xl object-cover bg-indigo-100 ${isToday ? 'ring-2 ring-amber-400' : ''}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{s.name}</p>
              <p className="text-[10px] text-indigo-400">{s.prodi}</p>
            </div>
            <div className="text-right shrink-0">
              {isToday ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[10px] font-black text-slate-900">
                  🎂 HARI INI
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-gray-400">
                  {formatBirthdayIndo(s.birthday)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Beranda({
  setActivePage,
  selectedProdi = 'Semua',
  setSelectedProdi,
  anggotaList = [],
  prodiList = initialProdi,
  classInfo = defaultClassInfo,
  tugasList = [],
  tugasLoading = false,
  menfestList = [],
  jadwalList = []
}) {
  const { isDark } = useTheme();
  const [galeri, setGaleri] = useState(defaultGaleri);
  const [showPengumumanModal, setShowPengumumanModal] = useState(false);
  const [pengumumanList, setPengumumanList] = useState([]);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoTime = sevenDaysAgo.getTime();
  // State dari App selalu menjadi sumber tunggal agar pembaruan async langsung dirender.
  const sourceTugas = Array.isArray(tugasList) ? tugasList : [];

  useEffect(() => {
    if (!showPengumumanModal) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowPengumumanModal(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showPengumumanModal]);

  useEffect(() => {
    const loadGaleri = () => {
      const saved = safeGet('classhub_galeri_data');
      if (!Array.isArray(saved)) {
        safeSet('classhub_galeri_data', defaultGaleri);
        setGaleri(defaultGaleri);
        return;
      }
      setGaleri(saved);
    };

    loadGaleri();
    window.addEventListener('storage', loadGaleri);
    window.addEventListener('classhub:galeri-updated', loadGaleri);
    return () => {
      window.removeEventListener('storage', loadGaleri);
      window.removeEventListener('classhub:galeri-updated', loadGaleri);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPengumuman = () => {
      getPengumumanList()
        .then(result => {
          if (isMounted) setPengumumanList(Array.isArray(result?.data) ? result.data : []);
        })
        .catch(error => {
          console.warn('Pengumuman gagal dimuat di Beranda:', error);
        });
    };

    loadPengumuman();
    // Admin menulis pengumuman di tab lain / setelah event custom -> muat ulang feed.
    window.addEventListener('storage', loadPengumuman);
    window.addEventListener('classhub:pengumuman-updated', loadPengumuman);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', loadPengumuman);
      window.removeEventListener('classhub:pengumuman-updated', loadPengumuman);
    };
  }, []);

  const liveActivities = [
    ...pengumumanList
      .map(pengumuman => ({
        ...pengumuman,
        activityType: 'pengumuman',
        activityTimestamp: getActivityTimestamp(pengumuman, 'pengumuman'),
      }))
      .filter(pengumuman => pengumuman.activityTimestamp >= sevenDaysAgoTime),
    ...sourceTugas
      .map(tugas => ({
        ...tugas,
        activityType: 'tugas',
        activityTimestamp: getActivityTimestamp(tugas, 'tugas'),
      }))
      .filter(tugas => tugas.activityTimestamp >= sevenDaysAgoTime),
    ...menfestList
      .map(menfest => ({
        ...menfest,
        activityType: 'menfest',
        activityTimestamp: getActivityTimestamp(menfest, 'menfest'),
      }))
      .filter(menfest => menfest.activityTimestamp >= sevenDaysAgoTime),
  ].sort((a, b) => b.activityTimestamp - a.activityTimestamp);

  // Papan pengumuman menampilkan satu halaman sekaligus dan tombol "Lihat
  // Selengkapnya" mengambil alih daftar penuh di tempat. Tanpa ini kartu kiri
  // jauh lebih tinggi dari kolom kanan sehingga menyisakan ruang kosong panjang.
  // Kalau klik tombol mengubah `showPengumumanModal`, tombol lama hanya menambah
  // satu baris dan sisa ruang kosong kembali muncul.
  const visibleActivities = showPengumumanModal
    ? liveActivities
    : liveActivities.slice(0, ANNOUNCEMENT_PAGE_SIZE);
  const remainingActivities = liveActivities.length - visibleActivities.length;

  const activeTugas = sourceTugas.filter(t => t.status !== 'Selesai' && t.status !== 'selesai');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const urgentTasks = activeTugas
    .map(t => {
      const value = String(t.deadline || '');
      const deadline = new Date(value + (value.includes('T') ? '' : 'T23:59:59'));
      const deadlineTime = deadline.getTime();
      if (!Number.isFinite(deadlineTime)) return null;
      const deadlineDateOnly = new Date(deadline);
      deadlineDateOnly.setHours(0, 0, 0, 0);
      const diffDays = Math.round((deadlineDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ...t, deadlineTime, diffDays };
    })
    .filter(t => t && t.diffDays >= 0 && t.diffDays <= 2)
    .sort((a, b) => a.deadlineTime - b.deadlineTime);
  const displayedUrgentTasks = urgentTasks.slice(0, 3);
  const topMenfest = getTopMenfest(menfestList, sevenDaysAgoTime);
  const remainingCount = urgentTasks.length - 3;


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[340px] flex flex-col justify-end p-6 sm:p-10 shadow-2xl">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950"
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


          {/* Quick Action Buttons on Hero */}
          <div className="flex flex-wrap gap-2.5 pt-3">
            <button
              onClick={() => setActivePage('prodi')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-lg active:scale-95 transition-all"
            >
              👥 Direktori Prodi & Anggota
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
            value: sourceTugas.filter(t => t.status !== 'Selesai' && t.status !== 'selesai').length,
            action: () => setActivePage('tugas')
          },
          { 
            icon: '🎂', 
            label: 'Ulang Tahun Bulan Ini', 
            value: anggotaList.filter(s => {
              const parsed = parseBirthdayMonthDay(s?.birthday);
              return Boolean(parsed) && parsed.month === getWIBTodayParts().month;
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
              <AnimatedCounter value={stat.value} />
            </div>
            <div className={`text-xs mt-0.5 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Live Jadwal Kuliah Hari Ini (Realtime WIB) */}
      <JadwalHariIniLive
        jadwalList={jadwalList}
        selectedProdi={selectedProdi}
        setSelectedProdi={setSelectedProdi}
        setActivePage={setActivePage}
      />

      {/*
        Papan pengumuman dipasangkan dengan widget ulang tahun, bukan dengan
        kolom deadline/pesan terpopuler. Kolom kanan sebelumnya setinggi ~1250px
        sehingga kartu pengumuman ikut melar dan menyisakan ruang kosong panjang
        di bawah tombol "Lihat Selengkapnya". Grid ini menyeimbangkan tinggi,
        sementara daftar tetap dibatasi per halaman.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Pengumuman Kampus (2 span) */}
        <div className={`lg:col-span-2 rounded-3xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-5">
            <h2 className="font-extrabold text-lg flex items-center gap-2">
              <span className="text-xl">📢</span> Papan Pengumuman Fakultas
            </h2>
            <span className="shrink-0 text-xs whitespace-nowrap px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold">
              7 Hari Terakhir
            </span>
          </div>

          {liveActivities.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-8 text-center ${
              isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}>
              <span className="text-3xl block mb-2">☕</span>
              <p className="text-sm font-semibold">Belum ada pengumuman atau aktivitas baru dalam 7 hari terakhir.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {visibleActivities.map(activity => (
                <AnnouncementItem key={`${activity.activityType}-${activity.id}`} activity={activity} />
              ))}
              {showPengumumanModal ? (
                <button
                  type="button"
                  onClick={() => setShowPengumumanModal(false)}
                  className="w-full rounded-xl border border-indigo-400/20 bg-indigo-500/5 px-4 py-2.5 text-sm font-bold text-indigo-400 transition hover:border-indigo-400/40 hover:bg-indigo-500/10"
                >
                  ↑ Sembunyikan (menampilkan {liveActivities.length} pengumuman)
                </button>
              ) : (
                remainingActivities > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPengumumanModal(true)}
                    className="w-full rounded-xl border border-indigo-400/20 bg-indigo-500/5 px-4 py-2.5 text-sm font-bold text-indigo-400 transition hover:border-indigo-400/40 hover:bg-indigo-500/10"
                  >
                    Lihat Selengkapnya ({liveActivities.length} Pengumuman) →
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Ulang Tahun Bulan Ini */}
        <div key="birthday" className={`rounded-3xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <h2 className="font-extrabold text-base mb-3 flex items-center gap-2">
            <span>🎂</span> Ulang Tahun Bulan Ini
          </h2>
          <BirthdayWidget siswaList={anggotaList} />
        </div>
      </div>

      {/* 2 Column Layout: Deadline Tugas & Pesan Terpopuler — kartu kanan ikut
          mengisi tinggi baris grid agar tidak ada ruang kosong menggantung. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
        {/* Kolom Kiri: Deadline Tugas */}
        <div className="lg:col-span-2">

          <div key="deadline" className={`rounded-3xl p-6 border ${
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

            {tugasLoading ? (
              <p className="text-xs text-gray-400 py-4 text-center">Memuat deadline tugas...</p>
            ) : urgentTasks.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Tidak ada deadline mendesak saat ini! 🎉</p>
            ) : (
              <div className="space-y-3">
                {displayedUrgentTasks.map(t => <CountdownCard key={t.id} tugas={t} />)}
                {urgentTasks.length > 3 && (
                  <button
                    onClick={() => setActivePage('tugas')}
                    className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 group"
                  >
                    <span>Lihat {remainingCount} tugas mendesak lainnya</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {topMenfest ? (
            <div key="menfest-of-the-week" className={`flex flex-1 flex-col rounded-3xl p-6 border ${
              isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-extrabold text-base flex items-center gap-2">
                  <span>💌</span> Pesan Terpopuler
                </h2>
                <button
                  type="button"
                  onClick={() => setActivePage('menfest')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold whitespace-nowrap"
                >
                  Buka Menfest →
                </button>
              </div>
              <MenfestOfTheWeekCard menfest={topMenfest} onOpen={() => setActivePage('menfest')} />
            </div>
          ) : (
            <div className={`flex flex-1 flex-col rounded-3xl p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className="font-extrabold text-base mb-3 flex items-center gap-2">
                <span>💌</span> Pesan Terpopuler
              </h2>
              <p className="m-auto text-xs text-gray-400">Belum ada pesan populer minggu ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Arsip Foto Kelas - Google Drive */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              ☁️ Folder Bersama Aktif
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white">📸 Galeri Kenangan Kelas <span className="text-indigo-300">(Semester 1 — Lulus)</span></h2>
            <p className="mt-3 text-sm leading-relaxed text-indigo-100/80">Wadah penyimpanan bersama seluruh dokumentasi kegiatan, makrab, praktikum, dan momen kebersamaan kita dari awal masuk kuliah hingga wisuda nanti.</p>
          </div>
          <a href="https://drive.google.com/drive/folders/1OEuVn9rTkwkznpdgTegRijwDPI5wq-et?usp=drive_link" target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50">
            Buka Google Drive Dokumentasi <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      {/* Galeri Kegiatan Mahasiswa */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2">
          <span>📸</span> Galeri Dokumentasi & Kegiatan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {galeri.slice(0, 6).map(g => (
            <div key={g.id} className="group relative aspect-video overflow-hidden rounded-2xl shadow-md">
              <img
                src={g.url}
                alt={g.caption}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <div>
                  <p className="text-xs font-semibold text-white">{g.caption}</p>
                  {g.date && <p className="mt-0.5 text-[10px] text-white/70">{g.date}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPengumumanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pengumuman-modal-title"
          onClick={() => setShowPengumumanModal(false)}
        >
          <div
            className={`w-full max-w-3xl rounded-3xl border p-5 shadow-2xl sm:p-6 ${
              isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
            }`}
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="pengumuman-modal-title" className="text-lg font-black">📢 Semua Pengumuman Fakultas</h2>
                <p className="mt-1 text-xs text-gray-400">Menampilkan pengumuman 7 hari terakhir</p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal pengumuman"
                onClick={() => setShowPengumumanModal(false)}
                className="rounded-lg px-3 py-1.5 text-lg text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
              {liveActivities.map(activity => (
                <AnnouncementItem key={`${activity.activityType}-${activity.id}`} activity={activity} />
              ))}
            </div>
            <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowPengumumanModal(false)}
                className="rounded-xl border border-indigo-500/30 bg-indigo-600/20 px-4 py-2 text-sm font-bold text-indigo-300 transition hover:bg-indigo-600/30"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

