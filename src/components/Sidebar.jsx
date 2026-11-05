import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { id: 'beranda', label: 'Beranda', icon: '🏠' },
  { id: 'anggota', label: 'Anggota', icon: '👥' },
  { id: 'keuangan', label: 'Keuangan', icon: '💰' },
  { id: 'jadwal', label: 'Jadwal & Tugas', icon: '📋' },
  { id: 'blog', label: 'Blog & Materi', icon: '📝' },
  { id: 'saran', label: 'Kotak Saran', icon: '💌' },
];

export default function Sidebar({ activePage, setActivePage }) {
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`
      flex flex-col transition-all duration-300 h-screen sticky top-0
      ${collapsed ? 'w-16' : 'w-64'}
      ${isDark ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200 shadow-lg'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          CH
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Class Hub</p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>FAKULTAS TEKNOLOGI INFORMASI DAN AKTUARIA</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`ml-auto p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${activePage === item.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : ''}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <div className={`px-3 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
            ${collapsed ? 'justify-center' : ''}
          `}
          title={isDark ? 'Light Mode' : 'Dark Mode'}
        >
          <span className="text-base flex-shrink-0">{isDark ? '☀️' : '🌙'}</span>
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </aside>
  );
}
