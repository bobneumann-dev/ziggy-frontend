import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { type EstoqueSaldo } from '../types';
import { DataTable } from '../components/DataTable';
import SearchSelect, { type SearchSelectOption } from '../components/SearchSelect';
import type { ColumnDef } from '@tanstack/react-table';
import LoadingState from '../components/LoadingState';

export default function EstoqueSaldos() {
    const { t } = useTranslation();
    const [saldos, setSaldos] = useState<EstoqueSaldo[]>([]);
    const [loading, setLoading] = useState(true);
    const [armazens, setArmazens] = useState<SearchSelectOption[]>([]);
    const [itens, setItens] = useState<SearchSelectOption[]>([]);
    const [filterArmazem, setFilterArmazem] = useState<string>('');
    const [filterItem, setFilterItem] = useState<string>('');

    const fetchSaldos = useCallback(async () => {
        try {
            const res = await api.get('/api/estoque/saldos');
            setSaldos(res.data);
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
            const res = await api.get('/api/catalogo/itens');
            setItens(res.data.map((i: any) => ({ label: i.nome, value: i.id })));
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchSaldos();
        fetchArmazens();
        fetchItens();
    }, [fetchSaldos, fetchArmazens, fetchItens]);

    const filteredSaldos = useMemo(() => {
        return saldos.filter(s => {
            if (filterArmazem && s.armazemId !== filterArmazem) return false;
            if (filterItem && s.itemCatalogoId !== filterItem) return false;
            return true;
        });
    }, [saldos, filterArmazem, filterItem]);

    const columns: ColumnDef<EstoqueSaldo>[] = useMemo(() => [
        { header: t('stock.warehouse'), accessorKey: 'armazemNome' },
        { header: t('stock.item'), accessorKey: 'itemCatalogoNome' },
        { header: t('stock.physicalQty'), accessorKey: 'quantidadeFisica' },
        {
            header: t('stock.reservedQty'),
            accessorKey: 'quantidadeReservada',
            cell: ({ row }) => (
                <span style={{ color: row.original.quantidadeReservada > 0 ? '#f59e0b' : 'inherit' }}>
                    {row.original.quantidadeReservada}
                </span>
            ),
        },
        {
            header: t('stock.availableQty'),
            id: 'disponivel',
            cell: ({ row }) => {
                const disponivel = row.original.quantidadeFisica - row.original.quantidadeReservada;
                return <span style={{ color: disponivel > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{disponivel}</span>;
            },
        },
    ], [t]);

    if (loading) return <LoadingState />;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t('stock.balancesTitle')}</h1>
                <p className="text-secondary">{t('stock.balancesDescription')}</p>
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label className="glass-modal-label">{t('stock.warehouse')}</label>
                    <SearchSelect options={armazens} value={filterArmazem} onChange={setFilterArmazem} isClearable placeholder="Todos os armazéns" />
                </div>
                <div>
                    <label className="glass-modal-label">{t('stock.item')}</label>
                    <SearchSelect options={itens} value={filterItem} onChange={setFilterItem} isClearable placeholder="Todos os itens" />
                </div>
            </div>

            <DataTable columns={columns} data={filteredSaldos} searchPlaceholder={t('table.searchPlaceholder')} />
        </div>
    );
}

