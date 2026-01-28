import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCircle, Building2, Briefcase, ClipboardList } from 'lucide-react';
import api from '../lib/api';

interface Stats {
  usuarios: number;
  pessoas: number;
  setores: number;
  cargos: number;
  atribuicoes: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    usuarios: 0,
    pessoas: 0,
    setores: 0,
    cargos: 0,
    atribuicoes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usuarios, pessoas, setores, cargos, atribuicoes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/pessoas'),
          api.get('/setores'),
          api.get('/cargos'),
          api.get('/atribuicoes'),
        ]);

        setStats({
          usuarios: usuarios.data.length,
          pessoas: pessoas.data.length,
          setores: setores.data.length,
          cargos: cargos.data.length,
          atribuicoes: atribuicoes.data.length,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { icon: Users, label: t('menu.users'), value: stats.usuarios, color: '#3b82f6' },
    { icon: UserCircle, label: t('menu.people'), value: stats.pessoas, color: '#10b981' },
    { icon: Building2, label: t('menu.sectors'), value: stats.setores, color: '#8b5cf6' },
    { icon: Briefcase, label: t('menu.positions'), value: stats.cargos, color: '#f97316' },
    { icon: ClipboardList, label: t('menu.attributions'), value: stats.atribuicoes, color: '#ec4899' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Visão geral do sistema de gestão
        </p>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label} 
              className="stat-card group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="p-2.5 rounded-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Card de boas-vindas */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.welcome')}
        </h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
          {t('dashboard.description')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <Users className="w-4 h-4" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('menu.users')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.usersDescription')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <UserCircle className="w-4 h-4" style={{ color: '#10b981' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('menu.people')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.peopleDescription')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <Building2 className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('menu.sectors')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.sectorsDescription')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
              <Briefcase className="w-4 h-4" style={{ color: '#f97316' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t('menu.positions')}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('dashboard.positionsDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
