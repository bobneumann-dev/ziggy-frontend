import { useEffect, useState } from 'react';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ArrowDown, ArrowUp } from 'lucide-react';
import './styles.css';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pageCount?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onSearchChange?: (searchTerm: string) => void;
  isLoading?: boolean;
  isServerSide?: boolean;
  totalCount?: number;
}

export function DataTable<TData>({
  columns,
  data,
  pageCount = 0,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
  isLoading = false,
  isServerSide = false,
  totalCount = 0,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: isServerSide ? pageCount : undefined,
    manualPagination: isServerSide,
    manualSorting: isServerSide,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  useEffect(() => {
    if (isServerSide && onPaginationChange) {
      onPaginationChange(pagination.pageIndex, pagination.pageSize);
    }
  }, [pagination, isServerSide, onPaginationChange]);

  useEffect(() => {
    if (isServerSide && onSortingChange) {
      onSortingChange(sorting);
    }
  }, [sorting, isServerSide, onSortingChange]);

  useEffect(() => {
    if (isServerSide && onSearchChange) {
      // Debounce the search term to avoid too many API calls
      const timeoutId = setTimeout(() => {
        onSearchChange(searchTerm);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, isServerSide, onSearchChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header com busca */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--table-border)' }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Registros</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isServerSide ? totalCount : data.length} {(isServerSide ? totalCount : data.length) === 1 ? 'item' : 'itens'} encontrados
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 w-64 glass-input"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="relative overflow-x-auto">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'var(--card-bg)', opacity: 0.9 }}>
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</span>
            </div>
          </div>
        )}
        
        <table className="min-w-full">
          <thead style={{ backgroundColor: 'var(--table-header-bg)' }}>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${
                      header.column.getCanSort() ? 'cursor-pointer select-none hover:opacity-80' : ''
                    }`}
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--table-border)' }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      
                      {header.column.getCanSort() && (
                        <span style={{ color: 'var(--accent-primary)' }}>
                          {{
                            asc: <ArrowUp className="w-3.5 h-3.5" />,
                            desc: <ArrowDown className="w-3.5 h-3.5" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <tr 
                  key={row.id} 
                  className="transition-colors duration-150"
                  style={{ 
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--table-row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className="px-6 py-4 whitespace-nowrap text-sm"
                      style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--table-border)' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <Search className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Nenhum registro encontrado</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Tente ajustar os filtros de busca</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div 
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--table-border)', backgroundColor: 'var(--table-header-bg)' }}
      >
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {(isServerSide ? totalCount : data.length) > 0 ? (
            <>
              Mostrando{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {pagination.pageIndex * pagination.pageSize + 1}
              </span>
              {' '}a{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, isServerSide ? totalCount : data.length)}
              </span>
              {' '}de{' '}
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {isServerSide ? totalCount : data.length}
              </span>
              {' '}resultados
            </>
          ) : (
            <span>0 resultados</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-4 py-2 mx-1 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {pagination.pageIndex + 1}
            </span>
            <span className="text-sm mx-1" style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {table.getPageCount() || 1}
            </span>
          </div>
          
          <button
            className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          
          <select
            value={pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
            className="ml-2 px-3 py-2 rounded-md text-sm cursor-pointer"
            style={{ 
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            {[10, 20, 50, 100].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize} por página
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
