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
        <h1 className="font-pathway text-2xl header-req" style={{ marginBottom: 8 }}>
          {Icon ? <Icon style={{ verticalAlign: '-3px', marginRight: '5px' }} /> : null}
          {title}
        </h1>
      ) : null}

      <table className="admin-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left cursor-pointer border font-pathway"
                  style={{ fontSize: '20px', padding: '3px 3px 3px 10px' }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted()
                    ? header.column.getIsSorted() === 'asc'
                      ? ' ↑'
                      : ' ↓'
                    : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading && (
            <tr style={{ border: 'none' }}>
              <td colSpan={table.getAllColumns().length} className="text-center py-4 font-pathway" style={{ color: '#808080' }}>
                <h3>Loading...</h3>
              </td>
            </tr>
          )}
          {error && !loading && (
            <tr style={{ border: 'none' }}>
              <td colSpan={table.getAllColumns().length} className="text-center py-4 font-pathway" style={{ color: 'crimson' }}>
                <h3>{error}</h3>
              </td>
            </tr>
          )}
          {!loading && !error && table.getRowModel().rows.length === 0 && (
            <tr style={{ border: 'none' }}>
              <td colSpan={table.getAllColumns().length} className="text-center py-4 font-pathway" style={{ color: '#808080' }}>
                <h3>{emptyMessage}</h3>
              </td>
            </tr>
          )}
          {!loading && !error &&
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t font-pathway">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-2"
                    style={{ borderBottom: '1px solid #000', padding: '10px ' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      <div
        className="mt-2 flex gap-2 pagination"
        style={{ marginTop: '15px', alignItems: 'center', placeContent: 'center' }}
      >
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="pagination-btn">
          <HiMiniChevronLeft style={{ verticalAlign: '-3px' }} /> Prev
        </button>
        <span style={{ padding: '0 10px' }}>
          {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="pagination-btn">
          Next <HiMiniChevronRight style={{ verticalAlign: '-3px' }} />
        </button>
      </div>
    </div>
  );
}
