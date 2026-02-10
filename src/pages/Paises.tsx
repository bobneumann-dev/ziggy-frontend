import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type Pais } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Paises() {
    const { t } = useTranslation();
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ nome: '', codigoIso: '', ddi: '' });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<Pais | null>(null);

    const fetchPaises = useCallback(async () => {
        try {
            const res = await api.get('/api/paises');
            setPaises(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPaises();
    }, [fetchPaises]);

    const handleOpenModal = (pais?: Pais) => {
        if (pais) {
            setEditingId(pais.id);
            setFormData({ nome: pais.nome, codigoIso: pais.codigoIso, ddi: pais.ddi });
        } else {
            setEditingId(null);
            setFormData({ nome: '', codigoIso: '', ddi: '' });
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
            setFormErrors({ nome: t('countries.validation.requiredName') });
            return;
        }
        if (!formData.codigoIso.trim()) {
            setFormErrors({ codigoIso: t('countries.validation.requiredIsoCode') });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/paises/${editingId}`, formData);
            } else {
                await api.post('/api/paises', formData);
            }
            fetchPaises();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || t('countries.validation.saveFailed') });
        }
    };

    const handleDelete = (pais: Pais) => {
        setDeleteTarget(pais);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/paises/${deleteTarget.id}`);
            fetchPaises();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Pais>[] = useMemo(() => [
        { header: t('countries.isoCode'), accessorKey: 'codigoIso' },
        { header: t('countries.name'), accessorKey: 'nome' },
        { header: t('countries.ddi'), accessorKey: 'ddi' },
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
                <h1 className="page-title">{t('countries.title')}</h1>
                <p className="text-secondary">{t('countries.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('countries.newCountry')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={paises} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('countries.editCountry') : t('countries.newCountry')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('countries.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Brasil, Paraguai, Argentina" />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('countries.isoCode')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.codigoIso} onChange={(e) => setFormData({ ...formData, codigoIso: e.target.value.toUpperCase() })} maxLength={5} placeholder="BR, PY, AR" />
                                    {formErrors.codigoIso && <div className="glass-modal-error">{formErrors.codigoIso}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('countries.ddi')}</label>
                                    <input type="text" className="glass-modal-input" value={formData.ddi} onChange={(e) => setFormData({ ...formData, ddi: e.target.value })} placeholder="+55, +595, +54" />
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
                            <p>{t('countries.deleteConfirm', { name: deleteTarget.nome })}</p>
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
