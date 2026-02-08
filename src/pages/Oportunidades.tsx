import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, X, DollarSign } from 'lucide-react';
import api from '../lib/api';
import { type Oportunidade, EstagioFunil } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Oportunidades() {
    const { t } = useTranslation();
    const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ clienteId: '', titulo: '', estagio: EstagioFunil.Lead });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [clientes, setClientes] = useState<SearchSelectOption[]>([]);
    const [closing, setClosing] = useState<string | null>(null);

    const fetchOportunidades = useCallback(async () => {
        try {
            const res = await api.get('/api/oportunidades');
            setOportunidades(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchClientes = useCallback(async () => {
        try {
            const res = await api.get('/api/clientes-fornecedores?isCliente=true');
            setClientes(res.data.map((c: any) => ({ label: c.nomeRazaoSocial, value: c.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchOportunidades();
        fetchClientes();
    }, [fetchOportunidades, fetchClientes]);

    const getEstagioLabel = (estagio: number) => {
        switch (estagio) {
            case EstagioFunil.Lead: return t('opportunities.stageLead');
            case EstagioFunil.Qualificacao: return t('opportunities.stageQualification');
            case EstagioFunil.Visita: return t('opportunities.stageVisit');
            case EstagioFunil.Proposta: return t('opportunities.stageProposal');
            case EstagioFunil.Negociacao: return t('opportunities.stageNegotiation');
            case EstagioFunil.Ganha: return t('opportunities.stageWon');
            case EstagioFunil.Perdida: return t('opportunities.stageLost');
            default: return '';
        }
    };

    const estagioOptions = useMemo<SearchSelectOption[]>(() => [
        { label: t('opportunities.stageLead'), value: String(EstagioFunil.Lead) },
        { label: t('opportunities.stageQualification'), value: String(EstagioFunil.Qualificacao) },
        { label: t('opportunities.stageVisit'), value: String(EstagioFunil.Visita) },
        { label: t('opportunities.stageProposal'), value: String(EstagioFunil.Proposta) },
        { label: t('opportunities.stageNegotiation'), value: String(EstagioFunil.Negociacao) },
        { label: t('opportunities.stageWon'), value: String(EstagioFunil.Ganha) },
        { label: t('opportunities.stageLost'), value: String(EstagioFunil.Perdida) },
    ], [t]);

    const handleOpenModal = (oportunidade?: Oportunidade) => {
        if (oportunidade) {
            setEditingId(oportunidade.id);
            setFormData({ clienteId: oportunidade.clienteId, titulo: oportunidade.titulo, estagio: oportunidade.estagio });
        } else {
            setEditingId(null);
            setFormData({ clienteId: '', titulo: '', estagio: EstagioFunil.Lead });
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
        if (!formData.clienteId || !formData.titulo.trim()) {
            setFormErrors({ clienteId: !formData.clienteId ? 'Cliente obrigatório' : '', titulo: !formData.titulo.trim() ? 'Título obrigatório' : '' });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/oportunidades/${editingId}`, formData);
            } else {
                await api.post('/api/oportunidades', formData);
            }
            fetchOportunidades();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleCloseSale = async (oportunidadeId: string) => {
        setClosing(oportunidadeId);
        try {
            await api.post(`/api/oportunidades/${oportunidadeId}/fechar`);
            fetchOportunidades();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Erro ao fechar venda');
        } finally {
            setClosing(null);
        }
    };

    const columns: ColumnDef<Oportunidade>[] = useMemo(() => [
        { header: t('opportunities.client'), accessorKey: 'clienteNome' },
        { header: t('opportunities.titleField'), accessorKey: 'titulo' },
        {
            header: t('opportunities.stage'),
            accessorKey: 'estagio',
            cell: ({ row }) => {
                const color = row.original.estagio === EstagioFunil.Ganha ? 'success' : row.original.estagio === EstagioFunil.Perdida ? 'danger' : 'info';
                return <span className={`badge badge-${color}`}>{getEstagioLabel(row.original.estagio)}</span>;
            },
        },
        {
            header: t('opportunities.totalValue'),
            accessorKey: 'valorTotal',
            cell: ({ row }) => `R$ ${row.original.valorTotal.toFixed(2)}`
        },
        {
            header: t('common.actions'),
            id: 'actions',
            cell: ({ row }) => (
                <div className="action-button-group">
                    {!row.original.readOnly && (
                        <button
                            className="action-button"
                            onClick={() => handleCloseSale(row.original.id)}
                            disabled={closing === row.original.id}
                            title={t('opportunities.close sale')}
                        >
                            {closing === row.original.id ? '...' : <DollarSign size={16} />}
                        </button>
                    )}
                    <button className="action-button" onClick={() => handleOpenModal(row.original)} title={t('common.edit')} disabled={row.original.readOnly}>
                        <Edit size={16} />
                    </button>
                </div>
            ),
        },
    ], [t, closing]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('opportunities.title')}</h1>
                <p className="text-secondary">{t('opportunities.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('opportunities.newOpportunity')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={oportunidades} searchPlaceholder={t('table.searchPlaceholder')} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('opportunities.editOpportunity') : t('opportunities.newOpportunity')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('opportunities.client')} <span className="glass-modal-required">*</span></label>
                                    <SearchSelect options={clientes} value={formData.clienteId} onChange={(val) => setFormData({ ...formData, clienteId: val || '' })} />
                                    {formErrors.clienteId && <div className="glass-modal-error">{formErrors.clienteId}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('opportunities.titleField')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
                                    {formErrors.titulo && <div className="glass-modal-error">{formErrors.titulo}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('opportunities.stage')}</label>
                                    <SearchSelect options={estagioOptions} value={String(formData.estagio)} onChange={(val) => setFormData({ ...formData, estagio: Number(val) })} />
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
        </div>
    );
}

