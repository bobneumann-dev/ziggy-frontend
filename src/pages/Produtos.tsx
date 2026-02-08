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

export default function Produtos() {
    const { t } = useTranslation();
    const [itens, setItens] = useState<ItemCatalogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        codigo: '', nome: '', categoriaId: '', unidade: 'UN', precoBase: 0, precoMinimo: 0, moedaId: '', ativo: true
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<ItemCatalogo | null>(null);
    const [categorias, setCategorias] = useState<SearchSelectOption[]>([]);
    const [moedas, setMoedas] = useState<SearchSelectOption[]>([]);

    const fetchItens = useCallback(async () => {
        try {
            const res = await api.get('/api/catalogo/itens');
            // Filter only products (non-serialized)
            setItens(res.data.filter((i: ItemCatalogo) => i.tipo === TipoItemCatalogo.Produto && !i.serializado));
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

    const fetchMoedas = useCallback(async () => {
        try {
            const res = await api.get('/api/moedas/ativas');
            const moedasOptions = res.data.map((m: any) => ({ label: `${m.codigo} - ${m.nome}`, value: m.id }));
            setMoedas(moedasOptions);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchItens();
        fetchCategorias();
        fetchMoedas();
    }, [fetchItens, fetchCategorias, fetchMoedas]);

    const handleOpenModal = (item?: ItemCatalogo) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                codigo: item.codigo, nome: item.nome, categoriaId: item.categoriaId || '',
                unidade: item.unidade, precoBase: item.precoBase || 0, precoMinimo: item.precoMinimo || 0,
                moedaId: item.moedaId || '', ativo: item.ativo
            });
        } else {
            setEditingId(null);
            const defaultMoedaId = moedas.length > 0 ? moedas[0].value : '';
            setFormData({ codigo: '', nome: '', categoriaId: '', unidade: 'UN', precoBase: 0, precoMinimo: 0, moedaId: defaultMoedaId, ativo: true });
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
        try {
            // Pre-configure product settings
            const payload = {
                ...formData,
                tipo: TipoItemCatalogo.Produto,
                vendavel: true,
                compravel: true,
                estocavel: true,
                serializado: false,
                categoriaId: formData.categoriaId || null,
                atribuicaoId: null,
                precoBase: formData.precoBase || null,
                precoMinimo: formData.precoMinimo || null,
                moedaId: formData.moedaId || null
            };
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
                <h1 className="page-title">Produtos</h1>
                <p className="text-secondary">Gerencie os produtos comercializados e estocáveis</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>Novo Produto</span>
                </button>
            </div>

            <DataTable columns={columns} data={itens} searchPlaceholder={t('table.searchPlaceholder')} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
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
                                <div>
                                    <label className="glass-modal-label">{t('catalog.category')}</label>
                                    <SearchSelect options={categorias} value={categorias.find(c => c.value === formData.categoriaId) || null} onChange={(opt) => setFormData({ ...formData, categoriaId: (opt?.value as string) || '' })} isClearable />
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
                            <p>Tem certeza que deseja excluir o produto <strong>{deleteTarget.nome}</strong>?</p>
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

