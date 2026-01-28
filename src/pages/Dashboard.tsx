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
    { icon: Users, label: t('menu.users'), value: stats.usuarios, color: 'bg-blue-500' },
    { icon: UserCircle, label: t('menu.people'), value: stats.pessoas, color: 'bg-green-500' },
    { icon: Building2, label: t('menu.sectors'), value: stats.setores, color: 'bg-purple-500' },
    { icon: Briefcase, label: t('menu.positions'), value: stats.cargos, color: 'bg-orange-500' },
    { icon: ClipboardList, label: t('menu.attributions'), value: stats.atribuicoes, color: 'bg-pink-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8" style={{
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {t('dashboard.title')}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-6 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-xl shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {card.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 glass-card p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('dashboard.welcome')}</h2>
        <p className="text-gray-700 mb-6 leading-relaxed">
          {t('dashboard.description')}
        </p>
        <div className="space-y-3 text-sm text-gray-700">
          <p className="flex items-start">
            <span className="text-indigo-600 font-bold mr-2">•</span>
            <span><strong className="text-gray-800">{t('menu.users')}:</strong> {t('dashboard.usersDescription')}</span>
          </p>
          <p className="flex items-start">
            <span className="text-purple-600 font-bold mr-2">•</span>
            <span><strong className="text-gray-800">{t('menu.people')}:</strong> {t('dashboard.peopleDescription')}</span>
          </p>
          <p className="flex items-start">
            <span className="text-pink-600 font-bold mr-2">•</span>
            <span><strong className="text-gray-800">{t('menu.sectors')}:</strong> {t('dashboard.sectorsDescription')}</span>
          </p>
          <p className="flex items-start">
            <span className="text-indigo-600 font-bold mr-2">•</span>
            <span><strong className="text-gray-800">{t('menu.positions')}:</strong> {t('dashboard.positionsDescription')}</span>
          </p>
          <p className="flex items-start">
            <span className="text-purple-600 font-bold mr-2">•</span>
            <span><strong className="text-gray-800">{t('menu.attributions')}:</strong> {t('dashboard.attributionsDescription')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
