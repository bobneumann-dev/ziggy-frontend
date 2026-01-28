import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import SetorOrgChart from '../components/SetorOrgChart';
import { DataTable } from '../components/DataTable';
import type { Setor, SetorTree } from '../types';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { PagedResult, PaginationParams } from '../types/pagination';

export default function Setores() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [allSetores, setAllSetores] = useState<Setor[]>([]);
  const [tree, setTree] = useState<SetorTree | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'org'>('tree');
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 20,
    sortDesc: false,
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetorId, setEditingSetorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    setorPaiId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const nomeInputRef = useRef<HTMLInputElement | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Setor | null>(null);

  const fetchPaginatedSetores = async () => {
    setLoading(true);
    try {
      const response = await api.get<PagedResult<Setor>>('/setores/paged', {
        params: {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          sortBy: pagination.sortBy,
          sortDesc: pagination.sortDesc,
          searchTerm: pagination.searchTerm,
        },
      });
      setSetores(response.data.items);
      setPageCount(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSetores = async () => {
    try {
      const response = await api.get<Setor[]>('/setores');
      setAllSetores(response.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const fetchTree = async () => {
    try {
      const response = await api.get<SetorTree>('/setores/tree');
      setTree(response.data);
    } catch (error) {
      console.error('Erro ao carregar árvore de setores:', error);
    }
  };

  useEffect(() => {
    fetchPaginatedSetores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber, pagination.pageSize, pagination.sortBy, pagination.sortDesc, pagination.searchTerm]);

  useEffect(() => {
    fetchAllSetores();
    if (viewMode !== 'list' && !tree) {
      fetchTree();
    }
  }, [viewMode]);

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageNumber: pageIndex + 1,
      pageSize,
    }));
  }, []);

  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (!sorting.length) {
      setPagination(prev => ({ ...prev, sortBy: undefined, sortDesc: false }));
      return;
    }

    const column = sorting[0];
    setPagination(prev => ({
      ...prev,
      sortBy: column.id,
      sortDesc: column.desc,
    }));
  }, []);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setPagination(prev => ({
      ...prev,
      searchTerm,
      pageNumber: 1,
    }));
  }, []);

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleOpenModal = (setor?: Setor, parentId?: string) => {
    if (setor) {
      setEditingSetorId(setor.id);
      setFormData({
        nome: setor.nome || '',
        setorPaiId: setor.setorPaiId || '',
      });
    } else {
      setEditingSetorId(null);
      setFormData({
        nome: '',
        setorPaiId: parentId || '',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSetorId(null);
    setFormData({
      nome: '',
      setorPaiId: '',
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Informe o nome do setor.';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        nome: formData.nome,
        setorPaiId: formData.setorPaiId || null,
      };

      if (editingSetorId) {
        await api.put(`/setores/${editingSetorId}`, payload);
      } else {
        await api.post('/setores', payload);
      }

      await Promise.all([fetchPaginatedSetores(), fetchAllSetores(), fetchTree()]);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: 'Não foi possível salvar o setor.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (setor: Setor) => {
    setDeleteTarget(setor);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await api.delete(`/setores/${deleteTarget.id}`);
      await Promise.all([fetchPaginatedSetores(), fetchAllSetores(), fetchTree()]);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
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
              <span className="font-medium text-primary">{node.nome}</span>
              <span className="ml-3 text-sm text-secondary">
                {node.quantidadeCargos} cargos, {node.quantidadePessoas} pessoas
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-900" onClick={() => handleOpenModal({
                id: node.id,
                nome: node.nome,
                setorPaiId: node.setorPaiId,
                setorPaiNome: null,
                quantidadeCargos: node.quantidadeCargos,
                quantidadePessoas: node.quantidadePessoas,
                dataCriacao: ''
              })}>
                <Edit className="w-4 h-4" />
              </button>
              <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete({
                id: node.id,
                nome: node.nome,
                setorPaiId: node.setorPaiId,
                setorPaiNome: null,
                quantidadeCargos: node.quantidadeCargos,
                quantidadePessoas: node.quantidadePessoas,
                dataCriacao: ''
              })}>
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

  const columns = useMemo<ColumnDef<Setor, any>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: info => <div className="text-sm font-medium text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'setorPaiNome',
      header: 'Setor Pai',
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'quantidadeCargos',
      header: 'Cargos',
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'quantidadePessoas',
      header: 'Pessoas',
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: info => {
        const setor = info.row.original;
        return (
          <div className="text-right">
            <button className="text-indigo-600 hover:text-indigo-900 mr-3" onClick={() => handleOpenModal(setor)}>
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(setor)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ], [handleDelete, handleOpenModal]);

  const setoresPaiOptions = allSetores.filter(setor => setor.id !== editingSetorId);

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
          <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5">
            <Plus className="w-4 h-4" />
            <span>Novo Setor</span>
          </button>
        </div>
      </div>

      {viewMode === 'org' ? (
        <SetorOrgChart
          setores={allSetores}
          onAddRoot={() => handleOpenModal()}
          onAddChild={(setor) => handleOpenModal(undefined, setor.id)}
          onEdit={(setor) => handleOpenModal(setor)}
          onDelete={(setor) => handleDelete(setor)}
        />
      ) : viewMode === 'tree' ? (
        <div className="glass-card overflow-hidden py-4">
          {tree && tree.filhos.map((node) => renderTreeNode(node))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={setores}
          pageCount={pageCount}
          totalCount={totalCount}
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
          onSearchChange={handleSearchChange}
          isLoading={loading}
          isServerSide={true}
        />
      )}

      {isModalOpen && (
        <div className="glass-modal-backdrop" onClick={handleCloseModal}>
          <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingSetorId ? 'Editar Setor' : 'Novo Setor'}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label="Fechar">
                <span aria-hidden="true">x</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="glass-modal-label">
                    Nome <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    name="nome"
                    value={formData.nome}
                    onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${formErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder="Ex.: Administrativo"
                    ref={nomeInputRef}
                    required
                  />
                  {formErrors.nome && <p className="glass-modal-error">{formErrors.nome}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">Setor Pai</label>
                  <select
                    value={formData.setorPaiId}
                    onChange={e => setFormData(prev => ({ ...prev, setorPaiId: e.target.value }))}
                    className="glass-modal-input"
                  >
                    <option value="">Nenhum</option>
                    {setoresPaiOptions.map(setor => (
                      <option key={setor.id} value={setor.id}>{setor.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formErrors.geral && <p className="glass-modal-error mt-3">{formErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseModal} className="glass-modal-button-secondary">
                  Cancelar
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && deleteTarget && (
        <div className="glass-modal-backdrop" onClick={handleCloseDelete}>
          <div className="glass-modal glass-modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Confirmar exclusão
              </h2>
              <button className="glass-modal-close" onClick={handleCloseDelete} aria-label="Fechar">
                <span aria-hidden="true">x</span>
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Deseja remover {deleteTarget.nome}?
              </p>
              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseDelete} className="glass-modal-button-secondary">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmDelete} className="glass-modal-button-primary">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

