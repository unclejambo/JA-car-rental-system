import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/adminmanageuser.css";
import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useUserStore } from "../../store/users.js";
import { userColumns } from "../accessor/UserColumns.jsx";
import { useStaffStore } from "../../store/staff.js";
import { staffColumns } from "../accessor/StaffColumns.jsx";
import { useDriverStore } from "../../store/driver.js";
import { driverColumns } from "../accessor/DriverColumns.jsx";
import { HiMiniChevronRight } from "react-icons/hi2";
import { HiMiniChevronLeft } from "react-icons/hi2";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { AiOutlinePlus } from "react-icons/ai";
import AddStaffModal from "../../components/modal/AddStaffModal";
import AddDriverModal from "../../components/modal/AddDriverModal";

export default function AdminManageUser() {
  const userData = useUserStore((state) => state.users);
  const staffData = useStaffStore((state) => state.staff);
  const driverData = useDriverStore((state) => state.driver);

  const [userType, setUserType] = useState("customer"); // 'customer', 'staff', or 'driver'
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  const openAddStaffModal = () => setShowAddStaffModal(true);
  const closeAddStaffModal = () => setShowAddStaffModal(false);
  
  const openAddDriverModal = () => setShowAddDriverModal(true);
  const closeAddDriverModal = () => setShowAddDriverModal(false);

  const [users, setUsers] = useState(userData);
  const [staff, setStaff] = useState(staffData);
  const [drivers, setDrivers] = useState(driverData);

  const updateUserStatus = (rowIndex, columnId, value) => {
    setUsers((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [columnId]: value } : row
      )
    );
  };

  const updateStaffStatus = (rowIndex, columnId, value) => {
    setStaff((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [columnId]: value } : row
      )
    );
  };

  const updateDriverStatus = (rowIndex, columnId, value) => {
    setDrivers((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [columnId]: value } : row
      )
    );
  };

  const userTable = useReactTable({
    data: users,
    columns: userColumns,
    state: { sorting, pagination },
    meta: {
      updateData: updateUserStatus,
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const staffTable = useReactTable({
    data: staff,
    columns: staffColumns,
    state: { sorting, pagination },
    meta: {
      updateData: updateStaffStatus,
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const driverTable = useReactTable({
    data: drivers,
    columns: driverColumns,
    state: { sorting, pagination },
    meta: {
      updateData: updateDriverStatus,
    },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getActiveTable = () => {
    switch (userType) {
      case "staff":
        return { table: staffTable, data: staff, setData: setStaff };
      case "driver":
        return { table: driverTable, data: drivers, setData: setDrivers };
      case "customer":
      default:
        return { table: userTable, data: users, setData: setUsers };
    }
  };

  const { table: activeTable } = getActiveTable();
  const emptyMessage = {
    customer: "There are no customers yet.",
    staff: "There are no staff members yet.",
    driver: "There are no drivers yet.",
  };

  const getButtonClass = (type) => {
    return `tab-btn ${userType === type ? "active" : ""}`;
  };

  return (
    <>
      <Header />
      <AdminSideBar />
      
      <AddStaffModal show={showAddStaffModal} onClose={closeAddStaffModal} />
      <AddDriverModal show={showAddDriverModal} onClose={closeAddDriverModal} />
      <div className="users-container">
        <button
          className={getButtonClass("customer")}
          onClick={() => setUserType("customer")}
        >
          Customers
        </button>
        <button
          className={getButtonClass("staff")}
          onClick={() => setUserType("staff")}
        >
          Staff
        </button>
        <button
          className={getButtonClass("driver")}
          onClick={() => setUserType("driver")}
        >
          Driver
        </button>
      </div>
      <div className="page-content-customers">
        <title>Manage Users</title>

        <h1 className="font-pathway text-2xl header-req">
          <HiOutlineUserGroup
            style={{ verticalAlign: "-3px", marginRight: "5px" }}
          />
          {userType.toUpperCase()}
        </h1>

        {userType === "staff" && (
          <button className="add-car-btn" onClick={openAddStaffModal}>
            <AiOutlinePlus className="add-icon" style={{ marginRight: 6 }} />
            ADD NEW STAFF
          </button>
        )}
        {userType === "driver" && (
          <button className="add-car-btn" onClick={openAddDriverModal}>
            <AiOutlinePlus className="add-icon" style={{ marginRight: 6 }} />
            ADD NEW DRIVER
          </button>
        )}
        <table className="admin-table">
          <thead>
            {activeTable.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left cursor-pointer border font-pathway"
                    style={{
                      fontSize: "18px",
                      padding: "3px 3px 3px 10px",
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted()
                      ? header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : " ↓"
                      : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {activeTable.getRowModel().rows.length === 0 ? (
              <tr style={{ border: "none" }}>
                <td
                  colSpan={activeTable.getAllColumns().length}
                  className="text-center py-4 font-pathway"
                  style={{ color: "#808080" }}
                >
                  <h3>{emptyMessage[userType]}</h3>
                </td>
              </tr>
            ) : (
              activeTable.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t font-pathway">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2"
                      style={{
                        borderBottom: "1px solid #000",
                        padding: "10px ",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div
          className="mt-2 flex gap-2 pagination"
          style={{
            marginTop: "15px",
            alignItems: "center",
            placeContent: "center",
          }}
        >
          <button
            onClick={() => activeTable.previousPage()}
            disabled={!activeTable.getCanPreviousPage()}
          >
            <HiMiniChevronLeft style={{ verticalAlign: "-3px" }} /> Prev
          </button>
          <span style={{ padding: "0 10px" }}>
            {activeTable.getState().pagination.pageIndex + 1} of{" "}
            {activeTable.getPageCount()}
          </span>
          <button
            onClick={() => activeTable.nextPage()}
            disabled={!activeTable.getCanNextPage()}
          >
            Next <HiMiniChevronRight style={{ verticalAlign: "-3px" }} />
          </button>
        </div>
      </div>
    </>
  );
}
