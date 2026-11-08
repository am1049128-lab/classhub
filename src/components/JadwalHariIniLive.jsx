import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { jadwalPelajaran as dummyJadwal } from '../data/dummy';
import { safeGet } from '../utils/storage';

const WIB_TIMEZONE = 'Asia/Jakarta';
const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JADWAL_STORAGE_KEYS = ['classhub_jadwal_v2', 'classhub_jadwal'];

const HARI_ALIASES = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
};

// Formatter di-hoist agar tidak dibuat ulang setiap detik oleh komponen live.
const WIB_CLOCK_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: WIB_TIMEZONE,
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const WIB_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: WIB_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function normalizeHari(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase().replace(/[^a-z]/g, '');
  return HARI_ALIASES[key] || null;
}

function flattenDummyJadwal() {
  return Object.entries(dummyJadwal).flatMap(([hari, list]) =>
    (Array.isArray(list) ? list : []).map((item, index) => ({
      ...item,
      hari,
      id: item?.id ?? `dummy-${hari}-${index}`,
    })),
  );
}

/**
 * Membaca jadwal yang benar-benar tersimpan di localStorage.
 * Mendukung format flat array (skema baru) maupun objek per-hari (data lama).
 * Mengembalikan `null` bila tidak ada data tersimpan — pemanggil yang memutuskan
 * apakah perlu memakai dummy.js sebagai fallback.
 */
function readStoredJadwal() {
  // Menandai bahwa key jadwal ada tetapi isinya kosong (mis. admin menghapus
  // semua jadwal), sehingga fallback dummy.js tidak dipaksakan.
  let foundEmpty = false;

  for (const key of JADWAL_STORAGE_KEYS) {
    const saved = safeGet(key, null);

    if (Array.isArray(saved)) {
      if (saved.length > 0) {
        return saved.filter((item) => item && typeof item === 'object');
      }
      foundEmpty = true;
      continue;
    }

    if (saved && typeof saved === 'object') {
      const flat = [];
      Object.entries(saved).forEach(([hari, list]) => {
        if (!Array.isArray(list)) return;
        list.forEach((item, index) => {
          if (item && typeof item === 'object') {
            flat.push({ ...item, hari, id: item.id ?? `${hari}-${index}` });
          }
        });
      });
      if (flat.length > 0) return flat;
      foundEmpty = true;
    }
  }

  return foundEmpty ? [] : null;
}

/**
 * Mengambil komponen waktu WIB (Asia/Jakarta) dari sebuah Date,
 * sehingga status kelas tidak bergantung pada timezone perangkat pengguna.
 */
function getWibNow(date) {
  const parts = WIB_CLOCK_FORMATTER.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const hour = Number(parts.hour) || 0;
  const minute = Number(parts.minute) || 0;
  const second = Number(parts.second) || 0;
  const pad = (value) => String(value).padStart(2, '0');

  return {
    dayName: normalizeHari(parts.weekday),
    secondsOfDay: hour * 3600 + minute * 60 + second,
    clock: `${pad(hour)}:${pad(minute)}:${pad(second)}`,
    dateLabel: WIB_DATE_FORMATTER.format(date),
  };
}

/**
 * Parser jam fleksibel: "13:00-15:00", "08.00–09.40", "10.00 - 11.30", dsb.
 * Mengembalikan detik awal/akhir + label jam yang sudah dinormalisasi.
 */
function parseJam(jam) {
  if (typeof jam !== 'string') return null;

  const normalized = jam.replace(/[–—−]/g, '-').replace(/\s+/g, '');
  const tokens = normalized.match(/\d{1,2}[.:]\d{2}/g);
  if (!tokens || tokens.length < 2) return null;

  const toSeconds = (token) => {
    const [hours, minutes] = token.split(/[.:]/).map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours > 23 || minutes > 59) return null;
    return hours * 3600 + minutes * 60;
  };

  const start = toSeconds(tokens[0]);
  const end = toSeconds(tokens[1]);
  if (start === null || end === null) return null;

  const toLabel = (token) => {
    const [hours, minutes] = token.split(/[.:]/);
    return `${String(Number(hours)).padStart(2, '0')}:${minutes}`;
  };

  return {
    start,
    // Kelas yang melewati tengah malam tetap dihitung berurutan.
    end: end <= start ? end + 86400 : end,
    startLabel: toLabel(tokens[0]),
    endLabel: toLabel(tokens[1]),
  };
}

