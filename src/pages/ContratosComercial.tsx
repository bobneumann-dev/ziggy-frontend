import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';
import { type ContratoComercial, StatusContratoComercial } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function ContratosComercial() {
    const { t } = useTranslation();
    const [contratos, setContratos] = useState<ContratoComercial[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchContratos = useCallback(async () => {
        try {
            const res = await api.get('/api/contratos-comercial');
            setContratos(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContratos();
    }, [fetchContratos]);

    const getStatusLabel = (status: number) => {
        switch (status) {
            case StatusContratoComercial.Rascunho: return t('contracts.statusDraft');
            case StatusContratoComercial.AguardandoInstalacao: return t('contracts.statusAwaitingInstall');
            case StatusContratoComercial.Ativo: return t('contracts.statusActive');
            case StatusContratoComercial.Cancelado: return t('contracts.statusCancelled');
            default: return '';
        }
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case StatusContratoComercial.Rascunho: return 'warning';
            case StatusContratoComercial.AguardandoInstalacao: return 'info';
            case StatusContratoComercial.Ativo: return 'success';
            case StatusContratoComercial.Cancelado: return 'danger';
            default: return 'info';
        }
    };

    const handleActivate = async (contratoId: string) => {
        try {
            await api.post(`/api/contratos-comercial/${contratoId}/ativar`);
            fetchContratos();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancel = async (contratoId: string) => {
        if (!confirm('Tem certeza que deseja cancelar este contrato?')) return;
        try {
            await api.post(`/api/contratos-comercial/${contratoId}/cancelar`);
            fetchContratos();
        } catch (error) {
            console.error(error);
        }
    };

    const columns: ColumnDef<ContratoComercial>[] = useMemo(() => [
        { header: t('opportunities.client'), accessorKey: 'clienteNome' },
        {
            header: t('contracts.status'),
            accessorKey: 'status',
            cell: ({ row }) => <span className={`badge badge-${getStatusColor(row.original.status)}`}>{getStatusLabel(row.original.status)}</span>,
        },
        {
            header: t('contracts.entryValue'),
            accessorKey: 'valorEntrada',
            cell: ({ row }) => `R$ ${row.original.valorEntrada.toFixed(2)}`
        },
        {
            header: t('contracts.recurringValue'),
            accessorKey: 'valorRecorrente',
            cell: ({ row }) => `R$ ${row.original.valorRecorrente.toFixed(2)}`
        },
        { header: t('contracts.dueDay'), accessorKey: 'diaVencimento' },
        {
            header: t('common.actions'),
            id: 'actions',
            cell: ({ row }) => (
                <div className="action-button-group">
                    {row.original.status === StatusContratoComercial.AguardandoInstalacao && (
                        <button className="action-button" onClick={() => handleActivate(row.original.id)} title={t('contracts.activate')}>
                            <CheckCircle size={16} />
                        </button>
                    )}
                    {row.original.status !== StatusContratoComercial.Cancelado && (
                        <button className="action-button" onClick={() => handleCancel(row.original.id)} title={t('contracts.cancel')}>
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            ),
        },
    ], [t]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('contracts.title')}</h1>
                <p className="text-secondary">{t('contracts.description')}</p>
            </div>

            <DataTable columns={columns} data={contratos} searchPlaceholder={t('table.searchPlaceholder')} />
        </div>
    );
}

