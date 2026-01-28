import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import SetorOrgChart from '../components/SetorOrgChart';
import type { Setor, SetorTree } from '../types';

export default function Setores() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [tree, setTree] = useState<SetorTree | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'org'>('org');
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSetores();
  }, []);

  const fetchSetores = async () => {
    try {
      const [listResponse, treeResponse] = await Promise.all([
        api.get<Setor[]>('/setores'),
        api.get<SetorTree>('/setores/tree'),
      ]);
      setSetores(listResponse.data);
      setTree(treeResponse.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node: SetorTree, level: number = 0) => {
    const hasChildren = node.filhos && node.filhos.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div 
          className="flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleNode(node.id)} className="mr-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}
          <div className="flex-1 flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">{node.nome}</span>
              <span className="ml-3 text-sm text-gray-500">
                {node.quantidadeCargos} cargos, {node.quantidadePessoas} pessoas
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-900">
                <Edit className="w-4 h-4" />
              </button>
              <button className="text-red-600 hover:text-red-900">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.filhos.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
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
          <h1 className="page-title">Setores</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Estrutura organizacional da empresa
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
              { mode: 'list', label: 'Lista' },
              { mode: 'tree', label: 'Árvore' }
            ].map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode as 'org' | 'list' | 'tree')}
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
            <span>Novo Setor</span>
          </button>
        </div>
      </div>

      {viewMode === 'org' ? (
        <SetorOrgChart setores={setores} />
      ) : (
        <div className="glass-card overflow-hidden">
        {viewMode === 'list' ? (
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--table-header-bg)' }}>
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Nome
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Setor Pai
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Cargos
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Pessoas
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {setores.map((setor, index) => (
                <tr 
                  key={setor.id} 
                  className="transition-colors"
                  style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'}
                >
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{setor.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{setor.setorPaiNome || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{setor.quantidadeCargos}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ borderBottom: '1px solid var(--table-border)' }}>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{setor.quantidadePessoas}</div>
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
        ) : (
          <div className="py-4">
            {tree && tree.filhos.map((node) => renderTreeNode(node))}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
