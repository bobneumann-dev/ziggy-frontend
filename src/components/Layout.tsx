import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { 
  Users, 
  UserCircle, 
  Building2, 
  Briefcase, 
  ClipboardList, 
  Link as LinkIcon,
  LogOut,
  LayoutDashboard
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('menu.dashboard') },
    { path: '/admin/usuarios', icon: Users, label: t('menu.users') },
    { path: '/admin/pessoas', icon: UserCircle, label: t('menu.people') },
    { path: '/admin/setores', icon: Building2, label: t('menu.sectors') },
    { path: '/admin/cargos', icon: Briefcase, label: t('menu.positions') },
    { path: '/admin/atribuicoes', icon: ClipboardList, label: t('menu.attributions') },
    { path: '/admin/vinculos', icon: LinkIcon, label: t('menu.links') },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-72 glass-sidebar relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <img 
              src="/logo_ziggy.png" 
              alt="ZIG MVP Logo" 
              className="h-16 w-auto"
            />
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('auth.systemTitle')}</h1>
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{t('menu.adminPanel')}</p>
          </div>
        </div>

        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-5 py-3.5 mb-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 backdrop-blur-sm shadow-lg border border-white/30'
                    : 'hover:bg-white/10 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-72 p-6 border-t border-white/10 bg-black/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-lg font-bold text-white">{usuario?.login?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{usuario?.login}</p>
              <p className="text-xs text-indigo-100">{usuario?.roles || 'Usuário'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
