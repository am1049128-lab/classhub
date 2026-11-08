import { useTheme } from '../context/ThemeContext';
import logoFtia from '../assets/logoftia.jpeg';

export default function Footer({ setActivePage }) {
  const { isDark } = useTheme();

  const quickLinks = [
    { id: 'beranda', label: 'Beranda', icon: '🏠' },
    { id: 'prodi', label: 'Anggota', icon: '👥' },
    { id: 'jadwal', label: 'Jadwal Kuliah', icon: '📅' },
    { id: 'tugas', label: 'Tugas', icon: '📝' },
    { id: 'menfest', label: 'Menfest', icon: '💌' },
  ];

  return (
    <footer className={`mt-16 border-t ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Kolom 1: Identitas */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoFtia}
                alt="Logo FTIA"
                className="h-12 w-12 object-cover rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              />
              <div>
                <h3 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Class Hub
                </h3>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">FTIA UMIBA</p>
              </div>
            </div>
            <div className={`text-xs leading-relaxed space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="font-semibold text-sm">Fakultas Teknologi Informasi dan Aktuaria</p>
              <p>Universitas Mitra Bangsa (UMIBA)</p>
              <p className="text-[11px] leading-relaxed">
                Portal informasi akademik terpadu untuk mahasiswa FTIA dalam mengelola jadwal kuliah, 
                tugas perkuliahan, direktori anggota, dan komunikasi kampus.
              </p>
            </div>
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div className="space-y-4">
            <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Navigasi Cepat
            </h4>
            <nav className="grid grid-cols-2 gap-3">
              {quickLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => setActivePage?.(link.id)}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors text-left p-2 rounded-lg ${
                    isDark 
                      ? 'text-gray-400 hover:text-indigo-400 hover:bg-gray-900' 
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Baris Bawah: Copyright */}
        <div className={`mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800 text-gray-500' : 'border-gray-200 text-gray-600'
        }`}>
          <p>© 2026 ClassHub FTIA UMIBA. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>💼</span>
            <span>Dikelola oleh Sivitas FTIA</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
