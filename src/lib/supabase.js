import { createClient } from '@supabase/supabase-js';
import { siswa as initialSiswa, jadwalPelajaran as dummyJadwal, initialTugas as dummyTugas } from '../data/dummy';

// Mendapatkan konfigurasi Supabase (mendukung .env dan input lewat UI Super Admin)
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('classhub_supabase_url') || '';
  const localKey = localStorage.getItem('classhub_supabase_key') || '';

  const url = (localUrl || envUrl).trim();
  const key = (localKey || envKey).trim();

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
}

let supabaseInstance = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key || !url.startsWith('http') || key.length < 20) {
    return null;
  }

  if (!supabaseInstance || lastUrl !== url || lastKey !== key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
      });
      lastUrl = url;
      lastKey = key;
    } catch (err) {
      console.warn('Gagal menginisialisasi Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

// Uji koneksi Supabase
export async function testSupabaseConnection(customUrl, customKey) {
  try {
    const url = customUrl || getSupabaseConfig().url;
    const key = customKey || getSupabaseConfig().key;
    if (!url || !key) return { success: false, error: 'URL dan Anon Key wajib diisi' };

    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await client.from('menfest').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // Jika tabel belum dibuat, koneksi tetap valid
      if (error.message && error.message.toLowerCase().includes('relation') && error.message.toLowerCase().includes('does not exist')) {
        return { 
          success: true, 
          warning: 'Terkoneksi ke Supabase! Namun tabel "menfest" belum dibuat. Harap jalankan supabase_schema.sql di SQL Editor.' 
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Gagal menghubungi server Supabase' };
  }
}

// Simpan config dari Super Admin UI
export function saveSupabaseConfig(url, key) {
  if (url) localStorage.setItem('classhub_supabase_url', url.trim());
  else localStorage.removeItem('classhub_supabase_url');

  if (key) localStorage.setItem('classhub_supabase_key', key.trim());
  else localStorage.removeItem('classhub_supabase_key');

  supabaseInstance = null;
}

// ==========================================
// MENFEST API
// ==========================================
const MENFEST_STORAGE_KEY = 'classhub_menfest_live_v2';

export async function getMenfestList() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('menfest')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Sinkronkan ke local storage sebagai backup
        localStorage.setItem(MENFEST_STORAGE_KEY, JSON.stringify(data));
        return { data, isSupabase: true };
      }
      console.warn('Supabase menfest fetch error, fallback ke local storage:', error?.message);
    } catch (e) {
      console.warn('Supabase fetch exception, fallback ke local storage:', e);
    }
  }

  // Fallback Local Storage
  const saved = localStorage.getItem(MENFEST_STORAGE_KEY);
  if (saved) {
    try {
      return { data: JSON.parse(saved), isSupabase: false };
    } catch {
      // ignore
    }
  }

  // Tidak ada seed dummy: feed Menfest hanya berisi aktivitas nyata.
  localStorage.setItem(MENFEST_STORAGE_KEY, JSON.stringify([]));
  return { data: [], isSupabase: false };
}

