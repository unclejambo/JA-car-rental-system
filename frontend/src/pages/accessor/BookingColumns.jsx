import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import '../../styles/index.css';

const c = createColumnHelper();

export const bookingColumns = [
  c.accessor('customerName', { header: 'Customer Name' }),
  c.accessor('carModel', { header: 'Car Model' }),
  c.accessor('bookingDate', {
    header: 'Booking Date',
    cell: (info) => <span>{info.getValue().slice(0, 10)}</span>,
  }),
  c.accessor('purpose', {
    header: 'Purpose',
  }),
  c.accessor('startDate', {
    header: 'Start Date',
    cell: (info) => <span>{info.getValue().slice(0, 10)}</span>,
  }),
  c.accessor('endDate', {
    header: 'End Date',
    cell: (info) => <span>{info.getValue().slice(0, 10)}</span>,
  }),
  c.accessor('paymentStatus', { header: 'Payment Status' }),
  c.accessor('bookingStatus', { header: 'Booking Status' }),
  //   c.accessor("action", {
  //     header: "",
  //     cell: (info) => {
  //       const status = info.getValue();
  //       const row = info.row.original;

  //       if (status === "Ongoing") {
  //         return (
  //           <span className="inline-flex items-center gap-1 status">
  //             {status}
  //             <button
  //               type="button"
  //               onClick={() => {
  //                 console.log("Track live for row", row.reservationId);
  //               }}
  //               id="globeButton"
  //             >
  //               <GlobeAltIcon style={{ height: "14px", width: "14px" }} />
  //             </button>
  //           </span>
  //         );
  //       }

  //       if (row.startDate === "2025-07-06") {
  //         return (
  //           <span className="inline-flex items-center gap-1 status">
  //             {status}
  //             <button
  //               type="button"
  //               onClick={() => {
  //                 console.log("Return button clicked for row", row.reservationId);
  //               }}
  //               className="release-btn"
  //             >
  //               Release
  //             </button>
  //           </span>
  //         );
  //       }

  //       if (row.endDate === "2025-08-13") {
  //         return (
  //           <span className="inline-flex items-center gap-1 status">
  //             {status}
  //             <button
  //               type="button"
  //               onClick={() => {
  //                 console.log("Return button clicked for row", row.reservationId);
  //               }}
  //               className="return-btn"
  //             >
  //               Return
  //             </button>
  //           </span>
  //         );
  //       }

  //       return status;
  //     },
  //   }),
];
