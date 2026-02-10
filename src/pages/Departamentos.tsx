import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type Departamento, type Pais } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Departamentos() {
    const { t } = useTranslation();
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ nome: '', abreviacao: '', paisId: 0 });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<Departamento | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [depRes, paisRes] = await Promise.all([
                api.get('/api/departamentos'),
                api.get('/api/paises'),
            ]);
            setDepartamentos(depRes.data);
            setPaises(paisRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (dep?: Departamento) => {
        if (dep) {
            setEditingId(dep.id);
            setFormData({ nome: dep.nome, abreviacao: dep.abreviacao || '', paisId: dep.paisId });
        } else {
            setEditingId(null);
            setFormData({ nome: '', abreviacao: '', paisId: 0 });
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
            setFormErrors({ nome: t('departments.validation.requiredName') });
            return;
        }
        if (!formData.paisId) {
            setFormErrors({ paisId: t('departments.validation.requiredCountry') });
            return;
        }
        try {
            const payload = { ...formData, abreviacao: formData.abreviacao || null };
            if (editingId) {
                await api.put(`/api/departamentos/${editingId}`, payload);
            } else {
                await api.post('/api/departamentos', payload);
            }
            fetchData();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || t('departments.validation.saveFailed') });
        }
    };

    const handleDelete = (dep: Departamento) => {
        setDeleteTarget(dep);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/departamentos/${deleteTarget.id}`);
            fetchData();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Departamento>[] = useMemo(() => [
        { header: t('departments.name'), accessorKey: 'nome' },
        { header: t('departments.abbreviation'), accessorKey: 'abreviacao' },
        { header: t('departments.country'), accessorKey: 'paisNome' },
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
                <h1 className="page-title">{t('departments.title')}</h1>
                <p className="text-secondary">{t('departments.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('departments.newDepartment')}</span>
                </button>
            </div>

            <DataTable columns={columns} data={departamentos} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('departments.editDepartment') : t('departments.newDepartment')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('departments.country')} <span className="glass-modal-required">*</span></label>
                                    <select className="glass-modal-input" value={formData.paisId} onChange={(e) => setFormData({ ...formData, paisId: Number(e.target.value) })}>
                                        <option value={0}>{t('departments.selectCountry')}</option>
                                        {paises.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                    </select>
                                    {formErrors.paisId && <div className="glass-modal-error">{formErrors.paisId}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('departments.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="São Paulo, Alto Paraná" />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('departments.abbreviation')}</label>
                                    <input type="text" className="glass-modal-input" value={formData.abreviacao} onChange={(e) => setFormData({ ...formData, abreviacao: e.target.value.toUpperCase() })} maxLength={10} placeholder="SP, AP" />
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
                            <p>{t('departments.deleteConfirm', { name: deleteTarget.nome })}</p>
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
