import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import "../../styles/index.css";

const c = createColumnHelper();

export const userColumns = [
  c.accessor("firstName", { header: "First Name" }),
  c.accessor("lastName", { header: "Last Name" }),
  c.accessor("address", { header: "Address" }),
  c.accessor("contactNumber", { header: "Contact Number" }),
  c.accessor("driverLicense", { header: "Driver License" }),
  c.accessor("username", { header: "Username" }),
  c.accessor("password", { header: "Password" }),
  c.accessor("status", { header: "Status" }),
];
