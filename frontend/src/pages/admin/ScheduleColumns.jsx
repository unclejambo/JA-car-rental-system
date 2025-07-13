import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import "../../styles/index.css";

const c = createColumnHelper();

export const scheduleColumns = [
  c.accessor("reservationId", { header: "ID" }),
  c.accessor("carPlate", { header: "Car" }),
  c.accessor("customerName", { header: "Customer" }),
  c.accessor("pickupDate", {
    header: "Pick-up",
    cell: (info) => info.getValue().slice(0, 10),
  }),
  c.accessor("returnDate", {
    header: "Return",
    cell: (info) => info.getValue().slice(0, 10),
  }),
  c.accessor("status", {
    header: "Status",
    cell: (info) => {
      const value = info.getValue();
      return value === "Ongoing" ? (
        <span className="inline-flex items-center gap-1">
          {value}
          <button
            type="button"
            onClick={() => {
              console.log(
                "Track live for row",
                info.row.original.reservationId
              );
            }}
            id="globeButton"
          >
            <GlobeAltIcon style={{ height: "14px", width: "14px" }} />
          </button>
        </span>
      ) : (
        value
      );
    },
  }),
];
