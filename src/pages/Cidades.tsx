import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { type Cidade, type Departamento, type Pais } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function Cidades() {
    const { t } = useTranslation();
    const [cidades, setCidades] = useState<Cidade[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ nome: '', departamentoId: 0 });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<Cidade | null>(null);
    const [filterPaisId, setFilterPaisId] = useState<number>(0);
    const [modalPaisId, setModalPaisId] = useState<number>(0);

    const fetchData = useCallback(async () => {
        try {
            const [cidRes, depRes, paisRes] = await Promise.all([
                api.get('/api/cidades'),
                api.get('/api/departamentos'),
                api.get('/api/paises'),
            ]);
            setCidades(cidRes.data);
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

    const filteredCidades = useMemo(() => {
        if (!filterPaisId) return cidades;
        return cidades.filter((c) => c.paisId === filterPaisId);
    }, [cidades, filterPaisId]);

    const filteredDepartamentos = useMemo(() => {
        if (!modalPaisId) return departamentos;
        return departamentos.filter((d) => d.paisId === modalPaisId);
    }, [departamentos, modalPaisId]);

    const handleOpenModal = (cidade?: Cidade) => {
        if (cidade) {
            setEditingId(cidade.id);
            setFormData({ nome: cidade.nome, departamentoId: cidade.departamentoId });
            const dep = departamentos.find((d) => d.id === cidade.departamentoId);
            setModalPaisId(dep?.paisId || 0);
        } else {
            setEditingId(null);
            setFormData({ nome: '', departamentoId: 0 });
            setModalPaisId(0);
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
            setFormErrors({ nome: t('cities.validation.requiredName') });
            return;
        }
        if (!formData.departamentoId) {
            setFormErrors({ departamentoId: t('cities.validation.requiredDepartment') });
            return;
        }
        try {
            if (editingId) {
                await api.put(`/api/cidades/${editingId}`, formData);
            } else {
                await api.post('/api/cidades', formData);
            }
            fetchData();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || t('cities.validation.saveFailed') });
        }
    };

    const handleDelete = (cidade: Cidade) => {
        setDeleteTarget(cidade);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/cidades/${deleteTarget.id}`);
            fetchData();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<Cidade>[] = useMemo(() => [
        { header: t('cities.name'), accessorKey: 'nome' },
        { header: t('cities.department'), accessorKey: 'departamentoNome' },
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
                <h1 className="page-title">{t('cities.title')}</h1>
                <p className="text-secondary">{t('cities.description')}</p>
                <div className="flex items-center gap-4" style={{ marginTop: '1rem' }}>
                    <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5">
                        <Plus className="w-4 h-4" />
                        <span>{t('cities.newCity')}</span>
                    </button>
                    <select className="glass-modal-input" style={{ maxWidth: '220px' }} value={filterPaisId} onChange={(e) => setFilterPaisId(Number(e.target.value))}>
                        <option value={0}>{t('cities.allCountries')}</option>
                        {paises.map((p) => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            <DataTable columns={columns} data={filteredCidades} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('cities.editCity') : t('cities.newCity')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('cities.filterByCountry')}</label>
                                    <select className="glass-modal-input" value={modalPaisId} onChange={(e) => { setModalPaisId(Number(e.target.value)); setFormData({ ...formData, departamentoId: 0 }); }}>
                                        <option value={0}>{t('cities.allCountries')}</option>
                                        {paises.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('cities.department')} <span className="glass-modal-required">*</span></label>
                                    <select className="glass-modal-input" value={formData.departamentoId} onChange={(e) => setFormData({ ...formData, departamentoId: Number(e.target.value) })}>
                                        <option value={0}>{t('cities.selectDepartment')}</option>
                                        {filteredDepartamentos.map((d) => (
                                            <option key={d.id} value={d.id}>{d.nome} ({d.paisNome})</option>
                                        ))}
                                    </select>
                                    {formErrors.departamentoId && <div className="glass-modal-error">{formErrors.departamentoId}</div>}
                                </div>
                                <div>
                                    <label className="glass-modal-label">{t('cities.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="São Paulo, Ciudad del Este" />
                                    {formErrors.nome && <div className="glass-modal-error">{formErrors.nome}</div>}
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
                            <p>{t('cities.deleteConfirm', { name: deleteTarget.nome })}</p>
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
