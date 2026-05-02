import React from "react";
import clsx from "clsx";

export const SelectFilter = ({
  label,
  name,
  value,
  onChange,
  colSpan,
  children,
}) => (
  <div
    className={clsx("flex flex-col gap-1.5", colSpan && `col-span-${colSpan}`)}
  >
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 focus-within:border-gray-400 focus-within:bg-white transition-all">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full focus:outline-none text-xs text-gray-700 bg-transparent capitalize"
      >
        {children}
      </select>
    </div>
  </div>
);

export const DateRangeFilter = ({
  label,
  fromName,
  toName,
  values,
  onChange,
}) => (
  <div className="col-span-2 flex flex-col gap-1.5">
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 focus-within:border-gray-400 focus-within:bg-white transition-all">
        <input
          type="date"
          name={fromName}
          value={values[fromName]}
          onChange={onChange}
          className="w-full focus:outline-none text-xs text-gray-700 bg-transparent"
        />
      </div>
      <span className="text-[10px] text-gray-400 font-medium shrink-0">to</span>
      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 focus-within:border-gray-400 focus-within:bg-white transition-all">
        <input
          type="date"
          name={toName}
          value={values[toName]}
          onChange={onChange}
          className="w-full focus:outline-none text-xs text-gray-700 bg-transparent"
        />
      </div>
    </div>
  </div>
);

export const DateFilter = ({
  label,
  name,
  value,
  onChange,
  colSpan,
  placeholder = "",
}) => (
  <div
    className={clsx("flex flex-col gap-1.5", colSpan && `col-span-${colSpan}`)}
  >
    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 focus-within:border-gray-400 focus-within:bg-white transition-all">
      <input
        type="date"
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full focus:outline-none text-xs text-gray-700 bg-transparent"
      />
    </div>
  </div>
);