function formatDuration(totalSeconds) {
  const minutes = Math.max(0, Math.round(totalSeconds / 60));
  if (minutes < 1) return 'kurang dari 1 menit';
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

function matchesProdi(item, activeProdi) {
  if (!activeProdi || activeProdi === 'Semua') return true;
  const prodi = typeof item?.prodi === 'string' ? item.prodi.trim() : '';
  // Mata kuliah tanpa prodi atau berlabel "Semua" berlaku untuk semua program studi.
  return !prodi || prodi === activeProdi || prodi === 'Semua' || prodi === 'Semua Prodi';
}

function buildDayClasses(list, dayName, activeProdi) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => normalizeHari(item?.hari) === dayName)
    .filter((item) => matchesProdi(item, activeProdi))
    .map((item, index) => ({
      ...item,
      _key: `${item?.id ?? 'jadwal'}-${index}`,
      _range: parseJam(item?.jam),
    }))
    .sort((a, b) => {
      const aStart = a._range ? a._range.start : Number.POSITIVE_INFINITY;
      const bStart = b._range ? b._range.start : Number.POSITIVE_INFINITY;
      if (aStart === bStart) return 0;
      return aStart - bStart;
    });
}

/**
 * Menentukan status satu sesi kuliah terhadap detik WIB saat ini:
 * - done      : jam selesai sudah terlewati
 * - ongoing   : sedang berlangsung (termasuk sesi yang melewati tengah malam)
 * - upcoming  : belum dimulai, lengkap dengan sisa detik menuju mulai
 * - unknown   : format jam tidak dapat dibaca
 */
function resolveClassState(item, nowSeconds) {
  const range = item._range;
  if (!range) return { ...item, state: 'unknown', progress: 0 };

  const { start, end } = range;
  const crossesMidnight = end > 86400;
  const endToday = crossesMidnight ? end - 86400 : end;

  // Sesi yang dimulai malam ini dan berakhir dini hari.
  if (crossesMidnight) {
    if (nowSeconds >= start) {
      const progress = Math.min(100, ((nowSeconds - start) / (end - start)) * 100);
      return { ...item, state: 'ongoing', progress, remaining: end - nowSeconds };
    }
    // Sisa sesi dari malam sebelumnya.
    if (nowSeconds < endToday) {
      const effectiveNow = nowSeconds + 86400;
      const progress = Math.min(100, ((effectiveNow - start) / (end - start)) * 100);
      return { ...item, state: 'ongoing', progress, remaining: end - effectiveNow };
    }
    // Di antara akhir sesi dini hari dan jam mulai malam ini.
    return { ...item, state: 'upcoming', progress: 0, untilStart: start - nowSeconds };
  }

  if (nowSeconds >= end) return { ...item, state: 'done', progress: 100 };

  if (nowSeconds >= start) {
    const progress = Math.min(100, ((nowSeconds - start) / (end - start)) * 100);
    return { ...item, state: 'ongoing', progress, remaining: end - nowSeconds };
  }

  return { ...item, state: 'upcoming', progress: 0, untilStart: start - nowSeconds };
}

function statusText(item) {
  if (item.state === 'ongoing') return 'Sedang berlangsung';
  if (item.state === 'done') return 'Selesai';
  if (item.state === 'unknown') return 'Jam menyusul';
  if (item.untilStart <= 60) return 'Segera dimulai';
  return `Mulai ${formatDuration(item.untilStart)} lagi`;
}

