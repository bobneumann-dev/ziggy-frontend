import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import type { Armazem } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Armazens() {
    const { t } = useTranslation();
    const [armazens, setArmazens] = useState<Armazem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', categoriaId: '', ativo: true });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<Armazem | null>(null);
    const [categorias, setCategorias] = useState<SearchSelectOption[]>([]);

    const fetchArmazens = useCallback(async () => {
        try {
            const res = await api.get('/api/estoque/armazens');
            setArmazens(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategorias = useCallback(async () => {
        try {
            const res = await api.get('/api/estoque/categoriaarmazens', { params: { ativo: true } });
            setCategorias(res.data.map((c: any) => ({ label: c.nome, value: c.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchArmazens();
        fetchCategorias();
    }, [fetchArmazens, fetchCategorias]);



    const handleOpenModal = (armazem?: Armazem) => {
        if (armazem) {
            setEditingId(armazem.id);
            setFormData({ nome: armazem.nome, categoriaId: armazem.categoriaId || '', ativo: armazem.ativo });
        } else {
            setEditingId(null);
            setFormData({ nome: '', categoriaId: '', ativo: true });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setFormErrors({});
        if (!formData.nome.trim()) {
            setFormErrors({ nome: t('warehouses.validation.requiredName') });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/estoque/armazens/${editingId}`, formData);
            } else {
                await api.post('/api/estoque/armazens', formData);
            }
            fetchArmazens();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || t('warehouses.validation.saveFailed') });
        }
    };

    const handleDelete = (armazem: Armazem) => {
        setDeleteTarget(armazem);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/estoque/armazens/${deleteTarget.id}`);
            fetchArmazens();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Armazem>[] = useMemo(() => [
        { header: t('warehouses.name'), accessorKey: 'nome' },
        { header: t('warehouses.category'), accessorKey: 'categoriaNome', cell: ({ row }) => row.original.categoriaNome || '-' },
        {
            header: t('common.status'),
            accessorKey: 'ativo',
            cell: ({ row }) => (
                <span className={`badge ${row.original.ativo ? 'badge-success' : 'badge-danger'}`}>
                    {row.original.ativo ? t('common.active') : t('common.inactive')}
                </span>
            ),
        },
        {
            header: t('common.actions'),
            id: 'actions',
            cell: ({ row }) => (
                <div className="text-right">
                    <div className="action-button-group inline-flex">
                        <button className="action-button" onClick={() => handleOpenModal(row.original)} title={t('common.edit')}>
                            <Edit size={16} />
                        </button>
                        <button className="action-button" onClick={() => handleDelete(row.original)} title={t('common.delete')}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ),
        },
    ], [t]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('warehouses.title')}</h1>
                <p className="text-secondary">{t('warehouses.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('warehouses.newWarehouse')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={armazens} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('warehouses.editWarehouse') : t('warehouses.newWarehouse')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('warehouses.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('warehouses.category')}</label>
                                    <SearchSelect options={categorias} value={categorias.find(c => c.value === formData.categoriaId) || null} onChange={(opt) => setFormData({ ...formData, categoriaId: (opt?.value as string) || '' })} isClearable />
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('common.status')}</label>
                                    <input type="checkbox" className="toggle toggle-primary" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} />
                                </div>
                            </div>
                            <div className="glass-modal-footer">
                                <button type="button" className="glass-modal-button-secondary" onClick={handleCloseModal}>{t('common.cancel')}</button>
                                <button type="submit" className="glass-modal-button-primary">{t('common.save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="glass-modal-backdrop" onClick={handleCloseDelete}>
                    <div className="glass-modal glass-modal-confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{t('common.confirmDelete')}</h2>
                            <button onClick={handleCloseDelete}><X size={20} /></button>
                        </div>
                        <div className="glass-modal-body">
                            <p>{t('warehouses.deleteConfirm', { name: deleteTarget.nome })}</p>
                        </div>
                        <div className="glass-modal-footer">
                            <button type="button" className="glass-modal-button-secondary" onClick={handleCloseDelete}>{t('common.cancel')}</button>
                            <button type="button" className="glass-modal-button-primary" onClick={handleConfirmDelete}>{t('common.confirm')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

