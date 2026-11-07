import { createClient } from '@supabase/supabase-js';
import { siswa as initialSiswa, jadwalPelajaran as dummyJadwal, initialTugas as dummyTugas } from '../data/dummy';
import { safeGet, safeSet, safeRemove } from '../utils/storage';

// Mendapatkan konfigurasi Supabase (mendukung .env dan input lewat UI Super Admin)
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = safeGet('classhub_supabase_url', '') || '';
  const localKey = safeGet('classhub_supabase_key', '') || '';

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
      supabaseInstance = createClient(url, key);
      lastUrl = url;
      lastKey = key;
    } catch (err) {
      console.warn('Gagal menginisialisasi Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

function unavailableAuthError() {
  return { message: 'Supabase belum dikonfigurasi atau tidak dapat dihubungi.' };
}

// Autentikasi admin selalu dikembalikan sebagai hasil Supabase agar kegagalan
// konfigurasi maupun jaringan dapat ditampilkan oleh UI tanpa exception tak tertangani.
export async function signInAdmin(email, password) {
  const client = getSupabaseClient();
  if (!client) return { data: null, error: unavailableAuthError() };

  try {
    return await client.auth.signInWithPassword({ email, password });
  } catch (error) {
    console.warn('Gagal masuk ke Supabase Auth:', error);
    return { data: null, error: error instanceof Error ? error : unavailableAuthError() };
  }
}

export async function signOutAdmin() {
  const client = getSupabaseClient();
  if (!client) return { error: unavailableAuthError() };

  try {
    return await client.auth.signOut();
  } catch (error) {
    console.warn('Gagal keluar dari Supabase Auth:', error);
    return { error: error instanceof Error ? error : unavailableAuthError() };
  }
}

export async function getAdminSession() {
  const client = getSupabaseClient();
  if (!client) return { data: { session: null }, error: unavailableAuthError() };

  try {
    return await client.auth.getSession();
  } catch (error) {
    console.warn('Gagal mengambil sesi Supabase Auth:', error);
    return { data: { session: null }, error: error instanceof Error ? error : unavailableAuthError() };
  }
}

export function onAuthStateChange(callback) {
  const client = getSupabaseClient();
  if (!client) return { data: { subscription: null }, error: unavailableAuthError() };

  try {
    return client.auth.onAuthStateChange(callback);
  } catch (error) {
    console.warn('Gagal memasang listener Supabase Auth:', error);
    return { data: { subscription: null }, error: error instanceof Error ? error : unavailableAuthError() };
  }
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
  if (url) safeSet('classhub_supabase_url', url.trim());
  else safeRemove('classhub_supabase_url');

  if (key) safeSet('classhub_supabase_key', key.trim());
  else safeRemove('classhub_supabase_key');

  supabaseInstance = null;
}

// ==========================================
// MENFEST API
// ==========================================
const MENFEST_STORAGE_KEY = 'classhub_menfest_live_v2';

export async function getMenfestList() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const isFresh = item => item?.created_at && item.created_at >= sevenDaysAgo;
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('menfest')
        .select('*')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Balasan disimpan sebagai overlay lokal agar aplikasi tetap kompatibel
        // dengan schema lama yang belum memiliki kolom `replies`.
        const saved = safeGet(MENFEST_STORAGE_KEY, []);
        const localSaved = Array.isArray(saved) ? saved : [];
        const merged = data
          .filter(isFresh)
          .map(item => {
            const localItem = localSaved.find(savedItem => String(savedItem.id) === String(item.id));
            return { ...item, replies: Array.isArray(item.replies) ? item.replies : (Array.isArray(localItem?.replies) ? localItem.replies : []) };
          });
        safeSet(MENFEST_STORAGE_KEY, merged);

        // Cleanup cloud lama bersifat best-effort; RLS atau kegagalan jaringan
        // tidak boleh menghalangi feed yang sudah berhasil dimuat.
        try {
          const { error: cleanupError } = await client
            .from('menfest')
            .delete()
            .lt('created_at', sevenDaysAgo);
          if (cleanupError) console.warn('Menfest cleanup dilewati:', cleanupError.message);
        } catch (cleanupException) {
          console.warn('Menfest cleanup exception, feed tetap digunakan:', cleanupException);
        }
        return { data: merged, isSupabase: true };
      }
      console.warn('Supabase menfest fetch error, fallback ke local storage:', error?.message);
    } catch (e) {
      console.warn('Supabase fetch exception, fallback ke local storage:', e);
    }
  }

  const saved = safeGet(MENFEST_STORAGE_KEY, []);
  const fresh = Array.isArray(saved) ? saved.filter(isFresh) : [];
  safeSet(MENFEST_STORAGE_KEY, fresh);
  return { data: fresh, isSupabase: false };
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

  const saved = safeGet(MENFEST_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const record = inserted || { ...payload, id: Date.now() };
  safeSet(MENFEST_STORAGE_KEY, [record, ...current]);

  return record;
}

