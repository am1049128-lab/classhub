import { createClient } from '@supabase/supabase-js';
import { siswa as initialSiswa, initialMenfest as dummyMenfest } from '../data/dummy';

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
const MENFEST_STORAGE_KEY = 'classhub_menfest_v1';

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

  // Seed default data
  localStorage.setItem(MENFEST_STORAGE_KEY, JSON.stringify(dummyMenfest || []));
  return { data: dummyMenfest || [], isSupabase: false };
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

