import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { ChangeEvent, FormEvent, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Link2 } from 'lucide-react';
import api from '../lib/api';
import type { Pessoa, Setor, Cargo } from '../types';
import { StatusPessoa } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import type { PagedResult, PaginationParams } from '../types/pagination';

export default function Pessoas() {
  const { t } = useTranslation();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 20,
    sortDesc: false
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPessoaId, setEditingPessoaId] = useState<string | null>(null);
  const [editingPessoaVinculo, setEditingPessoaVinculo] = useState<{ setorId?: string; cargoId?: string } | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Pessoa | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pessoa | null>(null);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    telefone: '',
    documento: '',
    dataNascimento: '',
    status: StatusPessoa.Ativo,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [selectedSetorId, setSelectedSetorId] = useState('');
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [assignSetorId, setAssignSetorId] = useState('');
  const [assignCargoId, setAssignCargoId] = useState('');
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  const toDateInputValue = (value?: string | Date | null) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchPaginatedPessoas = async () => {
    setLoading(true);
    try {
      const response = await api.get<PagedResult<Pessoa>>('/api/pessoas/paged', {
        params: {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          sortBy: pagination.sortBy,
          sortDesc: pagination.sortDesc,
          searchTerm: pagination.searchTerm
        }
      });
      setPessoas(response.data.items);
      setPageCount(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedPessoas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber, pagination.pageSize, pagination.sortBy, pagination.sortDesc, pagination.searchTerm]);

  useEffect(() => {
    const fetchSetoresECargos = async () => {
      try {
        const [setoresResponse, cargosResponse] = await Promise.all([
          api.get<Setor[]>('/api/setores'),
          api.get<Cargo[]>('/api/cargos'),
        ]);
        setSetores(setoresResponse.data);
        setCargos(cargosResponse.data);
      } catch (error) {
        console.error('Erro ao carregar setores e cargos:', error);
      }
    };
    fetchSetoresECargos();
  }, []);

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageNumber: pageIndex + 1, // API is 1-indexed, TanStack Table is 0-indexed
      pageSize
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
      sortDesc: column.desc
    }));
  }, []);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setPagination(prev => ({
      ...prev,
      searchTerm,
      pageNumber: 1 // Reset to first page on new search
    }));
  }, []);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case StatusPessoa.Ativo: return t('people.statusActive');
      case StatusPessoa.Afastado: return t('people.statusAway');
      case StatusPessoa.Desligado: return t('people.statusTerminated');
      default: return t('common.status');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case StatusPessoa.Ativo: return 'bg-green-100 text-green-800';
      case StatusPessoa.Afastado: return 'bg-yellow-100 text-yellow-800';
      case StatusPessoa.Desligado: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = useMemo<ColumnDef<Pessoa, any>[]>(() => [
    {
      accessorKey: 'nomeCompleto',
      header: t('people.name'),
      cell: info => <div className="text-sm font-medium text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'email',
      header: t('people.email'),
      cell: info => <div className="text-sm text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'cargoAtualNome',
      header: t('people.currentPosition'),
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'setorAtualNome',
      header: t('people.currentSector'),
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'status',
      header: t('people.status'),
      cell: info => {
        const status = info.getValue() as number;
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions')}</div>,
      cell: info => {
        const pessoa = info.row.original;
        return (
          <div className="text-right">
            <div className="action-button-group inline-flex">
              <button
                className="action-button"
                onClick={() => handleOpenModal(pessoa)}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                className="action-button"
                onClick={() => handleOpenAssign(pessoa)}
                title={t('people.quickAssign')}
              >
                <Link2 className="w-4 h-4" />
              </button>
              <button
                className="action-button"
                onClick={() => handleDelete(pessoa)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }
    }
  ], [t]);

  const handleOpenModal = (pessoa?: Pessoa) => {
    if (pessoa) {
      setEditingPessoaId(pessoa.id);
      setEditingPessoaVinculo({
        setorId: pessoa.setorAtualId,
        cargoId: pessoa.cargoAtualId,
      });
      setFormData({
        nomeCompleto: pessoa.nomeCompleto || '',
        email: pessoa.email || '',
        telefone: pessoa.telefone || '',
        documento: pessoa.documento || '',
        dataNascimento: toDateInputValue(pessoa.dataNascimento),
        status: pessoa.status ?? StatusPessoa.Ativo,
      });
      setPhotoPreview(pessoa.foto || null);
      setPhotoFile(null);
      setSelectedSetorId(pessoa.setorAtualId || '');
      setSelectedCargoId(pessoa.cargoAtualId || '');
    } else {
      setEditingPessoaId(null);
      setEditingPessoaVinculo(null);
      setFormData({
        nomeCompleto: '',
        email: '',
        telefone: '',
        documento: '',
        dataNascimento: '',
        status: StatusPessoa.Ativo,
      });
      setPhotoPreview(null);
      setPhotoFile(null);
      setSelectedSetorId('');
      setSelectedCargoId('');
    }
    setIsDragActive(false);
    setFormErrors({});
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPessoaId(null);
    setEditingPessoaVinculo(null);
    setFormData({
      nomeCompleto: '',
      email: '',
      telefone: '',
      documento: '',
      dataNascimento: '',
      status: StatusPessoa.Ativo,
    });
    setFormErrors({});
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsDragActive(false);
    setSelectedSetorId('');
    setSelectedCargoId('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'status' ? Number(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.nomeCompleto.trim()) errors.nomeCompleto = t('people.validation.requiredName');
    if (!formData.email.trim()) errors.email = t('people.validation.requiredEmail');
    if (!formData.dataNascimento) errors.dataNascimento = t('people.validation.requiredBirthDate');
    if (!formData.status) errors.status = t('people.validation.requiredStatus');
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = t('people.validation.invalidEmail');
    }
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      let foto: string | undefined;
      if (photoFile) {
        foto = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('file_read_error'));
          reader.readAsDataURL(photoFile);
        });
      }

      const payload = {
        nomeCompleto: formData.nomeCompleto,
        email: formData.email,
        telefone: formData.telefone || null,
        dataNascimento: formData.dataNascimento || null,
        documento: formData.documento || null,
        foto: foto ?? null,
        status: formData.status,
      };

      let pessoaId = editingPessoaId;
      if (editingPessoaId) {
        const response = await api.put(`/api/pessoas/${editingPessoaId}`, payload);
        pessoaId = response.data?.id ?? editingPessoaId;
      } else {
        const response = await api.post('/api/pessoas', payload);
        pessoaId = response.data?.id;
      }

      const hasSelection = selectedSetorId && selectedCargoId && pessoaId;
      const changedSelection = hasSelection && (
        !editingPessoaVinculo ||
        editingPessoaVinculo.setorId !== selectedSetorId ||
        editingPessoaVinculo.cargoId !== selectedCargoId
      );

      if (changedSelection && pessoaId) {
        await api.post('/api/pessoasetorcargo', {
          pessoaId,
          setorId: selectedSetorId,
          cargoId: selectedCargoId,
          dataInicio: new Date().toISOString(),
        });
      }

      await fetchPaginatedPessoas();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
      setFormErrors(prev => ({
        ...prev,
        geral: t('people.validation.createFailed'),
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormErrors(prev => ({ ...prev, foto: t('people.validation.invalidPhoto') }));
      return;
    }
    setFormErrors(prev => ({ ...prev, foto: '' }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => setIsDragActive(false);

  const handleOpenAssign = (pessoa: Pessoa) => {
    setAssignTarget(pessoa);
    setAssignSetorId(pessoa.setorAtualId || '');
    setAssignCargoId(pessoa.cargoAtualId || '');
    setAssignErrors({});
    setIsAssignOpen(true);
  };

  const handleCloseAssign = () => {
    setIsAssignOpen(false);
    setAssignTarget(null);
    setAssignSetorId('');
    setAssignCargoId('');
    setAssignErrors({});
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget) return;
    const errors: Record<string, string> = {};
    if (!assignSetorId) errors.setor = t('people.validation.requiredSector');
    if (!assignCargoId) errors.cargo = t('people.validation.requiredPosition');
    if (Object.keys(errors).length) {
      setAssignErrors(errors);
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/pessoasetorcargo', {
        pessoaId: assignTarget.id,
        setorId: assignSetorId,
        cargoId: assignCargoId,
        dataInicio: new Date().toISOString(),
      });
      await fetchPaginatedPessoas();
      handleCloseAssign();
    } catch (error) {
      console.error('Erro ao vincular setor/cargo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pessoa: Pessoa) => {
    setDeleteTarget(pessoa);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await api.delete(`/api/pessoas/${deleteTarget.id}`);
      await fetchPaginatedPessoas();
    } catch (error) {
      console.error('Erro ao deletar pessoa:', error);
    } finally {
      setLoading(false);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleSetorChange = (value: string) => {
    setSelectedSetorId(value);
    setSelectedCargoId('');
  };

  const handleAssignSetorChange = (value: string) => {
    setAssignSetorId(value);
    setAssignCargoId('');
    if (assignErrors.setor || assignErrors.cargo) {
      setAssignErrors(prev => ({ ...prev, setor: '', cargo: '' }));
    }
  };

  const cargosDisponiveis = selectedSetorId
    ? cargos.filter(cargo => cargo.setorId === selectedSetorId)
    : [];

  const cargosDisponiveisAssign = assignSetorId
    ? cargos.filter(cargo => cargo.setorId === assignSetorId)
    : [];

  const setorOptions = useMemo<SearchSelectOption[]>(
    () => setores.map(setor => ({ value: setor.id, label: setor.nome })),
    [setores]
  );

  const cargoOptions = useMemo<SearchSelectOption[]>(
    () => cargosDisponiveis.map(cargo => ({ value: cargo.id, label: cargo.nome })),
    [cargosDisponiveis]
  );

  const cargoAssignOptions = useMemo<SearchSelectOption[]>(
    () => cargosDisponiveisAssign.map(cargo => ({ value: cargo.id, label: cargo.nome })),
    [cargosDisponiveisAssign]
  );

  const statusOptions = useMemo<SearchSelectOption[]>(
    () => [
      { value: StatusPessoa.Ativo, label: t('people.statusActive') },
      { value: StatusPessoa.Afastado, label: t('people.statusAway') },
      { value: StatusPessoa.Desligado, label: t('people.statusTerminated') }
    ],
    [t]
  );

  return (
    <div className="animate-fadeIn">
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">{t('people.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('people.description')}
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5">
          <Plus className="w-4 h-4" />
          <span>{t('people.newPersonWithPlus')}</span>
        </button>
      </div>

      {/* Tabela de dados */}
      <DataTable
        columns={columns}
        data={pessoas}
        pageCount={pageCount}
        totalCount={totalCount}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onSearchChange={handleSearchChange}
        isLoading={loading}
        isServerSide={true}
      />

      {isModalOpen && (
        <div className="glass-modal-backdrop" onClick={handleCloseModal}>
          <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingPessoaId ? t('people.editPerson') : t('people.newPerson')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label={t('common.cancel')}>
                <span aria-hidden="true">x</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="glass-modal-label">
                    {t('people.fullName')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    name="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={handleInputChange}
                    className={`glass-modal-input ${formErrors.nomeCompleto ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('people.placeholders.fullName')}
                    required
                  />
                  {formErrors.nomeCompleto && <p className="glass-modal-error">{formErrors.nomeCompleto}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">
                    {t('people.email')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`glass-modal-input ${formErrors.email ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('people.placeholders.email')}
                    required
                  />
                  {formErrors.email && <p className="glass-modal-error">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">{t('people.phone')}</label>
                  <input
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    className="glass-modal-input"
                    placeholder={t('people.placeholders.phone')}
                  />
                </div>
                <div>
                  <label className="glass-modal-label">{t('people.document')}</label>
                  <input
                    name="documento"
                    value={formData.documento}
                    onChange={handleInputChange}
                    className="glass-modal-input"
                    placeholder={t('people.placeholders.document')}
                  />
                </div>
                <div>
                  <label className="glass-modal-label">{t('people.sector')}</label>
                  <SearchSelect
                    options={setorOptions}
                    value={setorOptions.find(option => option.value === selectedSetorId) ?? null}
                    onChange={(option) => handleSetorChange(option ? String(option.value) : '')}
                    placeholder={t('people.selectSector')}
                  />
                </div>
                <div>
                  <label className="glass-modal-label">{t('people.position')}</label>
                  <SearchSelect
                    options={cargoOptions}
                    value={cargoOptions.find(option => option.value === selectedCargoId) ?? null}
                    onChange={(option) => setSelectedCargoId(option ? String(option.value) : '')}
                    placeholder={selectedSetorId ? t('people.selectPosition') : t('people.selectSectorFirst')}
                    isDisabled={!selectedSetorId}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="glass-modal-label">
                    {t('people.birthDate')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    name="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={handleInputChange}
                    className={`glass-modal-input ${formErrors.dataNascimento ? 'glass-modal-input-error' : ''}`}
                    required
                  />
                  {formErrors.dataNascimento && <p className="glass-modal-error">{formErrors.dataNascimento}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="glass-modal-label">
                    {t('people.status')} <span className="glass-modal-required">*</span>
                  </label>
                  <SearchSelect
                    options={statusOptions}
                    value={statusOptions.find(option => option.value === formData.status) ?? null}
                    onChange={(option) =>
                      setFormData(prev => ({
                        ...prev,
                        status: option ? Number(option.value) : StatusPessoa.Ativo
                      }))
                    }
                    placeholder={t('people.status')}
                    isClearable={false}
                    hasError={Boolean(formErrors.status)}
                  />
                  {formErrors.status && <p className="glass-modal-error">{formErrors.status}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="glass-modal-label">{t('people.photo')}</label>
                  <div
                    className={`glass-modal-dropzone ${isDragActive ? 'is-dragging' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="glass-modal-file-input"
                      onChange={handleFileChange}
                    />
                    {photoPreview ? (
                      <div className="glass-modal-photo-preview">
                        <img src={photoPreview} alt={t('people.photoPreviewAlt')} />
                        <span>{t('people.changePhoto')}</span>
                      </div>
                    ) : (
                      <div className="glass-modal-dropzone-content">
                        <span>{t('people.dropzoneTitle')}</span>
                        <small>{t('people.dropzoneHint')}</small>
                      </div>
                    )}
                  </div>
                  {formErrors.foto && <p className="glass-modal-error">{formErrors.foto}</p>}
                  {formErrors.geral && <p className="glass-modal-error">{formErrors.geral}</p>}
                </div>
              </div>

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
                {t('people.deleteTitle')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseDelete} aria-label={t('common.cancel')}>
                <span aria-hidden="true">x</span>
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('people.deleteConfirm', { name: deleteTarget.nomeCompleto })}
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

      {isAssignOpen && assignTarget && (
        <div className="glass-modal-backdrop" onClick={handleCloseAssign}>
          <div className="glass-modal glass-modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('people.assignTitle')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseAssign} aria-label={t('common.cancel')}>
                <span aria-hidden="true">x</span>
              </button>
            </div>
            <div className="glass-modal-body">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="glass-modal-label">{t('people.sector')}</label>
                  <SearchSelect
                    options={setorOptions}
                    value={setorOptions.find(option => option.value === assignSetorId) ?? null}
                    onChange={(option) => handleAssignSetorChange(option ? String(option.value) : '')}
                    placeholder={t('people.selectSector')}
                    hasError={Boolean(assignErrors.setor)}
                  />
                  {assignErrors.setor && <p className="glass-modal-error">{assignErrors.setor}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">{t('people.position')}</label>
                  <SearchSelect
                    options={cargoAssignOptions}
                    value={cargoAssignOptions.find(option => option.value === assignCargoId) ?? null}
                    onChange={(option) => setAssignCargoId(option ? String(option.value) : '')}
                    placeholder={assignSetorId ? t('people.selectPosition') : t('people.selectSectorFirst')}
                    isDisabled={!assignSetorId}
                    hasError={Boolean(assignErrors.cargo)}
                  />
                  {assignErrors.cargo && <p className="glass-modal-error">{assignErrors.cargo}</p>}
                </div>
              </div>

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseAssign} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={handleConfirmAssign} className="glass-modal-button-primary">
                  {t('people.assignAction')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
