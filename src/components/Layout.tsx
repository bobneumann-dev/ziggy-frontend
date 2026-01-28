import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import Header from './Header';
import { 
  Users, 
  UserCircle, 
  Building2, 
  Briefcase, 
  ClipboardList, 
  Link as LinkIcon,
  LogOut,
  LayoutDashboard,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header/Topbar */}
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="flex flex-col"
          style={{
            width: isSidebarCollapsed ? '64px' : '224px',
            backgroundColor: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--border-color)',
            transition: 'width 0.2s ease'
          }}
        >
          {/* Menu Title */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              {!isSidebarCollapsed && (
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Menu Principal
                </span>
              )}
            </div>
          </div>

          {/* Navegação */}
          <nav className="flex-1 p-2 overflow-y-auto">
            <div className="space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                    style={{ 
                      backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--sidebar-text)',
                      borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                    {!isSidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Controles de tema/idioma */}
          <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-center gap-2">
              <ThemeToggle />
              {!isSidebarCollapsed && <LanguageSelector />}
            </div>
          </div>

          {/* Perfil do usuário */}
          <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: '#1a1a1a'
                }}
              >
                {usuario?.login?.charAt(0).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--sidebar-text)' }}>
                    {usuario?.login}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {usuario?.roles || 'Usuário'}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-150 text-xs"
              style={{ 
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              {!isSidebarCollapsed && <span>{t('auth.logout')}</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
