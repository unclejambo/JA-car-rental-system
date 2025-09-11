import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { HiMiniChevronRight, HiMiniChevronLeft } from 'react-icons/hi2';

export default function AdminTable({
  data = [],
  columns = [],
  title = '',
  Icon = null,
  emptyMessage = 'No records found',
  loading = false,
  error = null,
  meta = undefined,
  pageSize = 10,
}) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    meta,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="admin-table-wrapper">
      {title ? (
        <h1 id="admin-table-title" className="font-pathway text-2xl header-req">
          {Icon ? <Icon style={{ verticalAlign: '-3px', marginRight: '5px' }} /> : null}
          {title}
        </h1>
      ) : null}

      <div className="admin-table-container">
        <table className="admin-table" aria-labelledby="admin-table-title">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  aria-sort={
                    header.column.getIsSorted()
                      ? header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <button
                    onClick={header.column.getToggleSortingHandler()}
                  >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted()
                    ? header.column.getIsSorted() === 'asc'
                      ? ' ↑'
                      : ' ↓'
                    : ''}
                </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading && (
            <tr style={{ border: 'none' }}>
              <td colSpan={table.getAllColumns().length} className="text-center py-4 font-pathway table-message-loading">
                <h3>Loading...</h3>
              </td>
            </tr>
          )}
          {error && !loading && (
            <tr style={{ border: 'none' }}>
              <td colSpan={table.getAllColumns().length} className="text-center py-4 font-pathway table-message-error">
                <h3>{error}</h3>
              </td>
            </tr>
          )}
          {!loading && !error && table.getRowModel().rows.length === 0 && (
            <tr style={{ border: 'none' }}>
              <td colSpan={table.getAllColumns().length} className="text-center py-4 font-pathway table-message-empty">
                <h3>{emptyMessage}</h3>
              </td>
            </tr>
          )}
          {!loading && !error &&
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="font-pathway">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="pagination-btn"
          aria-label="Go to previous page"
        >
          <HiMiniChevronLeft style={{ verticalAlign: '-3px' }} /> Prev
        </button>
        <span role="status" aria-live="polite" aria-atomic="true">
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="pagination-btn"
          aria-label="Go to next page"
        >
          Next <HiMiniChevronRight style={{ verticalAlign: '-3px' }} />
        </button>
      </div>
    </div>
  );
}
