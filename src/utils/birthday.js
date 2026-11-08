/**
 * Utilitas tanggal lahir bersama untuk Anggota & Beranda.
 * Semua perbandingan "hari ini" memakai timezone Asia/Jakarta (WIB)
 * dan hanya mencocokkan BULAN + TANGGAL (tahun lahir diabaikan).
 */

const WIB_TIMEZONE = 'Asia/Jakarta';

/** Ambil komponen tanggal hari ini menurut WIB. */
export function getWIBTodayParts(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: WIB_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const pick = type => parts.find(part => part.type === type)?.value;
    const year = Number(pick('year'));
    const month = Number(pick('month'));
    const day = Number(pick('day'));
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return { year, month, day };
    }
  } catch {
    // Intl/timezone tidak tersedia — jatuh ke waktu lokal perangkat.
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/** Kunci "MM-DD" untuk hari ini (WIB). */
export function getWIBTodayKey(date = new Date()) {
  const { month, day } = getWIBTodayParts(date);
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isValidMonthDay(month, day) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Validasi hari terhadap bulan (2000 = tahun kabisat agar 29 Feb valid).
  return new Date(Date.UTC(2000, month - 1, day)).getUTCDate() === day;
}

/**
 * Parse nilai `birthday` menjadi { month, day } tanpa crash.
 * Mendukung: "YYYY-MM-DD", "YYYY/MM/DD", "DD-MM-YYYY", "MM-DD",
 * serta string tanggal yang bisa dibaca Date. Mengembalikan null bila
 * kosong / tidak valid.
 */
export function parseBirthdayMonthDay(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  // YYYY-MM-DD (atau timestamp ISO yang diawali tanggal)
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return isValidMonthDay(month, day) ? { month, day } : null;
  }

  // DD-MM-YYYY / DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    return isValidMonthDay(month, day) ? { month, day } : null;
  }

  // MM-DD / MM/DD (tanpa tahun)
  const md = raw.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (md) {
    const month = Number(md[1]);
    const day = Number(md[2]);
    return isValidMonthDay(month, day) ? { month, day } : null;
  }

  // Fallback aman: biarkan Date mencoba (dibungkus try/catch).
  try {
    const parsed = new Date(raw);
    if (Number.isFinite(parsed.getTime())) {
      return { month: parsed.getMonth() + 1, day: parsed.getDate() };
    }
  } catch {
    /* format tidak dikenali */
  }

  return null;
}

/** True bila anggota berulang tahun hari ini (WIB). */
export function isBirthdayToday(value, date = new Date()) {
  const parsed = parseBirthdayMonthDay(value);
  if (!parsed) return false;
  const today = getWIBTodayParts(date);
  return parsed.month === today.month && parsed.day === today.day;
}

/** Format tanggal lahir ke teks Indonesia yang aman. */
export function formatBirthdayIndo(value) {
  const parsed = parseBirthdayMonthDay(value);
  if (!parsed) return String(value ?? '-');
  try {
    return new Date(Date.UTC(2000, parsed.month - 1, parsed.day)).toLocaleDateString(
      'id-ID',
      { day: 'numeric', month: 'long' },
    );
  } catch {
    return String(value);
  }
}
