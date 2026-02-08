import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X, FileCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { type ModeloContrato } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function ModelosContrato() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [modelos, setModelos] = useState<ModeloContrato[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', descricao: '', versao: 1, ativo: true });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<ModeloContrato | null>(null);

    const fetchModelos = useCallback(async () => {
        try {
            const res = await api.get('/api/modelos-contrato');
            setModelos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModelos();
    }, [fetchModelos]);

    const handleOpenModal = (modelo?: ModeloContrato) => {
        if (modelo) {
            setEditingId(modelo.id);
            setFormData({ nome: modelo.nome, descricao: modelo.descricao || '', versao: modelo.versao, ativo: modelo.ativo });
        } else {
            setEditingId(null);
            setFormData({ nome: '', descricao: '', versao: 1, ativo: true });
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
            const payload = { ...formData, descricao: formData.descricao || null };
            if (editingId) {
                await api.put(`/api/modelos-contrato/${editingId}`, payload);
            } else {
                await api.post('/api/modelos-contrato', payload);
            }
            fetchModelos();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (modelo: ModeloContrato) => {
        setDeleteTarget(modelo);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/modelos-contrato/${deleteTarget.id}`);
            fetchModelos();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<ModeloContrato>[] = useMemo(() => [
        { header: t('contractTemplates.name'), accessorKey: 'nome' },
        { header: t('contractTemplates.version'), accessorKey: 'versao' },
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
                        <button className="action-button" onClick={() => navigate(`/admin/comercial/modelos-contrato/editor?id=${row.original.id}`)} title="Editor completo">
                            <FileCode size={16} />
                        </button>
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
    ], [t, navigate]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('contractTemplates.title')}</h1>
                <p className="text-secondary">{t('contractTemplates.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('contractTemplates.newTemplate')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={modelos} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('contractTemplates.editTemplate') : t('contractTemplates.newTemplate')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('contractTemplates.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('attributions.description')}</label>
                                    <textarea className="glass-modal-input" rows={3} value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('contractTemplates.version')}</label>
                                    <input type="number" className="glass-modal-input" value={formData.versao} onChange={(e) => setFormData({ ...formData, versao: parseInt(e.target.value) || 1 })} />
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

