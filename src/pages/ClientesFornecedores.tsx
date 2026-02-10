import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, X, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../lib/api';
import { type ClienteFornecedor, TipoDocumento, Nacionalidade, TipoContato } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

type FilterType = 'all' | 'clients' | 'suppliers';

interface ContatoForm { tipo: number; valor: string; descricao: string; contatoAutomatico: boolean; principal: boolean; }
const emptyContato = (): ContatoForm => ({ tipo: TipoContato.Email, valor: '', descricao: '', contatoAutomatico: false, principal: false });

const DOC_TYPE_KEYS: { value: number; key: string }[] = [
    { value: TipoDocumento.BR_CPF, key: 'docType_BR_CPF' },
    { value: TipoDocumento.BR_CNPJ, key: 'docType_BR_CNPJ' },
    { value: TipoDocumento.BR_RG, key: 'docType_BR_RG' },
    { value: TipoDocumento.PY_RUC, key: 'docType_PY_RUC' },
    { value: TipoDocumento.PY_CI, key: 'docType_PY_CI' },
    { value: TipoDocumento.AR_CUIT, key: 'docType_AR_CUIT' },
    { value: TipoDocumento.AR_CUIL, key: 'docType_AR_CUIL' },
    { value: TipoDocumento.AR_DNI, key: 'docType_AR_DNI' },
    { value: TipoDocumento.Passaporte, key: 'docType_Passaporte' },
    { value: TipoDocumento.Outro, key: 'docType_Outro' },
];

const NAT_KEYS: { value: number; key: string }[] = [
    { value: Nacionalidade.Brasileira, key: 'nat_Brasileira' },
    { value: Nacionalidade.Paraguaia, key: 'nat_Paraguaia' },
    { value: Nacionalidade.Argentina, key: 'nat_Argentina' },
    { value: Nacionalidade.Uruguaia, key: 'nat_Uruguaia' },
    { value: Nacionalidade.Boliviana, key: 'nat_Boliviana' },
    { value: Nacionalidade.Chilena, key: 'nat_Chilena' },
    { value: Nacionalidade.Colombiana, key: 'nat_Colombiana' },
    { value: Nacionalidade.Peruana, key: 'nat_Peruana' },
    { value: Nacionalidade.Venezuelana, key: 'nat_Venezuelana' },
    { value: Nacionalidade.Outra, key: 'nat_Outra' },
];

const CONTATO_TYPE_KEYS: { value: number; key: string }[] = [
    { value: TipoContato.Telefone, key: 'typePhone' },
    { value: TipoContato.Celular, key: 'typeMobile' },
    { value: TipoContato.Email, key: 'typeEmail' },
    { value: TipoContato.WhatsApp, key: 'typeWhatsApp' },
    { value: TipoContato.Outro, key: 'typeOther' },
];

