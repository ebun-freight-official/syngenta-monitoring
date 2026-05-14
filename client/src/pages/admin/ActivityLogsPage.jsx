import React, { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import { empty_illustration, error_illustration } from "../../consts/images";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import useGetAllActivityLogs from "../../hooks/useGetAllActivityLogs";
import { DateTime } from "luxon";
import clsx from "clsx";
import {
  TableEmpty,
  TableError,
  TableLoading,
} from "../../components/TablesState";
import PageHeader from "../../components/PageHeader";
import FilterDropdown from "../../components/ui/FilterDropdown";
import { DateFilter, SelectFilter } from "../../components/ui/FilterFields";

const defaultFilters = {
  type: "",
  sort: "latest",
  date: "",
  perPage: 100,
  page: 1,
};

function ActivityLogsPage() {
  const { getAllActivityLogs, isLoading } = useGetAllActivityLogs();
  const [allActivityLogs, setAllActivityLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(defaultFilters);
  const [tempFilters, setTempFilters] = useState(defaultFilters);

  const handleChangeFilter = (e) => {
    const { name, value } = e.target;
    setTempFilters((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleChangePage = (direction) => {
    if (direction === "prev" && filters.page > 1)
      setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
    else if (direction === "next" && filters.page < totalPages)
      setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  useEffect(() => {
    const handleGetAllActivityLogs = async () => {
      const { activityLogs, total, page, totalPages, error } =
        await getAllActivityLogs(filters);
      if (error) setError(error);
      setAllActivityLogs(activityLogs);
      setTotal(total);
      setPage(page);
      setTotalPages(totalPages);
    };
    handleGetAllActivityLogs();
  }, [filters]);

  const btnBase =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const hasActiveFilters = Object.keys(defaultFilters).some(
    (k) =>
      !["sort", "perPage", "page", "search"].includes(k) &&
      tempFilters[k] !== defaultFilters[k],
  );

  return (
    <div className="flex-1 flex flex-col gap-4 lg:gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-start gap-2">
        <div className="flex justify-between flex-1 items-center md:items-start">
          <PageHeader
            header={" Activity Logs"}
            subheader={"Track and review all system activity logs"}
          />
        </div>

        <div className="flex flex-wrap justify-between gap-2 w-full xl:w-auto">
          <div className="flex gap-2 max-sm:justify-between max-sm:w-full">
            {/* Filter */}
            <FilterDropdown
              hasActiveFilters={hasActiveFilters}
              onReset={handleResetFilters}
              onApply={handleApplyFilters}
              isLoading={isLoading}
            >
              <SelectFilter
                label="Type"
                name="type"
                value={tempFilters.type}
                onChange={handleChangeFilter}
              >
                <option value="">All</option>
                <option value="admin">Admins</option>
                <option value="deployment">Deployments</option>
                <option value="driver">Drivers</option>
                <option value="truck">Trucks</option>
                <option value="visitor">Visitors</option>
              </SelectFilter>

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
              </SelectFilter>

              <DateFilter
                label="Date"
                name="date"
                type="date"
                value={tempFilters.date}
                onChange={handleChangeFilter}
                colSpan={2}
              />
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
                  allActivityLogs &&
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
          </div>
        </div>
      </div>

      {/* ── Table / States ──────────────────────────────────────────────── */}
      {isLoading ? (
        <TableLoading />
      ) : error ? (
        <TableError />
      ) : !allActivityLogs || allActivityLogs.length === 0 ? (
        <TableEmpty />
      ) : (
        <div className="relative flex-1 overflow-y-auto scrollbar-thin bg-white">
          <div className="absolute inset-0">
            <table className="table text-xs sm:table-sm table-pin-rows table-pin-cols border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 max-md:text-xxs text-xs uppercase tracking-wide">
                  <td>{total}</td>
                  <td>Role</td>
                  <td>Performed by</td>
                  <td>Action</td>
                  <td>Performed at</td>
                </tr>
              </thead>
              <tbody>
                {allActivityLogs.map((activityLog, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 last:border-none hover:bg-gray-50 capitalize align-top transition-colors text-gray-600"
                  >
                    <td className="text-xxs sm:text-xs font-semibold text-gray-400">
                      {(page - 1) * filters.perPage + index + 1}
                    </td>
                    <td className="capitalize max-sm:text-xxs text-nowrap">
                      {activityLog?.performedBy?.role?.replace(/_/g, " ")}
                    </td>
                    <td className="capitalize max-sm:text-xxs text-nowrap">
                      {`${activityLog?.performedBy?.firstname} ${activityLog?.performedBy?.lastname}`}
                    </td>
                    <td className="max-sm:text-xxs line-clamp-2">
                      {activityLog?.action}
                    </td>
                    <td className="max-sm:text-xxs text-nowrap">
                      {DateTime.fromISO(activityLog?.createdAt)
                        .setZone("Asia/Manila")
                        .toFormat("MMM d, yyyy hh:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityLogsPage;
