import { useAuth } from '../contexts/AuthContext';
import { Bell, HelpCircle, Settings, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const { usuario } = useAuth();

  return (
    <header className="header">
      {/* Sidebar Column */}
      <div className="header-left">
        <Link to="/admin" className="header-logo">
          <div className="header-logo-icon">
            <img src="/logo_ziggy.png" alt="Ziggy" className="h-9 w-auto" />
          </div>
          {!isSidebarCollapsed && <span className="header-logo-text">Ziggy</span>}
        </Link>
        <button
          className="header-collapse-btn"
          onClick={onToggleSidebar}
          aria-label="Alternar menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="header-right">
        <button className="header-icon-btn">
          <Bell className="w-5 h-5" />
        </button>
        <button className="header-icon-btn">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="header-icon-btn">
          <Settings className="w-5 h-5" />
        </button>
        
        {/* User Avatar */}
        <div className="header-avatar">
          <span>{usuario?.login?.charAt(0).toUpperCase() || 'U'}</span>
        </div>
      </div>
    </header>
  );
}
