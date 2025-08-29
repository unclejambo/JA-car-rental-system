import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import '../../styles/index.css';

const c = createColumnHelper();

export const scheduleColumns = (openReleaseModal, openReturnModal) => [
  c.accessor('customerName', { header: 'Customer Name' }),
  c.accessor('startDate', { header: 'Start Date' }),
  c.accessor('pickupTime', { header: 'Pick-up Time' }),
  c.accessor('pickupLocation', { header: 'Pick-up Location' }),
  c.accessor('endDate', { header: 'End Date' }),
  c.accessor('dropOffTime', { header: 'Drop-Off Time' }),
  c.accessor('dropOffLocation', { header: 'Drop-Off Location' }),
  c.accessor('selfDrive', { header: 'Self Drive' }),
  c.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue();
      const row = info.row.original;

      if (status === 'Ongoing') {
        return (
          <span className="inline-flex items-center gap-1 status">
            {status}
            <button
              type="button"
              onClick={() => {
                console.log('Track live for row', row.reservationId);
              }}
              id="globeButton"
            >
              <GlobeAltIcon
                className="w-[20px] h-[20px]"
                style={{ verticalAlign: 'middle', position: 'relative' }}
              />
            </button>
          </span>
        );
      }

      if (row.startDate === '2025-07-06') {
        return (
          <span className="inline-flex items-center gap-1 status">
            <button
              type="button"
              onClick={() => openReleaseModal(row.original)}
              className="release-btn"
            >
              Release
            </button>
          </span>
        );
      }

      if (row.endDate === '2025-08-13') {
        return (
          <span className="inline-flex items-center gap-1 status">
            <button
              type="button"
              onClick={() => openReturnModal(row.original)}
              className="return-btn"
            >
              Return
            </button>
          </span>
        );
      }

      return status;
    },
  }),
];
