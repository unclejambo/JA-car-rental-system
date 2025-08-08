import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";

const c = createColumnHelper();

export const carColumns = [
  c.accessor("model", { header: "Model" }),
  c.accessor("make", { header: "Make" }),
  c.accessor("type", { header: "Type" }),
  c.accessor("year", { header: "Year" }),
  c.accessor("mileage", { header: "Mileage" }),
  c.accessor("seats", { header: "Seats" }),
  c.accessor("rentPrice", { header: "Rent Price" }),
  c.accessor("licensePlate", { header: "License Plate" }),
  c.accessor("status", { header: "Status" }),
];
