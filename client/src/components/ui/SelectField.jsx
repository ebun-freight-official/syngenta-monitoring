import clsx from "clsx";
import { MdKeyboardArrowDown } from "react-icons/md";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  required = true,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider truncate">
      {label} {required && !disabled && <span className="text-red-400">*</span>}
    </span>
    <div
      className={clsx(
        "relative flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-all",
        disabled
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-200 focus-within:border-gray-400",
      )}
    >
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={clsx(
          "w-full appearance-none bg-transparent text-xs max-sm:text-xxs focus:outline-none capitalize truncate",
          disabled ? "text-gray-500" : "text-gray-800",
        )}
      >
        {children}
      </select>
      {!disabled && (
        <MdKeyboardArrowDown className="absolute right-4 max-sm:right-3 text-gray-400 text-base pointer-events-none" />
      )}
    </div>
  </div>
);

export default SelectField;
