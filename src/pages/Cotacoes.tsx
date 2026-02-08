import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type Cotacao } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Cotacoes() {
    const { t } = useTranslation();
    const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ moedaBaseId: '', moedaCotacaoId: '', taxaCompra: 0, taxaVenda: 0, data: new Date().toISOString().split('T')[0] });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<Cotacao | null>(null);
    const [moedas, setMoedas] = useState<SearchSelectOption[]>([]);

    const fetchCotacoes = useCallback(async () => {
        try {
            const res = await api.get('/api/cotacoes');
            setCotacoes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMoedas = useCallback(async () => {
        try {
            const res = await api.get('/api/moedas/ativas');
            setMoedas(res.data.map((m: any) => ({ label: `${m.codigo} - ${m.nome}`, value: m.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchMoedas();
        fetchCotacoes();
    }, [fetchMoedas, fetchCotacoes]);

    const handleOpenModal = (cotacao?: Cotacao) => {
        if (cotacao) {
            setEditingId(cotacao.id);
            setFormData({
                moedaBaseId: cotacao.moedaBaseId,
                moedaCotacaoId: cotacao.moedaCotacaoId,
                taxaCompra: cotacao.taxaCompra,
                taxaVenda: cotacao.taxaVenda,
                data: new Date(cotacao.data).toISOString().split('T')[0]
            });
        } else {
            setEditingId(null);
            setFormData({ moedaBaseId: '', moedaCotacaoId: '', taxaCompra: 0, taxaVenda: 0, data: new Date().toISOString().split('T')[0] });
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
        if (!formData.moedaBaseId) {
            setFormErrors({ moedaBase: 'Moeda base é obrigatória' });
            return;
        }
        if (!formData.moedaCotacaoId) {
            setFormErrors({ moedaCotacao: 'Moeda de cotação é obrigatória' });
            return;
        }
        if (formData.moedaBaseId === formData.moedaCotacaoId) {
            setFormErrors({ moedaCotacao: 'Moeda base e moeda de cotação devem ser diferentes' });
            return;
        }
        if (formData.taxaCompra <= 0 || formData.taxaVenda <= 0) {
            setFormErrors({ taxas: 'Taxas devem ser maiores que zero' });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/cotacoes/${editingId}`, { taxaCompra: formData.taxaCompra, taxaVenda: formData.taxaVenda, data: formData.data });
            } else {
                await api.post('/api/cotacoes', formData);
            }
            fetchCotacoes();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (cotacao: Cotacao) => {
        setDeleteTarget(cotacao);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/cotacoes/${deleteTarget.id}`);
            fetchCotacoes();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Cotacao>[] = useMemo(() => [
        {
            header: 'Par de Moedas',
            accessorKey: 'moedaBaseCodigo',
            cell: ({ row }) => <span>{row.original.moedaBaseCodigo} / {row.original.moedaCotacaoCodigo}</span>
        },
        {
            header: 'Taxa Compra',
            accessorKey: 'taxaCompra',
            cell: ({ row }) => row.original.taxaCompra.toFixed(4)
        },
        {
            header: 'Taxa Venda',
            accessorKey: 'taxaVenda',
            cell: ({ row }) => row.original.taxaVenda.toFixed(4)
        },
        {
            header: 'Data',
            accessorKey: 'data',
            cell: ({ row }) => new Date(row.original.data).toLocaleDateString('pt-BR')
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
                <h1 className="page-title">Cotações de Moedas</h1>
                <p className="text-secondary">Cadastre e gerencie as taxas de câmbio entre moedas</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>Nova Cotação</span>
                </button>
            </div>

            <DataTable columns={columns} data={cotacoes} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? 'Editar Cotação' : 'Nova Cotação'}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">Moeda Base <span className="glass-modal-required">*</span></label>
                                        <SearchSelect
                                            options={moedas}
                                            value={moedas.find(m => m.value === formData.moedaBaseId) || null}
                                            onChange={(opt) => setFormData({ ...formData, moedaBaseId: (opt?.value as string) || '' })}
                                            isDisabled={!!editingId}
                                        />
                                        {formErrors.moedaBase && <div className="glass-modal-error">{formErrors.moedaBase}</div>}
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">Moeda Cotação <span className="glass-modal-required">*</span></label>
                                        <SearchSelect
                                            options={moedas}
                                            value={moedas.find(m => m.value === formData.moedaCotacaoId) || null}
                                            onChange={(opt) => setFormData({ ...formData, moedaCotacaoId: (opt?.value as string) || '' })}
                                            isDisabled={!!editingId}
                                        />
                                        {formErrors.moedaCotacao && <div className="glass-modal-error">{formErrors.moedaCotacao}</div>}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">Taxa Compra <span className="glass-modal-required">*</span></label>
                                        <input type="number" step="0.000001" className="glass-modal-input" value={formData.taxaCompra} onChange={(e) => setFormData({ ...formData, taxaCompra: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">Taxa Venda <span className="glass-modal-required">*</span></label>
                                        <input type="number" step="0.000001" className="glass-modal-input" value={formData.taxaVenda} onChange={(e) => setFormData({ ...formData, taxaVenda: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                {formErrors.taxas && <div className="glass-modal-error">{formErrors.taxas}</div>}
                                <div>
                                    <label className="glass-modal-label">Data <span className="glass-modal-required">*</span></label>
                                    <input type="date" className="glass-modal-input" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} />
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
                            <p>Deseja remover a cotação {deleteTarget.moedaBaseCodigo}/{deleteTarget.moedaCotacaoCodigo}?</p>
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