export default function ClientesFornecedores() {
    const { t } = useTranslation();
    const [records, setRecords] = useState<ClienteFornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nomeRazaoSocial: '', documento: '', tipoDocumento: '' as string,
        nacionalidade: '' as string, ativo: true,
        isCliente: true, isFornecedor: false, status: 1,
    });
    const [contatos, setContatos] = useState<ContatoForm[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deleteTarget, setDeleteTarget] = useState<ClienteFornecedor | null>(null);
    const [filterType, setFilterType] = useState<FilterType>('all');

    const fetchRecords = useCallback(async () => {
        try {
            const res = await api.get('/api/clientes-fornecedores');
            setRecords(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const filteredRecords = useMemo(() => {
        if (filterType === 'clients') return records.filter(r => r.isCliente);
        if (filterType === 'suppliers') return records.filter(r => r.isFornecedor);
        return records;
    }, [records, filterType]);

    const handleOpenModal = (record?: ClienteFornecedor) => {
        if (record) {
            setEditingId(record.id);
            setFormData({
                nomeRazaoSocial: record.nomeRazaoSocial, documento: record.documento || '',
                tipoDocumento: record.tipoDocumento != null ? String(record.tipoDocumento) : '',
                nacionalidade: record.nacionalidade != null ? String(record.nacionalidade) : '',
                ativo: record.ativo, isCliente: record.isCliente, isFornecedor: record.isFornecedor, status: record.status,
            });
            setContatos(record.contatos?.map(c => ({
                tipo: c.tipo, valor: c.valor, descricao: c.descricao || '',
                contatoAutomatico: c.contatoAutomatico, principal: c.principal,
            })) || []);
        } else {
            setEditingId(null);
            setFormData({
                nomeRazaoSocial: '', documento: '', tipoDocumento: '',
                nacionalidade: '', ativo: true,
                isCliente: true, isFornecedor: false, status: 1,
            });
            setContatos([emptyContato()]);
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
        if (!formData.nomeRazaoSocial.trim()) {
            setFormErrors({ nomeRazaoSocial: t('clients.name') });
            return;
        }
        if (!formData.isCliente && !formData.isFornecedor) {
            setFormErrors({ _global: t('clients.isClient') + ' / ' + t('clients.isSupplier') });
            return;
        }
        try {
            const payload = {
                nomeRazaoSocial: formData.nomeRazaoSocial,
                documento: formData.documento || null,
                tipoDocumento: formData.tipoDocumento ? Number(formData.tipoDocumento) : null,
                nacionalidade: formData.nacionalidade ? Number(formData.nacionalidade) : null,
                ativo: formData.ativo,
                isCliente: formData.isCliente,
                isFornecedor: formData.isFornecedor,
                contatos: contatos.filter(c => c.valor.trim()).map(c => ({
                    tipo: c.tipo, valor: c.valor, descricao: c.descricao || null,
                    contatoAutomatico: c.contatoAutomatico, principal: c.principal,
                })),
            };
            if (editingId) {
                await api.put(`/api/clientes-fornecedores/${editingId}`, payload);
            } else {
                await api.post('/api/clientes-fornecedores', payload);
            }
            fetchRecords();
            handleCloseModal();
        } catch (error: any) {
            setFormErrors({ _global: error.response?.data?.message || t('countries.validation.saveFailed') });
        }
    };

    const handleDelete = (record: ClienteFornecedor) => {
        setDeleteTarget(record);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/clientes-fornecedores/${deleteTarget.id}`);
            fetchRecords();
            setDeleteTarget(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseDelete = () => {
        setDeleteTarget(null);
    };

    const columns: ColumnDef<ClienteFornecedor>[] = useMemo(() => [
        { header: t('clients.name'), accessorKey: 'nomeRazaoSocial' },
        { header: t('clients.document'), accessorKey: 'documento', cell: ({ row }) => row.original.documento || '-' },
        {
            header: t('common.status'),
            id: 'ativo',
            cell: ({ row }) => (
                <span className={`badge ${row.original.ativo ? 'badge-success' : 'badge-danger'}`}>
                    {row.original.ativo ? t('common.active') : t('common.inactive')}
                </span>
            ),
        },
        {
            header: t('clients.type'),
            id: 'tipo',
            cell: ({ row }) => (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {row.original.isCliente && <span className="badge badge-success">{t('clients.isClient')}</span>}
                    {row.original.isFornecedor && <span className="badge badge-info">{t('clients.isSupplier')}</span>}
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
                <h1 className="page-title">{t('clients.title')}</h1>
                <p className="text-secondary">{t('clients.description')}</p>
                <button onClick={() => handleOpenModal()} className="glass-button flex items-center gap-2 px-4 py-2.5" style={{ marginTop: '1rem' }}>
                    <Plus className="w-4 h-4" />
                    <span>{t('clients.newRecord')}</span>
                </button>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className={`filter-badge ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>{t('clients.filterAll')}</button>
                <button className={`filter-badge ${filterType === 'clients' ? 'active' : ''}`} onClick={() => setFilterType('clients')}>{t('clients.filterClients')}</button>
                <button className={`filter-badge ${filterType === 'suppliers' ? 'active' : ''}`} onClick={() => setFilterType('suppliers')}>{t('clients.filterSuppliers')}</button>
            </div>

            <DataTable columns={columns} data={filteredRecords} />

            {showModal && (
                <div className="glass-modal-backdrop" onClick={handleCloseModal}>
                    <div className="glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <div className="glass-modal-header">
                            <h2>{editingId ? t('clients.editRecord') : t('clients.newRecord')}</h2>
                            <button onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {formErrors._global && <div className="glass-modal-error">{formErrors._global}</div>}
                                <div>
                                    <label className="glass-modal-label">{t('clients.name')} <span className="glass-modal-required">*</span></label>
                                    <input type="text" className="glass-modal-input" value={formData.nomeRazaoSocial} onChange={(e) => setFormData({ ...formData, nomeRazaoSocial: e.target.value })} />
                                    {formErrors.nomeRazaoSocial && <div className="glass-modal-error">{formErrors.nomeRazaoSocial}</div>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">{t('clients.documentType')}</label>
                                        <select className="glass-modal-input" value={formData.tipoDocumento} onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}>
                                            <option value="">{t('clients.selectDocType')}</option>
                                            {DOC_TYPE_KEYS.map(d => (
                                                <option key={d.value} value={d.value}>{t(`clients.${d.key}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="glass-modal-label">{t('clients.document')}</label>
                                        <input type="text" className="glass-modal-input" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="glass-modal-label">{t('clients.nationality')}</label>
                                        <select className="glass-modal-input" value={formData.nacionalidade} onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}>
                                            <option value="">{t('clients.selectNationality')}</option>
                                            {NAT_KEYS.map(n => (
                                                <option key={n.value} value={n.value}>{t(`clients.${n.key}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="checkbox" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} />
                                            {t('clients.active')}
                                        </label>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={formData.isCliente} onChange={(e) => setFormData({ ...formData, isCliente: e.target.checked })} />
                                        {t('clients.isClient')}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" checked={formData.isFornecedor} onChange={(e) => setFormData({ ...formData, isFornecedor: e.target.checked })} />
                                        {t('clients.isSupplier')}
                                    </label>
                                </div>

                                {/* Contatos Section */}
                                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label className="glass-modal-label" style={{ margin: 0 }}>{t('clients.contactsSection')}</label>
                                        <button type="button" onClick={() => setContatos([...contatos, emptyContato()])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                                            <PlusCircle size={14} /> {t('contacts.addContact')}
                                        </button>
                                    </div>
                                    {contatos.map((ct, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                            <select className="glass-modal-input" value={ct.tipo} onChange={(e) => { const arr = [...contatos]; arr[idx].tipo = Number(e.target.value); setContatos(arr); }}>
                                                {CONTATO_TYPE_KEYS.map(c => (
                                                    <option key={c.value} value={c.value}>{t(`contacts.${c.key}`)}</option>
                                                ))}
                                            </select>
                                            <input type="text" className="glass-modal-input" value={ct.valor} onChange={(e) => { const arr = [...contatos]; arr[idx].valor = e.target.value; setContatos(arr); }} placeholder={ct.tipo === TipoContato.Email ? 'email@exemplo.com' : '(99) 99999-0000'} />
                                            <button type="button" onClick={() => setContatos(contatos.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title={t('contacts.removeContact')}>
                                                <MinusCircle size={16} />
                                            </button>
                                        </div>
                                    ))}
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
                            <p>{t('clients.deleteConfirm', { name: deleteTarget.nomeRazaoSocial })}</p>
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

