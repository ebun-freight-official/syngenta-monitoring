import React from "react";
import { FaFilter } from "react-icons/fa";
import clsx from "clsx";

const FilterDropdown = ({
  hasActiveFilters = false,
  onReset,
  onApply,
  isLoading = false,
  children,
}) => {
  return (
    <div className="dropdown dropdown-start sm:dropdown-center">
      <div
        tabIndex={0}
        role="button"
        className="relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      >
        <FaFilter className="text-xs" />
        <span className="text-xs sm:text-sm">Filter</span>
        {hasActiveFilters && (
          <span className="w-2 aspect-square rounded-full bg-emerald-500 shrink-0 absolute -top-0.5 -right-0.5" />
        )}
      </div>

      <div
        tabIndex="0"
        className="dropdown-content mt-2 bg-white shadow-lg shadow-gray-200/60 rounded-md border border-gray-200 w-[calc(100vw-2rem)] sm:max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Filter Body */}
        <div className="p-3 sm:p-4">
          <div className="max-sm:max-h-80 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">{children}</div>
          </div>
        </div>

        {/* Filter Footer */}
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 flex gap-2">
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex-1 py-2 rounded-md text-xs font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            disabled={isLoading}
            className="flex-1 py-2 rounded-md text-xs font-semibold bg-linear-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDropdown;
