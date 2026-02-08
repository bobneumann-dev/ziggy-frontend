import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import type { Usuario, Pessoa } from '../types';
import { StatusUsuario } from '../types';
import { DataTable } from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';

export default function Usuarios() {
  const { t } = useTranslation();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuarioId, setEditingUsuarioId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{
    login: string;
    roles: string;
    status: StatusUsuario;
    pessoaId: string;
    idioma: string;
    password: string;
  }>({
    login: '',
    roles: '',
    status: StatusUsuario.Ativo,
    pessoaId: '',
    idioma: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const loginInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchUsuarios();
    fetchPessoas();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get<Usuario[]>('/api/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPessoas = async () => {
    try {
      const response = await api.get<Pessoa[]>('/api/pessoas');
      setPessoas(response.data);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case StatusUsuario.Ativo: return t('users.statusActive');
      case StatusUsuario.Inativo: return t('users.statusInactive');
      case StatusUsuario.Bloqueado: return t('users.statusBlocked');
      default: return t('users.status');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case StatusUsuario.Ativo: return 'bg-green-100 text-green-800';
      case StatusUsuario.Inativo: return 'bg-gray-100 text-gray-800';
      case StatusUsuario.Bloqueado: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pessoaOptions = useMemo<SearchSelectOption[]>(
    () => pessoas.map(pessoa => ({ value: pessoa.id, label: pessoa.nomeCompleto })),
    [pessoas]
  );

  const statusOptions = useMemo<SearchSelectOption[]>(
    () => [
      { value: StatusUsuario.Ativo, label: t('users.statusActive') },
      { value: StatusUsuario.Inativo, label: t('users.statusInactive') },
      { value: StatusUsuario.Bloqueado, label: t('users.statusBlocked') },
    ],
    [t]
  );

  const filteredUsuarios = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(usuario =>
      usuario.login.toLowerCase().includes(term)
      || (usuario.pessoaNome || '').toLowerCase().includes(term)
      || (usuario.roles || '').toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuarioId(usuario.id);
      setFormData({
        login: usuario.login || '',
        roles: usuario.roles || '',
        status: usuario.status ?? StatusUsuario.Ativo,
        pessoaId: usuario.pessoaId || '',
        idioma: usuario.idioma || '',
        password: '',
      });
    } else {
      setEditingUsuarioId(null);
      setFormData({
        login: '',
        roles: '',
        status: StatusUsuario.Ativo,
        pessoaId: '',
        idioma: '',
        password: '',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
    setTimeout(() => loginInputRef.current?.focus(), 0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUsuarioId(null);
    setFormErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.login.trim()) errors.login = 'Informe o login.';
    if (!formData.roles.trim()) errors.roles = 'Informe o perfil/roles.';
    if (!editingUsuarioId && !formData.password.trim()) errors.password = 'Informe a senha.';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      if (editingUsuarioId) {
        await api.put(`/api/usuarios/${editingUsuarioId}`, {
          login: formData.login,
          status: formData.status,
          roles: formData.roles,
          pessoaId: formData.pessoaId || null,
          idioma: formData.idioma || null,
        });
        if (formData.password.trim()) {
          await api.post(`/api/usuarios/${editingUsuarioId}/reset-password`, {
            newPassword: formData.password,
          });
        }
      } else {
        await api.post('/api/usuarios', {
          login: formData.login,
          password: formData.password,
          roles: formData.roles,
          pessoaId: formData.pessoaId || null,
          idioma: formData.idioma || null,
        });
      }
      await fetchUsuarios();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar usuario:', error);
      setFormErrors(prev => ({ ...prev, geral: 'Nao foi possivel salvar o usuario.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (usuario: Usuario) => {
    setDeleteTarget(usuario);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await api.delete(`/api/usuarios/${deleteTarget.id}`);
      await fetchUsuarios();
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Erro ao deletar usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleOpenStatus = (usuario: Usuario) => {
    setStatusTarget(usuario);
    setIsStatusOpen(true);
  };

  const handleCloseStatus = () => {
    setIsStatusOpen(false);
    setStatusTarget(null);
  };

  const handleConfirmStatus = async () => {
    if (!statusTarget) return;
    try {
      setLoading(true);
      await api.post(`/api/usuarios/${statusTarget.id}/toggle-status`);
      await fetchUsuarios();
      setIsStatusOpen(false);
      setStatusTarget(null);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<Usuario, any>[]>(() => [
    {
      accessorKey: 'login',
      header: t('users.login'),
      cell: info => <div className="text-sm font-medium text-primary">{info.getValue()}</div>
    },
    {
      accessorKey: 'pessoaNome',
      header: t('users.person'),
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'status',
      header: t('users.status'),
      cell: info => {
        const status = info.getValue() as number;
        const usuario = info.row.original;
        return (
          <button
            type="button"
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${getStatusColor(status)}`}
            onClick={() => handleOpenStatus(usuario)}
            title="Ativar/Desativar"
          >
            {getStatusLabel(status)}
          </button>
        );
      }
    },
    {
      accessorKey: 'roles',
      header: t('users.roles'),
      cell: info => <div className="text-sm text-primary">{info.getValue() || '-'}</div>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('users.actions')}</div>,
      cell: info => {
        const usuario = info.row.original;
        return (
          <div className="text-right">
            <div className="action-button-group inline-flex">
              <button
                className="action-button"
                onClick={() => handleOpenModal(usuario)}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                className="action-button"
                onClick={() => handleDelete(usuario)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }
    },
  ], [t]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">{t('users.title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {t('users.description') || ''}
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5">
          <Plus className="w-4 h-4" />
          <span>{t('users.newUser')}</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsuarios}
        onSearchChange={handleSearchChange}
        isLoading={loading}
        isServerSide={false}
      />

      {isModalOpen && (
        <div className="glass-modal-backdrop" onClick={handleCloseModal}>
          <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingUsuarioId ? t('users.editUser') : t('users.newUser')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseModal} aria-label={t('common.cancel')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-modal-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="glass-modal-label">
                    {t('users.login')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    ref={loginInputRef}
                    value={formData.login}
                    onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
                    className={`glass-modal-input ${formErrors.login ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('users.login')}
                  />
                  {formErrors.login && <p className="glass-modal-error">{formErrors.login}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">
                    {t('users.roles')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    value={formData.roles}
                    onChange={(e) => setFormData(prev => ({ ...prev, roles: e.target.value }))}
                    className={`glass-modal-input ${formErrors.roles ? 'glass-modal-input-error' : ''}`}
                    placeholder={t('users.roles')}
                  />
                  {formErrors.roles && <p className="glass-modal-error">{formErrors.roles}</p>}
                </div>
                <div>
                  <label className="glass-modal-label">{t('users.person')}</label>
                  <SearchSelect
                    options={pessoaOptions}
                    value={pessoaOptions.find(option => option.value === formData.pessoaId) ?? null}
                    onChange={(option) => setFormData(prev => ({ ...prev, pessoaId: option ? String(option.value) : '' }))}
                    placeholder={t('users.person')}
                  />
                </div>
                <div>
                  <label className="glass-modal-label">{t('users.status')}</label>
                  <SearchSelect
                    options={statusOptions}
                    value={statusOptions.find(option => option.value === formData.status) ?? null}
                    onChange={(option) =>
                      setFormData(prev => ({
                        ...prev,
                        status: option ? (Number(option.value) as StatusUsuario) : StatusUsuario.Ativo
                      }))
                    }
                    isClearable={false}
                  />
                </div>
                <div>
                  <label className="glass-modal-label">{t('users.language')}</label>
                  <input
                    value={formData.idioma}
                    onChange={(e) => setFormData(prev => ({ ...prev, idioma: e.target.value }))}
                    className="glass-modal-input"
                    placeholder="ex: pt-BR"
                  />
                </div>
                <div>
                  <label className="glass-modal-label">
                    {editingUsuarioId ? t('users.newPasswordOptional') : t('users.password')} <span className="glass-modal-required">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`glass-modal-input ${formErrors.password ? 'glass-modal-input-error' : ''}`}
                    placeholder={editingUsuarioId ? t('users.newPasswordOptional') : t('users.password')}
                  />
                  {formErrors.password && <p className="glass-modal-error">{formErrors.password}</p>}
                </div>
              </div>

              {formErrors.geral && <p className="glass-modal-error mt-3">{formErrors.geral}</p>}

              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseModal} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="glass-modal-button-primary">
                  {editingUsuarioId ? t('common.save') : t('common.create')}
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
                {t('users.deleteTitle') || t('common.delete')}
              </h2>
              <button className="glass-modal-close" onClick={handleCloseDelete} aria-label={t('common.cancel')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('users.deleteConfirm', { name: deleteTarget.login }) || `Deseja remover ${deleteTarget.login}?`}
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

      {isStatusOpen && statusTarget && (
        <div className="glass-modal-backdrop" onClick={handleCloseStatus}>
          <div className="glass-modal glass-modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Confirmar alteracao de status
              </h2>
              <button className="glass-modal-close" onClick={handleCloseStatus} aria-label={t('common.cancel')}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="glass-modal-body">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Deseja {statusTarget.status === StatusUsuario.Ativo ? 'desativar' : 'ativar'} o usuario "{statusTarget.login}"?
              </p>
              <div className="glass-modal-footer">
                <button type="button" onClick={handleCloseStatus} className="glass-modal-button-secondary">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={handleConfirmStatus} className="glass-modal-button-primary">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
