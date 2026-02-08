import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type Moeda } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Moedas() {
    const { t } = useTranslation();
    const [moedas, setMoedas] = useState<Moeda[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nome: '', codigo: '', simbolo: '', ativo: true });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<Moeda | null>(null);

    const fetchMoedas = useCallback(async () => {
        try {
            const res = await api.get('/api/moedas');
            setMoedas(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMoedas();
    }, [fetchMoedas]);

    const handleOpenModal = (moeda?: Moeda) => {
        if (moeda) {
            setEditingId(moeda.id);
            setFormData({ nome: moeda.nome, codigo: moeda.codigo, simbolo: moeda.simbolo, ativo: moeda.ativo });
        } else {
            setEditingId(null);
            setFormData({ nome: '', codigo: '', simbolo: '', ativo: true });
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
            setFormErrors({ nome: 'Nome é obrigatório' });
            return;
        }
        if (!formData.codigo.trim() || formData.codigo.length !== 3) {
            setFormErrors({ codigo: 'Código deve ter 3 caracteres (ex: BRL, USD, EUR)' });
            return;
        }
        if (!formData.simbolo.trim()) {
            setFormErrors({ simbolo: 'Símbolo é obrigatório' });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/moedas/${editingId}`, formData);
            } else {
                await api.post('/api/moedas', formData);
            }
            fetchMoedas();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (moeda: Moeda) => {
        setDeleteTarget(moeda);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/moedas/${deleteTarget.id}`);
            fetchMoedas();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Moeda>[] = useMemo(() => [
        { header: 'Código', accessorKey: 'codigo' },
        { header: 'Nome', accessorKey: 'nome' },
        { header: 'Símbolo', accessorKey: 'simbolo' },
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
                <h1 className="page-title">Moedas</h1>
                <p className="text-secondary">Cadastre e gerencie as moedas utilizadas no sistema</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>Nova Moeda</span>
                </button>
            </div>

            <DataTable columns={columns} data={moedas} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? 'Editar Moeda' : 'Nova Moeda'}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">Código ISO <span className="glass-modal-required">*</span></label>
                                    <input
                                        type="text"
                                        className="glass-modal-input"
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                        maxLength={3}
                                        placeholder="BRL, USD, EUR"
                                    />
                                    {formErrors.codigo && <div className="glass-modal-error">{formErrors.codigo}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">Nome <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Real Brasileiro, Dólar Americano" />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">Símbolo <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.simbolo} onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })} placeholder="R$, $, €" />
                                    {formErrors.simbolo && <div className="glass-modal-error">{formErrors.simbolo}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">
                                        <input type="checkbox" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} style={{ marginRight: '0.5rem' }} />
                                        Ativo
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
                            <p>Deseja remover a moeda {deleteTarget.codigo} - {deleteTarget.nome}?</p>
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

