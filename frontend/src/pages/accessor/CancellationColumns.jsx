import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";
import { HiCheckCircle } from "react-icons/hi2";

const c = createColumnHelper();

export const cancellationColumns = [
  c.accessor("customerName", { header: "Customer Name" }),
  c.accessor("carModel", { header: "Car Model" }),
  c.accessor("bookingDate", { header: "Booking Date" }),
  c.accessor("reason", { header: "Reason" }),
  c.accessor("startDate", { header: "Start Date" }),
  c.accessor("endDate", {
    header: "End Date",
    cell: (info) => {
      return (
        <span
          className="inline-flex items-center gap-1 status"
          style={{ position: "relative" }}
        >
          {info.getValue()}
          <button
            className="approve-btn"
            onClick={() => console.log("Approved")}
          >
            <HiCheckCircle className="w-[30px] h-[30px]" />
          </button>
        </span>
      );
    },
  }),
];
