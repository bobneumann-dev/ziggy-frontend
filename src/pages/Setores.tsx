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
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold" style={{
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>Setores</h1>
        <div className="flex space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('org')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'org'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Organograma
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Árvore
            </button>
          </div>
          <button className="glass-button flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold">
            <Plus className="w-5 h-5" />
            <span>Novo Setor</span>
          </button>
        </div>
      </div>

      {viewMode === 'org' ? (
        <SetorOrgChart setores={setores} />
      ) : (
        <div className="glass-card overflow-hidden">
        {viewMode === 'list' ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Setor Pai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pessoas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {setores.map((setor) => (
                <tr key={setor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{setor.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{setor.setorPaiNome || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{setor.quantidadeCargos}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{setor.quantidadePessoas}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
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
