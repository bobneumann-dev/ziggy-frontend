import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-200"
      style={{
        background: theme === 'dark' 
          ? 'rgba(251, 191, 36, 0.1)' 
          : 'rgba(251, 191, 36, 0.2)',
        border: `1px solid ${theme === 'dark' ? '#4b5563' : '#fbbf24'}`
      }}
      title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" style={{ color: '#fbbf24' }} />
      ) : (
        <Moon className="w-5 h-5" style={{ color: '#f59e0b' }} />
      )}
    </button>
  );
}
