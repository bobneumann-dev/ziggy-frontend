import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';

import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

// Define specialized types locally if not yet in global types
interface AtivoPatrimonio {
    id: string;
    serial: string;
    itemCatalogoId: string;
    itemCatalogoNome: string;
    itemCatalogoCodigo: string;
    armazemAtualId: string;
    armazemAtualNome: string;
    status: number;
    clienteNome?: string;
    colaboradorNome?: string;
}

const statusOptions = [
    { value: 1, label: 'Disponível' },
    { value: 2, label: 'Reservado' },
    { value: 3, label: 'Em Uso' },
    { value: 4, label: 'Manutenção' },
    { value: 5, label: 'Baixado' },
];

export default function AtivosPatrimonio() {
    const { t } = useTranslation();
    const [ativos, setAtivos] = useState<AtivoPatrimonio[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        serial: '',
        itemCatalogoId: '',
        armazemAtualId: '',
        status: 1
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<AtivoPatrimonio | null>(null);

    // Select Options
    const [itensCatalogo, setItensCatalogo] = useState<SearchSelectOption[]>([]);
    const [armazens, setArmazens] = useState<SearchSelectOption[]>([]);

    const fetchAtivos = useCallback(async () => {
        try {
            const res = await api.get('/api/patrimonio/ativos');
            setAtivos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDropdowns = useCallback(async () => {
        try {
            const [itensRes, armazensRes] = await Promise.all([
                api.get('/api/catalogo/itens'),
                api.get('/api/armazens')
            ]);

            // Filter only serialized items
            const serializedItems = itensRes.data
                .filter((i: any) => i.serializado)
                .map((i: any) => ({ label: `${i.codigo} - ${i.nome}`, value: i.id }));

            setItensCatalogo(serializedItems);

            const armazemOpts = armazensRes.data.map((a: any) => ({ label: a.nome, value: a.id }));
            setArmazens(armazemOpts);

        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchAtivos();
        fetchDropdowns();
    }, [fetchAtivos, fetchDropdowns]);

    const handleOpenModal = (ativo?: AtivoPatrimonio) => {
        if (ativo) {
            setEditingId(ativo.id);
            setFormData({
                serial: ativo.serial,
                itemCatalogoId: ativo.itemCatalogoId,
                armazemAtualId: ativo.armazemAtualId,
                status: ativo.status
            });
        } else {
            setEditingId(null);
            setFormData({ serial: '', itemCatalogoId: '', armazemAtualId: '', status: 1 });
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

        if (!formData.serial.trim()) {
            setFormErrors({ serial: 'Serial é obrigatório' });
            return;
        }
        if (!formData.itemCatalogoId) {
            setFormErrors({ itemCatalogoId: 'Item é obrigatório' });
            return;
        }
        if (!formData.armazemAtualId) {
            setFormErrors({ armazemAtualId: 'Armazém é obrigatório' });
            return;
        }

        try {
            if (editingId) {
                await api.put(`/api/patrimonio/ativos/${editingId}`, formData);
            } else {
                await api.post('/api/patrimonio/ativos', formData);
            }
            fetchAtivos();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || 'Erro ao salvar' });
        }
    };

    const handleDelete = (ativo: AtivoPatrimonio) => {
        setDeleteTarget(ativo);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/patrimonio/ativos/${deleteTarget.id}`);
            fetchAtivos();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const getStatusLabel = (status: number) => {
        return statusOptions.find(s => s.value === status)?.label || '-';
    };

    const columns: ColumnDef<AtivoPatrimonio>[] = useMemo(() => [
        { header: 'Serial', accessorKey: 'serial' },
        { header: 'Item', accessorKey: 'itemCatalogoNome', cell: ({ row }) => `${row.original.itemCatalogoCodigo} - ${row.original.itemCatalogoNome}` },
        { header: 'Armazém', accessorKey: 'armazemAtualNome' },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => <span className="badge badge-info">{getStatusLabel(row.original.status)}</span>
        },
        { header: 'Cliente/Colaborador', id: 'holder', cell: ({ row }) => row.original.clienteNome || row.original.colaboradorNome || '-' },
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
                <h1 className="page-title">Gestão de Ativos (Patrimônio)</h1>
                <p className="text-secondary">Gerencie os ativos individualizados e sua localização</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>Novo Ativo</span>
                </button>
            </div>

            <DataTable columns={columns} data={ativos} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? 'Editar Ativo' : 'Novo Ativo'}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}

                                <div>
                                    <label className="glass-modal-label">Serial <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.serial} onChange={(e) => setFormData({ ...formData, serial: e.target.value })} />
                                    {formErrors.serial && <div className="glass-modal-error">{formErrors.serial}</div>}
                                </div>

                                <div>
                                    <label className="glass-modal-label">Item de Patrimônio <span className="glass-modal-required">*</span></label>
                                    <SearchSelect
                                        options={itensCatalogo}
                                        value={itensCatalogo.find(i => i.value === formData.itemCatalogoId) || null}
                                        onChange={(opt) => setFormData({ ...formData, itemCatalogoId: (opt?.value as string) || '' })}
                                        isDisabled={!!editingId} // Prevent changing item type on edit for consistency
                                        isClearable={!editingId}
                                    />
                                    {formErrors.itemCatalogoId && <div className="glass-modal-error">{formErrors.itemCatalogoId}</div>}
                                </div>

                                <div>
                                    <label className="glass-modal-label">Armazém Atual <span className="glass-modal-required">*</span></label>
                                    <SearchSelect
                                        options={armazens}
                                        value={armazens.find(a => a.value === formData.armazemAtualId) || null}
                                        onChange={(opt) => setFormData({ ...formData, armazemAtualId: (opt?.value as string) || '' })}
                                        isClearable
                                    />
                                    {formErrors.armazemAtualId && <div className="glass-modal-error">{formErrors.armazemAtualId}</div>}
                                </div>

                                <div>
                                    <label className="glass-modal-label">Status</label>
                                    <select
                                        className="glass-modal-input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
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
                            <p>Tem certeza que deseja excluir o ativo serial <strong>{deleteTarget.serial}</strong>?</p>
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

