import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/adminmanageuser.css";
import React, { useMemo, useState } from "react";
import { useUserStore } from "../../store/users.js";
import { userColumns } from "../accessor/UserColumns.jsx";
import { useStaffStore } from "../../store/staff.js";
import { staffColumns } from "../accessor/StaffColumns.jsx";
import { useDriverStore } from "../../store/driver.js";
import { driverColumns } from "../accessor/DriverColumns.jsx";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { AiOutlinePlus } from "react-icons/ai";
import AddStaffModal from "../../components/modal/AddStaffModal";
import AddDriverModal from "../../components/modal/AddDriverModal";
import AdminTable from "../../components/AdminTable";

export default function AdminManageUser() {
  const userData = useUserStore((state) => state.users);
  const staffData = useStaffStore((state) => state.staff);
  const driverData = useDriverStore((state) => state.driver);

  const [userType, setUserType] = useState("customer"); // 'customer', 'staff', or 'driver'
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

  const activeConfig = useMemo(() => {
    switch (userType) {
      case "staff":
        return { data: staff, columns: staffColumns, meta: { updateData: updateStaffStatus }, empty: "There are no staff members yet." };
      case "driver":
        return { data: drivers, columns: driverColumns, meta: { updateData: updateDriverStatus }, empty: "There are no drivers yet." };
      case "customer":
      default:
        return { data: users, columns: userColumns, meta: { updateData: updateUserStatus }, empty: "There are no customers yet." };
    }
  }, [userType, users, staff, drivers]);
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
        <AdminTable
          data={activeConfig.data}
          columns={activeConfig.columns}
          title={userType.toUpperCase()}
          Icon={HiOutlineUserGroup}
          emptyMessage={activeConfig.empty}
          meta={activeConfig.meta}
          pageSize={10}
        />
      </div>
    </>
  );
}
