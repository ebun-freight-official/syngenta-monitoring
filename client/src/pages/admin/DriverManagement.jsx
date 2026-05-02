import React, { useEffect, useState } from "react";
import { FaFilter, FaPlus, FaSearch } from "react-icons/fa";
import {
  empty_illustration,
  error_illustration,
  no_image,
} from "../../consts/images";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import clsx from "clsx";
import CreateDriverModal from "../../components/modals/CreateDriverModal";
import DriverDetailsModal from "../../components/modals/DriverDetailsModal";
import useGetAllDriver from "../../hooks/useGetAllDriver";
import DeleteDriverModal from "../../components/modals/DeleteDriverModal";
import { useUserContext } from "../../contexts/UserContext";
import { useSettingsContext } from "../../contexts/SettingsContext";
import {
  TableEmpty,
  TableError,
  TableLoading,
} from "../../components/TablesState";
import PageHeader from "../../components/PageHeader";
import { getAvatarColor } from "../../utils/avatarColors";
import FilterDropdown from "../../components/ui/FilterDropdown";
import { SelectFilter } from "../../components/ui/FilterFields";

const defaultFilters = {
  status: "",
  sort: "latest",
  subcon: "",
  search: "",
  perPage: 100,
  page: 1,
};

/* ── Reusable driver avatar ─────────────────────────────────────────────── */
function DriverAvatar({ driver, size = "sm" }) {
  const fullName = `${driver.firstname ?? ""} ${driver.lastname ?? ""}`.trim();
  const initials =
    `${driver.firstname?.[0] ?? ""}${driver.lastname?.[0] ?? ""}`.toUpperCase();
  const avatarColor = getAvatarColor(fullName);

  const sizeClass = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const textSize = size === "sm" ? "text-[10px]" : "text-[11px]";

  if (driver.imageUrl) {
    return (
      <img
        src={driver.imageUrl}
        alt={fullName}
        className={clsx(
          sizeClass,
          "rounded-md object-cover object-center border border-gray-300",
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        sizeClass,
        "rounded-md flex items-center justify-center shrink-0",
        avatarColor.bg,
        avatarColor.border,
      )}
    >
      <span
        className={clsx("font-bold leading-none", textSize, avatarColor.text)}
      >
        {initials}
      </span>
    </div>
  );
}

function DriverManagement() {
  const [isDriverDetailsModalOpen, setIsDriverDetailsModalOpen] =
    useState(false);
  const [isCreateDriverModalOpen, setIsCreateDriverModalOpen] = useState(false);
  const [isDeleteDriverModalOpen, setIsDeleteDriverModalOpen] = useState(false);

  const { getAllDriverFunction, isLoading } = useGetAllDriver();
  const [allDrivers, setAllDrivers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState({});

  const [filters, setFilters] = useState(defaultFilters);
  const [tempFilters, setTempFilters] = useState(defaultFilters);

  const { userData } = useUserContext();
  const { settings } = useSettingsContext();

  const handleChangeFilter = (e) => {
    const { name, value } = e.target;
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (tempFilters.search === "" && filters.search !== "") {
      const delaySearch = setTimeout(() => {
        setFilters((prev) => ({ ...prev, search: "" }));
      }, 300);
      return () => clearTimeout(delaySearch);
    }
  }, [tempFilters.search, filters.search]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters(tempFilters);
  };

  const handleResetFilters = () => {
    const isDefault = Object.keys(defaultFilters).every(
      (key) => tempFilters[key] === defaultFilters[key],
    );
    if (!isDefault) {
      setTempFilters(defaultFilters);
      setFilters(defaultFilters);
    }
  };

  const handleClearSearch = () => {
    setTempFilters((prev) => ({ ...prev, search: "" }));
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  const handleChangePage = (direction) => {
    if (direction === "prev" && filters.page > 1)
      setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
    else if (direction === "next" && filters.page < totalPages)
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  const handleShowDriverDetailsModal = (data) => {
    setSelectedDriver(data);
    setIsDriverDetailsModalOpen(true);
  };

  const handleUpdateAllAdmins = (updatedDriver) => {
    setAllDrivers((prev) =>
      prev.map((driver) =>
        driver._id === updatedDriver._id ? updatedDriver : driver,
      ),
    );
  };

  const handleRemoveDeletedDriver = (deletedDriver) => {
    setAllDrivers((prev) =>
      prev.filter((driver) => driver._id !== deletedDriver),
    );
    setIsDeleteDriverModalOpen(false);
    setIsDriverDetailsModalOpen(false);
  };

  const handleAddNewDriver = (newDriver) => {
    setAllDrivers((prev) => [newDriver, ...prev]);
  };

  useEffect(() => {
    const handleGetAllDrivers = async () => {
      const { drivers, total, page, totalPages, error } =
        await getAllDriverFunction(filters);
      if (error) setError(error);
      setAllDrivers(drivers);
      setTotal(total);
      setPage(page);
      setTotalPages(totalPages);
    };
    handleGetAllDrivers();
  }, [filters]);

  const btnBase =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const hasActiveFilters = Object.keys(defaultFilters).some(
    (k) =>
      !["sort", "perPage", "page", "search"].includes(k) &&
      tempFilters[k] !== defaultFilters[k],
  );

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 lg:gap-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="flex justify-between flex-1 items-start">
            <PageHeader
              header={"Manage Drivers"}
              subheader={"View and manage all drivers in the system"}
            />

            <div className="flex gap-2 xl:hidden">
              {["head_admin", "admin"].includes(userData.data.role) && (
                <button
                  onClick={() => setIsCreateDriverModalOpen(true)}
                  disabled={isLoading}
                  className={clsx(
                    btnBase,
                    "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100",
                  )}
                >
                  <FaPlus className="text-xs" />
                  <span className="text-xs sm:text-sm">Create New</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-2 w-full xl:w-auto">
            {/* Search */}
            <form
              onSubmit={handleApplyFilters}
              className="flex flex-1 min-w-0 xl:w-64 items-center bg-white border border-gray-200 focus-within:border-gray-400 rounded-md px-3 py-2 gap-2 transition-all duration-200"
            >
              <FaSearch className="text-gray-400 text-xs shrink-0" />
              <input
                type="text"
                name="search"
                placeholder="Search drivers..."
                value={tempFilters.search}
                onChange={handleChangeFilter}
                autoComplete="off"
                className="w-full min-w-0 focus:outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400 bg-transparent"
              />
              <button
                type="button"
                onClick={handleClearSearch}
                className={clsx(
                  "rounded-full hover:bg-gray-100 cursor-pointer transition-all duration-200",
                  {
                    "opacity-100": tempFilters.search,
                    "opacity-0 pointer-events-none": !tempFilters.search,
                  },
                )}
              >
                <IoClose className="text-base text-gray-400" />
              </button>
            </form>

            <div className="flex gap-2 max-sm:justify-between max-sm:w-full">
              {/* Filter */}
              <FilterDropdown
                hasActiveFilters={hasActiveFilters}
                onReset={handleResetFilters}
                onApply={handleApplyFilters}
                isLoading={isLoading}
              >
                {/* sort */}
                <SelectFilter
                  label="Sort"
                  name="sort"
                  value={tempFilters.sort}
                  onChange={handleChangeFilter}
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="a-z">A to Z</option>
                  <option value="z-a">Z to A</option>
                  <option value="trips-asc">Trip-asc</option>
                  <option value="trips-desc">Trip-desc</option>
                  <option value="subcon-desc">Subcon-desc</option>
                  <option value="subcon-asc">Subcon-asc</option>
                </SelectFilter>

                {/* status */}
                <SelectFilter
                  label="Status"
                  name="status"
                  value={tempFilters.status}
                  onChange={handleChangeFilter}
                >
                  <option value="">All</option>
                  {settings.trucksDrivers.status.map((item, index) => (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectFilter>

                {/* subcon */}
                {userData.data.role !== "subcon" && (
                  <SelectFilter
                    label="Subcon"
                    name="subcon"
                    value={tempFilters.subcon}
                    onChange={handleChangeFilter}
                    colSpan={2}
                  >
                    <option value="">All</option>
                    {settings.trucksDrivers.subcon.map((item, index) => (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    ))}
                  </SelectFilter>
                )}
              </FilterDropdown>

              {/* Pagination */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => handleChangePage("prev")}
                  disabled={isLoading || filters.page === 1}
                  className="p-2 py-1 text-xl hover:bg-gray-50 cursor-pointer border-r border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <MdOutlineKeyboardArrowLeft />
                </button>
                <p className="text-xs text-gray-600 sm:min-w-24 text-center px-2">
                  {!isLoading &&
                    allDrivers &&
                    `Page ${total > 0 ? page : 0} of ${totalPages}`}
                </p>
                <button
                  onClick={() => handleChangePage("next")}
                  disabled={isLoading || filters.page === totalPages}
                  className="p-2 py-1 text-xl hover:bg-gray-50 cursor-pointer border-l border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <MdOutlineKeyboardArrowRight />
                </button>
              </div>

              {/* xl Create */}
              {["head_admin", "admin"].includes(userData.data.role) && (
                <button
                  onClick={() => setIsCreateDriverModalOpen(true)}
                  disabled={isLoading}
                  className={clsx(
                    btnBase,
                    "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 max-xl:hidden",
                  )}
                >
                  <FaPlus className="text-xs" />
                  <span>Create New</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table / States ──────────────────────────────────────────────── */}
        {isLoading ? (
          <TableLoading />
        ) : error ? (
          <TableError />
        ) : allDrivers.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="relative flex-1 overflow-y-auto scrollbar-thin bg-white">
            <div className="absolute inset-0">
              <table className="table text-xs sm:table-sm table-pin-rows table-pin-cols">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 max-md:text-xxs text-xs uppercase tracking-wide">
                    <td>{total}</td>
                    <td>Image</td>
                    <td>Fullname</td>
                    <td>Phone No.</td>
                    <td>License No.</td>
                    <td>Subcon</td>
                    <td>Trip Count</td>
                    <td>Status</td>
                  </tr>
                </thead>
                <tbody>
                  {allDrivers.map((driver, index) => (
                    <tr
                      key={index}
                      onClick={() => handleShowDriverDetailsModal(driver)}
                      className="border-b border-gray-100 last:border-none hover:bg-gray-50 capitalize cursor-pointer align-middle transition-colors text-gray-600"
                    >
                      <td className="text-xxs sm:text-xs font-semibold text-gray-400">
                        {(page - 1) * filters.perPage + index + 1}
                      </td>
                      <td className="py-1.5">
                        <DriverAvatar driver={driver} size="sm" />
                      </td>
                      <td>
                        <p className="max-sm:text-xxs text-nowrap capitalize">
                          {`${driver.firstname} ${driver.lastname}`}
                        </p>
                      </td>
                      <td className="max-sm:text-xxs">{driver.phoneNo}</td>
                      <td>
                        {driver.licenseNo ? (
                          <p className="text-nowrap uppercase max-sm:text-xxs">
                            {driver.licenseNo}
                          </p>
                        ) : (
                          <p className="text-gray-400 max-sm:text-xxs font-light">
                            N/A
                          </p>
                        )}
                      </td>
                      <td className="max-sm:text-xxs text-nowrap">
                        {driver.subcon
                          ? driver.subcon.replace(/_/g, " ")
                          : "N/A"}
                      </td>
                      <td className="max-sm:text-xxs">{driver.tripCount}</td>
                      <td>
                        <div
                          className={clsx(
                            "px-2.5 py-1 rounded-full w-fit text-xxs xs:text-xs",
                            {
                              "bg-emerald-50 text-emerald-600":
                                driver.status === "available",
                              "bg-blue-50 text-blue-500":
                                driver.status === "deployed",
                              "bg-red-50 text-red-500":
                                driver.status === "unavailable",
                            },
                          )}
                        >
                          {driver.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <DriverDetailsModal
        isOpen={isDriverDetailsModalOpen}
        onClose={() => setIsDriverDetailsModalOpen(false)}
        driver={selectedDriver}
        onUpdate={handleUpdateAllAdmins}
        openDeleteModal={() => setIsDeleteDriverModalOpen(true)}
      />
      <CreateDriverModal
        isOpen={isCreateDriverModalOpen}
        onClose={() => setIsCreateDriverModalOpen(false)}
        onCreate={handleAddNewDriver}
      />
      <DeleteDriverModal
        isOpen={isDeleteDriverModalOpen}
        onClose={() => setIsDeleteDriverModalOpen(false)}
        driver={selectedDriver}
        onDelete={handleRemoveDeletedDriver}
      />
    </>
  );
}

export default DriverManagement;
