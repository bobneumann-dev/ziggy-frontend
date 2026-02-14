import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

import ThemeToggle from './ThemeToggle';
import Header from './Header';
import HexagonBackground from './HexagonBackground';
import {
  Users,
  UserCircle,
  Building2,
  Briefcase,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Package,
  FolderTree,
  Warehouse,
  BarChart3,
  ArrowLeftRight,
  Tag,
  TrendingUp,
  FileText,
  FileCode,
  Coins,
  DollarSign,
  Wrench,
  Globe,
  MapPin
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

  // New Menu Structure Definition
  type MenuItem = {
    path?: string;
    icon?: any;
    label: string;
    menuKey?: string;
    children?: MenuItem[];
    isOpen?: boolean;
    onToggle?: () => void;
  };

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'financeiro': false,
    'estoque': false,
    'cadastros': false,
    'estoque-armazens': false,
    'comercial': false,
    'empresa': false,
    'cadastros-geo': false,
    'itens-servicos': false
  });

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SidebarItem = ({ item, depth = 0 }: { item: MenuItem; depth?: number }) => {
    const isActive = item.path ? location.pathname === item.path : false;
    const hasChildren = item.children && item.children.length > 0;
    const menuKey = item.menuKey || item.label.toLowerCase().replace(/\s/g, '-');
    const isOpen = menuKey && openMenus[menuKey];
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <>
          <div
            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 select-none ${depth > 0 ? 'mt-1' : ''}`}
            style={{
              paddingLeft: `${(depth * 12) + 12}px`,
              color: 'var(--sidebar-text)',
              opacity: isSidebarCollapsed && depth > 0 ? 0 : 1
            }}
            onClick={() => !isSidebarCollapsed && toggleMenu(menuKey)}
            title={isSidebarCollapsed ? item.label : undefined}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {Icon && <Icon className="w-4 h-4 min-w-[16px]" style={{ color: 'var(--text-muted)' }} />}
              {!isSidebarCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </div>
            {!isSidebarCollapsed && (isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </div>
          <div style={{ display: isOpen && !isSidebarCollapsed ? 'block' : 'none', overflow: 'hidden' }}>
            {item.children?.map((child, index) => (
              <SidebarItem key={index} item={child} depth={depth + 1} />
            ))}
          </div>
        </>
      );
    }

    return (
      <Link
        to={item.path!}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative"
        style={{
          paddingLeft: `${(depth * 12) + 12}px`,
          backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--sidebar-text)',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
        title={isSidebarCollapsed ? item.label : undefined}
      >
        {isActive && (
          <span
            style={{
              position: 'absolute',
              left: '4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '16px',
              borderRadius: '9999px',
              background: 'var(--accent-primary)',
            }}
          />
        )}
        {Icon && <Icon className="w-4 h-4 min-w-[16px]" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />}
        {!isSidebarCollapsed && <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>}
      </Link>
    );
  };

  const menuStructure: MenuItem[] = [
    {
      label: t('menu.company'),
      menuKey: 'empresa',
      icon: Building2,
      children: [
        { path: '/admin', icon: LayoutDashboard, label: t('menu.dashboard') },
        { path: '/admin/empresa/dados', icon: Building2, label: t('menu.companyData') },
        { path: '/admin/usuarios', icon: Users, label: t('menu.users') },
        { path: '/admin/pessoas', icon: UserCircle, label: t('menu.people') },
        { path: '/admin/setores', icon: Building2, label: t('menu.sectors') },
        { path: '/admin/cargos', icon: Briefcase, label: t('menu.positions') },
        { path: '/admin/atribuicoes', icon: ClipboardList, label: t('menu.attributions') },
      ]
    },
    {
      label: t('menu.financial'),
      menuKey: 'financeiro',
      icon: DollarSign,
      children: [
        { path: '/admin/catalogo/moedas', icon: Coins, label: t('menu.currencies') },
        { path: '/admin/catalogo/cotacoes', icon: DollarSign, label: t('menu.exchangeRates') },
      ]
    },
    {
      label: t('menu.stockAndAssets'),
      menuKey: 'estoque',
      icon: Package,
      children: [
        {
          label: t('menu.registrations'),
          menuKey: 'cadastros',
          icon: FolderTree,
          children: [
            {
              label: t('menu.itemsServices'),
              menuKey: 'itens-servicos',
              icon: Package,
              children: [
                { path: '/admin/catalogo/categorias', icon: FolderTree, label: t('menu.catalogCategories') },
                { path: '/admin/catalogo/produtos', icon: Package, label: t('menu.products') },
                { path: '/admin/catalogo/servicos', icon: Wrench, label: t('menu.services') },
                { path: '/admin/patrimonio/itens', icon: Tag, label: t('menu.assetTypes') },
              ]
            },
            {
              label: t('menu.warehouses'),
              menuKey: 'estoque-armazens',
              icon: Warehouse,
              children: [
                { path: '/admin/estoque/categorias-armazem', icon: FolderTree, label: t('menu.warehouseCategories') },
                { path: '/admin/estoque/armazens', icon: Warehouse, label: t('menu.warehouses') },
              ]
            }
          ]
        },
        { path: '/admin/estoque/saldos', icon: BarChart3, label: t('menu.stockBalances') },
        { path: '/admin/estoque/movimentos', icon: ArrowLeftRight, label: t('menu.stockMovements') },
        { path: '/admin/patrimonio/ativos', icon: Tag, label: t('menu.assetsManagement') },
      ]
    },
    {
      label: t('menu.registrations'),
      menuKey: 'cadastros-geo',
      icon: Globe,
      children: [
        { path: '/admin/cadastros/paises', icon: Globe, label: t('menu.countries') },
        { path: '/admin/cadastros/departamentos', icon: MapPin, label: t('menu.departments') },
        { path: '/admin/cadastros/cidades', icon: MapPin, label: t('menu.cities') },
      ]
    },
    {
      label: t('menu.commercial'),
      menuKey: 'comercial',
      icon: TrendingUp,
      children: [
        { path: '/admin/comercial/clientes', icon: Users, label: t('menu.clients') },
        { path: '/admin/comercial/oportunidades', icon: TrendingUp, label: t('menu.opportunities') },
        { path: '/admin/comercial/propostas', icon: ClipboardList, label: t('menu.proposals') },
        { path: '/admin/comercial/contratos', icon: FileText, label: t('menu.contracts') },
        { path: '/admin/comercial/modelos-contrato', icon: FileCode, label: t('menu.contractTemplates') },
      ]
    }
  ];


  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <HexagonBackground />
      {/* Header/Topbar */}
      <div className="relative z-20">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
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
          <nav className="flex-1 overflow-y-auto py-2">
            {menuStructure.map((section, index) => (
              <div key={index} className="mb-1">
                {/* Top Level Section Header */}
                <div
                  className="px-4 py-3 cursor-pointer select-none flex items-center justify-between"
                  onClick={() => !isSidebarCollapsed && toggleMenu(section.menuKey || section.label.toLowerCase().replace(/\s/g, '-'))}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2">
                    {section.icon && <section.icon className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
                    {!isSidebarCollapsed && (
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{section.label}</span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    openMenus[section.menuKey || section.label.toLowerCase().replace(/\s/g, '-')]
                      ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                {/* Children */}
                <div style={{
                  display: (openMenus[section.menuKey || section.label.toLowerCase().replace(/\s/g, '-')] || isSidebarCollapsed) ? 'block' : 'none',
                  padding: '0.5rem'
                }}>
                  {section.children?.map((child, cIndex) => (
                    <SidebarItem key={cIndex} item={child} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Controles de tema/idioma */}
          <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-center gap-2">
              <ThemeToggle />
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
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
