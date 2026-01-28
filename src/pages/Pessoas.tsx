import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { ChangeEvent, FormEvent, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../lib/api';
import type { Pessoa } from '../types';
import { StatusPessoa } from '../types';
import { DataTable } from '../components/DataTable';
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

  const fetchPaginatedPessoas = async () => {
    setLoading(true);
    try {
      const response = await api.get<PagedResult<Pessoa>>('/pessoas/paged', {
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
      cell: info => <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
    },
    {
      accessorKey: 'email',
      header: t('people.email'),
      cell: info => <div className="text-sm text-gray-900">{info.getValue()}</div>
    },
    {
      accessorKey: 'cargoAtualNome',
      header: t('people.currentPosition'),
      cell: info => <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'setorAtualNome',
      header: t('people.currentSector'),
      cell: info => <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
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
            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-900">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ], [t]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
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

  const handleSubmit = (e: FormEvent) => {
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
    handleCloseModal();
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
        <button onClick={handleOpenModal} className="glass-button flex items-center gap-2 px-4 py-2.5">
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('people.newPerson')}</h2>
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
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`glass-modal-input ${formErrors.status ? 'glass-modal-input-error' : ''}`}
                    required
                  >
                    <option value={StatusPessoa.Ativo}>{t('people.statusActive')}</option>
                    <option value={StatusPessoa.Afastado}>{t('people.statusAway')}</option>
                    <option value={StatusPessoa.Desligado}>{t('people.statusTerminated')}</option>
                  </select>
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
    </div>
  );
}
