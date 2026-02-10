import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import type { CategoriaArmazem } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function CategoriaArmazens() {
    const { t } = useTranslation();
    const [categorias, setCategorias] = useState<CategoriaArmazem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', descricao: '', ativo: true });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<CategoriaArmazem | null>(null);

    const fetchCategorias = useCallback(async () => {
        try {
            const res = await api.get('/api/categoriaarmazens');
            setCategorias(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

    const handleOpenModal = (categoria?: CategoriaArmazem) => {
        if (categoria) {
            setEditingId(categoria.id);
            setFormData({ nome: categoria.nome, descricao: categoria.descricao || '', ativo: categoria.ativo });
        } else {
            setEditingId(null);
            setFormData({ nome: '', descricao: '', ativo: true });
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
            setFormErrors({ nome: t('warehouseCategories.validation.requiredName') });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/categoriaarmazens/${editingId}`, formData);
            } else {
                await api.post('/api/categoriaarmazens', formData);
            }
            fetchCategorias();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || t('warehouseCategories.validation.saveFailed') });
        }
    };

    const handleDelete = (categoria: CategoriaArmazem) => {
        setDeleteTarget(categoria);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/categoriaarmazens/${deleteTarget.id}`);
            fetchCategorias();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<CategoriaArmazem>[] = useMemo(() => [
        { header: t('warehouseCategories.name'), accessorKey: 'nome' },
        { header: t('warehouseCategories.categoryDescription'), accessorKey: 'descricao', cell: ({ row }) => row.original.descricao || '-' },
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
            header: t('table.actions'),
            id: 'actions',
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenModal(row.original)} className="action-button action-button-edit">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(row.original)} className="action-button action-button-delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ], [t]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('warehouseCategories.title')}</h1>
                <p className="text-secondary">{t('warehouseCategories.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('warehouseCategories.newCategory')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={categorias} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('warehouseCategories.editCategory') : t('warehouseCategories.newCategory')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('warehouseCategories.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('warehouseCategories.categoryDescription')}</label>
                                    <textarea className="glass-modal-input" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={3} />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} />
                                        {t('common.active')}
                                    </label>
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
                            <p>{t('warehouseCategories.deleteConfirm', { name: deleteTarget.nome })}</p>
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

