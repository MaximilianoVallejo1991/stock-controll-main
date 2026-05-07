// src/components/DataTable.jsx
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemedButton from './ThemedButton';

const DataTable = ({ columns, data }) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const { theme } = useTheme();

  return (
    <div className="w-full">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="px-4 py-2 border rounded-xl w-full max-w-sm shadow-sm transition-all focus:ring-2 focus:ring-blue-500 outline-none"
          style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm from-neutral-100">
          <thead className="p-2" style={{ backgroundColor: theme.text, color: theme.bg }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="text-left p-2 cursor-pointer"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted()] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm">
        <div>
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <ThemedButton onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border rounded">
            Anterior
          </ThemedButton>
          <ThemedButton onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1 border rounded">
            Siguiente
          </ThemedButton>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
