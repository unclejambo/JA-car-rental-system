import AdminSideBar from '../../components/AdminSideBar';
import Header from '../../components/Header';
import '../../styles/admincss/adminbooking.css';
import React, { useState, useEffect } from 'react';
import { bookingColumns } from '../accessor/BookingColumns.jsx';
import { cancellationColumns } from '../accessor/CancellationColumns.jsx';
import { useCancellationStore } from '../../store/cancellation.js';
import { useExtensionStore } from '../../store/extension.js';
import { extensionColumns } from '../accessor/ExtensionColumns.jsx';
import { HiBookOpen } from 'react-icons/hi2';
import { HiOutlineCurrencyDollar } from 'react-icons/hi2';
import ManageFeesModal from '../../components/modal/ManageFeesModal';
import AdminTable from '../../components/AdminTable';

export default function AdminBookingPage() {
  // Bookings: fetch from MockAPI instead of local store
  const [bookingData, setBookingData] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const cancellationData = useCancellationStore((state) => state.cancellations);
  const extensionData = useExtensionStore((state) => state.extensions);
  const [showManageFeesModal, setShowManageFeesModal] = useState(false);

  // State for tracking active request type
  const [requestType, setRequestType] = useState('booking');

  // Fetch bookings from MockAPI on mount
  useEffect(() => {
    const controller = new AbortController();
    const fetchBookings = async () => {
      try {
        setBookingLoading(true);
        setBookingError(null);
        const res = await fetch(
          'https://68b2fd5cc28940c9e69de1ab.mockapi.io/bookings',
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        // Ensure data is an array
        setBookingData(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setBookingError(err.message || 'Unknown error');
        }
      } finally {
        setBookingLoading(false);
      }
    };
    fetchBookings();
    return () => controller.abort();
  }, []);

  // Determine current table config
  const getActiveConfig = () => {
    switch (requestType) {
      case 'booking':
        return {
          data: bookingData,
          columns: bookingColumns,
          emptyMessage: 'There are no booking requests yet.',
          title: 'BOOKING REQUESTS',
          loading: bookingLoading,
          error: bookingError,
        };
      case 'cancellation':
        return {
          data: cancellationData,
          columns: cancellationColumns,
          emptyMessage: 'There are no cancellation requests yet.',
          title: 'CANCELLATION REQUESTS',
          loading: false,
          error: null,
        };
      case 'extension':
      default:
        return {
          data: extensionData,
          columns: extensionColumns,
          emptyMessage: 'There are no extension requests yet.',
          title: 'EXTENSION REQUESTS',
          loading: false,
          error: null,
        };
    }
  };

  const { data, columns, emptyMessage, title, loading, error } = getActiveConfig();

  const getButtonClass = (type) => {
    return `tab-btn ${requestType === type ? 'active' : ''}`;
  };

  return (
    <>
      <Header />
      <AdminSideBar />
      <ManageFeesModal
        show={showManageFeesModal}
        onClose={() => setShowManageFeesModal(false)}
      />
      <div className="requests-container">
        <button
          className={getButtonClass('booking')}
          onClick={() => setRequestType('booking')}
        >
          Booking
        </button>
        <button
          className={getButtonClass('cancellation')}
          onClick={() => setRequestType('cancellation')}
        >
          Cancellation
        </button>
        <button
          className={getButtonClass('extension')}
          onClick={() => setRequestType('extension')}
        >
          Extension
        </button>
      </div>
      <div>
        <button
          className="manage-fees-btn"
          onClick={() => setShowManageFeesModal(true)}
        >
          <HiOutlineCurrencyDollar
            style={{ verticalAlign: '-3px', marginRight: '3px' }}
          />
          Manage Fees
        </button>
      </div>
      <div className="page-content-booking">
        <title>Manage Bookings</title>

        <AdminTable
          data={data}
          columns={columns}
          title={title}
          Icon={HiBookOpen}
          emptyMessage={emptyMessage}
          loading={loading}
          error={error}
          pageSize={5}
        />
      </div>
      <br />
    </>
  );
}
