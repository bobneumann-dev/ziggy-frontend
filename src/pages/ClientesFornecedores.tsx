import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type ClienteFornecedor } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

type FilterType = 'all' | 'clients' | 'suppliers';

export default function ClientesFornecedores() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<ClienteFornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nomeRazaoSocial: '', documento: '', email: '', telefone: '', isCliente: true, isFornecedor: false, status: 1 });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<ClienteFornecedor | null>(null);
    const [filterType, setFilterType] = useState<FilterType>('all');

    const fetchRecords = useCallback(async () => {
        try {
            const res = await api.get('/api/clientes-fornecedores');
            setRecords(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const filteredRecords = useMemo(() => {
        if (filterType === 'clients') return records.filter(r => r.isCliente);
        if (filterType === 'suppliers') return records.filter(r => r.isFornecedor);
        return records;
    }, [records, filterType]);

    const handleOpenModal = (record?: ClienteFornecedor) => {
        if (record) {
            setEditingId(record.id);
            setFormData({ nomeRazaoSocial: record.nomeRazaoSocial, documento: record.documento || '', email: record.email || '', telefone: record.telefone || '', isCliente: record.isCliente, isFornecedor: record.isFornecedor, status: record.status });
        } else {
            setEditingId(null);
            setFormData({ nomeRazaoSocial: '', documento: '', email: '', telefone: '', isCliente: true, isFornecedor: false, status: 1 });
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
        if (!formData.nomeRazaoSocial.trim()) {
            setFormErrors({ nomeRazaoSocial: 'Nome obrigatório' });
            return;
        }
        if (!formData.isCliente && !formData.isFornecedor) {
            setFormErrors({ _global: 'Marque pelo menos Cliente ou Fornecedor' });
            return;
        }
        try {
            const payload = { ...formData, documento: formData.documento || null, email: formData.email || null, telefone: formData.telefone || null };
            if (editingId) {
                await api.put(`/api/clientes-fornecedores/${editingId}`, payload);
            } else {
                await api.post('/api/clientes-fornecedores', payload);
            }
            fetchRecords();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (record: ClienteFornecedor) => {
        setDeleteTarget(record);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/clientes-fornecedores/${deleteTarget.id}`);
            fetchRecords();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<ClienteFornecedor>[] = useMemo(() => [
        { header: t('clients.name'), accessorKey: 'nomeRazaoSocial' },
        { header: t('clients.document'), accessorKey: 'documento', cell: ({ row }) => row.original.documento || '-' },
        { header: t('clients.email'), accessorKey: 'email', cell: ({ row }) => row.original.email || '-' },
        { header: t('clients.phone'), accessorKey: 'telefone', cell: ({ row }) => row.original.telefone || '-' },
        {
            header: 'Tipo',
            id: 'tipo',
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {row.original.isCliente && <span className="badge badge-success">Cliente</span>}
                    {row.original.isFornecedor && <span className="badge badge-info">Fornecedor</span>}
                </div>
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
                <h1 className="page-title">{t('clients.title')}</h1>
                <p className="text-secondary">{t('clients.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('clients.newRecord')}</span>
                </button>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className={`filter-badge ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>{t('clients.filterAll')}</button>
                <button className={`filter-badge ${filterType === 'clients' ? 'active' : ''}`} onClick={() => setFilterType('clients')}>{t('clients.filterClients')}</button>
                <button className={`filter-badge ${filterType === 'suppliers' ? 'active' : ''}`} onClick={() => setFilterType('suppliers')}>{t('clients.filterSuppliers')}</button>
            </div>

            <DataTable columns={columns} data={filteredRecords} searchPlaceholder={t('table.searchPlaceholder')} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('clients.editRecord') : t('clients.newRecord')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('clients.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nomeRazaoSocial} onChange={(e) => setFormData({ ...formData, nomeRazaoSocial: e.target.value })} />
                                    {formErrors.nomeRazaoSocial && <div className="glass-modal-error">{formErrors.nomeRazaoSocial}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('clients.document')}</label>
                                    <input type="text" className="glass-modal-input" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">{t('clients.email')}</label>
                                        <input type="email" className="glass-modal-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">{t('clients.phone')}</label>
                                        <input type="text" className="glass-modal-input" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={formData.isCliente} onChange={(e) => setFormData({ ...formData, isCliente: e.target.checked })} />
                                        {t('clients.isClient')}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={formData.isFornecedor} onChange={(e) => setFormData({ ...formData, isFornecedor: e.target.checked })} />
                                        {t('clients.isSupplier')}
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
                            <p>{t('clients.deleteConfirm', { name: deleteTarget.nomeRazaoSocial })}</p>
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