export async function addMenfest(item) {
  const payload = {
    to_who: item.to_who || 'Semua',
    sender: item.sender || 'Anonim',
    message: item.message,
    category: item.category || 'Curhat',
    color: item.color || 'purple',
    likes: 0,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  let inserted = null;

  if (client) {
    try {
      const { data, error } = await client
        .from('menfest')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        inserted = data;
      } else {
        console.warn('Insert Supabase gagal, simpan lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Insert Supabase exception:', err);
    }
  }

  // Simpan ke local storage
  const current = JSON.parse(localStorage.getItem(MENFEST_STORAGE_KEY) || '[]');
  const record = inserted || { ...payload, id: Date.now() };
  const updated = [record, ...current];
  localStorage.setItem(MENFEST_STORAGE_KEY, JSON.stringify(updated));

  return record;
}

export async function toggleLikeMenfest(id, currentLikes = 0) {
  const nextLikes = (currentLikes || 0) + 1;
  const client = getSupabaseClient();

  if (client) {
    try {
      await client
        .from('menfest')
        .update({ likes: nextLikes })
        .eq('id', id);
    } catch (err) {
      console.warn('Gagal update like di Supabase:', err);
    }
  }

  // Update local storage
  const current = JSON.parse(localStorage.getItem(MENFEST_STORAGE_KEY) || '[]');
  const updated = current.map(m => m.id === id ? { ...m, likes: nextLikes } : m);
  localStorage.setItem(MENFEST_STORAGE_KEY, JSON.stringify(updated));
  return nextLikes;
}

export async function deleteMenfestItem(id) {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('menfest').delete().eq('id', id);
    } catch (err) {
      console.warn('Gagal delete menfest di Supabase:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(MENFEST_STORAGE_KEY) || '[]');
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem(MENFEST_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

// ==========================================
// ANGGOTA / MAHASISWA PER PRODI API
// ==========================================
const ANGGOTA_STORAGE_KEY = 'classhub_anggota_v1';

export async function getAnggotaList() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('anggota')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(ANGGOTA_STORAGE_KEY, JSON.stringify(data));
        return { data, isSupabase: true };
      }
    } catch (e) {
      console.warn('Supabase fetch anggota exception:', e);
    }
  }

  // Fallback Local Storage
  const saved = localStorage.getItem(ANGGOTA_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Normalisasi jika ada data lama dengan prodi Teknik Informatika
      const normalized = parsed.map(a => a.prodi === 'Teknik Informatika' ? { ...a, prodi: 'Ilmu Komputer' } : a);
      return { data: normalized, isSupabase: false };
    } catch {
      // ignore
    }
  }

  // Seed default data
  localStorage.setItem(ANGGOTA_STORAGE_KEY, JSON.stringify(initialSiswa || []));
  return { data: initialSiswa || [], isSupabase: false };
}

