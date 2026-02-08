import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type ItemCategoria } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function CatalogoCategorias() {
    const { t } = useTranslation();
    const [categorias, setCategorias] = useState<ItemCategoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', codigo: '', categoriaPaiId: '', ordem: 0, ativo: true });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<ItemCategoria | null>(null);

    const fetchCategorias = useCallback(async () => {
        try {
            const res = await api.get('/api/catalogo/categorias');
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

    const categoriaOptions = useMemo<SearchSelectOption[]>(() =>
        categorias.map(c => ({ label: c.nome, value: c.id }))
        , [categorias]);

    const handleOpenModal = (cat?: ItemCategoria) => {
        if (cat) {
            setEditingId(cat.id);
            setFormData({ nome: cat.nome, codigo: cat.codigo || '', categoriaPaiId: cat.categoriaPaiId || '', ordem: cat.ordem, ativo: cat.ativo });
        } else {
            setEditingId(null);
            setFormData({ nome: '', codigo: '', categoriaPaiId: '', ordem: 0, ativo: true });
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
            setFormErrors({ nome: 'Nome obrigatório' });
            return;
        }
        try {
            const payload = { ...formData, codigo: formData.codigo || null, categoriaPaiId: formData.categoriaPaiId || null };
            if (editingId) {
                await api.put(`/api/catalogo/categorias/${editingId}`, payload);
            } else {
                await api.post('/api/catalogo/categorias', payload);
            }
            fetchCategorias();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (cat: ItemCategoria) => {
        setDeleteTarget(cat);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/catalogo/categorias/${deleteTarget.id}`);
            fetchCategorias();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<ItemCategoria>[] = useMemo(() => [
        { header: t('catalogCategories.name'), accessorKey: 'nome' },
        { header: t('catalogCategories.code'), accessorKey: 'codigo', cell: ({ row }) => row.original.codigo || '-' },
        { header: t('catalogCategories.parentCategory'), accessorKey: 'categoriaPaiNome', cell: ({ row }) => row.original.categoriaPaiNome || '-' },
        { header: t('catalogCategories.order'), accessorKey: 'ordem' },
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
                <h1 className="page-title">{t('catalogCategories.title')}</h1>
                <p className="text-secondary">{t('catalogCategories.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('catalogCategories.newCategory')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={categorias} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('catalogCategories.editCategory') : t('catalogCategories.newCategory')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('catalogCategories.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('catalogCategories.code')}</label>
                                    <input type="text" className="glass-modal-input" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('catalogCategories.parentCategory')}</label>
                                    <SearchSelect options={categoriaOptions} value={categoriaOptions.find(c => c.value === formData.categoriaPaiId) || null} onChange={(opt) => setFormData({ ...formData, categoriaPaiId: (opt?.value as string) || '' })} isClearable />
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('catalogCategories.order')}</label>
                                    <input type="number" className="glass-modal-input" value={formData.ordem} onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })} />
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
                            <p>Deseja remover {deleteTarget.nome}?</p>
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

