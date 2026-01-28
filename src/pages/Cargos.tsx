import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../lib/api';
import CargoOrgChart from '../components/CargoOrgChart';
import { DataTable } from '../components/DataTable';
import type { Cargo, Setor } from '../types';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { PagedResult, PaginationParams } from '../types/pagination';

export default function Cargos() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [allCargos, setAllCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'org' | 'group'>('org');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 20,
    sortDesc: false,
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

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

  useEffect(() => {
    fetchPaginatedCargos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber, pagination.pageSize, pagination.sortBy, pagination.sortDesc, pagination.searchTerm]);

  useEffect(() => {
    fetchAllCargos();
    fetchSetores();
  }, []);

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
    if (!formData.nome.trim()) errors.nome = 'Informe o nome do cargo.';
    if (!formData.setorId) errors.setorId = 'Selecione um setor.';
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

      await Promise.all([fetchPaginatedCargos(), fetchAllCargos()]);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar cargo:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: 'Não foi possível salvar o cargo.'
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
      await Promise.all([fetchPaginatedCargos(), fetchAllCargos()]);
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

  const cargosPaiOptions = allCargos.filter(cargo =>
    cargo.setorId === formData.setorId && cargo.id !== editingCargoId
  );

  const columns = useMemo<ColumnDef<Cargo, any>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: info => <div className="text-sm font-medium text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'setorNome',
      header: 'Setor',
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'cargoPaiNome',
      header: 'Cargo Pai',
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'quantidadePessoas',
      header: 'Pessoas',
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'quantidadeAtribuicoes',
      header: 'Atribuições',
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
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
  ], []);

  const cargosPorSetor = useMemo(() => {
    return setores.map(setor => ({
      setor,
      cargos: allCargos.filter(cargo => cargo.setorId === setor.id),
    }));
  }, [setores, allCargos]);

  if (loading && cargos.length === 0) {
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
          <div 
            className="flex rounded-lg p-1" 
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            {[
              { mode: 'org', label: 'Organograma' },
              { mode: 'list', label: 'Tabela' },
              { mode: 'group', label: 'Por Setor' }
            ].map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode as 'org' | 'list' | 'group')}
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
            <span>Novo Cargo</span>
          </button>
        </div>
      </div>

      {viewMode === 'org' ? (
        <CargoOrgChart
          cargos={allCargos}
          setores={setores}
          onAddForSetor={(setor) => handleOpenModal(undefined, setor.id)}
          onAddChild={(cargo) => handleOpenModal(undefined, cargo.setorId, cargo.id)}
          onEdit={(cargo) => handleOpenModal(cargo)}
          onDelete={(cargo) => handleDelete(cargo)}
          onHierarchyUpdate={() => fetchAllCargos()}
        />
      ) : viewMode === 'group' ? (
        <div className="space-y-4">
          {cargosPorSetor.map(({ setor, cargos: cargosDoSetor }) => (
            <div key={setor.id} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{setor.nome}</h2>
                <button className="text-indigo-600 hover:text-indigo-900" onClick={() => handleOpenModal(undefined, setor.id)}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {cargosDoSetor.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum cargo cadastrado</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cargosDoSetor.map(cargo => (
                    <div key={cargo.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cargo.nome}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cargo.cargoPaiNome || 'Sem cargo pai'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-indigo-600 hover:text-indigo-900" onClick={() => handleOpenModal(cargo)}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(cargo)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
                {editingCargoId ? 'Editar Cargo' : 'Novo Cargo'}
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
                    placeholder="Ex.: Analista"
                    ref={nomeInputRef}
                    required
                  />
                  {formErrors.nome && <p className="glass-modal-error">{formErrors.nome}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">
                    Setor <span className="glass-modal-required">*</span>
                  </label>
                  <select
                    value={formData.setorId}
                    onChange={e => handleSetorChange(e.target.value)}
                    className={`glass-modal-input ${formErrors.setorId ? 'glass-modal-input-error' : ''}`}
                  >
                    <option value="">Selecione um setor</option>
                    {setores.map(setor => (
                      <option key={setor.id} value={setor.id}>{setor.nome}</option>
                    ))}
                  </select>
                  {formErrors.setorId && <p className="glass-modal-error">{formErrors.setorId}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="glass-modal-label">Cargo Pai</label>
                  <select
                    value={formData.cargoPaiId}
                    onChange={e => setFormData(prev => ({ ...prev, cargoPaiId: e.target.value }))}
                    className="glass-modal-input"
                    disabled={!formData.setorId}
                  >
                    <option value="">
                      {formData.setorId ? 'Selecione um cargo pai' : 'Selecione um setor primeiro'}
                    </option>
                    {cargosPaiOptions.map(cargo => (
                      <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
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
