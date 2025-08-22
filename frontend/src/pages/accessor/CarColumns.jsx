import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";
import { MdEdit, MdDelete } from "react-icons/md";

const c = createColumnHelper();

export const carColumns = (openEditModal, handleDelete) => [
  c.accessor("car_img_url", {
    header: "Image",
    cell: (info) => (
      <img
        src={info.getValue() || 'https://via.placeholder.com/100'}
        alt="Car"
        style={{ width: '100px', height: 'auto', borderRadius: '5px' }}
      />
    ),
  }),
  c.accessor("model", { header: "Model" }),
  c.accessor("make", { header: "Make" }),
  c.accessor("year", { header: "Year" }),
  c.accessor("mileage", { 
    header: "Mileage",
    cell: info => info.getValue() ? info.getValue().toLocaleString() : 'N/A'
  }),
  c.accessor("no_of_seat", { header: "Seats" }),
  c.accessor("rent_price", { header: "Rent Price" }),
  c.accessor("license_plate", { header: "License Plate" }),
  c.accessor("car_status", {
    header: "Status",
    cell: (info) => (
      <span>
        {info.getValue() || 'Available'}
        <MdEdit
          className="edit-icon"
          style={{ marginLeft: 6 }}
          onClick={() => openEditModal(info.row.original)}
        />
        <MdDelete
          className="delete-icon"
          style={{ marginLeft: 6, color: 'red' }}
          onClick={() => handleDelete(info.row.original.car_id)}
        />
      </span>
    ),
  }),
];
