
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";
import { MdEdit } from "react-icons/md";


const c = createColumnHelper();

export const carColumns = (openEditModal) => [
  c.accessor("model", { header: "Model" }),
  c.accessor("make", { header: "Make" }),
  c.accessor("type", { header: "Type" }),
  c.accessor("year", { header: "Year" }),
  c.accessor("mileage", { header: "Mileage" }),
  c.accessor("seats", { header: "Seats" }),
  c.accessor("rentPrice", { header: "Rent Price" }),
  c.accessor("licensePlate", { header: "License Plate" }),
  c.accessor("status", {
    header: "Status",
    accessorKey: "status",
    cell: (info) => (
      <span>
        {info.getValue()}
        <MdEdit
          className="edit-icon"
          style={{ marginLeft: 6 }}
          onClick={() => openEditModal(info.row.original)}
        />
      </span>
    ),
  }),
];
