import AdminSideBar from '../../components/AdminSideBar';
import Header from '../../components/Header';
import '../../styles/admincss/adminschedule.css';
import React, { useMemo, useState } from 'react';
import { scheduleColumns } from '../accessor/ScheduleColumns.jsx';
import { useScheduleStore } from '../../store/schedule.js';
import { HiCalendarDays, HiMagnifyingGlass } from 'react-icons/hi2';
import ReleaseModal from '../../components/modal/ReleaseModal.jsx';
import ReturnModal from '../../components/modal/ReturnModal.jsx';
import AdminTable from '../../components/AdminTable';

export default function AdminSchedulePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const allData = useScheduleStore((state) => state.reservations);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return allData;
    const term = searchTerm.toLowerCase();
    return allData.filter(
      (item) =>
        (item.customerName && item.customerName.toLowerCase().includes(term)) ||
        (item.driverName && item.driverName.toLowerCase().includes(term))
    );
  }, [allData, searchTerm]);

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleReleaseClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReleaseModal(true);
  };

  const handleReturnClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReturnModal(true);
  };

  const columns = useMemo(
    () => scheduleColumns(handleReleaseClick, handleReturnClick),
    [handleReleaseClick, handleReturnClick]
  );

  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {showReleaseModal && (
        <ReleaseModal
          show={showReleaseModal}
          onClose={() => setShowReleaseModal(false)}
          reservation={selectedReservation}
        />
      )}

      {showReturnModal && (
        <ReturnModal
          show={showReturnModal}
          onClose={() => setShowReturnModal(false)}
          reservation={selectedReservation}
        />
      )}
      <div className="page-container page-content">
        <title>Schedule</title>

        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <HiMagnifyingGlass className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="p-4">
          <AdminTable
            data={filteredData}
            columns={columns}
            title={'SCHEDULES'}
            Icon={HiCalendarDays}
            emptyMessage={'There are no schedules yet.'}
            pageSize={10}
          />
        </div>
      </div>
    </>
  );
}
