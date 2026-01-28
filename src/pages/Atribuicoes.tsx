import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Users, Eye } from 'lucide-react';
import api from '../lib/api';
import type { Atribuicao, PessoaElegivel } from '../types';

export default function Atribuicoes() {
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>([]);
  const [selectedAtribuicao, setSelectedAtribuicao] = useState<string | null>(null);
  const [elegiveis, setElegiveis] = useState<PessoaElegivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingElegiveis, setLoadingElegiveis] = useState(false);

  useEffect(() => {
    fetchAtribuicoes();
  }, []);

  const fetchAtribuicoes = async () => {
    try {
      const response = await api.get<Atribuicao[]>('/atribuicoes');
      setAtribuicoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar atribuições:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchElegiveis = async (atribuicaoId: string) => {
    setLoadingElegiveis(true);
    try {
      const response = await api.get<PessoaElegivel[]>(`/atribuicoes/${atribuicaoId}/pessoas-elegiveis`);
      setElegiveis(response.data);
      setSelectedAtribuicao(atribuicaoId);
    } catch (error) {
      console.error('Erro ao carregar pessoas elegíveis:', error);
    } finally {
      setLoadingElegiveis(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Atribuições</h1>
        <button className="glass-button flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold">
          <Plus className="w-5 h-5" />
          <span>Nova Atribuição</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 bg-white/50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Lista de Atribuições</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {atribuicoes.map((atribuicao) => (
              <div
                key={atribuicao.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedAtribuicao === atribuicao.id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => fetchElegiveis(atribuicao.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{atribuicao.nome}</h3>
                    {atribuicao.descricao && (
                      <p className="text-sm text-gray-500 mt-1">{atribuicao.descricao}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{atribuicao.quantidadeCargos} cargos</span>
                      <span>{atribuicao.quantidadePessoasExcecao} exceções</span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {atribuicao.totalPessoasElegiveis} elegíveis
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchElegiveis(atribuicao.id);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 bg-white/50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Pessoas Elegíveis</h2>
          </div>
          {loadingElegiveis ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Carregando...</div>
            </div>
          ) : selectedAtribuicao ? (
            <div className="divide-y divide-gray-200">
              {elegiveis.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma pessoa elegível para esta atribuição
                </div>
              ) : (
                elegiveis.map((pessoa) => (
                  <div key={pessoa.pessoaId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{pessoa.pessoaNome}</h3>
                        <p className="text-sm text-gray-500 mt-1">{pessoa.email}</p>
                        {pessoa.cargoNome && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">{pessoa.cargoNome}</span>
                            {pessoa.setorNome && <span> • {pessoa.setorNome}</span>}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pessoa.tipoVinculo === 'Exceção (Direta)'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {pessoa.tipoVinculo}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Selecione uma atribuição para ver as pessoas elegíveis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
