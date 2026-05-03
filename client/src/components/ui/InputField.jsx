import clsx from "clsx";
import { useRef } from "react";
import { FaCalendar } from "react-icons/fa";
import { NumericFormat } from "react-number-format";

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  required = true,
  maxLength = 50,
  numeric = false,
  thousandSep = true,
  decimalScale = 0,
  allowNegative = false,
}) => {
  const inputRef = useRef(null);

  const boxClass = clsx(
    "flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-all",
    disabled
      ? "bg-gray-50 border-gray-200"
      : "bg-white border-gray-200 focus-within:border-gray-400",
  );

  const inputClass = clsx(
    "flex-1 min-w-0 text-xs max-sm:text-xxs bg-transparent placeholder-gray-400 focus:outline-none capitalize",
    disabled ? "text-gray-500" : "text-gray-800",
  );

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider truncate">
        {label} {required && <span className="text-red-400">*</span>}
      </span>

      {numeric ? (
        <div className={boxClass}>
          <NumericFormat
            thousandSeparator={thousandSep}
            decimalScale={decimalScale}
            allowNegative={allowNegative}
            value={value}
            onValueChange={(v) =>
              onChange({ target: { name, value: v.floatValue ?? "" } })
            }
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={inputClass}
          />
        </div>
      ) : type === "datetime-local" ? (
        <div
          className={clsx(
            "relative flex items-center border rounded-md px-4 py-3 max-sm:px-2 max-sm:py-1 transition-all",
            disabled
              ? "bg-gray-50 border-gray-200"
              : "bg-white border-gray-200 focus-within:border-gray-400",
          )}
        >
          <input
            ref={inputRef}
            type="datetime-local"
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={clsx(
              inputClass,
              "appearance-none [&::-webkit-calendar-picker-indicator]:hidden",
            )}
          />
          <FaCalendar
            onClick={() => !disabled && inputRef.current?.showPicker()}
            className={clsx(
              "absolute right-2.5 text-xs",
              disabled
                ? "text-gray-300 pointer-events-none"
                : "text-gray-400 cursor-pointer",
            )}
          />
        </div>
      ) : (
        <div className={boxClass}>
          <input
            type={type}
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            maxLength={maxLength}
            className={inputClass}
          />
        </div>
      )}
    </label>
  );
};

export default InputField;