function ClassRow({ item, isDark, isNext }) {
  const stateStyles = {
    ongoing: {
      card: 'border-emerald-500/45 bg-emerald-500/[0.08] shadow-lg shadow-emerald-500/10',
      time: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pill: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    },
    upcoming: {
      card: isDark
        ? 'border-gray-800 bg-gray-800/40 hover:border-indigo-500/40'
        : 'border-gray-200 bg-gray-50 hover:border-indigo-300',
      time: isDark ? 'text-gray-300' : 'text-gray-700',
      dot: 'bg-indigo-400',
      pill: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
    },
    done: {
      card: isDark ? 'border-gray-800/70 bg-gray-950/30' : 'border-gray-200 bg-gray-50/70',
      time: 'text-gray-500',
      dot: 'bg-gray-500',
      pill: 'border-gray-600/30 bg-gray-500/10 text-gray-400',
    },
    unknown: {
      card: isDark ? 'border-amber-500/25 bg-amber-500/5' : 'border-amber-200 bg-amber-50',
      time: 'text-amber-400',
      dot: 'bg-amber-400',
      pill: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
  };

  const style = stateStyles[item.state] || stateStyles.unknown;
  const prodiLabel = item.prodi && item.prodi !== 'Semua' ? item.prodi : 'Semua Prodi';

  return (
    <li
      className={`relative flex gap-3 rounded-2xl border p-3.5 transition-all ${style.card} ${
        item.state === 'done' ? 'opacity-70' : ''
      }`}
    >
      {/* Blok waktu */}
      <div className="flex w-14 shrink-0 flex-col items-center pt-0.5">
        <span className={`font-mono text-xs font-black tabular-nums ${style.time}`}>
          {item._range ? item._range.startLabel : '--:--'}
        </span>
        <span
          className={`my-1 h-6 w-px ${
            item.state === 'ongoing'
              ? 'bg-emerald-400/60'
              : isDark
                ? 'bg-gray-700'
                : 'bg-gray-300'
          }`}
        />
        <span className="font-mono text-[10px] font-semibold tabular-nums text-gray-500">
          {item._range ? item._range.endLabel : '--:--'}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-extrabold leading-snug">
              {item.mapel || 'Mata kuliah'}
            </h3>
            <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">
              {[item.ruangan, prodiLabel].filter(Boolean).join(' • ')}
            </p>
            {item.guru && (
              <p className="mt-0.5 truncate text-[11px] text-gray-500">👨‍🏫 {item.guru}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {isNext && (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                Berikutnya
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.pill}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${style.dot} ${
                  item.state === 'ongoing' ? 'animate-pulse' : ''
                }`}
              />
              {statusText(item)}
            </span>
          </div>
        </div>

        {item.state === 'ongoing' && (
          <div className="mt-2.5">
            <div
              className={`h-1.5 w-full overflow-hidden rounded-full ${
                isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/15'
              }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-[width] duration-1000 ease-linear"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-emerald-400">
              <span>Berlangsung sekarang</span>
              <span>
                {Math.round(item.progress)}% • sisa {formatDuration(item.remaining)}
              </span>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

export default function JadwalHariIniLive({
  jadwalList = [],
  selectedProdi = 'Semua',
  setSelectedProdi,
  setActivePage,
}) {
  const { isDark } = useTheme();
  const [now, setNow] = useState(() => new Date());
  // `null` = belum ada event sinkron; objek = hasil pembacaan storage terakhir.
  // Data kosong tetap dihormati agar penghapusan jadwal oleh admin tercermin.
  const [storageSnapshot, setStorageSnapshot] = useState(null);

  // Jam berjalan realtime — satu interval per komponen, dibersihkan saat unmount.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sinkronisasi dengan perubahan jadwal dari Admin / tab lain.
  useEffect(() => {
    const syncFromStorage = () => setStorageSnapshot(readStoredJadwal());
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('classhub:jadwal-updated', syncFromStorage);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('classhub:jadwal-updated', syncFromStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Prioritas sumber data:
  // 1. snapshot terbaru dari event admin / tab lain,
  // 2. localStorage ('classhub_jadwal_v2' lalu 'classhub_jadwal') — selalu
  //    ditulis ulang oleh helper Supabase, jadi paling mutakhir,
  // 3. state `jadwalList` dari App,
  // 4. dummy.js bila semuanya kosong.
  // Array kosong dari storage tetap dihormati agar penghapusan jadwal oleh
  // admin langsung tercermin, alih-alih memunculkan dummy lagi.
  const jadwalSource = useMemo(() => {
    if (Array.isArray(storageSnapshot)) return storageSnapshot;

    const stored = readStoredJadwal();
    if (Array.isArray(stored)) return stored;

    if (Array.isArray(jadwalList) && jadwalList.length > 0) return jadwalList;
    return flattenDummyJadwal();
  }, [jadwalList, storageSnapshot]);

  const activeProdi =
    typeof selectedProdi === 'string' && selectedProdi.trim() ? selectedProdi.trim() : 'Semua';
  const filterActive = activeProdi !== 'Semua';

  const wib = getWibNow(now);
  const todayName = wib.dayName || HARI_ORDER[(now.getDay() + 6) % 7];

  const todayClasses = useMemo(
    () => buildDayClasses(jadwalSource, todayName, activeProdi),
    [jadwalSource, todayName, activeProdi],
  );

  const hasClassesTodayAnyProdi = useMemo(
    () => buildDayClasses(jadwalSource, todayName, 'Semua').length > 0,
    [jadwalSource, todayName],
  );

  const nextStudyDay = useMemo(() => {
    const startIndex = HARI_ORDER.indexOf(todayName);
    if (startIndex === -1) return null;

    for (let offset = 1; offset <= 7; offset += 1) {
      const name = HARI_ORDER[(startIndex + offset) % 7];
      const items = buildDayClasses(jadwalSource, name, activeProdi);
      if (items.length > 0) return { name, items, offset };
    }
    return null;
  }, [jadwalSource, todayName, activeProdi]);

  const enrichedClasses = todayClasses.map((item) =>
    resolveClassState(item, wib.secondsOfDay),
  );

  const doneCount = enrichedClasses.filter((item) => item.state === 'done').length;
  const ongoingClass = enrichedClasses.find((item) => item.state === 'ongoing');
  const nextClass = enrichedClasses.find((item) => item.state === 'upcoming');
  const nextClassKey = (ongoingClass ? null : nextClass?._key) ?? null;

  const nextDayLabel = nextStudyDay
    ? nextStudyDay.offset === 1
      ? 'Besok'
      : `${nextStudyDay.name}`
    : '';

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border shadow-xl ${
        isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
      }`}
      aria-labelledby="jadwal-live-title"
    >
      {/* Header live clock */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 px-5 py-5 sm:px-7">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-purple-500/20 blur-3xl"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live WIB
              </span>
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-200">
                {filterActive ? `🎓 ${activeProdi}` : '🌟 Semua Prodi'}
              </span>
            </div>

            <h2
              id="jadwal-live-title"
              className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl"
            >
              📅 Jadwal Kuliah Hari Ini
            </h2>
            <p className="mt-1 text-xs font-medium capitalize text-indigo-200/80 sm:text-sm">
              {wib.dateLabel}
            </p>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p
              className="font-mono text-3xl font-black tabular-nums tracking-tight text-white sm:text-4xl"
              aria-live="off"
            >
              {wib.clock}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">
              Waktu Indonesia Barat
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {filterActive && (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold ${
              isDark
                ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700'
            }`}
          >
            <span>
              🎓 Menampilkan jadwal untuk <strong>{activeProdi}</strong> (+ mata kuliah semua
              prodi)
            </span>
            {setSelectedProdi && (
              <button
                type="button"
                onClick={() => setSelectedProdi('Semua')}
                className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition hover:opacity-80 ${
                  isDark
                    ? 'border-indigo-400/40 text-indigo-200'
                    : 'border-indigo-300 text-indigo-700'
                }`}
              >
                Tampilkan Semua Prodi
              </button>
            )}
          </div>
        )}

        {enrichedClasses.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-6 text-center ${
              isDark ? 'border-gray-700 bg-gray-950/40' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <span className="text-4xl">{todayName === 'Minggu' ? '🌴' : '☕'}</span>
            <p className="mt-2 text-sm font-black">
              {todayName === 'Minggu'
                ? 'Hari Minggu — waktu istirahat!'
                : 'Tidak ada kuliah hari ini'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {filterActive && hasClassesTodayAnyProdi
                ? `Tidak ada jadwal untuk ${activeProdi} hari ini, tetapi ada kelas untuk prodi lain.`
                : filterActive
                  ? `Belum ada jadwal ${activeProdi} untuk hari ini.`
                  : 'Manfaatkan waktu luang untuk belajar mandiri atau mengerjakan tugas. 📚'}
            </p>

            {filterActive && hasClassesTodayAnyProdi && setSelectedProdi && (
              <button
                type="button"
                onClick={() => setSelectedProdi('Semua')}
                className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-300 transition hover:bg-indigo-500/20"
              >
                Lihat jadwal semua prodi
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-gray-400">
                {enrichedClasses.length} sesi kuliah • {doneCount} selesai
                {nextClass && nextClass._range
                  ? ` • berikutnya ${nextClass._range.startLabel}`
                  : ongoingClass
                    ? ' • sedang berlangsung'
                    : ''}
              </p>
              {setActivePage && (
                <button
                  type="button"
                  onClick={() => setActivePage('jadwal')}
                  className="text-[11px] font-bold text-indigo-400 transition hover:text-indigo-300"
                >
                  Jadwal lengkap →
                </button>
              )}
            </div>

            <ol className="space-y-2.5">
              {enrichedClasses.map((item) => (
                <ClassRow
                  key={item._key}
                  item={item}
                  isDark={isDark}
                  isNext={item._key === nextClassKey}
                />
              ))}
            </ol>
          </>
        )}

        {/* Preview hari kuliah berikutnya saat hari ini kosong */}
        {enrichedClasses.length === 0 && nextStudyDay && (
          <div
            className={`rounded-2xl border p-3.5 ${
              isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                Jadwal berikutnya
              </p>
              <span className="text-[10px] font-bold text-gray-400">
                {nextDayLabel}
                {nextStudyDay.offset === 1 ? '' : ` • ${nextStudyDay.offset} hari lagi`}
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {nextStudyDay.items.slice(0, 3).map((item) => (
                <li
                  key={item._key}
                  className="flex items-center justify-between gap-3 text-[11px]"
                >
                  <span className="min-w-0 truncate font-semibold">{item.mapel}</span>
                  <span className="shrink-0 font-mono font-bold text-indigo-400">
                    {item._range
                      ? `${item._range.startLabel}–${item._range.endLabel}`
                      : item.jam || '—'}
                  </span>
                </li>
              ))}
            </ul>
            {nextStudyDay.items.length > 3 && (
              <p className="mt-1.5 text-[10px] text-gray-500">
                +{nextStudyDay.items.length - 3} mata kuliah lainnya
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
