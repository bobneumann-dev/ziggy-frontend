import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import CargoOrgChart from '../components/CargoOrgChart';
import { DataTable } from '../components/DataTable';
import type { Cargo, Setor, Pessoa, PessoaSetorCargo } from '../types';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { PagedResult, PaginationParams } from '../types/pagination';

export default function Cargos() {
  const { t } = useTranslation();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [allCargos, setAllCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [vinculos, setVinculos] = useState<PessoaSetorCargo[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'org' | 'tree'>('tree');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 20,
    sortDesc: false,
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draggingCargoId, setDraggingCargoId] = useState<string | null>(null);
  const [draggingCargoSetorId, setDraggingCargoSetorId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    setorId: '',
    cargoPaiId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const nomeInputRef = useRef<HTMLInputElement | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cargo | null>(null);
  const [expandedSetores, setExpandedSetores] = useState<Set<string>>(new Set());
  const [expandedCargos, setExpandedCargos] = useState<Set<string>>(new Set());

  const fetchPaginatedCargos = async () => {
    setLoading(true);
    try {
      const response = await api.get<PagedResult<Cargo>>('/cargos/paged', {
        params: {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          sortBy: pagination.sortBy,
          sortDesc: pagination.sortDesc,
          searchTerm: pagination.searchTerm,
        },
      });
      setCargos(response.data.items);
      setPageCount(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCargos = async () => {
    try {
      const response = await api.get<Cargo[]>('/cargos');
      setAllCargos(response.data);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    }
  };

  const fetchSetores = async () => {
    try {
      const response = await api.get<Setor[]>('/setores');
      setSetores(response.data);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    }
  };

  const fetchPessoasEVinculos = async () => {
    try {
      const [pessoasResponse, vinculosResponse] = await Promise.all([
        api.get<Pessoa[]>('/pessoas'),
        api.get<PessoaSetorCargo[]>('/pessoasetorcargo'),
      ]);
      setPessoas(pessoasResponse.data);
      setVinculos(vinculosResponse.data.filter(v => v.ativo));
    } catch (error) {
      console.error('Erro ao carregar pessoas e vínculos:', error);
    }
  };

  useEffect(() => {
    fetchPaginatedCargos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber, pagination.pageSize, pagination.sortBy, pagination.sortDesc, pagination.searchTerm]);

  useEffect(() => {
    fetchAllCargos();
    fetchSetores();
    fetchPessoasEVinculos();
  }, []);

  useEffect(() => {
    if (viewMode !== 'org') {
      setSelectedSetorId('');
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

  const handleOpenModal = (cargo?: Cargo, presetSetorId?: string, presetCargoPaiId?: string) => {
    if (cargo) {
      setEditingCargoId(cargo.id);
      setFormData({
        nome: cargo.nome || '',
        setorId: cargo.setorId || '',
        cargoPaiId: cargo.cargoPaiId || '',
      });
    } else {
      setEditingCargoId(null);
      setFormData({
        nome: '',
        setorId: presetSetorId || '',
        cargoPaiId: presetCargoPaiId || '',
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
    setEditingCargoId(null);
    setFormData({
      nome: '',
      setorId: '',
      cargoPaiId: '',
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = t('positions.validation.requiredName');
    if (!formData.setorId) errors.setorId = t('positions.validation.requiredSector');
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        nome: formData.nome,
        setorId: formData.setorId,
        cargoPaiId: formData.cargoPaiId || null,
      };

      if (editingCargoId) {
        await api.put(`/cargos/${editingCargoId}`, payload);
      } else {
        await api.post('/cargos', payload);
      }

      await Promise.all([fetchPaginatedCargos(), fetchAllCargos(), fetchPessoasEVinculos()]);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar cargo:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: t('positions.validation.saveFailed')
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (cargo: Cargo) => {
    setDeleteTarget(cargo);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await api.delete(`/cargos/${deleteTarget.id}`);
      await Promise.all([fetchPaginatedCargos(), fetchAllCargos(), fetchPessoasEVinculos()]);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erro ao deletar cargo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleSetorChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      setorId: value,
      cargoPaiId: '',
    }));
    if (formErrors.setorId) {
      setFormErrors(prev => ({ ...prev, setorId: '' }));
    }
  };

  const toggleSetor = (id: string) => {
    setExpandedSetores(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCargo = (id: string) => {
    setExpandedCargos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isCargoDescendant = useCallback((rootId: string, possibleChildId: string) => {
    const childrenMap = new Map<string, string[]>();
    allCargos.forEach(cargo => {
      if (!cargo.cargoPaiId) return;
      const list = childrenMap.get(cargo.cargoPaiId) || [];
      list.push(cargo.id);
      childrenMap.set(cargo.cargoPaiId, list);
    });

    const stack = [...(childrenMap.get(rootId) || [])];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      if (current === possibleChildId) return true;
      const nextChildren = childrenMap.get(current);
      if (nextChildren?.length) {
        stack.push(...nextChildren);
      }
    }
    return false;
  }, [allCargos]);

  const handleMoveCargo = async (cargoId: string, setorId: string, cargoPaiId: string | null) => {
    if (cargoPaiId && cargoId === cargoPaiId) return;
    if (cargoPaiId && isCargoDescendant(cargoId, cargoPaiId)) return;

    try {
      setLoading(true);
      await api.put(`/cargos/${cargoId}`, {
        setorId,
        cargoPaiId,
      });
      await Promise.all([fetchPaginatedCargos(), fetchAllCargos(), fetchPessoasEVinculos()]);
    } catch (error) {
      console.error('Erro ao mover cargo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragLeaveRow = (event: React.DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDropTargetKey(null);
  };

  const handleDragOverRow = (key: string, canDrop: boolean) => (event: React.DragEvent<HTMLElement>) => {
    if (!canDrop) return;
    event.preventDefault();
    if (dropTargetKey !== key) {
      setDropTargetKey(key);
    }
  };

  const cargosPaiOptions = allCargos.filter(cargo =>
    cargo.setorId === formData.setorId && cargo.id !== editingCargoId
  );

  const setorOptions = useMemo<SearchSelectOption[]>(
    () => setores.map(setor => ({ value: setor.id, label: setor.nome })),
    [setores]
  );

  const cargoPaiSelectOptions = useMemo<SearchSelectOption[]>(
    () => cargosPaiOptions.map(cargo => ({ value: cargo.id, label: cargo.nome })),
    [cargosPaiOptions]
  );

  const pessoasPorCargo = useMemo(() => {
    const map = new Map<string, Pessoa[]>();
    const pessoaMap = new Map(pessoas.map(p => [p.id, p]));
    vinculos.forEach(v => {
      const pessoa = pessoaMap.get(v.pessoaId);
      if (!pessoa) return;
      const list = map.get(v.cargoId) || [];
      list.push(pessoa);
      map.set(v.cargoId, list);
    });
    return map;
  }, [pessoas, vinculos]);

  const vinculoAtivoPorPessoa = useMemo(() => {
    const map = new Map<string, PessoaSetorCargo>();
    vinculos.forEach(v => {
      map.set(v.pessoaId, v);
    });
    return map;
  }, [vinculos]);

  const pessoasSemVinculo = useMemo(() => {
    return pessoas.filter(pessoa => !vinculoAtivoPorPessoa.has(pessoa.id));
  }, [pessoas, vinculoAtivoPorPessoa]);

  const handleMovePessoa = async (pessoaId: string, cargo: Cargo) => {
    try {
      await api.post('/pessoasetorcargo', {
        pessoaId,
        setorId: cargo.setorId,
        cargoId: cargo.id,
        dataInicio: new Date().toISOString(),
      });
      await fetchPessoasEVinculos();
    } catch (error) {
      console.error('Erro ao mover pessoa:', error);
    }
  };

  const showMovedMessage = (pessoaId: string, cargo: Cargo) => {
    const pessoa = pessoas.find(p => p.id === pessoaId);
    const nomeCompleto = pessoa?.nomeCompleto?.trim() || t('positions.personFallback');
    const nome =
      nomeCompleto.length > 35 ? `${nomeCompleto.slice(0, 35)}...` : nomeCompleto;
    const setorNome = setores.find(s => s.id === cargo.setorId)?.nome || t('positions.sectorFallback');
    setToastMessage(t('positions.personMovedToast', { name: nome, sector: setorNome }));
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRemovePessoa = async (pessoaId: string) => {
    const vinculo = vinculoAtivoPorPessoa.get(pessoaId);
    if (!vinculo) return;
    try {
      await api.put(`/pessoasetorcargo/${vinculo.id}`, {
        dataFim: new Date().toISOString(),
      });
      await fetchPessoasEVinculos();
    } catch (error) {
      console.error('Erro ao remover pessoa do cargo:', error);
    }
  };

  const columns = useMemo<ColumnDef<Cargo, any>[]>(() => [
    {
      accessorKey: 'nome',
      header: t('positions.name'),
      cell: info => <div className="text-sm font-medium text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'setorNome',
      header: t('positions.sector'),
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'cargoPaiNome',
      header: t('positions.parentPosition'),
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'quantidadePessoas',
      header: t('positions.people'),
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'quantidadeAtribuicoes',
      header: t('positions.attributions'),
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: info => {
        const cargo = info.row.original;
        return (
          <div className="text-right">
            <button className="text-indigo-600 hover:text-indigo-900 mr-3" onClick={() => handleOpenModal(cargo)}>
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(cargo)}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ], [t]);

  const cargosPorSetor = useMemo(() => {
    return setores.map(setor => ({
      setor,
      cargos: allCargos.filter(cargo => cargo.setorId === setor.id),
    }));
  }, [setores, allCargos]);

  const renderCargoTree = (cargo: Cargo, level: number, setorId: string, cargoMap: Map<string, Cargo[]>) => {
    const children = cargoMap.get(cargo.id) || [];
    const isExpanded = expandedCargos.has(cargo.id);
    const isDropTarget = dropTargetKey === `cargo:${cargo.id}`;
    const canDropHere = Boolean(
      draggingCargoId &&
      draggingCargoSetorId === setorId &&
      draggingCargoId !== cargo.id &&
      !isCargoDescendant(draggingCargoId, cargo.id)
    );

    const handleCargoDragStart = (event: React.DragEvent) => {
      event.dataTransfer.setData('application/x-ziggy-cargo', cargo.id);
      event.dataTransfer.setData('application/x-ziggy-cargo-setor', setorId);
      event.dataTransfer.setData('text/plain', cargo.id);
      event.dataTransfer.effectAllowed = 'move';
      setDraggingCargoId(cargo.id);
      setDraggingCargoSetorId(setorId);
      const preview = document.createElement('div');
      preview.className = 'atribuicao-drag-preview';
      preview.textContent = cargo.nome;
      document.body.appendChild(preview);
      event.dataTransfer.setDragImage(preview, 12, 12);
      setTimeout(() => {
        if (preview.parentNode) preview.parentNode.removeChild(preview);
      }, 0);
    };

    return (
      <div key={cargo.id}>
        <div
          className={`atribuicao-row flex items-center py-2 px-4 cursor-pointer ${isDropTarget ? 'atribuicao-drop-target' : ''}`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          draggable
          onDragOver={handleDragOverRow(`cargo:${cargo.id}`, canDropHere)}
          onDragEnter={handleDragOverRow(`cargo:${cargo.id}`, canDropHere)}
          onDragLeave={handleDragLeaveRow}
          onDrop={(event) => {
            event.preventDefault();
            const draggedCargoId =
              event.dataTransfer.getData('application/x-ziggy-cargo') ||
              event.dataTransfer.getData('text/plain');
            if (draggedCargoId && canDropHere) {
              handleMoveCargo(draggedCargoId, setorId, cargo.id);
            }
            setDropTargetKey(null);
          }}
          onDragStart={handleCargoDragStart}
          onDragEnd={() => {
            setDraggingCargoId(null);
            setDraggingCargoSetorId(null);
            setDropTargetKey(null);
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleCargo(cargo.id);
              }}
              className="mr-2"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}
          <div className="flex-1 flex items-center justify-between">
            <div
              className="flex-1"
              draggable
              onDragStart={handleCargoDragStart}
            >
              <span className="font-medium text-primary" draggable onDragStart={handleCargoDragStart}>
                {cargo.nome}
              </span>
          {cargo.cargoPaiNome && (
                <span className="ml-3 text-sm text-secondary" draggable onDragStart={handleCargoDragStart}>
                  {t('positions.parentLabel', { name: cargo.cargoPaiNome })}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button className="text-indigo-600 hover:text-indigo-900" draggable={false} onClick={() => handleOpenModal(cargo)}>
                <Edit className="w-4 h-4" />
              </button>
              <button className="text-red-600 hover:text-red-900" draggable={false} onClick={() => handleDelete(cargo)}>
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="text-emerald-600 hover:text-emerald-700" draggable={false} onClick={() => handleOpenModal(undefined, setorId, cargo.id)}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {children.length > 0 && isExpanded && (
          <div>
            {children.map(child => renderCargoTree(child, level + 1, setorId, cargoMap))}
          </div>
        )}
      </div>
    );
  };

  if (loading && cargos.length === 0) {
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">{t('positions.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('positions.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="flex rounded-lg p-1" 
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {[
              { mode: 'org', label: t('positions.viewOrg') },
              { mode: 'list', label: t('positions.viewTable') },
              { mode: 'tree', label: t('positions.viewTree') }
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
            <span>{t('positions.newPosition')}</span>
          </button>
        </div>
      </div>

      {viewMode === 'org' ? (
        <CargoOrgChart
          cargos={allCargos}
          setores={setores}
          selectedSetorId={selectedSetorId}
          onSelectedSetorChange={setSelectedSetorId}
          pessoasPorCargo={pessoasPorCargo}
          pessoasSemVinculo={pessoasSemVinculo}
          onMovePessoa={handleMovePessoa}
          onRemovePessoa={handleRemovePessoa}
          onMovedMessage={showMovedMessage}
          onAddForSetor={(setor) => handleOpenModal(undefined, setor.id)}
          onAddChild={(cargo) => handleOpenModal(undefined, cargo.setorId, cargo.id)}
          onEdit={(cargo) => handleOpenModal(cargo)}
          onDelete={(cargo) => handleDelete(cargo)}
          onHierarchyUpdate={() => fetchAllCargos()}
        />
      ) : viewMode === 'tree' ? (
        <div className="glass-card overflow-hidden py-4">
          {cargosPorSetor.map(({ setor, cargos: cargosDoSetor }) => {
            const cargoMap = new Map<string, Cargo[]>();
            cargosDoSetor.forEach(cargo => {
              const parentId = cargo.cargoPaiId || '__root__';
              const list = cargoMap.get(parentId) || [];
              list.push(cargo);
              cargoMap.set(parentId, list);
            });

            const rootCargos = cargoMap.get('__root__') || [];
            const isExpanded = expandedSetores.has(setor.id);

            return (
              <div key={setor.id}>
                <div
                  className={`atribuicao-row flex items-center py-2 px-4 cursor-pointer ${
                    dropTargetKey === `setor:${setor.id}` ? 'atribuicao-drop-target' : ''
                  }`}
                  onDragOver={handleDragOverRow(
                    `setor:${setor.id}`,
                    Boolean(draggingCargoId)
                  )}
                  onDragEnter={handleDragOverRow(
                    `setor:${setor.id}`,
                    Boolean(draggingCargoId)
                  )}
                  onDragLeave={handleDragLeaveRow}
                  onDrop={(event) => {
                    event.preventDefault();
                    const draggedCargoId =
                      event.dataTransfer.getData('application/x-ziggy-cargo') ||
                      event.dataTransfer.getData('text/plain');
                    if (draggedCargoId) {
                      handleMoveCargo(draggedCargoId, setor.id, null);
                    }
                    setDropTargetKey(null);
                  }}
                  onClick={() => toggleSetor(setor.id)}
                >
                  {rootCargos.length > 0 ? (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSetor(setor.id);
                      }}
                      className="mr-2"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>
                  ) : (
                    <div className="w-6 mr-2" />
                  )}
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-primary">{setor.nome}</span>
                      <span className="ml-3 text-sm text-secondary">
                        {t('positions.countInSector', { count: cargosDoSetor.length })}
                      </span>
                    </div>
                    <button
                      className="text-emerald-600 hover:text-emerald-700"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenModal(undefined, setor.id);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isExpanded && rootCargos.length > 0 && (
                  <div>
                    {rootCargos.map(cargo => renderCargoTree(cargo, 1, setor.id, cargoMap))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={cargos}
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
                {editingCargoId ? t('positions.editPosition') : t('positions.newPosition')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label={t('common.close')}>
                <span aria-hidden="true">x</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="glass-modal-label">
                    {t('positions.name')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    name="nome"
                    value={formData.nome}
                    onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className={`glass-modal-input ${formErrors.nome ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('positions.placeholders.name')}
                    ref={nomeInputRef}
                    required
                  />
                  {formErrors.nome && <p className="glass-modal-error">{formErrors.nome}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">
                    {t('positions.sector')} <span className="glass-modal-required">*</span>
                  </label>
                  <SearchSelect
                    options={setorOptions}
                    value={setorOptions.find(option => option.value === formData.setorId) ?? null}
                    onChange={(option) => handleSetorChange(option ? String(option.value) : '')}
                    placeholder={t('positions.selectSector')}
                    hasError={Boolean(formErrors.setorId)}
                  />
                  {formErrors.setorId && <p className="glass-modal-error">{formErrors.setorId}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="glass-modal-label">{t('positions.parentPosition')}</label>
                  <SearchSelect
                    options={cargoPaiSelectOptions}
                    value={cargoPaiSelectOptions.find(option => option.value === formData.cargoPaiId) ?? null}
                    onChange={(option) =>
                      setFormData(prev => ({ ...prev, cargoPaiId: option ? String(option.value) : '' }))
                    }
                    placeholder={
                      formData.setorId ? t('positions.selectParentPosition') : t('positions.selectSectorFirst')
                    }
                    isDisabled={!formData.setorId}
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
                {t('positions.deleteConfirm', { name: deleteTarget.nome })}
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

      {toastMessage && (
        <div className="org-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
