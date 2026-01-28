import { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../lib/api';
import type { Pessoa } from '../types';
import { StatusPessoa } from '../types';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import type { PagedResult, PaginationParams } from '../types/pagination';

export default function Pessoas() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 10,
    sortDesc: false
  });
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPaginatedPessoas = async () => {
    setLoading(true);
    try {
      const response = await api.get<PagedResult<Pessoa>>('/pessoas/paged', {
        params: {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          sortBy: pagination.sortBy,
          sortDesc: pagination.sortDesc,
          searchTerm: pagination.searchTerm
        }
      });
      setPessoas(response.data.items);
      setPageCount(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaginatedPessoas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber, pagination.pageSize, pagination.sortBy, pagination.sortDesc, pagination.searchTerm]);

  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageNumber: pageIndex + 1, // API is 1-indexed, TanStack Table is 0-indexed
      pageSize
    }));
  }, []);

  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (!sorting.length) {
      setPagination(prev => ({ ...prev, sortBy: undefined, sortDesc: false }));
      return;
    }

    const column = sorting[0];
    setPagination(prev => ({
      ...prev,
      sortBy: column.id,
      sortDesc: column.desc
    }));
  }, []);

  const handleSearchChange = useCallback((searchTerm: string) => {
    setPagination(prev => ({
      ...prev,
      searchTerm,
      pageNumber: 1 // Reset to first page on new search
    }));
  }, []);

  const getStatusLabel = (status: number) => {
    switch (status) {
      case StatusPessoa.Ativo: return 'Ativo';
      case StatusPessoa.Afastado: return 'Afastado';
      case StatusPessoa.Desligado: return 'Desligado';
      default: return 'Desconhecido';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case StatusPessoa.Ativo: return 'bg-green-100 text-green-800';
      case StatusPessoa.Afastado: return 'bg-yellow-100 text-yellow-800';
      case StatusPessoa.Desligado: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = useMemo<ColumnDef<Pessoa, any>[]>(() => [
    {
      accessorKey: 'nomeCompleto',
      header: 'Nome',
      cell: info => <div className="text-sm font-medium text-gray-900">{info.getValue()}</div>
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: info => <div className="text-sm text-gray-900">{info.getValue()}</div>
    },
    {
      accessorKey: 'cargoAtualNome',
      header: 'Cargo Atual',
      cell: info => <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'setorAtualNome',
      header: 'Setor Atual',
      cell: info => <div className="text-sm text-gray-900">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const status = info.getValue() as number;
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: info => {
        const pessoa = info.row.original;
        return (
          <div className="text-right">
            <button className="text-indigo-600 hover:text-indigo-900 mr-3">
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-900">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="animate-fadeIn">
      {/* Header da página */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Pessoas</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gerencie os colaboradores da organização
          </p>
        </div>
        <button className="glass-button flex items-center gap-2 px-4 py-2.5">
          <Plus className="w-4 h-4" />
          <span>Nova Pessoa</span>
        </button>
      </div>

      {/* Tabela de dados */}
      <DataTable 
        columns={columns}
        data={pessoas}
        pageCount={pageCount}
        totalCount={totalCount}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onSearchChange={handleSearchChange}
        isLoading={loading}
        isServerSide={true}
      />
    </div>
  );
}
