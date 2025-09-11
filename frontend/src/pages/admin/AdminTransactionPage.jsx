import React, { useMemo, useState } from 'react';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
//import "../../styles/admin-main.css";
import { HiDocumentCurrencyDollar } from 'react-icons/hi2';
import { useTransactionStore } from '../../store/transactions';
import AdminTable from '../../ui/components/AdminTable';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function AdminTransactionPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { transactions } = useTransactionStore();
  const [activeTab, setActiveTab] = useState('all');

  const getButtonClass = (tabName) => {
    return `tab-btn ${activeTab === tabName ? 'active' : ''}`;
  };

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;
    if (activeTab === 'payment')
      return transactions.filter((tx) => tx.paymentStatus === 'Paid');
    if (activeTab === 'refund')
      return transactions.filter((tx) => tx.paymentStatus === 'Refunded');
    return transactions;
  }, [transactions, activeTab]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'transactionId',
        header: 'ID',
        cell: (info) => `#${info.getValue()}`,
      },
      {
        accessorKey: 'bookingDate',
        header: 'Booking Date',
        cell: (info) => formatDate(info.getValue()),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
      },
      {
        accessorKey: 'carModel',
        header: 'Car Model',
      },
      {
        accessorKey: 'completionDate',
        header: 'Completion Date',
        cell: (info) => formatDate(info.getValue()),
      },
      {
        accessorKey: 'cancellationDate',
        header: 'Cancellation Date',
        cell: (info) => (info.getValue() ? formatDate(info.getValue()) : 'N/A'),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Status',
        cell: (info) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              info.getValue() === 'Paid'
                ? 'bg-green-100 text-green-800'
                : info.getValue() === 'Refunded'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {info.getValue()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="page-container">
        <div className="cars-container">
          <button
            className={getButtonClass('all')}
            onClick={() => setActiveTab('all')}
          >
            ALL TRANSACTIONS
          </button>
          <button
            className={getButtonClass('payment')}
            onClick={() => setActiveTab('payment')}
          >
            Payment Logs
          </button>
          <button
            className={getButtonClass('refund')}
            onClick={() => setActiveTab('refund')}
          >
            Refund Logs
          </button>
        </div>
        <div>
          <title>Transaction Logs</title>

          <AdminTable
            data={filteredTransactions}
            columns={columns}
            title={'TRANSACTIONS'}
            Icon={HiDocumentCurrencyDollar}
            emptyMessage={'No transactions found'}
            pageSize={5}
          />
        </div>
      </div>
    </>
  );
}