export async function saveAnggota(item) {
  const client = getSupabaseClient();
  const id = item.id || `mhs_${Date.now()}`;
  const record = {
    id: String(id),
    name: item.name,
    nickname: item.nickname || item.name.split(' ')[0],
    prodi: item.prodi || 'Ilmu Komputer',
    birthday: item.birthday || '2005-01-01',
    quote: item.quote || 'Semangat menuntut ilmu!',
    photo: item.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name)}`,
    instagram: item.instagram || '',
    created_at: item.created_at || new Date().toISOString(),
  };

  if (client) {
    try {
      const { error } = await client.from('anggota').upsert([record]);
      if (error) console.warn('Supabase save anggota error:', error.message);
    } catch (err) {
      console.warn('Supabase save anggota exception:', err);
    }
  }

  // Simpan ke local storage
  const current = JSON.parse(localStorage.getItem(ANGGOTA_STORAGE_KEY) || '[]');
  const exists = current.some(a => String(a.id) === String(record.id));
  const updated = exists 
    ? current.map(a => String(a.id) === String(record.id) ? record : a)
    : [record, ...current];
  localStorage.setItem(ANGGOTA_STORAGE_KEY, JSON.stringify(updated));

  return record;
}

export async function deleteAnggotaItem(id) {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('anggota').delete().eq('id', String(id));
    } catch (err) {
      console.warn('Supabase delete anggota error:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(ANGGOTA_STORAGE_KEY) || '[]');
  const updated = current.filter(a => String(a.id) !== String(id));
  localStorage.setItem(ANGGOTA_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

// ==========================================
// JADWAL KULIAH API
// ==========================================
const JADWAL_STORAGE_KEY = 'classhub_jadwal_v2';

/**
 * Mengambil daftar jadwal dari Supabase (fallback ke localStorage / dummy).
 * Mengembalikan flat array (bukan objek per-hari) agar konsisten dengan skema DB.
 * Format return: { data: [...], isSupabase: boolean }
 */
export async function getJadwalList() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('jadwal')
        .select('*')
        .order('hari', { ascending: true })
        .order('jam', { ascending: true });

      if (!error && Array.isArray(data)) {
        // Simpan ke localStorage sebagai backup
        localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(data));
        return { data, isSupabase: true };
      }
      console.warn('Supabase jadwal fetch error, fallback ke local storage:', error?.message);
    } catch (e) {
      console.warn('Supabase jadwal fetch exception, fallback ke local storage:', e);
    }
  }

  // Fallback Local Storage
  const saved = localStorage.getItem(JADWAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Handle baik format flat array maupun objek per-hari (migrasi data lama)
      if (Array.isArray(parsed)) {
        return { data: parsed, isSupabase: false };
      }
      // Konversi format lama {Senin: [...], Selasa: [...]} ke flat array
      const flat = [];
      for (const [hari, list] of Object.entries(parsed)) {
        for (const item of list) {
          flat.push({ ...item, hari, id: item.id || Date.now() + Math.random() });
        }
      }
      return { data: flat, isSupabase: false };
    } catch {
      // ignore
    }
  }

  // Seed dari dummy: konversi format objek per-hari ke flat array
  const seeded = [];
  for (const [hari, list] of Object.entries(dummyJadwal)) {
    for (const item of list) {
      seeded.push({ ...item, hari, id: seeded.length + 1 });
    }
  }
  localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(seeded));
  return { data: seeded, isSupabase: false };
}

/**
 * Tambah satu jadwal kuliah baru.
 */
export async function addJadwal(item) {
  const payload = {
    hari: item.hari,
    prodi: item.prodi || 'Semua',
    jam: item.jam,
    mapel: item.mapel,
    guru: item.guru || null,
    ruangan: item.ruangan || null,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  let inserted = null;

  if (client) {
    try {
      const { data, error } = await client
        .from('jadwal')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        inserted = data;
      } else {
        console.warn('Insert jadwal Supabase gagal, simpan lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Insert jadwal Supabase exception:', err);
    }
  }

  // Simpan ke localStorage
  const current = JSON.parse(localStorage.getItem(JADWAL_STORAGE_KEY) || '[]');
  const record = inserted || { ...payload, id: Date.now() };
  const updated = [record, ...current];
  localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(updated));

  return record;
}

/**
 * Update data jadwal kuliah berdasarkan id.
 */
export async function updateJadwal(id, updates) {
  const payload = {
    ...(updates.hari !== undefined && { hari: updates.hari }),
    ...(updates.prodi !== undefined && { prodi: updates.prodi || 'Semua' }),
    ...(updates.jam !== undefined && { jam: updates.jam }),
    ...(updates.mapel !== undefined && { mapel: updates.mapel }),
    ...(updates.guru !== undefined && { guru: updates.guru || null }),
    ...(updates.ruangan !== undefined && { ruangan: updates.ruangan || null }),
  };

  const client = getSupabaseClient();
  let updatedRecord = null;

  if (client) {
    try {
      const { data, error } = await client
        .from('jadwal')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        updatedRecord = data;
      } else {
        console.warn('Update jadwal Supabase gagal, simpan lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Update jadwal Supabase exception:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(JADWAL_STORAGE_KEY) || '[]');
  const existing = current.find(j => j.id === id);
  const record = updatedRecord || (existing ? { ...existing, ...payload } : null);
  const updated = record
    ? current.map(j => j.id === id ? record : j)
    : current;
  localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(updated));

  return record;
}

/**
 * Hapus satu jadwal kuliah berdasarkan id.
 */
export async function deleteJadwalItem(id) {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('jadwal').delete().eq('id', id);
      if (error) console.warn('Gagal delete jadwal di Supabase:', error.message);
    } catch (err) {
      console.warn('Gagal delete jadwal di Supabase:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(JADWAL_STORAGE_KEY) || '[]');
  const updated = current.filter(j => j.id !== id);
  localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(updated));
  return true;
}


// ==========================================
// TUGAS API
// ==========================================
const TUGAS_STORAGE_KEY = 'classhub_tugas_v2';

/**
 * Mengambil daftar tugas dari Supabase (fallback ke localStorage / dummy).
 * Format return: { data: [...], isSupabase: boolean }
 */
export async function getTugasList() {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('tugas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        localStorage.setItem(TUGAS_STORAGE_KEY, JSON.stringify(data));
        return { data, isSupabase: true };
      }
      console.warn('Supabase tugas fetch error, fallback ke local storage:', error?.message);
    } catch (e) {
      console.warn('Supabase tugas fetch exception, fallback ke local storage:', e);
    }
  }

  // Fallback Local Storage
  const saved = localStorage.getItem(TUGAS_STORAGE_KEY) || localStorage.getItem('classhub_tugas_v1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const normalized = parsed.map(t =>
        t.prodi === 'Teknik Informatika' ? { ...t, prodi: 'Ilmu Komputer' } : t
      );
      return { data: normalized, isSupabase: false };
    } catch {
      // ignore
    }
  }

  // Seed default data
  localStorage.setItem(TUGAS_STORAGE_KEY, JSON.stringify(dummyTugas || []));
  return { data: dummyTugas || [], isSupabase: false };
}

/**
 * Tambah tugas baru.
 */
export async function addTugas(item) {
  const payload = {
    prodi: item.prodi || 'Semua',
    mapel: item.mapel,
    judul: item.judul,
    deskripsi: item.deskripsi || null,
    deadline: item.deadline,
    status: item.status || 'Belum',
    guru: item.guru || null,
    created_at: new Date().toISOString(),
  };

  const client = getSupabaseClient();
  let inserted = null;

  if (client) {
    try {
      const { data, error } = await client
        .from('tugas')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        inserted = data;
      } else {
        console.warn('Insert tugas Supabase gagal, simpan lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Insert tugas Supabase exception:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(TUGAS_STORAGE_KEY) || '[]');
  const record = inserted || { ...payload, id: Date.now() };
  const updated = [record, ...current];
  localStorage.setItem(TUGAS_STORAGE_KEY, JSON.stringify(updated));

  return record;
}

/**
 * Update data tugas berdasarkan id.
 */
export async function updateTugas(id, updates) {
  const payload = {
    ...(updates.prodi !== undefined && { prodi: updates.prodi || 'Semua' }),
    ...(updates.mapel !== undefined && { mapel: updates.mapel }),
    ...(updates.judul !== undefined && { judul: updates.judul }),
    ...(updates.deskripsi !== undefined && { deskripsi: updates.deskripsi || null }),
    ...(updates.deadline !== undefined && { deadline: updates.deadline }),
    ...(updates.status !== undefined && { status: updates.status || 'Belum' }),
    ...(updates.guru !== undefined && { guru: updates.guru || null }),
  };

  const client = getSupabaseClient();
  let updatedRecord = null;

  if (client) {
    try {
      const { data, error } = await client
        .from('tugas')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        updatedRecord = data;
      } else {
        console.warn('Update tugas Supabase gagal, simpan lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Update tugas Supabase exception:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(TUGAS_STORAGE_KEY) || '[]');
  const existing = current.find(t => t.id === id);
  const record = updatedRecord || (existing ? { ...existing, ...payload } : null);
  const updated = record
    ? current.map(t => t.id === id ? record : t)
    : current;
  localStorage.setItem(TUGAS_STORAGE_KEY, JSON.stringify(updated));

  return record;
}

/**
 * Update status tugas (Belum → Proses → Selesai → Belum).
 */
export async function updateTugasStatus(id, newStatus) {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { error } = await client
        .from('tugas')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) console.warn('Gagal update status tugas di Supabase:', error.message);
    } catch (err) {
      console.warn('Gagal update status tugas di Supabase:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(TUGAS_STORAGE_KEY) || '[]');
  const updated = current.map(t => t.id === id ? { ...t, status: newStatus } : t);
  localStorage.setItem(TUGAS_STORAGE_KEY, JSON.stringify(updated));
  return newStatus;
}

/**
 * Hapus tugas berdasarkan id.
 */
export async function deleteTugasItem(id) {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { error } = await client.from('tugas').delete().eq('id', id);
      if (error) console.warn('Gagal delete tugas di Supabase:', error.message);
    } catch (err) {
      console.warn('Gagal delete tugas di Supabase:', err);
    }
  }

  const current = JSON.parse(localStorage.getItem(TUGAS_STORAGE_KEY) || '[]');
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(TUGAS_STORAGE_KEY, JSON.stringify(updated));
  return true;
}

