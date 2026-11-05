import { useState } from 'react';
import { linkPenting, initialArtikel } from '../data/dummy';
import { useTheme } from '../context/ThemeContext';

export default function Blog() {
  const { isDark } = useTheme();
  const [artikel, setArtikel] = useState(initialArtikel);
  const [selectedArtikel, setSelectedArtikel] = useState(null);
  const [showTambah, setShowTambah] = useState(false);
  const [filterTag, setFilterTag] = useState('Semua');
  const [form, setForm] = useState({ judul: '', mapel: '', penulis: '', tag: '', isi: '' });

  const allTags = ['Semua', ...new Set(artikel.flatMap(a => a.tag))];
  const filtered = filterTag === 'Semua' ? artikel : artikel.filter(a => a.tag.includes(filterTag));

  const tambahArtikel = () => {
    if (!form.judul || !form.isi) return;
    const newArtikel = {
      id: Date.now(),
      judul: form.judul,
      mapel: form.mapel || 'Umum',
      penulis: form.penulis || 'Anonim',
      tanggal: new Date().toISOString().slice(0,10),
      tag: form.tag ? form.tag.split(',').map(t => t.trim()) : ['Umum'],
      isi: form.isi,
    };
    setArtikel(prev => [newArtikel, ...prev]);
    setForm({ judul: '', mapel: '', penulis: '', tag: '', isi: '' });
    setShowTambah(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black">📝 Blog & Catatan Belajar</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pusat materi, link penting, dan rangkuman pelajaran</p>
      </div>

      {/* Link Penting */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><span>🔗</span> Link Penting Kelas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {linkPenting.map(link => (
            <a
              key={link.nama}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl
                ${isDark ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50' : 'bg-gray-50 border-gray-200 hover:border-indigo-300'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.warna} flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {link.icon}
              </div>
              <span className="text-sm font-medium leading-tight">{link.nama}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Artikel */}
      <div className={`rounded-3xl p-5 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2"><span>📖</span> Rangkuman & Catatan</h2>
          <button
            onClick={() => setShowTambah(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
          >
            <span>+</span> Tulis Catatan
          </button>
        </div>

        {/* Tag filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                ${filterTag === tag
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedArtikel(a)}
              className={`text-left p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl
                ${isDark ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:shadow-indigo-100'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{a.mapel}</span>
              </div>
              <h3 className="font-bold text-sm leading-tight mb-2">{a.judul}</h3>
              <p className="text-xs text-gray-400 line-clamp-2">{a.isi}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {a.tag.map(t => (
                  <span key={t} className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>#{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">✍️ {a.penulis}</p>
                <p className="text-xs text-gray-500">{new Date(a.tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal baca artikel */}
      {selectedArtikel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{selectedArtikel.mapel}</span>
              <button onClick={() => setSelectedArtikel(null)} className="text-gray-400 hover:text-gray-200">✕</button>
            </div>
            <h2 className="text-xl font-bold mb-2">{selectedArtikel.judul}</h2>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs text-gray-400">✍️ {selectedArtikel.penulis}</p>
              <p className="text-xs text-gray-400">📅 {new Date(selectedArtikel.tanggal).toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
            </div>
            <div className={`prose prose-sm max-w-none text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>{selectedArtikel.isi}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {selectedArtikel.tag.map(t => (
                <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>#{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Artikel */}
      {showTambah && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <h3 className="font-bold text-lg mb-4">Tulis Catatan Baru</h3>
            <div className="space-y-3">
              {[
                { key: 'judul', label: 'Judul Catatan *', placeholder: 'Rangkuman Bab 3: ...' },
                { key: 'mapel', label: 'Mata Pelajaran', placeholder: 'Matematika' },
                { key: 'penulis', label: 'Nama Penulis', placeholder: 'Nama kamu' },
                { key: 'tag', label: 'Tag (pisah dengan koma)', placeholder: 'Integral, Kalkulus, Matematika' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder={f.placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500
                      ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Isi Catatan *</label>
                <textarea
                  value={form.isi}
                  onChange={e => setForm({...form, isi: e.target.value})}
                  rows={5}
                  placeholder="Tulis rangkuman materi di sini..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none
                    ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTambah(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                >Batal</button>
                <button
                  onClick={tambahArtikel}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
                >Publikasikan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