export async function addMenfestReply(id, reply) {
  const normalizedReply = {
    id: reply.id || `reply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sender: reply.sender?.trim() || 'Anonim 🎭',
    text: reply.text?.trim() || '',
    created_at: reply.created_at || new Date().toISOString(),
  };

  if (!normalizedReply.text) throw new Error('Balasan tidak boleh kosong');

  const saved = safeGet(MENFEST_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = current.map(item => item.id === id ? { ...item, replies: [...(Array.isArray(item.replies) ? item.replies : []), normalizedReply] } : item);
  safeSet(MENFEST_STORAGE_KEY, updated);

  // Balasan memakai overlay localStorage sehingga schema Supabase lama
  // tetap kompatibel tanpa mengirim kolom baru yang belum tersedia.
  return normalizedReply;
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
  const saved = safeGet(MENFEST_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = current.map(m => String(m.id) === String(id) ? { ...m, likes: nextLikes } : m);
  safeSet(MENFEST_STORAGE_KEY, updated);
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

  const saved = safeGet(MENFEST_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  safeSet(MENFEST_STORAGE_KEY, current.filter(m => String(m.id) !== String(id)));
  window.dispatchEvent(new Event('classhub:menfest-updated'));
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
        const normalized = data.map(item => ({
          ...item,
          nim: item.nim || '-'
        }));
        safeSet(ANGGOTA_STORAGE_KEY, normalized);
        return { data: normalized, isSupabase: true };
      }
    } catch (e) {
      console.warn('Supabase fetch anggota exception:', e);
    }
  }

  const saved = safeGet(ANGGOTA_STORAGE_KEY, []);
  if (Array.isArray(saved) && saved.length > 0) {
    const normalized = saved.map(item => ({
      ...item,
      nim: item.nim || '-'
    }));
    return { data: normalized, isSupabase: false };
  }
  const seeded = Array.isArray(initialSiswa) ? initialSiswa.map(item => ({
    ...item,
    nim: item.nim || '-'
  })) : [];
  safeSet(ANGGOTA_STORAGE_KEY, seeded);
  return { data: seeded, isSupabase: false };
}

export async function saveAnggota(item) {
  const client = getSupabaseClient();
  const id = item.id || `mhs_${Date.now()}`;
  const record = {
    id: String(id),
    name: item.name,
    nickname: item.nickname || item.name.split(' ')[0],
    prodi: item.prodi || 'Ilmu Komputer',
    nim: item.nim || '-',
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

  const saved = safeGet(ANGGOTA_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = [record, ...current.filter(existing => String(existing.id) !== String(record.id))];
  safeSet(ANGGOTA_STORAGE_KEY, updated);

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

  const saved = safeGet(ANGGOTA_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = current.filter(item => item.id !== id);
  safeSet(ANGGOTA_STORAGE_KEY, updated);
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
        safeSet(JADWAL_STORAGE_KEY, data);
        return { data, isSupabase: true };
      }
      console.warn('Supabase jadwal fetch error, fallback ke local storage:', error?.message);
    } catch (e) {
      console.warn('Supabase jadwal fetch exception, fallback ke local storage:', e);
    }
  }

  // Fallback Local Storage
  const saved = safeGet(JADWAL_STORAGE_KEY, null);
  if (saved) {
    try {
      const parsed = saved;
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
  safeSet(JADWAL_STORAGE_KEY, seeded);
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

  const saved = safeGet(JADWAL_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const record = inserted || { ...payload, id: Date.now() };
  const updated = [record, ...current];
  safeSet(JADWAL_STORAGE_KEY, updated);

  return record;
}

/**
 * Menambah beberapa jadwal sekaligus dan menyelaraskannya dengan cache lokal.
 */
export async function addJadwalBatch(items) {
  const payloads = items.map((item) => ({
    hari: item.hari,
    prodi: item.prodi || 'Semua',
    jam: item.jam,
    mapel: item.mapel,
    guru: item.guru || null,
    ruangan: item.ruangan || null,
    created_at: new Date().toISOString(),
  }));
  const client = getSupabaseClient();
  let inserted = null;

  if (client) {
    try {
      const { data, error } = await client.from('jadwal').insert(payloads).select();
      if (!error && Array.isArray(data)) {
        inserted = data;
      } else {
        console.warn('Insert batch jadwal Supabase gagal, simpan lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Insert batch jadwal Supabase exception:', err);
    }
  }

  const saved = safeGet(JADWAL_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const records = inserted || payloads.map((payload, index) => ({
    ...payload,
    id: Date.now() + index,
  }));
  safeSet(JADWAL_STORAGE_KEY, [...records, ...current]);
  return records;
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

  const saved = safeGet(JADWAL_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const existing = current.find(j => j.id === id);
  const record = updatedRecord || (existing ? { ...existing, ...payload } : null);
  const updated = record ? current.map(j => j.id === id ? record : j) : current;
  safeSet(JADWAL_STORAGE_KEY, updated);

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

  const saved = safeGet(JADWAL_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = current.filter(j => j.id !== id);
  safeSet(JADWAL_STORAGE_KEY, updated);
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
        safeSet(TUGAS_STORAGE_KEY, data);
        return { data, isSupabase: true };
      }
      console.warn('Supabase tugas fetch error, fallback ke local storage:', error?.message);
    } catch (e) {
      console.warn('Supabase tugas fetch exception, fallback ke local storage:', e);
    }
  }

  // Fallback Local Storage
  const savedV2 = safeGet(TUGAS_STORAGE_KEY, null);
  const savedV1 = safeGet('classhub_tugas_v1', null);
  const parsed = Array.isArray(savedV2) ? savedV2 : savedV1;
  if (Array.isArray(parsed)) {
    const normalized = parsed.map(t => t.prodi === 'Teknik Informatika' ? { ...t, prodi: 'Ilmu Komputer' } : t);
    return { data: normalized, isSupabase: false };
  }
  const seeded = Array.isArray(dummyTugas) ? dummyTugas : [];
  safeSet(TUGAS_STORAGE_KEY, seeded);
  return { data: seeded, isSupabase: false };
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

  const saved = safeGet(TUGAS_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const record = inserted || { ...payload, id: Date.now() };
  const updated = [record, ...current];
  safeSet(TUGAS_STORAGE_KEY, updated);

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

  const saved = safeGet(TUGAS_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const existing = current.find(t => t.id === id);
  const record = updatedRecord || (existing ? { ...existing, ...payload } : null);
  const updated = record ? current.map(t => t.id === id ? record : t) : current;
  safeSet(TUGAS_STORAGE_KEY, updated);

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

  const saved = safeGet(TUGAS_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = current.map(t => t.id === id ? { ...t, status: newStatus } : t);
  safeSet(TUGAS_STORAGE_KEY, updated);
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

  const saved = safeGet(TUGAS_STORAGE_KEY, []);
  const current = Array.isArray(saved) ? saved : [];
  const updated = current.filter(t => t.id !== id);
  safeSet(TUGAS_STORAGE_KEY, updated);
  return true;
}

