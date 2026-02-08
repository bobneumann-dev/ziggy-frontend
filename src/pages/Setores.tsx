import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import SetorOrgChart from '../components/SetorOrgChart';
import { DataTable } from '../components/DataTable';
import type { Setor, SetorTree } from '../types';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { PagedResult, PaginationParams } from '../types/pagination';

export default function Setores() {
  const { t } = useTranslation();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [allSetores, setAllSetores] = useState<Setor[]>([]);
  const [tree, setTree] = useState<SetorTree | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'org'>('tree');
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggingSetorId, setDraggingSetorId] = useState<string | null>(null);
  const [dropTargetSetorId, setDropTargetSetorId] = useState<string | null>(null);
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
      const response = await api.get<PagedResult<Setor>>('/api/setores/paged', {
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
      const response = await api.get<Setor[]>('/api/setores');
      setAllSetores(response.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const fetchTree = async () => {
    try {
      const response = await api.get<SetorTree>('/api/setores/tree');
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
    fetchPaginatedSetores();
    if (viewMode !== 'list') {
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

  const findSetorNode = useCallback((node: SetorTree | null, id: string): SetorTree | null => {
    if (!node) return null;
    if (node.id === id) return node;
    for (const child of node.filhos || []) {
      const found = findSetorNode(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  const isSetorDescendant = useCallback((rootId: string, possibleChildId: string) => {
    const root = findSetorNode(tree, rootId);
    if (!root) return false;
    const stack = [...(root.filhos || [])];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (current.id === possibleChildId) return true;
      if (current.filhos?.length) {
        stack.push(...current.filhos);
      }
    }
    return false;
  }, [findSetorNode, tree]);

  const handleMoveSetor = async (setorId: string, setorPaiId: string) => {
    if (setorId === setorPaiId) return;
    if (isSetorDescendant(setorId, setorPaiId)) return;

    try {
      setLoading(true);
      await api.put(`/api/setores/${setorId}`, { setorPaiId });
      await Promise.all([fetchPaginatedSetores(), fetchAllSetores(), fetchTree()]);
    } catch (error) {
      console.error('Erro ao mover setor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragLeaveRow = (event: React.DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDropTargetSetorId(null);
  };

  const handleDragOverRow = (id: string, canDrop: boolean) => (event: React.DragEvent<HTMLElement>) => {
    if (!canDrop) return;
    event.preventDefault();
    if (dropTargetSetorId !== id) {
      setDropTargetSetorId(id);
    }
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
    if (!formData.nome.trim()) errors.nome = t('sectors.validation.requiredName');
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
        await api.put(`/api/setores/${editingSetorId}`, payload);
      } else {
        await api.post('/api/setores', payload);
      }

      await Promise.all([fetchPaginatedSetores(), fetchAllSetores(), fetchTree()]);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: t('sectors.validation.saveFailed')
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
      await api.delete(`/api/setores/${deleteTarget.id}`);
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
    const isDropTarget = dropTargetSetorId === node.id;
    const canDropHere = Boolean(
      draggingSetorId &&
      draggingSetorId !== node.id &&
      !isSetorDescendant(draggingSetorId, node.id)
    );

    return (
      <div key={node.id}>
        <div
          className={`atribuicao-row flex items-center py-2 px-4 cursor-pointer ${isDropTarget ? 'atribuicao-drop-target' : ''}`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          draggable
          onDragOver={handleDragOverRow(node.id, canDropHere)}
          onDragEnter={handleDragOverRow(node.id, canDropHere)}
          onDragLeave={handleDragLeaveRow}
          onDrop={(event) => {
            event.preventDefault();
            const draggedSetorId =
              event.dataTransfer.getData('application/x-ziggy-setor') ||
              event.dataTransfer.getData('text/plain');
            if (draggedSetorId && canDropHere) {
              handleMoveSetor(draggedSetorId, node.id);
            }
            setDropTargetSetorId(null);
          }}
          onDragStart={(event) => {
            event.dataTransfer.setData('application/x-ziggy-setor', node.id);
            event.dataTransfer.setData('text/plain', node.id);
            event.dataTransfer.effectAllowed = 'move';
            setDraggingSetorId(node.id);
            const preview = document.createElement('div');
            preview.className = 'atribuicao-drag-preview';
            preview.textContent = node.nome;
            document.body.appendChild(preview);
            event.dataTransfer.setDragImage(preview, 12, 12);
            setTimeout(() => {
              if (preview.parentNode) preview.parentNode.removeChild(preview);
            }, 0);
          }}
          onDragEnd={() => {
            setDraggingSetorId(null);
            setDropTargetSetorId(null);
          }}
          onClick={() => hasChildren ? toggleNode(node.id) : null}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-2"
            >
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
                {t('sectors.treeCounts', { cargos: node.quantidadeCargos, pessoas: node.quantidadePessoas })}
              </span>
            </div>
            <div className="action-button-group">
              <button
                className="action-button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenModal(undefined, node.id);
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button className="action-button" onClick={() => handleOpenModal({
                id: node.id,
                nome: node.nome,
                setorPaiId: node.setorPaiId,
                setorPaiNome: undefined,
                quantidadeCargos: node.quantidadeCargos,
                quantidadePessoas: node.quantidadePessoas,
                dataCriacao: ''
              })}>
                <Edit className="w-4 h-4" />
              </button>
              <button className="action-button" onClick={() => handleDelete({
                id: node.id,
                nome: node.nome,
                setorPaiId: node.setorPaiId,
                setorPaiNome: undefined,
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
      header: t('sectors.name'),
      cell: info => <div className="text-sm font-medium text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'setorPaiNome',
      header: t('sectors.parentSector'),
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'quantidadeCargos',
      header: t('sectors.positions'),
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'quantidadePessoas',
      header: t('sectors.people'),
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: info => {
        const setor = info.row.original;
        return (
          <div className="text-right">
            <div className="action-button-group inline-flex">
              <button className="action-button" onClick={() => handleOpenModal(setor)}>
                <Edit className="w-4 h-4" />
              </button>
              <button className="action-button" onClick={() => handleDelete(setor)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }
    }
  ], [handleDelete, handleOpenModal, t]);

  const setoresPaiOptions = allSetores.filter(setor => setor.id !== editingSetorId);

  const setorPaiSelectOptions = useMemo<SearchSelectOption[]>(
    () => setoresPaiOptions.map(setor => ({ value: setor.id, label: setor.nome })),
    [setoresPaiOptions]
  );

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">{t('sectors.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('sectors.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex rounded-lg p-1"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {[
              { mode: 'org', label: t('sectors.viewOrg') },
              { mode: 'list', label: t('sectors.viewList') },
              { mode: 'tree', label: t('sectors.viewTree') }
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
            <span>{t('sectors.newSector')}</span>
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
                {editingSetorId ? t('sectors.editSector') : t('sectors.newSector')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label={t('common.close')}>
                <span aria-hidden="true">x</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="glass-modal-label">
                    {t('sectors.name')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    name="nome"
                    value={formData.nome}
                    onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${formErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('sectors.placeholders.name')}
                    ref={nomeInputRef}
                    required
                  />
                  {formErrors.nome && <p className="glass-modal-error">{formErrors.nome}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">{t('sectors.parentSector')}</label>
                  <SearchSelect
                    options={setorPaiSelectOptions}
                    value={setorPaiSelectOptions.find(option => option.value === formData.setorPaiId) ?? null}
                    onChange={(option) => setFormData(prev => ({ ...prev, setorPaiId: option ? String(option.value) : '' }))}
                    placeholder={t('common.none')}
                  />
                </div>
              </div>

              {formErrors.geral && <p className="glass-modal-error mt-3">{formErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseModal} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  {t('common.save')}
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
                {t('common.confirmDelete')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseDelete} aria-label={t('common.close')}>
                <span aria-hidden="true">x</span>
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('sectors.deleteConfirm', { name: deleteTarget.nome })}
              </p>
              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseDelete} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={handleConfirmDelete} className="glass-modal-button-primary">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
