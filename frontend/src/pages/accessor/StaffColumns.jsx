import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";

const c = createColumnHelper();

export const staffColumns = [
  c.accessor("staffFirstName", { header: "First Name" }),
  c.accessor("staffLastName", { header: "Last Name" }),
  c.accessor("staffAddress", {
    header: "Address",
    cell: (info) => <span>{info.getValue().slice(0, 31)}</span>,
  }),
  c.accessor("contactNumber", { header: "Contact Number" }),
  c.accessor("staffEmail", { header: "Email" }),
  c.accessor("username", { header: "Username" }),
  c.accessor("password", { header: "Password" }),
  c.accessor("status", {
    header: "Status",
    cell: (info) => {
      const row = info.row.original;

      if (row.type === "ADMIN") {
        return row.type;
      }

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
