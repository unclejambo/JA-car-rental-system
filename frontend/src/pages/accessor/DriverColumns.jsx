import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";

const c = createColumnHelper();

export const driverColumns = [
  c.accessor("driverFirstName", { header: "First Name" }),
  c.accessor("driverLastName", { header: "Last Name" }),
  c.accessor("driverAddress", {
    header: "Address",
    cell: (info) => <span>{info.getValue().slice(0, 31)}</span>,
  }),
  c.accessor("contactNumber", { header: "Contact Number" }),
  c.accessor("driverLicense", { header: "Driver License" }),
  c.accessor("restriction", { header: "Restriction" }),
  c.accessor("expirationDate", { header: "Expiration Date" }),
  c.accessor("username", { header: "Username" }),
  c.accessor("password", { header: "Password" }),
  c.accessor("status", {
    header: "Status",
    cell: (info) => {
      const currentStatus = info.getValue();
      const statusOptions = ["Active", "Inactive"];
      const otherOption = statusOptions.find(
        (option) => option !== currentStatus
      );

      const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        // Update the row data with the new status
        info.table.options.meta?.updateData(
          info.row.index,
          "status",
          newStatus
        );
      };

      return (
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          className="select-opt"
        >
          <option value={currentStatus}>{currentStatus}</option>
          <option value={otherOption}>{otherOption}</option>
        </select>
      );
    },
  }),
];
