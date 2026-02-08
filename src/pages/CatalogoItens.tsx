import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type ItemCatalogo, TipoItemCatalogo } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function CatalogoItens() {
    const { t } = useTranslation();
    const [itens, setItens] = useState<ItemCatalogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        codigo: '', nome: '', tipo: TipoItemCatalogo.Produto, categoriaId: '', unidade: 'UN', precoBase: 0, precoMinimo: 0,
        vendavel: true, compravel: false, estocavel: true, serializado: false, atribuicaoId: '', moedaId: '', ativo: true
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<ItemCatalogo | null>(null);
    const [categorias, setCategorias] = useState<SearchSelectOption[]>([]);
    const [atribuicoes, setAtribuicoes] = useState<SearchSelectOption[]>([]);
    const [moedas, setMoedas] = useState<SearchSelectOption[]>([]);

    const fetchItens = useCallback(async () => {
        try {
            const res = await api.get('/api/catalogo/itens');
            setItens(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategorias = useCallback(async () => {
        try {
            const res = await api.get('/api/catalogo/categorias');
            setCategorias(res.data.map((c: any) => ({ label: c.nome, value: c.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAtribuicoes = useCallback(async () => {
        try {
            const res = await api.get('/api/atribuicoes');
            setAtribuicoes(res.data.map((a: any) => ({ label: a.nome, value: a.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchMoedas = useCallback(async () => {
        try {
            const res = await api.get('/api/moedas/ativas');
            const moedasOptions = res.data.map((m: any) => ({ label: `${m.codigo} - ${m.nome}`, value: m.id }));
            setMoedas(moedasOptions);
            // Auto-select first currency when opening create modal if only one exists
            if (moedasOptions.length > 0 && !editingId) {
                setFormData(prev => ({ ...prev, moedaId: moedasOptions[0].value }));
            }
        } catch (err) {
            console.error(err);
        }
    }, [editingId]);

    useEffect(() => {
        fetchItens();
        fetchCategorias();
        fetchAtribuicoes();
        fetchMoedas();
    }, [fetchItens, fetchCategorias, fetchAtribuicoes, fetchMoedas]);

    const tipoOptions = useMemo<SearchSelectOption[]>(() => [
        { label: t('catalog.typeProduct'), value: String(TipoItemCatalogo.Produto) },
        { label: t('catalog.typeService'), value: String(TipoItemCatalogo.Servico) },
    ], [t]);

    const presets = [
        { label: t('catalog.presetProduct'), tipo: TipoItemCatalogo.Produto, vendavel: true, compravel: true, estocavel: true, serializado: false },
        { label: t('catalog.presetEquipment'), tipo: TipoItemCatalogo.Produto, vendavel: true, compravel: true, estocavel: false, serializado: true },
        { label: t('catalog.presetInternalAsset'), tipo: TipoItemCatalogo.Produto, vendavel: false, compravel: true, estocavel: false, serializado: true },
        { label: t('catalog.presetService'), tipo: TipoItemCatalogo.Servico, vendavel: true, compravel: false, estocavel: false, serializado: false },
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        setFormData({ ...formData, tipo: preset.tipo, vendavel: preset.vendavel, compravel: preset.compravel, estocavel: preset.estocavel, serializado: preset.serializado });
    };

    const handleOpenModal = (item?: ItemCatalogo) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                codigo: item.codigo, nome: item.nome, tipo: item.tipo, categoriaId: item.categoriaId || '',
                unidade: item.unidade, precoBase: item.precoBase || 0, precoMinimo: item.precoMinimo || 0, vendavel: item.vendavel, compravel: item.compravel,
                estocavel: item.estocavel, serializado: item.serializado, atribuicaoId: item.atribuicaoId || '', moedaId: item.moedaId || '', ativo: item.ativo
            });
        } else {
            setEditingId(null);
            const defaultMoedaId = moedas.length > 0 ? moedas[0].value : '';
            setFormData({ codigo: '', nome: '', tipo: TipoItemCatalogo.Produto, categoriaId: '', unidade: 'UN', precoBase: 0, precoMinimo: 0, vendavel: true, compravel: false, estocavel: true, serializado: false, atribuicaoId: '', moedaId: defaultMoedaId, ativo: true });
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
        if (!formData.codigo.trim() || !formData.nome.trim()) {
            setFormErrors({ codigo: !formData.codigo.trim() ? 'Código obrigatório' : '', nome: !formData.nome.trim() ? 'Nome obrigatório' : '' });
            return;
        }
        if (formData.tipo === TipoItemCatalogo.Servico && (formData.estocavel || formData.serializado)) {
            setFormErrors({ _global: 'Serviço não pode ser estocável ou serializado' });
            return;
        }
        try {
            const payload = { ...formData, categoriaId: formData.categoriaId || null, atribuicaoId: formData.atribuicaoId || null, precoBase: formData.precoBase || null, precoMinimo: formData.precoMinimo || null };
            if (editingId) {
                await api.put(`/api/catalogo/itens/${editingId}`, payload);
            } else {
                await api.post('/api/catalogo/itens', payload);
            }
            fetchItens();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (item: ItemCatalogo) => {
        setDeleteTarget(item);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/catalogo/itens/${deleteTarget.id}`);
            fetchItens();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<ItemCatalogo>[] = useMemo(() => [
        { header: t('catalog.code'), accessorKey: 'codigo' },
        { header: t('catalog.name'), accessorKey: 'nome' },
        {
            header: t('catalog.type'),
            accessorKey: 'tipo',
            cell: ({ row }) => <span className="badge badge-info">{row.original.tipo === TipoItemCatalogo.Produto ? t('catalog.typeProduct') : t('catalog.typeService')}</span>,
        },
        { header: t('catalog.category'), accessorKey: 'categoriaNome', cell: ({ row }) => row.original.categoriaNome || '-' },
        { header: t('catalog.unit'), accessorKey: 'unidade' },
        {
            header: t('catalog.basePrice'),
            accessorKey: 'precoBase',
            cell: ({ row }) => {
                const price = row.original.precoBase;
                const symbol = row.original.moedaSimbolo || '';
                return price != null ? `${symbol} ${price.toFixed(2)}` : '-';
            }
        },
        {
            header: 'Flags',
            id: 'flags',
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {row.original.vendavel && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Vend</span>}
                    {row.original.compravel && <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Comp</span>}
                    {row.original.estocavel && <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Estq</span>}
                    {row.original.serializado && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Ser</span>}
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
                <h1 className="page-title">{t('catalog.title')}</h1>
                <p className="text-secondary">{t('catalog.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('catalog.newItem')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={itens} searchPlaceholder={t('table.searchPlaceholder')} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('catalog.editItem') : t('catalog.newItem')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="glass-modal-label">{t('catalog.createAs')}</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {presets.map((p, idx) => <button key={idx} type="button" onClick={() => applyPreset(p)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.375rem', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}>{p.label}</button>)}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.code')} <span className="glass-modal-required">*</span></label>
                                        <input type="text" className="glass-modal-input" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                                        {formErrors.codigo && <div className="glass-modal-error">{formErrors.codigo}</div>}
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.name')} <span className="glass-modal-required">*</span></label>
                                        <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
                                        {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.type')} <span className="glass-modal-required">*</span></label>
                                        <SearchSelect options={tipoOptions} value={tipoOptions.find(o => o.value === String(formData.tipo)) || null} onChange={(opt) => setFormData({ ...formData, tipo: Number(opt?.value || TipoItemCatalogo.Produto) })} />
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.category')}</label>
                                        <SearchSelect options={categorias} value={categorias.find(c => c.value === formData.categoriaId) || null} onChange={(opt) => setFormData({ ...formData, categoriaId: (opt?.value as string) || '' })} isClearable />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.unit')}</label>
                                        <input type="text" className="glass-modal-input" value={formData.unidade} onChange={(e) => setFormData({ ...formData, unidade: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.basePrice')}</label>
                                        <input type="number" step="0.01" className="glass-modal-input" value={formData.precoBase} onChange={(e) => setFormData({ ...formData, precoBase: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">Preço Mínimo</label>
                                        <input type="number" step="0.01" className="glass-modal-input" value={formData.precoMinimo} onChange={(e) => setFormData({ ...formData, precoMinimo: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="glass-modal-label">Moeda</label>
                                    <SearchSelect options={moedas} value={moedas.find(m => m.value === formData.moedaId) || null} onChange={(opt) => setFormData({ ...formData, moedaId: (opt?.value as string) || '' })} isClearable />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                                    <label><input type="checkbox" checked={formData.vendavel} onChange={(e) => setFormData({ ...formData, vendavel: e.target.checked })} /> {t('catalog.sellable')}</label>
                                    <label><input type="checkbox" checked={formData.compravel} onChange={(e) => setFormData({ ...formData, compravel: e.target.checked })} /> {t('catalog.purchasable')}</label>
                                    <label><input type="checkbox" checked={formData.estocavel} onChange={(e) => setFormData({ ...formData, estocavel: e.target.checked })} disabled={formData.tipo === TipoItemCatalogo.Servico} /> {t('catalog.stockable')}</label>
                                    <label><input type="checkbox" checked={formData.serializado} onChange={(e) => setFormData({ ...formData, serializado: e.target.checked })} disabled={formData.tipo === TipoItemCatalogo.Servico} /> {t('catalog.serialized')}</label>
                                </div>
                                {formData.tipo === TipoItemCatalogo.Servico && (
                                    <div>
                                        <label className="glass-modal-label">{t('catalog.attribution')}</label>
                                        <SearchSelect options={atribuicoes} value={atribuicoes.find(a => a.value === formData.atribuicaoId) || null} onChange={(opt) => setFormData({ ...formData, atribuicaoId: (opt?.value as string) || '' })} isClearable />
                                    </div>
                                )}
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
                            <p>{t('catalog.deleteConfirm', { name: deleteTarget.nome })}</p>
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

