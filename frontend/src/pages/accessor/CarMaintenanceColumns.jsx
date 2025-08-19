import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";

const c = createColumnHelper();

export const carMaintenanceColumns = [
  c.accessor("make", { header: "Make" }),
  c.accessor("model", { header: "Model" }),
  c.accessor("startDate", { header: "Start Date" }),
  c.accessor("endDate", { header: "End Date" }),
  c.accessor("description", { header: "Description" }),
  c.accessor("shopName", { header: "Shop Name" }),
  c.accessor("maintenanceFee", { header: "Maintenance Fee" }),
];
