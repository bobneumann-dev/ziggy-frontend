import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import api from '../lib/api';
import { type MovimentoEstoque, TipoMovimentoEstoque } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function EstoqueMovimentos() {
    const { t } = useTranslation();
    const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<{
        tipo: TipoMovimentoEstoque;
        itemCatalogoId: string;
        armazemOrigemId: string;
        armazemDestinoId: string;
        quantidade: number;
        observacao: string;
    }>({ tipo: TipoMovimentoEstoque.Entrada, itemCatalogoId: '', armazemOrigemId: '', armazemDestinoId: '', quantidade: 1, observacao: '' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [armazens, setArmazens] = useState<SearchSelectOption[]>([]);
    const [itens, setItens] = useState<SearchSelectOption[]>([]);

    const fetchMovimentos = useCallback(async () => {
        try {
            const res = await api.get('/api/estoque/movimentos');
            setMovimentos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchArmazens = useCallback(async () => {
        try {
            const res = await api.get('/api/armazens');
            setArmazens(res.data.map((a: any) => ({ label: a.nome, value: a.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchItens = useCallback(async () => {
        try {
            const res = await api.get('/api/catalogo/itens?estocavel=true');
            setItens(res.data.map((i: any) => ({ label: `${i.codigo} - ${i.nome}`, value: i.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchMovimentos();
        fetchArmazens();
        fetchItens();
    }, [fetchMovimentos, fetchArmazens, fetchItens]);

    const getTipoLabel = (tipo: number) => {
        switch (tipo) {
            case TipoMovimentoEstoque.Entrada: return t('stock.typeEntry');
            case TipoMovimentoEstoque.Saida: return t('stock.typeExit');
            case TipoMovimentoEstoque.Transferencia: return t('stock.typeTransfer');
            case TipoMovimentoEstoque.Ajuste: return t('stock.typeAdjust');
            default: return '';
        }
    };

    const tipoOptions = useMemo<SearchSelectOption[]>(() => [
        { label: t('stock.typeEntry'), value: String(TipoMovimentoEstoque.Entrada) },
        { label: t('stock.typeExit'), value: String(TipoMovimentoEstoque.Saida) },
        { label: t('stock.typeTransfer'), value: String(TipoMovimentoEstoque.Transferencia) },
        { label: t('stock.typeAdjust'), value: String(TipoMovimentoEstoque.Ajuste) },
    ], [t]);

    const handleOpenModal = () => {
        setFormData({ tipo: TipoMovimentoEstoque.Entrada, itemCatalogoId: '', armazemOrigemId: '', armazemDestinoId: '', quantidade: 1, observacao: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setFormErrors({});
        if (!formData.itemCatalogoId) {
            setFormErrors({ itemCatalogoId: 'Item obrigatório' });
            return;
        }
        if (formData.tipo === TipoMovimentoEstoque.Entrada && !formData.armazemDestinoId) {
            setFormErrors({ armazemDestinoId: 'Armazém de destino obrigatório' });
            return;
        }
        if (formData.tipo === TipoMovimentoEstoque.Saida && !formData.armazemOrigemId) {
            setFormErrors({ armazemOrigemId: 'Armazém de origem obrigatório' });
            return;
        }
        if (formData.tipo === TipoMovimentoEstoque.Transferencia && (!formData.armazemOrigemId || !formData.armazemDestinoId)) {
            setFormErrors({ _global: 'Origem e destino obrigatórios para transferência' });
            return;
        }
        try {
            await api.post('/api/estoque/movimentos', {
                ...formData,
                armazemOrigemId: formData.armazemOrigemId || null,
                armazemDestinoId: formData.armazemDestinoId || null,
                observacao: formData.observacao || null,
            });
            fetchMovimentos();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const columns: ColumnDef<MovimentoEstoque>[] = useMemo(() => [
        { header: 'Data', accessorKey: 'dataCriacao', cell: ({ row }) => new Date(row.original.dataCriacao).toLocaleString('pt-BR') },
        {
            header: t('stock.warehouse') + ' (Tipo)',
            accessorKey: 'tipo',
            cell: ({ row }) => {
                const color = row.original.tipo === TipoMovimentoEstoque.Entrada ? 'success' : row.original.tipo === TipoMovimentoEstoque.Saida ? 'danger' : 'info';
                return <span className={`badge badge-${color}`}>{getTipoLabel(row.original.tipo)}</span>;
            },
        },
        { header: t('stock.item'), accessorKey: 'itemCatalogoNome' },
        { header: t('stock.origin'), accessorKey: 'armazemOrigemNome', cell: ({ row }) => row.original.armazemOrigemNome || '-' },
        { header: t('stock.destination'), accessorKey: 'armazemDestinoNome', cell: ({ row }) => row.original.armazemDestinoNome || '-' },
        { header: t('stock.quantity'), accessorKey: 'quantidade' },
        { header: t('stock.notes'), accessorKey: 'observacao', cell: ({ row }) => row.original.observacao || '-' },
    ], [t]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('stock.movementsTitle')}</h1>
                <p className="text-secondary">{t('stock.movementsDescription')}</p>
                <button onClick={handleOpenModal} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('stock.newMovement')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={movimentos} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{t('stock.newMovement')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('catalog.type')} <span className="glass-modal-required">*</span></label>
                                    <SearchSelect options={tipoOptions} value={tipoOptions.find(o => o.value === String(formData.tipo)) || null} onChange={(opt) => setFormData({ ...formData, tipo: Number(opt?.value) as TipoMovimentoEstoque })} />
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('stock.item')} <span className="glass-modal-required">*</span></label>
                                    <SearchSelect options={itens} value={itens.find(i => i.value === formData.itemCatalogoId) || null} onChange={(opt) => setFormData({ ...formData, itemCatalogoId: (opt?.value as string) || '' })} />
                                    {formErrors.itemCatalogoId && <div className="glass-modal-error">{formErrors.itemCatalogoId}</div>}
                                </div>
                                {(formData.tipo === TipoMovimentoEstoque.Saida || formData.tipo === TipoMovimentoEstoque.Transferencia) && (
                                    <div>
                                        <label className="glass-modal-label">{t('stock.origin')} <span className="glass-modal-required">*</span></label>
                                        <SearchSelect options={armazens} value={armazens.find(a => a.value === formData.armazemOrigemId) || null} onChange={(opt) => setFormData({ ...formData, armazemOrigemId: (opt?.value as string) || '' })} />
                                        {formErrors.armazemOrigemId && <div className="glass-modal-error">{formErrors.armazemOrigemId}</div>}
                                    </div>
                                )}
                                {(formData.tipo === TipoMovimentoEstoque.Entrada || formData.tipo === TipoMovimentoEstoque.Transferencia) && (
                                    <div>
                                        <label className="glass-modal-label">{t('stock.destination')} <span className="glass-modal-required">*</span></label>
                                        <SearchSelect options={armazens} value={armazens.find(a => a.value === formData.armazemDestinoId) || null} onChange={(opt) => setFormData({ ...formData, armazemDestinoId: (opt?.value as string) || '' })} />
                                        {formErrors.armazemDestinoId && <div className="glass-modal-error">{formErrors.armazemDestinoId}</div>}
                                    </div>
                                )}
                                <div>
                                    <label className="glass-modal-label">{t('stock.quantity')} <span className="glass-modal-required">*</span></label>
                                    <input type="number" min="1" className="glass-modal-input" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('stock.notes')}</label>
                                    <textarea className="glass-modal-input" rows={2} value={formData.observacao} onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} />
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

