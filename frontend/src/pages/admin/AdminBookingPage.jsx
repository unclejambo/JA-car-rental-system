import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
//import "../../styles/admincss/adminbooking.css";
import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { bookingColumns } from '../accessor/BookingColumns.jsx';
import { useBookingStore } from '../../store/bookings.js';
import { cancellationColumns } from '../accessor/CancellationColumns.jsx';
import { useCancellationStore } from '../../store/cancellation.js';
import { useExtensionStore } from '../../store/extension.js';
import { extensionColumns } from '../accessor/ExtensionColumns.jsx';
import { HiMiniChevronRight } from 'react-icons/hi2';
import { HiMiniChevronLeft } from 'react-icons/hi2';
import { HiBookOpen } from 'react-icons/hi2';
import { HiOutlineCurrencyDollar } from 'react-icons/hi2';
import ManageFeesModal from '../../components/modal/ManageFeesModal';

export default function AdminBookingPage() {
  const bookingData = useBookingStore((state) => state.bookings);
  const cancellationData = useCancellationStore((state) => state.cancellations);
  const extensionData = useExtensionStore((state) => state.extensions);
  const [showManageFeesModal, setShowManageFeesModal] = useState(false);

  // State for tracking active request type
  const [requestType, setRequestType] = useState('booking');

  // Separate states for each table
  const [bookingSorting, setBookingSorting] = useState([]);
  const [bookingPagination, setBookingPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const [cancellationSorting, setCancellationSorting] = useState([]);
  const [cancellationPagination, setCancellationPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const [extensionSorting, setExtensionSorting] = useState([]);
  const [extensionPagination, setExtensionPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  // Initialize tables with their own state
  const bookingTable = useReactTable({
    data: bookingData,
    columns: bookingColumns,
    state: {
      sorting: bookingSorting,
      pagination: bookingPagination,
    },
    onSortingChange: setBookingSorting,
    onPaginationChange: setBookingPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const cancellationTable = useReactTable({
    data: cancellationData,
    columns: cancellationColumns,
    state: {
      sorting: cancellationSorting,
      pagination: cancellationPagination,
    },
    onSortingChange: setCancellationSorting,
    onPaginationChange: setCancellationPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const extensionTable = useReactTable({
    data: extensionData,
    columns: extensionColumns,
    state: {
      sorting: extensionSorting,
      pagination: extensionPagination,
    },
    onSortingChange: setExtensionSorting,
    onPaginationChange: setExtensionPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getActiveTable = () => {
    switch (requestType) {
      case 'booking':
        return {
          table: bookingTable,
          data: bookingData,
          emptyMessage: 'There are no booking requests yet.',
          title: 'BOOKING',
        };
      case 'cancellation':
        return {
          table: cancellationTable,
          data: cancellationData,
          emptyMessage: 'There are no cancellation requests yet.',
          title: 'CANCELLATION',
        };
      case 'extension':
      default:
        return {
          table: extensionTable,
          data: extensionData,
          emptyMessage: 'There are no extension requests yet.',
          title: 'EXTENSION',
        };
    }
  };

  const { table: activeTable, emptyMessage, title } = getActiveTable();

  const getButtonClass = (type) => {
    return `tab-btn ${requestType === type ? 'active' : ''}`;
  };

  return (
    <>
      <Header />
      <AdminSideBar />
      <ManageFeesModal show={showManageFeesModal} onClose={() => setShowManageFeesModal(false)} />
      <div className="requests-container">
        <button className={getButtonClass('booking')} onClick={() => setRequestType('booking')}>
          Booking
        </button>
        <button
          className={getButtonClass('cancellation')}
          onClick={() => setRequestType('cancellation')}
        >
          Cancellation
        </button>
        <button className={getButtonClass('extension')} onClick={() => setRequestType('extension')}>
          Extension
        </button>
      </div>
      <div>
        <button className="manage-fees-btn" onClick={() => setShowManageFeesModal(true)}>
          <HiOutlineCurrencyDollar style={{ verticalAlign: '-3px', marginRight: '3px' }} />
          Manage Fees
        </button>
      </div>
      <div className="page-content-booking">
        <title>Manage Bookings</title>

        <h1 className="font-pathway header-req">
          <HiBookOpen style={{ verticalAlign: '-3px', marginRight: '5px' }} />
          {title} REQUESTS
        </h1>
        <table className="admin-table">
          <thead>
            {activeTable.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left cursor-pointer border font-pathway"
                    style={{
                      fontSize: '20px',
                      padding: '3px 3px 3px 10px',
                    }}
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
            {activeTable.getRowModel().rows.length === 0 ? (
              <tr style={{ border: 'none' }}>
                <td
                  colSpan={activeTable.getAllColumns().length}
                  className="text-center py-4 font-pathway"
                  style={{ color: '#808080' }}
                >
                  <h3>{emptyMessage}</h3>
                </td>
              </tr>
            ) : (
              activeTable.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t font-pathway">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2"
                      style={{
                        borderBottom: '1px solid #000',
                        padding: '10px ',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div
          className="mt-2 flex gap-2 pagination"
          style={{
            marginTop: '15px',
            alignItems: 'center',
            placeContent: 'center',
          }}
        >
          <button
            onClick={() => activeTable.previousPage()}
            disabled={!activeTable.getCanPreviousPage()}
          >
            <HiMiniChevronLeft style={{ verticalAlign: '-3px' }} /> Prev
          </button>
          <span style={{ padding: '0 10px' }}>
            {activeTable.getState().pagination.pageIndex + 1} of {activeTable.getPageCount()}
          </span>
          <button onClick={() => activeTable.nextPage()} disabled={!activeTable.getCanNextPage()}>
            Next <HiMiniChevronRight style={{ verticalAlign: '-3px' }} />
          </button>
        </div>
      </div>
      <br />
    </>
  );
}
