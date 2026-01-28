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
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700">Resultados</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Pesquisar..."
            className="pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 glass-input"
          />
        </div>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white/50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      
                      {header.column.getCanSort() && (
                        <span className="ml-2">
                          {{
                            asc: <ArrowUp className="w-4 h-4" />,
                            desc: <ArrowDown className="w-4 h-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {(isServerSide ? totalCount : data.length) > 0 ? (
            <>
              Mostrando{' '}
              <span className="font-medium">{pagination.pageIndex * pagination.pageSize + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, isServerSide ? totalCount : data.length)}
              </span>{' '}
              de <span className="font-medium">{isServerSide ? totalCount : data.length}</span> resultados
            </>
          ) : (
            <span>0 resultados encontrados</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            className="p-1 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium">
            Página {pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          
          <button
            className="p-1 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded-md border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="p-1 rounded-md border border-gray-200 bg-transparent"
          >
            {[10, 20, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Mostrar {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
