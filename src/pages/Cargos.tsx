import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../lib/api';
import CargoOrgChart from '../components/CargoOrgChart';
import type { Cargo } from '../types';

export default function Cargos() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'org'>('org');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCargos();
  }, []);

  const fetchCargos = async () => {
    try {
      const response = await api.get<Cargo[]>('/cargos');
      setCargos(response.data);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Cargos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Estrutura de cargos e funções
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tabs de visualização */}
          <div 
            className="flex rounded-lg p-1" 
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {[
              { mode: 'org', label: 'Organograma' },
              { mode: 'list', label: 'Lista' }
            ].map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode as 'org' | 'list')}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === tab.mode ? 'var(--card-bg)' : 'transparent',
                  color: viewMode === tab.mode ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: viewMode === tab.mode ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className="glass-button flex items-center gap-2 px-4 py-2.5">
            <Plus className="w-4 h-4" />
            <span>Novo Cargo</span>
          </button>
        </div>
      </div>

      {viewMode === 'org' ? (
        <CargoOrgChart cargos={cargos} />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--table-header-bg)' }}>
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Nome
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Setor
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Cargo Pai
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Pessoas
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Atribuições
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {cargos.map((cargo, index) => (
                <tr 
                  key={cargo.id} 
                  className="transition-colors"
                  style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'}
                >
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cargo.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cargo.setorNome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{cargo.cargoPaiNome || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{cargo.quantidadePessoas}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{cargo.quantidadeAtribuicoes}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <button className="p-1.5 rounded-md transition-colors mr-1" style={{ color: 'var(--accent-primary)' }}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#ef4444' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
